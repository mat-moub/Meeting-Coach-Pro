
import React from 'react';
import { InterestPoint } from '../types';

interface InterestPointsProps {
  points: InterestPoint[];
  title: string;
}

const InterestPoints: React.FC<InterestPointsProps> = ({ points, title }) => {
  return (
    <div className="glass-panel p-6 rounded-2xl shadow-xl border-l-4 border-l-blue-500 flex flex-col h-full min-h-0">
      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2 shrink-0">
        <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
        {title}
      </h3>
      <div className="space-y-3 overflow-y-auto flex-1 pr-1 custom-scrollbar min-h-0">
        {points.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 italic text-center text-[11px] opacity-40">
            <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>Ready to capture your goals...</p>
          </div>
        ) : (
          points.map(point => (
            <div key={point.id} className="flex items-start gap-3 group animate-in fade-in slide-in-from-left-4 duration-500">
              <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 shadow-[0_0_5px_rgba(59,130,246,0.5)] group-hover:scale-125 transition-transform" />
              <p className="text-sm text-slate-200 font-medium leading-relaxed group-hover:text-white transition-colors">
                {point.text}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default InterestPoints;
