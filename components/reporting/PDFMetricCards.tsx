import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { PDFComponentProps } from './types';

export const PDFMetricCards: React.FC<PDFComponentProps> = ({ data, isDark, styles }) => {
    // Helper to render simpler static cards for PDF
    const renderCard = (label: string, value: string, trend: number | undefined, prefix = '', suffix = '', reverseColor = false) => {
        const isPositiveMath = trend !== undefined && trend > 0;
        const isNeutral = !trend || trend === 0;
        const isGood = reverseColor ? !isPositiveMath : isPositiveMath;

        const trendColorClass = isNeutral
            ? (isDark ? 'text-slate-400 bg-slate-800' : 'text-slate-600 bg-slate-100')
            : isGood
                ? (isDark ? 'text-emerald-400 bg-emerald-950/30' : 'text-emerald-700 bg-emerald-50')
                : (isDark ? 'text-rose-400 bg-rose-950/30' : 'text-rose-700 bg-rose-50');

        return (
            <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} break-inside-avoid`}>
                <div className="flex justify-between items-start mb-2">
                    <h3 className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{label}</h3>
                    {trend !== undefined && (
                        <div className={`flex items-center space-x-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${trendColorClass}`}>
                            {isPositiveMath ? <TrendingUp size={8} /> : isNeutral ? <Minus size={8} /> : <TrendingDown size={8} />}
                            <span>{Math.abs(trend).toFixed(1)}%</span>
                        </div>
                    )}
                </div>
                <div className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {prefix}{value}{suffix}
                </div>
            </div>
        );
    };

    return (
        <div className="grid grid-cols-4 gap-4 mb-8">
            {renderCard('Spend', data.spend, data.spendTrend, '$')}
            {renderCard('ROAS', data.roas, data.roasTrend, '', 'x')}
            {renderCard('CPA', data.cpa, data.cpaTrend, '$', '', true)}
            {renderCard('CTR', data.ctr, data.ctrTrend, '', '%')}
        </div>
    );
};
