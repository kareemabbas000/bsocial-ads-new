export interface ColumnDefinition {
    id: string;
    label: string;
    category: 'Performance' | 'Setup' | 'Engagement' | 'Conversions' | 'Settings';
    isDefault?: boolean;
    width?: number;
    sortable?: boolean;
}

export const AVAILABLE_COLUMNS: ColumnDefinition[] = [
    // --- PERFORMANCE ---
    { id: 'results', label: 'Results', category: 'Performance', isDefault: true, width: 120, sortable: true },
    { id: 'reach', label: 'Reach', category: 'Performance', isDefault: true, width: 100, sortable: true },
    { id: 'impressions', label: 'Impressions', category: 'Performance', isDefault: true, width: 110, sortable: true },
    { id: 'frequency', label: 'Frequency', category: 'Performance', isDefault: true, width: 90, sortable: true },
    { id: 'delivery', label: 'Delivery', category: 'Performance', isDefault: true, width: 100 },
    { id: 'spend', label: 'Amount Spent', category: 'Performance', isDefault: true, width: 120, sortable: true },
    { id: 'quality_ranking', label: 'Quality Ranking', category: 'Performance', width: 140 },
    { id: 'engagement_rate_ranking', label: 'Engagement Rate Ranking', category: 'Performance', width: 180 },
    { id: 'conversion_rate_ranking', label: 'Conversion Rate Ranking', category: 'Performance', width: 180 },

    // --- COST ---
    { id: 'cpm', label: 'CPM (Cost per 1,000 Impressions)', category: 'Performance', width: 100, sortable: true },
    { id: 'cpc', label: 'CPC (Cost per Link Click)', category: 'Performance', width: 100, sortable: true },
    { id: 'cost_per_result', label: 'Cost per Result', category: 'Performance', width: 120, sortable: true },
    { id: 'cpp', label: 'Cost per 1,000 People Reached', category: 'Performance', width: 120 },

    // --- ENGAGEMENT ---
    { id: 'clicks', label: 'Clicks (All)', category: 'Engagement', width: 90, sortable: true },
    { id: 'ctr', label: 'CTR (All)', category: 'Engagement', width: 80, sortable: true },
    { id: 'inline_link_clicks', label: 'Link Clicks', category: 'Engagement', width: 100, sortable: true },
    { id: 'inline_link_click_ctr', label: 'CTR (Link Clicks)', category: 'Engagement', width: 120 },
    { id: 'post_engagement', label: 'Post Engagement', category: 'Engagement', width: 120 },
    { id: 'page_engagement', label: 'Page Engagement', category: 'Engagement', width: 120 },
    { id: 'video_p25_watched_actions', label: 'Video Plays at 25%', category: 'Engagement', width: 140 },
    { id: 'video_p50_watched_actions', label: 'Video Plays at 50%', category: 'Engagement', width: 140 },
    { id: 'video_p75_watched_actions', label: 'Video Plays at 75%', category: 'Engagement', width: 140 },
    { id: 'video_p100_watched_actions', label: 'Video Plays at 100%', category: 'Engagement', width: 140 },
    { id: 'video_play_actions', label: 'Video Plays', category: 'Engagement', width: 100 },
    { id: 'video_thruplay_watched_actions', label: 'ThruPlays', category: 'Engagement', width: 100 },

    // --- CONVERSIONS ---
    { id: 'actions_link_click', label: 'Website Content Views', category: 'Conversions', width: 140 },
    { id: 'actions_add_to_cart', label: 'Adds to Cart', category: 'Conversions', width: 110 },
    { id: 'actions_initiate_checkout', label: 'Checkouts Initiated', category: 'Conversions', width: 140 },
    { id: 'actions_purchase', label: 'Purchases', category: 'Conversions', width: 100 },
    { id: 'cost_per_purchase', label: 'Cost per Purchase', category: 'Conversions', width: 140 },
    { id: 'actions_lead', label: 'Leads', category: 'Conversions', width: 90 },
    { id: 'cost_per_lead', label: 'Cost per Lead', category: 'Conversions', width: 120 },
    { id: 'roas', label: 'ROAS (Return on Ad Spend)', category: 'Conversions', width: 100 },

    // --- SETUP / SETTINGS ---
    { id: 'id', label: 'Details ID', category: 'Settings', width: 180 },
    { id: 'created_time', label: 'Created', category: 'Settings', width: 120 },
    { id: 'updated_time', label: 'Last Updated', category: 'Settings', width: 120 },
    { id: 'start_time', label: 'Schedule Start', category: 'Settings', width: 180 },
    { id: 'end_time', label: 'Schedule End', category: 'Settings', width: 180 },
    { id: 'budget', label: 'Budget', category: 'Settings', isDefault: true, width: 120 },
    { id: 'bid_strategy', label: 'Bid Strategy', category: 'Settings', width: 120 },
    { id: 'objective', label: 'Objective', category: 'Settings', width: 120 },
    { id: 'optimization_goal', label: 'Optimization Goal', category: 'Settings', width: 140 },

    // --- COUNTS ---
    { id: 'adset_count', label: '# Ad Sets', category: 'Setup', width: 90 },
    { id: 'ad_count', label: '# Ads', category: 'Setup', width: 90 },
];
