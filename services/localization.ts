
import { Language, Translations } from '../types';

const TRANSLATIONS: Record<Language, Translations> = {
  en: {
    title: 'Meeting Coach Pro',
    subtitle: 'Behavioral and strategic analysis AI',
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
    coachTitle: 'Live Coach',
    secondaryIA: 'Secondary AI',
    waitingAnalysis: 'Waiting for analysis...',
    footerIA: 'AI: Gemini 2.5 Flash Native Audio',
    footerMode: 'Mode: Negotiation Coach',
    observationLabel: 'Observation:',
    you: 'User',
    youMention: 'you',
    interestPointsTitle: 'Meeting Interests',
    welcomeMessage: "Hello! I'm here and ready to help you succeed. Please give me a quick briefing of what you want to achieve in this meeting.",
    readyMessage: "OK, I've got the goals. I'm ready for the meeting. Let's do this together, you've got this!"
  },
  fr: {
    title: 'Meeting Coach Pro',
    subtitle: "IA d'analyse comportementale et stratégique",
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
    coachTitle: 'Coach en Direct',
    secondaryIA: 'IA Secondaire',
    waitingAnalysis: "En attente d'analyses...",
    footerIA: 'IA : Gemini 2.5 Flash Native Audio',
    footerMode: 'Mode : Coach de Négociation',
    observationLabel: 'Observation :',
    you: 'Utilisateur',
    youMention: 'vous',
    interestPointsTitle: 'Points d’intérêts',
    welcomeMessage: "Bonjour ! Je suis là et prêt à vous aider à réussir. Faites-moi un petit briefing de ce que vous voulez accomplir aujourd'hui.",
    readyMessage: "C'est noté, j'ai bien compris les objectifs. Je suis prêt pour la réunion. On y va ensemble, vous allez assurer !"
  },
  es: {
    title: 'Meeting Coach Pro',
    subtitle: 'IA de análisis conductual y estratégico',
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
    coachTitle: 'Coach en Vivo',
    secondaryIA: 'IA Secundaria',
    waitingAnalysis: 'Esperando análisis...',
    footerIA: 'IA: Gemini 2.5 Flash Native Audio',
    footerMode: 'Modo: Coach de Negociación',
    observationLabel: 'Observación:',
    you: 'Usuario',
    youMention: 'tú',
    interestPointsTitle: 'Puntos de Interés',
    welcomeMessage: "¡Hola! Estoy aquí y listo para ayudarte a triunfar. Por favor, dame un breve resumen de lo que quieres lograr en esta reunión.",
    readyMessage: "Entendido, ya tengo los objetivos. Estoy listo para la reunión. ¡Vamos juntos, tú puedes!"
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
