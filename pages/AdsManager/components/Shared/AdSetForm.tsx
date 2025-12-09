import React, { useState, useEffect } from 'react';
import { AdSet } from '../../../../types';
import { searchInterests, searchLocations, fetchReachEstimate } from '../../../../services/metaTargeting';
import { useAdsManager } from '../../context/AdsManagerContext';

interface AdSetFormProps {
    data: Partial<AdSet>;
    onChange: (updates: Partial<AdSet>) => void;
    token: string;
    accountId: string;
    onReachUpdate?: (reach: { users: number; bid_estimate?: any }) => void;
}

export const AdSetForm: React.FC<AdSetFormProps> = ({ data, onChange, token, accountId, onReachUpdate }) => {
    const { theme } = useAdsManager();
    const isDark = theme === 'dark';

    const [interestQuery, setInterestQuery] = useState('');
    const [locationQuery, setLocationQuery] = useState('');
    const [interestSuggestions, setInterestSuggestions] = useState<any[]>([]);
    const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
    const [estimating, setEstimating] = useState(false);

    // Default targeting structure
    const targeting = data.targeting || {
        geo_locations: { countries: ['US'] },
        interests: [],
        age_min: 18,
        age_max: 65,
        genders: [1, 2],
        publisher_platforms: ['facebook', 'instagram', 'audience_network', 'messenger'],
        facebook_positions: ['feed'],
    };

    // ... Search and Estimation Effects (Identical logic) ...
    useEffect(() => {
        const timeout = setTimeout(async () => {
            if (interestQuery.length > 2) {
                const results = await searchInterests(interestQuery, token);
                setInterestSuggestions(results);
            } else { setInterestSuggestions([]); }
        }, 500);
        return () => clearTimeout(timeout);
    }, [interestQuery, token]);

    useEffect(() => {
        const timeout = setTimeout(async () => {
            if (locationQuery.length > 2) {
                const results = await searchLocations(locationQuery, ['city', 'country', 'region', 'zip'], token);
                setLocationSuggestions(results);
            } else { setLocationSuggestions([]); }
        }, 500);
        return () => clearTimeout(timeout);
    }, [locationQuery, token]);

    useEffect(() => {
        const timeout = setTimeout(async () => {
            if (accountId && token) {
                setEstimating(true);
                const apiSpec = {
                    geo_locations: targeting.geo_locations,
                    interests: targeting.interests?.map((i: any) => ({ id: i.id, name: i.name })),
                    age_min: targeting.age_min,
                    age_max: targeting.age_max,
                    genders: targeting.genders,
                    publisher_platforms: data.targeting?.publisher_platforms,
                };
                const result = await fetchReachEstimate(accountId, apiSpec, data.optimization_goal || 'REACH', token);
                if (onReachUpdate) onReachUpdate(result);
                setEstimating(false);
            }
        }, 1000);
        return () => clearTimeout(timeout);
    }, [targeting, data.optimization_goal, accountId, token]);

    // Handlers
    const addInterest = (interest: any) => {
        const currentInterests = targeting.interests || [];
        if (currentInterests.find((i: any) => i.id === interest.id)) return;
        onChange({ targeting: { ...targeting, interests: [...currentInterests, { id: interest.id, name: interest.name }] } });
        setInterestQuery(''); setInterestSuggestions([]);
    };
    const removeInterest = (id: string) => onChange({ targeting: { ...targeting, interests: targeting.interests?.filter((i: any) => i.id !== id) } });

    const addLocation = (loc: any) => {
        let newGeo = { ...targeting.geo_locations };
        const currentCountries = targeting.geo_locations?.countries || [];
        const currentCities = targeting.geo_locations?.cities || [];
        if (loc.type === 'country' && !currentCountries.includes(loc.id)) newGeo.countries = [...currentCountries, loc.id];
        else if (loc.type === 'city') newGeo.cities = [...currentCities, { key: loc.id, name: loc.name, distance_unit: 'mile', radius: 25 }];
        onChange({ targeting: { ...targeting, geo_locations: newGeo } });
        setLocationQuery(''); setLocationSuggestions([]);
    };

    // Shared Styles
    const cardClass = isDark ? 'bg-slate-800/30 border-slate-700' : 'bg-white border-slate-200 shadow-sm';
    const headerClass = isDark ? 'text-white border-slate-700' : 'text-slate-900 border-slate-100';
    const labelClass = isDark ? 'text-slate-400' : 'text-slate-500';
    const inputClass = isDark
        ? 'bg-slate-900 border-slate-700 text-white focus:border-blue-500'
        : 'bg-white border-slate-200 text-slate-900 focus:border-blue-500 shadow-sm';
    const dropdownClass = isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-xl';
    const dropdownItemClass = isDark ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-50';

    return (
        <div className="space-y-6">
            {/* 1. IDENTITY & SCHEDULE */}
            <div className={`p-5 rounded-xl border space-y-5 ${cardClass}`}>
                <h3 className={`font-semibold border-b pb-3 ${headerClass}`}>Identity & Schedule</h3>
                <div className="space-y-2">
                    <label className={`text-xs font-bold uppercase tracking-wider ${labelClass}`}>Ad Set Name</label>
                    <input className={`w-full border rounded-lg p-2.5 outline-none transition-all ${inputClass}`}
                        value={data.name || ''}
                        onChange={e => onChange({ name: e.target.value })}
                        placeholder="Ad Set Name"
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className={`text-xs font-bold uppercase tracking-wider mb-2 block ${labelClass}`}>Start Date</label>
                        <input type="datetime-local" className={`w-full border rounded-lg p-2.5 text-xs outline-none ${inputClass}`}
                            value={data.start_time ? data.start_time.substring(0, 16) : ''}
                            onChange={e => onChange({ start_time: new Date(e.target.value).toISOString() })} />
                    </div>
                    <div>
                        <label className={`text-xs font-bold uppercase tracking-wider mb-2 block ${labelClass}`}>End Date</label>
                        <input type="datetime-local" className={`w-full border rounded-lg p-2.5 text-xs outline-none ${inputClass}`}
                            value={data.end_time ? data.end_time.substring(0, 16) : ''}
                            onChange={e => onChange({ end_time: new Date(e.target.value).toISOString() })} />
                    </div>
                </div>
            </div>

            {/* 2. AUDIENCE */}
            <div className={`p-5 rounded-xl border space-y-5 ${cardClass}`}>
                <h3 className={`font-semibold border-b pb-3 ${headerClass}`}>Audience</h3>

                {/* LOCATIONS */}
                <div className="space-y-2 relative">
                    <label className={`text-xs font-bold uppercase tracking-wider ${labelClass}`}>Locations</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                        {targeting.geo_locations?.countries?.map((c: string) => (
                            <span key={c} className="bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-200 px-2 py-1 rounded text-xs font-medium border border-blue-200 dark:border-blue-800">{c}</span>
                        ))}
                        {targeting.geo_locations?.cities?.map((c: any) => (
                            <span key={c.key} className="bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-200 px-2 py-1 rounded text-xs font-medium border border-blue-200 dark:border-blue-800">{c.name}</span>
                        ))}
                    </div>
                    <input type="text" className={`w-full border rounded-lg p-2.5 text-sm outline-none ${inputClass}`}
                        placeholder="Search locations..."
                        value={locationQuery} onChange={e => setLocationQuery(e.target.value)} />
                    {locationSuggestions.length > 0 && (
                        <div className={`absolute z-20 w-full mt-1 rounded-lg border max-h-48 overflow-y-auto ${dropdownClass}`}>
                            {locationSuggestions.map(loc => (
                                <button key={loc.id} onClick={() => addLocation(loc)} className={`w-full text-left px-3 py-2 text-sm transition-colors ${dropdownItemClass}`}>
                                    {loc.name} <span className="opacity-50 text-xs ml-1">({loc.type})</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* AGE & GENDER */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className={`text-xs font-bold uppercase tracking-wider ${labelClass}`}>Age</label>
                        <div className="flex items-center gap-2 mt-1">
                            <input type="number" min="13" max="65" className={`w-full border rounded-lg p-2.5 outline-none ${inputClass}`}
                                value={targeting.age_min || 18}
                                onChange={e => onChange({ targeting: { ...targeting, age_min: parseInt(e.target.value) } })} />
                            <span className={labelClass}>-</span>
                            <input type="number" min="13" max="65" className={`w-full border rounded-lg p-2.5 outline-none ${inputClass}`}
                                value={targeting.age_max || 65}
                                onChange={e => onChange({ targeting: { ...targeting, age_max: parseInt(e.target.value) } })} />
                        </div>
                    </div>
                    <div>
                        <label className={`text-xs font-bold uppercase tracking-wider ${labelClass}`}>Gender</label>
                        <select className={`w-full border rounded-lg p-2.5 mt-1 outline-none ${inputClass}`}
                            value={targeting.genders?.[0] || '0'}
                            onChange={e => {
                                const val = e.target.value;
                                onChange({ targeting: { ...targeting, genders: val === '0' ? undefined : [parseInt(val)] } });
                            }}>
                            <option value="0">All</option>
                            <option value="1">Men</option>
                            <option value="2">Women</option>
                        </select>
                    </div>
                </div>

                {/* DETAILED TARGETING */}
                <div className="space-y-2 relative">
                    <label className={`text-xs font-bold uppercase tracking-wider ${labelClass}`}>Detailed Targeting</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                        {targeting.interests?.map((i: any) => (
                            <span key={i.id} className="bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-200 px-2 py-1 rounded text-xs font-medium border border-purple-200 dark:border-purple-500/30 flex items-center gap-1.5">
                                {i.name}
                                <button onClick={() => removeInterest(i.id)} className="hover:text-purple-900 dark:hover:text-white transition-colors">×</button>
                            </span>
                        ))}
                    </div>
                    <input type="text" className={`w-full border rounded-lg p-2.5 text-sm outline-none ${inputClass}`}
                        placeholder="Add interests, demographics..."
                        value={interestQuery} onChange={e => setInterestQuery(e.target.value)} />
                    {interestSuggestions.length > 0 && (
                        <div className={`absolute z-20 w-full mt-1 rounded-lg border max-h-60 overflow-y-auto ${dropdownClass}`}>
                            {interestSuggestions.map(item => (
                                <button key={item.id} onClick={() => addInterest(item)} className={`w-full text-left px-3 py-2 text-sm flex justify-between group transition-colors ${dropdownItemClass}`}>
                                    <span>{item.name}</span>
                                    <span className="opacity-50 text-xs">{(item.audience_size / 1000000).toFixed(1)}M</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* 3. PLACEMENTS */}
            <div className={`p-5 rounded-xl border space-y-5 ${cardClass}`}>
                <h3 className={`font-semibold border-b pb-3 ${headerClass}`}>Placements</h3>

                <div className="space-y-3">
                    <label className={`flex items-start gap-3 cursor-pointer p-3 rounded-lg border transition-all ${!data.targeting?.publisher_platforms
                        ? (isDark ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200')
                        : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}>
                        <input type="radio"
                            name="placements"
                            checked={!data.targeting?.publisher_platforms}
                            onChange={() => onChange({ targeting: { ...targeting, publisher_platforms: undefined } })}
                            className="mt-1 text-blue-600" />
                        <div>
                            <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Advantage+ placements</p>
                            <p className={`text-xs mt-0.5 ${labelClass}`}>Maximize budget by letting Meta find the best placements.</p>
                        </div>
                    </label>

                    <label className={`flex items-start gap-3 cursor-pointer p-3 rounded-lg border transition-all ${!!data.targeting?.publisher_platforms
                        ? (isDark ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200')
                        : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}>
                        <input type="radio"
                            name="placements"
                            checked={!!data.targeting?.publisher_platforms}
                            onChange={() => onChange({ targeting: { ...targeting, publisher_platforms: ['facebook', 'instagram'] } })}
                            className="mt-1 text-blue-600" />
                        <div>
                            <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Manual placements</p>
                            <p className={`text-xs mt-0.5 ${labelClass}`}>Manually Choose the places to show your ad.</p>
                        </div>
                    </label>
                </div>

                {!!data.targeting?.publisher_platforms && (
                    <div className="ml-8 space-y-2 animate-in fade-in slide-in-from-top-2">
                        <div className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${labelClass}`}>Platforms</div>
                        {['facebook', 'instagram', 'audience_network', 'messenger'].map(platform => (
                            <label key={platform} className="flex items-center gap-2 group cursor-pointer">
                                <input type="checkbox"
                                    checked={data.targeting?.publisher_platforms?.includes(platform)}
                                    onChange={e => {
                                        const current = data.targeting?.publisher_platforms || [];
                                        const updated = e.target.checked
                                            ? [...current, platform]
                                            : current.filter(p => p !== platform);
                                        onChange({ targeting: { ...targeting, publisher_platforms: updated } });
                                    }}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className={`text-sm capitalize transition-colors ${isDark ? 'text-slate-300 group-hover:text-white' : 'text-slate-700 group-hover:text-slate-900'}`}>{platform.replace('_', ' ')}</span>
                            </label>
                        ))}
                    </div>
                )}
            </div>

            {/* 4. OPTIMIZATION */}
            <div className={`p-5 rounded-xl border space-y-5 ${cardClass}`}>
                <h3 className={`font-semibold border-b pb-3 ${headerClass}`}>Optimization & Delivery</h3>
                <div className="space-y-2">
                    <label className={`text-xs font-bold uppercase tracking-wider ${labelClass}`}>Optimization Goal</label>
                    <select className={`w-full border rounded-lg p-2.5 outline-none ${inputClass}`}
                        value={data.optimization_goal || 'REACH'}
                        onChange={e => onChange({ optimization_goal: e.target.value })}>
                        <option value="REACH">Reach</option>
                        <option value="IMPRESSIONS">Impressions</option>
                        <option value="LINK_CLICKS">Link Clicks</option>
                        <option value="LANDING_PAGE_VIEWS">Landing Page Views</option>
                        <option value="CONVERSIONS">Conversions</option>
                    </select>
                </div>
                <div className="space-y-2">
                    <label className={`text-xs font-bold uppercase tracking-wider ${labelClass}`}>Bid Strategy</label>
                    <select className={`w-full border rounded-lg p-2.5 outline-none ${inputClass}`}
                        value={data.bid_strategy || 'LOWEST_COST_WITHOUT_CAP'}
                        onChange={e => onChange({ bid_strategy: e.target.value })}>
                        <option value="LOWEST_COST_WITHOUT_CAP">Highest Volume (Lowest Cost)</option>
                        <option value="COST_CAP">Cost per Result Goal</option>
                        <option value="BID_CAP">Bid Cap</option>
                    </select>
                </div>
                {data.bid_strategy && data.bid_strategy !== 'LOWEST_COST_WITHOUT_CAP' && (
                    <div className="space-y-2">
                        <label className={`text-xs font-bold uppercase tracking-wider ${labelClass}`}>Control Amount</label>
                        <input type="number"
                            className={`w-full border rounded-lg p-2.5 outline-none ${inputClass}`}
                            placeholder="Enter amount (cents)"
                            value={data.bid_amount || ''}
                            onChange={e => onChange({ bid_amount: e.target.value })}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};
