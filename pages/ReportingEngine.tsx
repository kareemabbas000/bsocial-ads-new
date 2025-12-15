import React, { useState, useEffect, useRef, useMemo } from 'react';
import { toJpeg } from 'html-to-image';
import jsPDF from 'jspdf';
import { Download, FileText, Loader2, Sparkles, RefreshCcw, ChefHat, ChevronUp, ChevronDown, Clock, Zap } from 'lucide-react';

import {
    fetchAccountInsights,
    fetchDailyAccountInsights,
    fetchCampaignsWithInsights,
    fetchBreakdown,
    fetchPlacementBreakdown,
    getPreviousPeriod,
    fetchTopPerformingAds,
    fetchCreativePerformance,
    resolveDateRange
} from '../services/metaService';

import {
    Theme, GlobalFilter, UserConfig, DateSelection, DailyInsight, Campaign, AccountHierarchy
} from '../types';

import { PDFStatCards } from '../components/reporting/PDFStatCards';
import { PDFTrendChart } from '../components/reporting/PDFTrendChart';
import { PDFFunnelVelocity } from '../components/reporting/PDFFunnelVelocity';
import { PDFPlacements } from '../components/reporting/PDFPlacements';
import { PDFDemographics } from '../components/reporting/PDFDemographics';
import { PDFLedger } from '../components/reporting/PDFLedger';
import { PDFPlacementLedger } from '../components/reporting/PDFPlacementLedger';
import { PDFCreativeGrid } from '../components/reporting/PDFCreativeGrid';
import { PROFILE_CONFIG } from '../constants/profileConfig';

import { ReportingControlPanel } from '../components/reporting/ReportingControlPanel';
import { ReportContainer } from '../components/reporting/ReportContainer';
import { ReportActionDeck } from '../components/reporting/ReportActionDeck';

interface ReportingEngineProps {
    token: string;
    accountIds: string[];
    datePreset: DateSelection;
    theme: Theme;
    filter: GlobalFilter;
    userConfig?: UserConfig;
    activeTab?: string;
    hierarchy: AccountHierarchy;
}

type GenerationStatus = 'idle' | 'generating' | 'ready';

const ReportingEngine: React.FC<ReportingEngineProps> = ({
    token, accountIds, datePreset, theme, filter, userConfig, hierarchy
}) => {
    // --- Local Managed State ---
    const [reportTitle, setReportTitle] = useState("Performance Report");
    const [reportSubtitle, setReportSubtitle] = useState("Account Overview & Insights");

    // Initialize Local State with Constraints if present, else Global Prop
    const [localDate, setLocalDate] = useState<DateSelection>(() => {
        if (userConfig?.fixed_date_start && userConfig?.fixed_date_end) {
            return {
                preset: 'custom',
                custom: { startDate: userConfig.fixed_date_start, endDate: userConfig.fixed_date_end }
            };
        }
        return datePreset;
    });

    const [localFilter, setLocalFilter] = useState<GlobalFilter>(() => {
        if (userConfig?.global_campaign_filter && userConfig.global_campaign_filter.length > 0) {
            return {
                ...filter,
                selectedCampaignIds: userConfig.global_campaign_filter
            };
        }
        return filter;
    });

    const [selectedProfile, setSelectedProfile] = useState<string>(() => {
        const allowedProfiles = userConfig?.allowed_profiles || ['sales', 'engagement', 'leads', 'messenger'];
        if (allowedProfiles.length > 0) return allowedProfiles[0];
        return 'sales';
    });

    const [isPreviewCollapsed, setIsPreviewCollapsed] = useState(true);

    // Smart Save Logic
    useEffect(() => {
        const saved = localStorage.getItem('user_saved_report_config');
        if (saved) {
            try {
                const config = JSON.parse(saved);
                if (config.title) setReportTitle(config.title);
                if (config.subtitle) setReportSubtitle(config.subtitle);
                if (config.profile) setSelectedProfile(config.profile);
            } catch (e) {
                console.error("Failed to load saved report config", e);
            }
        }
    }, []);

    const handleSaveConfig = () => {
        const config = {
            title: reportTitle,
            subtitle: reportSubtitle,
            profile: selectedProfile
        };
        localStorage.setItem('user_saved_report_config', JSON.stringify(config));
        alert("Report configuration saved!");
    };

    const activeProfileConfig = PROFILE_CONFIG[selectedProfile] || PROFILE_CONFIG['sales'];

    // --- Generation Flow State ---
    const [status, setStatus] = useState<GenerationStatus>('idle');
    const [progress, setProgress] = useState(0);

    // Reset status when configuration changes
    useEffect(() => {
        if (status === 'ready') {
            setStatus('idle');
            setProgress(0);
        }
    }, [reportTitle, reportSubtitle, localDate, localFilter, selectedProfile]);

    // Sync if Global Props change AND no constraints exist
    useEffect(() => {
        if (!userConfig?.fixed_date_start) {
            setLocalDate(datePreset);
        }
    }, [datePreset, userConfig]);

    useEffect(() => {
        if (!userConfig?.global_campaign_filter || userConfig.global_campaign_filter.length === 0) {
            setLocalFilter(filter);
        }
    }, [filter, userConfig]);


    // --- Data State ---
    const [loading, setLoading] = useState(false); // Internal loading for data fetch
    const [accountData, setAccountData] = useState<any>(null);
    const [prevAccountData, setPrevAccountData] = useState<any>(null);
    const [dailyData, setDailyData] = useState<DailyInsight[]>([]);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [ageGenderData, setAgeGenderData] = useState<any[]>([]);
    const [regionData, setRegionData] = useState<any[]>([]);
    const [placementData, setPlacementData] = useState<any[]>([]);
    const [topCreatives, setTopCreatives] = useState<any[]>([]);

    // PDF / Image Export Handler
    const targetRef = useRef<HTMLDivElement>(null);

    const handleGenerateReport = async () => {
        setStatus('generating');
        setProgress(10);
        setLoading(true);

        try {
            // 1. Fetch Data
            await loadData();
            setProgress(50);

            // 2. Simulate Rendering Delay (for chart animations to complete in hidden view)
            await new Promise(resolve => setTimeout(resolve, 1500));
            setProgress(80);

            // 3. Finalize
            await new Promise(resolve => setTimeout(resolve, 500));
            setProgress(100);
            setStatus('ready');

        } catch (e) {
            console.error(e);
            setStatus('idle');
            alert("Failed to generate report. Please check your connection.");
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPDF = async () => {
        if (!targetRef.current) return;

        // Temporarily setLoading to true strictly for button state (optional)
        try {
            // 1. Capture High-Fidelity Image using html-to-image (optimized as JPEG)
            const element = targetRef.current;

            // Use JPEG instead of PNG to significantly reduce file size
            const dataUrl = await toJpeg(element, {
                quality: 0.95, // High quality, but compressed
                pixelRatio: 2,
                backgroundColor: isDark ? '#020617' : '#ffffff', // JPEG requires opaque background
                cacheBust: true,
            });

            // 2. Load Image to calculate dimensions
            const img = new Image();
            img.src = dataUrl;
            await new Promise((resolve) => { img.onload = resolve; });

            // 3. Calculate PDF Dimensions
            const mmWidth = img.width * 0.264583 / 2;
            const mmHeight = img.height * 0.264583 / 2;

            // 4. Generate PDF
            const pdf = new jsPDF({
                orientation: mmWidth > mmHeight ? 'l' : 'p',
                unit: 'mm',
                format: [mmWidth + 10, mmHeight + 10],
                compress: true // Enable PDF CleanUp/Compression
            });

            pdf.addImage(dataUrl, 'JPEG', 5, 5, mmWidth, mmHeight);

            // Generate Filename: [Title] - [DateRange].pdf
            const sanitizedTitle = reportTitle.replace(/[^a-zA-Z0-9-_ ]/g, '').trim() || 'Report';
            const dateStr = resolveDateRange(localDate);
            const fileName = `${sanitizedTitle} - ${dateStr.since} to ${dateStr.until}.pdf`;

            pdf.save(fileName);

        } catch (err) {
            console.error("PDF Export Failed", err);
            alert("Failed to download PDF. Please try again.");
        }
    };

    // Config
    const isDark = theme === 'dark';
    const multiplier = userConfig?.spend_multiplier || 1.0;
    const hideCost = !!userConfig?.hide_total_spend;
    const showPreview = !!userConfig?.enable_report_preview;
    const disableCreativeTags = !!userConfig?.disable_creative_tags;

    // ... (COLORS and reportConfig config)
    const COLORS = {
        blue: '#0055ff',
        purple: '#8b5cf6',
        emerald: '#10b981',
        pink: '#ec4899',
    };
    const reportConfig = {
        cards: [
            { id: 'spend', label: 'Total Spend', key: 'spend', format: 'currency' },
            { id: 'roas', label: 'ROAS', key: 'purchase_roas', format: 'x' },
            { id: 'cpa', label: 'CPA', key: 'cpa', format: 'currency' },
            { id: 'ctr', label: 'CTR', key: 'ctr', format: 'percent' },
        ],
        mainChart: {
            title: 'Spend vs. ROAS Trend',
            bar: { key: 'spend', color: COLORS.blue, name: 'Spend', axisLabel: 'SPEND' },
            line: { key: 'roas', color: COLORS.emerald, name: 'ROAS', axisLabel: 'ROAS' }
        },
        funnel: ['Impressions', 'Clicks', 'Link Clicks', 'Purchases'],
        breakdownMetric: 'spend'
    };


    // --- Data Fetching Logic ---
    const loadData = async () => {
        // FORCE: Always use localFilter which respects constraints
        const appliedFilter = localFilter;
        const prevRange = getPreviousPeriod(localDate);

        const promises: Promise<any>[] = [
            fetchAccountInsights(accountIds, token, localDate, appliedFilter),
            fetchDailyAccountInsights(accountIds, token, localDate, appliedFilter),
            fetchCampaignsWithInsights(accountIds, token, localDate, appliedFilter),
            fetchBreakdown(accountIds, token, localDate, 'age,gender', appliedFilter),
            fetchPlacementBreakdown(accountIds, token, localDate, appliedFilter),
            fetchBreakdown(accountIds, token, localDate, 'region', appliedFilter),
            fetchCreativePerformance(accountIds, token, localDate, appliedFilter)
        ];

        if (prevRange) promises.push(fetchAccountInsights(accountIds, token, prevRange, appliedFilter));
        else promises.push(Promise.resolve(null));

        const [accData, dayData, campData, demoData, placeData, regData, adData, prevAccData] = await Promise.all(promises);

        setAccountData(accData);
        setPrevAccountData(prevAccData);

        // Process Daily Data
        const adjustedDaily = (dayData as any[]).map(d => ({
            ...d,
            spend: d.spend * multiplier,
            roas: (d.spend * multiplier) > 0 ? (d.roas * d.spend) / (d.spend * multiplier) : 0,
            cpc: (d.spend * multiplier) / (d.clicks || 1)
        })).sort((a: any, b: any) => new Date(a.date_start).getTime() - new Date(b.date_start).getTime());
        setDailyData(adjustedDaily);

        setCampaigns(campData?.data || []);
        setAgeGenderData(demoData);
        setPlacementData(placeData);
        setRegionData(regData);
        setTopCreatives(adData || []);
    };


    // --- Processing Hooks (Same as before) ---

    // ... (Keep existing useMemos: cardsData, funnelData, ledgerData, demographicsData, placementConfig, processedPlacements, placementListItems)
    // For brevity in this edit, assuming they are preserved or I need to re-include them.
    // I MUST re-include them to ensure logic works.

    const ledgerData = useMemo(() => {
        return campaigns
            .map(c => ({
                name: c.name,
                spend: (parseFloat(c.insights?.spend || '0') * multiplier).toFixed(2),
                impressions: c.insights?.impressions,
                reach: c.insights?.reach,
                clicks: c.insights?.clicks,
                purchases: (() => {
                    const acts = c.insights?.actions || [];
                    return acts.find((v: any) => v.action_type === 'omni_purchase' || v.action_type === 'purchase' || v.action_type === 'offsite_conversion.fb_pixel_purchase')?.value || '0';
                })(),
                ctr: c.insights?.ctr,
                roas: (() => {
                    const sp = parseFloat(c.insights?.spend || '0') * multiplier;
                    const vals = c.insights?.action_values || [];
                    const found = vals.find((v: any) => v.action_type.includes('purchase'))?.value;
                    const p = found || '0';
                    return sp > 0 ? (parseFloat(p) / sp).toFixed(2) : '0.00';
                })()
            }))
            .filter(c => parseFloat(c.spend) > 0 || parseInt(c.impressions || '0') > 0)
            .sort((a, b) => parseFloat(b.spend) - parseFloat(a.spend));
    }, [campaigns, multiplier]);

    const demographicsData = useMemo(() => {
        const uniqueAges = Array.from(new Set(ageGenderData.map(d => d.age)))
            .filter(age => age && age !== 'Unknown' && age !== 'unknown')
            .sort();
        const ageGender = uniqueAges.map(age => {
            const m = ageGenderData.find(d => d.age === age && d.gender === 'male');
            const f = ageGenderData.find(d => d.age === age && d.gender === 'female');
            return {
                age,
                Male: parseFloat(m?.[hideCost ? 'impressions' : 'spend'] || '0') * (hideCost ? 1 : multiplier),
                Female: parseFloat(f?.[hideCost ? 'impressions' : 'spend'] || '0') * (hideCost ? 1 : multiplier)
            };
        });

        const regions = regionData
            .map(r => ({
                name: r.region,
                value: parseFloat(r?.[hideCost ? 'impressions' : 'spend'] || '0') * (hideCost ? 1 : multiplier)
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);

        return { ageGender, regions };
    }, [ageGenderData, regionData, multiplier, hideCost]);

    const placementConfig = useMemo(() => {
        const isSales = selectedProfile === 'sales';
        return {
            chartMetric: isSales ? 'spend' : 'impressions',
            chartLabel: isSales ? 'Spend' : 'Impressions',
            chartAxisLabel: isSales ? 'TOTAL SPEND' : 'IMPRESSIONS',

            listMetric: isSales ? 'purchase_roas'
                : selectedProfile === 'engagement' ? 'post_engagement'
                    : selectedProfile === 'leads' ? 'leads'
                        : 'messaging_conversations',
            listLabel: isSales ? 'ROAS'
                : selectedProfile === 'engagement' ? 'Engagement'
                    : selectedProfile === 'leads' ? 'Leads'
                        : 'Messages',
            listTitle: isSales ? 'Top Placements by ROAS'
                : selectedProfile === 'engagement' ? 'Top Placements by Engagement'
                    : selectedProfile === 'leads' ? 'Top Placements by Leads'
                        : 'Top Placements by Messages',
            listFormat: (val: number) => {
                if (isSales) return `${val.toFixed(2)}x`;
                if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
                if (val >= 1000) return `${(val / 1000).toFixed(1)}k`;
                return val.toString();
            }
        };
    }, [selectedProfile]);

    const processedPlacements = useMemo(() => {
        return placementData.map(p => {
            const spend = parseFloat(p.spend || '0') * multiplier;
            const impressions = parseInt(p.impressions || '0');

            let listValue = 0;
            if (placementConfig.listMetric === 'purchase_roas') {
                const vals = p.action_values || [];
                const purch = vals.find((v: any) => v.action_type === 'omni_purchase')?.value || vals.find((v: any) => v.action_type === 'purchase')?.value || '0';
                listValue = spend > 0 ? parseFloat(purch) / spend : 0;
            } else if (placementConfig.listMetric === 'post_engagement') {
                listValue = parseInt(p.actions?.find((a: any) => a.action_type === 'post_engagement')?.value || '0');
            } else if (placementConfig.listMetric === 'leads') {
                listValue = parseInt(p.actions?.find((a: any) => a.action_type === 'lead')?.value || '0');
            } else if (placementConfig.listMetric === 'messaging_conversations') {
                listValue = parseInt(p.actions?.find((a: any) => a.action_type === 'messaging_conversation_started_7d')?.value || '0');
            }

            return {
                name: `${p.publisher_platform}-${p.platform_position}`,
                spend,
                impressions,
                value: (hideCost || placementConfig.chartMetric !== 'spend') ? impressions : spend,
                listValue: listValue
            };
        }).sort((a, b) => b.value - a.value);
    }, [placementData, multiplier, placementConfig, hideCost]);

    const placementListItems = useMemo(() => {
        return [...processedPlacements]
            .map(p => ({ ...p, value: p.listValue }))
            .sort((a, b) => b.value - a.value);
    }, [processedPlacements]);


    // --- Render ---

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 overflow-hidden relative">

            {/* Hidden / Conditional Report Container for Capture */}
            <div
                className={`transition - all duration - 300 ${showPreview ? 'opacity-100 relative mb-8' : 'opacity-0 absolute -left-[9999px] top-0 pointer-events-none'} `}
                style={!showPreview ? { zIndex: -1 } : {}}
            >
                <div className={showPreview ? "p-4 max-w-full mx-auto border-4 border-dashed border-brand-500/30 rounded-3xl" : ""}>
                    {showPreview && (
                        <div
                            className="flex items-center justify-center gap-2 text-center text-sm font-bold text-brand-500 mb-4 uppercase tracking-widest cursor-pointer hover:text-brand-600 transition-colors"
                            onClick={() => setIsPreviewCollapsed(!isPreviewCollapsed)}
                        >
                            <span>--- Admin Live Preview Mode ---</span>
                            {isPreviewCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                        </div>
                    )}
                    <div className={isPreviewCollapsed && showPreview ? "absolute left-0 top-0 opacity-0 pointer-events-none w-full h-0 overflow-hidden" : ""}>
                        <ReportContainer
                            refProp={targetRef}
                            isDark={isDark}
                            title={reportTitle}
                            subtitle={reportSubtitle}
                            dateRange={`${resolveDateRange(localDate).since} to ${resolveDateRange(localDate).until}`}
                        >
                            {/* 3. Key Metrics Grid (Dynamic based on Profile) */}
                            {/* 3. Key Metrics Grid (Dynamic based on Profile) */}
                            {(() => {
                                const allCards = activeProfileConfig.cards;
                                let visibleCards = allCards;

                                // CUSTOM LOGIC: User requested specific overrides when Spend is Hidden
                                if (hideCost) {
                                    if (selectedProfile === 'sales') {
                                        // "Reach, Impressions, Purchases, CTR"
                                        visibleCards = [
                                            { id: 'reach', label: 'Reach', format: 'number', color: COLORS.blue },
                                            { id: 'impressions', label: 'Impressions', format: 'number', color: COLORS.purple },
                                            { id: 'purchases', label: 'Purchases', format: 'number', color: COLORS.emerald },
                                            { id: 'ctr', label: 'CTR', format: 'percent', color: COLORS.blue }
                                        ];
                                    } else {
                                        // Default behavior: Filter out cost metrics
                                        visibleCards = allCards.filter(c => !['spend', 'cpa', 'roas', 'cpc', 'revenue'].includes(c.id));
                                    }
                                }

                                const count = visibleCards.length;
                                const gridClass = count === 1 ? 'grid-cols-1 w-1/3 mx-auto'
                                    : count === 2 ? 'grid-cols-2 w-2/3 mx-auto'
                                        : count === 3 ? 'grid-cols-3'
                                            : count === 5 ? 'grid-cols-5'
                                                : 'grid-cols-4';

                                return (
                                    <div className={`grid ${gridClass} gap-4 mb-8 break-inside-avoid`}>
                                        <PDFStatCards cards={visibleCards} data={accountData} prevData={prevAccountData} isDark={isDark} />
                                    </div>
                                );
                            })()}


                            <div className="mb-8 break-inside-avoid">
                                <PDFTrendChart
                                    data={dailyData}
                                    isDark={isDark}
                                    config={activeProfileConfig.mainChart}
                                    hideCost={hideCost}
                                />
                            </div>

                            <div className="mb-8 break-inside-avoid">
                                <PDFFunnelVelocity
                                    data={accountData}
                                    isDark={isDark}
                                    steps={activeProfileConfig.funnel}
                                    hideCost={hideCost}
                                />
                            </div>

                            <div className="space-y-4">
                                <PDFDemographics
                                    data={demographicsData}
                                    isDark={isDark}
                                    styles={{ chartGrid: isDark ? '#1e293b' : '#cbd5e1', chartAxis: isDark ? '#64748b' : '#94a3b8' }}
                                    hideCost={hideCost}
                                />
                                <div className="grid grid-cols-2 gap-8 mb-8">
                                    <PDFPlacements
                                        data={processedPlacements}
                                        isDark={isDark}
                                        styles={{ chartGrid: isDark ? '#1e293b' : '#cbd5e1', chartAxis: isDark ? '#64748b' : '#94a3b8' }}
                                        title={`Placement Performance (${placementConfig.chartLabel})`}
                                        xAxisLabel={placementConfig.chartAxisLabel}
                                        yAxisLabel="PLACEMENT"
                                        hideCost={hideCost}
                                    />
                                    <PDFPlacementLedger
                                        data={placementListItems}
                                        isDark={isDark}
                                        styles={{}}
                                        title={placementConfig.listTitle}
                                        metricLabel={placementConfig.listLabel}
                                        formatter={placementConfig.listFormat}
                                        hideCost={hideCost}
                                    />
                                </div>
                                {selectedProfile === 'sales' && (
                                    <PDFLedger data={ledgerData} isDark={isDark} styles={{}} hideCost={hideCost} />
                                )}
                                {topCreatives.length > 0 && (
                                    <PDFCreativeGrid
                                        items={(() => {
                                            // Sort by Purchases if:
                                            // 1. Hide Cost is ON (focus on value)
                                            // 2. OR Profile is SALES (User specifically requested sorting by purchases for Sales)
                                            if (hideCost || selectedProfile === 'sales') {
                                                return [...topCreatives].sort((a, b) => {
                                                    const getPurch = (item: any) => {
                                                        const acts = item.actions || [];
                                                        let valObj = acts.find((x: any) => x.action_type === 'omni_purchase' || x.action_type === 'purchase');
                                                        if (!valObj) valObj = acts.find((x: any) => x.action_type === 'offsite_conversion.fb_pixel_purchase');
                                                        if (!valObj) valObj = acts.find((x: any) => x.action_type.toLowerCase().includes('purchase'));
                                                        return parseFloat(valObj?.value || '0');
                                                    };
                                                    return getPurch(b) - getPurch(a);
                                                });
                                            }
                                            return topCreatives;
                                        })()}
                                        isDark={isDark}
                                        hideCost={hideCost}
                                        selectedProfile={selectedProfile}
                                    />
                                )}
                            </div>
                            <div className="text-center text-xs text-slate-400 mt-8 pt-8 border-t border-slate-200 dark:border-slate-800">
                                Generated by BSocial Ad Intelligence Engine • {new Date().toLocaleDateString()}
                            </div>
                        </ReportContainer>
                    </div>
                </div>
            </div>

            {/* MAIN UI: Report Kitchen - Split Screen Studio */}
            <div className="flex-1 overflow-y-auto w-full h-full flex flex-col p-4 md:p-6">

                <div className="relative z-10 w-full max-w-7xl mx-auto flex-1 flex flex-col justify-center">

                    {/* MOBILE LAYOUT: Compact Header (< XL) */}
                    <div className="xl:hidden w-full mb-6 text-center animate-fade-in-up">
                        <div className={`inline-flex items-center justify-center p-4 rounded-2xl shadow-lg mb-4
                            ${isDark ? 'bg-gradient-to-br from-brand-600 to-indigo-600 shadow-brand-500/20' : 'bg-gradient-to-br from-brand-500 to-indigo-500 shadow-brand-500/30'}
                        `}>
                            <ChefHat size={40} className="text-white" />
                        </div>
                        <h1 className={`text-4xl font-black tracking-tighter ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            Report <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-indigo-500">Kitchen</span>
                        </h1>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 xl:gap-8 items-stretch min-h-[500px]">

                        {/* LEFT PANEL: Desktop Studio (Hero & Actions) - XL+ ONLY */}
                        <div className="hidden xl:flex xl:col-span-4 flex-col">
                            <div className={`relative overflow-hidden rounded-[2rem] border shadow-2xl flex-1 flex flex-col items-center justify-center p-8 text-center transition-all duration-300 ${isDark ? 'bg-slate-900/60 border-white/10 shadow-black/50 backdrop-blur-xl' : 'bg-white/80 border-white/60 shadow-xl backdrop-blur-xl'}`}>

                                {/* Ambient Glow */}
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-brand-500/20 rounded-full blur-[80px]" />

                                <div className="relative z-10 flex flex-col items-center space-y-8 my-auto w-full">
                                    {/* Icon */}
                                    <div className="relative group cursor-default">
                                        <div className="absolute inset-0 bg-brand-500 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-1000" />
                                        <div className="relative p-6 rounded-[2rem] bg-gradient-to-br from-brand-500 to-indigo-600 shadow-2xl shadow-brand-500/30 transform group-hover:scale-105 transition-all duration-300">
                                            <ChefHat size={48} className="text-white drop-shadow-md" />
                                        </div>
                                    </div>

                                    {/* Typography */}
                                    <div className="space-y-3">
                                        <h1 className={`text-5xl font-black tracking-tighter leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                            Report<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-indigo-500">Kitchen</span>
                                        </h1>
                                        <p className={`text-sm font-medium opacity-80 max-w-[200px] mx-auto leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                                            Cook up fresh, high-fidelity PDF reports in seconds.
                                        </p>
                                    </div>

                                    {/* Actions (Desktop) */}
                                    <ReportActionDeck
                                        status={status}
                                        progress={progress}
                                        onGenerate={handleGenerateReport}
                                        onDownload={handleDownloadPDF}
                                        onReset={() => setStatus('idle')}
                                        isDark={isDark}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* RIGHT PANEL: Configuration Deck (Full Width on Mobile) */}
                        <div className="xl:col-span-8 flex flex-col relative z-20">
                            <div className={`h-full rounded-[2rem] border shadow-2xl backdrop-blur-xl transition-all duration-300 relative flex flex-col ${isDark ? 'bg-slate-900/40 border-white/10 shadow-black/50' : 'bg-white/60 border-white/60 shadow-xl'}`}>

                                {/* Decorative Background Layer (Clipped) */}
                                <div className="absolute inset-0 overflow-hidden rounded-[2rem] pointer-events-none z-0">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px]" />
                                </div>

                                {/* Content Layer (Visible Overflow) */}
                                <div className="relative z-10 p-6 lg:p-10 flex flex-col h-full">
                                    <div className="flex items-center justify-between mb-8">
                                        <h3 className={`text-xs font-black uppercase tracking-widest flex items-center ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                            <div className="w-8 h-0.5 bg-current mr-3 rounded-full opacity-50" />
                                            Configuration Deck
                                        </h3>
                                        <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${isDark ? 'bg-white/5 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                                            v2.0
                                        </div>
                                    </div>

                                    <div className={`relative z-10 rounded-2xl p-1 transition-all flex-1 ${isDark ? 'bg-slate-950/50 ring-1 ring-white/5' : 'bg-white/80 ring-1 ring-slate-200'}`}>
                                        <ReportingControlPanel
                                            title={reportTitle}
                                            onTitleChange={setReportTitle}
                                            subtitle={reportSubtitle}
                                            onSubtitleChange={setReportSubtitle}
                                            dateSelection={localDate}
                                            onDateChange={setLocalDate}
                                            filter={localFilter}
                                            onFilterChange={setLocalFilter}
                                            selectedProfile={selectedProfile}
                                            onProfileChange={setSelectedProfile}
                                            hierarchy={hierarchy}
                                            theme={theme}
                                            userConfig={userConfig}
                                        />
                                    </div>

                                    {/* Mobile Actions Footer (< XL) */}
                                    <div className="xl:hidden mt-6 pt-6 border-t border-slate-200 dark:border-slate-800/50">
                                        <ReportActionDeck
                                            status={status}
                                            progress={progress}
                                            onGenerate={handleGenerateReport}
                                            onDownload={handleDownloadPDF}
                                            onReset={() => setStatus('idle')}
                                            isDark={isDark}
                                            mobileMode={true}
                                        />
                                    </div>

                                    {/* Helper Text (Hidden on Mobile to save space, visible MD+) */}
                                    <div className="hidden md:grid relative z-10 mt-6 grid-cols-1 md:grid-cols-2 gap-4 opacity-60">
                                        <div className="flex items-start space-x-3 p-3 rounded-xl hover:bg-white/5 transition-colors cursor-help group">
                                            <div className="p-1.5 rounded-full bg-slate-500/10 text-slate-500 mt-0.5 group-hover:text-brand-500 transition-colors"><Zap size={12} /></div>
                                            <div>
                                                <h4 className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Real-time Data</h4>
                                                <p className="text-[10px] text-slate-500 mt-0.5">Fetching latest insights directly from Meta Graph API.</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start space-x-3 p-3 rounded-xl hover:bg-white/5 transition-colors cursor-help group">
                                            <div className="p-1.5 rounded-full bg-slate-500/10 text-slate-500 mt-0.5 group-hover:text-amber-500 transition-colors"><FileText size={12} /></div>
                                            <div>
                                                <h4 className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>High Fidelity</h4>
                                                <p className="text-[10px] text-slate-500 mt-0.5">Vector-quality charts and typography for professional PDFs.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportingEngine;
