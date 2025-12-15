
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
  | 'this_year'
  | 'last_year'
  | 'maximum'
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
  ads: { id: string; name: string; campaign_id: string; adset_id: string }[];
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
  outbound_clicks?: Array<{ action_type: string, value: string }>;
  video_play_actions?: Array<{ action_type: string, value: string }>;
  purchase_roas?: Array<{ action_type: string, value: string }>; // New field for ROAS

  // New Metrics
  video_plays?: string; // 3-second video plays
  video_thruplays?: string;
  cost_per_result?: string; // CPR
  results?: string; // Generic results count

  actions?: Array<{ action_type: string, value: string }>;
  action_values?: Array<{ action_type: string, value: string }>;
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
  video_p25_watched_actions?: Array<{ action_type: string, value: string }>;
  video_p100_watched_actions?: Array<{ action_type: string, value: string }>;
  video_thruplay_watched_actions?: Array<{ action_type: string, value: string }>;
}

export interface Targeting {
  age_min?: number;
  age_max?: number;
  genders?: number[]; // 1=Male, 2=Female
  geo_locations?: {
    countries?: string[];
    cities?: Array<{ key: string; name: string; distance_unit: string; radius: number }>;
    regions?: Array<{ key: string; name: string; country: string }>;
    location_types?: string[];
  };
  interests?: Array<{ id: string; name: string }>;
  custom_audiences?: Array<{ id: string; name: string }>;
  excluded_custom_audiences?: Array<{ id: string; name: string }>;
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
  bid_strategy?: string;
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
  needsOnboarding?: boolean; // New
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
  purchase_value?: number; // Added for strict ROAS calc
  purchases?: number; // Added for accumulation
  purchase_roas?: { action_type: string; value: string }[]; // Added for strict ROAS calc
  post_engagement: number;
  leads: number;
  messaging_conversations: number;
  engagement_rate?: number;
  revenue?: number; // Optional, might be deprecated in favor of purchase_value
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

// --- CAMPAIGN OBJECTIVES ---
export type CampaignObjective =
  | 'OUTCOME_SALES'
  | 'OUTCOME_LEADS'
  | 'OUTCOME_TRAFFIC'
  | 'OUTCOME_ENGAGEMENT'
  | 'OUTCOME_AWARENESS'
  | 'OUTCOME_APP_PROMOTION'
  | 'CONVERSIONS'
  | 'LINK_CLICKS'
  | 'POST_ENGAGEMENT'
  | 'VIDEO_VIEWS'
  | 'LEAD_GENERATION'
  | 'MESSAGES'
  | 'BRAND_AWARENESS'
  | 'REACH'
  | 'APP_INSTALLS'
  | 'UNKNOWN';

export interface AdPerformance extends InsightData {
  ad_id: string;
  ad_name: string;
  status: string;
  created_time?: string;
  creative?: AdCreative;
  roas: number;
  cpa: number;
  hold_rate?: number;
  video_plays?: string;
  video_thruplays?: string;
  results: string;
  cost_per_result: string;
  objective?: CampaignObjective; // Added for dynamic calculation
  account_currency?: string; // Added for currency verification
}

// New Interface for Pagination
export interface PaginatedResponse<T> {
  data: T[];
  cursors?: {
    before: string;
    after: string;
  };
  next?: string;
  previous?: string;
}

// --- NEW TYPES FOR ADMIN & PROFILES ---

export interface UserProfile {
  id: string;
  email: string;
  role: 'admin' | 'client';
  full_name: string;
  first_name?: string;
  last_name?: string;
  company?: string;
}

export interface UserConfig {
  user_id: string;
  ad_account_ids: string[];
  allowed_profiles: string[]; // 'sales', 'engagement', 'leads', 'messenger'
  allowed_features: string[]; // 'campaigns', 'ads-hub', 'ai-lab'
  hide_total_spend: boolean;
  spend_multiplier: number;
  global_campaign_filter: string[];
  fixed_date_start?: string;
  fixed_date_end?: string;
  refresh_interval?: number; // Minutes
  disable_ai?: boolean;
  disable_creative_tags?: boolean;
  hide_account_name?: boolean;
  enable_report_preview?: boolean;
  theme?: Theme;
}

// --- META ADS CLONE TYPES ---

// 1. DRAFTS
export interface AdEntityDraft {
  id?: string; // If editing existing
  draft_id: string; // UUID for local draft
  level: 'CAMPAIGN' | 'ADSET' | 'AD';
  account_id: string;
  payload: Partial<Campaign> | Partial<AdSet> | Partial<Ad>;
  status: 'DRAFT' | 'PUBLISHING' | 'ERROR' | 'PUBLISHED';
  error_message?: string;
  updated_at: number;
}

// 2. ENUMS & CONSTANTS
export type Objective =
  | 'OUTCOME_TRAFFIC'
  | 'OUTCOME_LEADS'
  | 'OUTCOME_SALES'
  | 'OUTCOME_AWARENESS'
  | 'OUTCOME_ENGAGEMENT'
  | 'OUTCOME_APP_PROMOTION';

export type BillingEvent = 'IMPRESSIONS' | 'LINK_CLICKS' | 'PURCHASE';
export type OptimizationGoal =
  | 'REACH'
  | 'LINK_CLICKS'
  | 'OFFSITE_CONVERSIONS'
  | 'IMPRESSIONS'
  | 'LEAD_GENERATION'
  | 'LANDING_PAGE_VIEWS';

export type CallToAction =
  | 'LEARN_MORE'
  | 'SHOP_NOW'
  | 'SIGN_UP'
  | 'CONTACT_US'
  | 'APPLY_NOW'
  | 'BOOK_NOW'
  | 'DOWNLOAD';

// 3. TARGETING EXPANSION
export interface GeoLocation {
  country_code: string;
  name: string;
  key: string;
  type: 'country' | 'region' | 'city';
  supports_region?: boolean;
  supports_city?: boolean;
}

export interface TargetingOption {
  id: string;
  name: string;
  type: 'interests' | 'behaviors' | 'demographics' | 'life_events' | 'industries';
  path?: string[]; // Breadcrumbs for hierarchy
  audience_size_lower_bound?: number;
  audience_size_upper_bound?: number;
}

export interface TargetingSpec extends Targeting {
  // Enhanced version of existing Targeting interface
  geo_locations: {
    countries?: string[];
    regions?: Array<{ key: string; name: string; country: string }>; // Added country to match base type
    cities?: Array<{ key: string; name: string; radius: number; distance_unit: 'mile' | 'kilometer' }>;
    location_types?: Array<'home' | 'recent' | 'travel_in'>;
  };
  excluded_geo_locations?: {
    countries?: string[];
    regions?: Array<{ key: string; name: string; country: string }>; // Added country
    cities?: Array<{ key: string; name: string; radius: number; distance_unit: 'mile' | 'kilometer' }>;
  };
  flexible_spec?: Array<{
    interests?: Array<{ id: string; name: string }>;
    behaviors?: Array<{ id: string; name: string }>;
    life_events?: Array<{ id: string; name: string }>;
    industries?: Array<{ id: string; name: string }>;
    family_statuses?: Array<{ id: string; name: string }>;
  }>;
  exclusions?: {
    interests?: Array<{ id: string; name: string }>;
    behaviors?: Array<{ id: string; name: string }>;
  };
  age_min: number;
  age_max: number;
  genders: number[]; // [1] or [2] or [1,2]
  locales?: number[];
  device_platforms?: Array<'mobile' | 'desktop'>;
  publisher_platforms?: Array<'facebook' | 'instagram' | 'audience_network' | 'messenger'>;
  facebook_positions?: string[];
  instagram_positions?: string[];
}

// 4. CREATIVE BUILDER
export interface CreativeAsset {
  id: string;
  hash: string;
  url: string; // url for preview (temporary blob or remote)
  type: 'IMAGE' | 'VIDEO';
  name?: string;
  permalink_url?: string; // for videos
}

export interface AdCreativeObjectStorySpec {
  page_id: string;
  instagram_actor_id?: string;
  link_data?: {
    link: string;
    message: string; // Primary Text
    name?: string; // Headline
    description?: string; // Link Description
    attachment_style?: 'link';
    call_to_action?: {
      type: CallToAction;
      value: { link: string; link_caption?: string };
    };
    image_hash?: string;
    picture?: string; // URL
  };
  video_data?: {
    video_id: string;
    image_url?: string; // Thumbnail
    call_to_action?: {
      type: CallToAction;
      value: { link: string; link_caption?: string };
    };
    title?: string;
    message?: string;
  };
}

// --- HIERARCHICAL DATA STRUCTURES ---

export interface HierarchicalAd extends Ad {
  insights?: InsightData; // Ad Level Insights
}

export interface HierarchicalAdSet extends AdSet {
  ads: HierarchicalAd[];
  insights?: InsightData; // AdSet Level Insights
}

export interface HierarchicalCampaign extends Campaign {
  adSets: HierarchicalAdSet[];
  insights?: InsightData; // Campaign Level Insights
}

export interface HierarchicalAccount extends AdAccount {
  campaigns: HierarchicalCampaign[];
  insights?: InsightData; // Account Level Insights
}

