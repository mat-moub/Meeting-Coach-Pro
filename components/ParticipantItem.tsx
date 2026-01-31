
import React from 'react';
import { Participant, Language } from '../types';
import { LocalizationService } from '../services/localization';

interface ParticipantItemProps {
  participant: Participant;
  observationLabel: string;
  lang: Language;
}

const ParticipantItem: React.FC<ParticipantItemProps> = ({ participant, observationLabel, lang }) => {
  const t = LocalizationService.getTranslations(lang);

  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl border transition-all duration-300 ${
      participant.status === 'speaking' 
        ? 'bg-blue-500/10 border-blue-500/50 shadow-inner' 
        : 'bg-slate-800/40 border-slate-700'
    }`}>
      <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold shadow-lg ${
        participant.isUser ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'
      }`}>
        {participant.name[0]?.toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <p className={`text-sm font-bold truncate ${participant.isUser ? 'text-blue-400' : 'text-slate-200'}`}>
            {participant.name} {participant.isUser ? `(${t.youMention})` : ''}
          </p>
          {participant.status === 'speaking' && (
            <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          )}
        </div>
        {participant.lastEmotion && (
          <div className="mt-1 p-2 bg-slate-900/50 rounded border border-slate-700/50">
            <p className="text-[10px] text-slate-500 font-bold uppercase mb-0.5">{observationLabel}</p>
            <p className="text-[11px] text-slate-300 italic leading-relaxed whitespace-pre-wrap break-words">
              {participant.lastEmotion}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ParticipantItem;
