
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration } from '@google/genai';
import { CoachAdvice, Participant, ConnectionStatus, Language, InterestPoint } from './types';
import { createBlob, decodeAudioData, decode } from './services/audio-utils';
import { LocalizationService } from './services/localization';
import { PromptService } from './services/prompts';
import { ParticipantService } from './services/participant-service';
import CoachChat from './components/CoachChat';
import VoiceVisualizer from './components/VoiceVisualizer';
import ParticipantList from './components/ParticipantList';
import InterestPoints from './components/InterestPoints';

const ADVICE_TOOL_DECLARATION: FunctionDeclaration = {
  name: 'provide_coach_advice',
  parameters: {
    type: Type.OBJECT,
    description: 'Provide real-time advice or encouragement to the user.',
    properties: {
      category: {
        type: Type.STRING,
        description: 'Type of advice.',
        enum: ['negotiation', 'tone', 'argument', 'emotion']
      },
      observation: {
        type: Type.STRING,
        description: 'Vocal or conversational observation.'
      },
      suggestion: {
        type: Type.STRING,
        description: 'Actionable suggestion or confidence-boosting words for the user.'
      },
      speaker: {
        type: Type.STRING,
        description: 'The person identified as speaking.'
      }
    },
    required: ['category', 'observation', 'suggestion', 'speaker'],
  },
};

const INTEREST_POINTS_TOOL_DECLARATION: FunctionDeclaration = {
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

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>('en');
  const [status, setStatus] = useState<ConnectionStatus>(ConnectionStatus.DISCONNECTED);
  const [advices, setAdvices] = useState<CoachAdvice[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [interestPoints, setInterestPoints] = useState<InterestPoint[]>([]);
  const [lastTranscript, setLastTranscript] = useState<string>('');
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const startTimeRef = useRef<number>(0);

  const t = LocalizationService.getTranslations(lang);

  const addCoachMessage = (text: string) => {
    const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
    const timestamp = `${Math.floor(elapsed / 60).toString().padStart(2, '0')}:${(elapsed % 60).toString().padStart(2, '0')}`;
    setAdvices(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      timestamp,
      category: 'negotiation',
      observation: 'System',
      suggestion: text,
      speaker: 'Coach'
    }]);
  };

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
  }, [status]);

  const startMeeting = async () => {
    try {
      if (status !== ConnectionStatus.DISCONNECTED) return;

      setStatus(ConnectionStatus.CONNECTING);
      setAdvices([]);
      setInterestPoints([]);
      // Start with empty participants list. First speaker will be identified as User.
      setParticipants([]);
      
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

      addCoachMessage(t.welcomeMessage);

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: PromptService.getSystemInstruction(lang),
          tools: [{ functionDeclarations: [ADVICE_TOOL_DECLARATION, INTEREST_POINTS_TOOL_DECLARATION] }],
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
            if (msg.serverContent?.inputTranscription) {
              setLastTranscript(msg.serverContent.inputTranscription.text);
            }

            if (msg.toolCall) {
              for (const fc of msg.toolCall.functionCalls) {
                if (fc.name === 'provide_coach_advice') {
                  const args = fc.args as any;
                  const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
                  const timestamp = `${Math.floor(elapsed / 60).toString().padStart(2, '0')}:${(elapsed % 60).toString().padStart(2, '0')}`;
                  
                  setAdvices(prev => [...prev, {
                    id: Math.random().toString(36).substr(2, 9),
                    timestamp,
                    category: args.category,
                    observation: args.observation,
                    suggestion: args.suggestion,
                    speaker: args.speaker || "Unknown"
                  }]);

                  setParticipants(prev => ParticipantService.getUpdatedParticipants(
                    prev, args.speaker || "Unknown", args.category, args.observation, lang
                  ));

                  sessionPromise.then(session => {
                    session.sendToolResponse({
                      functionResponses: {
                        id: fc.id,
                        name: fc.name,
                        response: { acknowledged: true }
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
    <div className="min-h-screen p-4 md:p-8 flex flex-col gap-6 max-w-7xl mx-auto h-screen overflow-hidden">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-teal-400 to-emerald-400 drop-shadow-sm">
            {t.title}
          </h1>
          <p className="text-slate-400 text-sm font-medium">{t.subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex bg-slate-800/80 p-1 rounded-xl border border-slate-700 shadow-lg">
            {LocalizationService.getSupportedLanguages().map((l) => (
              <button
                key={l}
                disabled={status === ConnectionStatus.CONNECTED}
                onClick={() => setLang(l)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase transition-all duration-200 ${
                  lang === l ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
                } ${status === ConnectionStatus.CONNECTED ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {l}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 px-4 py-2 rounded-full glass-panel border border-slate-700 shadow-lg">
            <div className={`w-2.5 h-2.5 rounded-full ${
              status === ConnectionStatus.CONNECTED ? 'bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 
              status === ConnectionStatus.CONNECTING ? 'bg-amber-500 animate-spin' : 'bg-red-500'
            }`} />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
              {status === ConnectionStatus.CONNECTED ? t.statusActive : 
               status === ConnectionStatus.CONNECTING ? t.statusConnecting : t.statusOffline}
            </span>
          </div>
          
          {status !== ConnectionStatus.CONNECTED ? (
            <button onClick={startMeeting} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-xl hover:shadow-blue-500/20 active:scale-95 flex items-center gap-2 group">
              <svg className="w-5 h-5 group-hover:animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
              {t.startSession}
            </button>
          ) : (
            <button onClick={stopMeeting} className="bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/50 px-8 py-3 rounded-xl font-bold transition-all duration-200">
              {t.stopSession}
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0 overflow-hidden">
        <div className="lg:col-span-4 flex flex-col gap-4 min-h-0">
          <div className="flex-[3] min-h-0 flex flex-col">
            <InterestPoints points={interestPoints} title={t.interestPointsTitle} />
          </div>
          
          <div className="flex-[2] min-h-0 flex flex-col">
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

        <div className="lg:col-span-8 flex flex-col min-h-0">
          <CoachChat advices={advices} t={t} />
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
