
import React, { useEffect, useState, useMemo } from 'react';
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
  
  // Apply Permissions
  const multiplier = userConfig?.spend_multiplier || 1.0;
  const hideTotalSpend = userConfig?.hide_total_spend || false;
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
  
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
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
              let action = source.actions?.find((a:any) => a.action_type === 'omni_purchase');
              if(!action) action = source.actions?.find((a:any) => a.action_type === 'purchase');
              if(!action) action = source.actions?.find((a:any) => a.action_type === 'offsite_conversion.fb_pixel_purchase');
              if(!action) action = source.actions?.find((a:any) => a.action_type.toLowerCase().includes('purchase'));
              
              conv = parseInt(action?.value || '0');
          }
          else if (profile === 'leads') conv = parseInt(source.actions?.find((a:any)=>a.action_type==='lead')?.value || '0');
          else if (profile === 'messenger') conv = parseInt(source.actions?.find((a:any)=>a.action_type==='messaging_conversation_started_7d')?.value || '0');
          
          if (conv === 0) conv = parseInt(source.actions?.find((a:any)=>['purchase','lead'].includes(a.action_type))?.value || '0');
          
          return conv > 0 ? spend / conv : 0;
      }
      
      if (key === 'roas') {
          const spend = parseFloat(source.spend || '0') * multiplier;
          if (spend === 0) return 0;
          
          const actionValues = source.action_values || [];
          let purchaseValueObj = actionValues.find((v: any) => v.action_type === 'omni_purchase');
          if(!purchaseValueObj) purchaseValueObj = actionValues.find((v: any) => v.action_type === 'purchase');
          if(!purchaseValueObj) purchaseValueObj = actionValues.find((v: any) => v.action_type === 'offsite_conversion.fb_pixel_purchase');
          
          const purchaseValue = purchaseValueObj ? parseFloat(purchaseValueObj.value) : 0;
          return purchaseValue / spend;
      }

      if (key === 'post_engagement' || key === 'leads' || key === 'messaging_conversations') {
          const mapping = {
              'post_engagement': 'post_engagement',
              'leads': 'lead',
              'messaging_conversations': 'messaging_conversation_started_7d'
          };
          return parseInt(source.actions?.find((a:any) => a.action_type.includes(mapping[key as keyof typeof mapping]))?.value || '0');
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

      setDailyData([...adjustedDaily].sort((a: any,b: any) => new Date(a.date_start).getTime() - new Date(b.date_start).getTime()));
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

  const activeConfig = PROFILE_CONFIG[profile];

  const processedFunnelData = useMemo(() => {
      if (!accountData) return [];
      
      let purchaseAction = accountData.actions?.find((a:any) => a.action_type === 'omni_purchase');
      if (!purchaseAction) purchaseAction = accountData.actions?.find((a:any) => a.action_type === 'purchase');
      
      const metrics = {
          'Reach': parseInt(accountData.reach || '0'),
          'Impressions': parseInt(accountData.impressions || '0'),
          'Clicks': parseInt(accountData.clicks || '0'),
          'Link Clicks': parseInt(accountData.inline_link_clicks || '0'),
          'Post Engagements': parseInt(accountData.actions?.find((a:any) => a.action_type === 'post_engagement')?.value || '0'),
          'Leads': parseInt(accountData.actions?.find((a:any) => a.action_type === 'lead')?.value || '0'),
          'Conversations': parseInt(accountData.actions?.find((a:any) => a.action_type === 'onsite_conversion.messaging_conversation_started_7d' || a.action_type === 'messaging_conversation_started_7d')?.value || '0'),
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
      return regionData.slice(0,10).map(d => {
        const val = parseFloat(d?.[metricKey] || '0') * (metricKey === 'spend' ? multiplier : 1);
        const spend = parseFloat(d.spend || '1') * multiplier;
        return {
            name: d.region || 'Unknown',
            value: val,
            roas: d.action_values ? (parseFloat(d.action_values[0]?.value)/spend) : 0
      }}).sort((a,b) => b.value - a.value);
  }, [regionData, profile, multiplier]);

  const processedPlacements = useMemo(() => {
      return placementData
        .map(d => {
            const impr = parseInt(d.impressions || '0');
            const spend = parseFloat(d.spend || '0') * multiplier;
            
            const postEng = parseInt(d.actions?.find((a:any) => a.action_type === 'post_engagement')?.value || '0');
            const leads = parseInt(d.actions?.find((a:any) => a.action_type === 'lead')?.value || '0');
            const msgs = parseInt(d.actions?.find((a:any) => a.action_type === 'onsite_conversion.messaging_conversation_started_7d' || a.action_type === 'messaging_conversation_started_7d')?.value || '0');
            
            const actionValues = d.action_values || [];
            let purchaseVal = actionValues.find((v:any) => v.action_type === 'omni_purchase')?.value;
            if(!purchaseVal) purchaseVal = actionValues.find((v:any) => v.action_type === 'purchase')?.value;
            const roas = spend > 0 ? (parseFloat(purchaseVal || '0') / spend) : 0;
            
            let efficiency = 0;
            let efficiencyLabel = '';
            let volume = 0;
            let volumeLabel = '';

            if (profile === 'sales') {
                volume = spend;
                volumeLabel = 'Spend';
                efficiency = roas;
                efficiencyLabel = 'ROAS';
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
                impressions: impr,
                roas,
                post_engagement: postEng,
                leads,
                messaging_conversations: msgs
            };
        })
        .sort((a,b) => b.value - a.value);
  }, [placementData, profile, multiplier]);

  const handleRunAI = async () => {
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
    
    // Find Peak
    const peak = hourlyData.reduce((prev, curr) => prev[heatmapMetric] > curr[heatmapMetric] ? prev : curr);
    
    // Find low (that is non-zero if possible)
    const low = hourlyData.reduce((prev, curr) => (curr[heatmapMetric] > 0 && curr[heatmapMetric] < prev[heatmapMetric]) ? curr : prev);
    
    // Metric Name formatting
    const mName = heatmapMetric === 'ctr' ? 'Click-Through Rate' : heatmapMetric.charAt(0).toUpperCase() + heatmapMetric.slice(1);
    
    return (
      <div className={`mt-6 p-5 rounded-xl border flex items-start space-x-4 ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'} shadow-sm`}>
          <div className={`p-3 rounded-full shrink-0 ${isDark ? 'bg-brand-900/40 text-brand-400 border border-brand-500/20' : 'bg-brand-100 text-brand-600 border border-brand-200'}`}>
              <Sparkles size={20} className="animate-pulse" />
          </div>
          <div>
              <h4 className={`text-base font-bold mb-1 flex items-center ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Smart Insights: {mName} Distribution
              </h4>
              <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  User activity for <strong className={isDark ? 'text-brand-300' : 'text-brand-700'}>{mName}</strong> peaks at <strong className={isDark ? 'text-white' : 'text-slate-900'}>{peak.hour}:00</strong> with a value of <strong className={isDark ? 'text-white' : 'text-slate-900'}>{formatCompact(peak[heatmapMetric], heatmapMetric === 'ctr' ? 'percent' : '')}</strong>. 
                  {low.hour !== peak.hour && (
                      <> Lowest activity detected around <strong>{low.hour}:00</strong>. </>
                  )}
                  Consider scheduling higher budgets during the <strong className={isDark ? 'text-emerald-400' : 'text-emerald-600'}>{parseInt(peak.hour) - 1}:00 - {parseInt(peak.hour) + 2}:00</strong> window to maximize efficiency.
              </p>
          </div>
      </div>
    );
  }

  if (loading) {
    return <LoadingSpinner theme={theme} message="Loading Dashboard" />;
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
                  <div className="fixed inset-0 z-10" onClick={() => setIsProfileMenuOpen(false)}/>
                  <div className={`absolute top-full left-0 mt-2 w-64 rounded-xl shadow-2xl border p-2 z-20 animate-fade-in-down ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                      {(Object.keys(PROFILE_CONFIG) as DashboardProfile[]).filter(key => allowedProfiles.includes(key)).map((key) => {
                          const conf = PROFILE_CONFIG[key];
                          const isActive = profile === key;
                          return (
                              <button
                                key={key}
                                onClick={() => { setProfile(key); setIsProfileMenuOpen(false); }}
                                className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors ${
                                    isActive 
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

          <div className={`flex-1 w-full md:w-auto border rounded-xl px-4 py-2 flex items-center justify-between backdrop-blur-md ${isDark ? 'bg-blue-900/10 border-blue-800/30' : 'bg-blue-50 border-blue-100'}`}>
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
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {activeConfig.cards.map((card: any) => {
            if (card.id === 'spend' && hideTotalSpend) return null;

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
      <div className={`border-b flex space-x-6 overflow-x-auto ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          {[
            {id: 'overview', icon: Zap, label: 'Overview'},
            {id: 'audience', icon: Users, label: 'Audience'},
            {id: 'platform', icon: Smartphone, label: 'Placements'},
            {id: 'time', icon: Clock, label: 'Hourly Analytics'}
          ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`pb-3 text-sm font-medium capitalize transition-colors border-b-2 flex items-center space-x-2 whitespace-nowrap ${
                    activeTab === tab.id 
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
        <div className="lg:col-span-2 space-y-6">
            
            {activeTab === 'overview' && (
                <>
                    {/* Main Trend Chart */}
                    <div className={`${styles.cardBg} border rounded-xl p-6 min-h-[350px]`}>
                        <div className="flex justify-between items-center mb-6">
                             <h3 className={`text-lg font-semibold ${styles.heading}`}>{activeConfig.mainChart.title}</h3>
                             <div className="flex items-center space-x-2 text-xs">
                                 <span className="flex items-center"><div className="w-2 h-2 rounded-full mr-1" style={{backgroundColor: activeConfig.mainChart.bar.color}}></div> {activeConfig.mainChart.bar.name}</span>
                                 <span className="flex items-center"><div className="w-2 h-2 rounded-full mr-1" style={{backgroundColor: activeConfig.mainChart.line.color}}></div> {activeConfig.mainChart.line.name}</span>
                             </div>
                        </div>
                        <div className="h-80 w-full" style={{ width: '99%' }}> 
                            {dailyData.length > 0 && (
                                <ResponsiveContainer width="100%" height="100%" debounce={50}>
                                    <ComposedChart data={dailyData} margin={{ top: 10, right: 30, left: 20, bottom: 40 }}>
                                        <defs>
                                            <linearGradient id="colorMainBar" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={activeConfig.mainChart.bar.color} stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor={activeConfig.mainChart.bar.color} stopOpacity={0}/>
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
                                            <Label value={activeConfig.mainChart.line.axisLabel} angle={90} position="insideRight" style={{ textAnchor: 'middle', fill: styles.chartAxis, fontSize: '10px', fontWeight: 'bold' }} />
                                        </YAxis>
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: styles.tooltipBg, borderColor: styles.tooltipBorder, color: styles.tooltipText, borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} 
                                            labelFormatter={(label) => formatDateAxis(label)}
                                        />
                                        <Area yAxisId="left" type="monotone" dataKey={activeConfig.mainChart.bar.key} name={activeConfig.mainChart.bar.name} stroke={activeConfig.mainChart.bar.color} strokeWidth={2} fillOpacity={1} fill="url(#colorMainBar)" />
                                        <Line yAxisId="right" type="monotone" dataKey={activeConfig.mainChart.line.key} name={activeConfig.mainChart.line.name} stroke={activeConfig.mainChart.line.color} strokeWidth={2} dot={{r: 3, fill: activeConfig.mainChart.line.color, strokeWidth: 0}} />
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
                                                    <stop offset="5%" stopColor={activeConfig.secondary1.color} stopOpacity={0.2}/>
                                                    <stop offset="95%" stopColor={activeConfig.secondary1.color} stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke={styles.chartGrid} vertical={false}/>
                                            <XAxis dataKey="date_start" stroke={styles.chartAxis} fontSize={10} tickLine={false} axisLine={false} tickFormatter={formatDateAxis}>
                                                <Label value="DATE" offset={0} position="bottom" fill={styles.chartAxis} style={{ fontSize: '9px', fontWeight: 'bold' }} />
                                            </XAxis>
                                            <YAxis stroke={styles.chartAxis} fontSize={10} axisLine={false} tickLine={false} domain={['auto', 'auto']} tickFormatter={(val) => formatCompact(val, activeConfig.secondary1.key)}>
                                                <Label value={activeConfig.secondary1.axisLabel} angle={-90} position="insideLeft" style={{ textAnchor: 'middle', fill: styles.chartAxis, fontSize: '9px', fontWeight: 'bold' }} />
                                            </YAxis>
                                            <Tooltip 
                                                contentStyle={{ backgroundColor: styles.tooltipBg, borderColor: styles.tooltipBorder, color: styles.tooltipText, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} 
                                                labelFormatter={(label) => formatDateAxis(label)}
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
                                            <CartesianGrid strokeDasharray="3 3" stroke={styles.chartGrid} vertical={false}/>
                                            <XAxis dataKey="date_start" stroke={styles.chartAxis} fontSize={10} tickLine={false} axisLine={false} tickFormatter={formatDateAxis}>
                                                <Label value="DATE" offset={0} position="bottom" fill={styles.chartAxis} style={{ fontSize: '9px', fontWeight: 'bold' }} />
                                            </XAxis>
                                            <YAxis stroke={styles.chartAxis} fontSize={10} axisLine={false} tickLine={false} tickFormatter={(val) => formatCompact(val, activeConfig.secondary2.key)}>
                                                <Label value={activeConfig.secondary2.axisLabel} angle={-90} position="insideLeft" style={{ textAnchor: 'middle', fill: styles.chartAxis, fontSize: '9px', fontWeight: 'bold' }} />
                                            </YAxis>
                                            <Tooltip 
                                                contentStyle={{ backgroundColor: styles.tooltipBg, borderColor: styles.tooltipBorder, color: styles.tooltipText, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} 
                                                cursor={{fill: styles.chartGrid}}
                                                labelFormatter={(label) => formatDateAxis(label)}
                                            />
                                            <Bar dataKey={activeConfig.secondary2.key} fill={activeConfig.secondary2.color} radius={[2,2,0,0]} barSize={12} />
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
                    {/* Funnel Section - Scientific & Modern */}
                    <div className={`${styles.cardBg} border rounded-xl p-6`}>
                        <h3 className={`text-lg font-semibold ${styles.heading} mb-6 flex items-center`}>
                            <Filter className="mr-2 text-brand-500" size={18} />
                            Conversion Funnel Analysis
                        </h3>
                        <div className="relative w-full py-4">
                            {/* Connector Line (Desktop) */}
                            <div className={`hidden md:block absolute top-1/2 left-4 right-4 h-0.5 -translate-y-1/2 z-0 ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}></div>
                            
                            <div className="flex flex-col md:flex-row justify-between items-stretch gap-4 relative z-10">
                                {processedFunnelData.map((step, idx) => {
                                    const isLast = idx === processedFunnelData.length - 1;
                                    const nextStep = !isLast ? processedFunnelData[idx + 1] : null;
                                    const convRate = nextStep && step.value > 0 ? ((nextStep.value / step.value) * 100).toFixed(1) + '%' : null;

                                    return (
                                        <div key={idx} className="flex-1 flex flex-col md:flex-row items-center relative group">
                                            {/* Card */}
                                            <div className={`
                                                flex-1 w-full p-5 rounded-xl border backdrop-blur-xl transition-all duration-300
                                                ${isDark ? 'bg-slate-900/80 border-slate-700 hover:border-brand-500/30' : 'bg-white border-slate-200 hover:border-brand-300'}
                                                hover:shadow-lg hover:-translate-y-1
                                            `}>
                                                <div className="flex items-center justify-between mb-3">
                                                    <span className={`text-[10px] uppercase font-bold tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{step.name}</span>
                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: step.fill }}></div>
                                                </div>
                                                <div className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                                    {formatCompact(step.value)}
                                                </div>
                                            </div>

                                            {/* Connector Pill */}
                                            {!isLast && (
                                                <div className="my-2 md:my-0 md:-mx-3 z-20 relative">
                                                    <div className={`
                                                        px-2 py-1 rounded-full text-[10px] font-bold border shadow-sm flex items-center justify-center min-w-[3rem]
                                                        ${isDark ? 'bg-slate-950 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-600'}
                                                    `}>
                                                        {convRate}
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
                                    <CartesianGrid strokeDasharray="3 3" stroke={styles.chartGrid} vertical={false}/>
                                    <XAxis dataKey="age" stroke={styles.chartAxis} tick={{fontSize: 12}}>
                                        <Label value="AGE GROUP" offset={-10} position="insideBottom" style={{fontSize: '10px', fill: styles.chartAxis}} />
                                    </XAxis>
                                    <YAxis stroke={styles.chartAxis} tickFormatter={(val) => formatCompact(val, 'spend')} tick={{fontSize: 11}}>
                                        <Label value="SPEND" angle={-90} position="insideLeft" style={{fontSize: '10px', fill: styles.chartAxis}} />
                                    </YAxis>
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: styles.tooltipBg, borderColor: styles.tooltipBorder, color: styles.tooltipText, borderRadius: '8px' }} 
                                        formatter={(val: number) => formatCompact(val, 'currency')}
                                    />
                                    <Legend wrapperStyle={{paddingTop: '20px'}} />
                                    <Bar dataKey="Female" stackId="a" fill="#ec4899" radius={[0, 0, 0, 0]} barSize={50} />
                                    <Bar dataKey="Male" stackId="a" fill="#0055ff" radius={[4, 4, 0, 0]} barSize={50} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

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
                                        <CartesianGrid strokeDasharray="3 3" stroke={styles.chartGrid} horizontal={false}/>
                                        <XAxis type="number" hide />
                                        <YAxis type="category" dataKey="name" width={100} stroke={styles.chartAxis} style={{fontSize: '11px'}} />
                                        <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ backgroundColor: styles.tooltipBg, borderColor: styles.tooltipBorder, color: styles.tooltipText }} formatter={(val: number) => formatCompact(val, 'currency')} />
                                        <Bar dataKey="value" fill="#0055ff" radius={[0, 4, 4, 0]} barSize={20} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className={`border-b ${isDark ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-500'} text-xs font-bold uppercase`}>
                                        <tr>
                                            <th className="pb-3 pl-2">Region</th>
                                            <th className="pb-3 text-right">Spend</th>
                                            <th className="pb-3 text-right">ROAS</th>
                                        </tr>
                                    </thead>
                                    <tbody className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-100'}`}>
                                        {processedRegions.map((r, i) => (
                                            <tr key={i} className={isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}>
                                                <td className={`py-3 pl-2 font-medium ${styles.heading} text-xs`}>{r.name}</td>
                                                <td className={`py-3 text-right ${styles.textSub} font-mono text-xs`}>
                                                    {formatCompact(r.value, activeConfig.breakdownMetric === 'spend' ? 'currency' : 'number')}
                                                </td>
                                                <td className={`py-3 text-right font-mono text-xs ${r.roas > 2 ? 'text-emerald-500 font-bold' : styles.textSub}`}>
                                                    {r.roas.toFixed(2)}x
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'platform' && (
                <div className="space-y-6">
                    {/* Placement Chart - Vertical with Better Margins */}
                    <div className={`${styles.cardBg} border rounded-xl p-6`}>
                        <h3 className={`text-lg font-semibold ${styles.heading} mb-2 flex items-center`}>
                            <Target className="mr-2 text-blue-500" size={18} />
                            Placement Performance
                        </h3>
                        <p className="text-xs text-slate-500 mb-6">Top placements by volume. Comparing Spend vs ROAS.</p>
                        <div className="h-80 w-full">
                            <ResponsiveContainer width="100%" height="100%" debounce={50}>
                                <ComposedChart data={processedPlacements.slice(0, 8)} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                                    <defs>
                                        <linearGradient id="colorPlacementBar" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#4f86f7" stopOpacity={0.8}/>
                                            <stop offset="100%" stopColor="#4f86f7" stopOpacity={0.4}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke={styles.chartGrid} vertical={false}/>
                                    <XAxis dataKey="name" stroke={styles.chartAxis} tick={{fontSize: 10}} interval={0} angle={-25} textAnchor="end" height={60}>
                                        <Label value="PLACEMENT" offset={0} position="insideBottom" style={{fontSize: '9px', fontWeight: 'bold', fill: styles.chartAxis}} />
                                    </XAxis>
                                    <YAxis yAxisId="left" stroke={styles.chartAxis} tickFormatter={(val) => formatCompact(val, 'currency')} tick={{fontSize: 10}}>
                                        <Label value="SPEND" angle={-90} position="insideLeft" style={{fontSize: '9px', fontWeight: 'bold', fill: styles.chartAxis}} />
                                    </YAxis>
                                    <YAxis yAxisId="right" orientation="right" stroke={styles.chartAxis} tickFormatter={(val) => val.toFixed(1) + 'x'} tick={{fontSize: 10}}>
                                        <Label value="ROAS" angle={90} position="insideRight" style={{fontSize: '9px', fontWeight: 'bold', fill: styles.chartAxis}} />
                                    </YAxis>
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: styles.tooltipBg, borderColor: styles.tooltipBorder, color: styles.tooltipText, borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                        cursor={{fill: styles.chartGrid}}
                                    />
                                    <Bar yAxisId="left" dataKey="spend" name="Spend" fill="url(#colorPlacementBar)" barSize={40} radius={[4, 4, 0, 0]} />
                                    <Line yAxisId="right" type="monotone" dataKey="roas" name="ROAS" stroke="#10b981" strokeWidth={3} dot={{r: 4, fill: '#10b981', strokeWidth: 2, stroke: styles.tooltipBg}} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Performance Ledger List - Redesigned as "Cards/Rows" with flair */}
                    <div className={`${styles.cardBg} border rounded-xl overflow-hidden`}>
                        <div className={`p-4 border-b flex justify-between items-center ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                            <h3 className={`font-bold ${styles.heading} flex items-center`}>
                                <Zap size={16} className="mr-2 text-yellow-500" /> Performance Ledger
                            </h3>
                            <span className="text-xs text-slate-500">Ranked by Efficiency & Volume</span>
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                             {processedPlacements.map((p, i) => {
                                 const maxSpend = processedPlacements[0]?.spend || 1;
                                 const spendPct = (p.spend / maxSpend) * 100;
                                 
                                 // Determine badge
                                 let badge = null;
                                 if (p.roas > 3.0) badge = <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">Elite</span>;
                                 else if (p.roas > 2.0) badge = <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">Scaling</span>;
                                 else if (p.spend > 100 && p.roas < 1.0) badge = <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-500 border border-red-500/20">Inefficient</span>;

                                 return (
                                     <div key={i} className={`p-4 ${isDark ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50/80'} transition-all group`}>
                                         <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                             
                                             {/* Rank & Name */}
                                             <div className="flex items-center min-w-[200px]">
                                                 <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shadow-sm mr-4 shrink-0 
                                                    ${i === 0 ? 'bg-yellow-400 text-yellow-900' : i === 1 ? 'bg-slate-300 text-slate-800' : i === 2 ? 'bg-orange-300 text-orange-900' : (isDark ? 'bg-slate-800 text-slate-500' : 'bg-slate-100 text-slate-500')}
                                                 `}>
                                                     {i + 1}
                                                 </div>
                                                 <div>
                                                     <div className="flex items-center space-x-2">
                                                        <span className={`text-sm font-bold ${styles.heading}`}>{p.name}</span>
                                                        {badge}
                                                     </div>
                                                     <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">{p.platform}</div>
                                                 </div>
                                             </div>

                                             {/* Visual Bars for Spend */}
                                             <div className="flex-1 w-full md:w-auto px-4">
                                                 <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                                                     <span>Volume Impact</span>
                                                     <span>{formatCompact(p.spend, 'currency')}</span>
                                                 </div>
                                                 <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                     <div 
                                                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500"
                                                        style={{ width: `${spendPct}%` }}
                                                     ></div>
                                                 </div>
                                             </div>

                                             {/* ROAS Box */}
                                             <div className="text-right min-w-[80px]">
                                                 <div className={`text-lg font-black tracking-tight ${p.roas > 2.0 ? 'text-emerald-500' : p.roas < 1.0 ? 'text-rose-500' : isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                                     {p.roas.toFixed(2)}x
                                                 </div>
                                                 <div className="text-[10px] font-bold text-slate-500 uppercase">ROAS</div>
                                             </div>
                                         </div>
                                     </div>
                                 );
                             })}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'time' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className={`${styles.cardBg} border rounded-xl p-6 min-h-[300px]`}>
                            <h3 className={`text-lg font-semibold ${styles.heading} mb-2 flex items-center`}>
                                <Clock size={18} className="mr-2 text-brand-400"/> Activity Radar (24h)
                            </h3>
                            <p className="text-xs text-slate-500 mb-4">Radial view of impressions distribution.</p>
                            <div className="h-64 w-full" style={{ width: '99%' }}>
                                {hourlyData.length > 0 && (
                                    <ResponsiveContainer width="100%" height="100%" debounce={50}>
                                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={hourlyData}>
                                            <PolarGrid stroke={styles.chartGrid} />
                                            <PolarAngleAxis dataKey="hour" stroke={styles.chartAxis} tick={{fontSize: 10}} />
                                            <PolarRadiusAxis angle={30} domain={[0, 'auto']} stroke={styles.chartAxis} tickFormatter={(val) => formatCompact(val)} />
                                            <Radar name="Impressions" dataKey="impressions" stroke="#8b5cf6" strokeWidth={2} fill="#8b5cf6" fillOpacity={0.3} />
                                            <Tooltip contentStyle={{ backgroundColor: styles.tooltipBg, borderColor: styles.tooltipBorder, color: styles.tooltipText, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                         </div>

                        <div className={`${styles.cardBg} border rounded-xl p-6 min-h-[300px]`}>
                            <h3 className={`text-lg font-semibold ${styles.heading} mb-2 flex items-center`}>
                                <Users size={18} className="mr-2 text-blue-400"/> Volume Trend
                            </h3>
                            <p className="text-xs text-slate-500 mb-4">Impressions vs Reach (Estimated) by Hour.</p>
                            <div className="h-64 w-full" style={{ width: '99%' }}>
                                {hourlyData.length > 0 && (
                                    <ResponsiveContainer width="100%" height="100%" debounce={50}>
                                        <AreaChart data={hourlyData} margin={{ left: 15, bottom: 40 }}>
                                            <defs>
                                                <linearGradient id="colorImps" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#0055ff" stopOpacity={0.4}/>
                                                    <stop offset="95%" stopColor="#0055ff" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke={styles.chartGrid} vertical={false}/>
                                            <XAxis dataKey="hour" stroke={styles.chartAxis} tickLine={false} axisLine={false} tickFormatter={(h) => `${h}h`}>
                                                <Label value="HOUR OF DAY" offset={0} position="bottom" fill={styles.chartAxis} style={{ fontSize: '9px', fontWeight: 'bold' }} />
                                            </XAxis>
                                            <YAxis stroke={styles.chartAxis} tickLine={false} axisLine={false} tickFormatter={(v) => formatCompact(v)}>
                                                <Label value="VOLUME" angle={-90} position="insideLeft" style={{ textAnchor: 'middle', fill: styles.chartAxis, fontSize: '9px', fontWeight: 'bold' }} />
                                            </YAxis>
                                            <Tooltip contentStyle={{ backgroundColor: styles.tooltipBg, borderColor: styles.tooltipBorder, color: styles.tooltipText, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
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
                                        className={`px-3 py-1.5 rounded uppercase font-bold transition-all ${
                                            heatmapMetric === m 
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
                                        <span className="text-xs font-mono">
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
                </div>
            )}
            
        </div>

        {/* Right Column: AI Analysis Panel */}
        <div className="lg:col-span-1">
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
      </div>
    </div>
  );
};

export default Dashboard;
