import React from 'react';
import { Campaign } from '../../../../types';
import { useAdsManager } from '../../context/AdsManagerContext';

interface CampaignEditorProps {
    data: Partial<Campaign>;
    onChange: (updates: Partial<Campaign>) => void;
}

export const CampaignEditor: React.FC<CampaignEditorProps> = ({ data, onChange }) => {
    const { theme } = useAdsManager();
    const isDark = theme === 'dark';

    const labelClass = isDark ? 'text-slate-400' : 'text-slate-500';
    const inputClass = isDark
        ? 'bg-slate-900 border-slate-700 text-white focus:border-blue-500'
        : 'bg-white border-slate-200 text-slate-900 focus:border-blue-500 shadow-sm';
    const cardClass = isDark ? 'bg-slate-800/30 border-slate-700' : 'bg-white border-slate-200 shadow-sm';

    return (
        <div className="space-y-6">
            {/* NAME */}
            <div className="space-y-2">
                <label className={`text-xs font-bold uppercase tracking-wider ${labelClass}`}>Campaign Name</label>
                <input
                    type="text"
                    value={data.name || ''}
                    onChange={(e) => onChange({ name: e.target.value })}
                    className={`w-full border rounded-lg p-2.5 outline-none transition-colors ${inputClass}`}
                    placeholder="Enter campaign name"
                />
            </div>

            {/* STATUS */}
            <div className="space-y-2">
                <label className={`text-xs font-bold uppercase tracking-wider ${labelClass}`}>Status</label>
                <select
                    value={data.status || 'PAUSED'}
                    onChange={(e) => onChange({ status: e.target.value })}
                    className={`w-full border rounded-lg p-2.5 outline-none transition-colors ${inputClass}`}
                >
                    <option value="ACTIVE">Active</option>
                    <option value="PAUSED">Paused</option>
                    <option value="ARCHIVED">Archived</option>
                </select>
            </div>

            {/* OBJECTIVE */}
            <div className="space-y-2">
                <label className={`text-xs font-bold uppercase tracking-wider ${labelClass}`}>Objective</label>
                <select
                    value={data.objective || 'OUTCOME_TRAFFIC'}
                    onChange={(e) => onChange({ objective: e.target.value })}
                    className={`w-full border rounded-lg p-2.5 outline-none transition-colors ${inputClass}`}
                >
                    <option value="OUTCOME_TRAFFIC">Traffic</option>
                    <option value="OUTCOME_SALES">Sales</option>
                    <option value="OUTCOME_LEADS">Leads</option>
                    <option value="OUTCOME_ENGAGEMENT">Engagement</option>
                    <option value="OUTCOME_AWARENESS">Awareness</option>
                    <option value="OUTCOME_APP_PROMOTION">App Promotion</option>
                </select>
            </div>

            {/* SPECIAL CATEGORIES */}
            <div className={`p-4 rounded-lg border flex items-start gap-3 transition-colors ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <input type="checkbox" className="mt-1" />
                <div>
                    <h4 className={`text-sm font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Special Ad Categories</h4>
                    <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                        Ads for credit, employment, housing, or social issues, elections or politics.
                    </p>
                </div>
            </div>

            {/* BUDGET */}
            <div className="space-y-3">
                <label className={`text-xs font-bold uppercase tracking-wider ${labelClass}`}>Advantage+ Campaign Budget</label>
                <div className="flex items-center gap-3">
                    <select
                        className={`border rounded-lg p-2.5 text-sm outline-none transition-colors ${inputClass}`}
                        onChange={(e) => {
                            if (e.target.value === 'daily') {
                                onChange({ daily_budget: '2000', lifetime_budget: undefined });
                            } else {
                                onChange({ lifetime_budget: '50000', daily_budget: undefined });
                            }
                        }}
                    >
                        <option value="daily">Daily Budget</option>
                        <option value="lifetime">Lifetime Budget</option>
                    </select>
                    <input
                        type="number"
                        placeholder="Amount"
                        value={data.daily_budget ? parseInt(data.daily_budget) / 100 : (data.lifetime_budget ? parseInt(data.lifetime_budget) / 100 : '')}
                        onChange={(e) => {
                            const val = (parseFloat(e.target.value) * 100).toString();
                            if (data.daily_budget !== undefined) onChange({ daily_budget: val });
                            else onChange({ lifetime_budget: val });
                        }}
                        className={`flex-1 border rounded-lg p-2.5 outline-none transition-colors ${inputClass}`}
                    />
                </div>
            </div>
        </div>
    );
};
