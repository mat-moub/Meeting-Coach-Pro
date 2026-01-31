
import React from 'react';
import { Participant, Language } from '../types';
import { LocalizationService } from '../services/localization';

interface ParticipantItemProps {
  participant: Participant;
  lang: Language;
}

const getEmotionEmoji = (text: string): string => {
  const t = text.toLowerCase();
  if (t.includes('happy') || t.includes('joy') || t.includes('positiv') || t.includes('heureux') || t.includes('bien') || t.includes('feliz') || t.includes('content') || t.includes('enthusias')) return '😊';
  if (t.includes('angry') || t.includes('mad') || t.includes('fâché') || t.includes('colère') || t.includes('enojado') || t.includes('molesto') || t.includes('aggressive')) return '😠';
  if (t.includes('sad') || t.includes('triste') || t.includes('upset') || t.includes('déçu') || t.includes('disappointed')) return '😢';
  if (t.includes('anxious') || t.includes('nervous') || t.includes('worry') || t.includes('inquiet') || t.includes('nerveux') || t.includes('nervioso') || t.includes('stress')) return '😰';
  if (t.includes('excit') || t.includes('emocionado')) return '🤩';
  if (t.includes('confus') || t.includes('lost') || t.includes('perdu')) return '😕';
  if (t.includes('sceptic') || t.includes('doubt') || t.includes('doute')) return '🤨';
  if (t.includes('confiden') || t.includes('assur') || t.includes('sûr') || t.includes('seguro')) return '😎';
  if (t.includes('serious') || t.includes('sérieux') || t.includes('serio') || t.includes('neutral') || t.includes('calm')) return '😐';
  return '😐'; 
};

const ParticipantItem: React.FC<ParticipantItemProps> = ({ participant, lang }) => {
  const t = LocalizationService.getTranslations(lang);
  
  // Only show the mention (e.g. "(vous)") if the name is NOT already "Vous" / "You"
  const showMention = participant.isUser && participant.name !== t.you;
  const emoji = participant.lastEmotion ? getEmotionEmoji(participant.lastEmotion) : null;

  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-300 ${
      participant.status === 'speaking' 
        ? 'bg-blue-500/10 border-blue-500/50 shadow-inner' 
        : 'bg-slate-800/40 border-slate-700'
    }`}>
      <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold shadow-lg ${
        participant.isUser ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'
      }`}>
        {participant.name[0]?.toUpperCase()}
      </div>
      
      <div className="flex-1 min-w-0 flex items-center justify-between">
        <div className="flex flex-col min-w-0">
          <p className={`text-sm font-bold truncate ${participant.isUser ? 'text-blue-400' : 'text-slate-200'}`}>
            {participant.name} {showMention ? `(${t.youMention})` : ''}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {emoji && (
            <span className="text-xl leading-none filter drop-shadow-md cursor-help transition-transform hover:scale-110" title={participant.lastEmotion}>
              {emoji}
            </span>
          )}
          {participant.status === 'speaking' && (
            <span className="flex h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
          )}
        </div>
      </div>
    </div>
  );
};

export default ParticipantItem;
