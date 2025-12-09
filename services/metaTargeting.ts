
const GRAPH_API_VERSION = 'v20.0';
const BASE_URL = 'https://graph.facebook.com';

export interface TargetingResult {
    id: string;
    name: string;
    type?: string;
    path?: string[]; // For locations
    audience_size?: number;
}

export const searchInterests = async (query: string, token: string): Promise<TargetingResult[]> => {
    if (!query || query.length < 2) return [];
    try {
        const response = await fetch(
            `${BASE_URL}/${GRAPH_API_VERSION}/search?type=adinterest&q=${encodeURIComponent(query)}&limit=20&access_token=${token}`
        );
        const data = await response.json();
        return (data.data || []).map((item: any) => ({
            id: item.id,
            name: item.name,
            type: 'interest',
            audience_size: item.audience_size
        }));
    } catch (e) {
        console.error("Interest search error", e);
        return [];
    }
};

export const searchLocations = async (query: string, types: string[] = ['country', 'region', 'city', 'zip'], token: string): Promise<TargetingResult[]> => {
    if (!query || query.length < 2) return [];
    try {
        // Meta API format for location_types is a stringified array, e.g. "['city','country']"
        const typesParam = JSON.stringify(types).replace(/"/g, "'"); // Meta often prefers single quotes in some SDKs, but JSON.stringify usually works. 
        // Let's manually construct to be safe: "['country','region','city','zip']"
        const formattedTypes = `[${types.map(t => `'${t}'`).join(',')}]`;

        const response = await fetch(
            `${BASE_URL}/${GRAPH_API_VERSION}/search?type=adgeolocation&q=${encodeURIComponent(query)}&location_types=${formattedTypes}&limit=20&access_token=${token}`
        );
        const data = await response.json();
        return (data.data || []).map((item: any) => ({
            id: item.key,
            name: item.name,
            type: item.type,
            path: item.country_name ? [item.country_name, item.region].filter(Boolean) : []
        }));
    } catch (e) {
        console.error("Location search error", e);
        return [];
    }
};

export const searchBehaviors = async (query: string, token: string): Promise<TargetingResult[]> => {
    if (!query || query.length < 2) return [];
    try {
        // Behaviors are often found via adtargetingspec searches or specific behavior endpoint.
        // Using general search type for behaviors if applicable or 'adtargetingspec'
        // Meta Docs suggest type=adinterestvalid usually, behaviors are tricky. 
        // Let's use 'adtargetingspec' to search broadly if possible, or stick to interest.
        // Actually, type=adinterest often covers many things. Let's try 'adtargetingspec' for broader scope.
        // Actually typically 'adinterests' is for interests. 'adbehaviors' isn't a direct search type.
        // Let's rely on `search?type=adtargetingspec&q=...` which returns matching interests/behaviors/demographics.
        const response = await fetch(
            `${BASE_URL}/${GRAPH_API_VERSION}/search?type=adtargetingspec&q=${encodeURIComponent(query)}&access_token=${token}`
        );
        const data = await response.json();
        return (data.data || []).map((item: any) => ({
            id: item.id,
            name: item.name,
            type: 'behavior', // Simplified
            audience_size: item.audience_size
        }));
    } catch (e) {
        console.error("Behavior search error", e);
        return [];
    }
};

export const fetchReachEstimate = async (
    adAccountId: string,
    targetingSpec: any,
    optimizationGoal: string,
    token: string
): Promise<{ users: number; bid_estimate?: any }> => {
    const formattedId = adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`;
    try {
        const payload = {
            targeting_spec: targetingSpec,
            optimization_goal: optimizationGoal,
            currency: 'USD' // Should ideally match account currency
        };

        const response = await fetch(
            `${BASE_URL}/${GRAPH_API_VERSION}/${formattedId}/reachestimate?access_token=${token}&targeting_spec=${encodeURIComponent(JSON.stringify(targetingSpec))}&optimization_goal=${optimizationGoal}`
        );
        const data = await response.json();
        if (data.data && data.data.length > 0) {
            return {
                users: data.data[0].users,
                bid_estimate: data.data[0].bid_estimate
            };
        }
        return { users: 0 };
    } catch (e) {
        console.error("Reach estimate error", e);
        return { users: 0 };
    }
};
