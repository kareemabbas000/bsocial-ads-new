
export type DatePreset = 
  | 'today' 
  | 'yesterday' 
  | 'last_3d' 
  | 'last_7d' 
  | 'last_14d' 
  | 'last_30d' 
  | 'last_90d' 
  | 'last_3months'
  | 'this_month' 
  | 'last_month' 
  | 'this_year' 
  | 'last_year'
  | 'custom';

export interface CustomDateRange {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
}

export interface DateSelection {
  preset: DatePreset;
  custom?: CustomDateRange;
}

export type Theme = 'dark' | 'light';

export interface GlobalFilter {
  searchQuery: string;
  selectedCampaignIds: string[];
  selectedAdSetIds: string[];
}

export interface AccountHierarchy {
  campaigns: { id: string; name: string }[];
  adSets: { id: string; name: string; campaign_id: string }[];
}

export interface AdAccount {
  id: string;
  name: string;
  account_status: number;
  currency: string;
  timezone_name?: string;
}

export interface InsightData {
  campaign_id?: string;
  campaign_name?: string;
  adset_id?: string;
  adset_name?: string;
  ad_id?: string;
  ad_name?: string;
  spend: string;
  impressions: string;
  clicks: string;
  unique_clicks?: string;
  cpc?: string;
  cpm?: string;
  ctr?: string;
  reach?: string;
  frequency?: string;
  inline_link_clicks?: string;
  inline_post_engagement?: string;
  outbound_clicks?: Array<{action_type: string, value: string}>;
  video_play_actions?: Array<{action_type: string, value: string}>;
  
  // New Metrics
  video_plays?: string; // 3-second video plays
  video_thruplays?: string;
  cost_per_result?: string; // CPR
  results?: string; // Generic results count
  
  actions?: Array<{action_type: string, value: string}>;
  action_values?: Array<{action_type: string, value: string}>;
  date_start: string;
  date_stop: string;
  
  // Advanced Breakdowns
  age?: string;
  gender?: string;
  publisher_platform?: string; // facebook, instagram, audience_network
  platform_position?: string; // feed, story, reels
  device_platform?: string; // mobile, desktop
  hourly_stats_aggregated_by_audience_time_zone?: string; // "00:00:00 - 00:59:59"
  region?: string;
  
  // Video Metrics
  video_p25_watched_actions?: Array<{action_type: string, value: string}>;
  video_p100_watched_actions?: Array<{action_type: string, value: string}>;
  video_thruplay_watched_actions?: Array<{action_type: string, value: string}>;
}

export interface Targeting {
  age_min?: number;
  age_max?: number;
  genders?: number[]; // 1=Male, 2=Female
  geo_locations?: {
    countries?: string[];
    cities?: Array<{key: string; name: string; distance_unit: string; radius: number}>;
    regions?: Array<{key: string; name: string; country: string}>;
    location_types?: string[];
  };
  interests?: Array<{id: string; name: string}>;
  custom_audiences?: Array<{id: string; name: string}>;
  excluded_custom_audiences?: Array<{id: string; name: string}>;
  publisher_platforms?: string[];
  facebook_positions?: string[];
  instagram_positions?: string[];
  device_platforms?: string[];
  flexible_spec?: any[];
}

export interface Campaign {
  id: string;
  name: string;
  status: string;
  objective: string;
  buying_type?: string;
  start_time?: string;
  stop_time?: string;
  daily_budget?: string;
  lifetime_budget?: string;
  special_ad_categories?: string[];
  insights?: InsightData; 
}

export interface AdSet {
  id: string;
  campaign_id: string;
  name: string;
  status: string;
  daily_budget?: string;
  lifetime_budget?: string;
  start_time?: string;
  end_time?: string;
  targeting?: Targeting;
  billing_event?: string;
  optimization_goal?: string;
  bid_amount?: string;
  pacing_type?: string[];
  insights?: InsightData;
}

export interface AdCreative {
  id: string;
  name: string;
  image_url?: string;
  thumbnail_url?: string;
  image_hash?: string; 
  title?: string;
  body?: string;
  object_type?: string; 
  call_to_action_type?: string;
  effective_object_story_id?: string; 
  instagram_actor_id?: string; 
  link_caption?: string; 
  object_story_spec?: any; 
  asset_feed_spec?: any; 
}

export interface Ad {
  id: string;
  adset_id: string;
  campaign_id: string;
  name: string;
  status: string;
  creative?: AdCreative;
  insights?: InsightData;
}

export interface AppState {
  metaToken: string | null;
  adAccountIds: string[]; // Changed from adAccountId: string | null
  isConnected: boolean;
  userRole?: 'admin' | 'client';
  userConfig?: UserConfig;
}

export interface AIAnalysisResult {
  analysis: string;
  recommendations: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
}

export interface DailyInsight {
  date_start: string;
  spend: number;
  impressions: number;
  clicks: number;
  reach: number;
  ctr: number;
  cpc: number;
  roas: number;
  post_engagement: number;
  leads: number;
  messaging_conversations: number;
  engagement_rate?: number;
}

export interface HourlyInsight {
  hour: string;
  spend: number;
  impressions: number;
  reach: number;
  clicks: number;
  roas: number;
  conversions: number;
  cpa: number;
  ctr: number;
}

export interface AdPerformance extends InsightData {
  ad_id: string;
  ad_name: string;
  status: string;
  created_time?: string; // ISO 8601 date string
  creative: AdCreative;
  roas: number;
  cpa: number;
  hold_rate: number;
}

// New Interface for Pagination
export interface PaginatedResponse<T> {
  data: T[];
  nextCursor?: string;
}

// --- NEW TYPES FOR ADMIN & PROFILES ---

export interface UserProfile {
  id: string;
  email: string;
  role: 'admin' | 'client';
  full_name: string;
}

export interface UserConfig {
  user_id: string;
  ad_account_ids: string[];
  allowed_profiles: string[]; // 'sales', 'engagement', 'leads', 'messenger'
  allowed_features: string[]; // 'campaigns', 'creative-hub', 'ai-lab'
  hide_total_spend: boolean;
  spend_multiplier: number;
  global_campaign_filter: string[];
  fixed_date_start?: string;
  fixed_date_end?: string;
  refresh_interval?: number; // Minutes
}
