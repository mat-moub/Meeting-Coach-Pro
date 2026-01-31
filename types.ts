
export type Language = 'en' | 'fr' | 'es';

export interface CoachAdvice {
  id: string;
  timestamp: string;
  category: 'negotiation' | 'tone' | 'argument' | 'emotion';
  observation: string;
  suggestion: string;
  speaker: string;
}

export interface InterestPoint {
  id: string;
  text: string;
  type: 'goal' | 'context' | 'tactic';
}

export interface Participant {
  id: string;
  name: string;
  isUser: boolean;
  status: 'speaking' | 'idle';
  lastTone?: string;
  lastEmotion?: string;
}

export interface ConversationTurn {
  speaker: string;
  text: string;
  timestamp: number;
}

export enum ConnectionStatus {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  ERROR = 'ERROR'
}

export interface Translations {
  title: string;
  subtitle: string;
  startSession: string;
  stopSession: string;
  statusActive: string;
  statusOffline: string;
  statusConnecting: string;
  audioFlux: string;
  lastHeard: string;
  waitingSpeech: string;
  micMuted: string;
  participants: string;
  noParticipants: string;
  coachTitle: string;
  secondaryIA: string;
  waitingAnalysis: string;
  footerIA: string;
  footerMode: string;
  observationLabel: string;
  you: string;
  youMention: string;
  interestPointsTitle: string;
  welcomeMessage: string;
  readyMessage: string;
  thinking: string;
  briefingEndMessage: string;
  briefingMode: string;
  briefingInstruction: string;
  startInterviewBtn: string;
}
