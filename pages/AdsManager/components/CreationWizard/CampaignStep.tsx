import React from 'react';
import { Objective } from '../../../../types';
import { Target, TrendingUp, DollarSign, Users, MousePointer, Smartphone } from 'lucide-react';
import { useAdsManager } from '../../context/AdsManagerContext';

interface CampaignStepProps {
    data: any;
    updateData: (data: any) => void;
    errors?: Record<string, string>;
}

const OBJECTIVES: Array<{ id: Objective, label: string, icon: any, desc: string }> = [
    { id: 'OUTCOME_TRAFFIC', label: 'Traffic', icon: MousePointer, desc: 'Send people to a destination, like your website, app or event.' },
    { id: 'OUTCOME_LEADS', label: 'Leads', icon: Users, desc: 'Collect leads for your business or brand.' },
    { id: 'OUTCOME_SALES', label: 'Sales', icon: DollarSign, desc: 'Find people likely to purchase your product or service.' },
    { id: 'OUTCOME_AWARENESS', label: 'Awareness', icon: Target, desc: 'Show your ads to people who are most likely to remember them.' },
    { id: 'OUTCOME_ENGAGEMENT', label: 'Engagement', icon: TrendingUp, desc: 'Get more messages, video views, post engagement, page likes or event responses.' },
    { id: 'OUTCOME_APP_PROMOTION', label: 'App Promotion', icon: Smartphone, desc: 'Find new people to install your app and continue using it.' },
];

export const CampaignStep: React.FC<CampaignStepProps> = ({ data, updateData, errors }) => {
    const { theme } = useAdsManager();
    const isDark = theme === 'dark';

    return (
        <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2">
                <label className={`block text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Campaign Name <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    value={data.name || ''}
                    onChange={(e) => updateData({ ...data, name: e.target.value })}
                    placeholder="e.g., Summer Sale 2024"
                    className={`
                        w-full border rounded-lg p-2.5 text-sm outline-none transition-all
                        ${isDark
                            ? 'bg-slate-800 border-slate-700 text-white focus:ring-1 focus:ring-blue-500'
                            : 'bg-white border-slate-200 text-slate-900 focus:ring-1 focus:ring-blue-500 shadow-sm'
                        }
                        ${errors?.name ? 'border-red-500' : ''}
                    `}
                />
                {errors?.name && <p className="text-red-400 text-xs">{errors.name}</p>}
            </div>

            <div className="space-y-3">
                <label className={`block text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Campaign Objective <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {OBJECTIVES.map((obj) => {
                        const Icon = obj.icon;
                        const isSelected = data.objective === obj.id;
                        return (
                            <button
                                key={obj.id}
                                onClick={() => updateData({ ...data, objective: obj.id })}
                                className={`
                                    relative p-3 rounded-xl border text-left transition-all hover:scale-[1.01]
                                    ${isSelected
                                        ? 'border-blue-600 bg-blue-50' + (isDark ? '/10' : '')
                                        : isDark
                                            ? 'border-slate-800 bg-slate-800/50 hover:border-slate-700'
                                            : 'border-slate-200 bg-white hover:border-slate-300 shadow-sm'
                                    }
                                `}
                            >
                                {isSelected && (
                                    <div className="absolute top-3 right-3 w-3 h-3 bg-blue-600 rounded-full flex items-center justify-center">
                                        <span className="text-white text-[8px]">✓</span>
                                    </div>
                                )}
                                <div className={`p-1.5 w-fit rounded-lg mb-2 ${isSelected
                                    ? 'bg-blue-600 text-white'
                                    : isDark
                                        ? 'bg-slate-700 text-slate-300'
                                        : 'bg-slate-100 text-slate-600'
                                    }`}>
                                    <Icon size={16} />
                                </div>
                                <h3 className={`font-semibold text-sm mb-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>{obj.label}</h3>
                                <p className={`text-[11px] leading-snug ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{obj.desc}</p>
                            </button>
                        );
                    })}
                </div>
                {errors?.objective && <p className="text-red-400 text-xs">{errors.objective}</p>}
            </div>

            <div className={`pt-4 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                <div className="flex items-center justify-between">
                    <label className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Special Ad Categories</label>
                    <select
                        className={`
                            border rounded-lg p-1.5 text-xs outline-none
                            ${isDark
                                ? 'bg-slate-800 border-slate-700 text-slate-300'
                                : 'bg-white border-slate-200 text-slate-700 shadow-sm'
                            }
                        `}
                        value={data.special_ad_categories?.[0] || 'NONE'}
                        onChange={(e) => updateData({ ...data, special_ad_categories: [e.target.value] })}
                    >
                        <option value="NONE">No Special Category</option>
                        <option value="EMPLOYMENT">Employment</option>
                        <option value="HOUSING">Housing</option>
                        <option value="CREDIT">Credit</option>
                        <option value="ISSUES_ELECTIONS_POLITICS">Social Issues, Elections or Politics</option>
                    </select>
                </div>
                <p className={`text-[10px] mt-1.5 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                    Declare if your ads are related to credit, employment, housing, or social issues.
                </p>
            </div>
        </div>
    );
};
