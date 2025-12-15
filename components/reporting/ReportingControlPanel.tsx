import React from 'react';
import { Type, Calendar, Filter, Lock, Users, ChevronDown } from 'lucide-react';
import { DateSelection, GlobalFilter, Theme, UserConfig, AccountHierarchy } from '../../types';

import { PROFILE_CONFIG } from '../../constants/profileConfig';

interface ReportingControlPanelProps {
    title: string;
    onTitleChange: (val: string) => void;
    subtitle: string;
    onSubtitleChange: (val: string) => void;
    dateSelection: DateSelection;
    onDateChange: (val: DateSelection) => void;
    filter: GlobalFilter;
    onFilterChange: (val: GlobalFilter) => void;
    selectedProfile: string;
    onProfileChange: (val: string) => void;
    hierarchy: AccountHierarchy;
    theme: Theme;
    userConfig?: UserConfig;
}

export const ReportingControlPanel: React.FC<ReportingControlPanelProps> = ({
    title, onTitleChange,
    subtitle, onSubtitleChange,
    dateSelection, onDateChange,
    filter, onFilterChange,
    selectedProfile, onProfileChange,
    hierarchy, theme, userConfig
}) => {
    const isDark = theme === 'dark';

    // Access Control Logic
    const isDateLocked = !!(userConfig?.fixed_date_start && userConfig?.fixed_date_end);
    const isFilterLocked = !!(userConfig?.global_campaign_filter && userConfig.global_campaign_filter.length > 0);

    // Profile Logic
    const allowedProfiles = userConfig?.allowed_profiles && userConfig.allowed_profiles.length > 0
        ? userConfig.allowed_profiles
        : ['sales', 'engagement', 'leads', 'messenger'];
    const isProfileLocked = allowedProfiles.length === 1;

    return (
        <div className={`rounded-xl border shadow-sm p-4 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            {/* Main Layout: Vertical Stack for Sidebar Optimization */}
            <div className="flex flex-col space-y-6">

                {/* 1. Report Configuration Inputs */}
                <div className="w-full space-y-4">
                    <div className="flex items-center space-x-2 mb-2">
                        <div className={`w-1 h-4 rounded-full ${isDark ? 'bg-brand-500' : 'bg-brand-600'}`}></div>
                        <label className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            Report Configuration
                        </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Profile Selector */}
                        <div className="space-y-1.5">
                            <label className={`text-[10px] uppercase font-bold tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                Profile
                            </label>
                            <div className="relative group w-full">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Users size={14} className="text-slate-400" />
                                </div>
                                <select
                                    value={selectedProfile}
                                    onChange={(e) => !isProfileLocked && onProfileChange(e.target.value)}
                                    disabled={isProfileLocked}
                                    className={`block w-full pl-9 pr-8 py-2.5 rounded-xl text-sm font-medium border appearance-none outline-none transition-all
                                        ${isDark
                                            ? 'bg-slate-950 border-slate-800 text-white focus:border-brand-500 focus:bg-slate-900'
                                            : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-brand-500 focus:bg-white'}
                                        ${isProfileLocked ? 'opacity-75 cursor-not-allowed' : 'cursor-pointer hover:border-brand-400/50'}
                                    `}
                                >
                                    {Object.entries(PROFILE_CONFIG).map(([key, config]) => {
                                        if (!allowedProfiles.includes(key)) return null;
                                        return (
                                            <option key={key} value={key}>
                                                {config.label}
                                            </option>
                                        );
                                    })}
                                </select>
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                                    {isProfileLocked ? <Lock size={12} className="text-amber-500" /> : <ChevronDown size={14} />}
                                </div>
                            </div>
                        </div>

                        {/* Title Input */}
                        <div className="space-y-1.5">
                            <label className={`text-[10px] uppercase font-bold tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                Report Title
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Type size={14} className="text-slate-400" />
                                </div>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => onTitleChange(e.target.value)}
                                    placeholder="Report Title"
                                    className={`block w-full pl-9 pr-3 py-2.5 rounded-xl text-sm font-medium border outline-none transition-all focus:ring-2 focus:ring-brand-500/20
                                        ${isDark
                                            ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-600 focus:border-brand-500 focus:bg-slate-900'
                                            : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:bg-white'}
                                    `}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Subtitle Input */}
                    <div className="space-y-1.5">
                        <label className={`text-[10px] uppercase font-bold tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                            Report Subtitle
                        </label>
                        <textarea
                            value={subtitle}
                            onChange={(e) => onSubtitleChange(e.target.value)}
                            placeholder="Optional descriptive subtitle..."
                            rows={2}
                            className={`block w-full px-4 py-2.5 rounded-xl text-sm font-medium border outline-none transition-all resize-none focus:ring-2 focus:ring-brand-500/20
                                ${isDark
                                    ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-600 focus:border-brand-500 focus:bg-slate-900'
                                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:bg-white'}
                            `}
                        />
                    </div>
                </div>

                {/* 2. Global Context Indicator (Vertical Stack Version) */}
                <div className="w-full pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center space-x-2 mb-3">
                        <div className={`w-1 h-4 rounded-full ${isDark ? 'bg-indigo-500' : 'bg-indigo-600'}`}></div>
                        <label className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            Data Context
                        </label>
                    </div>

                    <div className={`relative w-full rounded-xl overflow-hidden border transition-all duration-300
                        ${isDark
                            ? 'bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800 border-slate-700'
                            : 'bg-gradient-to-r from-slate-50 via-white to-slate-50 border-slate-200'}
                    `}>
                        <div className="flex items-stretch">
                            {/* Icon Section (The "Flag" pole) */}
                            <div className={`w-12 flex items-center justify-center border-r
                                ${isDark ? 'bg-slate-800/50 border-slate-800' : 'bg-slate-100/50 border-slate-200'}
                            `}>
                                <div className={`p-1.5 rounded-md ${isDark ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                                    <Filter size={16} />
                                </div>
                            </div>

                            {/* Content Section (The Message) */}
                            <div className="flex-1 p-3">
                                <div className="flex items-center justify-between mb-1">
                                    <h4 className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                                        Global Context
                                    </h4>
                                    <div className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide
                                        ${isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-100 text-emerald-600'}
                                    `}>
                                        CHANGEABLE FROM THE HEADER
                                    </div>
                                </div>
                                <p className={`text-[10px] leading-tight ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                                    Report is using the <span className={`font-semibold ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>Global Settings</span> for Date Rng & Filters in the header.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {(isDateLocked || isFilterLocked || isProfileLocked) && (
                <div className={`mt-3 pt-3 border-t text-[10px] flex items-center ${isDark ? 'border-slate-800 text-slate-500' : 'border-slate-100 text-slate-400'}`}>
                    <Lock size={10} className="mr-1.5" />
                    Some controls are locked by your organization's administrative policies.
                </div>
            )}
        </div>
    );
};
