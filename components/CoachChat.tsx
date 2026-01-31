
import React from 'react';
import { CoachAdvice, Translations } from '../types';

interface CoachChatProps {
  advices: CoachAdvice[];
  t: Translations;
  isThinking: boolean;
}

const CoachChat: React.FC<CoachChatProps> = ({ advices, t, isThinking }) => {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [advices, isThinking]);

  return (
    <div className="flex flex-col h-full glass-panel rounded-xl overflow-hidden shadow-2xl">
      <div className="p-4 border-b border-slate-700 bg-slate-800/50 flex justify-between items-center">
        <h2 className="text-lg font-bold text-teal-400 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
          {t.coachTitle}
        </h2>
        <span className="text-xs text-slate-400 bg-slate-700 px-2 py-1 rounded uppercase tracking-widest">{t.secondaryIA}</span>
      </div>
      
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
        {advices.length === 0 && !isThinking ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-2">
            <svg className="w-12 h-12 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <p className="text-sm">{t.waitingAnalysis}</p>
          </div>
        ) : (
          <>
            {advices.map((advice) => (
              <div key={advice.id} className="group relative animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="absolute -left-2 top-0 bottom-0 w-1 bg-teal-500/30 rounded-full group-hover:bg-teal-500 transition-colors"></div>
                <div className="pl-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[11px] font-mono text-slate-400 bg-slate-900 px-2 py-1 rounded">
                      {advice.timestamp}
                    </span>
                    <span className={`text-[11px] uppercase font-bold px-2 py-1 rounded tracking-wide ${
                      advice.category === 'negotiation' ? 'bg-amber-900/40 text-amber-400' :
                      advice.category === 'emotion' ? 'bg-purple-900/40 text-purple-400' :
                      'bg-blue-900/40 text-blue-400'
                    }`}>
                      {advice.category}
                    </span>
                  </div>
                  {/* Observation hidden as per user request */}
                  {/* <p className="text-sm text-slate-300 font-medium mb-1">{advice.observation}</p> */}
                  <div className="p-4 bg-teal-500/5 rounded-xl border border-teal-500/20 shadow-sm hover:shadow-md transition-shadow">
                    <p className="text-lg md:text-xl text-teal-200 font-semibold leading-snug tracking-tight">
                      {advice.suggestion}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Thinking Indicator */}
            {isThinking && (
              <div className="flex items-center gap-3 p-4 bg-slate-800/30 rounded-lg animate-pulse">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce"></span>
                </div>
                <span className="text-xs font-bold text-teal-500 uppercase tracking-widest">{t.thinking}</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CoachChat;
