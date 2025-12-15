import React from 'react';
import {
    ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Area, Line, Label
} from 'recharts';
import { PDFChartProps } from './types';

export const PDFMainChart: React.FC<PDFChartProps> = ({ dailyData, isDark, activeConfig }) => {
    const styles = {
        chartGrid: isDark ? '#1e293b' : '#f1f5f9',
        chartAxis: isDark ? '#64748b' : '#94a3b8',
        text: isDark ? '#94a3b8' : '#64748b'
    };

    const formatDateAxis = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const formatCompact = (val: number, key?: string) => {
        if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
        if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
        return val.toFixed(0);
    };

    if (!dailyData || dailyData.length === 0) return null;

    return (
        <div className={`p-6 rounded-xl border mb-8 break-inside-avoid ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="flex justify-between items-center mb-4">
                <h3 className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {activeConfig?.mainChart?.title || 'Trend Analysis'}
                </h3>
                <div className="flex space-x-4">
                    <div className="flex items-center text-xs">
                        <div className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: activeConfig?.mainChart?.bar?.color || '#0055ff' }}></div>
                        <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>{activeConfig?.mainChart?.bar?.name || 'Primary'}</span>
                    </div>
                    <div className="flex items-center text-xs">
                        <div className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: activeConfig?.mainChart?.line?.color || '#10b981' }}></div>
                        <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>{activeConfig?.mainChart?.line?.name || 'Secondary'}</span>
                    </div>
                </div>
            </div>

            {/* Fixed Dimensions for PDF Stability */}
            <div style={{ width: 1000, height: 350 }}>
                <ComposedChart width={1000} height={350} data={dailyData} margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
                    <defs>
                        <linearGradient id="colorMainBarPDF" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={activeConfig?.mainChart?.bar?.color} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={activeConfig?.mainChart?.bar?.color} stopOpacity={0} />
                        </linearGradient>
                    </defs>
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
                        <Label value={activeConfig?.mainChart?.bar?.axisLabel} angle={-90} position="insideLeft" style={{ textAnchor: 'middle', fill: styles.chartAxis, fontSize: '9px', fontWeight: 'bold' }} />
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
                        <Label value={activeConfig?.mainChart?.line?.axisLabel} angle={90} position="insideRight" style={{ textAnchor: 'middle', fill: styles.chartAxis, fontSize: '9px', fontWeight: 'bold' }} />
                    </YAxis>

                    <Area
                        yAxisId="left"
                        type="monotone"
                        dataKey={activeConfig?.mainChart?.bar?.key}
                        stroke={activeConfig?.mainChart?.bar?.color}
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorMainBarPDF)"
                    />
                    <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey={activeConfig?.mainChart?.line?.key}
                        stroke={activeConfig?.mainChart?.line?.color}
                        strokeWidth={2}
                        dot={{ r: 2, fill: activeConfig?.mainChart?.line?.color, strokeWidth: 0 }}
                    />
                </ComposedChart>
            </div>
        </div>
    );
};
