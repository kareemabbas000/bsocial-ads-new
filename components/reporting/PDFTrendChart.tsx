import React from 'react';
import {
    ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Label, Area, Line, ResponsiveContainer
} from 'recharts';
import { DailyInsight } from '../../types';

interface PDFTrendChartProps {
    data: DailyInsight[];
    isDark: boolean;
    config: {
        bar: { key: string; color: string; name: string; axisLabel: string };
        line: { key: string; color: string; name: string; axisLabel: string };
        title: string;
    };
    hideCost?: boolean;
}

export const PDFTrendChart: React.FC<PDFTrendChartProps> = ({ data, isDark, config, hideCost }) => {
    if (!data || data.length === 0) return null;

    const styles = {
        chartGrid: isDark ? '#1e293b' : '#f1f5f9',
        chartAxis: isDark ? '#64748b' : '#94a3b8',
    };

    const formatDateAxis = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const formatCompact = (val: number) => {
        if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
        if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
        return val.toFixed(0);
    };

    return (
        <div className={`p-8 rounded-2xl h-[450px] flex flex-col relative overflow-hidden break-inside-avoid transition-all border
            ${isDark
                ? 'bg-[#1E293B]/40 backdrop-blur-md border-white/5'
                : 'bg-white/70 backdrop-blur-md border-white/60 shadow-md'}
        `}>

            <div className="relative z-10">
                {(() => {
                    const finalConfig = hideCost ? {
                        ...config,
                        title: 'Performance Trend',
                        bar: { ...config.bar, key: 'impressions', name: 'Impressions', axisLabel: 'IMPR.' },
                        line: { ...config.line, key: 'ctr', name: 'CTR', axisLabel: 'CTR (%)' }
                    } : config;

                    return (
                        <>
                            <div className="flex justify-between items-center mb-6">
                                <h3 className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                    {finalConfig.title}
                                </h3>
                                <div className="flex space-x-4">
                                    <div className="flex items-center text-xs">
                                        <div className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: finalConfig.bar.color }}></div>
                                        <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>{finalConfig.bar.name}</span>
                                    </div>
                                    <div className="flex items-center text-xs">
                                        <div className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: finalConfig.line.color }}></div>
                                        <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>{finalConfig.line.name}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Responsive Container for PDF Stability */}
                            <div className="w-full h-[350px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart data={data} margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke={styles.chartGrid} vertical={false} />
                                        <XAxis
                                            dataKey="date_start"
                                            stroke={styles.chartAxis}
                                            fontSize={10}
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={formatDateAxis}
                                            interval="preserveStartEnd"
                                        />
                                        <YAxis
                                            yAxisId="left"
                                            stroke={styles.chartAxis}
                                            fontSize={10}
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={(val) => formatCompact(val)}
                                        >
                                            <Label value={finalConfig.bar.axisLabel} angle={-90} position="insideLeft" style={{ textAnchor: 'middle', fill: styles.chartAxis, fontSize: '9px', fontWeight: 'bold' }} />
                                        </YAxis>
                                        <YAxis
                                            yAxisId="right"
                                            orientation="right"
                                            stroke={styles.chartAxis}
                                            fontSize={10}
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={(val) => formatCompact(val)}
                                        >
                                            <Label value={finalConfig.line.axisLabel} angle={90} position="insideRight" style={{ textAnchor: 'middle', fill: styles.chartAxis, fontSize: '9px', fontWeight: 'bold' }} />
                                        </YAxis>

                                        <Area
                                            yAxisId="left"
                                            type="monotone"
                                            dataKey={finalConfig.bar.key}
                                            stroke={finalConfig.bar.color}
                                            strokeWidth={2}
                                            fillOpacity={0.1}
                                            fill={finalConfig.bar.color}
                                            isAnimationActive={false}
                                        />
                                        <Line
                                            yAxisId="right"
                                            type="monotone"
                                            dataKey={finalConfig.line.key}
                                            stroke={finalConfig.line.color}
                                            strokeWidth={3}
                                            dot={false}
                                            isAnimationActive={false}
                                        />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>
                        </>
                    );
                })()}
            </div>
        </div>
    );
};
