import React from 'react';
import {
    ArrowUp, ArrowDown, Check, Zap, Sparkles, ExternalLink,
    Image, Video, Layers
} from 'lucide-react';
import { AdPerformance, AdCreative, UserConfig } from '../../../types';

interface CreativeListProps {
    ads: AdPerformance[]; // Visible ads
    metricOrder: string[];
    selectedMetrics: Set<string>;
    sortConfig: { key: string; direction: 'asc' | 'desc' };
    onSort: (key: string) => void;
    colWidths: { [key: string]: number };
    onResizeStart: (e: React.MouseEvent, key: string) => void;
    getGridTemplate: () => string;
    isDark: boolean;
    userConfig?: UserConfig;
    getMetricValue: (ad: AdPerformance, metric: string) => number | string;
    formatCompact: (val: number, type?: string) => string;
    handleAnalyze: (ad: AdPerformance) => void;
    getPermalink: (cre: AdCreative | undefined) => string | null;
    getCreativeType: (cre: AdCreative | undefined) => string;
    handleDragStart: (e: React.DragEvent, id: string) => void;
    handleDragOver: (e: React.DragEvent, id: string) => void;
    handleDrop: (e: React.DragEvent, id: string) => void;
    COST_METRICS: string[];
    AVAILABLE_METRICS: any[];
}

export const CreativeList: React.FC<CreativeListProps> = ({
    ads,
    metricOrder,
    selectedMetrics,
    sortConfig,
    onSort,
    onResizeStart,
    getGridTemplate,
    isDark,
    userConfig,
    getMetricValue,
    formatCompact,
    handleAnalyze,
    getPermalink,
    getCreativeType,
    handleDragStart,
    handleDragOver,
    handleDrop,
    COST_METRICS,
    AVAILABLE_METRICS
}) => {
    return (
        <div className="flex flex-col gap-3 overflow-x-auto pb-4 custom-scrollbar">
            {/* ELITE GLOBAL STANDARD HEADER - Glassmorphism */}
            <div className="sticky top-0 z-40 pb-4 -mt-2 pt-2 px-1 min-w-max">
                <div className={`
                    relative grid items-center rounded-2xl border backdrop-blur-xl transition-all select-none shadow-2xl overflow-hidden
                    ${isDark
                        ? 'bg-slate-900/80 border-white/10 shadow-black/40 ring-1 ring-white/5'
                        : 'bg-white/90 border-slate-200 shadow-slate-200/50 ring-1 ring-slate-900/5'
                    }
                `}
                    style={{ gridTemplateColumns: getGridTemplate(), height: '56px' }}
                >
                    {/* Asset Column */}
                    <div
                        className={`
                            relative h-full flex items-center px-4 cursor-pointer transition-all duration-300 group
                            border-r-2 ${isDark ? 'border-r-slate-800 bg-slate-900/30 hover:bg-white/5' : 'border-r-slate-100 bg-slate-50/50 hover:bg-slate-50'}
                        `}
                        onClick={() => onSort('ad_id')}
                    >
                        <div className={`text-[10px] font-black uppercase tracking-[0.15em] flex items-center gap-3 w-full ${sortConfig.key === 'ad_id' ? 'text-brand-500' : (isDark ? 'text-slate-400 group-hover:text-slate-200' : 'text-slate-500 group-hover:text-brand-600')}`}>
                            <span>Asset</span>
                            <div className={`shrink-0 transition-all duration-300 ${sortConfig.key === 'ad_id' ? 'opacity-100 text-brand-500' : 'opacity-0 group-hover:opacity-100'}`}>
                                {sortConfig.key === 'ad_id' && sortConfig.direction === 'desc' ? <ArrowDown size={12} strokeWidth={3} /> : <ArrowUp size={12} strokeWidth={3} />}
                            </div>
                        </div>
                        <div className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-brand-500/50 transition-colors z-50" onMouseDown={(e) => onResizeStart(e, 'asset')} />
                    </div>

                    {/* Creative Identity Column */}
                    <div
                        className={`
                            relative h-full flex items-center px-4 cursor-pointer transition-all duration-300 group
                            border-r-2 ${isDark ? 'border-r-slate-800 bg-slate-900/30 hover:bg-white/5' : 'border-r-slate-100 bg-slate-50/50 hover:bg-slate-50'}
                        `}
                        onClick={() => onSort('ad_name')}
                    >
                        <div className={`text-[10px] font-black uppercase tracking-[0.15em] flex items-center gap-3 w-full ${sortConfig.key === 'ad_name' ? 'text-brand-500' : (isDark ? 'text-slate-400 group-hover:text-slate-200' : 'text-slate-500 group-hover:text-brand-600')}`}>
                            <span>Creative Identity</span>
                            <div className={`shrink-0 transition-all duration-300 ${sortConfig.key === 'ad_name' ? 'opacity-100 text-brand-500' : 'opacity-0 group-hover:opacity-100'}`}>
                                {sortConfig.key === 'ad_name' && sortConfig.direction === 'desc' ? <ArrowDown size={12} strokeWidth={3} /> : <ArrowUp size={12} strokeWidth={3} />}
                            </div>
                        </div>
                        <div className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-brand-500/50 transition-colors z-50" onMouseDown={(e) => onResizeStart(e, 'name')} />
                    </div>

                    {/* Metric Columns */}
                    {metricOrder.filter(id => selectedMetrics.has(id)).map(id => {
                        if (userConfig?.hide_total_spend && COST_METRICS.includes(id)) return null;
                        const m = AVAILABLE_METRICS.find(metric => metric.id === id); if (!m) return null;
                        const isActive = sortConfig.key === m.id;

                        return (
                            <div
                                key={m.id}
                                className={`
                                    relative h-full flex items-center justify-end px-4 cursor-pointer transition-all duration-300 group
                                    border-r-2 ${isDark ? 'border-r-slate-800 hover:bg-white/5' : 'border-r-slate-100 hover:bg-slate-50'}
                                    ${isActive ? (isDark ? 'bg-brand-500/5' : 'bg-brand-50') : (isDark ? 'bg-slate-900/30' : 'bg-slate-50/50')}
                                `}
                                onClick={() => onSort(m.id)}
                                draggable
                                onDragStart={(e) => handleDragStart(e, m.id)}
                                onDragOver={(e) => handleDragOver(e, m.id)}
                                onDrop={(e) => handleDrop(e, m.id)}
                            >
                                <div className={`text-[10px] font-black uppercase tracking-[0.15em] text-right flex items-center justify-end gap-3 w-full ${isActive ? 'text-brand-500' : (isDark ? 'text-slate-400 group-hover:text-slate-200' : 'text-slate-500 group-hover:text-brand-600')}`}>
                                    <div className={`shrink-0 transition-all duration-300 ${isActive ? 'opacity-100 text-brand-500' : 'opacity-0 group-hover:opacity-100'}`}>
                                        {isActive && sortConfig.direction === 'desc' ? <ArrowDown size={12} strokeWidth={3} /> : <ArrowUp size={12} strokeWidth={3} />}
                                    </div>
                                    <span>{m.label}</span>
                                </div>
                                <div className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-brand-500/50 transition-colors z-50" onMouseDown={(e) => onResizeStart(e, m.id)} />
                            </div>
                        );
                    })}


                    {/* Actions Column */}
                    <div className={`relative h-full flex items-center justify-center px-4 ${isDark ? 'bg-slate-900/60 border-white/5' : 'bg-white border-slate-200'}`}>
                        <Zap size={14} className={isDark ? 'text-slate-600' : 'text-slate-400'} />
                    </div>
                </div>
            </div>

            {/* Cinematic Rows */}
            <div className="flex flex-col gap-3 min-w-max pb-12">
                {ads.map(ad => {
                    const type = getCreativeType(ad.creative);
                    return (
                        <div
                            key={ad.ad_id}
                            className={`
                                group relative grid items-center rounded-2xl transition-all duration-300 ease-out border
                                ${isDark
                                    ? 'bg-slate-900/40 border-slate-800 hover:border-slate-600 hover:bg-slate-800/60 hover:shadow-[0_8px_30px_rgb(0,0,0,0.5)]'
                                    : 'bg-white border-slate-200 hover:border-brand-200 hover:bg-white hover:shadow-[0_8px_30px_rgb(200,200,200,0.4)]'
                                }
                                hover:translate-x-1 hover:scale-[1.002] hover:z-10
                            `}
                            style={{ gridTemplateColumns: getGridTemplate(), height: 'auto', minHeight: '88px' }}
                        >
                            {/* Hover Highlight Line */}
                            <div className="absolute left-0 top-2 bottom-2 w-1 rounded-r-lg bg-brand-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                            {/* Asset Thumbnail (Large & Clear) */}
                            <div className="p-3 pl-4 flex items-center justify-start relative z-10 h-full">
                                <div className="relative w-20 h-20 rounded-xl overflow-hidden shadow-md group-hover:shadow-2xl group-hover:scale-125 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] border border-white/10 z-0 group-hover:z-50 bg-slate-900">
                                    <img src={ad.creative?.image_url} className="w-full h-full object-cover" loading="lazy" alt={ad.ad_name} />
                                    {/* Play Icon Overlay for Videos */}
                                    {type === 'video' && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[1px]">
                                            <div className="bg-white/20 backdrop-blur-md p-1.5 rounded-full ring-1 ring-white/30">
                                                <div className="ml-0.5 w-0 h-0 border-t-[3px] border-t-transparent border-l-[6px] border-b-[3px] border-b-transparent border-l-white"></div>
                                            </div>
                                        </div>
                                    )}
                                    {/* Type Badge */}
                                    <div className="absolute bottom-0 right-0 p-1">
                                        {type === 'video' ? <Video size={10} className="text-white drop-shadow-md" /> :
                                            type === 'carousel' ? <Layers size={10} className="text-white drop-shadow-md" /> : null}
                                    </div>
                                </div>
                            </div>

                            {/* Identity (Clean Typography) */}
                            <div className="p-3 px-4 flex flex-col justify-center h-full relative z-10 border-l border-dashed border-slate-500/10">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`text-sm font-black truncate tracking-tight transition-colors ${isDark ? 'text-slate-100 group-hover:text-white' : 'text-slate-800 group-hover:text-brand-900'}`}>
                                        {ad.ad_name}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {ad.created_time && (
                                        <span className={`text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                                            {new Date(ad.created_time).toLocaleDateString()}
                                        </span>
                                    )}
                                    <span className={`text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded ${ad.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-500'}`}>
                                        {ad.status || 'UNKNOWN'}
                                    </span>
                                </div>
                            </div>

                            {/* Metrics (Pill-like & High Contrast) */}
                            {metricOrder.filter(id => selectedMetrics.has(id)).map(id => {
                                if (userConfig?.hide_total_spend && COST_METRICS.includes(id)) return null;
                                const m = AVAILABLE_METRICS.find(metric => metric.id === id); if (!m) return null;
                                const val = getMetricValue(ad, m.id);

                                // Logic for visual emphasis
                                const isPositive = m.id === 'roas' && (val as number) > 2.0;
                                const isNegative = (m.id === 'cpr' && (val as number) > 20) || (m.id === 'roas' && (val as number) < 1.0);

                                return (
                                    <div key={m.id} className="p-3 px-4 text-right flex flex-col justify-center h-full relative z-10 border-l border-dashed border-slate-500/5">
                                        <span className={`
                                            text-sm font-bold font-mono tracking-tight transition-all duration-300
                                            ${isPositive ? 'text-emerald-400 text-base scale-110 origin-right' : ''}
                                            ${isNegative ? 'text-rose-400' : ''}
                                            ${!isPositive && !isNegative ? (isDark ? 'text-slate-400 group-hover:text-slate-200' : 'text-slate-600 group-hover:text-slate-900') : ''}
                                        `}>
                                            {formatCompact(val as number, m.format)}
                                        </span>
                                    </div>
                                );
                            })}

                            {/* Actions - Floating Slide-in */}
                            <div className="p-3 flex justify-center items-center gap-2 h-full relative z-10">
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleAnalyze(ad); }}
                                        className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white hover:shadow-lg hover:shadow-purple-500/30 hover:scale-110 transition-all"
                                        title="AI Deep Dive"
                                    >
                                        <Sparkles size={14} fill="white" className="text-white" />
                                    </button>

                                    {getPermalink(ad.creative) && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                window.open(getPermalink(ad.creative)!, '_blank');
                                            }}
                                            className={`p-2 rounded-xl border hover:scale-110 transition-all ${isDark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white' : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800 hover:border-slate-300'}`}
                                            title="View Post"
                                        >
                                            <ExternalLink size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    );
};
