
import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, AreaChart, Area, Cell, Legend, ComposedChart, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Label,
    ScatterChart, Scatter, ZAxis, ReferenceLine
} from 'recharts';
import { Sparkles, Users, Globe, Monitor, Zap, Clock, Smartphone, Filter, Briefcase, MessageCircle, Heart, DollarSign, ChevronDown, Target, Instagram, Facebook, Share2, ArrowRight, TrendingUp, TrendingDown, Info, Trophy } from 'lucide-react';
import StatCard from '../components/StatCard';
import LoadingSpinner from '../components/LoadingSpinner'; // Unified Loading
import {
    fetchAccountInsights,
    fetchCampaignsWithInsights,
    fetchBreakdown,
    fetchDailyAccountInsights,
    fetchHourlyInsights,
    fetchPlacementBreakdown,
    getPreviousPeriod
} from '../services/metaService';
import { analyzeCampaignPerformance } from '../services/aiService';
import { Campaign, InsightData, DateSelection, DailyInsight, HourlyInsight, Theme, GlobalFilter, UserConfig } from '../types';

interface DashboardProps {
    token: string;
    accountIds: string[];
    datePreset: DateSelection;
    theme: Theme;
    filter: GlobalFilter;
    userConfig?: UserConfig;
    refreshInterval?: number;
    refreshTrigger?: number;
}

type DashboardProfile = 'sales' | 'engagement' | 'leads' | 'messenger';

const COLORS = {
    blue: '#0055ff', // Brand blue
    purple: '#8b5cf6',
    emerald: '#10b981',
    orange: '#f59e0b',
    pink: '#ec4899',
    slate: '#64748b'
};

const PROFILE_CONFIG = {
    sales: {
        label: 'Sales Kit',
        icon: DollarSign,
        cards: [
            { id: 'spend', label: 'Total Spend', format: 'currency', color: '#0055ff' },
            { id: 'roas', label: 'Return on Ad Spend', format: 'number', suffix: 'x', color: '#10b981' },
            { id: 'cpa', label: 'Cost Per Acquisition', format: 'currency', color: '#ec4899', reverseColor: true },
            { id: 'ctr', label: 'Click Through Rate', format: 'percent', color: '#f59e0b' }
        ],
        mainChart: {
            bar: { key: 'spend', color: '#0055ff', name: 'Spend', axisLabel: 'SPEND ($)' },
            line: { key: 'roas', color: '#10b981', name: 'ROAS', axisLabel: 'ROAS (x)' },
            title: 'Spend vs. ROAS Trend'
        },
        secondary1: { key: 'ctr', color: '#f59e0b', title: 'CTR Performance', axisLabel: 'CTR (%)' },
        secondary2: { key: 'clicks', color: '#8b5cf6', title: 'Daily Volume (Clicks)', axisLabel: 'CLICKS' },
        funnel: ['Impressions', 'Clicks', 'Link Clicks', 'Purchases'],
        breakdownMetric: 'spend'
    },
    engagement: {
        label: 'Engagement',
        icon: Heart,
        cards: [
            { id: 'spend', label: 'Total Spend', format: 'currency', color: '#64748b' },
            { id: 'reach', label: 'Reach', format: 'number', color: '#0055ff' },
            { id: 'impressions', label: 'Impressions', format: 'number', color: '#8b5cf6' },
            { id: 'post_engagement', label: 'Post Engagements', format: 'number', color: '#ec4899' }
        ],
        mainChart: {
            bar: { key: 'reach', color: '#0055ff', name: 'Reach', axisLabel: 'REACH' },
            line: { key: 'impressions', color: '#8b5cf6', name: 'Impressions', axisLabel: 'IMPRESSIONS' },
            title: 'Reach vs. Impressions Trend'
        },
        secondary1: { key: 'engagement_rate', color: '#ec4899', title: 'Engagement Rate', axisLabel: 'ENG. RATE (%)' },
        secondary2: { key: 'post_engagement', color: '#8b5cf6', title: 'Post Engagements', axisLabel: 'ENGAGEMENTS' },
        funnel: ['Reach', 'Impressions', 'Clicks', 'Post Engagements'],
        breakdownMetric: 'impressions'
    },
    leads: {
        label: 'Leads Gen',
        icon: Briefcase,
        cards: [
            { id: 'spend', label: 'Total Spend', format: 'currency', color: '#64748b' },
            { id: 'reach', label: 'Reach', format: 'number', color: '#0055ff' },
            { id: 'impressions', label: 'Impressions', format: 'number', color: '#8b5cf6' },
            { id: 'leads', label: 'Leads', format: 'number', color: '#10b981' }
        ],
        mainChart: {
            bar: { key: 'reach', color: '#0055ff', name: 'Reach', axisLabel: 'REACH' },
            line: { key: 'impressions', color: '#8b5cf6', name: 'Impressions', axisLabel: 'IMPRESSIONS' },
            title: 'Reach vs. Impressions Trend'
        },
        secondary1: { key: 'ctr', color: '#f59e0b', title: 'CTR Performance', axisLabel: 'CTR (%)' },
        secondary2: { key: 'leads', color: '#10b981', title: 'Lead Volume', axisLabel: 'LEADS' },
        funnel: ['Reach', 'Impressions', 'Clicks', 'Leads'],
        breakdownMetric: 'impressions'
    },
    messenger: {
        label: 'Messenger',
        icon: MessageCircle,
        cards: [
            { id: 'spend', label: 'Total Spend', format: 'currency', color: '#64748b' },
            { id: 'reach', label: 'Reach', format: 'number', color: '#0055ff' },
            { id: 'impressions', label: 'Impressions', format: 'number', color: '#8b5cf6' },
            { id: 'messaging_conversations', label: 'Conversations', format: 'number', color: '#0055ff' }
        ],
        mainChart: {
            bar: { key: 'reach', color: '#0055ff', name: 'Reach', axisLabel: 'REACH' },
            line: { key: 'impressions', color: '#8b5cf6', name: 'Impressions', axisLabel: 'IMPRESSIONS' },
            title: 'Reach vs. Impressions Trend'
        },
        secondary1: { key: 'ctr', color: '#f59e0b', title: 'CTR Performance', axisLabel: 'CTR (%)' },
        secondary2: { key: 'messaging_conversations', color: '#0055ff', title: 'Conversations Started', axisLabel: 'MSGS' },
        funnel: ['Reach', 'Impressions', 'Clicks', 'Conversations'],
        breakdownMetric: 'impressions'
    }
};

const getHeatmapColor = (val: number, max: number, metric: string) => {
    if (max === 0 || val === 0) return 'bg-slate-50 dark:bg-slate-800/50 text-slate-300 dark:text-slate-600';
    const ratio = val / max;

    if (metric === 'ctr') {
        if (ratio >= 0.9) return 'bg-yellow-500 text-white font-bold shadow-sm';
        if (ratio >= 0.7) return 'bg-yellow-400 text-yellow-950 font-medium';
        if (ratio >= 0.5) return 'bg-yellow-300 text-yellow-900';
        if (ratio >= 0.25) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
        return 'bg-slate-50 text-slate-400 dark:bg-slate-800/50 dark:text-slate-500';
    }

    // Default (Impressions/Reach/Clicks)
    if (ratio >= 0.9) return 'bg-brand-600 text-white font-bold shadow-sm';
    if (ratio >= 0.7) return 'bg-brand-500 text-white font-medium';
    if (ratio >= 0.5) return 'bg-brand-400 text-white';
    if (ratio >= 0.25) return 'bg-brand-100 text-brand-900 dark:bg-brand-900/30 dark:text-brand-400';
    return 'bg-slate-50 text-slate-400 dark:bg-slate-800/50 dark:text-slate-500';
};

const Dashboard: React.FC<DashboardProps> = ({ token, accountIds, datePreset, theme, filter, userConfig, refreshInterval = 10, refreshTrigger = 0 }) => {
    const [loading, setLoading] = useState(true);
    const [accountData, setAccountData] = useState<InsightData | null>(null);
    const [prevAccountData, setPrevAccountData] = useState<InsightData | null>(null);
    const [dailyData, setDailyData] = useState<DailyInsight[]>([]);
    const [hourlyData, setHourlyData] = useState<HourlyInsight[]>([]);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [visiblePlacements, setVisiblePlacements] = useState(5);

    // Apply Permissions
    const multiplier = userConfig?.spend_multiplier || 1.0;
    const hideTotalSpend = userConfig?.hide_total_spend || false;
    const disableAi = userConfig?.disable_ai || false;
    // Fallback to all if none specified, or if userRole is admin (passed config might be undefined for admin sometimes but usually we rely on userConfig)
    const allowedProfiles = userConfig?.allowed_profiles && userConfig.allowed_profiles.length > 0
        ? userConfig.allowed_profiles
        : ['sales', 'engagement', 'leads', 'messenger'];

    // Initialize Profile State based on permissions
    const [profile, setProfile] = useState<DashboardProfile>(() => {
        // If default 'sales' is allowed, use it. Otherwise use the first allowed one.
        if (allowedProfiles.includes('sales')) return 'sales';
        return (allowedProfiles[0] as DashboardProfile) || 'sales';
    });

    // Effect: Force profile switch if current profile is no longer allowed (e.g. revoked in real-time or initial mismatch)
    useEffect(() => {
        if (!allowedProfiles.includes(profile)) {
            const nextProfile = (allowedProfiles[0] as DashboardProfile) || 'sales';
            setProfile(nextProfile);
        }
    }, [allowedProfiles, profile]);

    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

    const [ageGenderData, setAgeGenderData] = useState<any[]>([]);
    const [placementData, setPlacementData] = useState<any[]>([]);
    const [regionData, setRegionData] = useState<any[]>([]);

    // AI State
    const [analyzing, setAnalyzing] = useState(false);
    const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
    const [showAllPlacements, setShowAllPlacements] = useState(false); // Mobile UX: Show all placements
    const aiAuditRef = useRef<HTMLDivElement>(null); // Mobile UX: Scroll target

    const [activeTab, setActiveTab] = useState<'overview' | 'audience' | 'platform' | 'time'>('overview');

    const [heatmapMetric, setHeatmapMetric] = useState<'impressions' | 'reach' | 'clicks' | 'ctr'>('impressions');

    const isDark = theme === 'dark';

    const styles = {
        cardBg: isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)]',
        heading: isDark ? 'text-white' : 'text-slate-900',
        textSub: isDark ? 'text-slate-400' : 'text-slate-500',
        chartGrid: isDark ? '#1e293b' : '#f1f5f9',
        chartAxis: isDark ? '#64748b' : '#94a3b8',
        tooltipBg: isDark ? '#0f172a' : '#ffffff',
        tooltipBorder: isDark ? '#334155' : '#e2e8f0',
        tooltipText: isDark ? '#fff' : '#1e293b',
        tabActive: 'text-brand-500 border-brand-500',
        tabInactive: isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-500 hover:text-slate-800'
    };

    const formatCompact = (val: number, key?: string) => {
        const isCurrency = ['spend', 'cpc', 'cpa', 'cost_per_result', 'roas'].includes(key || '');
        const isPercent = ['ctr', 'engagement_rate'].includes(key || '');

        if (isPercent) return `${val.toFixed(2)}%`;

        let formatted = val.toString();
        if (val >= 1000000) {
            formatted = `${(val / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
        } else if (val >= 1000) {
            formatted = `${(val / 1000).toFixed(1).replace(/\.0$/, '')}K`;
        } else {
            formatted = val.toFixed(0);
        }

        if (key === 'roas') return `${val.toFixed(2)}x`;
        if (isCurrency && key !== 'roas') return `$${formatted}`;

        return formatted;
    };

    const getMetricValue = (source: any, key: string) => {
        if (!source) return 0;

        if (key === 'spend') {
            return parseFloat(source.spend || '0') * multiplier;
        }

        if (key === 'cpa') {
            const spend = parseFloat(source.spend || '0') * multiplier;
            let conv = 0;

            if (profile === 'sales') {
                let action = source.actions?.find((a: any) => a.action_type === 'omni_purchase');
                if (!action) action = source.actions?.find((a: any) => a.action_type === 'purchase');
                if (!action) action = source.actions?.find((a: any) => a.action_type === 'offsite_conversion.fb_pixel_purchase');
                if (!action) action = source.actions?.find((a: any) => a.action_type.toLowerCase().includes('purchase'));

                conv = parseInt(action?.value || '0');
            }
            else if (profile === 'leads') conv = parseInt(source.actions?.find((a: any) => a.action_type === 'lead')?.value || '0');
            else if (profile === 'messenger') conv = parseInt(source.actions?.find((a: any) => a.action_type === 'messaging_conversation_started_7d')?.value || '0');

            if (conv === 0) conv = parseInt(source.actions?.find((a: any) => ['purchase', 'lead'].includes(a.action_type))?.value || '0');

            return conv > 0 ? spend / conv : 0;
        }

        if (key === 'roas') {
            const spend = parseFloat(source.spend || '0') * multiplier;
            if (spend === 0) return 0;

            const actionValues = source.action_values || [];
            let purchaseValueObj = actionValues.find((v: any) => v.action_type === 'omni_purchase');
            if (!purchaseValueObj) purchaseValueObj = actionValues.find((v: any) => v.action_type === 'purchase');
            if (!purchaseValueObj) purchaseValueObj = actionValues.find((v: any) => v.action_type === 'offsite_conversion.fb_pixel_purchase');

            const purchaseValue = purchaseValueObj ? parseFloat(purchaseValueObj.value) : 0;
            return purchaseValue / spend;
        }

        if (key === 'post_engagement' || key === 'leads' || key === 'messaging_conversations') {
            const mapping = {
                'post_engagement': 'post_engagement',
                'leads': 'lead',
                'messaging_conversations': 'messaging_conversation_started_7d'
            };
            return parseInt(source.actions?.find((a: any) => a.action_type.includes(mapping[key as keyof typeof mapping]))?.value || '0');
        }

        return parseFloat(source[key] || '0');
    };

    const calculateTrend = (metricKey: string, currentValue: number) => {
        if (!prevAccountData) return 0;
        const prevValue = getMetricValue(prevAccountData, metricKey);
        if (prevValue === 0) return 0;
        return parseFloat((((currentValue - prevValue) / prevValue) * 100).toFixed(1));
    };

    const loadData = async (isBackgroundRefresh = false) => {
        // Only show full spinner on initial load to avoid dark flicker on refresh
        if (!isBackgroundRefresh) setLoading(true);

        try {
            const appliedFilter = {
                ...filter,
                selectedCampaignIds: userConfig?.global_campaign_filter?.length ? userConfig.global_campaign_filter : filter.selectedCampaignIds
            };

            const prevRange = getPreviousPeriod(datePreset);

            const promises: Promise<any>[] = [
                fetchAccountInsights(accountIds, token, datePreset, appliedFilter),
                fetchDailyAccountInsights(accountIds, token, datePreset, appliedFilter),
                fetchHourlyInsights(accountIds, token, datePreset, appliedFilter),
                fetchCampaignsWithInsights(accountIds, token, datePreset, appliedFilter),
                fetchBreakdown(accountIds, token, datePreset, 'age,gender', appliedFilter),
                fetchPlacementBreakdown(accountIds, token, datePreset, appliedFilter),
                fetchBreakdown(accountIds, token, datePreset, 'region', appliedFilter),
            ];

            if (prevRange) {
                promises.push(fetchAccountInsights(accountIds, token, prevRange, appliedFilter));
            } else {
                promises.push(Promise.resolve(null));
            }

            const [accInsights, dayData, hourData, campData, demoData, placeData, regData, prevAccInsights] = await Promise.all(promises);

            setAccountData(accInsights);
            setPrevAccountData(prevAccInsights);

            // Apply multiplier to daily data for charts
            const adjustedDaily = (dayData as any[]).map(d => ({
                ...d,
                spend: d.spend * multiplier,
                roas: (d.spend * multiplier) > 0 ? (d.roas * d.spend) / (d.spend * multiplier) : 0,
                cpc: (d.spend * multiplier) / (d.clicks || 1)
            }));

            setDailyData([...adjustedDaily].sort((a: any, b: any) => new Date(a.date_start).getTime() - new Date(b.date_start).getTime()));
            setHourlyData(hourData);
            setCampaigns(campData?.data || []);
            setAgeGenderData(demoData);
            setPlacementData(placeData);
            setRegionData(regData);

        } catch (e) {
            console.error("Dashboard Load Error", e);
        } finally {
            if (!isBackgroundRefresh) setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [token, accountIds, datePreset, filter, refreshTrigger]);

    // Auto-Refresh Logic
    useEffect(() => {
        if (!refreshInterval || refreshInterval <= 0) return;
        const intervalId = setInterval(() => {
            console.log(`Auto-refreshing dashboard data (every ${refreshInterval}m)`);
            loadData(true);
        }, refreshInterval * 60 * 1000);

        return () => clearInterval(intervalId);
    }, [token, accountIds, datePreset, filter, refreshInterval]);

    const activeConfig = useMemo(() => {
        const base = PROFILE_CONFIG[profile];
        if (!hideTotalSpend) return base;

        const hidden = ['spend', 'cpc', 'cpa', 'cpm', 'cost_per_result', 'roas'];

        // Filter cards
        const newCards = base.cards.filter(c => !hidden.includes(c.id));

        // Adjust Main Chart if it uses hidden metrics
        let newMainChart = { ...base.mainChart };
        if (hidden.includes(newMainChart.bar.key) || hidden.includes(newMainChart.line.key)) {
            newMainChart = {
                bar: { key: 'reach', color: '#0055ff', name: 'Reach', axisLabel: 'REACH' },
                line: { key: 'impressions', color: '#8b5cf6', name: 'Impressions', axisLabel: 'IMPRESSIONS' },
                title: 'Reach vs. Impressions'
            };
        }

        // Adjust Breakdown Metric if hidden
        let newBreakdown = base.breakdownMetric;
        if (hidden.includes(newBreakdown)) {
            newBreakdown = 'impressions';
        }

        return {
            ...base,
            cards: newCards,
            mainChart: newMainChart,
            breakdownMetric: newBreakdown
        };
    }, [profile, hideTotalSpend]);

    const processedFunnelData = useMemo(() => {
        if (!accountData) return [];

        let purchaseAction = accountData.actions?.find((a: any) => a.action_type === 'omni_purchase');
        if (!purchaseAction) purchaseAction = accountData.actions?.find((a: any) => a.action_type === 'purchase');

        const metrics = {
            'Reach': parseInt(accountData.reach || '0'),
            'Impressions': parseInt(accountData.impressions || '0'),
            'Clicks': parseInt(accountData.clicks || '0'),
            'Link Clicks': parseInt(accountData.inline_link_clicks || '0'),
            'Post Engagements': parseInt(accountData.actions?.find((a: any) => a.action_type === 'post_engagement')?.value || '0'),
            'Leads': parseInt(accountData.actions?.find((a: any) => a.action_type === 'lead')?.value || '0'),
            'Conversations': parseInt(accountData.actions?.find((a: any) => a.action_type === 'onsite_conversion.messaging_conversation_started_7d' || a.action_type === 'messaging_conversation_started_7d')?.value || '0'),
            'Purchases': parseInt(purchaseAction?.value || '0'),
        };

        const fills = [COLORS.blue, COLORS.purple, COLORS.pink, COLORS.emerald];

        return activeConfig.funnel.map((stepName, idx) => ({
            name: stepName,
            value: metrics[stepName as keyof typeof metrics] || 0,
            fill: fills[idx % fills.length]
        }));
    }, [accountData, profile]);

    const processedDemographics = useMemo(() => {
        const metricKey = activeConfig.breakdownMetric;
        const ageGroups = Array.from(new Set(ageGenderData.map(d => d.age))).sort();
        return ageGroups.map(age => {
            const male = ageGenderData.find(d => d.age === age && d.gender === 'male');
            const female = ageGenderData.find(d => d.age === age && d.gender === 'female');

            const factor = metricKey === 'spend' ? multiplier : 1;

            return {
                age,
                Male: parseFloat(male?.[metricKey] || '0') * factor,
                Female: parseFloat(female?.[metricKey] || '0') * factor,
            };
        });
    }, [ageGenderData, profile, multiplier]);

    const processedRegions = useMemo(() => {
        const metricKey = activeConfig.breakdownMetric;
        return regionData.slice(0, 10).map(d => {
            const val = parseFloat(d?.[metricKey] || '0') * (metricKey === 'spend' ? multiplier : 1);
            // const spend = parseFloat(d.spend || '1') * multiplier; // ROAS no longer needed
            // const reach = parseInt(d.reach || '0');
            // const impressions = parseInt(d.impressions || '0');
            const clicks = parseInt(d.clicks || '0');

            // Defined by User Request: Top Regions by Spend (Primary) vs Clicks (Secondary)
            // Primary is typically spend for this chart header "Top Regions by Spend"
            // Secondary replaces ROAS with Clicks

            return {
                name: d.region || 'Unknown',
                value: val, // Keep primary as Spend (or whatever breakdownMetric is, usually spend)
                secondaryValue: clicks
            }
        }).sort((a, b) => b.value - a.value);
    }, [regionData, profile, multiplier, activeConfig.breakdownMetric]);

    const processedPlacements = useMemo(() => {
        return placementData
            .map(d => {
                const impr = parseInt(d.impressions || '0');
                const spend = parseFloat(d.spend || '0') * multiplier;

                const postEng = parseInt(d.actions?.find((a: any) => a.action_type === 'post_engagement')?.value || '0');
                const leads = parseInt(d.actions?.find((a: any) => a.action_type === 'lead')?.value || '0');
                const msgs = parseInt(d.actions?.find((a: any) => a.action_type === 'onsite_conversion.messaging_conversation_started_7d' || a.action_type === 'messaging_conversation_started_7d')?.value || '0');

                const actionValues = d.action_values || [];
                let purchaseVal = actionValues.find((v: any) => v.action_type === 'omni_purchase')?.value;
                if (!purchaseVal) purchaseVal = actionValues.find((v: any) => v.action_type === 'purchase')?.value;
                const roas = spend > 0 ? (parseFloat(purchaseVal || '0') / spend) : 0;

                let efficiency = 0;
                let efficiencyLabel = '';
                let volume = 0;
                let volumeLabel = '';

                if (profile === 'sales') {
                    if (userConfig?.hide_total_spend) {
                        // FALLBACK: Use Engagement Metrics if Finance is Hidden
                        volume = impr;
                        volumeLabel = 'Impressions';
                        efficiency = postEng;
                        efficiencyLabel = 'Engagements';
                    } else {
                        volume = spend;
                        volumeLabel = 'Spend';
                        efficiency = roas;
                        efficiencyLabel = 'ROAS';
                    }
                } else if (profile === 'leads') {
                    volume = impr;
                    volumeLabel = 'Impressions';
                    efficiency = leads;
                    efficiencyLabel = 'Leads';
                } else if (profile === 'engagement') {
                    volume = impr;
                    volumeLabel = 'Impressions';
                    efficiency = postEng;
                    efficiencyLabel = 'Engagements';
                } else if (profile === 'messenger') {
                    volume = impr;
                    volumeLabel = 'Impressions';
                    efficiency = msgs;
                    efficiencyLabel = 'Msg Received';
                }

                return {
                    name: `${d.publisher_platform} - ${d.platform_position}`,
                    platform: d.publisher_platform,
                    position: d.platform_position,
                    value: volume,
                    volumeLabel,
                    efficiency,
                    efficiencyLabel,
                    spend,
                    reach: parseInt(d.reach || '0'),
                    impressions: impr,
                    roas,
                    post_engagement: postEng,
                    leads,
                    messaging_conversations: msgs
                };
            })
            .sort((a, b) => b.value - a.value);
    }, [placementData, profile, multiplier]);

    const handleRunAI = async () => {
        // Mobile UX: Auto-scroll to AI Audit section if layout is stacked (lg breakpoint is 1024px)
        if (window.innerWidth < 1024 && aiAuditRef.current) {
            aiAuditRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        if (campaigns.length === 0) return;
        setAnalyzing(true);
        const result = await analyzeCampaignPerformance(campaigns);
        setAiAnalysis(result.analysis);
        setAnalyzing(false);
    };

    const formatDateAxis = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const getHeatmapSummary = () => {
        if (!hourlyData || hourlyData.length === 0) return null;

        // Metrics to analyze
        const metrics = ['impressions', 'reach', 'clicks', 'ctr'] as const;

        // Calculate peaks for all metrics
        const peaks = metrics.map(m => {
            const peak = hourlyData.reduce((prev, curr) => prev[m] > curr[m] ? prev : curr);
            return { metric: m, hour: peak.hour, value: peak[m] };
        });

        return (
            <div className={`mt-6 space-y-4`}>
                {/* Multi-Metric Insight Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {peaks.map((p, idx) => {
                        const mName = p.metric === 'ctr' ? 'CTR' : p.metric.charAt(0).toUpperCase() + p.metric.slice(1);
                        const isSelected = heatmapMetric === p.metric;

                        return (
                            <div key={idx} className={`relative p-4 rounded-xl border transition-all duration-300 overflow-hidden ${isSelected
                                ? (isDark ? 'bg-brand-900/40 border-brand-500/50 shadow-lg shadow-brand-500/10' : 'bg-brand-50 border-brand-200 shadow-lg shadow-brand-500/10')
                                : (isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200')
                                }`}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className={`text-xs font-bold uppercase tracking-wider ${isSelected ? 'text-brand-500' : 'text-slate-500'}`}>{mName} Peak</span>
                                    {isSelected && <div className="w-2 h-2 rounded-full bg-brand-500 animate-pulse"></div>}
                                </div>
                                <div className="flex items-end space-x-2">
                                    <span className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{p.hour}:00</span>
                                    <span className={`text-sm mb-1 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                        ({formatCompact(p.value, p.metric === 'ctr' ? 'percent' : '')})
                                    </span>
                                </div>
                                {isSelected && (
                                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-500 to-blue-500"></div>
                                )}
                            </div>
                        )
                    })}
                </div>

                {/* Smart Summary Text */}
                <div className={`p-5 rounded-xl border flex items-start space-x-4 ${isDark ? 'bg-gradient-to-r from-slate-800 to-slate-900 border-slate-700' : 'bg-gradient-to-r from-slate-50 to-white border-slate-200'} shadow-sm`}>
                    <div className={`p-3 rounded-full shrink-0 ${isDark ? 'bg-brand-900/40 text-brand-400 border border-brand-500/20' : 'bg-brand-100 text-brand-600 border border-brand-200'}`}>
                        <Sparkles size={20} className="animate-pulse" />
                    </div>
                    <div>
                        <h4 className={`text-base font-bold mb-1 flex items-center ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            AI Optimization Insight
                        </h4>
                        <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                            Based on the <strong>{heatmapMetric === 'ctr' ? 'Click-Through Rate' : heatmapMetric}</strong> analysis, your peak activity window is around <strong className={isDark ? 'text-white' : 'text-slate-900'}>{peaks.find(p => p.metric === heatmapMetric)?.hour}:00</strong>.
                            Increasing bid caps by <span className="text-emerald-500 font-bold">15-20%</span> during this window could maximize your <strong>{heatmapMetric}</strong> efficiency.
                            Conversely, consider reducing spend during off-peak hours (01:00 - 05:00) where engagement drops significantly.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (loading) {
        return <LoadingSpinner theme={theme} message="Loading Dashboard" bgClass="bg-transparent" />;
    }

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

    const peakHourObj = hourlyData.length > 0 ? hourlyData.reduce((prev, current) => (prev[heatmapMetric] > current[heatmapMetric]) ? prev : current, hourlyData[0]) : null;
    const peakHour = peakHourObj ? peakHourObj.hour : '-';
    const peakValue = peakHourObj ? peakHourObj[heatmapMetric] : 0;

    return (
        <div className="space-y-8 animate-fade-in pb-12">
            {/* Top Controls Row - Restored Design */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="relative z-20">
                    <button
                        onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                        className={`flex items-center space-x-3 px-4 py-2.5 rounded-xl border transition-all ${isDark ? 'bg-slate-900 border-slate-700 text-white hover:bg-slate-800' : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50 shadow-sm'}`}
                    >
                        <div className={`p-1.5 rounded-lg ${isDark ? 'bg-brand-900/30 text-brand-400' : 'bg-brand-50 text-brand-600'}`}>
                            {React.createElement(activeConfig.icon, { size: 18 })}
                        </div>
                        <div className="text-left">
                            <div className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">View Profile</div>
                            <div className="font-semibold text-sm">{activeConfig.label}</div>
                        </div>
                        <ChevronDown size={16} className={`ml-2 text-slate-400 transition-transform ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isProfileMenuOpen && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setIsProfileMenuOpen(false)} />
                            <div className={`absolute top-full left-0 mt-2 w-64 rounded-xl shadow-2xl border p-2 z-20 animate-fade-in-down ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                                {(Object.keys(PROFILE_CONFIG) as DashboardProfile[]).filter(key => allowedProfiles.includes(key)).map((key) => {
                                    const conf = PROFILE_CONFIG[key];
                                    const isActive = profile === key;
                                    return (
                                        <button
                                            key={key}
                                            onClick={() => { setProfile(key); setIsProfileMenuOpen(false); }}
                                            className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors ${isActive
                                                ? (isDark ? 'bg-brand-900/20 text-brand-100' : 'bg-brand-50 text-brand-700')
                                                : (isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-50 text-slate-600 hover:text-slate-900')
                                                }`}
                                        >
                                            <conf.icon size={18} className={isActive ? 'text-brand-500' : ''} />
                                            <span className="font-medium">{conf.label}</span>
                                            {isActive && <div className="ml-auto w-2 h-2 rounded-full bg-brand-500"></div>}
                                        </button>
                                    )
                                })}
                            </div>
                        </>
                    )}
                </div>

                {!disableAi && (
                    <div className="flex-1 w-full md:w-auto">
                        {/* Desktop Version */}
                        <div className={`hidden md:flex border rounded-xl px-4 py-2 items-center justify-between backdrop-blur-md ${isDark ? 'bg-blue-900/10 border-blue-800/30' : 'bg-blue-50 border-blue-100'}`}>
                            <div className="flex items-center space-x-3">
                                <div className={`p-1.5 rounded-full animate-pulse ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                                    <Sparkles size={14} className="text-blue-500" />
                                </div>
                                <span className={`text-sm font-medium ${isDark ? 'text-blue-200' : 'text-blue-700'}`}>AI has new optimization insights.</span>
                            </div>
                            <button onClick={handleRunAI} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all shadow-lg shadow-blue-500/20">
                                View Audit
                            </button>
                        </div>
                        {/* Mobile Version - Compact & Fancy */}
                        <div className={`md:hidden flex items-center justify-between p-3 rounded-xl border relative overflow-hidden ${isDark ? 'bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border-blue-800/50' : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100'}`}>
                            <div className="flex items-center gap-3 relative z-10">
                                <div className="p-2 bg-blue-500 rounded-lg shadow-lg shadow-blue-500/30 animate-pulse">
                                    <Sparkles size={16} className="text-white" />
                                </div>
                                <div>
                                    <div className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-blue-300' : 'text-blue-600'}`}>AI Insights</div>
                                    <div className={`text-[10px] opacity-80 ${isDark ? 'text-blue-100' : 'text-blue-800'}`}>New optimizations available</div>
                                </div>
                            </div>
                            <button onClick={handleRunAI} className="relative z-10 px-3 py-1.5 bg-blue-600 text-white text-[10px] font-bold rounded-lg shadow-lg shadow-blue-600/30">
                                View
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Primary KPI Grid */}
            <div className={`grid grid-cols-1 md:grid-cols-2 ${hideTotalSpend ? 'lg:grid-cols-3' : 'lg:grid-cols-4'} gap-4`}>
                {activeConfig.cards.map((card: any) => {
                    // Filtered by activeConfig, no need for manual check

                    const dataKey = card.id;
                    let value = 0;
                    let trend = 0;

                    if (accountData) {
                        value = getMetricValue(accountData, dataKey);
                        trend = calculateTrend(dataKey, value);
                    }

                    let displayValue = '';
                    if (value >= 1000) {
                        if (value >= 1000000) {
                            displayValue = `${(value / 1000000).toFixed(2).replace(/\.00$/, '').replace(/\.0$/, '')}M`;
                        } else {
                            displayValue = `${(value / 1000).toFixed(1).replace(/\.0$/, '')}K`;
                        }
                    } else {
                        displayValue = value.toLocaleString(undefined, {
                            minimumFractionDigits: card.format === 'currency' ? 2 : 0,
                            maximumFractionDigits: card.format === 'currency' ? 2 : 2
                        });
                    }

                    return (
                        <StatCard
                            key={card.id}
                            label={card.label}
                            value={displayValue}
                            prefix={card.format === 'currency' ? '$' : ''}
                            suffix={card.format === 'percent' ? '%' : (card.suffix || '')}
                            trend={trend}
                            sparklineData={dailyData}
                            dataKey={card.id}
                            color={card.color}
                            theme={theme}
                            reverseColor={card.reverseColor}
                        />
                    );
                })}
            </div>

            {/* Tabs */}
            <div className={`border-b flex space-x-6 overflow-x-auto snap-x snap-mandatory scrollbar-hide ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                {[
                    { id: 'overview', icon: Zap, label: 'Overview' },
                    { id: 'audience', icon: Users, label: 'Audience' },
                    { id: 'platform', icon: Smartphone, label: 'Placements' },
                    { id: 'time', icon: Clock, label: 'Hourly Analytics' }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`pb-3 text-sm font-medium capitalize transition-colors border-b-2 flex items-center space-x-2 whitespace-nowrap snap-center ${activeTab === tab.id
                            ? styles.tabActive
                            : `${styles.tabInactive} border-transparent`
                            }`}
                    >
                        <tab.icon size={14} />
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Charts */}
                <div className={`${disableAi ? 'lg:col-span-3' : 'lg:col-span-2'} space-y-6`}>

                    {activeTab === 'overview' && (
                        <>
                            {/* Main Trend Chart */}
                            <div className={`${styles.cardBg} border rounded-xl p-6 min-h-[350px]`}>
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className={`text-lg font-semibold ${styles.heading}`}>{activeConfig.mainChart.title}</h3>
                                    <div className="flex items-center space-x-2 text-xs">
                                        <span className="flex items-center"><div className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: activeConfig.mainChart.bar.color }}></div> {activeConfig.mainChart.bar.name}</span>
                                        <span className="flex items-center"><div className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: activeConfig.mainChart.line.color }}></div> {activeConfig.mainChart.line.name}</span>
                                    </div>
                                </div>
                                <div className="h-80 w-full" style={{ width: '99%' }}>
                                    {dailyData.length > 0 && (
                                        <ResponsiveContainer width="100%" height="100%" debounce={50}>
                                            <ComposedChart data={dailyData} margin={{ top: 10, right: 30, left: 20, bottom: 40 }}>
                                                <defs>
                                                    <linearGradient id="colorMainBar" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor={activeConfig.mainChart.bar.color} stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor={activeConfig.mainChart.bar.color} stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke={styles.chartGrid} vertical={false} />
                                                <XAxis
                                                    dataKey="date_start"
                                                    stroke={styles.chartAxis}
                                                    fontSize={11}
                                                    tickLine={false}
                                                    axisLine={false}
                                                    tickFormatter={formatDateAxis}
                                                >
                                                    <Label value="TIMELINE" offset={0} position="bottom" fill={styles.chartAxis} style={{ fontSize: '10px', fontWeight: 'bold' }} />
                                                </XAxis>
                                                <YAxis
                                                    yAxisId="left"
                                                    stroke={styles.chartAxis}
                                                    fontSize={11}
                                                    tickLine={false}
                                                    axisLine={false}
                                                    tickFormatter={(val) => formatCompact(val, activeConfig.mainChart.bar.key)}
                                                >
                                                    <Label value={activeConfig.mainChart.bar.axisLabel} angle={-90} position="insideLeft" style={{ textAnchor: 'middle', fill: styles.chartAxis, fontSize: '10px', fontWeight: 'bold' }} />
                                                </YAxis>
                                                <YAxis
                                                    yAxisId="right"
                                                    orientation="right"
                                                    stroke={styles.chartAxis}
                                                    fontSize={11}
                                                    tickLine={false}
                                                    axisLine={false}
                                                    tickFormatter={(val) => formatCompact(val, activeConfig.mainChart.line.key)}
                                                >
                                                    <Label value={activeConfig.mainChart.line.axisLabel} angle={90} position="insideRight" dx={10} style={{ textAnchor: 'middle', fill: styles.chartAxis, fontSize: '10px', fontWeight: 'bold' }} />
                                                </YAxis>
                                                <Tooltip
                                                    contentStyle={{ backgroundColor: styles.tooltipBg, borderColor: styles.tooltipBorder, color: styles.tooltipText, borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                                    labelFormatter={(label) => formatDateAxis(label)}
                                                    formatter={(value: number, name: string) => [
                                                        formatCompact(value, name === activeConfig.mainChart.bar.name ? activeConfig.mainChart.bar.key : activeConfig.mainChart.line.key),
                                                        name
                                                    ]}
                                                />
                                                <Area yAxisId="left" type="monotone" dataKey={activeConfig.mainChart.bar.key} name={activeConfig.mainChart.bar.name} stroke={activeConfig.mainChart.bar.color} strokeWidth={2} fillOpacity={1} fill="url(#colorMainBar)" />
                                                <Line yAxisId="right" type="monotone" dataKey={activeConfig.mainChart.line.key} name={activeConfig.mainChart.line.name} stroke={activeConfig.mainChart.line.color} strokeWidth={2} dot={{ r: 3, fill: activeConfig.mainChart.line.color, strokeWidth: 0 }} />
                                            </ComposedChart>
                                        </ResponsiveContainer>
                                    )}
                                </div>
                            </div>

                            {/* Secondary Metrics Row */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className={`${styles.cardBg} border rounded-xl p-6 min-h-[250px]`}>
                                    <h3 className={`text-lg font-semibold ${styles.heading} mb-4`}>{activeConfig.secondary1.title}</h3>
                                    <div className="h-48 w-full" style={{ width: '99%' }}>
                                        {dailyData.length > 0 && (
                                            <ResponsiveContainer width="100%" height="100%" debounce={50}>
                                                <AreaChart data={dailyData} margin={{ left: 15, bottom: 40 }}>
                                                    <defs>
                                                        <linearGradient id="colorSec1" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor={activeConfig.secondary1.color} stopOpacity={0.2} />
                                                            <stop offset="95%" stopColor={activeConfig.secondary1.color} stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" stroke={styles.chartGrid} vertical={false} />
                                                    <XAxis dataKey="date_start" stroke={styles.chartAxis} fontSize={10} tickLine={false} axisLine={false} tickFormatter={formatDateAxis}>
                                                        <Label value="DATE" offset={0} position="bottom" fill={styles.chartAxis} style={{ fontSize: '9px', fontWeight: 'bold' }} />
                                                    </XAxis>
                                                    <YAxis stroke={styles.chartAxis} fontSize={10} axisLine={false} tickLine={false} domain={['auto', 'auto']} tickFormatter={(val) => formatCompact(val, activeConfig.secondary1.key)}>
                                                        <Label value={activeConfig.secondary1.axisLabel} angle={-90} position="insideLeft" style={{ textAnchor: 'middle', fill: styles.chartAxis, fontSize: '9px', fontWeight: 'bold' }} />
                                                    </YAxis>
                                                    <Tooltip
                                                        contentStyle={{ backgroundColor: styles.tooltipBg, borderColor: styles.tooltipBorder, color: styles.tooltipText, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                                        labelFormatter={(label) => formatDateAxis(label)}
                                                        formatter={(value: number) => [formatCompact(value, activeConfig.secondary1.key), activeConfig.secondary1.title]}
                                                    />
                                                    <Area type="monotone" dataKey={activeConfig.secondary1.key} stroke={activeConfig.secondary1.color} strokeWidth={2} fill="url(#colorSec1)" />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        )}
                                    </div>
                                </div>
                                <div className={`${styles.cardBg} border rounded-xl p-6 min-h-[250px]`}>
                                    <h3 className={`text-lg font-semibold ${styles.heading} mb-4`}>{activeConfig.secondary2.title}</h3>
                                    <div className="h-48 w-full" style={{ width: '99%' }}>
                                        {dailyData.length > 0 && (
                                            <ResponsiveContainer width="100%" height="100%" debounce={50}>
                                                <BarChart data={dailyData} margin={{ left: 15, bottom: 40 }}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke={styles.chartGrid} vertical={false} />
                                                    <XAxis dataKey="date_start" stroke={styles.chartAxis} fontSize={10} tickLine={false} axisLine={false} tickFormatter={formatDateAxis}>
                                                        <Label value="DATE" offset={0} position="bottom" fill={styles.chartAxis} style={{ fontSize: '9px', fontWeight: 'bold' }} />
                                                    </XAxis>
                                                    <YAxis stroke={styles.chartAxis} fontSize={10} axisLine={false} tickLine={false} tickFormatter={(val) => formatCompact(val, activeConfig.secondary2.key)}>
                                                        <Label value={activeConfig.secondary2.axisLabel} angle={-90} position="insideLeft" style={{ textAnchor: 'middle', fill: styles.chartAxis, fontSize: '9px', fontWeight: 'bold' }} />
                                                    </YAxis>
                                                    <Tooltip
                                                        contentStyle={{ backgroundColor: styles.tooltipBg, borderColor: styles.tooltipBorder, color: styles.tooltipText, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                                        cursor={{ fill: styles.chartGrid }}
                                                        labelFormatter={(label) => formatDateAxis(label)}
                                                        formatter={(value: number) => [formatCompact(value, activeConfig.secondary2.key), activeConfig.secondary2.title]}
                                                    />
                                                    <Bar dataKey={activeConfig.secondary2.key} fill={activeConfig.secondary2.color} radius={[2, 2, 0, 0]} barSize={12} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'audience' && (
                        <div className="space-y-6">
                            {/* Funnel Section - Enhanced Modern Look */}
                            <div className={`${styles.cardBg} border rounded-xl p-8 relative overflow-hidden`}>
                                {/* Decorative Background Elements */}
                                <div className="absolute top-0 right-0 p-32 bg-brand-500/5 blur-[100px] rounded-full pointer-events-none"></div>

                                <h3 className={`text-lg font-bold ${styles.heading} mb-8 flex items-center relative z-10`}>
                                    <div className="p-2 rounded-lg bg-gradient-to-br from-brand-500 to-purple-600 text-white mr-3 shadow-lg shadow-brand-500/20">
                                        <Filter size={18} />
                                    </div>
                                    Conversion Funnel Velocity
                                </h3>

                                <div className="relative w-full py-4 z-10">
                                    <div className="flex flex-col md:flex-row justify-between items-stretch gap-4 md:gap-0">
                                        {processedFunnelData.map((step, idx) => {
                                            const isLast = idx === processedFunnelData.length - 1;
                                            const nextStep = !isLast ? processedFunnelData[idx + 1] : null;
                                            const convRate = nextStep && step.value > 0 ? ((nextStep.value / step.value) * 100).toFixed(1) + '%' : null;

                                            return (
                                                <div key={idx} className="flex-1 flex flex-col items-center relative group min-w-0">
                                                    <div className="flex items-center w-full">
                                                        {/* Card */}
                                                        <div className={`
                                                    flex-1 w-full p-6 relative
                                                    transition-all duration-300 transform group-hover:-translate-y-1
                                                    ${idx === 0 ? 'rounded-l-2xl' : ''} ${isLast ? 'rounded-r-2xl' : ''}
                                                    ${!isLast ? 'md:border-r border-dashed' : ''}
                                                    ${isDark
                                                                ? 'bg-gradient-to-b from-slate-800 to-slate-900/50 border-slate-700/50 hover:bg-slate-800'
                                                                : 'bg-slate-50/80 hover:bg-white border-slate-200 shadow-sm'}
                                                    border md:border-y md:border-l ${isLast ? 'md:border-r' : ''}
                                                    rounded-xl md:rounded-none
                                                `}>
                                                            <div className="flex flex-col h-full justify-between items-center text-center">
                                                                <div className={`mb-4 p-3 rounded-full group-hover:scale-110 transition-transform duration-300 ${isDark ? 'bg-slate-800' : 'bg-white shadow-sm border border-slate-100'}`}>
                                                                    <div className="w-3 h-3 rounded-full shadow-inner" style={{ backgroundColor: step.fill, boxShadow: `0 0 10px ${step.fill}` }}></div>
                                                                </div>

                                                                <div>
                                                                    <div className={`text-xs uppercase font-extrabold tracking-widest mb-2 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                                                                        {step.name}
                                                                    </div>
                                                                    <div className={`text-3xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-br ${isDark ? 'from-white to-slate-400' : 'from-slate-900 to-slate-600'}`}>
                                                                        {formatCompact(step.value)}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Conversion Pill - Positioned relative to flex flow, avoiding overlap */}
                                                        {!isLast && (
                                                            <div className="hidden md:flex flex-col items-center justify-center -ml-5 z-20 relative">
                                                                <div className={`
                                                            px-3 py-1.5 rounded-full text-[10px] font-bold shadow-xl border
                                                            flex items-center space-x-1 whitespace-nowrap
                                                            ${isDark ? 'bg-slate-950 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-600'}
                                                            group-hover:scale-110 transition-transform
                                                        `}>
                                                                    <span>{convRate}</span>
                                                                    <ArrowRight size={10} className="text-emerald-500" />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Mobile Down Arrow */}
                                                    {!isLast && (
                                                        <div className="md:hidden my-2 z-20">
                                                            <div className={`
                                                        px-3 py-1 rounded-full text-[10px] font-bold border shadow-sm
                                                        ${isDark ? 'bg-slate-950 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-600'}
                                                    `}>
                                                                {convRate} ↓
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Demographics Section */}
                            <div className={`${styles.cardBg} border rounded-xl p-6`}>
                                <h3 className={`text-lg font-semibold ${styles.heading} mb-6 flex items-center`}>
                                    <Users className="mr-2 text-pink-500" size={18} />
                                    Demographics (Spend by Age & Gender)
                                </h3>
                                <div className="h-72 w-full">
                                    <ResponsiveContainer width="100%" height="100%" debounce={50}>
                                        <BarChart data={processedDemographics} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke={styles.chartGrid} vertical={false} />
                                            <XAxis dataKey="age" stroke={styles.chartAxis} tick={{ fontSize: 12 }}>
                                                <Label value="AGE GROUP" offset={-10} position="insideBottom" style={{ fontSize: '10px', fill: styles.chartAxis }} />
                                            </XAxis>
                                            <YAxis stroke={styles.chartAxis} tickFormatter={(val) => formatCompact(val, activeConfig.breakdownMetric)} tick={{ fontSize: 11 }}>
                                                <Label value={activeConfig.breakdownMetric === 'spend' ? 'SPEND' : 'IMPRESSIONS'} angle={-90} position="insideLeft" style={{ fontSize: '10px', fill: styles.chartAxis }} />
                                            </YAxis>
                                            <Tooltip
                                                contentStyle={{ backgroundColor: styles.tooltipBg, borderColor: styles.tooltipBorder, color: styles.tooltipText, borderRadius: '8px' }}
                                                formatter={(val: number) => formatCompact(val, activeConfig.breakdownMetric === 'spend' ? 'currency' : 'number')}
                                            />
                                            <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                            <Bar dataKey="Female" stackId="a" fill="#ec4899" radius={[0, 0, 0, 0]} barSize={50} />
                                            <Bar dataKey="Male" stackId="a" fill="#0055ff" radius={[4, 4, 0, 0]} barSize={50} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>                            </div>

                            {/* Regions Section - Split View */}
                            <div className={`${styles.cardBg} border rounded-xl p-6`}>
                                <h3 className={`text-lg font-semibold ${styles.heading} mb-6 flex items-center`}>
                                    <Globe className="mr-2 text-blue-500" size={18} />
                                    Top Regions by Spend
                                </h3>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    <div className="h-80 w-full">
                                        <ResponsiveContainer width="100%" height="100%" debounce={50}>
                                            <BarChart data={processedRegions} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                                <defs>
                                                    <linearGradient id="regionBarGradient" x1="0" y1="0" x2="1" y2="0">
                                                        <stop offset="0%" stopColor="#3b82f6" />
                                                        <stop offset="100%" stopColor="#8b5cf6" />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke={styles.chartGrid} horizontal={false} />
                                                <XAxis type="number" hide />
                                                <YAxis type="category" dataKey="name" width={100} stroke={styles.chartAxis} style={{ fontSize: '11px' }} />
                                                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: styles.tooltipBg, borderColor: styles.tooltipBorder, color: styles.tooltipText }} formatter={(val: number) => formatCompact(val, 'currency')} />
                                                <Bar dataKey="value" fill="url(#regionBarGradient)" radius={[0, 4, 4, 0]} barSize={20} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm">
                                            <thead className={`border-b ${isDark ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-500'} text-xs font-bold uppercase`}>
                                                <tr>
                                                    <th className="pb-3 pl-2">Region</th>
                                                    <th className="pb-3 text-right">Spend</th>
                                                    <th className="pb-3 pl-4">Clicks</th>
                                                </tr>
                                            </thead>
                                            <tbody className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-100'}`}>
                                                {processedRegions.map((r, i) => {
                                                    const maxClicks = Math.max(...processedRegions.map(pr => pr.secondaryValue));
                                                    const clickPct = maxClicks > 0 ? (r.secondaryValue / maxClicks) * 100 : 0;

                                                    return (
                                                        <tr key={i} className={isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}>
                                                            <td className={`py-3 pl-2 font-medium ${styles.heading} text-xs`}>{r.name}</td>
                                                            <td className={`py-3 text-right ${styles.textSub} font-mono text-xs`}>
                                                                {formatCompact(r.value, 'currency')}
                                                            </td>
                                                            <td className="py-3 pl-4">
                                                                <div className="flex flex-col justify-center">
                                                                    <div className="flex justify-between items-end mb-1">
                                                                        <span className={`font-bold font-mono text-xs ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                                                                            {formatCompact(r.secondaryValue)}
                                                                        </span>
                                                                    </div>
                                                                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                                                        <div
                                                                            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                                                                            style={{ width: `${clickPct}%` }}
                                                                        ></div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'platform' && (
                        <div className="space-y-6">
                            {/* Placement Chart - Enhanced Visuals */}
                            <div className={`${styles.cardBg} border rounded-xl p-6 relative overflow-hidden`}>
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
                                <h3 className={`text-lg font-bold ${styles.heading} mb-2 flex items-center`}>
                                    <Target className="mr-2 text-blue-500" size={18} />
                                    Placement Performance
                                </h3>
                                <p className="text-xs text-slate-500 mb-6">Top performing placements. Analyzing Spend efficiency vs ROAS.</p>

                                {/* Desktop Chart View */}
                                <div className="hidden md:block h-80 w-full">
                                    <ResponsiveContainer width="100%" height="100%" debounce={50}>
                                        <ComposedChart data={processedPlacements.slice(0, 8)} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                                            <defs>
                                                <linearGradient id="colorPlacementBar" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#4f86f7" stopOpacity={1} />
                                                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.6} />
                                                </linearGradient>
                                                <filter id="shadow" height="200%">
                                                    <feDropShadow dx="0" dy="5" stdDeviation="5" floodColor="#4f86f7" floodOpacity="0.3" />
                                                </filter>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke={styles.chartGrid} vertical={false} />
                                            {/* Increased height to 85 and dy to 20 to prevent overlap */}
                                            <XAxis dataKey="name" stroke={styles.chartAxis} tick={{ fontSize: 10 }} interval={0} angle={-25} textAnchor="end" height={85}>
                                                <Label value="PLACEMENT" offset={0} position="insideBottom" dy={20} style={{ fontSize: '9px', fontWeight: 'bold', fill: styles.chartAxis }} />
                                            </XAxis>
                                            <YAxis yAxisId="left" stroke={styles.chartAxis} tickFormatter={(val) => formatCompact(val, profile === 'sales' ? 'currency' : 'number')} tick={{ fontSize: 10 }}>
                                                <Label value={profile === 'sales' ? "SPEND" : "REACH"} angle={-90} position="insideLeft" style={{ fontSize: '9px', fontWeight: 'bold', fill: styles.chartAxis }} />
                                            </YAxis>
                                            <YAxis yAxisId="right" orientation="right" stroke={styles.chartAxis} tickFormatter={(val) => profile === 'sales' ? val.toFixed(1) + 'x' : formatCompact(val)} tick={{ fontSize: 10 }}>
                                                <Label value={profile === 'sales' ? "ROAS" : "IMPRESSIONS"} angle={90} position="insideRight" style={{ fontSize: '9px', fontWeight: 'bold', fill: styles.chartAxis }} />
                                            </YAxis>
                                            <Tooltip
                                                contentStyle={{ backgroundColor: styles.tooltipBg, borderColor: styles.tooltipBorder, color: styles.tooltipText, borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}
                                                cursor={{ fill: styles.chartGrid }}
                                                formatter={(val: number, name: string) => [
                                                    profile === 'sales' && name === 'Spend' ? formatCompact(val, 'currency') :
                                                        profile === 'sales' && name === 'ROAS' ? val.toFixed(2) + 'x' :
                                                            formatCompact(val),
                                                    name
                                                ]}
                                            />
                                            {/* Conditional Bars */}
                                            {profile === 'sales' ? (
                                                <>
                                                    <Bar yAxisId="left" dataKey="spend" name="Spend" fill="url(#colorPlacementBar)" barSize={40} radius={[8, 8, 4, 4]} />
                                                    <Line yAxisId="right" type="monotone" dataKey="roas" name="ROAS" stroke="#10b981" strokeWidth={4} dot={{ r: 5, fill: '#10b981', strokeWidth: 2, stroke: styles.tooltipBg }} activeDot={{ r: 8, fill: '#fff', stroke: '#10b981', strokeWidth: 3 }} />
                                                </>
                                            ) : (
                                                <>
                                                    <Bar yAxisId="left" dataKey="reach" name="Reach" fill="url(#colorPlacementBar)" barSize={40} radius={[8, 8, 4, 4]} />
                                                    <Line yAxisId="right" type="monotone" dataKey="impressions" name="Impressions" stroke="#10b981" strokeWidth={4} dot={{ r: 5, fill: '#10b981', strokeWidth: 2, stroke: styles.tooltipBg }} activeDot={{ r: 8, fill: '#fff', stroke: '#10b981', strokeWidth: 3 }} />
                                                </>
                                            )}
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Mobile List View - Native Fancy Cards */}
                                <div className="md:hidden space-y-3">
                                    {processedPlacements.slice(0, showAllPlacements ? undefined : 6).map((item, idx) => (
                                        <div key={idx} className={`p-3 rounded-lg border flex items-center justify-between ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-white text-slate-600 shadow-sm'}`}>
                                                    {idx + 1}
                                                </div>
                                                <div>
                                                    <div className={`text-xs font-bold capitalize ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{item.platform}</div>
                                                    <div className={`text-[9px] uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{item.position}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 text-right">
                                                <div>
                                                    <div className={`text-[10px] font-bold uppercase ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{profile === 'sales' ? 'Spend' : 'Reach'}</div>
                                                    <div className={`text-xs font-mono font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{formatCompact(profile === 'sales' ? item.spend : item.reach)}</div>
                                                </div>
                                                <div>
                                                    <div className={`text-[10px] font-bold uppercase ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{profile === 'sales' ? 'ROAS' : 'Impr'}</div>
                                                    <div className={`text-xs font-mono font-bold ${profile === 'sales' && item.roas > 2 ? 'text-emerald-500' : isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                                        {profile === 'sales' ? item.roas.toFixed(1) + 'x' : formatCompact(item.impressions)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {!showAllPlacements && processedPlacements.length > 6 && (
                                        <button onClick={() => setShowAllPlacements(true)} className="w-full py-2 text-center text-xs text-brand-500 font-bold">
                                            View All Placements
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Performance Ledger List - Enhanced Data Driven Cards */}
                            <div className={`${styles.cardBg} border rounded-xl overflow-hidden shadow-sm`}>
                                <div className={`p-5 border-b flex justify-between items-center ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                                    <h3 className={`font-bold ${styles.heading} flex items-center`}>
                                        <Zap size={18} className="mr-2 text-yellow-500" /> Performance Ledger
                                    </h3>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded">Based on Efficiency & Volume</span>
                                </div>
                                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {/* Load More Logic */}
                                    {processedPlacements.slice(0, visiblePlacements).map((p, i) => {
                                        const maxVal = processedPlacements[0]?.value || 1;
                                        const valPct = (p.value / maxVal) * 100;

                                        // Determine badge based on Efficiency
                                        let badge = null;
                                        // Efficiency thresholds depend on metric (ROAS vs Leads/Eng)
                                        // Generic simple logic for demo:
                                        if (profile === 'sales') {
                                            if (p.efficiency > 3.0) badge = <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-emerald-500 text-white shadow-sm shadow-emerald-500/20">ELITE</span>;
                                            else if (p.efficiency > 2.0) badge = <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-blue-500 text-white shadow-sm shadow-blue-500/20">SCALING</span>;
                                            else if (p.efficiency < 1.0) badge = <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-rose-500 text-white shadow-sm shadow-rose-500/20">CHECK</span>;
                                        } else {
                                            // For volume based metrics, just rank badges
                                            if (i < 2) badge = <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-emerald-500 text-white shadow-sm shadow-emerald-500/20">TOP PERFORMER</span>;
                                        }
                                        if (!badge) badge = <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400">STABLE</span>;

                                        return (
                                            <div key={i} className={`p-5 ${isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'} transition-all group border-l-4 ${p.efficiency > 2 ? 'border-l-emerald-500' : 'border-l-transparent hover:border-l-slate-400'}`}>
                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">

                                                    {/* Rank & Name */}
                                                    <div className="flex items-center min-w-[220px]">
                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black shadow-inner mr-4 shrink-0 transition-transform group-hover:scale-110
                                                    ${i === 0 ? 'bg-gradient-to-br from-yellow-300 to-yellow-500 text-white' : i === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-white' : i === 2 ? 'bg-gradient-to-br from-orange-300 to-orange-400 text-white' : (isDark ? 'bg-slate-800 text-slate-500' : 'bg-slate-100 text-slate-500')}
                                                 `}>
                                                            {i + 1}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center space-x-2 mb-1">
                                                                <span className={`text-sm font-bold ${styles.heading} group-hover:text-blue-500 transition-colors`}>{p.name}</span>
                                                                {badge}
                                                            </div>
                                                            <div className="flex items-center text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                                                                {p.platform.toLowerCase().includes('instagram') ? <Instagram size={10} className="mr-1 text-pink-500" /> :
                                                                    p.platform.toLowerCase().includes('facebook') ? <Facebook size={10} className="mr-1 text-blue-600" /> :
                                                                        <Monitor size={10} className="mr-1" />}
                                                                {p.platform}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Visual Bars for Volume */}
                                                    <div className="flex-1 w-full md:w-auto">
                                                        <div className="flex justify-between text-xs font-medium text-slate-500 mb-1.5">
                                                            <span>{p.volumeLabel} Impact</span>
                                                            <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>{formatCompact(p.value, profile === 'sales' ? 'currency' : 'number')}</span>
                                                        </div>
                                                        <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                                                            <div
                                                                className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 relative overflow-hidden"
                                                                style={{ width: `${valPct}%` }}
                                                            >
                                                                <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Efficiency Box */}
                                                    <div className="text-right min-w-[100px] pl-4 border-l border-slate-100 dark:border-slate-800">
                                                        <div className={`text-2xl font-black tracking-tight ${p.efficiency > 2.0 && profile === 'sales' ? 'text-emerald-500' : isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                                            {profile === 'sales' ? p.efficiency.toFixed(2) + 'x' : formatCompact(p.efficiency)}
                                                        </div>
                                                        <div className={`text-[10px] font-bold uppercase ${p.efficiency > 2.0 && profile === 'sales' ? 'text-emerald-500/70' : 'text-slate-400'}`}>{p.efficiencyLabel}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* Load More Button */}
                                    {processedPlacements.length > visiblePlacements && (
                                        <div className="p-4 text-center">
                                            <button
                                                onClick={() => setVisiblePlacements(prev => prev + 5)}
                                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'}`}
                                            >
                                                Load More Placements
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'time' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className={`${styles.cardBg} border rounded-xl p-6 min-h-[300px]`}>
                                    <h3 className={`text-lg font-semibold ${styles.heading} mb-2 flex items-center`}>
                                        <Clock size={18} className="mr-2 text-brand-400" /> Activity Radar (24h)
                                    </h3>
                                    <p className="text-xs text-slate-500 mb-4">Radial view of impressions distribution.</p>
                                    <div className="h-64 w-full" style={{ width: '99%' }}>
                                        {hourlyData.length > 0 && (
                                            <ResponsiveContainer width="100%" height="100%" debounce={50}>
                                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={hourlyData}>
                                                    <PolarGrid stroke={styles.chartGrid} />
                                                    <PolarAngleAxis dataKey="hour" stroke={styles.chartAxis} tick={{ fontSize: 10 }} />
                                                    <PolarRadiusAxis angle={30} domain={[0, 'auto']} stroke={styles.chartAxis} tickFormatter={(val) => formatCompact(val)} />
                                                    <Radar name="Impressions" dataKey="impressions" stroke="#8b5cf6" strokeWidth={2} fill="#8b5cf6" fillOpacity={0.3} />
                                                    <Tooltip
                                                        contentStyle={{ backgroundColor: styles.tooltipBg, borderColor: styles.tooltipBorder, color: styles.tooltipText, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                                        formatter={(value: number) => formatCompact(value)}
                                                    />
                                                </RadarChart>
                                            </ResponsiveContainer>
                                        )}
                                    </div>
                                </div>

                                <div className={`${styles.cardBg} border rounded-xl p-6 min-h-[300px]`}>
                                    <h3 className={`text-lg font-semibold ${styles.heading} mb-2 flex items-center`}>
                                        <Users size={18} className="mr-2 text-blue-400" /> Volume Trend
                                    </h3>
                                    <p className="text-xs text-slate-500 mb-4">Impressions vs Reach (Estimated) by Hour.</p>
                                    <div className="h-64 w-full" style={{ width: '99%' }}>
                                        {hourlyData.length > 0 && (
                                            <ResponsiveContainer width="100%" height="100%" debounce={50}>
                                                <AreaChart data={hourlyData} margin={{ left: 15, bottom: 40 }}>
                                                    <defs>
                                                        <linearGradient id="colorImps" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#0055ff" stopOpacity={0.4} />
                                                            <stop offset="95%" stopColor="#0055ff" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" stroke={styles.chartGrid} vertical={false} />
                                                    <XAxis dataKey="hour" stroke={styles.chartAxis} tickLine={false} axisLine={false} tickFormatter={(h) => `${h}h`}>
                                                        <Label value="HOUR OF DAY" offset={0} position="bottom" fill={styles.chartAxis} style={{ fontSize: '9px', fontWeight: 'bold' }} />
                                                    </XAxis>
                                                    <YAxis stroke={styles.chartAxis} tickLine={false} axisLine={false} tickFormatter={(v) => formatCompact(v)}>
                                                        <Label value="VOLUME" angle={-90} position="insideLeft" style={{ textAnchor: 'middle', fill: styles.chartAxis, fontSize: '9px', fontWeight: 'bold' }} />
                                                    </YAxis>
                                                    <Tooltip
                                                        contentStyle={{ backgroundColor: styles.tooltipBg, borderColor: styles.tooltipBorder, color: styles.tooltipText, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                                        formatter={(value: number) => formatCompact(value)}
                                                    />
                                                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                                    <Area type="monotone" dataKey="impressions" name="Impressions" stroke="#0055ff" fill="url(#colorImps)" />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        )}
                                    </div>
                                </div>
                            </div>
                            {/* ... Heatmap ... */}
                            <div className={`${styles.cardBg} border rounded-xl p-6`}>
                                <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
                                    <div>
                                        <h3 className={`text-lg font-semibold ${styles.heading} flex items-center`}>
                                            Dayparting Heatmap
                                        </h3>
                                        {/* ... */}
                                    </div>
                                    <div className={`p-1 rounded-lg border flex text-xs ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>
                                        {(['impressions', 'reach', 'clicks', 'ctr'] as const).map(m => (
                                            <button
                                                key={m}
                                                onClick={() => setHeatmapMetric(m)}
                                                className={`px-3 py-1.5 rounded uppercase font-bold transition-all ${heatmapMetric === m
                                                    ? 'bg-brand-600 text-white shadow-md'
                                                    : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'
                                                    }`}
                                            >
                                                {m}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-2">
                                    {hourlyData.map((h, i) => {
                                        const maxVal = Math.max(...hourlyData.map(d => d[heatmapMetric]));
                                        const val = h[heatmapMetric];
                                        const colorClass = getHeatmapColor(val, maxVal, heatmapMetric);

                                        return (
                                            <div key={i} className={`group relative rounded-lg border ${colorClass} h-16 flex flex-col items-center justify-center transition-all hover:scale-110 hover:z-10 cursor-default`}>
                                                <span className="text-[9px] opacity-70 absolute top-1 left-1">{h.hour}h</span>
                                                <span className={`font-mono ${heatmapMetric === 'ctr' ? 'text-[9px] md:text-xs' : 'text-xs'}`}>
                                                    {formatCompact(val, heatmapMetric === 'ctr' ? 'ctr' : '')}
                                                </span>
                                                {/* Tooltip */}
                                            </div>
                                        )
                                    })}
                                </div>

                                {/* Dynamic Summary below the heatmap */}
                                {getHeatmapSummary()}
                            </div>
                            {/* AI Analysis Widget within Time Tab if needed, or hide if desired. For now, assuming only bottom widget matters. */}
                        </div>
                    )}

                </div>

                {/* Right Column: AI Analysis Panel */}
                {!disableAi && (
                    <div className="lg:col-span-1" ref={aiAuditRef}>
                        <div className={`sticky top-6 border rounded-xl p-0 h-[calc(100vh-12rem)] flex flex-col shadow-2xl overflow-hidden ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xl'}`}>
                            <div className={`p-4 border-b flex items-center justify-between ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                                <div className="flex items-center space-x-2">
                                    <Zap size={18} className="text-yellow-400" />
                                    <h3 className={`font-bold ${styles.heading}`}>AI Audit</h3>
                                </div>
                                {analyzing && <div className="text-xs text-slate-400 animate-pulse">Thinking...</div>}
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                                {!aiAnalysis && !analyzing ? (
                                    <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-50">
                                        <Zap size={48} className="text-slate-400" />
                                        <p className="text-slate-400 text-sm px-8">Run an audit to see a comprehensive breakdown of your account health, wasted spend, and scaling wins.</p>
                                        <button onClick={handleRunAI} className="px-4 py-2 bg-slate-800 rounded text-slate-300 text-sm hover:text-white">Start Audit</button>
                                    </div>
                                ) : (
                                    <div className="prose prose-sm max-w-none">
                                        {aiAnalysis && <RichTextRenderer content={aiAnalysis} />}
                                    </div>
                                )}
                            </div>

                            <div className={`p-4 border-t ${isDark ? 'bg-slate-800/30 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                <button
                                    onClick={handleRunAI}
                                    disabled={analyzing}
                                    className="w-full py-3 bg-gradient-to-r from-brand-600 to-blue-600 hover:from-brand-500 hover:to-blue-500 text-white font-bold rounded-lg shadow-lg transition-all flex justify-center items-center space-x-2"
                                >
                                    {analyzing ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            <span>Auditing...</span>
                                        </>
                                    ) : (
                                        <span>Generate Fresh Report</span>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div >
    );
};

export default Dashboard;
