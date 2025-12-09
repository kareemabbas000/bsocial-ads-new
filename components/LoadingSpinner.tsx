
import React from 'react';
import { Theme } from '../types';

interface LoadingSpinnerProps {
  theme: Theme;
  message?: string;
  variant?: 'fullscreen' | 'small';
  bgClass?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ theme, message = "Loading Data", variant = 'fullscreen', bgClass }) => {
  const isDark = theme === 'dark';

  if (variant === 'small') {
    return (
      <div className="flex items-center justify-center space-x-2">
        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        {message && <span className="text-sm">{message}</span>}
      </div>
    );
  }

  const background = bgClass || (isDark ? 'bg-slate-950' : 'bg-slate-50');

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center relative w-full overflow-hidden ${background}`}>
      <div className={`absolute w-[500px] h-[500px] rounded-full blur-[100px] animate-pulse ${isDark ? 'bg-brand-900/10' : 'bg-brand-100/40'}`} />
      <div className="relative z-10 flex flex-col items-center">
        <div className="relative w-24 h-24 mb-8">
          <div className={`absolute inset-0 rounded-full border-2 ${isDark ? 'border-slate-800/30' : 'border-slate-200'}`} />
          <div className="absolute inset-0 rounded-full border-t-2 border-r-2 border-brand-500 border-transparent animate-[spin_2s_linear_infinite]" />
          <div className="absolute inset-3 rounded-full border-b-2 border-l-2 border-purple-500 border-transparent animate-[spin_1.5s_linear_infinite_reverse]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-brand-500 rounded-full animate-ping" />
          </div>
        </div>
        <div className="flex flex-col items-center space-y-2">
          <h3 className={`text-sm font-bold tracking-[0.2em] uppercase bg-gradient-to-r from-brand-500 to-purple-500 bg-clip-text text-transparent animate-pulse`}>
            {message}
          </h3>
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner;
