import React, { useState, useEffect } from 'react';
import { Plus, Sparkles, ChevronDown } from 'lucide-react';
import { CreationWizard } from './components/CreationWizard/CreationWizard';
import { CampaignStrategist } from './components/CampaignStrategist';
import {
    useCampaignsWithInsights,
    useAdSetsWithInsights,
    useAdsWithInsights
} from '../../hooks/useMetaQueries';
import { Campaign, AdSet, Ad, DateSelection, GlobalFilter, AccountHierarchy } from '../../types';
import { AdsManagerProvider, useAdsManager } from './context/AdsManagerContext';
import { AdsNavigator } from './components/AdsNavigator';
import { AdsTable } from './components/AdsTable';
import { MetricsSelector } from './components/MetricsSelector';
import { AIAnalyst } from './components/AIAnalyst';
import SmartLoader from '../../components/SmartLoader';

interface AdsManagerProps {
    token: string;
    accountIds: string[];
    dateSelection: DateSelection;
    filter?: GlobalFilter;
    refreshTrigger?: number;
    hierarchy?: AccountHierarchy;
    theme: 'light' | 'dark';
}

const AdsManagerContent: React.FC = () => {
    const {
        token,
        accountIds,
        dateSelection,
        filter,
        currentLevel,
        breadcrumbs,
        selectedIds,
        refreshTrigger,
        theme
    } = useAdsManager();

    const [isWizardOpen, setWizardOpen] = useState(false);
    const [isAIStudioOpen, setAIStudioOpen] = useState(false);
    const [aiPrompt, setAiPrompt] = useState<string>('');
    const [isMobileAiExpanded, setIsMobileAiExpanded] = useState(false); // Mobile Collapsible State

    // Pagination (Client Side Slicing)
    const [limit, setLimit] = useState(25);

    // Search & Sort State
    const [searchQuery, setSearchQuery] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

    // --- React Query Integration ---
    const parentId = breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1].id : undefined;

    // We use a shared options object for our queries
    const queryOptions = React.useMemo(() => ({
        // You can add refetchInterval here if passed from props context
        refetchOnWindowFocus: false,
    }), []); // Add dependencies if needed

    // 1. Fetch Campaigns
    const {
        data: campaignsResp,
        isLoading: loadingCampaigns
    } = useCampaignsWithInsights(
        accountIds,
        token,
        dateSelection,
        filter || { searchQuery: '', selectedCampaignIds: [], selectedAdSetIds: [] },
        { ...queryOptions, enabled: currentLevel === 'CAMPAIGN' }
    );

    // 2. Fetch AdSets
    const {
        data: adSetsResp,
        isLoading: loadingAdSets
    } = useAdSetsWithInsights(
        accountIds,
        token,
        dateSelection,
        filter || { searchQuery: '', selectedCampaignIds: [], selectedAdSetIds: [] },
        parentId,
        { ...queryOptions, enabled: currentLevel === 'ADSET' }
    );

    // 3. Fetch Ads
    const {
        data: adsResp,
        isLoading: loadingAds
    } = useAdsWithInsights(
        accountIds,
        token,
        dateSelection,
        filter || { searchQuery: '', selectedCampaignIds: [], selectedAdSetIds: [] },
        parentId,
        { ...queryOptions, enabled: currentLevel === 'AD' }
    );

    // Unified Data & Loading
    const data = React.useMemo(() => {
        if (currentLevel === 'CAMPAIGN') return campaignsResp?.data || [];
        if (currentLevel === 'ADSET') return adSetsResp?.data || [];
        if (currentLevel === 'AD') return adsResp?.data || [];
        return [];
    }, [currentLevel, campaignsResp, adSetsResp, adsResp]);

    const loading = loadingCampaigns || loadingAdSets || loadingAds;

    // TRACK INITIAL LOAD: Only show Smart Loader once per session
    // We want to show it on the VERY first mount/fetch.
    // Once we have fetched data (or determined there is none), we switch to "internal" loading (skeleton).
    const initialLoadRef = React.useRef(false);

    // Check if we have data NOW
    const hasData = (campaignsResp?.data?.length || 0) > 0 ||
        (adSetsResp?.data?.length || 0) > 0 ||
        (adsResp?.data?.length || 0) > 0;

    // If we have data, we are definitely loaded at least once.
    if (hasData) {
        initialLoadRef.current = true;
    }

    // Also, if we finished loading (even if no data), we should mark as loaded so next time we use table skeleton.
    useEffect(() => {
        if (!loading) {
            initialLoadRef.current = true;
        }
    }, [loading]);

    // Reset pagination on filter/level change
    useEffect(() => {
        setLimit(25);
    }, [currentLevel, searchQuery, sortConfig]);

    const processedData = React.useMemo(() => {
        let result = [...data];

        // Search
        if (searchQuery) {
            const lowerQ = searchQuery.toLowerCase();
            result = result.filter(item =>
                item.name?.toLowerCase().includes(lowerQ) ||
                item.id?.includes(lowerQ)
            );
        }

        // Sort
        if (sortConfig) {
            result.sort((a, b) => {
                let aVal: any = (a as any)[sortConfig.key];
                let bVal: any = (b as any)[sortConfig.key];

                // Handle nested insights for sorting
                if (['spend', 'impressions', 'reach', 'cpm', 'cpc', 'ctr'].includes(sortConfig.key)) {
                    aVal = (a as any).insights?.[sortConfig.key] || 0;
                    bVal = (b as any).insights?.[sortConfig.key] || 0;

                    // Numeric parsing for insights
                    if (typeof aVal === 'string') aVal = parseFloat(aVal);
                    if (typeof bVal === 'string') bVal = parseFloat(bVal);
                }

                if (sortConfig.key === 'results') {
                    aVal = parseInt((a as any).insights?.actions?.[0]?.value || '0');
                    bVal = parseInt((b as any).insights?.actions?.[0]?.value || '0');
                }

                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return result;
    }, [data, searchQuery, sortConfig]);

    const visibleData = processedData.slice(0, limit);
    const hasMore = limit < processedData.length;

    // SMART LOADER (Restored per user request for "Attractive" Initial Load)
    // Only block if we have NO data to show AND it is the very first load.
    // Subsequent navigations (drill-down) should use the table skeleton.

    if (loading && !initialLoadRef.current && !hasData) {
        return (
            <div className="h-full relative bg-slate-50 dark:bg-slate-950">
                <SmartLoader
                    loading={true}
                    messages={[
                        "Scanning Campaign Structure...",
                        "Analyzing Ad Performance...",
                        "Optimizing Grid Layout...",
                        "Generating Insights..."
                    ]}
                />
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col overflow-hidden relative bg-transparent">
            {/* AI STUDIO / CAMPAIGN STRATEGIST */}
            <CampaignStrategist
                isOpen={isAIStudioOpen}
                onClose={() => setAIStudioOpen(false)}
                data={data}
                initialPrompt={aiPrompt}
            />

            {/* TOP BAR: Breadcrumbs & Tabs */}
            <div className={`flex-none flex flex-col gap-2 p-2 border-b ${theme === 'dark' ? 'border-slate-800' : 'border-slate-200'}`}>

                {/* AI Analyst - Floating or Embedded */}
                {/* AI Analyst - Floating or Embedded */}
                <div className="animate-in slide-in-from-top-4 duration-500">
                    {/* Mobile Collapsible Header */}
                    <div className="md:hidden mb-2">
                        <button
                            onClick={() => setIsMobileAiExpanded(!isMobileAiExpanded)}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all duration-300 shadow-sm ${theme === 'dark'
                                ? 'bg-gradient-to-r from-slate-900 to-slate-800 border-slate-700 text-slate-200'
                                : 'bg-white border-slate-200 text-slate-700'}`}
                        >
                            <div className="flex items-center gap-2">
                                <div className={`p-1.5 rounded-lg ${theme === 'dark' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                                    <Sparkles size={16} />
                                </div>
                                <span className="font-bold text-sm bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">
                                    AI Analyst Insights
                                </span>
                            </div>
                            <ChevronDown
                                size={18}
                                className={`text-slate-400 transition-transform duration-300 ${isMobileAiExpanded ? 'rotate-180' : ''}`}
                            />
                        </button>
                    </div>

                    {/* Content - Hidden on mobile unless expanded, Always visible on desktop */}
                    <div className={`${isMobileAiExpanded ? 'block' : 'hidden'} md:block transition-all duration-300`}>
                        <AIAnalyst
                            data={data}
                            level={currentLevel}
                            onAction={(prompt) => {
                                setAiPrompt(prompt);
                                setAIStudioOpen(true);
                            }}
                        />
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-3 md:gap-0 justify-between items-start md:items-end">
                    <div className="w-full md:flex-1">
                        <AdsNavigator />
                    </div>

                    {/* SEARCH BAR */}
                    <div className="w-full md:mx-4 md:flex-1 md:max-w-sm relative order-3 md:order-none">
                        <input
                            type="text"
                            placeholder={`Search ${currentLevel.toLowerCase()}s...`}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={`w-full border rounded-lg py-2 md:py-1.5 px-3 text-sm focus:border-purple-500 outline-none shadow-inner transition-colors ${theme === 'dark'
                                ? 'bg-slate-900 border-slate-700 text-slate-200'
                                : 'bg-white border-slate-200 text-slate-800'
                                }`}
                        />
                    </div>

                    <div className="flex gap-2 w-full md:w-auto overflow-x-auto md:overflow-visible pb-1 md:pb-0 no-scrollbar order-2 md:order-none">
                        <button
                            onClick={() => setAIStudioOpen(true)}
                            className="whitespace-nowrap flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-3 py-1.5 rounded-lg text-sm font-bold shadow-lg shadow-purple-500/25 transition-all border border-purple-400/20 hover:scale-105 active:scale-95"
                        >
                            <Sparkles size={14} /> AI Planner
                        </button>
                        <div className="hidden md:block w-px bg-slate-800 mx-1" />
                        <MetricsSelector />
                        <button
                            onClick={() => setWizardOpen(true)}
                            className="whitespace-nowrap flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-sm font-bold shadow-lg shadow-emerald-500/25 transition-all hover:scale-105 active:scale-95"
                        >
                            <Plus size={16} /> Create
                        </button>
                    </div>
                </div>
            </div>

            {/* MAIN TABLE */}
            <AdsTable
                data={visibleData}
                isLoading={loading && data.length === 0}
                sortConfig={sortConfig}
                onSort={(key) => {
                    setSortConfig(current => ({
                        key,
                        direction: current?.key === key && current.direction === 'asc' ? 'desc' : 'asc'
                    }));
                }}
                hasMore={hasMore}
                onLoadMore={() => setLimit(l => l + 25)}
            />

            {/* WIZARD */}
            <CreationWizard
                isOpen={isWizardOpen}
                onClose={() => setWizardOpen(false)}
                // onSave handled internally via context or we can pass refresh trigger
                onSave={(draft) => {
                    // Maybe trigger refresh if published?
                    console.log("Wizard action complete", draft);
                }}
            />
        </div>
    );
};

import { DraftProvider } from './context/DraftContext';

export const AdsManager: React.FC<AdsManagerProps> = (props) => {
    return (
        <AdsManagerProvider {...props}>
            <DraftProvider>
                <AdsManagerContent />
            </DraftProvider>
        </AdsManagerProvider>
    );
};
