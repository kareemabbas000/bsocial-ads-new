import React, { memo } from 'react';
import { Edit3, BarChart2, MoreVertical } from 'lucide-react';
import { formatCurrency, formatNumber } from '../../../services/utils/format';

interface AdsTableRowProps {
    item: any;
    isSelected: boolean;
    onToggleSelection: (id: string) => void;
    currentLevel: string;
    activeColumns: string[];
    gridTemplate: string;
    isDark: boolean;
    onEdit: (item: any) => void;
    onDrillDown: (item: any) => void;
    onViewInsights: (item: any) => void;
    onActionMenu: (e: React.MouseEvent, id: string) => void;
    isMenuOpen: boolean;
}

export const AdsTableRow = memo(({
    item,
    isSelected,
    onToggleSelection,
    currentLevel,
    activeColumns,
    gridTemplate,
    isDark,
    onEdit,
    onDrillDown,
    onViewInsights,
    onActionMenu,
    isMenuOpen
}: AdsTableRowProps) => {

    const renderCell = (colId: string) => {
        if (colId === 'name') {
            return (
                <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full shadow-[0_0_8px_currentColor] transition-all duration-300 ${item.status === 'ACTIVE' ? 'text-emerald-400 bg-emerald-400' :
                        item.status === 'PAUSED' ? 'text-slate-400 bg-slate-400' : 'text-rose-500 bg-rose-500'
                        }`} />
                    <div className="flex flex-col min-w-0">
                        {currentLevel !== 'AD' ? (
                            <button
                                onClick={() => onDrillDown(item)}
                                className={`font-medium text-xs hover:underline text-left truncate transition-colors ${isDark ? 'text-slate-200 hover:text-purple-400' : 'text-slate-700 hover:text-purple-600'
                                    }`}
                            >
                                {item.name}
                            </button>
                        ) : (
                            <span className={`font-medium text-xs truncate ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                {item.name}
                            </span>
                        )}
                    </div>
                </div>
            );
        }

        const metrics = item.insights || {};

        switch (colId) {
            case 'delivery': return (
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-opacity-20 uppercase tracking-wider ${item.status === 'ACTIVE'
                    ? (isDark ? 'border-emerald-500 text-emerald-400 bg-emerald-900/10 shadow-[0_0_6px_rgba(52,211,153,0.3)]' : 'border-emerald-600 text-emerald-700 bg-emerald-100')
                    : item.status === 'PAUSED'
                        ? (isDark ? 'border-slate-500 text-slate-400 bg-slate-800/20' : 'border-slate-400 text-slate-600 bg-slate-200')
                        : (isDark ? 'border-rose-500 text-rose-400 bg-rose-900/10' : 'border-rose-600 text-rose-700 bg-rose-100')
                    }`}>
                    {item.status}
                </span>
            );
            case 'spend': return <span className={`font-mono text-xs ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>{formatCurrency(metrics.spend || 0)}</span>;
            case 'budget':
                return <span className={`text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {item.daily_budget ? `${formatCurrency(item.daily_budget / 100)}/d` :
                        item.lifetime_budget ? `${formatCurrency(item.lifetime_budget / 100)} total` : '-'}
                </span>;
            case 'results': return <span className={`font-bold font-mono text-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>{formatNumber(metrics.actions?.[0]?.value || 0)}</span>;
            case 'reach': return <span className="font-mono text-xs text-slate-500">{formatNumber(metrics.reach || 0)}</span>;
            case 'impressions': return <span className="font-mono text-xs text-slate-500">{formatNumber(metrics.impressions || 0)}</span>;
            case 'cpm': return <span className="font-mono text-xs text-slate-500">{formatCurrency(metrics.cpm || 0)}</span>;
            case 'cpc': return <span className="font-mono text-xs text-slate-500">{formatCurrency(metrics.cpc || 0)}</span>;
            case 'ctr': return <span className={`font-mono text-xs ${parseFloat(metrics.ctr || '0') > 1 ? (isDark ? 'text-emerald-400' : 'text-emerald-600') : 'text-slate-500'}`}>
                {metrics.ctr ? parseFloat(metrics.ctr).toFixed(2) + '%' : '-'}
            </span>;
            case 'frequency': return <span className="font-mono text-xs text-slate-500">{metrics.frequency || '-'}</span>;
            case 'quality_ranking': return <span className="text-[10px] text-slate-500">{item.quality_ranking || '-'}</span>;
            case 'adset_count': return <span className={`font-mono text-xs ${item.adset_count > 0 ? (isDark ? 'text-slate-300' : 'text-slate-700') : 'text-slate-500'}`}>{item.adset_count || 0}</span>;
            case 'ad_count': return <span className={`font-mono text-xs ${item.ad_count > 0 ? (isDark ? 'text-slate-300' : 'text-slate-700') : 'text-slate-500'}`}>{item.ad_count || 0}</span>;
            default: return '-';
        }
    };

    return (
        <div
            className={`group grid items-center gap-0 border-b last:border-0 transition-all duration-100 hover:z-10 ${isDark
                ? 'bg-slate-950/20 border-slate-800/50 hover:bg-slate-900 hover:shadow-[0_4px_20px_rgba(0,0,0,0.5)]'
                : 'bg-white border-slate-100 hover:bg-slate-50 hover:shadow-lg'
                } ${isSelected ? (isDark ? 'bg-purple-900/10 border-purple-500/20' : 'bg-purple-50 border-purple-200') : ''}`}
            style={{ gridTemplateColumns: gridTemplate }}
        >
            {/* Checkbox Cell */}
            <div className={`sticky left-0 z-20 h-full flex items-center justify-center border-r transition-colors ${isDark ? 'bg-slate-950 border-slate-800 group-hover:bg-slate-900' : 'bg-white border-slate-100 group-hover:bg-slate-50'}`}>
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleSelection(item.id)}
                    className="rounded-sm border-slate-700 bg-slate-800 text-purple-500 focus:ring-0 focus:ring-offset-0 cursor-pointer w-3.5 h-3.5"
                />
            </div>

            {/* Actions Cell */}
            <div className={`sticky left-[40px] z-20 h-full flex items-center justify-center border-r transition-colors ${isDark ? 'bg-slate-950 border-slate-800 group-hover:bg-slate-900' : 'bg-white border-slate-100 group-hover:bg-slate-50'}`}>
                <div className="flex items-center gap-1 opacity-100">
                    <button onClick={() => onEdit(item)} className={`p-1 rounded transition-all duration-200 hover:scale-110 ${isDark ? 'text-slate-400 hover:text-purple-400 hover:bg-white/10' : 'text-slate-400 hover:text-purple-600 hover:bg-slate-100'}`} title="Edit">
                        <Edit3 size={12} strokeWidth={2} />
                    </button>
                    <button onClick={() => onViewInsights(item)} className={`p-1 rounded transition-all duration-200 hover:scale-110 ${isDark ? 'text-slate-400 hover:text-purple-400 hover:bg-white/10' : 'text-slate-400 hover:text-purple-600 hover:bg-slate-100'}`} title="View Charts">
                        <BarChart2 size={12} strokeWidth={2} />
                    </button>
                    <div className="relative">
                        <button onClick={(e) => onActionMenu(e, item.id)} className={`p-1 rounded transition-all duration-200 hover:scale-110 ${isMenuOpen ? 'text-purple-500' : (isDark ? 'text-slate-400 hover:text-purple-400 hover:bg-white/10' : 'text-slate-400 hover:text-purple-600 hover:bg-slate-100')}`}>
                            <MoreVertical size={12} strokeWidth={2} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Dynamic Cells */}
            {activeColumns.map(colId => (
                <div key={colId} className={`px-3 py-1.5 h-full flex items-center overflow-hidden border-r last:border-0 ${isDark ? 'border-slate-800/30' : 'border-slate-100'}`}>
                    <div className="w-full truncate">
                        {renderCell(colId)}
                    </div>
                </div>
            ))}
        </div>
    );
});
