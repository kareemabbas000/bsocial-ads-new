import React from 'react';
import { ArrowRight, Filter } from 'lucide-react';
import { InsightData } from '../../types';

interface PDFFunnelVelocityProps {
    data: InsightData | null;
    isDark: boolean;
    steps: string[];
    hideCost?: boolean;
}

export const PDFFunnelVelocity: React.FC<PDFFunnelVelocityProps> = ({ data, isDark, steps, hideCost }) => {
    if (!data) return null;

    const getValue = (key: string): number => {
        if (!data) return 0;
        if (key === 'Impressions') return parseInt(data.impressions || '0');
        if (key === 'Clicks') return parseInt(data.clicks || '0');
        if (key === 'Reach') return parseInt(data.reach || '0');
        if (key === 'Link Clicks') return parseInt(data.inline_link_clicks || '0');
        if (key === 'Purchases') {
            const acts = data.actions || [];
            return parseInt(acts.find((a: any) => a.action_type === 'omni_purchase')?.value || acts.find((a: any) => a.action_type === 'purchase')?.value || '0');
        }
        if (key === 'Leads') {
            const acts = data.actions || [];
            return parseInt(acts.find((a: any) => a.action_type === 'lead')?.value || '0');
        }
        if (key === 'Post Engagements') {
            const acts = data.actions || [];
            return parseInt(acts.find((a: any) => a.action_type === 'post_engagement')?.value || '0');
        }
        if (key === 'Conversations') {
            const acts = data.actions || [];
            return parseInt(acts.find((a: any) => a.action_type === 'onsite_conversion.messaging_conversation_started_7d')?.value || '0');
        }
        return 0;
    };

    const funnelData = steps.map((step, i) => {
        const fills = ['#0055ff', '#8b5cf6', '#10b981', '#ec4899'];
        return {
            name: step,
            value: getValue(step),
            fill: fills[i % fills.length]
        };
    });

    const formatCompact = (val: number) => {
        if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
        if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
        return val.toFixed(0);
    };

    return (
        <div className={`p-8 rounded-2xl h-auto min-h-[250px] flex flex-col relative overflow-hidden break-inside-avoid mb-8 transition-all border
            ${isDark
                ? 'bg-[#1E293B]/40 backdrop-blur-md border-white/5'
                : 'bg-white/70 backdrop-blur-md border-white/60 shadow-md'}
        `}>
            <div className="relative z-10 flex-1 flex flex-col justify-center">
                <div className="flex items-center mb-6">
                    <div className="p-1.5 rounded bg-slate-100 text-slate-600 mr-2 dark:bg-white/10 dark:text-slate-300">
                        <Filter size={14} />
                    </div>
                    <h3 className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Conversion Funnel</h3>
                </div>

                <div className="flex items-center justify-between w-full relative">
                    {/* Connecting Line (Behind) */}
                    <div className={`absolute top-1/2 left-0 w-full h-0.5 -translate-y-1/2 z-0 ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}></div>

                    {funnelData.map((step, idx) => {
                        const isLast = idx === funnelData.length - 1;
                        const nextStep = !isLast ? funnelData[idx + 1] : null;
                        const convRate = nextStep && step.value > 0 ? ((nextStep.value / step.value) * 100).toFixed(1) + '%' : null;

                        return (
                            <React.Fragment key={idx}>
                                <div className={`relative z-10 flex-1 bg-transparent px-2`}>
                                    <div className={`
                                        flex flex-col items-center justify-center p-4 rounded-xl border transition-all text-center h-[120px]
                                        ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}
                                    `}>
                                        <div className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                            {step.name}
                                        </div>
                                        <div className={`text-2xl font-black tracking-tight mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                            {formatCompact(step.value)}
                                        </div>
                                        <div className="w-8 h-1 rounded-full" style={{ backgroundColor: step.fill }}></div>
                                    </div>
                                </div>

                                {/* Connector with Rate */}
                                {!isLast && (
                                    <div className="relative z-20 flex flex-col items-center px-2">
                                        <div className={`
                                            px-2 py-1 rounded-md text-[9px] font-bold border shadow-sm flex items-center bg-white dark:bg-slate-900
                                            ${isDark ? 'border-slate-700 text-slate-300' : 'border-slate-200 text-slate-600'}
                                        `}>
                                            <span className={convRate && parseFloat(convRate) > 50 ? 'text-emerald-500' : 'text-slate-500'}>{convRate}</span>
                                        </div>
                                    </div>
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
