import React, { useEffect, useState, useMemo } from 'react';
import { fetchCreativePerformance } from '../services/metaService';
import { analyzeCreative } from '../services/aiService';
import { AdPerformance, DateSelection, Theme, AdCreative, GlobalFilter, UserConfig } from '../types';
import LoadingSpinner from '../components/LoadingSpinner'; // Unified Loading
import { 
    Image, Sparkles, LayoutGrid, List, X, ExternalLink, 
    Video, Layers, Zap, ChevronDown, SlidersHorizontal, ArrowLeftRight,
    ArrowUp, ArrowDown, ArrowUpDown, SortAsc, SortDesc, Crown, TrendingUp, AlertTriangle
} from 'lucide-react';

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
    { id: 'created_time', label: 'Date Created', format: 'date' }, // Added Sort by Date
    { id: 'spend', label: 'Spend', format: 'currency' },
    { id: 'roas', label: 'ROAS', format: 'number' },
    { id: 'cpa', label: 'CPA', format: 'currency' },
    { id: 'ctr', label: 'CTR', format: 'percent' },
    { id: 'cpc', label: 'CPC', format: 'currency' },
    { id: 'cpm', label: 'CPM', format: 'currency' },
    { id: 'results', label: 'Results', format: 'number' },
    { id: 'cost_per_result', label: 'CPR (Meta)', format: 'currency' },
    { id: 'impressions', label: 'Impressions', format: 'number' },
    { id: 'reach', label: 'Reach', format: 'number' },
    { id: 'frequency', label: 'Freq.', format: 'number' },
    { id: 'clicks', label: 'Clicks (All)', format: 'number' },
    { id: 'unique_clicks', label: 'Unique Clicks', format: 'number' },
    { id: 'inline_link_clicks', label: 'Link Clicks', format: 'number' },
    { id: 'outbound_clicks', label: 'Outbound Clicks', format: 'number' },
    { id: 'post_engagement', label: 'Post Engag.', format: 'number' },
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

const CreativeHub: React.FC<CreativeHubProps> = ({ token, accountIds, datePreset, theme, filter, userConfig, refreshInterval = 10, refreshTrigger = 0 }) => {
  const [ads, setAds] = useState<AdPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const [selectedMetrics, setSelectedMetrics] = useState<Set<string>>(new Set(['spend', 'roas', 'ctr', 'cpa', 'impressions', 'reach']));
  const [metricOrder, setMetricOrder] = useState<string[]>(AVAILABLE_METRICS.map(m => m.id));
  const [showMetricsPanel, setShowMetricsPanel] = useState(false);
  const [showSortPanel, setShowSortPanel] = useState(false);

  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'spend', direction: 'desc' });
  const [draggedMetric, setDraggedMetric] = useState<string | null>(null);
  const [displayCount, setDisplayCount] = useState(15);

  const [selectedAd, setSelectedAd] = useState<AdPerformance | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);

  const multiplier = userConfig?.spend_multiplier || 1.0;

  useEffect(() => {
    const load = async (isBackground = false) => {
      if (!isBackground) setLoading(true);
      try {
        const data = await fetchCreativePerformance(accountIds, token, datePreset, filter);
        setAds(data); 
        if (!isBackground) setDisplayCount(15); 
      } catch (e) {
        console.error(e);
      } finally {
        if (!isBackground) setLoading(false);
      }
    };
    load();

    // Auto-Refresh
    if (refreshInterval && refreshInterval > 0) {
        const interval = setInterval(() => {
            load(true);
        }, refreshInterval * 60 * 1000);
        return () => clearInterval(interval);
    }
  }, [accountIds, datePreset, filter, refreshInterval, refreshTrigger]);

  const getMetricValue = (ad: AdPerformance, metricId: string) => {
      const rawSpend = parseFloat(ad.spend || '0');
      const adjustedSpend = rawSpend * multiplier;

      switch(metricId) {
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
          case 'outbound_clicks': return parseInt(ad.outbound_clicks?.find((a:any)=>a.action_type==='outbound_click')?.value || '0');
          case 'post_engagement': return parseInt(ad.inline_post_engagement || ad.actions?.find((a:any)=>a.action_type==='post_engagement')?.value || '0');
          case 'purchases': return parseInt(ad.actions?.find((a:any) => a.action_type === 'purchase' || a.action_type === 'offsite_conversion.fb_pixel_purchase')?.value || '0');
          case 'leads': return parseInt(ad.actions?.find((a:any) => a.action_type === 'lead')?.value || '0');
          case 'messages_started': return parseInt(ad.actions?.find((a:any) => a.action_type === 'onsite_conversion.messaging_conversation_started_7d' || a.action_type === 'messaging_conversation_started_7d')?.value || '0');
          case 'video_plays': return parseInt(ad.video_plays || '0');
          case 'video_thruplays': return parseInt(ad.video_thruplays || '0');
          case 'video_p100': return parseInt(ad.video_p100_watched_actions?.find((a:any)=>a.action_type==='video_view')?.value || '0');
          case 'reactions': return (ad.actions || []).reduce((acc, action) => (action.action_type.startsWith('post_reaction') ? acc + parseInt(action.value) : acc), 0);
          case 'comments': return parseInt(ad.actions?.find((a:any) => a.action_type === 'comment' || a.action_type === 'post_comment')?.value || '0');
          case 'shares': return parseInt(ad.actions?.find((a:any) => a.action_type === 'post' || a.action_type === 'post_share')?.value || '0');
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
  
  const loadMore = () => setDisplayCount(p => p + 15);
  
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
  const handleDrop = (e: React.DragEvent, t: string) => { e.preventDefault(); if (!draggedMetric || draggedMetric === t) return; const o = metricOrder.indexOf(draggedMetric); const n = metricOrder.indexOf(t); if(o!==-1&&n!==-1){ const arr=[...metricOrder]; arr.splice(o,1); arr.splice(n,0,draggedMetric); setMetricOrder(arr); } setDraggedMetric(null); };
  
  const formatCompact = (val: number, type?: string) => { 
      if(type === 'date') return new Date(val).toLocaleDateString();
      if(val===undefined||isNaN(val)) return '-'; 
      if(type==='percent') return `${val.toFixed(2)}%`; 
      if(type==='roas') return `${val.toFixed(2)}x`; 
      let f=val.toString(); 
      if(Math.abs(val)>=1000000)f=`${(val/1000000).toFixed(2)}M`; 
      else if(Math.abs(val)>=1000)f=`${(val/1000).toFixed(1)}K`; 
      else f=val.toLocaleString(undefined,{minimumFractionDigits:type==='currency'?2:0}); 
      return type==='currency'?`$${f}`:f; 
  };
  
  const isDark = theme === 'dark';
  const headingColor = isDark ? 'text-white' : 'text-slate-800';
  const subHeadingColor = isDark ? 'text-slate-400' : 'text-slate-500';
  const stickyHeaderBg = isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white/90 border-slate-200';
  const cardBg = isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200';
  const cardFooterBg = isDark ? 'bg-slate-900/40' : 'bg-slate-50/50';
  const cardText = isDark ? 'text-white' : 'text-slate-800';
  const cardLabel = isDark ? 'text-slate-400' : 'text-slate-500';
  const modalBg = isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200';
  
  const parseBold = (text: string, isDark: boolean) => text.split(/(\*\*.*?\*\*)/g).map((p,i)=>p.startsWith('**')?<strong key={i} className={`font-bold ${isDark?'text-brand-300':'text-brand-700'}`}>{p.slice(2,-2)}</strong>:p);
  const RichTextRenderer = ({ content }: { content: string }) => <div className="space-y-3">{content.split('\n').map((l,i)=><p key={i}>{l}</p>)}</div>;

  if (loading) return <LoadingSpinner theme={theme} message="Loading Creative Data" />;

  return (
    <div className="space-y-6 relative pb-12 w-full">
      <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-4 rounded-xl border backdrop-blur-md sticky top-0 z-50 transition-colors shadow-sm w-full ${stickyHeaderBg}`}>
        <div>
          <h2 className={`text-lg md:text-2xl font-bold flex items-center ${headingColor}`}>
            Creative Intelligence
            <span className={`ml-3 px-2 py-0.5 rounded text-[10px] uppercase tracking-wide border ${isDark ? 'bg-brand-500/20 text-brand-300 border-brand-500/30' : 'bg-brand-50 text-brand-700 border-brand-200'}`}>
                {ads.length} Assets
            </span>
          </h2>
          <p className={`text-xs md:text-sm mt-1 ${subHeadingColor}`}>AI-powered visual performance audit</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
             <div className="relative">
                 <button onClick={() => setShowSortPanel(!showSortPanel)} className={`flex items-center space-x-2 px-3 py-2 rounded-lg border text-xs md:text-sm transition-colors ${isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-slate-200'}`}>{sortConfig.direction === 'asc' ? <SortAsc size={14}/> : <SortDesc size={14}/>} <span className="hidden sm:inline">Sort By</span></button>
                 {showSortPanel && <div className={`absolute md:right-0 mt-2 p-2 rounded-xl shadow-2xl border z-40 w-56 ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                     <div className="max-h-60 overflow-y-auto custom-scrollbar">{AVAILABLE_METRICS.map(m => { if(m.id==='spend'&&userConfig?.hide_total_spend)return null; return <button key={m.id} onClick={()=>{handleSort(m.id);setShowSortPanel(false)}} className="w-full text-left px-3 py-2 text-xs hover:bg-slate-100 dark:hover:bg-slate-800">{m.label}</button>})}</div>
                 </div>}
             </div>
             <div className="relative">
                 <button onClick={() => setShowMetricsPanel(!showMetricsPanel)} className={`flex items-center space-x-2 px-3 py-2 rounded-lg border text-xs md:text-sm ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}><SlidersHorizontal size={14}/> <span>Metrics</span></button>
                 {showMetricsPanel && <div className={`absolute md:right-0 mt-2 p-4 rounded-xl shadow-2xl border z-40 w-72 ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                     <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto custom-scrollbar">{AVAILABLE_METRICS.map(m => <label key={m.id} className="flex items-center p-2"><input type="checkbox" checked={selectedMetrics.has(m.id)} onChange={()=>toggleMetric(m.id)} className="mr-2"/> <span className="text-xs">{m.label}</span></label>)}</div>
                 </div>}
             </div>
             <div className={`hidden md:flex items-center space-x-1 p-1 rounded-lg border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>
                <button onClick={() => setViewMode('grid')} className={`p-2 rounded-md ${viewMode==='grid'?'bg-brand-600 text-white':''}`}><LayoutGrid size={16}/></button>
                <button onClick={() => setViewMode('list')} className={`p-2 rounded-md ${viewMode==='list'?'bg-brand-600 text-white':''}`}><List size={16}/></button>
            </div>
        </div>
      </div>

      {/* Grid */}
      {(viewMode === 'grid' || window.innerWidth < 768) ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4 w-full">
            {visibleAds.map((ad, idx) => {
              const roasVal = getMetricValue(ad, 'roas'); const spendVal = getMetricValue(ad, 'spend');
              const type = getCreativeType(ad.creative); const permalink = getPermalink(ad.creative); const ctaText = ad.creative?.link_caption?.toUpperCase() || 'LEARN MORE';
              const isWinner = roasVal > 2.5 && spendVal > 50; const isBleeder = roasVal < 0.8 && spendVal > 50;
              return (
              <div key={ad.ad_id} className={`${cardBg} border rounded-xl overflow-hidden group hover:border-brand-500/50 transition-all duration-300 shadow-lg`}>
                <div className="aspect-square bg-slate-900 relative overflow-hidden group-hover:opacity-100 transition-opacity">
                   {ad.creative?.image_url ? <img src={ad.creative.image_url} alt={ad.ad_name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy"/> : <div className="w-full h-full flex items-center justify-center"><Image size={32} className="opacity-20"/></div>}
                   <div className="absolute top-2 left-2 flex flex-col gap-1 items-start z-20">
                        {isWinner && <div className="bg-yellow-500 text-yellow-950 px-1.5 py-0.5 rounded-full text-[8px] font-extrabold flex items-center shadow-lg"><Crown size={8} className="mr-1"/> WINNER</div>}
                        {isBleeder && <div className="bg-red-500 text-white px-1.5 py-0.5 rounded-full text-[8px] font-extrabold flex items-center shadow-lg"><AlertTriangle size={8} className="mr-1"/> FATIGUE</div>}
                   </div>
                   <div className="absolute top-2 right-2 z-20"><div className={`px-1.5 py-0.5 rounded-md text-[8px] font-bold backdrop-blur-md border shadow-sm flex items-center ${roasVal >= 2.5 ? 'bg-emerald-500/90 text-white' : 'bg-slate-800/90 text-slate-300'}`}>{roasVal.toFixed(2)}x ROAS</div></div>
                   
                   {/* Hover Overlay Actions */}
                   <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 z-30 p-4">
                       <button onClick={() => handleAnalyze(ad)} className="w-full bg-white hover:bg-slate-100 text-brand-900 px-3 py-1.5 rounded-lg font-bold text-xs flex items-center justify-center shadow-2xl transition-transform hover:scale-105">
                           <Sparkles size={12} className="mr-1.5" /> AI Audit
                       </button>
                       {permalink && (
                           <a href={permalink} target="_blank" rel="noopener noreferrer" className="w-full bg-slate-800/90 hover:bg-slate-700 text-white border border-slate-600 px-3 py-1.5 rounded-lg font-bold text-xs flex items-center justify-center shadow-2xl transition-transform hover:scale-105">
                               <ExternalLink size={12} className="mr-1.5" /> Visit Post
                           </a>
                       )}
                   </div>
                </div>
                <div className={`p-2 md:p-4 ${cardFooterBg} flex-1 flex flex-col border-t ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                    <div className="mb-2"><h4 className={`${cardText} text-[10px] md:text-xs font-bold line-clamp-2`}>{ad.ad_name}</h4></div>
                    <div className="flex-1 flex flex-wrap gap-1 md:gap-2 content-start">
                        {AVAILABLE_METRICS.filter(m => selectedMetrics.has(m.id)).map(metric => {
                            if (metric.id === 'spend' && userConfig?.hide_total_spend) return null;
                            const val = getMetricValue(ad, metric.id);
                            return <div key={metric.id} className={`px-1.5 py-1 rounded border flex flex-col justify-center min-w-[30%] flex-1 ${isDark?'bg-slate-800/50 border-slate-700':'bg-white border-slate-100'}`}><span className="text-[8px] opacity-70 uppercase font-bold">{metric.label}</span><span className="font-mono font-bold text-[9px]">{formatCompact(val as number, metric.format)}</span></div>
                        })}
                    </div>
                </div>
              </div>
            )})}
          </div>
      ) : (
          <div className={`hidden md:block ${cardBg} border rounded-xl overflow-hidden shadow-xl`}>
             <div className="overflow-x-auto">
                 <table className="w-full text-left text-sm">
                     <thead className={`${isDark ? 'bg-slate-950 text-slate-300' : 'bg-slate-50 text-slate-600'} uppercase text-xs font-bold border-b`}>
                         <tr>
                             <th className="p-4 w-16 cursor-pointer" onClick={() => handleSort('ad_id')}>Asset</th>
                             <th className="p-4 w-64 cursor-pointer" onClick={() => handleSort('ad_name')}>Ad Name</th>
                             {metricOrder.filter(id => selectedMetrics.has(id)).map(id => {
                                 if (id === 'spend' && userConfig?.hide_total_spend) return null;
                                 const m = AVAILABLE_METRICS.find(metric => metric.id === id); if (!m) return null;
                                 return <th key={m.id} className="p-4 text-right cursor-pointer" draggable onDragStart={(e) => handleDragStart(e, m.id)} onDragOver={(e) => handleDragOver(e, m.id)} onDrop={(e) => handleDrop(e, m.id)} onClick={() => handleSort(m.id)}>{m.label}</th>;
                             })}
                             <th className="p-4 text-center">Action</th>
                         </tr>
                     </thead>
                     <tbody className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-100'}`}>
                         {visibleAds.map(ad => (
                             <tr key={ad.ad_id} className={`${isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}`}>
                                 <td className="p-3"><div className="w-12 h-12 rounded overflow-hidden relative border"><img src={ad.creative?.image_url} className="w-full h-full object-cover"/></div></td>
                                 <td className={`p-4 font-semibold text-sm ${cardText} max-w-xs truncate`}>
                                     {ad.ad_name}
                                     {ad.created_time && <div className="text-[10px] text-slate-500 mt-0.5">{new Date(ad.created_time).toLocaleDateString()}</div>}
                                 </td>
                                 {metricOrder.filter(id => selectedMetrics.has(id)).map(id => {
                                      if (id === 'spend' && userConfig?.hide_total_spend) return null;
                                      const m = AVAILABLE_METRICS.find(metric => metric.id === id); if (!m) return null;
                                      return <td key={m.id} className={`p-4 text-right font-mono text-sm ${cardText}`}>{formatCompact(getMetricValue(ad, m.id), m.format)}</td>;
                                 })}
                                 <td className="p-4 text-center">
                                     <div className="flex justify-center space-x-1">
                                        <button onClick={() => handleAnalyze(ad)} className="text-brand-500 hover:bg-brand-500/10 p-2 rounded" title="AI Audit"><Sparkles size={16}/></button>
                                        {getPermalink(ad.creative) && (
                                            <a href={getPermalink(ad.creative)!} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded" title="Visit Post">
                                                <ExternalLink size={16}/>
                                            </a>
                                        )}
                                     </div>
                                 </td>
                             </tr>
                         ))}
                     </tbody>
                 </table>
             </div>
          </div>
      )}
      
      {/* ... Load More & Modal ... */}
      {displayCount < ads.length && <div className="flex justify-center py-6"><button onClick={loadMore} className="bg-brand-600 text-white px-6 py-3 rounded-full font-bold shadow-lg flex items-center space-x-2"><span>Load More</span><ChevronDown size={18}/></button></div>}
      {selectedAd && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
              <div className={`w-full max-w-5xl max-h-[90vh] rounded-2xl border shadow-2xl overflow-hidden flex flex-col md:flex-row ${modalBg}`}>
                  <div className="w-full md:w-5/12 bg-black flex flex-col items-center justify-center p-8 relative">
                      <div className="absolute inset-0 opacity-30 bg-cover bg-center blur-3xl" style={{backgroundImage: `url(${selectedAd.creative?.image_url})`}}></div>
                      <img src={selectedAd.creative?.image_url} className="max-h-full max-w-full object-contain rounded-lg shadow-2xl relative z-10 border border-slate-700/50"/>
                  </div>
                  <div className="w-full md:w-7/12 flex flex-col relative">
                      <div className={`p-6 border-b flex justify-between items-start ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                          <div><h3 className={`text-xl font-bold flex items-center ${cardText}`}><Sparkles className="mr-2 text-brand-500" size={20} /> AI Vision Audit</h3></div>
                          <button onClick={closeModal}><X size={24} className={cardLabel}/></button>
                      </div>
                      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                          {isAnalyzing ? <div className="flex flex-col items-center justify-center h-full py-12"><Sparkles size={32} className="text-brand-500 animate-pulse"/><p className="text-slate-500 mt-4">Analyzing...</p></div> : <div className="prose prose-sm max-w-none">{analysisResult && <RichTextRenderer content={analysisResult}/>}</div>}
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default CreativeHub;