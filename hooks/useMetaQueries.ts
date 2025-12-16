import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import {
    fetchAccountInsights,
    fetchDailyAccountInsights,
    fetchHourlyInsights,
    fetchCampaignsWithInsights,
    fetchBreakdown,
    fetchPlacementBreakdown,
    fetchAdSetsWithInsights,
    fetchAdsWithInsights,
    fetchCreativePerformance,
    getPreviousPeriod
} from '../services/metaService';
import { DateSelection, GlobalFilter, InsightData, DailyInsight, HourlyInsight, Campaign, PaginatedResponse, AdSet, Ad } from '../types';

// Constants for Query Keys
export const QUERY_KEYS = {
    accountInsights: 'accountInsights',
    dailyInsights: 'dailyInsights',
    hourlyInsights: 'hourlyInsights',
    campaigns: 'campaigns',
    adSets: 'adSets',
    ads: 'ads',
    creativePerformance: 'creativePerformance',
    breakdown: 'breakdown',
    placement: 'placement'
};

// Hook for Main Account Insights (KPI Cards)
export const useAccountInsights = (
    accountIds: string[],
    token: string,
    dateSelection: DateSelection,
    filter: GlobalFilter,
    options?: Omit<UseQueryOptions<InsightData | null>, 'queryKey' | 'queryFn'>
) => {
    return useQuery<InsightData | null>({
        queryKey: [QUERY_KEYS.accountInsights, accountIds, dateSelection, filter],
        queryFn: () => fetchAccountInsights(accountIds, token, dateSelection, filter),
        enabled: accountIds.length > 0 && !!token,
        staleTime: 5 * 60 * 1000,
        ...options
    });
};

// Hook for Previous Period Account Insights (Trend Calculation)
export const usePreviousAccountInsights = (
    accountIds: string[],
    token: string,
    dateSelection: DateSelection,
    filter: GlobalFilter,
    options?: Omit<UseQueryOptions<InsightData | null>, 'queryKey' | 'queryFn'>
) => {
    const prevRange = getPreviousPeriod(dateSelection);
    return useQuery<InsightData | null>({
        queryKey: [QUERY_KEYS.accountInsights, 'previous', accountIds, dateSelection, filter],
        queryFn: () => {
            if (!prevRange) return Promise.resolve(null);
            return fetchAccountInsights(accountIds, token, prevRange, filter);
        },
        enabled: accountIds.length > 0 && !!token && !!prevRange,
        staleTime: 5 * 60 * 1000,
        ...options
    });
};

// Hook for Daily Insights (Main Chart)
export const useDailyAccountInsights = (
    accountIds: string[],
    token: string,
    dateSelection: DateSelection,
    filter: GlobalFilter,
    options?: Omit<UseQueryOptions<DailyInsight[]>, 'queryKey' | 'queryFn'>
) => {
    return useQuery<DailyInsight[]>({
        queryKey: [QUERY_KEYS.dailyInsights, accountIds, dateSelection, filter],
        queryFn: () => fetchDailyAccountInsights(accountIds, token, dateSelection, filter),
        enabled: accountIds.length > 0 && !!token,
        staleTime: 5 * 60 * 1000,
        ...options
    });
};

// Hook for Hourly Insights (Heatmap)
export const useHourlyInsights = (
    accountIds: string[],
    token: string,
    dateSelection: DateSelection,
    filter: GlobalFilter,
    options?: Omit<UseQueryOptions<HourlyInsight[]>, 'queryKey' | 'queryFn'>
) => {
    return useQuery<HourlyInsight[]>({
        queryKey: [QUERY_KEYS.hourlyInsights, accountIds, dateSelection, filter],
        queryFn: () => fetchHourlyInsights(accountIds, token, dateSelection, filter),
        enabled: accountIds.length > 0 && !!token,
        staleTime: 5 * 60 * 1000,
        ...options
    });
};

// Hook for Campaigns List
export const useCampaignsWithInsights = (
    accountIds: string[],
    token: string,
    dateSelection: DateSelection,
    filter: GlobalFilter,
    options?: Omit<UseQueryOptions<PaginatedResponse<Campaign>>, 'queryKey' | 'queryFn'>
) => {
    return useQuery<PaginatedResponse<Campaign>>({
        queryKey: [QUERY_KEYS.campaigns, accountIds, dateSelection, filter],
        queryFn: () => fetchCampaignsWithInsights(accountIds, token, dateSelection, filter),
        enabled: accountIds.length > 0 && !!token,
        staleTime: 5 * 60 * 1000,
        ...options
    });
};

// Generic Hook for Breakdowns (Age, Gender, Region)
export const useBreakdown = (
    accountIds: string[],
    token: string,
    dateSelection: DateSelection,
    breakdownType: 'age,gender' | 'publisher_platform' | 'device_platform' | 'region',
    filter: GlobalFilter,
    options?: Omit<UseQueryOptions<any[]>, 'queryKey' | 'queryFn'>
) => {
    return useQuery<any[]>({
        queryKey: [QUERY_KEYS.breakdown, breakdownType, accountIds, dateSelection, filter],
        queryFn: () => fetchBreakdown(accountIds, token, dateSelection, breakdownType, filter),
        enabled: accountIds.length > 0 && !!token,
        staleTime: 5 * 60 * 1000,
        ...options
    });
};

// Hook for Placement Breakdown
export const usePlacementBreakdown = (
    accountIds: string[],
    token: string,
    dateSelection: DateSelection,
    filter: GlobalFilter,
    options?: Omit<UseQueryOptions<any[]>, 'queryKey' | 'queryFn'>
) => {
    return useQuery<any[]>({
        queryKey: [QUERY_KEYS.placement, accountIds, dateSelection, filter],
        queryFn: () => fetchPlacementBreakdown(accountIds, token, dateSelection, filter),
        enabled: accountIds.length > 0 && !!token,
        staleTime: 5 * 60 * 1000,
        ...options
    });
};

// Hook for AdSets (Used in AI Audit usually, but good to have)
export const useAdSetsWithInsights = (
    accountIds: string[],
    token: string,
    dateSelection: DateSelection,
    filter: GlobalFilter,
    parentId?: string,
    options?: Omit<UseQueryOptions<PaginatedResponse<AdSet>>, 'queryKey' | 'queryFn'>
) => {
    return useQuery<PaginatedResponse<AdSet>>({
        queryKey: [QUERY_KEYS.adSets, accountIds, dateSelection, filter, parentId],
        queryFn: () => fetchAdSetsWithInsights(accountIds, token, dateSelection, filter, parentId),
        enabled: accountIds.length > 0 && !!token,
        ...options
    });
};

// Hook for Ads (Used in AI Audit usually)
export const useAdsWithInsights = (
    accountIds: string[],
    token: string,
    dateSelection: DateSelection,
    filter: GlobalFilter,
    parentId?: string,
    options?: Omit<UseQueryOptions<PaginatedResponse<Ad>>, 'queryKey' | 'queryFn'>
) => {
    return useQuery<PaginatedResponse<Ad>>({
        queryKey: [QUERY_KEYS.ads, accountIds, dateSelection, filter, parentId],
        queryFn: () => fetchAdsWithInsights(accountIds, token, dateSelection, filter, parentId),
        enabled: accountIds.length > 0 && !!token,
        ...options
    });
};

export const useCreativePerformance = (
    accountIds: string[],
    token: string,
    dateSelection: DateSelection,
    filter: GlobalFilter | undefined,
    options?: Omit<UseQueryOptions<any[], Error>, 'queryKey' | 'queryFn'>
) => {
    return useQuery({
        queryKey: [QUERY_KEYS.creativePerformance, accountIds, dateSelection, filter],
        queryFn: () => fetchCreativePerformance(accountIds, token, dateSelection, filter),
        enabled: accountIds.length > 0 && !!token,
        staleTime: 5 * 60 * 1000, // 5 minutes
        ...options
    });
};
