
import React from 'react';
import { Participant, Translations, Language } from '../types';
import ParticipantItem from './ParticipantItem';

interface ParticipantListProps {
  participants: Participant[];
  t: Translations;
  lang: Language;
}

const ParticipantList: React.FC<ParticipantListProps> = ({ participants, t, lang }) => {
  return (
    <div className="glass-panel p-6 rounded-2xl flex flex-col h-full min-h-0 shadow-xl overflow-hidden border-t border-slate-700/30">
      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2 shrink-0">
        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        {t.participants}
      </h3>
      <div className="space-y-3 overflow-y-auto flex-1 pr-2 custom-scrollbar min-h-0">
        {participants.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 italic text-center opacity-40">
            <p className="text-xs">{t.noParticipants}</p>
          </div>
        ) : (
          participants.map(p => (
            <ParticipantItem 
              key={p.id} 
              participant={p} 
              lang={lang}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default ParticipantList;
