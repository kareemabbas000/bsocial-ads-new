import React from 'react';
import { Layers } from 'lucide-react';
import { PDFComponentProps } from './types';

interface PDFLedgerProps extends PDFComponentProps {
    hideCost?: boolean;
}

export const PDFLedger: React.FC<PDFLedgerProps> = ({ data, isDark, hideCost }) => {
    // data is array of items (campaigns)
    const items = data.slice(0, 10); // Show top 10 now that it's full width again

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            notation: 'compact',
            maximumFractionDigits: 1
        }).format(val);
    };

    const formatNumber = (val: number) => {
        return new Intl.NumberFormat('en-US', {
            notation: 'compact',
            maximumFractionDigits: 1
        }).format(val);
    };

    return (
        <div className={`p-6 rounded-2xl h-auto min-h-[400px] flex flex-col break-inside-avoid relative overflow-hidden transition-all border
            ${isDark
                ? 'bg-[#1E293B]/40 backdrop-blur-md border-white/5'
                : 'bg-white/70 backdrop-blur-md border-white/60 shadow-md'}
        `}>
            <div className="relative z-10">
                <div className="flex items-center mb-6">
                    <div className="p-1.5 rounded bg-blue-100 text-blue-600 mr-2 dark:bg-blue-900/30 dark:text-blue-400">
                        <Layers size={14} />
                    </div>
                    <h3 className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Performance Ledger (Campaigns)</h3>
                </div>

                <div className="space-y-2">
                    {/* Header for visual alignment */}
                    <div className={`grid grid-cols-12 text-[10px] uppercase font-bold tracking-wider px-4 py-3 rounded-t-lg mb-0 ${isDark ? 'bg-slate-900 text-slate-400 border-b border-white/5' : 'bg-slate-50 text-slate-500 border-b border-slate-200'}`}>
                        <div className="col-span-3">Campaign Name</div>
                        {!hideCost && <div className="col-span-2 text-right">Spend</div>}
                        <div className={hideCost ? "col-span-2 text-right" : "col-span-1 text-right"}>Reach</div>
                        <div className={hideCost ? "col-span-2 text-right" : "col-span-1 text-right"}>Impr.</div>
                        <div className={hideCost ? "col-span-2 text-right" : "col-span-1 text-right"}>Clicks</div>
                        <div className={hideCost ? "col-span-2 text-right" : "col-span-1 text-right"}>Purch.</div>
                        <div className="col-span-1 text-right">CTR</div>
                        {!hideCost && <div className="col-span-2 text-right">ROAS</div>}
                    </div>

                    {items.map((item: any, idx: number) => {
                        const spend = parseFloat(item.spend || '0');
                        const impr = parseInt(item.impressions || '0');
                        const reach = parseInt(item.reach || '0');
                        const clicks = parseInt(item.clicks || '0');
                        const purch = parseInt(item.purchases || '0');
                        const ctr = parseFloat(item.ctr || '0');
                        const roas = parseFloat(item.roas || '0');

                        return (
                            <div key={idx} className={`relative flex items-center p-3 border-b last:border-0 transition-all
                            ${isDark
                                    ? 'border-white/5 hover:bg-white/5'
                                    : 'border-slate-100 hover:bg-slate-50'}
                        `}>
                                <div className={`grid grid-cols-12 gap-2 w-full items-center`}>
                                    <div className={`col-span-3 font-bold text-xs truncate ${isDark ? 'text-white' : 'text-slate-800'}`}>
                                        {item.name}
                                    </div>
                                    {!hideCost && (
                                        <div className="col-span-2 text-right font-mono text-xs text-slate-500">
                                            {formatCurrency(spend)}
                                        </div>
                                    )}
                                    <div className={`${hideCost ? 'col-span-2' : 'col-span-1'} text-right font-mono text-xs text-slate-500`}>
                                        {formatNumber(reach)}
                                    </div>
                                    <div className={`${hideCost ? 'col-span-2' : 'col-span-1'} text-right font-mono text-xs text-slate-500`}>
                                        {formatNumber(impr)}
                                    </div>
                                    <div className={`${hideCost ? 'col-span-2' : 'col-span-1'} text-right font-mono text-xs text-slate-500`}>
                                        {formatNumber(clicks)}
                                    </div>
                                    <div className={`${hideCost ? 'col-span-2' : 'col-span-1'} text-right font-mono text-xs ${purch > 0 ? (isDark ? 'text-emerald-400' : 'text-emerald-600') : 'text-slate-500'}`}>
                                        {formatNumber(purch)}
                                    </div>
                                    <div className="col-span-1 text-right font-mono text-xs">
                                        <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 font-bold text-[10px]">
                                            {ctr.toFixed(2)}%
                                        </span>
                                    </div>
                                    {!hideCost && (
                                        <div className="col-span-2 text-right font-mono text-xs font-bold text-blue-500">
                                            {roas.toFixed(2)}x
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
