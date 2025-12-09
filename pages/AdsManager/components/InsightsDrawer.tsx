import React, { useState, useEffect } from 'react';
import { X, TrendingUp, Calendar } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency, formatNumber } from '../../../services/utils/format';
import { useAdsManager } from '../context/AdsManagerContext';

interface InsightsDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    itemName: string;
    itemId: string;
}

export const InsightsDrawer: React.FC<InsightsDrawerProps> = ({ isOpen, onClose, itemName, itemId }) => {
    // Mock Data Generator for MVP
    const generateData = () => {
        const data = [];
        const now = new Date();
        for (let i = 29; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            data.push({
                date: dateStr,
                spend: Math.floor(Math.random() * 500) + 100,
                reach: Math.floor(Math.random() * 5000) + 1000,
                impressions: Math.floor(Math.random() * 8000) + 2000,
            });
        }
        return data;
    };

    const [data] = useState(generateData());
    const [activeMetric, setActiveMetric] = useState<'spend' | 'reach' | 'impressions'>('spend');

    const { theme } = useAdsManager();
    const isDark = theme === 'dark';

    if (!isOpen) return null;

    const totals = {
        spend: data.reduce((acc, curr) => acc + curr.spend, 0),
        reach: data.reduce((acc, curr) => acc + curr.reach, 0),
        impressions: data.reduce((acc, curr) => acc + curr.impressions, 0),
    };

    return (
        <div className="fixed inset-0 z-[100] flex justify-end pointer-events-none">
            {/* BACKDROP */}
            <div
                className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 pointer-events-auto ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            />

            {/* DRAWER CONTENT */}
            <div className={`
                pointer-events-auto
                absolute bottom-0 w-full h-[85vh] md:h-full md:top-0 md:right-0 md:w-[600px] md:bottom-auto
                border-t md:border-t-0 md:border-l shadow-2xl transition-transform duration-300 ease-out
                flex flex-col rounded-t-2xl md:rounded-none
                ${isOpen ? 'translate-y-0 md:translate-x-0' : 'translate-y-full md:translate-x-full'}
                ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}
            `}>
                {/* HEADER */}
                <div className={`h-16 flex items-center justify-between px-6 border-b flex-shrink-0 rounded-t-2xl md:rounded-none ${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-white'}`}>
                    <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                            <TrendingUp size={20} />
                        </div>
                        <div>
                            <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Performance Insights</h2>
                            <p className={`text-xs font-mono flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                {itemName} <span className={isDark ? 'text-slate-600' : 'text-slate-300'}>•</span> {itemId}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className={`p-2 rounded-full transition-colors ${isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-900'}`}>
                        <X size={20} />
                    </button>
                </div>

                {/* CONTENT */}
                <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                    {/* SIDEBAR METRICS - Top on mobile */}
                    <div className={`w-full md:w-64 border-b md:border-b-0 md:border-r p-4 md:p-6 space-y-4 overflow-y-auto flex-shrink-0 ${isDark ? 'bg-slate-900/30 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                        <div className="flex md:flex-col gap-2 overflow-x-auto pb-2 md:pb-0">
                            {[
                                { key: 'spend', label: 'Spend', color: 'blue', total: totals.spend, format: (v: number) => formatCurrency(v * 100) },
                                { key: 'reach', label: 'Reach', color: 'green', total: totals.reach, format: formatNumber },
                                { key: 'impressions', label: 'Impressions', color: 'purple', total: totals.impressions, format: formatNumber }
                            ].map((metric) => (
                                <button
                                    key={metric.key}
                                    onClick={() => setActiveMetric(metric.key as any)}
                                    className={`min-w-[140px] md:w-full p-4 rounded-xl border transition-all text-left flex-shrink-0 ${activeMetric === metric.key
                                        ? (isDark
                                            ? `bg-${metric.color}-500/10 border-${metric.color}-500/50 shadow-lg shadow-${metric.color}-500/5`
                                            : `bg-${metric.color}-50 border-${metric.color}-500 text-${metric.color}-700 shadow-sm`)
                                        : (isDark
                                            ? 'bg-slate-800/20 border-slate-800 hover:bg-slate-800/40 text-slate-400'
                                            : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-500')
                                        }`}
                                >
                                    <p className={`text-xs mb-1 uppercase tracking-wider font-semibold ${activeMetric === metric.key
                                        ? (isDark ? 'text-slate-400' : `text-${metric.color}-600`)
                                        : 'text-slate-500'
                                        }`}>{metric.label}</p>
                                    <p className={`text-xl md:text-2xl font-bold font-mono ${activeMetric === metric.key
                                        ? (isDark ? `text-${metric.color}-400` : `text-${metric.color}-700`)
                                        : (isDark ? 'text-slate-300' : 'text-slate-700')
                                        }`}>
                                        {metric.format(metric.total)}
                                    </p>
                                </button>
                            ))}
                        </div>

                        <div className={`hidden md:block pt-8 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                            <div className={`flex items-center gap-2 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                <Calendar size={12} />
                                Last 30 Days
                            </div>
                        </div>
                    </div>

                    {/* CHART AREA */}
                    <div className={`flex-1 p-4 md:p-8 relative overflow-hidden flex flex-col ${isDark ? 'bg-slate-900/10' : 'bg-white'}`}>
                        <h3 className={`text-sm font-semibold mb-6 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                            {activeMetric.charAt(0).toUpperCase() + activeMetric.slice(1)} Trend
                        </h3>
                        <div className="flex-1 w-full min-h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data}>
                                    <defs>
                                        <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={
                                                activeMetric === 'spend' ? '#3b82f6' : activeMetric === 'reach' ? '#22c55e' : '#a855f7'
                                            } stopOpacity={0.3} />
                                            <stop offset="95%" stopColor={
                                                activeMetric === 'spend' ? '#3b82f6' : activeMetric === 'reach' ? '#22c55e' : '#a855f7'
                                            } stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#1e293b" : "#e2e8f0"} vertical={false} />
                                    <XAxis
                                        dataKey="date"
                                        stroke={isDark ? "#475569" : "#94a3b8"}
                                        tick={{ fontSize: 12, fill: isDark ? "#64748b" : "#64748b" }}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        stroke={isDark ? "#475569" : "#94a3b8"}
                                        tick={{ fontSize: 12, fill: isDark ? "#64748b" : "#64748b" }}
                                        tickFormatter={(val) => activeMetric === 'spend' ? '$' + val : val}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: isDark ? '#0f172a' : '#ffffff',
                                            borderColor: isDark ? '#1e293b' : '#e2e8f0',
                                            borderRadius: '8px',
                                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                        }}
                                        itemStyle={{ color: isDark ? '#fff' : '#0f172a' }}
                                        labelStyle={{ color: isDark ? '#94a3b8' : '#64748b' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey={activeMetric}
                                        stroke={
                                            activeMetric === 'spend' ? '#3b82f6' : activeMetric === 'reach' ? '#22c55e' : '#a855f7'
                                        }
                                        fillOpacity={1}
                                        fill="url(#colorMetric)"
                                        strokeWidth={3}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
