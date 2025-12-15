import React from 'react';
import { Megaphone, Image as ImageIcon } from 'lucide-react';
import { PDFGridProps } from './types';

// Add hideCost to props (extended from PDFGridProps if needed, or inline intersection)
const getCreativeType = (cre: any) => {
    if (!cre) return 'UNKNOWN';
    if (cre.asset_feed_spec) return 'DCO';
    if (cre.object_type === 'VIDEO' || cre.object_story_spec?.video_data) return 'VIDEO';
    if (cre.object_story_spec?.link_data?.child_attachments) return 'CAROUSEL';
    return 'IMAGE';
};

export const PDFCreativeGrid: React.FC<PDFGridProps & { hideCost?: boolean; selectedProfile?: string }> = ({ items, isDark, hideCost, selectedProfile = 'sales' }) => {
    const ads = items.slice(0, 10);
    const formatCurrency = (val: number) => `$${val.toFixed(2)}`;
    const formatNumber = (val: number) => val.toLocaleString();

    // Helper to extract metric values from Ad object safely
    const getMetricValue = (ad: any, metricKey: string) => {
        const insights = ad.insights || {}; // Fallback if ad is raw, but items should be AdPerformance type
        // AdPerformance has flattened props, but let's check both
        const src = ad;

        if (metricKey === 'spend') return parseFloat(src.spend || '0');
        if (metricKey === 'roas') return src.roas || 0;
        if (metricKey === 'ctr') return parseFloat(src.ctr || '0');
        if (metricKey === 'cpa') return src.cpa || 0;
        if (metricKey === 'impressions') return parseInt(src.impressions || '0');
        if (metricKey === 'reach') return parseInt(src.reach || '0');
        if (metricKey === 'clicks') return parseInt(src.clicks || '0');

        // Custom Actions
        const actions = src.actions || [];
        if (metricKey === 'engagements') {
            return parseInt(actions.find((a: any) => a.action_type === 'post_engagement')?.value || '0');
        }
        if (metricKey === 'leads') {
            return parseInt(actions.find((a: any) => a.action_type === 'lead')?.value || '0');
        }
        if (metricKey === 'messages') {
            return parseInt(actions.find((a: any) => a.action_type === 'messaging_conversation_started_7d')?.value || '0');
        }
        if (metricKey === 'purchases') {
            return parseInt(actions.find((a: any) => a.action_type === 'omni_purchase' || a.action_type === 'purchase')?.value || '0');
        }

        return 0;
    };

    // Configuration Logic
    const getMetricsConfig = () => {
        // SCENARIO 1: Sales Kit (Default)
        if (selectedProfile === 'sales') {
            if (hideCost) {
                // User Request: Replace 4 metrics for sales kit to be Reach, Impressions, Purchases, CTR
                return [
                    { label: 'Reach', key: 'reach', format: 'number' },
                    { label: 'Impressions', key: 'impressions', format: 'number' },
                    { label: 'Purchases', key: 'purchases', format: 'number' },
                    { label: 'CTR', key: 'ctr', format: 'percent' }
                ];
            } else {
                // Standard Sales: Spend, ROAS, CTR, CPA
                return [
                    { label: 'Spend', key: 'spend', format: 'currency' },
                    { label: 'ROAS', key: 'roas', format: 'x' },
                    { label: 'CTR', key: 'ctr', format: 'percent' },
                    { label: 'Purchases', key: 'purchases', format: 'number' }
                ];
            }
        }

        // SCENARIO 2: Engagements
        // User Request: Reach, Impressions, Engagements, Clicks
        if (selectedProfile === 'engagement') {
            return [
                { label: 'Reach', key: 'reach', format: 'number' },
                { label: 'Impressions', key: 'impressions', format: 'number' },
                { label: 'Engagements', key: 'engagements', format: 'number' },
                { label: 'Clicks', key: 'clicks', format: 'number' }
            ];
        }

        // SCENARIO 3: Leads
        // User Request: reach, impressins, Leads, clicks
        if (selectedProfile === 'leads') {
            return [
                { label: 'Reach', key: 'reach', format: 'number' },
                { label: 'Impressions', key: 'impressions', format: 'number' },
                { label: 'Leads', key: 'leads', format: 'number' },
                { label: 'Clicks', key: 'clicks', format: 'number' }
            ];
        }

        // SCENARIO 4: Messenger
        // User Request: Reach, Impressions, Messages, clicks
        if (selectedProfile === 'messenger') {
            return [
                { label: 'Reach', key: 'reach', format: 'number' },
                { label: 'Impressions', key: 'impressions', format: 'number' },
                { label: 'Messages', key: 'messages', format: 'number' },
                { label: 'Clicks', key: 'clicks', format: 'number' }
            ];
        }

        // Fallback
        return [
            { label: 'Spend', key: 'spend', format: 'currency' },
            { label: 'Impressions', key: 'impressions', format: 'number' },
            { label: 'CTR', key: 'ctr', format: 'percent' },
            { label: 'Clicks', key: 'clicks', format: 'number' }
        ];
    };

    const metrics = getMetricsConfig();

    return (
        <div className="break-inside-avoid">
            <div className="flex items-center mb-6 pl-1">
                <div className="p-1.5 rounded bg-pink-100 text-pink-600 mr-2 dark:bg-pink-900/30 dark:text-pink-400">
                    <Megaphone size={14} />
                </div>
                <h3 className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Top Creative Performance</h3>
            </div>

            <div className="grid grid-cols-3 gap-4">
                {ads.map((ad, idx) => {
                    const thumb = ad.creative?.thumbnail_url || ad.creative?.image_url;
                    const type = getCreativeType(ad.creative);
                    const caption = ad.creative?.body || ad.creative?.object_story_spec?.link_data?.message || ad.creative?.object_story_spec?.video_data?.message || "No caption available";

                    return (
                        <div key={idx} className={`relative flex flex-col border rounded-2xl overflow-hidden break-inside-avoid transition-all
                            ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300 shadow-md'}
                        `}>
                            {/* Top Image Section (Profile Style) */}
                            <div className={`relative h-48 flex items-center justify-center rounded-t-2xl overflow-hidden group/image ${isDark ? 'bg-slate-900/50' : 'bg-slate-50'}`}>
                                {/* Ambient Blur Background */}
                                <div className="absolute inset-0 z-0 overflow-hidden">
                                    <div
                                        className="absolute inset-0 blur-2xl scale-150 opacity-50 dark:opacity-40"
                                        style={{ backgroundImage: `url(${thumb})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                                    />
                                    <div className={`absolute inset-0 ${isDark ? 'bg-slate-900/40' : 'bg-white/40'} backdrop-blur-[2px]`} />
                                </div>

                                {/* The "Profile Picture" Style Image */}
                                <div className="relative z-10 w-28 h-28 rounded-2xl overflow-hidden shadow-2xl border-4 border-white/5 dark:border-white/5">
                                    {thumb ? (
                                        <img src={thumb} alt={ad.ad_name} className="w-full h-full object-cover bg-slate-800" crossOrigin="anonymous" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-slate-800"><ImageIcon size={32} className="opacity-20 text-white" /></div>
                                    )}
                                    {/* Type Badge on Image */}
                                    <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[8px] font-bold backdrop-blur-md bg-black/50 text-white border border-white/10 uppercase tracking-wider">
                                        {type}
                                    </div>
                                </div>
                            </div>

                            {/* Content Section */}
                            <div className={`p-4 rounded-b-2xl flex-1 flex flex-col relative border-t ${isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                <div className="mb-3">
                                    {/* Caption Only - No Ad Name Title */}
                                    <p className={`text-[10px] leading-relaxed line-clamp-2 opacity-60 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                        {caption}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-2 mt-auto">
                                    {metrics.map((m, mIdx) => {
                                        const val = getMetricValue(ad, m.key);
                                        let displayVal = val.toString();
                                        let colorClass = isDark ? 'text-white' : 'text-slate-900';

                                        if (m.format === 'currency') displayVal = formatCurrency(val);
                                        else if (m.format === 'percent') displayVal = `${val.toFixed(2)}%`;
                                        else if (m.format === 'x') {
                                            displayVal = `${val.toFixed(2)}x`;
                                            colorClass = 'text-emerald-500'; // Success color for ROAS
                                        }
                                        else displayVal = formatNumber(val);

                                        return (
                                            <div key={mIdx} className={`p-2 rounded border ${isDark ? 'border-slate-700/50' : 'bg-slate-50 border-slate-100'}`}>
                                                <p className="text-[9px] uppercase text-slate-500 mb-0.5">{m.label}</p>
                                                <p className={`text-[10px] font-bold ${colorClass}`}>{displayVal}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
