
import { Language, Translations } from '../types';

const TRANSLATIONS: Record<Language, Translations> = {
  en: {
    title: 'Meeting Coach Pro',
    subtitle: 'Dual-Core AI: Fast Perception + Deep Reasoning',
    startSession: 'Start Session',
    stopSession: 'Stop Coach',
    statusActive: 'Live Coaching',
    statusOffline: 'Offline',
    statusConnecting: 'Connecting...',
    audioFlux: 'Flux & Transcription',
    lastHeard: 'Last heard:',
    waitingSpeech: 'Waiting for speech...',
    micMuted: 'Microphone muted',
    participants: 'Interlocutors',
    noParticipants: 'No voices identified yet...',
    coachTitle: 'Strategic Coach',
    secondaryIA: 'Reasoning Engine',
    waitingAnalysis: 'Waiting for analysis...',
    footerIA: 'Live: Gemini 2.5 (Audio) + Coach: Gemini 3 Flash (Thinking)',
    footerMode: 'Mode: Negotiation Coach',
    observationLabel: 'Observation:',
    you: 'You',
    youMention: 'you',
    interestPointsTitle: 'Meeting Interests',
    welcomeMessage: "System ready. Phase 1: Audio Perception Active. Phase 2: Strategic Reasoning Active.",
    readyMessage: "Game plan updated.",
    thinking: "Analyzing strategy...",
    briefingEndMessage: "Briefing complete. Transitioning to active coaching.",
    briefingMode: "Briefing Phase",
    briefingInstruction: "Describe your goals and context to the AI before the meeting starts.",
    startInterviewBtn: "Start Meeting"
  },
  fr: {
    title: 'Meeting Coach Pro',
    subtitle: 'IA Double Coeur : Perception Rapide + Raisonnement',
    startSession: 'Démarrer la Session',
    stopSession: 'Arrêter le Coach',
    statusActive: 'Coaching en Direct',
    statusOffline: 'Hors-ligne',
    statusConnecting: 'Connexion...',
    audioFlux: 'Flux & Transcription',
    lastHeard: 'Dernier entendu :',
    waitingSpeech: "En attente de parole...",
    micMuted: 'Microphone coupé',
    participants: 'Interlocuteurs',
    noParticipants: 'Aucune voix identifiée...',
    coachTitle: 'Coach Stratégique',
    secondaryIA: 'Moteur de Raisonnement',
    waitingAnalysis: "En attente d'analyses...",
    footerIA: 'Live: Gemini 2.5 (Audio) + Coach: Gemini 3 Flash (Pensée)',
    footerMode: 'Mode : Coach de Négociation',
    observationLabel: 'Observation :',
    you: 'Vous',
    youMention: 'vous',
    interestPointsTitle: 'Points d’intérêts',
    welcomeMessage: "Système prêt. Phase 1 : Perception Audio Active. Phase 2 : Raisonnement Stratégique Actif.",
    readyMessage: "Plan de match mis à jour.",
    thinking: "Analyse stratégique en cours...",
    briefingEndMessage: "Briefing terminé. Passage au coaching actif.",
    briefingMode: "Phase de Briefing",
    briefingInstruction: "Décrivez vos objectifs et le contexte à l'IA avant que la réunion ne commence.",
    startInterviewBtn: "Lancer la réunion"
  },
  es: {
    title: 'Meeting Coach Pro',
    subtitle: 'IA de Doble Núcleo: Percepción Rápida + Razonamiento',
    startSession: 'Iniciar Sesión',
    stopSession: 'Detener Coach',
    statusActive: 'Coaching en Vivo',
    statusOffline: 'Fuera de línea',
    statusConnecting: 'Conectando...',
    audioFlux: 'Flujo y Transcripción',
    lastHeard: 'Último escuchado:',
    waitingSpeech: 'Esperando voz...',
    micMuted: 'Micrófono silenciado',
    participants: 'Interlocutores',
    noParticipants: 'No hay voces identificadas...',
    coachTitle: 'Coach Estratégico',
    secondaryIA: 'Motor de Razonamiento',
    waitingAnalysis: 'Esperando análisis...',
    footerIA: 'Live: Gemini 2.5 (Audio) + Coach: Gemini 3 Flash (Thinking)',
    footerMode: 'Modo: Coach de Negociación',
    observationLabel: 'Observación:',
    you: 'Tú',
    youMention: 'tú',
    interestPointsTitle: 'Puntos de Interés',
    welcomeMessage: "Sistema listo. Fase 1: Percepción de Audio Activa. Fase 2: Razonamiento Estratégico Activo.",
    readyMessage: "Plan de juego actualizado.",
    thinking: "Analizando estrategia...",
    briefingEndMessage: "Briefing completado. Pasando a coaching activo.",
    briefingMode: "Fase de Briefing",
    briefingInstruction: "Describa sus objetivos y el contexto a la IA antes de que comience la reunión.",
    startInterviewBtn: "Comenzar reunión"
  }
};

export class LocalizationService {
  static getTranslations(lang: Language): Translations {
    return TRANSLATIONS[lang];
  }

  static getSupportedLanguages(): Language[] {
    return ['en', 'fr', 'es'];
  }
}
