import React, { useState, useEffect } from 'react';
import { Plus, Sparkles, ChevronDown } from 'lucide-react';
import { CreationWizard } from './components/CreationWizard/CreationWizard';
import { CampaignStrategist } from './components/CampaignStrategist';
import { fetchCampaignsWithInsights, fetchAdSetsWithInsights, fetchAdsWithInsights } from '../../services/metaService';
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

    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isWizardOpen, setWizardOpen] = useState(false);
    const [isAIStudioOpen, setAIStudioOpen] = useState(false);
    const [aiPrompt, setAiPrompt] = useState<string>('');

    // Pagination (Client Side Slicing)
    const [limit, setLimit] = useState(25);

    // Search & Sort State
    const [searchQuery, setSearchQuery] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

    // View Cache for Instant Switching
    const [viewCache, setViewCache] = useState<Record<string, any[]>>({});

    const loadData = async () => {
        if (!token || accountIds.length === 0) return;

        // 1. Generate Cache Key
        const parentId = breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1].id : 'root';
        const cacheKey = `${currentLevel}-${parentId}-${dateSelection.preset || 'custom'}`;

        // 2. Check View Cache for Instant Render
        const cached = viewCache[cacheKey];
        if (cached) {
            setData(cached);
            setLoading(false);
            return;
        }

        setLoading(true);
        setData([]); // Clear data when loading new data (not from cache)

        try {
            // Drill-down Logic
            let response;
            if (currentLevel === 'CAMPAIGN') {
                response = await fetchCampaignsWithInsights(accountIds, token, dateSelection, filter);
            } else if (currentLevel === 'ADSET') {
                response = await fetchAdSetsWithInsights(accountIds, token, dateSelection, filter, parentId === 'root' ? undefined : parentId);
            } else if (currentLevel === 'AD') {
                response = await fetchAdsWithInsights(accountIds, token, dateSelection, filter, parentId === 'root' ? undefined : parentId);
            }

            if (response && response.data) {
                setData(response.data);
                // 3. Update Cache
                setViewCache(prev => ({ ...prev, [cacheKey]: response.data }));
            } else {
                setData([]);
            }
        } catch (e) {
            console.error("Failed to load ads data", e);
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    // Force clear cache on component MOUNT so fresh entry always shows SmartLoader
    // But keep cache alive during tab switching (component stays mounted)
    useEffect(() => {
        setViewCache({});
    }, []);

    useEffect(() => {
        loadData();
    }, [token, accountIds, dateSelection, filter, currentLevel, breadcrumbs, refreshTrigger]);

    // Reset pagination on filter/level change
    useEffect(() => {
        setLimit(25);
    }, [currentLevel, searchQuery, sortConfig]);

    // Apply Local Search & Sort
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
                let aVal: any = a[sortConfig.key];
                let bVal: any = b[sortConfig.key];

                // Handle nested insights for sorting
                if (['spend', 'impressions', 'reach', 'cpm', 'cpc', 'ctr'].includes(sortConfig.key)) {
                    aVal = a.insights?.[sortConfig.key] || 0;
                    bVal = b.insights?.[sortConfig.key] || 0;

                    // Numeric parsing for insights
                    if (typeof aVal === 'string') aVal = parseFloat(aVal);
                    if (typeof bVal === 'string') bVal = parseFloat(bVal);
                }

                if (sortConfig.key === 'results') {
                    aVal = parseInt(a.insights?.actions?.[0]?.value || '0');
                    bVal = parseInt(b.insights?.actions?.[0]?.value || '0');
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
    // Only block if we have NO data to show AND it is the very first load (ViewCache empty)
    // This ensures tab switching uses the table skeleton (native feel) instead of blocking.
    const isFirstLoad = Object.keys(viewCache).length === 0;

    if (loading && data.length === 0 && isFirstLoad) {
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
                <div className="animate-in slide-in-from-top-4 duration-500">
                    <AIAnalyst
                        data={data}
                        level={currentLevel}
                        onAction={(prompt) => {
                            setAiPrompt(prompt);
                            setAIStudioOpen(true);
                        }}
                    />
                </div>

                <div className="flex justify-between items-end">
                    <div className="flex-1">
                        <AdsNavigator />
                    </div>

                    {/* SEARCH BAR */}
                    <div className="mx-4 flex-1 max-w-sm relative">
                        <input
                            type="text"
                            placeholder={`Search ${currentLevel.toLowerCase()}s...`}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={`w-full border rounded-lg py-1.5 px-3 text-sm focus:border-purple-500 outline-none shadow-inner transition-colors ${theme === 'dark'
                                ? 'bg-slate-900 border-slate-700 text-slate-200'
                                : 'bg-white border-slate-200 text-slate-800'
                                }`}
                        />
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => setAIStudioOpen(true)}
                            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-3 py-1.5 rounded-lg text-sm font-bold shadow-lg shadow-purple-500/25 transition-all border border-purple-400/20 hover:scale-105 active:scale-95"
                        >
                            <Sparkles size={14} /> AI Planner
                        </button>
                        <div className="w-px bg-slate-800 mx-1" />
                        <MetricsSelector />
                        <button
                            onClick={() => setWizardOpen(true)}
                            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-sm font-bold shadow-lg shadow-emerald-500/25 transition-all hover:scale-105 active:scale-95"
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
                onSave={(draft) => console.log(draft)}
            />
        </div>
    );
};

export const AdsManager: React.FC<AdsManagerProps> = (props) => {
    return (
        <AdsManagerProvider {...props}>
            <AdsManagerContent />
        </AdsManagerProvider>
    );
};
