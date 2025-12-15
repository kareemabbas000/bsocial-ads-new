import { Layers, Monitor } from 'lucide-react';
import { PDFComponentProps } from './types';

interface PDFPlacementLedgerProps extends PDFComponentProps {
    title?: string;
    metricLabel?: string;
    formatter?: (val: number) => string;
    hideCost?: boolean;
}

export const PDFPlacementLedger: React.FC<PDFPlacementLedgerProps> = ({
    data,
    isDark,
    title = "Top Placements",
    metricLabel = "Total Spend",
    formatter,
    hideCost
}) => {
    // data is array of items (placements)
    const items = data.slice(0, 5); // Top 5 only
    const maxSpend = Math.max(...items.map((i: any) => parseFloat(i.value || i.spend || '0')), 1);

    const defaultFormatter = (val: number) => {
        if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
        if (val >= 1000) return `$${(val / 1000).toFixed(1)}K`;
        return `$${val.toFixed(2)}`;
    };

    const numberFormatter = (val: number) => {
        if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
        if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
        return val.toLocaleString();
    };

    // Override formatter if hideCost is on
    const formatValue = hideCost ? numberFormatter : (formatter || defaultFormatter);
    const displayLabel = hideCost ? 'Impressions' : metricLabel;

    return (
        <div className={`p-6 rounded-2xl h-[400px] flex flex-col break-inside-avoid relative overflow-hidden transition-all border
            ${isDark
                ? 'bg-[#1E293B]/40 backdrop-blur-md border-white/5'
                : 'bg-white/70 backdrop-blur-md border-white/60 shadow-md'}
        `}>
            <div className={`absolute inset-0 bg-gradient-to-br ${isDark ? 'from-white/5 to-transparent' : 'from-white/40 to-transparent'} pointer-events-none`}></div>
            <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-center mb-4 shrink-0">
                    <div className="p-1.5 rounded bg-emerald-100 text-emerald-600 mr-2 dark:bg-emerald-900/30 dark:text-emerald-400">
                        <Monitor size={14} />
                    </div>
                    <h3 className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{title}</h3>
                </div>

                <div className="flex-1 w-full min-h-0">
                    <div className="flex-1 w-full min-h-0">
                        <div className="flex flex-col gap-3">
                            {/* Top 1 Hero Card - Clean & Sharp */}
                            {items.length > 0 && (() => {
                                const item = items[0];
                                const spend = parseFloat(item.value || item.spend || '0');
                                const rawName = item.name.toLowerCase();
                                const name = item.name.replace('facebook-', 'Facebook ').replace('instagram-', 'Instagram ').replace('_', ' ');

                                const isFB = rawName.includes('facebook');
                                const isIG = rawName.includes('instagram');

                                // Solid Matte Colors for Sharpness (No Gradients/Blurs)
                                const bgClass = isFB ? 'bg-[#1877F2]'
                                    : isIG ? 'bg-[#E1306C]'
                                        : 'bg-[#10B981]';

                                // Fancy Background Logos
                                const renderLogo = (isFB: boolean, isIG: boolean) => {
                                    if (isFB) return (
                                        <svg className="absolute -bottom-4 -right-4 w-32 h-32 text-white opacity-[0.15] transform rotate-12 pointer-events-none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                                            <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                                        </svg>
                                    );
                                    if (isIG) return (
                                        <svg className="absolute -bottom-4 -right-4 w-32 h-32 text-white opacity-[0.15] transform -rotate-12 pointer-events-none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                                            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                                            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                                        </svg>
                                    );
                                    return (
                                        <svg className="absolute -bottom-6 -right-6 w-32 h-32 text-white opacity-[0.15] transform rotate-45 pointer-events-none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
                                        </svg>
                                    );
                                };

                                return (
                                    <div className={`relative overflow-hidden p-4 rounded-xl shadow-md border border-black/5 ${bgClass} flex items-center justify-between h-24 shrink-0`}>
                                        {renderLogo(isFB, isIG)}
                                        <div className="relative z-10 flex flex-col justify-center h-full">
                                            <div className="flex items-center space-x-2 mb-1.5">
                                                <span className="bg-white text-black px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest shadow-sm">
                                                    ★ Top Performer
                                                </span>
                                            </div>
                                            <h4 className="text-lg font-black text-white uppercase tracking-tight leading-tight max-w-[220px]">
                                                {name}
                                            </h4>
                                        </div>

                                        <div className="relative z-10 text-right">
                                            <div className="text-[9px] uppercase text-white/90 font-bold mb-0.5 tracking-wider">{displayLabel}</div>
                                            <div className="text-4xl font-black text-white tracking-tighter">
                                                {formatValue(spend)}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Top 2-5 Grid - Clean Cards */}
                            <div className="grid grid-cols-2 gap-3">
                                {items.slice(1, 5).map((item: any, idx: number) => {
                                    const realIdx = idx + 1; // 0->2, 1->3
                                    const spend = parseFloat(item.value || item.spend || '0');
                                    const rawName = item.name.toLowerCase();
                                    const name = item.name.replace('facebook-', 'Facebook ').replace('instagram-', 'Instagram ').replace('_', ' ');

                                    const isFB = rawName.includes('facebook');
                                    const isIG = rawName.includes('instagram');

                                    // Lighter/Subtle backgrounds for secondary items to keep hierarchy
                                    const bgStyle = isFB ? (isDark ? 'bg-blue-900/40 border-blue-500/30' : 'bg-blue-50 border-blue-200')
                                        : isIG ? (isDark ? 'bg-pink-900/40 border-pink-500/30' : 'bg-pink-50 border-pink-200')
                                            : (isDark ? 'bg-emerald-900/40 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200');

                                    const textStyle = isFB ? (isDark ? 'text-blue-200' : 'text-blue-800')
                                        : isIG ? (isDark ? 'text-pink-200' : 'text-pink-800')
                                            : (isDark ? 'text-emerald-200' : 'text-emerald-800');

                                    // Small Watermark for Grid Items
                                    const renderSmallLogo = () => {
                                        if (isFB) return <svg className="absolute -bottom-2 -right-2 w-16 h-16 opacity-[0.05] text-blue-900 dark:text-blue-100 transform rotate-12 pointer-events-none" fill="currentColor" viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>;
                                        if (isIG) return <svg className="absolute -bottom-2 -right-2 w-16 h-16 opacity-[0.05] text-pink-900 dark:text-pink-100 transform -rotate-12 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>;
                                        return null;
                                    }

                                    return (
                                        <div key={idx} className={`relative overflow-hidden p-3 rounded-lg border ${bgStyle} flex flex-col justify-between h-20 transition-all`}>
                                            {renderSmallLogo()}
                                            <div className="relative z-10 flex justify-between items-start">
                                                <span className={`text-[9px] font-bold uppercase opacity-90 leading-tight max-w-[85%] ${textStyle}`}>
                                                    {name}
                                                </span>
                                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${isDark ? 'bg-white/10 text-white' : 'bg-black/5 text-slate-600'}`}>
                                                    #{realIdx + 1}
                                                </span>
                                            </div>
                                            <div className="relative z-10 mt-auto pt-2">
                                                <div className={`text-xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                                    {formatValue(spend)}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
