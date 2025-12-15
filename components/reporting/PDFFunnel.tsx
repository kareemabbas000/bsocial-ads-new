import React from 'react';
import { ArrowRight, Filter } from 'lucide-react';
import { PDFFunnelProps } from './types';

export const PDFFunnel: React.FC<PDFFunnelProps> = ({ funnelData, isDark }) => {
    const formatCompact = (val: number) => {
        if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
        if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
        return val.toFixed(0);
    };

    return (
        <div className={`p-6 rounded-xl border mb-8 break-inside-avoid ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center mb-6">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-brand-500 to-purple-600 text-white mr-2">
                    <Filter size={14} />
                </div>
                <h3 className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>Conversion Funnel</h3>
            </div>

            <div className="flex justify-between items-center relative gap-2">
                {funnelData.map((step, idx) => {
                    const isLast = idx === funnelData.length - 1;
                    const nextStep = !isLast ? funnelData[idx + 1] : null;
                    const convRate = nextStep && step.value > 0 ? ((nextStep.value / step.value) * 100).toFixed(1) + '%' : null;

                    return (
                        <div key={idx} className="flex-1 flex items-center">
                            {/* Card part */}
                            <div className={`
                                flex-1 flex flex-col items-center p-4 rounded-lg border text-center relative z-10
                                ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'}
                            `}>
                                <div className={`text-[10px] uppercase font-bold tracking-wider mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                    {step.name}
                                </div>
                                <div className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                    {formatCompact(step.value)}
                                </div>
                                <div className="h-1 w-8 mt-2 rounded-full" style={{ backgroundColor: step.fill }}></div>
                            </div>

                            {/* Connector Arrow */}
                            {!isLast && (
                                <div className="flex flex-col items-center px-1 shrink-0 z-20 -ml-3 -mr-3">
                                    <div className={`
                                        px-1.5 py-0.5 rounded-md text-[9px] font-bold border shadow-sm flex items-center space-x-1 z-30 bg-white dark:bg-slate-900
                                        ${isDark ? 'border-slate-700 text-slate-300' : 'border-slate-200 text-slate-600'}
                                    `}>
                                        <span>{convRate}</span>
                                        <ArrowRight size={8} className="text-emerald-500" />
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
