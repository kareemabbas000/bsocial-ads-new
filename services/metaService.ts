
import { AdAccount, Campaign, AdSet, Ad, InsightData, AdPerformance, DateSelection, AdCreative, DailyInsight, HourlyInsight, AccountHierarchy, GlobalFilter, DatePreset, PaginatedResponse, HierarchicalAccount, HierarchicalCampaign, HierarchicalAdSet, HierarchicalAd } from '../types';
import { getCache, setCache, generateKey, clearCache } from './cacheService';

const GRAPH_API_VERSION = 'v20.0';
const BASE_URL = 'https://graph.facebook.com';

// Export clearCache for the Manual Refresh button to use
export { clearCache };

/**
 * Helper to construct the 'filtering' parameter for Graph API
 */
const buildFilteringParam = (filter: GlobalFilter | undefined) => {
    if (!filter) return '';

    const filters = [];

    if (filter.selectedCampaignIds && filter.selectedCampaignIds.length > 0) {
        filters.push({ field: 'campaign.id', operator: 'IN', value: filter.selectedCampaignIds });
    }

    if (filter.selectedAdSetIds && filter.selectedAdSetIds.length > 0) {
        filters.push({ field: 'adset.id', operator: 'IN', value: filter.selectedAdSetIds });
    }

    if (filter.searchQuery && filters.length === 0) {
        filters.push({ field: 'campaign.name', operator: 'CONTAIN', value: filter.searchQuery });
    }

    if (filters.length === 0) return '';
    return `&filtering=${encodeURIComponent(JSON.stringify(filters))}`;
};

// --- DATE LOGIC HELPERS ---

const formatDate = (d: Date): string => {
    return d.toISOString().split('T')[0];
};

export const resolveDateRange = (selection: DateSelection): { since: string; until: string } => {
    if (selection.preset === 'custom' && selection.custom) {
        return { since: selection.custom.startDate, until: selection.custom.endDate };
    }

    const today = new Date();
    const until = new Date(today);
    const since = new Date(today);

    switch (selection.preset) {
        case 'today': break;
        case 'yesterday': since.setDate(today.getDate() - 1); until.setDate(today.getDate() - 1); break;
        case 'last_3d': since.setDate(today.getDate() - 3); until.setDate(today.getDate() - 1); break;
        case 'last_7d': since.setDate(today.getDate() - 7); until.setDate(today.getDate() - 1); break;
        case 'last_14d': since.setDate(today.getDate() - 14); until.setDate(today.getDate() - 1); break;
        case 'last_30d': since.setDate(today.getDate() - 30); until.setDate(today.getDate() - 1); break;
        case 'last_90d': since.setDate(today.getDate() - 90); until.setDate(today.getDate() - 1); break;
        case 'last_3months': since.setMonth(today.getMonth() - 3); until.setDate(today.getDate() - 1); break;
        case 'this_month': since.setDate(1); break;
        case 'last_month': since.setMonth(today.getMonth() - 1); since.setDate(1); until.setDate(0); break;
        case 'this_year': since.setMonth(0, 1); break;

        case 'last_year': since.setFullYear(today.getFullYear() - 1, 0, 1); until.setFullYear(today.getFullYear() - 1, 11, 31); break;
        case 'maximum': since.setFullYear(2005, 0, 1); break; // Fallback for custom range calc if needed
        default: since.setDate(today.getDate() - 30); until.setDate(today.getDate() - 1);
    }

    return { since: formatDate(since), until: formatDate(until) };
};

export const getPreviousPeriod = (selection: DateSelection): { since: string; until: string } | null => {
    const current = resolveDateRange(selection);
    const currStart = new Date(current.since);
    const currEnd = new Date(current.until);
    const diffTime = Math.abs(currEnd.getTime() - currStart.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    const prevEnd = new Date(currStart);
    prevEnd.setDate(prevEnd.getDate() - 1);
    const prevStart = new Date(prevEnd);
    prevStart.setDate(prevStart.getDate() - diffDays + 1);
    const limitDate = new Date();
    limitDate.setMonth(limitDate.getMonth() - 37);
    if (prevStart < limitDate) return null;
    return { since: formatDate(prevStart), until: formatDate(prevEnd) };
};

const getDateParam = (selection: DateSelection, forceTimeRange = false): string => {
    const validMetaPresets = ['today', 'yesterday', 'last_3d', 'last_7d', 'last_14d', 'last_28d', 'last_30d', 'last_90d', 'this_month', 'last_month', 'this_quarter', 'this_year', 'maximum'];
    if (!forceTimeRange && selection.preset !== 'custom' && validMetaPresets.includes(selection.preset)) {
        return `&date_preset=${selection.preset}`;
    }
    const { since, until } = resolveDateRange(selection);
    const range = JSON.stringify({ since, until });
    return `&time_range=${range}`;
};

const getRawTimeRangeParam = (since: string, until: string) => {
    const range = JSON.stringify({ since, until });
    return `&time_range=${range}`;
};

// --- HIERARCHY & ACCOUNTS ---

// Fetches hierarchy from all accounts and merges them
export const fetchAccountHierarchy = async (adAccountIds: string[], token: string): Promise<AccountHierarchy> => {
    const cacheKey = generateKey('fetchAccountHierarchy', adAccountIds);
    const cached = getCache(cacheKey);
    if (cached) return cached as AccountHierarchy;

    const promises = adAccountIds.map(async (accId) => {
        const formattedId = accId.startsWith('act_') ? accId : `act_${accId}`;

        // Parallel fetching for performance and isolation (if one fails, others might succeed)
        try {
            const [campResponse, adsetResponse, adsResponse] = await Promise.all([
                fetch(`${BASE_URL}/${GRAPH_API_VERSION}/${formattedId}/campaigns?fields=id,name&limit=1000&access_token=${token}`),
                fetch(`${BASE_URL}/${GRAPH_API_VERSION}/${formattedId}/adsets?fields=id,name,campaign_id&limit=1000&access_token=${token}`),
                fetch(`${BASE_URL}/${GRAPH_API_VERSION}/${formattedId}/ads?fields=id,name,campaign_id,adset_id&limit=1000&access_token=${token}`)
            ]);

            const campData = await campResponse.json();
            const adsetData = await adsetResponse.json();
            const adsData = await adsResponse.json();

            return {
                campaigns: (campData.data || []).map((c: any) => ({
                    id: c.id,
                    name: c.name
                })),
                adSets: (adsetData.data || []).map((a: any) => ({
                    id: a.id,
                    name: a.name,
                    campaign_id: a.campaign_id // Flat field is safer
                })),
                ads: (adsData.data || []).map((a: any) => ({
                    id: a.id,
                    name: a.name,
                    campaign_id: a.campaign_id,
                    adset_id: a.adset_id
                }))
            };
        } catch (e) {
            console.error(`Error hierarchy for ${accId}`, e);
            // Return empty if completely failed (network error)
            return { campaigns: [], adSets: [], ads: [] };
        }
    });

    const results = await Promise.all(promises);

    // Merge
    const merged: AccountHierarchy = { campaigns: [], adSets: [], ads: [] };
    results.forEach(res => {
        merged.campaigns.push(...res.campaigns);
        merged.adSets.push(...res.adSets);
        merged.ads.push(...res.ads);
    });

    setCache(cacheKey, merged);
    return merged;
};

export const fetchAdAccounts = async (token: string): Promise<AdAccount[]> => {
    const cacheKey = generateKey('fetchAdAccounts'); // Simple key, auth depends on token which is checked elsewhere or we can include it
    // Actually, optimize to cache briefly to prevent re-fetch on tab switch
    const cached = getCache(cacheKey);
    if (cached) return cached as AdAccount[];

    try {
        const response = await fetch(
            `${BASE_URL}/${GRAPH_API_VERSION}/me/adaccounts?limit=1000&fields=name,account_status,currency,timezone_name,id&access_token=${token}`
        );
        const data = await response.json();
        if (data.error) throw new Error(data.error.message);

        setCache(cacheKey, data.data);
        return data.data;
    } catch (error) {
        console.error("Error fetching ad accounts", error);
        throw error;
    }
};

export const fetchCampaignsBatch = async (accountIds: string[], token: string): Promise<{ id: string, name: string, accountId: string }[]> => {
    // Used in Admin, can cache for short duration
    const cacheKey = generateKey('fetchCampaignsBatch', accountIds);
    const cached = getCache(cacheKey);
    if (cached) return cached as any;

    const uniqueIds = [...new Set(accountIds)];
    const promises = uniqueIds.map(async (accId) => {
        const formattedId = accId.startsWith('act_') ? accId : `act_${accId}`;
        try {
            const url = `${BASE_URL}/${GRAPH_API_VERSION}/${formattedId}/campaigns?fields=id,name&limit=500&access_token=${token}`;
            const res = await fetch(url);
            const data = await res.json();
            return (data.data || []).map((c: any) => ({
                id: c.id,
                name: c.name,
                accountId: accId
            }));
        } catch (e) {
            return [];
        }
    });
    const results = await Promise.all(promises);
    const final = results.flat();
    setCache(cacheKey, final);
    return final;
};

// --- METRIC CALCULATION HELPERS ---

const calculateROAS = (insight: any): number => {
    // STRICT: Returns Purchase Value / Spend
    // Prioritize 'purchase' (Pixel)

    // 1. Try explicit purchase_roas field (if requested)
    if (insight.purchase_roas && Array.isArray(insight.purchase_roas)) {
        const roasObj = insight.purchase_roas.find((v: any) => v.action_type === 'purchase')
            || insight.purchase_roas.find((v: any) => v.action_type === 'omni_purchase');
        if (roasObj) return parseFloat(roasObj.value);
    }

    // 2. Fallback: Manually Calculate (Purchase Value / Spend)
    const spend = parseFloat(insight.spend || '0');
    if (spend === 0) return 0;

    const actionValues = insight.action_values || [];
    // Prioritize standard 'purchase' or 'fb_pixel_purchase'
    let purchaseValueObj = actionValues.find((v: any) => v.action_type === 'purchase');

    // Fallback to omni_purchase or pixel specific if generic not found
    if (!purchaseValueObj) {
        purchaseValueObj = actionValues.find((v: any) => v.action_type === 'omni_purchase');
    }
    if (!purchaseValueObj) {
        purchaseValueObj = actionValues.find((v: any) => v.action_type === 'offsite_conversion.fb_pixel_purchase');
    }

    const val = purchaseValueObj ? parseFloat(purchaseValueObj.value) : 0;
    return val / spend;
};

const calculateResults = (insight: any, objective: string = 'UNKNOWN'): { results: number, cost_per_result: number } => {
    const actions = insight.actions || [];
    const spend = parseFloat(insight.spend || '0');
    let resultCount = 0;

    // Normalize objective
    const obj = objective.toUpperCase();

    // DYNAMIC RESULTS MAPPING
    if (obj.includes('SALES') || obj === 'CONVERSIONS') {
        // Purchases
        const act = actions.find((a: any) => a.action_type === 'purchase')
            || actions.find((a: any) => a.action_type === 'omni_purchase');
        resultCount = act ? parseFloat(act.value) : 0;

    } else if (obj.includes('LEAD') || obj === 'LEAD_GENERATION') {
        // Leads (On-Facebook or Website)
        const act = actions.find((a: any) => a.action_type === 'lead')
            || actions.find((a: any) => a.action_type === 'on_facebook_lead');
        resultCount = act ? parseFloat(act.value) : 0;

    } else if (obj.includes('TRAFFIC') || obj === 'LINK_CLICKS') {
        // Link Clicks
        const act = actions.find((a: any) => a.action_type === 'link_click');
        resultCount = act ? parseFloat(act.value) : 0;

    } else if (obj.includes('ENGAGEMENT') || obj === 'POST_ENGAGEMENT') {
        // Post Engagement
        const act = actions.find((a: any) => a.action_type === 'post_engagement');
        resultCount = act ? parseFloat(act.value) : 0;

    } else if (obj.includes('AWARENESS') || obj === 'BRAND_AWARENESS' || obj === 'REACH') {
        // Reach (or Estimated Ad Recall Lift if available, but Reach is standard proxy for listing)
        // Note: 'reach' is a top-level field, not in actions usually, but we check actions for 'ad_recall'
        // Fallback to Reach numeric if actions not found? 
        // Actually, Reach is better returned directly.
        // Special case: return Reach
        return {
            results: parseInt(insight.reach || '0'),
            cost_per_result: parseInt(insight.reach || '0') > 0 ? (spend / parseInt(insight.reach || '0')) * 1000 : 0 // Cost per 1,000 Reach usually, but standard CPR is per 1 result. Code generic:
        };

    } else if (obj.includes('APP') || obj === 'APP_INSTALLS') {
        // App Installs
        const act = actions.find((a: any) => a.action_type === 'mobile_app_install');
        resultCount = act ? parseFloat(act.value) : 0;
    } else {
        // Default / Unknown: Fallback to Link Clicks or just 0
        const act = actions.find((a: any) => a.action_type === 'link_click');
        resultCount = act ? parseFloat(act.value) : 0;
    }

    const cpr = resultCount > 0 ? spend / resultCount : 0;
    return { results: resultCount, cost_per_result: cpr };
};

// --- PAGINATED LIST FETCHERS WITH AGGREGATION SUPPORT ---

export const fetchCampaignsWithInsights = async (
    adAccountIds: string[],
    token: string,
    dateSelection: DateSelection,
    filter?: GlobalFilter,
    afterCursor?: string
): Promise<PaginatedResponse<Campaign>> => {
    const cacheKey = generateKey('fetchCampaignsWithInsights', adAccountIds, dateSelection, filter, afterCursor);
    const cached = getCache(cacheKey);
    if (cached) return cached as PaginatedResponse<Campaign>;

    const promises = adAccountIds.map(async (accId) => {
        const formattedId = accId.startsWith('act_') ? accId : `act_${accId}`;
        const filtering = buildFilteringParam(filter);

        let timeFilter = '';
        if (dateSelection.preset !== 'custom' && ['today', 'yesterday', 'last_7d', 'last_30d', 'this_month', 'last_month', 'this_year', 'maximum'].includes(dateSelection.preset)) {
            timeFilter = `.date_preset(${dateSelection.preset})`;
        } else {
            const { since, until } = resolveDateRange(dateSelection);
            const range = JSON.stringify({ since, until });
            timeFilter = `.time_range(${range})`;
        }

        const dynFields = `id,name,status,objective,buying_type,start_time,stop_time,special_ad_categories,daily_budget,lifetime_budget,adsets{id},insights${timeFilter}{spend,impressions,clicks,inline_link_clicks,cpc,cpm,ctr,reach,frequency,actions,action_values,purchase_roas}`;

        try {
            const response = await fetch(
                `${BASE_URL}/${GRAPH_API_VERSION}/${formattedId}/campaigns?fields=${dynFields}&limit=50&access_token=${token}${filtering}&use_account_attribution_setting=true`
            );
            const data = await response.json();
            if (data.error) throw new Error(data.error.message);
            return (data.data || []).map((camp: any) => {
                const insights = camp.insights ? camp.insights.data[0] : null;
                // Count AdSets
                const adsetCount = camp.adsets ? camp.adsets.data.length : 0;

                if (!insights) return { ...camp, adset_count: adsetCount, insights: null };

                const { results, cost_per_result } = calculateResults(insights, camp.objective);
                return {
                    ...camp,
                    adset_count: adsetCount,
                    insights: {
                        ...insights,
                        results,
                        cost_per_result,
                        roas: calculateROAS(insights)
                    }
                };
            });
        } catch (e) {
            console.error(`Fetch campaigns failed for ${accId}`, e);
            return [];
        }
    });

    const results = await Promise.all(promises);
    const flat = results.flat();

    // Sort by Spend Descending by default for usefulness
    flat.sort((a, b) => {
        const spendA = parseFloat(a.insights?.spend || '0');
        const spendB = parseFloat(b.insights?.spend || '0');
        return spendB - spendA;
    });

    const response = { data: flat, nextCursor: undefined };
    setCache(cacheKey, response);
    return response;
};

export const fetchAdSetsWithInsights = async (
    adAccountIds: string[],
    token: string,
    dateSelection: DateSelection,
    filter?: GlobalFilter,
    afterCursor?: string
): Promise<PaginatedResponse<AdSet>> => {
    const cacheKey = generateKey('fetchAdSetsWithInsights', adAccountIds, dateSelection, filter, afterCursor);
    const cached = getCache(cacheKey);
    if (cached) return cached as PaginatedResponse<AdSet>;

    const promises = adAccountIds.map(async (accId) => {
        const formattedId = accId.startsWith('act_') ? accId : `act_${accId}`;
        const filtering = buildFilteringParam(filter);

        let timeFilter = '';
        if (dateSelection.preset !== 'custom' && ['today', 'yesterday', 'last_7d', 'last_30d', 'this_month', 'last_month', 'this_year', 'maximum'].includes(dateSelection.preset)) {
            timeFilter = `.date_preset(${dateSelection.preset})`;
        } else {
            const { since, until } = resolveDateRange(dateSelection);
            const range = JSON.stringify({ since, until });
            timeFilter = `.time_range(${range})`;
        }

        const fields = `id,campaign_id,name,status,daily_budget,lifetime_budget,start_time,end_time,targeting,billing_event,optimization_goal,bid_amount,pacing_type,ads{id},insights${timeFilter}{spend,impressions,clicks,cpc,ctr,reach,actions,action_values,purchase_roas}`;

        try {
            const response = await fetch(
                `${BASE_URL}/${GRAPH_API_VERSION}/${formattedId}/adsets?fields=${fields},campaign{objective}&limit=50&access_token=${token}${filtering}&use_account_attribution_setting=true`
            );
            const data = await response.json();
            return (data.data || []).map((adset: any) => {
                const insights = adset.insights ? adset.insights.data[0] : null;
                const objective = adset.campaign?.objective || 'UNKNOWN';

                // Count Ads
                const adCount = adset.ads ? adset.ads.data.length : 0;

                if (!insights) return { ...adset, ad_count: adCount, insights: null };

                const { results, cost_per_result } = calculateResults(insights, objective);

                return {
                    ...adset,
                    ad_count: adCount,
                    insights: {
                        ...insights,
                        results,
                        cost_per_result,
                        roas: calculateROAS(insights)
                    }
                };
            });
        } catch (e) {
            return [];
        }
    });

    const results = await Promise.all(promises);
    const flat = results.flat().sort((a, b) => parseFloat(b.insights?.spend || '0') - parseFloat(a.insights?.spend || '0'));

    const response = { data: flat, nextCursor: undefined };
    setCache(cacheKey, response);
    return response;
};

export const fetchAdsWithInsights = async (
    adAccountIds: string[],
    token: string,
    dateSelection: DateSelection,
    filter?: GlobalFilter,
    afterCursor?: string
): Promise<PaginatedResponse<Ad>> => {
    const cacheKey = generateKey('fetchAdsWithInsights', adAccountIds, dateSelection, filter, afterCursor);
    const cached = getCache(cacheKey);
    if (cached) return cached as PaginatedResponse<Ad>;

    const promises = adAccountIds.map(async (accId) => {
        const formattedId = accId.startsWith('act_') ? accId : `act_${accId}`;
        const filtering = buildFilteringParam(filter);

        let timeFilter = '';
        if (dateSelection.preset !== 'custom' && ['today', 'yesterday', 'last_7d', 'last_30d', 'this_month', 'last_month', 'this_year', 'maximum'].includes(dateSelection.preset)) {
            timeFilter = `.date_preset(${dateSelection.preset})`;
        } else {
            const { since, until } = resolveDateRange(dateSelection);
            const range = JSON.stringify({ since, until });
            timeFilter = `.time_range(${range})`;
        }

        const fields = `id,adset_id,campaign_id,name,status,creative{id},campaign{objective},insights${timeFilter}{spend,impressions,clicks,unique_clicks,cpc,ctr,cpm,reach,frequency,inline_link_clicks,inline_post_engagement,actions,action_values,outbound_clicks,video_play_actions,video_p100_watched_actions,video_thruplay_watched_actions,purchase_roas}`;

        try {
            const response = await fetch(
                `${BASE_URL}/${GRAPH_API_VERSION}/${formattedId}/ads?fields=${fields}&limit=50&access_token=${token}${filtering}&use_account_attribution_setting=true`
            );
            const data = await response.json();
            return data.data || [];
        } catch (e) {
            return [];
        }
    });

    const rawAdsLists = await Promise.all(promises);
    const adsRaw = rawAdsLists.flat();

    // --- ENHANCED CREATIVE FETCHING (Batching all ID from all accounts) ---
    const creativeIds = [...new Set(adsRaw.map((a: any) => a.creative?.id).filter(Boolean))];
    const creativeMap: Record<string, AdCreative> = {};

    if (creativeIds.length > 0) {
        const chunkSize = 50;
        for (let i = 0; i < creativeIds.length; i += chunkSize) {
            const chunk = creativeIds.slice(i, i + chunkSize);
            try {
                const creFields = 'id,name,title,body,image_url,thumbnail_url,object_story_spec,asset_feed_spec,call_to_action_type,image_hash,effective_object_story_id,object_type,instagram_actor_id';
                const creResponse = await fetch(
                    `${BASE_URL}/${GRAPH_API_VERSION}/?ids=${chunk.join(',')}&fields=${creFields}&access_token=${token}`
                );
                const creData = await creResponse.json();
                Object.values(creData).forEach((c: any) => {
                    creativeMap[c.id] = {
                        id: c.id,
                        name: c.name,
                        title: c.title || c.object_story_spec?.link_data?.name,
                        body: c.body || c.object_story_spec?.link_data?.message,
                        image_url: c.image_url || c.thumbnail_url,
                        thumbnail_url: c.thumbnail_url,
                        image_hash: c.image_hash,
                        object_type: c.object_type,
                        call_to_action_type: c.call_to_action_type,
                        effective_object_story_id: c.effective_object_story_id,
                        instagram_actor_id: c.instagram_actor_id,
                        link_caption: c.object_story_spec?.link_data?.call_to_action?.value?.link_caption || 'LEARN MORE',
                        object_story_spec: c.object_story_spec,
                        asset_feed_spec: c.asset_feed_spec
                    };
                });
            } catch (e) { }
        }
    }

    const processedAds = adsRaw.map((ad: any) => {
        const insights = ad.insights ? ad.insights.data[0] : null;
        let enhancedInsights = null;
        if (insights) {
            const videoPlays = insights.video_play_actions?.find((a: any) => a.action_type === 'video_view')?.value || '0';
            const thruPlays = insights.video_thruplay_watched_actions?.find((a: any) => a.action_type === 'video_thruplay')?.value || '0';
            const actions = insights.actions || [];
            // Use calculateResults
            const objective = ad.campaign?.objective || 'UNKNOWN';
            const { results, cost_per_result } = calculateResults(insights, objective);

            enhancedInsights = {
                ...insights,
                video_plays: videoPlays,
                video_thruplays: thruPlays,
                results: results.toString(),
                cost_per_result: cost_per_result.toFixed(2),
                roas: calculateROAS(insights)
            };
        }
        return {
            ...ad,
            creative: ad.creative ? creativeMap[ad.creative.id] : undefined,
            insights: enhancedInsights
        };
    });

    const response = { data: processedAds, nextCursor: undefined };
    setCache(cacheKey, response);
    return response;
};

// ... updates (single ID, keep as is) ...
export const updateCampaign = async (id: string, updates: Partial<Campaign>, token: string) => {
    const payload: any = {};
    if (updates.name) payload.name = updates.name;
    if (updates.status) payload.status = updates.status;
    if (updates.daily_budget) payload.daily_budget = updates.daily_budget;
    if (updates.lifetime_budget) payload.lifetime_budget = updates.lifetime_budget;
    if (updates.objective) payload.objective = updates.objective;

    const response = await fetch(`${BASE_URL}/${GRAPH_API_VERSION}/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, access_token: token })
    });
    clearCache(); // Invalidate cache on update
    return await response.json();
};

export const updateAdSet = async (id: string, updates: Partial<AdSet>, token: string) => {
    const payload: any = {};
    if (updates.name) payload.name = updates.name;
    if (updates.status) payload.status = updates.status;
    if (updates.daily_budget) payload.daily_budget = updates.daily_budget;
    if (updates.targeting) payload.targeting = updates.targeting;
    if (updates.optimization_goal) payload.optimization_goal = updates.optimization_goal;
    const response = await fetch(`${BASE_URL}/${GRAPH_API_VERSION}/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, access_token: token })
    });
    clearCache();
    return await response.json();
};

export const updateAd = async (id: string, updates: Partial<Ad>, token: string) => {
    const payload: any = {};
    if (updates.name) payload.name = updates.name;
    if (updates.status) payload.status = updates.status;
    const response = await fetch(`${BASE_URL}/${GRAPH_API_VERSION}/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, access_token: token })
    });
    clearCache();
    return await response.json();
};

export const deleteEntity = async (id: string, token: string) => {
    const response = await fetch(`${BASE_URL}/${GRAPH_API_VERSION}/${id}?access_token=${token}`, {
        method: 'DELETE',
    });
    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    clearCache();
    return data.success;
};

export const duplicateEntity = async (id: string, token: string) => {
    // Meta API: POST /{object-id}/copies
    const response = await fetch(`${BASE_URL}/${GRAPH_API_VERSION}/${id}/copies?access_token=${token}`, {
        method: 'POST',
    });
    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    clearCache();
    return data;
};

export const publishDrafts = async (drafts: Record<string, any>, level: string, token: string) => {
    const promises = Object.entries(drafts).map(([id, changes]) => {
        if (level === 'CAMPAIGN') return updateCampaign(id, changes, token);
        if (level === 'ADSET') return updateAdSet(id, changes, token);
        if (level === 'AD') return updateAd(id, changes, token);
        return Promise.resolve();
    });
    return Promise.all(promises);
};

// --- INSIGHTS AGGREGATION ---

const mergeDailyInsights = (allResults: DailyInsight[][]) => {
    const map: Record<string, DailyInsight> = {};
    // ... (rest of merge logic same)
    // Simplified accumulation logic for brevity, same as previous
    const mergedList = Object.values(allResults.flat().reduce((acc: any, curr) => {
        const d = curr.date_start;
        if (!acc[d]) {
            acc[d] = {
                date_start: d, spend: 0, impressions: 0, clicks: 0, reach: 0, post_engagement: 0, leads: 0, messaging_conversations: 0, purchase_value: 0
            };
        }
        acc[d].spend += curr.spend;
        acc[d].impressions += curr.impressions;
        acc[d].clicks += curr.clicks;
        acc[d].reach += curr.reach;
        acc[d].post_engagement += curr.post_engagement;
        acc[d].leads += curr.leads;
        acc[d].messaging_conversations += curr.messaging_conversations;

        // Calculate Revenue from this day's ROAS * Spend if revenue not explicit
        let dailyRoas = curr.roas || 0;
        if (curr.purchase_roas && Array.isArray(curr.purchase_roas)) {
            const roasObj = curr.purchase_roas.find((v: any) => v.action_type === 'omni_purchase')
                || curr.purchase_roas.find((v: any) => v.action_type === 'purchase');
            if (roasObj) dailyRoas = parseFloat(roasObj.value);
        }
        const rev = dailyRoas * curr.spend;
        acc[d].purchase_value += rev;

        return acc;
    }, {})).map((i: any) => ({
        ...i,
        ctr: i.impressions > 0 ? (i.clicks / i.impressions) * 100 : 0,
        cpc: i.clicks > 0 ? i.spend / i.clicks : 0,
        roas: i.spend > 0 ? i.purchase_value / i.spend : 0,
        engagement_rate: i.impressions > 0 ? (i.post_engagement / i.impressions) * 100 : 0
    }));

    return mergedList.sort((a: any, b: any) => new Date(a.date_start).getTime() - new Date(b.date_start).getTime());
};

const mergeHourlyInsights = (allResults: HourlyInsight[][]) => {
    // ... (same logic as before)
    const map: Record<string, HourlyInsight> = {};
    for (let i = 0; i < 24; i++) {
        const h = i.toString().padStart(2, '0');
        map[h] = { hour: h, spend: 0, impressions: 0, reach: 0, clicks: 0, roas: 0, conversions: 0, cpa: 0, ctr: 0, purchase_value: 0 } as any;
    }
    allResults.flat().forEach(item => {
        const h = item.hour;
        if (map[h]) {
            map[h].spend += item.spend;
            map[h].impressions += item.impressions;
            map[h].reach += item.reach;
            map[h].clicks += item.clicks;
            map[h].conversions += item.conversions;
            // Strict Revenue Accumulation
            const rev = item.spend * item.roas;
            (map[h] as any).purchase_value += rev;
        }
    });
    return Object.values(map).map((h: any) => ({
        ...h,
        roas: h.spend > 0 ? h.purchase_value / h.spend : 0,
        ctr: h.impressions > 0 ? (h.clicks / h.impressions) * 100 : 0,
        cpa: h.conversions > 0 ? h.spend / h.conversions : 0
    })).sort((a, b) => parseInt(a.hour) - parseInt(b.hour));
};

const mergeInsightsData = (list: InsightData[]): InsightData | null => {
    if (list.length === 0) return null;
    const base = {
        spend: 0, impressions: 0, clicks: 0, inline_link_clicks: 0,
        actions: [] as any[], action_values: [] as any[],
        reach: 0, unique_clicks: 0
    };
    const actionMap: Record<string, number> = {};
    const valueMap: Record<string, number> = {};

    list.forEach(i => {
        base.spend += parseFloat(i.spend || '0');
        base.impressions += parseInt(i.impressions || '0');
        base.clicks += parseInt(i.clicks || '0');
        base.inline_link_clicks += parseInt(i.inline_link_clicks || '0');
        base.reach += parseInt(i.reach || '0');
        base.unique_clicks += parseInt(i.unique_clicks || '0');

        (i.actions || []).forEach(a => {
            actionMap[a.action_type] = (actionMap[a.action_type] || 0) + parseFloat(a.value);
        });
        (i.action_values || []).forEach(a => {
            valueMap[a.action_type] = (valueMap[a.action_type] || 0) + parseFloat(a.value);
        });
    });

    const actions = Object.entries(actionMap).map(([k, v]) => ({ action_type: k, value: v.toString() }));
    const action_values = Object.entries(valueMap).map(([k, v]) => ({ action_type: k, value: v.toString() }));

    // STRICT ROAS CALCULATION FOR AGGREGATED DATA
    // Find total purchase value
    let totalPurchaseValue = 0;
    const purchaseValObj = action_values.find(v => v.action_type === 'purchase')
        || action_values.find(v => v.action_type === 'omni_purchase')
        || action_values.find(v => v.action_type === 'offsite_conversion.fb_pixel_purchase');

    if (purchaseValObj) {
        totalPurchaseValue = parseFloat(purchaseValObj.value);
    }

    const aggregatedRoas = base.spend > 0 ? totalPurchaseValue / base.spend : 0;

    return {
        spend: base.spend.toString(),
        impressions: base.impressions.toString(),
        clicks: base.clicks.toString(),
        inline_link_clicks: base.inline_link_clicks.toString(),
        reach: base.reach.toString(),
        unique_clicks: base.unique_clicks.toString(),
        actions,
        action_values,
        date_start: list[0]?.date_start || '',
        date_stop: list[0]?.date_stop || '',
        cpc: base.clicks > 0 ? (base.spend / base.clicks).toFixed(2) : '0',
        ctr: base.impressions > 0 ? ((base.clicks / base.impressions) * 100).toFixed(2) : '0',
        cpm: base.impressions > 0 ? ((base.spend / base.impressions) * 1000).toFixed(2) : '0',
        frequency: base.reach > 0 ? (base.impressions / base.reach).toFixed(2) : '0',
        purchase_roas: [{ action_type: 'omni_purchase', value: aggregatedRoas.toString() }] // Mock structure to satisfy types if needed, or better:
        // Actually, InsightData type might not have 'roas' field at top level in some definitions, but let's check. 
        // It relies on purchase_roas array.
    };
};

// --- AGGREGATED EXPORTS ---

export const fetchAccountInsights = async (
    adAccountIds: string[],
    token: string,
    dateSelectionOrRange: DateSelection | { since: string, until: string },
    filter?: GlobalFilter
): Promise<InsightData | null> => {
    const cacheKey = generateKey('fetchAccountInsights', adAccountIds, dateSelectionOrRange, filter);
    const cached = getCache(cacheKey);
    if (cached) return cached as InsightData | null;

    const promises = adAccountIds.map(async (accId) => {
        const formattedId = accId.startsWith('act_') ? accId : `act_${accId}`;
        const filtering = buildFilteringParam(filter);

        let dateParam = '';
        if ('preset' in dateSelectionOrRange) {
            dateParam = getDateParam(dateSelectionOrRange as DateSelection);
        } else {
            const { since, until } = dateSelectionOrRange as { since: string, until: string };
            dateParam = getRawTimeRangeParam(since, until);
        }

        try {
            const response = await fetch(
                `${BASE_URL}/${GRAPH_API_VERSION}/${formattedId}/insights?fields=spend,impressions,clicks,inline_link_clicks,unique_clicks,cpc,ctr,cpm,reach,frequency,actions,action_values,purchase_roas&access_token=${token}${dateParam}${filtering}&use_account_attribution_setting=true`
            );
            const data = await response.json();
            return data.data.length > 0 ? data.data[0] : null;
        } catch (e) { return null; }
    });

    const results = await Promise.all(promises);
    const merged = mergeInsightsData(results.filter(Boolean));
    setCache(cacheKey, merged);
    return merged;
};

export const fetchDailyAccountInsights = async (
    adAccountIds: string[],
    token: string,
    dateSelection: DateSelection,
    filter?: GlobalFilter
): Promise<DailyInsight[]> => {
    const cacheKey = generateKey('fetchDailyAccountInsights', adAccountIds, dateSelection, filter);
    const cached = getCache(cacheKey);
    if (cached) return cached as DailyInsight[];

    const promises = adAccountIds.map(async (accId) => {
        const formattedId = accId.startsWith('act_') ? accId : `act_${accId}`;
        const filtering = buildFilteringParam(filter);
        const dateParam = getDateParam(dateSelection);

        try {
            const response = await fetch(
                `${BASE_URL}/${GRAPH_API_VERSION}/${formattedId}/insights?time_increment=1&fields=spend,impressions,reach,clicks,inline_link_clicks,cpc,ctr,actions,action_values&limit=5000&access_token=${token}${dateParam}${filtering}`
            );
            const data = await response.json();
            return (data.data || []).map((day: any) => {
                const actions = day.actions || [];
                const postEngagements = actions.find((a: any) => a.action_type === 'post_engagement')?.value || '0';
                const leads = actions.find((a: any) => a.action_type === 'lead')?.value || '0';
                const msgs = actions.find((a: any) => a.action_type === 'onsite_conversion.messaging_conversation_started_7d' || a.action_type === 'messaging_conversation_started_7d')?.value || '0';
                return {
                    date_start: day.date_start,
                    spend: parseFloat(day.spend || '0'),
                    impressions: parseInt(day.impressions || '0'),
                    reach: parseInt(day.reach || '0'),
                    clicks: parseInt(day.clicks || '0'),
                    ctr: parseFloat(day.ctr || '0'),
                    cpc: parseFloat(day.cpc || '0'),
                    roas: calculateROAS(day),
                    post_engagement: parseInt(postEngagements),
                    leads: parseInt(leads),
                    messaging_conversations: parseInt(msgs),
                };
            });
        } catch (e) { return []; }
    });

    const allResults = await Promise.all(promises);
    const merged = mergeDailyInsights(allResults);
    setCache(cacheKey, merged);
    return merged;
};

// [Deleted original fetchAdSetsWithInsights to resolve duplication]
// This function is now implemented with drill-down support at the bottom of the file.

export const fetchHourlyInsights = async (
    adAccountIds: string[],
    token: string,
    dateSelection: DateSelection,
    filter?: GlobalFilter
): Promise<HourlyInsight[]> => {
    const cacheKey = generateKey('fetchHourlyInsights', adAccountIds, dateSelection, filter);
    const cached = getCache(cacheKey);
    if (cached) return cached as HourlyInsight[];

    const promises = adAccountIds.map(async (accId) => {
        const formattedId = accId.startsWith('act_') ? accId : `act_${accId}`;
        const filtering = buildFilteringParam(filter);
        const dateParam = getDateParam(dateSelection);

        try {
            const response = await fetch(
                `${BASE_URL}/${GRAPH_API_VERSION}/${formattedId}/insights?breakdowns=hourly_stats_aggregated_by_audience_time_zone&fields=spend,impressions,clicks,reach,actions,action_values&limit=1000&access_token=${token}${dateParam}${filtering}`
            );
            const data = await response.json();
            if (!data.data) return [];

            const hourlyMap: Record<string, HourlyInsight> = {};
            for (let i = 0; i < 24; i++) {
                const h = i.toString().padStart(2, '0');
                hourlyMap[h] = { hour: h, spend: 0, impressions: 0, reach: 0, clicks: 0, roas: 0, conversions: 0, cpa: 0, ctr: 0 };
            }

            data.data.forEach((item: any) => {
                const timeRange = item.hourly_stats_aggregated_by_audience_time_zone;
                const hour = timeRange ? timeRange.substring(0, 2) : '00';
                if (!hourlyMap[hour]) return;

                hourlyMap[hour].spend += parseFloat(item.spend || '0');
                hourlyMap[hour].impressions += parseInt(item.impressions || '0');
                hourlyMap[hour].reach += parseInt(item.reach || '0');
                hourlyMap[hour].clicks += parseInt(item.clicks || '0');

                const actionValues = item.action_values || [];
                let purchaseValueObj = actionValues.find((v: any) => v.action_type === 'omni_purchase' || v.action_type === 'purchase' || v.action_type.includes('purchase'));
                hourlyMap[hour].roas += purchaseValueObj ? parseFloat(purchaseValueObj.value) : 0;

                const actions = item.actions || [];
                let purchaseAction = actions.find((a: any) => a.action_type === 'omni_purchase' || a.action_type === 'purchase' || a.action_type.includes('purchase'));
                hourlyMap[hour].conversions += purchaseAction ? parseFloat(purchaseAction.value) : 0;
            });

            return Object.values(hourlyMap);
        } catch (e) { return []; }
    });

    const allResults = await Promise.all(promises);
    const merged = mergeHourlyInsights(allResults);
    setCache(cacheKey, merged);
    return merged;
}

export const fetchPlacementBreakdown = async (
    adAccountIds: string[],
    token: string,
    dateSelection: DateSelection,
    filter?: GlobalFilter
): Promise<InsightData[]> => {
    const cacheKey = generateKey('fetchPlacementBreakdown', adAccountIds, dateSelection, filter);
    const cached = getCache(cacheKey);
    if (cached) return cached as InsightData[];

    const promises = adAccountIds.map(async (accId) => {
        const formattedId = accId.startsWith('act_') ? accId : `act_${accId}`;
        const filtering = buildFilteringParam(filter);
        const dateParam = getDateParam(dateSelection);
        try {
            const response = await fetch(
                `${BASE_URL}/${GRAPH_API_VERSION}/${formattedId}/insights?breakdowns=publisher_platform,platform_position&fields=spend,impressions,reach,clicks,actions,action_values&limit=100&access_token=${token}${dateParam}${filtering}`
            );
            const data = await response.json();
            return data.data || [];
        } catch (e) { return []; }
    });

    const results = await Promise.all(promises);
    const flat = results.flat();
    const map: Record<string, any> = {};
    flat.forEach(i => {
        const key = `${i.publisher_platform}-${i.platform_position}`;
        if (!map[key]) {
            map[key] = { ...i, actions: i.actions || [], action_values: i.action_values || [] };
        } else {
            map[key].spend = (parseFloat(map[key].spend) + parseFloat(i.spend)).toString();
            map[key].impressions = (parseInt(map[key].impressions) + parseInt(i.impressions)).toString();
            map[key].reach = (parseInt(map[key].reach || '0') + parseInt(i.reach || '0')).toString();
            const mergeActions = (arr1: any[], arr2: any[]) => {
                const m: Record<string, number> = {};
                [...arr1, ...arr2].forEach(a => m[a.action_type] = (m[a.action_type] || 0) + parseFloat(a.value));
                return Object.entries(m).map(([k, v]) => ({ action_type: k, value: v.toString() }));
            };
            map[key].actions = mergeActions(map[key].actions, i.actions || []);
            map[key].action_values = mergeActions(map[key].action_values, i.action_values || []);
        }
    });

    const final = Object.values(map);
    setCache(cacheKey, final);
    return final;
}

export const fetchBreakdown = async (
    adAccountIds: string[],
    token: string,
    dateSelection: DateSelection,
    breakdownType: 'age,gender' | 'publisher_platform' | 'device_platform' | 'region',
    filter?: GlobalFilter
): Promise<InsightData[]> => {
    const cacheKey = generateKey('fetchBreakdown', adAccountIds, dateSelection, breakdownType, filter);
    const cached = getCache(cacheKey);
    if (cached) return cached as InsightData[];

    const promises = adAccountIds.map(async (accId) => {
        const formattedId = accId.startsWith('act_') ? accId : `act_${accId}`;
        const filtering = buildFilteringParam(filter);
        const dateParam = getDateParam(dateSelection);
        try {
            const response = await fetch(
                `${BASE_URL}/${GRAPH_API_VERSION}/${formattedId}/insights?breakdowns=${breakdownType}&fields=spend,impressions,reach,clicks,actions,action_values&limit=500&access_token=${token}${dateParam}${filtering}`
            );
            const data = await response.json();
            return data.data || [];
        } catch (e) { return []; }
    });

    const results = await Promise.all(promises);
    const flat = results.flat();
    const map: Record<string, any> = {};
    flat.forEach(i => {
        let key = '';
        if (breakdownType === 'age,gender') key = `${i.age}-${i.gender}`;
        else if (breakdownType === 'region') key = i.region;
        else key = i[breakdownType.split(',')[0]];

        if (!map[key]) {
            map[key] = { ...i, actions: i.actions || [], action_values: i.action_values || [] };
        } else {
            map[key].spend = (parseFloat(map[key].spend) + parseFloat(i.spend)).toString();
            map[key].impressions = (parseInt(map[key].impressions) + parseInt(i.impressions)).toString();
        }
    });
    const final = Object.values(map);
    setCache(cacheKey, final);
    return final;
}

export const fetchCreativePerformance = async (
    adAccountIds: string[],
    token: string,
    dateSelection: DateSelection,
    filter?: GlobalFilter
): Promise<AdPerformance[]> => {
    const cacheKey = generateKey('fetchCreativePerformance', adAccountIds, dateSelection, filter);
    const cached = getCache(cacheKey);
    if (cached) return cached as AdPerformance[];

    const promises = adAccountIds.map(async (accId) => {
        const formattedId = accId.startsWith('act_') ? accId : `act_${accId}`;
        const filtering = buildFilteringParam(filter);
        const dateParam = getDateParam(dateSelection);
        try {
            // Fetch ALL ads using pagination (no arbitrary limit)
            let allData: any[] = [];
            let nextUrl = `${BASE_URL}/${GRAPH_API_VERSION}/${formattedId}/insights?level=ad&limit=500&fields=ad_id,ad_name,spend,impressions,clicks,unique_clicks,cpc,cpm,ctr,reach,frequency,inline_link_clicks,inline_post_engagement,actions,action_values,outbound_clicks,video_play_actions,video_p100_watched_actions,video_thruplay_watched_actions,purchase_roas,account_currency&access_token=${token}${dateParam}${filtering}&use_account_attribution_setting=true`;

            while (nextUrl) {
                const insightsResponse = await fetch(nextUrl);
                const insightsData = await insightsResponse.json();
                if (insightsData.data) {
                    allData = [...allData, ...insightsData.data];
                }
                nextUrl = insightsData.paging?.next || null;

                // Safety Break to prevent infinite loops in extreme cases (e.g. > 100 pages of 500 = 50k ads)
                if (allData.length > 50000) break;
            }
            return allData;
        } catch (e) { return []; }
    });

    const rawResults = await Promise.all(promises);
    let allInsights = rawResults.flat();

    if (allInsights.length === 0) return [];

    // Sort by Spend Descending
    allInsights.sort((a: any, b: any) => parseFloat(b.spend || '0') - parseFloat(a.spend || '0'));
    // Capture up to 2000 top spending ads (practical UI limit)
    allInsights = allInsights.slice(0, 2000);

    const adIds = allInsights.map((i: any) => i.ad_id);
    const adDetailsMap: Record<string, any> = {};
    const chunkSize = 50;
    for (let i = 0; i < adIds.length; i += chunkSize) {
        const chunk = adIds.slice(i, i + chunkSize);
        try {
            const creFields = 'id,name,title,body,image_url,thumbnail_url,object_story_spec,asset_feed_spec,call_to_action_type,image_hash,effective_object_story_id,object_type,instagram_actor_id';
            // Added campaign{objective} to fields
            const adsUrl = `${BASE_URL}/${GRAPH_API_VERSION}/?ids=${chunk.join(',')}&fields=name,status,created_time,campaign{objective},creative{${creFields}}&access_token=${token}`;
            const adsResponse = await fetch(adsUrl);
            const adsData = await adsResponse.json();
            Object.values(adsData).forEach((ad: any) => adDetailsMap[ad.id] = ad);
        } catch (e) { }
    }

    const final = allInsights.map((insight: any) => {
        const adDetails = adDetailsMap[insight.ad_id] || {};
        const cre = adDetails.creative || {};
        const objective = adDetails.campaign?.objective || 'UNKNOWN';

        const creativeObj: AdCreative = {
            id: cre.id || 'unknown',
            name: cre.name || 'Unknown',
            title: cre.title || cre.object_story_spec?.link_data?.name,
            body: cre.body || cre.object_story_spec?.link_data?.message,
            image_url: cre.image_url || cre.thumbnail_url,
            thumbnail_url: cre.thumbnail_url,
            image_hash: cre.image_hash,
            object_type: cre.object_type,
            call_to_action_type: cre.call_to_action_type,
            effective_object_story_id: cre.effective_object_story_id,
            instagram_actor_id: cre.instagram_actor_id,
            link_caption: cre.object_story_spec?.link_data?.call_to_action?.value?.link_caption || 'LEARN MORE',
            object_story_spec: cre.object_story_spec,
            asset_feed_spec: cre.asset_feed_spec
        };

        const videoPlays = insight.video_play_actions?.find((a: any) => a.action_type === 'video_view')?.value || '0';
        const thruPlays = insight.video_thruplay_watched_actions?.find((a: any) => a.action_type === 'video_thruplay')?.value || '0';

        // Use standard helper for consistent Results
        const { results, cost_per_result } = calculateResults(insight, objective);
        const cpa = cost_per_result; // In many contexts CPA = Cost Per Result

        return {
            ...insight,
            video_plays: videoPlays,
            video_thruplays: thruPlays,
            results: results.toString(),
            cost_per_result: cost_per_result.toFixed(2),
            ad_id: insight.ad_id,
            ad_name: adDetails.name || insight.ad_name,
            status: adDetails.status || 'UNKNOWN',
            created_time: adDetails.created_time,
            creative: creativeObj,
            roas: calculateROAS(insight),
            cpa: cpa,
            hold_rate: 0,
            objective: objective,
            account_currency: insight.account_currency // Pass currency
        };
    });
    setCache(cacheKey, final);
    return final;
};

// --- META ADS CREATION API (NEW) ---

export const createCampaign = async (accountId: string, data: Partial<Campaign>, token: string) => {
    const formattedId = accountId.startsWith('act_') ? accountId : `act_${accountId}`;
    const payload = {
        name: data.name,
        objective: data.objective,
        status: data.status,
        special_ad_categories: data.special_ad_categories || ['NONE'],
        buying_type: data.buying_type || 'AUCTION',
        access_token: token
    };

    const response = await fetch(`${BASE_URL}/${GRAPH_API_VERSION}/${formattedId}/campaigns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    const result = await response.json();
    if (result.error) throw new Error(result.error.message);
    clearCache();
    return result;
};

export const createAdSet = async (accountId: string, data: Partial<AdSet>, token: string) => {
    const formattedId = accountId.startsWith('act_') ? accountId : `act_${accountId}`;
    const payload = {
        name: data.name,
        campaign_id: data.campaign_id,
        status: data.status,
        daily_budget: data.daily_budget,
        lifetime_budget: data.lifetime_budget,
        start_time: data.start_time,
        end_time: data.end_time || undefined,
        billing_event: data.billing_event || 'IMPRESSIONS',
        optimization_goal: data.optimization_goal || 'LINK_CLICKS',
        bid_amount: data.bid_amount,
        targeting: data.targeting,
        access_token: token
    };

    const response = await fetch(`${BASE_URL}/${GRAPH_API_VERSION}/${formattedId}/adsets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    const result = await response.json();
    if (result.error) throw new Error(result.error.message);
    clearCache();
    return result;
};

export const createCreative = async (accountId: string, data: AdCreative, token: string) => {
    const formattedId = accountId.startsWith('act_') ? accountId : `act_${accountId}`;
    const payload = {
        name: data.name,
        object_story_spec: data.object_story_spec,
        access_token: token
    };

    const response = await fetch(`${BASE_URL}/${GRAPH_API_VERSION}/${formattedId}/adcreatives`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    const result = await response.json();
    if (result.error) throw new Error(result.error.message);
    return result;
};

export const createAd = async (accountId: string, data: Partial<Ad>, token: string) => {
    const formattedId = accountId.startsWith('act_') ? accountId : `act_${accountId}`;
    const payload = {
        name: data.name,
        adset_id: data.adset_id,
        creative: { creative_id: data.creative?.id },
        status: data.status,
        access_token: token
    };

    const response = await fetch(`${BASE_URL}/${GRAPH_API_VERSION}/${formattedId}/ads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    const result = await response.json();
    if (result.error) throw new Error(result.error.message);
    clearCache();
    return result;
};

// --- TARGETING SEARCH API ---

export const searchTargeting = async (query: string, type: 'adinterest' | 'adgeolocation' | 'adtargetingsuggestion', token: string) => {
    try {
        const response = await fetch(
            `${BASE_URL}/${GRAPH_API_VERSION}/search?type=${type}&q=${encodeURIComponent(query)}&limit=20&access_token=${token}`
        );
        const data = await response.json();
        return data.data || [];
    } catch (e) {
        console.error("Targeting search failed", e);
        return [];
    }
};


// --- HIERARCHICAL FETCHING (STRICT ADS MANAGER CLONE) ---

export const fetchFullHierarchy = async (
    adAccountIds: string[],
    token: string,
    dateSelection: DateSelection,
    filter?: GlobalFilter
): Promise<HierarchicalAccount[]> => {
    // 1. Resolve Time Range
    let timeRangeParam = '';
    const validMetaPresets = ['today', 'yesterday', 'last_3d', 'last_7d', 'last_14d', 'last_28d', 'last_30d', 'last_90d', 'this_month', 'last_month', 'this_quarter', 'this_year', 'maximum'];

    if (dateSelection.preset !== 'custom' && validMetaPresets.includes(dateSelection.preset)) {
        timeRangeParam = `date_preset=${dateSelection.preset}`;
    } else {
        const { since, until } = resolveDateRange(dateSelection);
        const range = JSON.stringify({ since, until });
        timeRangeParam = `time_range=${range}`;
    }

    // 2. Fetch All Data in Parallel (Campaigns, AdSets, Ads) for selected accounts
    const accountPromises = adAccountIds.map(async (accId) => {
        const formattedId = accId.startsWith('act_') ? accId : `act_${accId}`;
        const filtering = buildFilteringParam(filter);

        try {
            // A. Fetch Account Info + Insights
            const accUrl = `${BASE_URL}/${GRAPH_API_VERSION}/${formattedId}?fields=name,account_status,currency,timezone_name,insights.limit(1){spend,impressions,clicks,cpc,ctr,reach,actions,action_values,purchase_roas}&access_token=${token}&${timeRangeParam}&use_account_attribution_setting=true`;

            // B. Fetch Campaigns
            const campFields = `id,name,status,objective,buying_type,daily_budget,lifetime_budget,insights.limit(1){spend,impressions,clicks,cpc,ctr,reach,actions,action_values,purchase_roas}`;
            const campUrl = `${BASE_URL}/${GRAPH_API_VERSION}/${formattedId}/campaigns?fields=${campFields}&limit=500&access_token=${token}&${timeRangeParam}${filtering}&use_account_attribution_setting=true`;

            // C. Fetch AdSets
            const adSetFields = `id,name,status,campaign_id,daily_budget,lifetime_budget,start_time,end_time,targeting,insights.limit(1){spend,impressions,clicks,cpc,ctr,reach,actions,action_values,purchase_roas}`;
            const adSetUrl = `${BASE_URL}/${GRAPH_API_VERSION}/${formattedId}/adsets?fields=${adSetFields}&limit=1000&access_token=${token}&${timeRangeParam}${filtering}&use_account_attribution_setting=true`;

            // D. Fetch Ads
            const adFields = `id,name,status,adset_id,campaign_id,creative{id,name,image_url,thumbnail_url},insights.limit(1){spend,impressions,clicks,unique_clicks,cpc,ctr,cpm,reach,frequency,inline_link_clicks,actions,action_values,purchase_roas}`;
            const adUrl = `${BASE_URL}/${GRAPH_API_VERSION}/${formattedId}/ads?fields=${adFields}&limit=2000&access_token=${token}&${timeRangeParam}${filtering}&use_account_attribution_setting=true`;

            const [accRes, campRes, adSetRes, adRes] = await Promise.all([
                fetch(accUrl),
                fetch(campUrl),
                fetch(adSetUrl),
                fetch(adUrl)
            ]);

            const accData = await accRes.json();
            const campData = await campRes.json();
            const adSetData = await adSetRes.json();
            const adData = await adRes.json();

            // Process Insights Helper
            const extractInsight = (obj: any): InsightData | undefined => {
                if (!obj.insights || !obj.insights.data || obj.insights.data.length === 0) return undefined;
                return obj.insights.data[0];
            };

            // 3. Build Hierarchy Tree
            const campaignsMap: Record<string, HierarchicalCampaign> = {};
            const adSetsMap: Record<string, HierarchicalAdSet> = {};

            // Initialize Campaigns
            (campData.data || []).forEach((c: any) => {
                campaignsMap[c.id] = {
                    ...c,
                    insights: extractInsight(c),
                    adSets: []
                };
            });

            // Initialize AdSets and link to Campaigns
            (adSetData.data || []).forEach((as: any) => {
                const hAdSet: HierarchicalAdSet = {
                    ...as,
                    insights: extractInsight(as),
                    ads: []
                };
                adSetsMap[as.id] = hAdSet;

                if (campaignsMap[as.campaign_id]) {
                    campaignsMap[as.campaign_id].adSets.push(hAdSet);
                }
            });

            // Initialize Ads and link to AdSets
            (adData.data || []).forEach((ad: any) => {
                const hAd: HierarchicalAd = {
                    ...ad,
                    insights: extractInsight(ad)
                };

                if (adSetsMap[ad.adset_id]) {
                    adSetsMap[ad.adset_id].ads.push(hAd);
                }
            });

            const hierarchy: HierarchicalAccount = {
                id: accData.id,
                name: accData.name,
                account_status: accData.account_status,
                currency: accData.currency,
                timezone_name: accData.timezone_name,
                insights: extractInsight(accData),
                campaigns: Object.values(campaignsMap)
            };

            return hierarchy;

        } catch (e) {
            console.error(`Error fetching hierarchy for account ${accId}`, e);
            return null;
        }
    });

    const results = await Promise.all(accountPromises);
    return results.filter(Boolean) as HierarchicalAccount[];
};

export const searchTargetingSuggestions = async (interestList: string[], token: string) => {
    // Interest List needs to be JSON stringified list of IDs or names depending on API version, 
    // usually targeting_list maps to interest IDs.
    // Simplifying to simple interest search for MVP as suggestion API is complex
    return [];
};
