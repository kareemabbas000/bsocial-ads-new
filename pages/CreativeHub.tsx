import React, { useState, useMemo, useEffect } from 'react';
import { useCreativePerformance } from '../hooks/useMetaQueries';
import { analyzeCreative } from '../services/aiService';
import { AdPerformance, DateSelection, Theme, AdCreative, GlobalFilter, UserConfig } from '../types';
import LoadingSpinner from '../components/LoadingSpinner'; // Unified Loading
import {
    Image, Sparkles, LayoutGrid, List, X, ExternalLink,
    ChevronDown, SlidersHorizontal, ArrowUp, ArrowDown, SortAsc, SortDesc, Crown, AlertTriangle, Check, GripHorizontal,
    ZoomIn, ZoomOut
} from 'lucide-react';
import { CreativeList } from './AdsManager/components/CreativeList';

interface CreativeHubProps {
    token: string;
    accountIds: string[]; // Updated
    datePreset: DateSelection;
    theme: Theme;
    filter: GlobalFilter;
    userConfig?: UserConfig;
    refreshInterval?: number;
    refreshTrigger?: number;
}


// Available Metrics Definition with Categories
const AVAILABLE_METRICS = [
    { id: 'spend', label: 'Spend', format: 'currency' },
    { id: 'reach', label: 'Reach', format: 'number' },
    { id: 'impressions', label: 'Impressions', format: 'number' },
    { id: 'clicks', label: 'Clicks (All)', format: 'number' },
    { id: 'ctr', label: 'CTR', format: 'percent' },
    { id: 'post_engagement', label: 'Post Engag.', format: 'number' },
    { id: 'roas', label: 'ROAS', format: 'number' },
    { id: 'created_time', label: 'Date Created', format: 'date' },
    { id: 'cpa', label: 'CPA', format: 'currency' },
    { id: 'cpc', label: 'CPC', format: 'currency' },
    { id: 'cpm', label: 'CPM', format: 'currency' },
    { id: 'results', label: 'Results', format: 'number' },
    { id: 'cost_per_result', label: 'CPR (Meta)', format: 'currency' },
    { id: 'frequency', label: 'Freq.', format: 'number' },
    { id: 'unique_clicks', label: 'Unique Clicks', format: 'number' },
    { id: 'inline_link_clicks', label: 'Link Clicks', format: 'number' },
    { id: 'outbound_clicks', label: 'Outbound Clicks', format: 'number' },
    { id: 'purchases', label: 'Purchases', format: 'number' },
    { id: 'leads', label: 'Leads', format: 'number' },
    { id: 'messages_started', label: 'Msgs Started', format: 'number' },
    { id: 'video_plays', label: 'Vid Plays (3s)', format: 'number' },
    { id: 'video_thruplays', label: 'ThruPlays', format: 'number' },
    { id: 'video_p100', label: '100% Watched', format: 'number' },
    { id: 'reactions', label: 'Reactions', format: 'number' },
    { id: 'comments', label: 'Comments', format: 'number' },
    { id: 'shares', label: 'Shares', format: 'number' },
];

const COST_METRICS = ['spend', 'cpa', 'cpc', 'cpm', 'cost_per_result'];

const getCreativeType = (cre: AdCreative | undefined) => {
    if (!cre) return 'UNKNOWN';
    if (cre.asset_feed_spec) return 'DCO'; // Dynamic Creative
    if (cre.object_type === 'VIDEO' || cre.object_story_spec?.video_data) return 'VIDEO';
    if (cre.object_story_spec?.link_data?.child_attachments) return 'CAROUSEL';
    return 'IMAGE';
};

const getPermalink = (cre: AdCreative | undefined) => {
    if (!cre?.effective_object_story_id) return null;
    return `https://www.facebook.com/${cre.effective_object_story_id}`;
};

// Internal Component for Animated Metrics Scroll
const MetricsCarousel: React.FC<{
    ad: AdPerformance;
    metricOrder: string[];
    selectedMetrics: Set<string>;
    userConfig: UserConfig | undefined;
    isDark: boolean;
    draggedMetric: string | null;
    onDragStart: (e: React.DragEvent, id: string) => void;
    onDragOver: (e: React.DragEvent, id: string) => void;
    onDrop: (e: React.DragEvent, id: string) => void;
    getMetricValue: (ad: AdPerformance, metric: string) => number | string;
    formatCompact: (num: number, format: string) => string;
}> = ({ ad, metricOrder, selectedMetrics, userConfig, isDark, draggedMetric, onDragStart, onDragOver, onDrop, getMetricValue, formatCompact }) => {
    const [page, setPage] = useState(0);

    // Filter visible metrics first
    const visibleMetrics = useMemo(() => {
        return metricOrder.filter(id => {
            if (!selectedMetrics.has(id)) return false;
            // SMART HIDE SPEND LOGIC
            if (userConfig?.hide_total_spend && COST_METRICS.includes(id)) return false;
            return true;
        });
    }, [metricOrder, selectedMetrics, userConfig]);

    const pageSize = 3;
    const totalPages = Math.ceil(visibleMetrics.length / pageSize);
    const hasMore = totalPages > 1;

    // Helper to advance page
    const nextPage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setPage(prev => (prev + 1) % totalPages); // Cycle back to 0
    };

    return (
        <div className="flex flex-col w-full h-full justify-between">
            {/* Main Content Area - Metrics List (Increased height to fit 3 items + gaps) */}
            <div className="relative overflow-hidden h-[125px] w-full border-t border-dashed border-slate-500/20 mt-1 shrink-0">
                <div
                    className="transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] h-full w-full"
                    style={{ transform: `translateY(-${page * 100}%)` }}
                >
                    {Array.from({ length: totalPages }).map((_, pageIndex) => (
                        <div key={pageIndex} className="h-full flex flex-col gap-1.5 pt-2 px-1 pb-2 w-full box-border">
                            {visibleMetrics.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize).map(id => {
                                const metric = AVAILABLE_METRICS.find(m => m.id === id);
                                if (!metric) return null;
                                const val = getMetricValue(ad, metric.id);
                                const isPrimary = metric.id === 'spend' || metric.id === 'roas';
                                const isDragging = draggedMetric === metric.id;

                                return (
                                    <div
                                        key={metric.id}
                                        draggable
                                        onDragStart={(e) => onDragStart(e, metric.id)}
                                        onDragOver={(e) => onDragOver(e, metric.id)}
                                        onDrop={(e) => onDrop(e, metric.id)}
                                        className={`
                                            relative group/metric flex items-center justify-between w-full px-3 py-1.5 rounded-lg border transition-all duration-200 cursor-move select-none
                                            ${isDragging
                                                ? 'opacity-40 scale-95 border-dashed border-brand-500 bg-brand-500/10'
                                                : isDark ? 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800 hover:border-slate-600' : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm'
                                            }
                                        `}
                                    >
                                        <div className="absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover/metric:opacity-100 transition-opacity text-slate-400 cursor-grab active:cursor-grabbing">
                                            <GripHorizontal size={10} />
                                        </div>
                                        <span className={`text-[10px] font-bold tracking-wide uppercase opacity-70 ml-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{metric.label}</span>
                                        <span className={`font-black tracking-tight text-sm ${isPrimary ? 'text-brand-500' : (isDark ? 'text-slate-200' : 'text-slate-900')}`}>
                                            {formatCompact(val as number, metric.format)}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>

            {/* Fancy Horizontal Strip Footer - Sleek & Non-Intrusive */}
            {hasMore ? (
                <div
                    onClick={nextPage}
                    className={`
                        -mx-4 -mb-4 w-[calc(100%+2rem)] h-7 flex items-center justify-center cursor-pointer transition-all duration-500 group/strip relative overflow-hidden mt-2 rounded-b-2xl z-20
                        ${isDark
                            ? 'bg-gradient-to-b from-slate-900 to-slate-950 border-t border-slate-800 hover:from-slate-800 hover:to-slate-900 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]'
                            : 'bg-gradient-to-b from-slate-100 to-slate-200 border-t border-slate-300 hover:from-slate-50 hover:to-slate-100 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4)]'}
                    `}
                >
                    {/* "UI Tech" Hover Glow Effect background */}
                    <div className={`
                        absolute inset-0 opacity-0 group-hover/strip:opacity-100 transition-opacity duration-500
                        bg-gradient-to-r from-transparent via-brand-500/10 to-transparent
                     `} />

                    {/* The Strip Visual Content */}
                    <div className={`
                        relative z-10 w-full flex items-center justify-center gap-2 opacity-90 group-hover/strip:opacity-100 transition-all duration-300
                     `}>
                        {/* Decorative "Tech" Lines - Darker in light mode */}
                        <div className={`h-[1px] w-6 rounded-full transition-all duration-500 group-hover/strip:w-16 ${isDark ? 'bg-gradient-to-r from-transparent to-slate-600' : 'bg-gradient-to-r from-transparent to-slate-400'}`} />

                        {/* The Fancy Arrow Container - High Contrast */}
                        <div className={`
                            flex items-center justify-center w-16 h-4 rounded-full border shadow-sm backdrop-blur-sm transition-all duration-300 group-hover/strip:scale-105 group-hover/strip:shadow-md
                            ${isDark ? 'bg-slate-900/50 border-slate-700 text-brand-400' : 'bg-white border-slate-300 text-slate-700 group-hover/strip:text-brand-600'}
                        `}>
                            <ChevronDown
                                size={12}
                                className={`
                                    transition-all duration-500
                                    ${page === totalPages - 1 ? 'rotate-180' : 'animate-bounce'}
                                `}
                            />
                        </div>

                        <div className={`h-[1px] w-6 rounded-full transition-all duration-500 group-hover/strip:w-16 ${isDark ? 'bg-gradient-to-l from-transparent to-slate-600' : 'bg-gradient-to-l from-transparent to-slate-400'}`} />
                    </div>
                </div>
            ) : (
                /* Spacer to perform layout stability */
                <div className="h-2" />
            )}
        </div>
    );
};

const CreativeHub: React.FC<CreativeHubProps> = ({ token, accountIds, datePreset, theme, filter, userConfig, refreshInterval = 10, refreshTrigger = 0 }) => {
    // TanStack Query Hook
    const { data: ads = [], isLoading: loading } = useCreativePerformance(
        accountIds,
        token,
        datePreset,
        filter,
        {
            refetchInterval: refreshInterval > 0 ? refreshInterval * 60 * 1000 : false,
        }
    );

    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [selectedMetrics, setSelectedMetrics] = useState<Set<string>>(new Set(['spend', 'reach', 'impressions', 'clicks', 'ctr', 'post_engagement', 'roas']));
    const [metricOrder, setMetricOrder] = useState<string[]>(AVAILABLE_METRICS.map(m => m.id));
    const [showMetricsPanel, setShowMetricsPanel] = useState(false);
    const [showSortPanel, setShowSortPanel] = useState(false);

    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'spend', direction: 'desc' });
    const [draggedMetric, setDraggedMetric] = useState<string | null>(null);
    const [zoomLevel, setZoomLevel] = useState(4);
    const [displayCount, setDisplayCount] = useState(12);

    const [selectedAd, setSelectedAd] = useState<AdPerformance | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<string | null>(null);

    // Reset display count on filter change (mimics original behavior)
    useEffect(() => {
        setDisplayCount(12);
    }, [accountIds, datePreset, filter]);

    // Refs for Click Outside
    const sortPanelRef = React.useRef<HTMLDivElement>(null);
    const metricsPanelRef = React.useRef<HTMLDivElement>(null);

    // Click Outside Listener
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (sortPanelRef.current && !sortPanelRef.current.contains(event.target as Node)) {
                setShowSortPanel(false);
            }
            if (metricsPanelRef.current && !metricsPanelRef.current.contains(event.target as Node)) {
                setShowMetricsPanel(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Column Resizing State
    const [colWidths, setColWidths] = useState<{ [key: string]: number }>({});
    const resizingRef = React.useRef<{ key: string; startX: number; startWidth: number } | null>(null);

    // Initialize Default Widths
    useEffect(() => {
        setColWidths(prev => {
            const next = { ...prev };
            if (!next['asset']) next['asset'] = 80;
            if (!next['name']) next['name'] = 250;
            AVAILABLE_METRICS.forEach(m => {
                if (!next[m.id]) next[m.id] = 120;
            });
            if (!next['actions']) next['actions'] = 100;
            return next;
        });
    }, []);

    // Resize Handlers
    const handleResizeStart = (e: React.MouseEvent, key: string) => {
        e.preventDefault();
        e.stopPropagation();
        const startX = e.clientX;
        const startWidth = colWidths[key] || 120;
        resizingRef.current = { key, startX, startWidth };

        const handleMouseMove = (moveEvent: MouseEvent) => {
            if (!resizingRef.current) return;
            const diff = moveEvent.clientX - resizingRef.current.startX;
            const newWidth = Math.max(50, resizingRef.current.startWidth + diff);
            const currentKey = resizingRef.current.key;
            setColWidths(prev => ({ ...prev, [currentKey]: newWidth }));
        };

        const handleMouseUp = () => {
            resizingRef.current = null;
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const handleResetLayout = () => {
        setColWidths({
            'asset': 80,
            'name': 250,
            ...AVAILABLE_METRICS.reduce((acc, m) => ({ ...acc, [m.id]: 120 }), {}),
            'actions': 100
        });
    };

    // Grid Template Builder
    const getGridTemplate = () => {
        const assetW = colWidths['asset'] || 80;
        const nameW = colWidths['name'] || 250;
        const actionW = colWidths['actions'] || 100;
        const metricsW = metricOrder
            .filter(id => selectedMetrics.has(id) && (!userConfig?.hide_total_spend || !COST_METRICS.includes(id)))
            .map(id => `${colWidths[id] || 120}px`)
            .join(' ');
        return `${assetW}px ${nameW}px ${metricsW} ${actionW}px`;
    };


    // Responsive Zoom Default
    useEffect(() => {
        const handleResize = () => {
            const w = window.innerWidth;
            if (w < 768) setZoomLevel(1);      // Mobile
            else if (w < 1024) setZoomLevel(2); // Tablet / Small Laptop
            else if (w < 1440) setZoomLevel(3); // Normal Laptop
            else setZoomLevel(4);              // Large Screen
        };
        handleResize(); // Run on mount
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const multiplier = userConfig?.spend_multiplier || 1.0;
    const disableTags = userConfig?.disable_creative_tags || false;
    const disableAI = userConfig?.disable_ai || false;

    // OLD DATA FETCHING REMOVED

    const getMetricValue = (ad: AdPerformance, metricId: string) => {
        const rawSpend = parseFloat(ad.spend || '0');
        const adjustedSpend = rawSpend * multiplier;

        switch (metricId) {
            case 'created_time': return ad.created_time ? new Date(ad.created_time).getTime() : 0;
            case 'spend': return adjustedSpend;
            case 'roas':
                if (adjustedSpend === 0) return 0;
                const value = rawSpend * (ad.roas || 0);
                return value / adjustedSpend;
            case 'cpa':
                if (!ad.cpa || ad.cpa === 0) return 0;
                const conversions = rawSpend / ad.cpa;
                return conversions > 0 ? adjustedSpend / conversions : 0;
            case 'cpc': return ad.clicks && parseInt(ad.clicks) > 0 ? adjustedSpend / parseInt(ad.clicks) : 0;
            case 'cpm': return ad.impressions && parseInt(ad.impressions) > 0 ? (adjustedSpend / parseInt(ad.impressions)) * 1000 : 0;
            case 'cost_per_result': return ad.results && parseFloat(ad.results) > 0 ? adjustedSpend / parseFloat(ad.results) : 0;
            case 'ctr': return parseFloat(ad.ctr || '0');
            case 'results': return parseInt(ad.results || '0');
            case 'impressions': return parseInt(ad.impressions || '0');
            case 'reach': return parseInt(ad.reach || '0');
            case 'frequency': return parseFloat(ad.frequency || '0');
            case 'clicks': return parseInt(ad.clicks || '0');
            case 'unique_clicks': return parseInt(ad.unique_clicks || '0');
            case 'inline_link_clicks': return parseInt(ad.inline_link_clicks || '0');
            case 'outbound_clicks': return parseInt(ad.outbound_clicks?.find((a: any) => a.action_type === 'outbound_click')?.value || '0');
            case 'post_engagement': return parseInt(ad.inline_post_engagement || ad.actions?.find((a: any) => a.action_type === 'post_engagement')?.value || '0');
            case 'purchases': return parseInt(ad.actions?.find((a: any) => a.action_type === 'purchase' || a.action_type === 'offsite_conversion.fb_pixel_purchase')?.value || '0');
            case 'leads': return parseInt(ad.actions?.find((a: any) => a.action_type === 'lead')?.value || '0');
            case 'messages_started': return parseInt(ad.actions?.find((a: any) => a.action_type === 'onsite_conversion.messaging_conversation_started_7d' || a.action_type === 'messaging_conversation_started_7d')?.value || '0');
            case 'video_plays': return parseInt(ad.video_plays || '0');
            case 'video_thruplays': return parseInt(ad.video_thruplays || '0');
            case 'video_p100': return parseInt(ad.video_p100_watched_actions?.find((a: any) => a.action_type === 'video_view')?.value || '0');
            case 'reactions': return (ad.actions || []).reduce((acc, action) => (action.action_type.startsWith('post_reaction') ? acc + parseInt(action.value) : acc), 0);
            case 'comments': return parseInt(ad.actions?.find((a: any) => a.action_type === 'comment' || a.action_type === 'post_comment')?.value || '0');
            case 'shares': return parseInt(ad.actions?.find((a: any) => a.action_type === 'post' || a.action_type === 'post_share')?.value || '0');
            default: return 0;
        }
    };

    const handleSort = (key: string) => { setSortConfig(c => ({ key, direction: c.key === key && c.direction === 'desc' ? 'asc' : 'desc' })); };

    const sortedAds = useMemo(() => {
        const sorted = [...ads];
        sorted.sort((a, b) => {
            if (sortConfig.key === 'ad_name') return sortConfig.direction === 'asc' ? a.ad_name.localeCompare(b.ad_name) : b.ad_name.localeCompare(a.ad_name);
            // Standard numeric comparison (timestamps work here too)
            const valA = getMetricValue(a, sortConfig.key);
            const valB = getMetricValue(b, sortConfig.key);
            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
        return sorted;
    }, [ads, sortConfig, multiplier]);

    const visibleAds = useMemo(() => sortedAds.slice(0, displayCount), [sortedAds, displayCount]);

    const loadMore = () => setDisplayCount(p => p + 12);

    const handleAnalyze = async (ad: AdPerformance) => {
        setSelectedAd(ad);
        setAnalysisResult(null);
        setIsAnalyzing(true);
        const r = await analyzeCreative(ad);
        setAnalysisResult(r);
        setIsAnalyzing(false);
    };

    const closeModal = () => { setSelectedAd(null); setAnalysisResult(null); };

    const toggleMetric = (id: string) => { const n = new Set(selectedMetrics); n.has(id) ? n.delete(id) : n.add(id); setSelectedMetrics(n); };

    const handleDragStart = (e: React.DragEvent, id: string) => { setDraggedMetric(id); e.dataTransfer.effectAllowed = 'move'; };
    const handleDragOver = (e: React.DragEvent, id: string) => { e.preventDefault(); if (!draggedMetric || draggedMetric === id) return; };
    const handleDrop = (e: React.DragEvent, t: string) => { e.preventDefault(); if (!draggedMetric || draggedMetric === t) return; const o = metricOrder.indexOf(draggedMetric); const n = metricOrder.indexOf(t); if (o !== -1 && n !== -1) { const arr = [...metricOrder]; arr.splice(o, 1); arr.splice(n, 0, draggedMetric); setMetricOrder(arr); } setDraggedMetric(null); };

    const formatCompact = (val: number, type?: string) => {
        if (type === 'date') return new Date(val).toLocaleDateString();
        if (val === undefined || isNaN(val)) return '-';
        if (type === 'percent') return `${val.toFixed(2)}%`;
        if (type === 'roas') return `${val.toFixed(2)}x`;
        let f = val.toString();
        if (Math.abs(val) >= 1000000) f = `${(val / 1000000).toFixed(2)}M`;
        else if (Math.abs(val) >= 1000) f = `${(val / 1000).toFixed(1)}K`;
        else f = val.toLocaleString(undefined, { minimumFractionDigits: type === 'currency' ? 2 : 0 });
        return type === 'currency' ? `$${f}` : f;
    };

    const isDark = theme === 'dark';
    const headingColor = isDark ? 'text-white' : 'text-slate-800';
    const subHeadingColor = isDark ? 'text-slate-400' : 'text-slate-500';
    const stickyHeaderBg = isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white/90 border-slate-300 shadow-sm';
    const cardBg = isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300 shadow-md hover:shadow-xl';
    const cardFooterBg = isDark ? 'bg-slate-900/40' : 'bg-slate-50 border-t border-slate-200';
    const cardText = isDark ? 'text-white' : 'text-slate-900';
    const cardLabel = isDark ? 'text-slate-400' : 'text-slate-600';
    const modalBg = isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200';

    const parseBold = (text: string, isDark: boolean) => {
        const parts = text.split(/(\*\*.*?\*\*)/g);
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i} className={`font-bold ${isDark ? 'text-brand-300' : 'text-brand-700'}`}>{part.slice(2, -2)}</strong>;
            }
            return part;
        });
    };

    const RichTextRenderer = ({ content }: { content: string }) => {
        const lines = content.split('\n');
        return (
            <div className="space-y-3">
                {lines.map((line, idx) => {
                    const trimmed = line.trim();
                    if (!trimmed) return <div key={idx} className="h-1"></div>;
                    if (trimmed.startsWith('#')) {
                        const clean = trimmed.replace(/^#+\s/, '');
                        return <h5 key={idx} className={`font-bold text-md mt-3 mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{parseBold(clean, isDark)}</h5>;
                    }
                    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                        return (
                            <div key={idx} className="flex items-start gap-2 ml-1">
                                <div className={`mt-2 w-1.5 h-1.5 rounded-full shrink-0 ${isDark ? 'bg-slate-500' : 'bg-slate-400'}`}></div>
                                <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                                    {parseBold(trimmed.substring(2), isDark)}
                                </p>
                            </div>
                        );
                    }
                    return (
                        <p key={idx} className={`text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                            {parseBold(trimmed, isDark)}
                        </p>
                    );
                })}
            </div>
        );
    };

    if (loading) return <LoadingSpinner theme={theme} message="Loading Creative Data" bgClass="bg-transparent" />;

    return (
        <div className="space-y-6 relative pb-12 w-full">
            <div className={`flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 p-4 md:p-5 rounded-2xl border backdrop-blur-xl sticky top-0 z-50 transition-all shadow-sm ${stickyHeaderBg}`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between lg:justify-start gap-4 flex-1 min-w-0">
                    <div className="min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                            <h2 className={`text-lg md:text-2xl font-black tracking-tight flex items-center ${headingColor}`}>
                                Ads Hub
                                <span className={`ml-3 px-2 py-0.5 rounded-md text-[10px] md:text-xs font-bold uppercase tracking-wide border shadow-sm ${isDark ? 'bg-brand-500/10 text-brand-300 border-brand-500/20' : 'bg-brand-50 text-brand-700 border-brand-200'}`}>
                                    {ads.length} Assets
                                </span>
                            </h2>
                            {/* Zoom Controls - Integrated near title for better UX */}
                            <div className={`hidden xl:flex items-center gap-0.5 p-0.5 rounded-lg border ml-2 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>
                                <button onClick={() => setZoomLevel(Math.min(zoomLevel + 1, 6))} className="p-1.5 hover:bg-white dark:hover:bg-slate-600 rounded-md transition-all active:scale-95 text-slate-500 hover:text-brand-500" title="Smaller Cards (More Columns)"><ZoomOut size={14} /></button>
                                <button onClick={() => setZoomLevel(Math.max(zoomLevel - 1, 1))} className="p-1.5 hover:bg-white dark:hover:bg-slate-600 rounded-md transition-all active:scale-95 text-slate-500 hover:text-brand-500" title="Larger Cards (Fewer Columns)"><ZoomIn size={14} /></button>
                            </div>
                        </div>
                        <p className={`text-xs md:text-sm font-medium truncate ${subHeadingColor} hidden sm:block`}>AI-powered visual performance audit & creative analysis</p>
                    </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-2 sm:gap-3 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0 no-scrollbar">
                    {/* Sort & Metrics Group */}
                    <div className="flex items-center gap-2 shrink-0">
                        <div className="relative" ref={sortPanelRef}>
                            <button onClick={() => { setShowSortPanel(!showSortPanel); setShowMetricsPanel(false); }} className={`group flex items-center space-x-2 px-3 py-2 md:py-2.5 rounded-xl border text-xs md:text-sm font-bold transition-all active:scale-95 ${isDark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600 hover:text-white' : 'bg-white border-slate-200 hover:border-brand-300 hover:text-brand-600 shadow-sm'}`}>
                                {sortConfig.direction === 'asc' ? <SortAsc size={16} className="text-brand-500" /> : <SortDesc size={16} className="text-brand-500" />}
                                <span className="hidden sm:inline">Sort</span>
                            </button>
                            {/* Sort Dropdown (Kept existing logic) */}
                            {showSortPanel && <div className={`absolute right-0 md:right-0 mt-2 p-2 rounded-xl shadow-2xl border z-[60] w-56 ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                                <div className="max-h-60 overflow-y-auto custom-scrollbar">
                                    {AVAILABLE_METRICS.map(m => {
                                        if (userConfig?.hide_total_spend && COST_METRICS.includes(m.id)) return null;
                                        const isActive = sortConfig.key === m.id;
                                        return (
                                            <button
                                                key={m.id}
                                                onClick={() => { handleSort(m.id); setShowSortPanel(false) }}
                                                className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${isActive ? (isDark ? 'bg-brand-900/20 text-brand-300' : 'bg-brand-50 text-brand-700') : ''}`}
                                            >
                                                <span className="font-medium">{m.label}</span>
                                                {isActive && (
                                                    <div className="flex items-center">
                                                        {sortConfig.direction === 'asc' ? <ArrowUp size={12} className="mr-2" /> : <ArrowDown size={12} className="mr-2" />}
                                                        <Check size={12} />
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>}
                        </div>

                        <div className="relative" ref={metricsPanelRef}>
                            <button onClick={() => { setShowMetricsPanel(!showMetricsPanel); setShowSortPanel(false); }} className={`group flex items-center space-x-2 px-3 py-2 md:py-2.5 rounded-xl border text-xs md:text-sm font-bold transition-all active:scale-95 ${isDark ? 'bg-slate-800 border-slate-700 hover:border-slate-600 hover:text-white' : 'bg-white border-slate-200 hover:border-brand-300 hover:text-brand-600 shadow-sm'}`}>
                                <SlidersHorizontal size={16} className="text-brand-500" />
                                <span>Metrics</span>
                            </button>
                            {/* Metrics Dropdown */}
                            {showMetricsPanel && <div className={`absolute right-0 mt-2 p-4 rounded-xl shadow-2xl border z-[60] w-[85vw] max-w-sm md:w-96 ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                                <div className="flex justify-between items-center mb-3 pb-2 border-b dark:border-slate-800">
                                    <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Visible Metrics</h4>
                                    <button onClick={() => setShowMetricsPanel(false)}><X size={14} /></button>
                                </div>
                                <div className="grid grid-cols-2 gap-2 max-h-[60vh] overflow-y-auto custom-scrollbar">
                                    {AVAILABLE_METRICS.map(m => (
                                        <label key={m.id} className={`flex items-center p-2 rounded-lg cursor-pointer transition-colors ${selectedMetrics.has(m.id) ? (isDark ? 'bg-brand-900/20 text-brand-300' : 'bg-brand-50 text-brand-700') : (isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-50')}`}>
                                            <input type="checkbox" checked={selectedMetrics.has(m.id)} onChange={() => toggleMetric(m.id)} className="mr-3 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
                                            <span className="text-xs font-medium">{m.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>}
                        </div>
                    </div>

                    {/* Divider */}
                    <div className={`w-[1px] h-8 mx-1 hidden sm:block ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />

                    {/* Layout Controls */}
                    <div className={`flex items-center p-1 rounded-xl border shrink-0 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>
                        <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-600 text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`} title="Grid View"><LayoutGrid size={18} /></button>
                        <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-600 text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`} title="List View"><List size={18} /></button>
                    </div>
                </div>
            </div>

            {/* Grid */}
            {(viewMode === 'grid' || window.innerWidth < 768) ? (
                <div
                    className="grid gap-4 w-full transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                    style={{ gridTemplateColumns: `repeat(${zoomLevel}, minmax(0, 1fr))` }}
                >
                    {visibleAds.map((ad, idx) => {
                        const roasVal = getMetricValue(ad, 'roas'); const spendVal = getMetricValue(ad, 'spend');
                        const type = getCreativeType(ad.creative); const permalink = getPermalink(ad.creative); const ctaText = ad.creative?.link_caption?.toUpperCase() || 'LEARN MORE';
                        const isWinner = roasVal > 2.5 && spendVal > 50; const isBleeder = roasVal < 0.8 && spendVal > 50;
                        const caption = ad.creative?.body || ad.creative?.object_story_spec?.link_data?.message || ad.creative?.object_story_spec?.video_data?.message || "No caption available";
                        return (
                            <div key={ad.ad_id} className={`relative flex flex-col ${cardBg} border rounded-2xl group hover:border-brand-500/50 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:shadow-2xl hover:-translate-y-2 hover:scale-[1.02]`}>
                                {/* ... Grid Card Content (Unchanged) ... */}
                                {/* Top Image Section (Profile Style) - Isolated Hover Group */}
                                <div className={`relative h-48 flex items-center justify-center rounded-t-2xl overflow-hidden group/image ${isDark ? 'bg-slate-900/50' : 'bg-slate-50'}`}>
                                    {/* Ambient Blur Background (Fancy Look) */}
                                    <div className="absolute inset-0 z-0 overflow-hidden">
                                        <div
                                            className="absolute inset-0 blur-2xl scale-150 opacity-50 dark:opacity-40 transition-all duration-700 group-hover/image:opacity-70 group-hover/image:scale-175"
                                            style={{ backgroundImage: `url(${ad.creative?.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                                        />
                                        <div className={`absolute inset-0 ${isDark ? 'bg-slate-900/40' : 'bg-white/40'} backdrop-blur-[2px]`} />
                                    </div>

                                    {/* The "Profile Picture" Style Image */}
                                    <div className="relative z-10 w-28 h-28 rounded-2xl overflow-hidden shadow-2xl border-4 border-white/5 dark:border-white/5 group-hover/image:scale-105 transition-transform duration-500">
                                        {ad.creative?.image_url ? (
                                            <img src={ad.creative.image_url} alt={ad.ad_name} className="w-full h-full object-cover bg-slate-800" loading="lazy" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-slate-800"><Image size={32} className="opacity-20 text-white" /></div>
                                        )}
                                        {/* Type Badge on Image */}
                                        <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[8px] font-bold backdrop-blur-md bg-black/50 text-white border border-white/10 uppercase tracking-wider">
                                            {type}
                                        </div>
                                    </div>

                                    {/* Status Badges (Floating) */}
                                    {!disableTags && (
                                        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-20">
                                            {isWinner && <div className="bg-amber-500 text-white px-2 py-0.5 rounded-full text-[9px] font-bold shadow-lg flex items-center animate-pulse"><Crown size={10} className="mr-1" /> WINNER</div>}
                                            {isBleeder && <div className="bg-rose-500 text-white px-2 py-0.5 rounded-full text-[9px] font-bold shadow-lg flex items-center"><AlertTriangle size={10} className="mr-1" /> FATIGUE</div>}
                                        </div>
                                    )}
                                    {!disableTags && (
                                        <div className="absolute top-3 right-3 z-20">
                                            <div className={`px-2 py-0.5 rounded-full text-[9px] font-black tracking-wide backdrop-blur-md border shadow-sm ${roasVal >= 2.5 ? 'bg-emerald-500/90 text-white border-emerald-400/50' : 'bg-slate-800/90 text-slate-300 border-white/10'}`}>
                                                {roasVal.toFixed(2)}x ROAS
                                            </div>
                                        </div>
                                    )}

                                    {/* Hover Overlay Actions - Triggers only on Image Hover */}
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/image:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 z-30 p-4 backdrop-blur-[2px]">
                                        {!disableAI && (
                                            <button onClick={() => handleAnalyze(ad)} className="w-40 bg-white hover:bg-slate-200 text-brand-950 px-3 py-2 rounded-lg font-bold text-xs flex items-center justify-center shadow-2xl transition-transform hover:scale-105">
                                                <Sparkles size={14} className="mr-2 text-brand-600" /> AI Dive
                                            </button>
                                        )}
                                        {permalink && (
                                            <a href={permalink} target="_blank" rel="noopener noreferrer" className="w-40 bg-slate-800/90 hover:bg-slate-700 text-white border border-slate-600 px-3 py-2 rounded-lg font-bold text-xs flex items-center justify-center shadow-2xl transition-transform hover:scale-105">
                                                <ExternalLink size={14} className="mr-2" /> View Post
                                            </a>
                                        )}
                                    </div>
                                </div>

                                {/* Content Section (Metrics & Caption) - Rounded Bottom */}
                                <div className={`p-4 rounded-b-2xl ${cardFooterBg} flex-1 flex flex-col relative border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                                    <div className="mb-3 space-y-1">
                                        <div className="flex flex-col">
                                            <span className={`text-[9px] uppercase font-bold tracking-widest opacity-50 ${isDark ? 'text-brand-300' : 'text-brand-700'}`}>Ad Name</span>
                                            <h4 className={`${cardText} text-sm font-bold truncate`} title={ad.ad_name}>{ad.ad_name}</h4>
                                        </div>

                                        {/* Caption with Hover Overlay */}
                                        <div className="relative group/caption cursor-help">
                                            <p className={`text-[10px] leading-relaxed line-clamp-2 opacity-60 ${cardText}`}>
                                                {caption}
                                            </p>
                                            {/* Beautiful Glossy Overlay */}
                                            <div className="opacity-0 group-hover/caption:opacity-100 transition-all duration-300 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-4 rounded-xl shadow-2xl bg-slate-900/95 backdrop-blur-xl border border-white/10 text-white text-xs leading-relaxed z-50 pointer-events-none translate-y-2 group-hover/caption:translate-y-0 w-64">
                                                <div className="font-bold mb-1 text-brand-400 text-[10px] uppercase tracking-wider">Full Caption</div>
                                                {caption}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Metrics Grid (Animated Carousel) */}
                                    <MetricsCarousel
                                        ad={ad}
                                        metricOrder={metricOrder}
                                        selectedMetrics={selectedMetrics}
                                        userConfig={userConfig}
                                        isDark={isDark}
                                        draggedMetric={draggedMetric}
                                        onDragStart={(e, id) => handleDragStart(e, id)}
                                        onDragOver={(e, id) => handleDragOver(e, id)}
                                        onDrop={(e, id) => handleDrop(e, id)}
                                        getMetricValue={getMetricValue}
                                        formatCompact={formatCompact}
                                    />
                                </div>
                            </div>
                        )
                    })}
                </div>
            ) : (
                /* NEW ELITE LIST COMPONENT */
                <CreativeList
                    ads={visibleAds}
                    metricOrder={metricOrder}
                    selectedMetrics={selectedMetrics}
                    sortConfig={sortConfig}
                    onSort={handleSort}
                    colWidths={colWidths}
                    onResizeStart={handleResizeStart}
                    getGridTemplate={getGridTemplate}
                    isDark={isDark}
                    userConfig={userConfig}
                    getMetricValue={getMetricValue}
                    formatCompact={formatCompact}
                    handleAnalyze={handleAnalyze}
                    getPermalink={getPermalink}
                    getCreativeType={getCreativeType}
                    handleDragStart={handleDragStart}
                    handleDragOver={handleDragOver}
                    handleDrop={handleDrop}
                    COST_METRICS={COST_METRICS}
                    AVAILABLE_METRICS={AVAILABLE_METRICS}
                />
            )}

            {/* ... Load More & Modal ... */}
            {displayCount < ads.length && (
                <div className="flex justify-center py-12 relative z-10">
                    <button
                        onClick={loadMore}
                        className={`
                            group relative overflow-hidden rounded-full px-12 py-5 
                            bg-brand-600 text-white font-bold tracking-widest uppercase text-xs
                            shadow-[0_0_40px_rgba(79,70,229,0.3)]
                            transition-all duration-300 hover:scale-105 hover:shadow-[0_0_60px_rgba(79,70,229,0.5)] active:scale-95
                        `}
                    >
                        <span className="relative z-10 flex items-center gap-2">
                            Load 12 More Assets <ArrowDown size={14} className="animate-bounce" />
                        </span>
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                    </button>
                </div>
            )}
            {selectedAd && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className={`w-full max-w-5xl max-h-[90vh] rounded-2xl border shadow-2xl overflow-hidden flex flex-col md:flex-row ${modalBg}`}>
                        <div className="w-full md:w-5/12 bg-black flex flex-col items-center justify-center p-8 relative">
                            <div className="absolute inset-0 opacity-30 bg-cover bg-center blur-3xl" style={{ backgroundImage: `url(${selectedAd.creative?.image_url})` }}></div>
                            <img src={selectedAd.creative?.image_url} className="max-h-full max-w-full object-contain rounded-lg shadow-2xl relative z-10 border border-slate-700/50" />
                        </div>
                        <div className="w-full md:w-7/12 flex flex-col relative">
                            <div className={`p-6 border-b flex justify-between items-start ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                                <div><h3 className={`text-xl font-bold flex items-center ${cardText}`}><Sparkles className="mr-2 text-brand-500" size={20} /> AI Deep Dive</h3></div>
                                <button onClick={closeModal}><X size={24} className={cardLabel} /></button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                                {isAnalyzing ? <div className="flex flex-col items-center justify-center h-full py-12"><Sparkles size={32} className="text-brand-500 animate-pulse" /><p className="text-slate-500 mt-4">Analyzing...</p></div> : <div className="prose prose-sm max-w-none">{analysisResult && <RichTextRenderer content={analysisResult} />}</div>}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* DEBUG OVERLAY REMOVED */}
        </div>
    );
};

export default CreativeHub;