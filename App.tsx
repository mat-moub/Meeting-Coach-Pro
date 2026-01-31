
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration, Schema } from '@google/genai';
import { CoachAdvice, Participant, ConnectionStatus, Language, InterestPoint, ConversationTurn } from './types';
import { createBlob, decodeAudioData, decode } from './services/audio-utils';
import { LocalizationService } from './services/localization';
import { PromptService } from './services/prompts';
import { ParticipantService } from './services/participant-service';
import CoachChat from './components/CoachChat';
import VoiceVisualizer from './components/VoiceVisualizer';
import ParticipantList from './components/ParticipantList';
import InterestPoints from './components/InterestPoints';

// --- TOOL DEFINITIONS ---

// Tool 1: Fast Perception (Live API) - Identifies who is speaking
const IDENTIFY_SPEAKER_TOOL: FunctionDeclaration = {
  name: 'identify_speaker_activity',
  parameters: {
    type: Type.OBJECT,
    description: 'Log who is currently speaking. TRIGGER THIS IMMEDIATELY WHENEVER THE VOICE OR SPEAKER CHANGES.',
    properties: {
      speakerName: {
        type: Type.STRING,
        description: 'Name or role (e.g., User, Interlocutor 1, Interlocutor 2). Use distinct labels for different voices.'
      },
      emotion: {
        type: Type.STRING,
        description: 'Detected emotional tone.'
      }
    },
    required: ['speakerName', 'emotion'],
  },
};

// Tool 2: Fast Perception (Live API) - Updates goals
const INTEREST_POINTS_TOOL: FunctionDeclaration = {
  name: 'update_meeting_interest_points',
  parameters: {
    type: Type.OBJECT,
    description: 'Update the persistent list of meeting goals or interest points.',
    properties: {
      points: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: 'List of key points or goals extracted from the conversation.'
      }
    },
    required: ['points'],
  },
};

// --- SCHEMA FOR COACH ENDPOINT (Endpoint 2) ---
const COACH_RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    category: { type: Type.STRING, enum: ['negotiation', 'tone', 'argument', 'emotion'] },
    observation: { type: Type.STRING },
    suggestion: { type: Type.STRING },
    speaker: { type: Type.STRING }
  },
  required: ['category', 'observation', 'suggestion', 'speaker']
};

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>('en');
  const [status, setStatus] = useState<ConnectionStatus>(ConnectionStatus.DISCONNECTED);
  
  // App State
  const [advices, setAdvices] = useState<CoachAdvice[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [interestPoints, setInterestPoints] = useState<InterestPoint[]>([]);
  const [lastTranscript, setLastTranscript] = useState<string>('');
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  
  // Buffers for Logic
  const conversationHistory = useRef<ConversationTurn[]>([]);
  const currentTurnBuffer = useRef<string>('');
  const lastCoachCallTime = useRef<number>(0);
  
  // Refs for Cleanup
  const audioContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const startTimeRef = useRef<number>(0);
  const coachAiClient = useRef<GoogleGenAI | null>(null);

  const t = LocalizationService.getTranslations(lang);

  // --- LOGIC: COACH REASONING ENGINE (ENDPOINT 2) ---
  const triggerCoachAnalysis = async () => {
    // Throttling: Don't call coach too often (e.g. min 5 seconds between thoughts)
    const now = Date.now();
    if (now - lastCoachCallTime.current < 5000) return;
    if (conversationHistory.current.length === 0) return;

    // Grab recent context (last 5 turns)
    const recentContext = conversationHistory.current.slice(-5);
    const contextString = recentContext.map(t => `${t.speaker}: ${t.text}`).join('\n');

    setIsThinking(true);
    lastCoachCallTime.current = now;

    try {
      if (!coachAiClient.current) {
        coachAiClient.current = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      }

      // Use a model capable of 'Thinking' if available, otherwise standard flash
      // Note: gemini-3-flash-preview supports thinkingConfig
      const response = await coachAiClient.current.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
          { role: 'user', parts: [{ text: contextString }] }
        ],
        config: {
          systemInstruction: PromptService.getCoachSystemInstruction(lang),
          responseMimeType: 'application/json',
          responseSchema: COACH_RESPONSE_SCHEMA,
          // Deep reasoning config
          thinkingConfig: { thinkingBudget: 1024 } 
        }
      });

      const jsonText = response.text;
      if (jsonText) {
        const adviceData = JSON.parse(jsonText);
        
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        const timestamp = `${Math.floor(elapsed / 60).toString().padStart(2, '0')}:${(elapsed % 60).toString().padStart(2, '0')}`;
        
        setAdvices(prev => [...prev, {
          id: Math.random().toString(36).substr(2, 9),
          timestamp,
          category: adviceData.category,
          observation: adviceData.observation,
          suggestion: adviceData.suggestion,
          speaker: 'Coach'
        }]);
      }
    } catch (e) {
      console.error("Coach analysis failed:", e);
    } finally {
      setIsThinking(false);
    }
  };

  // --- LOGIC: MEETING CONTROL ---

  const stopMeeting = useCallback(() => {
    if (status === ConnectionStatus.DISCONNECTED) return;
    
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(console.error);
    }
    audioContextRef.current = null;

    setStatus(ConnectionStatus.DISCONNECTED);
    setAnalyser(null);
    setLastTranscript('');
    conversationHistory.current = [];
    currentTurnBuffer.current = '';
  }, [status]);

  const startMeeting = async () => {
    try {
      if (status !== ConnectionStatus.DISCONNECTED) return;

      setStatus(ConnectionStatus.CONNECTING);
      setAdvices([]);
      setInterestPoints([]);
      setParticipants([]);
      conversationHistory.current = [];
      
      const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = inputAudioContext;
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = inputAudioContext.createMediaStreamSource(stream);
      const newAnalyser = inputAudioContext.createAnalyser();
      newAnalyser.fftSize = 256;
      source.connect(newAnalyser);
      setAnalyser(newAnalyser);

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      startTimeRef.current = Date.now();

      // Initial system message
      setAdvices([{
        id: 'init',
        timestamp: '00:00',
        category: 'negotiation',
        observation: 'System',
        suggestion: t.welcomeMessage,
        speaker: 'System'
      }]);

      // --- ENDPOINT 1: FAST PERCEPTION (LIVE API) ---
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: [Modality.AUDIO], // Must be AUDIO to support tools properly in this model
          systemInstruction: PromptService.getLiveSystemInstruction(lang),
          tools: [{ functionDeclarations: [IDENTIFY_SPEAKER_TOOL, INTEREST_POINTS_TOOL] }],
          inputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            setStatus(ConnectionStatus.CONNECTED);
            const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData, inputAudioContext.sampleRate);
              sessionPromise.then(session => {
                if (session) session.sendRealtimeInput({ media: pcmBlob });
              }).catch(() => {});
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContext.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            // 1. Handle Transcription
            if (msg.serverContent?.inputTranscription) {
              const text = msg.serverContent.inputTranscription.text;
              if (text) {
                setLastTranscript(text);
                currentTurnBuffer.current += text;
              }
            }

            // 2. Handle Turn Completion -> Push to History -> Trigger Coach
            if (msg.serverContent?.turnComplete) {
              if (currentTurnBuffer.current.trim().length > 5) {
                conversationHistory.current.push({
                  speaker: 'Unknown', // Will be updated by tool or assumed
                  text: currentTurnBuffer.current,
                  timestamp: Date.now()
                });
                
                // TRIGGER ENDPOINT 2 (Coach)
                triggerCoachAnalysis();
                
                currentTurnBuffer.current = '';
              }
            }

            // 3. Handle Tools (Fast Perception Results)
            if (msg.toolCall) {
              for (const fc of msg.toolCall.functionCalls) {
                if (fc.name === 'identify_speaker_activity') {
                  const args = fc.args as any;
                  const speakerName = args.speakerName;
                  
                  // Update UI Participants
                  setParticipants(prev => ParticipantService.getUpdatedParticipants(
                    prev, speakerName, 'emotion', args.emotion, lang
                  ));
                  
                  // Retrospectively label the last turn in history if it was "Unknown"
                  if (conversationHistory.current.length > 0) {
                    const lastIdx = conversationHistory.current.length - 1;
                    if (conversationHistory.current[lastIdx].speaker === 'Unknown') {
                      conversationHistory.current[lastIdx].speaker = speakerName;
                    }
                  }

                  sessionPromise.then(session => {
                    session.sendToolResponse({
                      functionResponses: {
                        id: fc.id,
                        name: fc.name,
                        response: { status: "logged" }
                      }
                    });
                  });

                } else if (fc.name === 'update_meeting_interest_points') {
                  const args = fc.args as any;
                  const newPoints: InterestPoint[] = args.points.map((p: string) => ({
                    id: Math.random().toString(36).substr(2, 9),
                    text: p,
                    type: 'goal'
                  }));
                  setInterestPoints(newPoints);
                  
                  sessionPromise.then(session => {
                    session.sendToolResponse({
                      functionResponses: {
                        id: fc.id,
                        name: fc.name,
                        response: { updated: true }
                      }
                    });
                  });
                }
              }
            }
          },
          onclose: () => stopMeeting(),
          onerror: (err) => {
            console.error('Session Error:', err);
            setStatus(ConnectionStatus.ERROR);
          }
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error('Connection error:', err);
      setStatus(ConnectionStatus.ERROR);
    }
  };

  return (
    // UPDATED: Removed fixed h-screen on mobile, enabled scroll. Added md:h-screen md:overflow-hidden for desktop dashboard feel.
    <div className="min-h-screen p-4 md:p-8 flex flex-col gap-6 max-w-7xl mx-auto md:h-screen md:overflow-hidden">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div className="flex flex-col gap-1 w-full md:w-auto">
          <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-teal-400 to-emerald-400 drop-shadow-sm">
            {t.title}
          </h1>
          <p className="text-slate-400 text-sm font-medium">{t.subtitle}</p>
        </div>

        {/* UPDATED: Controls container to align items on one line on mobile with reduced gaps */}
        <div className="flex items-center gap-2 md:gap-4 w-full md:w-auto justify-between md:justify-end">
          <div className="flex bg-slate-800/80 p-1 rounded-xl border border-slate-700 shadow-lg">
            {LocalizationService.getSupportedLanguages().map((l) => (
              <button
                key={l}
                disabled={status === ConnectionStatus.CONNECTED}
                onClick={() => setLang(l)}
                className={`px-3 py-1.5 md:px-4 md:py-1.5 rounded-lg text-[10px] md:text-xs font-bold uppercase transition-all duration-200 ${
                  lang === l ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
                } ${status === ConnectionStatus.CONNECTED ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {l}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-2 md:px-4 rounded-full glass-panel border border-slate-700 shadow-lg">
              <div className={`w-2 h-2 md:w-2.5 md:h-2.5 rounded-full ${
                status === ConnectionStatus.CONNECTED ? 'bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 
                status === ConnectionStatus.CONNECTING ? 'bg-amber-500 animate-spin' : 'bg-red-500'
              }`} />
              {/* Optional: compact status text on mobile or full text on desktop */}
              <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-slate-200 whitespace-nowrap">
                <span className="md:hidden">
                  {status === ConnectionStatus.CONNECTED ? 'ON' : status === ConnectionStatus.CONNECTING ? '...' : 'OFF'}
                </span>
                <span className="hidden md:inline">
                  {status === ConnectionStatus.CONNECTED ? t.statusActive : 
                   status === ConnectionStatus.CONNECTING ? t.statusConnecting : t.statusOffline}
                </span>
              </span>
            </div>
            
            {status !== ConnectionStatus.CONNECTED ? (
              // UPDATED: Start button is icon-only on mobile (text hidden), padding reduced
              <button onClick={startMeeting} className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 md:px-8 md:py-3 text-sm md:text-base rounded-xl font-bold transition-all shadow-xl hover:shadow-blue-500/20 active:scale-95 flex items-center gap-2 group">
                <svg className="w-5 h-5 group-hover:animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                <span className="hidden md:inline">{t.startSession}</span>
              </button>
            ) : (
              // UPDATED: Stop button consistent with Start button
              <button onClick={stopMeeting} className="bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/50 px-3 py-2 md:px-8 md:py-3 text-sm md:text-base rounded-xl font-bold transition-all duration-200 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="hidden md:inline">{t.stopSession}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* UPDATED: Main grid uses default flow on mobile (no min-h-0 restriction) and rigid structure on desktop */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 md:min-h-0 md:overflow-hidden">
        {/* Left Column */}
        <div className="lg:col-span-4 flex flex-col gap-4 md:min-h-0">
          {/* UPDATED: Interest Points - fixed height on mobile, flex on desktop */}
          <div className="h-64 md:h-auto md:flex-[3] md:min-h-0 flex flex-col">
            <InterestPoints points={interestPoints} title={t.interestPointsTitle} />
          </div>
          
          {/* UPDATED: Participants - fixed height on mobile, flex on desktop */}
          <div className="h-64 md:h-auto md:flex-[2] md:min-h-0 flex flex-col">
            <ParticipantList participants={participants} t={t} lang={lang} />
          </div>

          <div className="glass-panel p-4 rounded-2xl shadow-xl flex flex-col gap-2 shrink-0 h-40">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-slate-500"></span>
              {t.audioFlux}
            </h3>
            <div className="bg-slate-950/60 rounded-lg h-12 flex items-center px-2 border border-slate-800/50 shadow-inner">
              <VoiceVisualizer analyser={analyser} isActive={status === ConnectionStatus.CONNECTED} />
            </div>
            <div className="flex-1 min-h-0 p-2 bg-blue-900/5 rounded-lg border border-blue-500/10 overflow-hidden">
              <p className="text-[9px] text-blue-400 font-bold uppercase mb-1 flex items-center gap-1 opacity-70">
                {t.lastHeard}
              </p>
              <p className="text-[11px] text-slate-400 italic leading-snug line-clamp-2">
                {lastTranscript || (status === ConnectionStatus.CONNECTED ? t.waitingSpeech : t.micMuted)}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column (Coach) */}
        <div className="lg:col-span-8 flex flex-col md:min-h-0">
          {/* UPDATED: Coach Chat has fixed height on mobile to ensure visibility and internal scroll if needed */}
          <div className="h-96 md:h-full">
            <CoachChat advices={advices} t={t} isThinking={isThinking} />
          </div>
        </div>
      </main>

      <footer className="text-center py-4 border-t border-slate-800/50 shrink-0 flex flex-wrap justify-center gap-4 md:gap-12 opacity-60">
        <span className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-medium">{t.footerIA}</span>
        <span className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-medium">{t.footerMode}</span>
      </footer>
    </div>
  );
};

export default App;
