import React from 'react';
import { Sparkles, Download, ArrowRight, RotateCcw } from 'lucide-react';

interface ReportActionDeckProps {
    status: 'idle' | 'generating' | 'ready';
    progress: number;
    onGenerate: () => void;
    onDownload: () => void;
    onReset: () => void;
    isDark: boolean;
    mobileMode?: boolean;
}

export const ReportActionDeck: React.FC<ReportActionDeckProps> = ({
    status,
    progress,
    onGenerate,
    onDownload,
    onReset,
    isDark,
    mobileMode = false
}) => {
    return (
        <div className={`w-full transition-all duration-500 ${mobileMode ? 'animate-fade-in-up' : ''}`}>

            {/* IDLE STATE: Generate Button */}
            {status === 'idle' && (
                <button
                    onClick={onGenerate}
                    className={`group relative w-full overflow-hidden rounded-2xl font-bold shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]
                        ${mobileMode
                            ? 'py-3.5 text-base bg-brand-600 text-white shadow-brand-500/20'
                            : 'py-4 text-lg bg-brand-600 text-white shadow-brand-500/20'}
                    `}
                >
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex items-center justify-center space-x-3">
                        <Sparkles size={mobileMode ? 18 : 20} className="group-hover:animate-spin-slow" />
                        <span>Generate Report</span>
                        {mobileMode && <ArrowRight size={16} className="opacity-60" />}
                    </div>
                </button>
            )}

            {/* GENERATING STATE: Progress Bar */}
            {status === 'generating' && (
                <div className={`w-full rounded-2xl overflow-hidden backdrop-blur-md border transition-all
                    ${isDark ? 'bg-slate-950/40 border-slate-800' : 'bg-white/80 border-slate-200'}
                    ${mobileMode ? 'p-4' : 'p-5'}
                `}>
                    <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
                        <span className="flex items-center space-x-2">
                            <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse"></span>
                            <span>Cooking...</span>
                        </span>
                        <span>{progress}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-brand-500 via-indigo-500 to-brand-500 relative bg-[length:200%_auto] animate-gradient-x"
                            style={{ width: `${progress}%` }}
                        >
                            <div className="absolute inset-0 bg-white/30 animate-pulse" />
                        </div>
                    </div>
                </div>
            )}

            {/* READY STATE: Action Buttons */}
            {status === 'ready' && (
                <div className={`flex flex-col animate-fade-in-up ${mobileMode ? 'space-y-3' : 'space-y-4'}`}>
                    <button
                        onClick={onDownload}
                        className={`w-full rounded-2xl font-bold shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center space-x-2
                            ${mobileMode
                                ? 'py-3.5 text-base bg-emerald-500 hover:bg-emerald-400 text-white shadow-emerald-500/20'
                                : 'py-4 text-lg bg-emerald-500 hover:bg-emerald-400 text-white shadow-emerald-500/20'}
                        `}
                    >
                        <Download size={mobileMode ? 18 : 20} />
                        <span>Download PDF</span>
                    </button>

                    <button
                        onClick={onReset}
                        className={`w-full font-bold transition-colors flex items-center justify-center space-x-2
                             ${mobileMode ? 'py-2.5 text-xs' : 'py-3 text-sm'}
                             ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'} 
                        `}
                    >
                        <RotateCcw size={14} />
                        <span>Start Over</span>
                    </button>
                </div>
            )}
        </div>
    );
};
