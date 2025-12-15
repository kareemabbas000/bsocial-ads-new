import React from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, Label
} from 'recharts';
import { Monitor } from 'lucide-react';
import { PDFComponentProps } from './types';

interface PDFPlacementsProps extends PDFComponentProps {
    title?: string;
    xAxisLabel?: string;
    yAxisLabel?: string;
    hideCost?: boolean;
}

export const PDFPlacements: React.FC<PDFPlacementsProps> = ({ data, isDark, styles, title = "Placement Performance", xAxisLabel = "VALUE", yAxisLabel = "PLACEMENT", hideCost }) => {
    // data is processedPlacements array
    const chartData = data.slice(0, 8); // Top 8 

    const formatCompact = (val: number) => {
        if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
        if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
        return val.toFixed(0);
    };

    return (
        <div className={`p-6 rounded-2xl h-[400px] flex flex-col break-inside-avoid transition-all relative overflow-hidden border
            ${isDark
                ? 'bg-[#1E293B]/40 backdrop-blur-md border-white/5'
                : 'bg-white/70 backdrop-blur-md border-white/60 shadow-md'}
        `}>
            <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-center mb-4 shrink-0">
                    <div className="p-1.5 rounded bg-emerald-100 text-emerald-600 mr-2 dark:bg-emerald-900/30 dark:text-emerald-400">
                        <Monitor size={14} />
                    </div>
                    <h3 className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{title}</h3>
                </div>

                <div className="flex-1 w-full min-h-0">
                    {/* Fixed Width 450px for half-width layout */}
                    <BarChart width={450} height={320} data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 50, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={styles.chartGrid} horizontal={false} />
                        <XAxis type="number" stroke={styles.chartAxis} fontSize={9} tickLine={false} axisLine={false} tickFormatter={formatCompact} tick={{ fill: styles.chartAxis }}>
                            <Label value={hideCost ? 'IMPRESSIONS' : xAxisLabel} offset={-5} position="insideBottom" style={{ fontSize: '8px', fontWeight: 'bold', fill: styles.chartAxis, textTransform: 'uppercase' }} />
                        </XAxis>
                        <YAxis type="category" dataKey="name" stroke={styles.chartAxis} fontSize={9} tickLine={false} axisLine={false} width={100} tick={{ fill: styles.chartAxis, fontWeight: 600 }}>
                        </YAxis>
                        <Bar dataKey="value" radius={[0, 2, 2, 0]} barSize={20}>
                            {chartData.map((entry: any, index: number) => {
                                const name = entry.name.toLowerCase();
                                const fill = name.includes('facebook') ? '#3b82f6'
                                    : name.includes('instagram') ? '#ec4899'
                                        : name.includes('messenger') ? '#8b5cf6'
                                            : '#10b981';
                                return <Cell key={`cell-${index}`} fill={fill} />;
                            })}
                        </Bar>
                    </BarChart>
                </div>
            </div>
        </div>
    );
};
