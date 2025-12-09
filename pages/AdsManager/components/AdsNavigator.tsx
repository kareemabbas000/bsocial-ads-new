import React from 'react';
import { ChevronRight, Home, Layout, List, Layers } from 'lucide-react';
import { useAdsManager } from '../context/AdsManagerContext';

export const AdsNavigator: React.FC = () => {
    const {
        breadcrumbs,
        currentLevel,
        setCurrentLevel,
        resetBreadcrumbs,
        popBreadcrumb,
        setBreadcrumbs,
        hierarchy,
        theme
    } = useAdsManager();

    // Counts from Hierarchy
    const campaignCount = hierarchy?.campaigns?.length || 0;
    const adSetCount = hierarchy?.adSets?.length || 0;
    const adCount = hierarchy?.ads?.length || 0;

    const isDark = theme === 'dark';

    return (

        <div className="flex flex-col gap-2">
            {/* 1. BREADCRUMBS */}
            <div className={`flex items-center text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                <button
                    onClick={resetBreadcrumbs}
                    className={`flex items-center gap-1 transition-colors ${breadcrumbs.length === 0
                        ? (isDark ? 'text-white font-medium' : 'text-slate-900 font-medium')
                        : (isDark ? 'hover:text-white' : 'hover:text-slate-900')
                        }`}
                >
                    <Home size={12} />
                    <span>All Accounts</span>
                </button>

                {breadcrumbs.map((crumb, idx) => (
                    <React.Fragment key={crumb.id}>
                        <ChevronRight size={12} className={`mx-1 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
                        <button
                            onClick={() => {
                                if (idx === breadcrumbs.length - 1) return;
                                const newCrumbs = breadcrumbs.slice(0, idx + 1);
                                setBreadcrumbs(newCrumbs);
                                const targetCrumb = breadcrumbs[idx];
                                if (targetCrumb.level === 'CAMPAIGN') setCurrentLevel('ADSET');
                                if (targetCrumb.level === 'ADSET') setCurrentLevel('AD');
                            }}
                            className={`transition-colors ${idx === breadcrumbs.length - 1
                                ? (isDark ? 'text-white font-medium' : 'text-slate-900 font-medium')
                                : (isDark ? 'hover:text-white' : 'hover:text-slate-900')
                                }`}
                        >
                            {crumb.name}
                        </button>
                    </React.Fragment>
                ))}
            </div>

            {/* 2. LEVEL TABS */}
            <div className="flex items-center gap-1">
                <LevelTab
                    label={`Campaigns (${campaignCount})`}
                    icon={Layout}
                    isActive={currentLevel === 'CAMPAIGN'}
                    theme={theme}
                    onClick={() => {
                        resetBreadcrumbs();
                    }}
                />
                <LevelTab
                    label={`Ad Sets (${adSetCount})`}
                    icon={List}
                    isActive={currentLevel === 'ADSET'}
                    theme={theme}
                    onClick={() => {
                        if (breadcrumbs.length >= 2) {
                            setCurrentLevel('ADSET');
                        } else {
                            setCurrentLevel('ADSET');
                        }
                    }}
                />
                <LevelTab
                    label={`Ads (${adCount})`}
                    icon={Layers}
                    isActive={currentLevel === 'AD'}
                    theme={theme}
                    onClick={() => setCurrentLevel('AD')}
                />
            </div>
        </div>
    );
};

const LevelTab = ({ label, icon: Icon, isActive, onClick, disabled, theme }: any) => {
    const isDark = theme === 'dark';
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`flex items-center gap-2 px-3 py-2 border-b-2 transition-all ${disabled
                ? 'opacity-30 cursor-not-allowed border-transparent'
                : isActive
                    ? (isDark ? 'border-blue-500 text-blue-400 bg-slate-800/50' : 'border-blue-600 text-blue-600 bg-blue-50')
                    : (isDark ? 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30' : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100')
                }`}
        >
            <Icon size={14} />
            <span className="font-medium text-xs">{label}</span>
        </button>
    );
};
