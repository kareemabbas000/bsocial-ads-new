import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { InsightData } from '../../types';

interface PDFStatCardsProps {
    cards: { id: string; label: string; format: 'currency' | 'number' | 'percent' | 'x'; suffix?: string; color: string; reverseColor?: boolean }[];
    data: InsightData | null;
    prevData: InsightData | null;
    isDark: boolean;
}

export const PDFStatCards: React.FC<PDFStatCardsProps> = ({ cards, data, prevData, isDark }) => {
    if (!data) return null;

    // Helper to extract value safely
    const getValue = (key: string, source: InsightData | null): number => {
        if (!source) return 0;
        if (key === 'spend') return parseFloat(source.spend || '0');
        if (key === 'reach') return parseInt(source.reach || '0');
        if (key === 'impressions') return parseInt(source.impressions || '0');
        if (key === 'clicks') return parseInt(source.clicks || '0');
        if (key === 'ctr') return parseFloat(source.ctr || '0');
        if (key === 'roas') {
            const vals = source.action_values || [];
            const pur = vals.find((v: any) => v.action_type === 'omni_purchase')?.value || vals.find((v: any) => v.action_type === 'purchase')?.value || '0';
            const sp = parseFloat(source.spend || '0');
            return sp > 0 ? parseFloat(pur) / sp : 0;
        }
        if (key === 'cpa') {
            const sp = parseFloat(source.spend || '0');
            const acts = source.actions || [];
            let purObj = acts.find((a: any) => a.action_type === 'omni_purchase');
            if (!purObj) purObj = acts.find((a: any) => a.action_type === 'purchase');
            // Add pixel fallback for CPA too
            if (!purObj) purObj = acts.find((a: any) => a.action_type === 'offsite_conversion.fb_pixel_purchase');

            const pVal = parseInt(purObj ? purObj.value : '0');
            return pVal > 0 ? sp / pVal : 0;
        }
        if (key === 'leads') {
            const acts = source.actions || [];
            return parseInt(acts.find((a: any) => a.action_type === 'lead')?.value || '0');
        }
        if (key === 'post_engagement') {
            const acts = source.actions || [];
            return parseInt(acts.find((a: any) => a.action_type === 'post_engagement')?.value || '0');
        }
        if (key === 'messaging_conversations') {
            const acts = source.actions || [];
            return parseInt(acts.find((a: any) => a.action_type === 'onsite_conversion.messaging_conversation_started_7d')?.value || '0');
        }
        if (key === 'purchases') {
            const acts = source.actions || [];
            let act = acts.find((a: any) => a.action_type === 'omni_purchase');
            if (!act) act = acts.find((a: any) => a.action_type === 'purchase');
            if (!act) act = acts.find((a: any) => a.action_type === 'offsite_conversion.fb_pixel_purchase');
            if (!act) act = acts.find((a: any) => a.action_type.toLowerCase().includes('purchase'));
            return parseInt(act?.value || '0');
        }
        return 0;
    };

    const formatValue = (val: number, format: string, suffix?: string) => {
        if (format === 'currency') {
            if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
            if (val >= 1000) return `$${(val / 1000).toFixed(1)}K`;
            return `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
        if (format === 'percent') return `${val.toFixed(2)}%`;
        if (format === 'number') {
            if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`; // Millions
            if (val >= 1000) return `${(val / 1000).toFixed(1)}K`; // Thousands
            return val.toLocaleString();
        }
        if (format === 'x') return `${val.toFixed(2)}x`;
        return `${val}${suffix || ''}`;
    };

    return (
        <>
            {cards.map((card, idx) => {
                const val = getValue(card.id, data);
                const prevVal = getValue(card.id, prevData);

                let trend = 0;
                if (prevVal && prevVal !== 0) {
                    trend = ((val - prevVal) / prevVal) * 100;
                }

                const isPositive = trend > 0;
                const isNeutral = trend === 0;

                // Sentiment Logic
                // Standard: Increase = Good (Green), Decrease = Bad (Red)
                // Reverse (Cost): Increase = Bad (Red), Decrease = Good (Green)
                // Default to Standard unless reversed or specific IDs

                const isReverseMetric = card.id === 'cpa' || card.id === 'spend' || card.id === 'cpc' || card.reverseColor;
                const isGood = isReverseMetric ? !isPositive : isPositive;

                // Color Classes
                const colorClass = isNeutral
                    ? (isDark ? 'text-slate-400 bg-slate-800' : 'text-slate-600 bg-slate-100')
                    : isGood
                        ? (isDark ? 'text-emerald-400 bg-emerald-950/30' : 'text-emerald-600 bg-emerald-100')
                        : (isDark ? 'text-rose-400 bg-rose-950/30' : 'text-rose-600 bg-rose-100');

                return (
                    <div key={idx} className={`relative overflow-hidden p-6 rounded-2xl break-inside-avoid transition-all border
                        ${isDark
                            ? 'bg-[#1E293B]/40 backdrop-blur-md border-white/5'
                            : 'bg-white/70 backdrop-blur-md border-white/60 shadow-md'}
                    `}>
                        <div className="relative z-10 flex flex-col justify-between h-full">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className={`text-[10px] uppercase font-bold tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                    {card.label}
                                </h3>
                                {/* Real Trend Pill */}
                                {prevData && !isNeutral && (
                                    <div className={`flex items-center space-x-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${colorClass}`}>
                                        {isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                        <span>{Math.abs(trend).toFixed(1)}%</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-baseline space-x-1">
                                <div className={`text-3xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                    {formatValue(val, card.format, card.suffix)}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </>
    );
};
