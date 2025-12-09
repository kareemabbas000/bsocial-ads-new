import React, { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, TrendingUp, AlertTriangle, ArrowRight, BrainCircuit, MessageSquare, X } from 'lucide-react';
import { useAdsManager } from '../context/AdsManagerContext';
import { analyzePerformance } from '../../../services/aiAnalystService';

interface AIAnalystProps {
    data: any[];
    level: string;
    onAction: (prompt: string) => void;
}

export const AIAnalyst: React.FC<AIAnalystProps> = ({ data, level, onAction }) => {
    const { theme } = useAdsManager();
    const isDark = theme === 'dark';
    const [activeInsight, setActiveInsight] = React.useState<number | null>(null);

    // Use the comprehensive service for analysis
    const analysis = useMemo(() => analyzePerformance(data, level), [data, level]);

    if (!analysis || data.length === 0) return null;

    return (
        <div className={`rounded-2xl border shadow-2xl transition-all duration-300 p-6 relative overflow-hidden group/analyst ${isDark
            ? 'bg-slate-900/40 backdrop-blur-xl border-white/10 shadow-black/50'
            : 'bg-white/60 backdrop-blur-xl border-white/40 shadow-purple-500/5'
            }`}>
            {/* Background Effects */}
            <div className={`absolute top-0 right-0 w-96 h-96 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none transition-opacity duration-500 ${isDark ? 'bg-purple-600/20 group-hover/analyst:bg-purple-600/30' : 'bg-purple-600/10 group-hover/analyst:bg-purple-600/15'
                }`} />
            <div className={`absolute bottom-0 left-0 w-64 h-64 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2 pointer-events-none transition-opacity duration-500 ${isDark ? 'bg-indigo-600/10' : 'bg-indigo-600/5'
                }`} />

            <div className="flex flex-col md:flex-row gap-6 relative z-10">
                {/* Score & Main Insight */}
                <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 rounded-lg ${isDark ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-600'}`}>
                            <BrainCircuit size={20} />
                        </div>
                        <h3 className={`text-lg font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            AI Analyst
                        </h3>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${analysis.score > 80
                            ? (isDark ? 'border-emerald-500 text-emerald-400' : 'border-emerald-500 text-emerald-600 bg-emerald-50')
                            : (isDark ? 'border-amber-500 text-amber-400' : 'border-amber-500 text-amber-600 bg-amber-50')
                            }`}>
                            Score: {analysis.score}
                        </span>
                    </div>

                    <p className={`text-lg font-medium leading-relaxed ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                        {analysis.summary}
                    </p>

                    {/* INTERACTIVE CHIPS */}
                    <div className="relative">
                        <div className="flex flex-wrap gap-3 mt-4">
                            {analysis.insights.map((insight, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setActiveInsight(activeInsight === idx ? null : idx)}
                                    className={`px-3 py-2 rounded-lg text-xs font-medium border flex items-center gap-2 backdrop-blur-md transition-all active:scale-95 ${activeInsight === idx ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-transparent' : ''} ${insight.type === 'POSITIVE'
                                        ? (isDark ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/20' : 'bg-emerald-500/5 border-emerald-500/20 text-emerald-700 hover:bg-emerald-500/10')
                                        : insight.type === 'NEGATIVE'
                                            ? (isDark ? 'bg-rose-500/10 border-rose-500/20 text-rose-300 hover:bg-rose-500/20' : 'bg-rose-500/5 border-rose-500/20 text-rose-700 hover:bg-rose-500/10')
                                            : (isDark ? 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:bg-slate-800' : 'bg-white/50 border-slate-200/50 text-slate-600 hover:bg-white')
                                        }`}
                                >
                                    {insight.type === 'POSITIVE' ? <TrendingUp size={12} /> :
                                        insight.type === 'NEGATIVE' ? <AlertTriangle size={12} /> :
                                            <Sparkles size={12} />}
                                    {insight.text}
                                </button>
                            ))}
                        </div>

                        {/* DETAIL MODAL (Portal to Body to avoid clipping) */}
                        {activeInsight !== null && analysis.insights[activeInsight]?.details && typeof document !== 'undefined' && createPortal(
                            <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                                <div
                                    className={`
                                        w-full max-w-sm rounded-2xl shadow-2xl border p-5 relative
                                        animate-in slide-in-from-bottom-10 zoom-in-95 duration-300
                                        ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}
                                    `}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <button
                                        onClick={() => setActiveInsight(null)}
                                        className={`absolute top-3 right-3 p-1 rounded-full ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
                                    >
                                        <X size={16} />
                                    </button>

                                    <div className="flex items-center gap-3 mb-4">
                                        <div className={`p-2 rounded-lg ${analysis.insights[activeInsight].type === 'NEGATIVE'
                                            ? (isDark ? 'bg-rose-500/20 text-rose-400' : 'bg-rose-100 text-rose-600')
                                            : (isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-600')
                                            }`}>
                                            {analysis.insights[activeInsight].type === 'NEGATIVE' ? <AlertTriangle size={20} /> : <TrendingUp size={20} />}
                                        </div>
                                        <div>
                                            <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                                Insight Details
                                            </h4>
                                            <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                                {analysis.insights[activeInsight].entityName || "Campaign Data"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className={`p-3 rounded-xl mb-4 ${isDark ? 'bg-slate-950/50' : 'bg-slate-50'}`}>
                                        <p className={`text-sm font-medium leading-relaxed ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                                            "{analysis.insights[activeInsight].text}"
                                        </p>
                                    </div>

                                    <div className="space-y-2 mb-4">
                                        {analysis.insights[activeInsight].details?.map((detail, i) => (
                                            <div key={i} className={`flex justify-between items-center text-xs p-2 rounded-lg ${isDark ? 'bg-slate-800/50' : 'bg-white border'}`}>
                                                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>{detail.label}</span>
                                                <span className={`font-mono font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{detail.value}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        onClick={() => {
                                            onAction(`Investigate ${analysis.insights[activeInsight || 0].entityName} performance`);
                                            setActiveInsight(null);
                                        }}
                                        className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Sparkles size={14} /> Analyze with Strategist
                                    </button>
                                </div>
                                {/* Backdrop close area */}
                                <div className="absolute inset-0 -z-10" onClick={() => setActiveInsight(null)} />
                            </div>,
                            document.body
                        )}
                    </div>
                </div>

                {/* Suggested Prompts / Actions */}
                <div className={`w-full md:w-80 border-l pl-6 flex flex-col justify-center ${isDark ? 'border-slate-700/50' : 'border-slate-200'}`}>
                    <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        <MessageSquare size={12} /> Suggested Actions
                    </h4>
                    <div className="space-y-2">
                        {analysis.suggestedPrompts.map((prompt, idx) => (
                            <button
                                key={idx}
                                onClick={() => onAction(prompt)}
                                className={`w-full text-left p-3 rounded-lg border transition-all group/btn ${isDark
                                    ? 'bg-slate-800/50 border-slate-700 hover:bg-purple-900/20 hover:border-purple-500/50'
                                    : 'bg-white border-slate-200 hover:bg-purple-50 hover:border-purple-300 shadow-sm'
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className={`text-xs line-clamp-1 ${isDark ? 'text-slate-300 group-hover/btn:text-white' : 'text-slate-600 group-hover/btn:text-purple-700'}`}>
                                        {prompt}
                                    </span>
                                    <ArrowRight size={12} className={`transition-transform opacity-0 group-hover/btn:opacity-100 -translate-x-2 group-hover/btn:translate-x-0 ${isDark ? 'text-slate-500 group-hover/btn:text-purple-400' : 'text-slate-400 group-hover/btn:text-purple-600'
                                        }`} />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
