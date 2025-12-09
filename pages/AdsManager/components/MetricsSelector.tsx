import React, { useState } from 'react';
import { Columns, Search, X } from 'lucide-react';
import { useAdsManager } from '../context/AdsManagerContext';
import { AVAILABLE_COLUMNS } from '../constants/columns';

export const MetricsSelector: React.FC = () => {
    const { visibleColumns, setVisibleColumns, theme } = useAdsManager();
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');

    const toggleColumn = (id: string) => {
        if (visibleColumns.includes(id)) {
            setVisibleColumns(visibleColumns.filter(c => c !== id));
        } else {
            setVisibleColumns([...visibleColumns, id]);
        }
    };

    const filteredColumns = AVAILABLE_COLUMNS.filter(col =>
        col.label.toLowerCase().includes(search.toLowerCase())
    );

    // Group by category
    const grouped = filteredColumns.reduce((acc, col) => {
        if (!acc[col.category]) acc[col.category] = [];
        acc[col.category].push(col);
        return acc;
    }, {} as Record<string, typeof AVAILABLE_COLUMNS>);

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border transition-all ${theme === 'dark'
                    ? 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white hover:bg-slate-700'
                    : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900 hover:bg-slate-50'
                    }`}
            >
                <Columns size={14} />
                <span>Columns</span>
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[1px]" onClick={() => setIsOpen(false)} />
                    <div className={`absolute right-0 top-10 w-[260px] border shadow-2xl rounded-xl z-50 flex flex-col max-h-[400px] animate-in fade-in zoom-in-95 duration-200 ${theme === 'dark'
                        ? 'bg-slate-900 border-slate-700'
                        : 'bg-white border-slate-200'
                        }`}>
                        <div className={`p-3 border-b flex justify-between items-center ${theme === 'dark' ? 'border-slate-800' : 'border-slate-100'}`}>
                            <h3 className={`font-semibold text-xs ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Customize Columns</h3>
                            <button onClick={() => setIsOpen(false)}><X size={14} className={theme === 'dark' ? 'text-slate-400' : 'text-slate-500'} /></button>
                        </div>

                        <div className={`p-2 border-b ${theme === 'dark' ? 'border-slate-800' : 'border-slate-100'}`}>
                            <div className="relative">
                                <Search size={12} className={`absolute left-2.5 top-2.5 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`} />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className={`w-full border rounded-lg pl-8 pr-2 py-1.5 text-xs focus:ring-1 focus:ring-purple-500 outline-none ${theme === 'dark'
                                        ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-600'
                                        : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                                        }`}
                                />
                            </div>
                        </div>

                        <div className="overflow-y-auto flex-1 p-2 space-y-3 custom-scrollbar">
                            {Object.entries(grouped).map(([category, cols]) => (
                                <div key={category}>
                                    <h4 className={`text-[9px] uppercase font-bold mb-1 px-1 tracking-wider ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>{category}</h4>
                                    <div className="space-y-0.5">
                                        {cols.map(col => (
                                            <label key={col.id} className={`flex items-center gap-2 p-1.5 rounded-lg cursor-pointer transition-colors ${theme === 'dark'
                                                ? 'hover:bg-slate-800 text-slate-300'
                                                : 'hover:bg-slate-50 text-slate-600'
                                                }`}>
                                                <input
                                                    type="checkbox"
                                                    checked={visibleColumns.includes(col.id)}
                                                    onChange={() => toggleColumn(col.id)}
                                                    className={`w-3.5 h-3.5 rounded border text-purple-600 focus:ring-0 ${theme === 'dark' ? 'border-slate-600 bg-slate-800' : 'border-slate-300 bg-white'}`}
                                                />
                                                <span className="text-xs font-medium">{col.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className={`p-3 border-t flex justify-end ${theme === 'dark' ? 'border-slate-800 bg-slate-900' : 'border-slate-100 bg-white'}`}>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="bg-slate-900 text-white hover:bg-slate-800 px-4 py-1.5 rounded-lg text-xs font-medium shadow-md transition-all border border-slate-800"
                            >
                                Apply Changes
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
