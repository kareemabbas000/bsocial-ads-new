import React from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Label, Cell
} from 'recharts';
import { Users, Globe } from 'lucide-react';
import { PDFComponentProps } from './types';

interface DemographicsData {
    ageGender: { age: string; Male: number; Female: number }[];
    regions: { name: string; value: number }[];
}

interface PDFDemographicsProps extends PDFComponentProps {
    data: DemographicsData;
    hideCost?: boolean;
}

export const PDFDemographics: React.FC<PDFDemographicsProps> = ({ data, isDark, styles, hideCost }) => {
    const { ageGender, regions } = data;

    const formatCompact = (val: number) => {
        if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
        if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
        return val.toFixed(0);
    };

    return (
        <div className="grid grid-cols-2 gap-8 mb-8 break-inside-avoid">
            {/* Age & Gender */}
            <div className={`p-6 rounded-2xl border transition-all relative overflow-hidden
                ${isDark
                    ? 'bg-[#1E293B]/40 backdrop-blur-md border-white/5'
                    : 'bg-white/70 backdrop-blur-md border-white/60 shadow-md'}
            `}>
                <div className="relative z-10">
                    <div className="flex items-center mb-6">
                        <div className="p-1.5 rounded bg-orange-100 text-orange-600 mr-2 dark:bg-orange-900/30 dark:text-orange-400">
                            <Users size={14} />
                        </div>
                        <h3 className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Demographics ({hideCost ? 'Impressions' : 'Spend'})</h3>
                    </div>
                    <div style={{ width: 450, height: 'auto', minHeight: 250 }}>
                        <BarChart width={450} height={250} data={ageGender} margin={{ top: 0, right: 0, left: 20, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={styles.chartGrid} vertical={false} />
                            <XAxis
                                dataKey="age"
                                stroke={styles.chartAxis}
                                fontSize={9}
                                tickLine={false}
                                axisLine={false}
                                tick={{ fill: styles.chartAxis, fontSize: 9, fontWeight: 600 }}
                                dy={5}
                            />
                            <YAxis
                                stroke={styles.chartAxis}
                                fontSize={9}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={formatCompact}
                                tick={{ fill: styles.chartAxis }}
                            >
                                <Label value={hideCost ? "IMPRESSIONS" : "SPEND"} angle={-90} position="insideLeft" style={{ fontSize: '8px', fontWeight: 'bold', fill: styles.chartAxis }} />
                            </YAxis>
                            <Bar
                                dataKey="Male"
                                fill="#3b82f6"
                                radius={[2, 2, 0, 0]}
                                barSize={12}
                            />
                            <Bar
                                dataKey="Female"
                                fill="#ec4899"
                                radius={[2, 2, 0, 0]}
                                barSize={12}
                            />
                        </BarChart>
                        {/* Clean Legend */}
                        <div className="flex justify-center items-center space-x-4 mt-4">
                            <div className="flex items-center space-x-1.5">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                <span className={`text-[9px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Male</span>
                            </div>
                            <div className="flex items-center space-x-1.5">
                                <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                                <span className={`text-[9px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Female</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Top Regions */}
            <div className={`p-6 rounded-2xl border transition-all relative overflow-hidden
                ${isDark
                    ? 'bg-[#1E293B]/40 backdrop-blur-md border-white/5'
                    : 'bg-white/70 backdrop-blur-md border-white/60 shadow-md'}
            `}>
                <div className="relative z-10">
                    <div className="flex items-center mb-6">
                        <div className="p-1.5 rounded bg-indigo-100 text-indigo-600 mr-2 dark:bg-indigo-900/30 dark:text-indigo-400">
                            <Globe size={14} />
                        </div>
                        <h3 className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Top Regions ({hideCost ? 'Impressions' : 'Spend'})</h3>
                    </div>
                    <div style={{ width: 450, height: 'auto', minHeight: 250 }}>
                        <BarChart width={450} height={250} data={regions.slice(0, 5)} margin={{ top: 0, right: 0, left: 20, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={styles.chartGrid} vertical={false} />
                            <XAxis
                                dataKey="name"
                                stroke={styles.chartAxis}
                                fontSize={9}
                                tickLine={false}
                                axisLine={false}
                                interval={0}
                                tick={(props: any) => {
                                    const { x, y, payload } = props;
                                    const words = payload.value.split(' ');
                                    // Logic: Try to balance lines or just split by space
                                    // If > 2 words, join first two? "New York City" -> "New York" "City"
                                    // Simple split by space usually works best for "Name Governorate"

                                    return (
                                        <g transform={`translate(${x},${y})`}>
                                            <text x={0} y={0} dy={32} textAnchor="middle" fill={styles.chartAxis} fontSize={9} fontWeight={600}>
                                                {words.map((word: string, i: number) => (
                                                    <tspan x={0} dy={i === 0 ? 0 : 10} key={i}>
                                                        {word}
                                                    </tspan>
                                                ))}
                                            </text>
                                        </g>
                                    );
                                }}
                                height={60} // Increase height to prevent clip
                            />
                            <YAxis
                                stroke={styles.chartAxis}
                                fontSize={9}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={formatCompact}
                                tick={{ fill: styles.chartAxis }}
                            >
                                <Label value={hideCost ? "Impr." : "SPEND"} angle={-90} position="insideLeft" style={{ fontSize: '8px', fontWeight: 'bold', fill: styles.chartAxis }} />
                            </YAxis>
                            <Bar dataKey="value" radius={[2, 2, 0, 0]} barSize={40}>
                                {regions.slice(0, 5).map((entry, index) => {
                                    const fill = index === 0 ? '#fbbf24'
                                        : index === 1 ? '#94a3b8'
                                            : index === 2 ? '#d97706'
                                                : '#2dd4bf';
                                    return <Cell key={`cell-${index}`} fill={fill} />;
                                })}
                            </Bar>
                        </BarChart>
                        {/* Rank Legend */}
                        <div className="flex justify-center items-center space-x-3 mt-4">
                            {regions.slice(0, 3).map((r, i) => (
                                <div key={i} className={`flex items-center space-x-1.5`}>
                                    <div className={`w-1.5 h-1.5 rounded-full ${i === 0 ? 'bg-yellow-400' : i === 1 ? 'bg-slate-400' : 'bg-amber-600'}`}></div>
                                    <span className={`text-[9px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>#{i + 1} {r.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div >);
};
