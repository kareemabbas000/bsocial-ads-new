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
                    <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
                    <div className={`
                        z-50 flex flex-col border shadow-2xl animate-in slide-in-from-bottom-5 fade-in duration-200
                        ${theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}
                        
                        /* Mobile Styles: Fixed Bottom Sheet */
                        fixed inset-x-0 bottom-0 rounded-t-2xl max-h-[85vh]
                        
                        /* Desktop Styles: Absolute Dropdown */
                        md:absolute md:top-10 md:right-0 md:bottom-auto md:w-[280px] md:rounded-xl md:max-h-[450px]
                        md:animate-in md:fade-in md:zoom-in-95
                    `}>
                        {/* Mobile Handle */}
                        <div className="md:hidden flex justify-center pt-3 pb-1 w-full flex-shrink-0" onClick={() => setIsOpen(false)}>
                            <div className={`w-12 h-1.5 rounded-full ${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-300'}`}></div>
                        </div>

                        <div className={`p-3 border-b flex justify-between items-center ${theme === 'dark' ? 'border-slate-800' : 'border-slate-100'}`}>
                            <h3 className={`font-semibold text-xs ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Customize Columns</h3>
                            <button onClick={() => setIsOpen(false)}><X size={14} className={theme === 'dark' ? 'text-slate-400' : 'text-slate-500'} /></button>
                        </div>

                        <div className={`p-2 border-b flex-shrink-0 ${theme === 'dark' ? 'border-slate-800' : 'border-slate-100'}`}>
                            <div className="relative">
                                <Search size={12} className={`absolute left-2.5 top-2.5 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`} />
                                <input
                                    type="text"
                                    placeholder="Search columns..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className={`w-full border rounded-lg pl-8 pr-2 py-2 text-sm md:text-xs focus:ring-1 focus:ring-purple-500 outline-none ${theme === 'dark'
                                        ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-600'
                                        : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                                        }`}
                                />
                            </div>
                        </div>

                        <div className="overflow-y-auto flex-1 p-3 space-y-4 custom-scrollbar pb-8 md:pb-3">
                            {Object.entries(grouped).map(([category, cols]) => (
                                <div key={category}>
                                    <h4 className={`text-[10px] uppercase font-bold mb-2 px-1 tracking-wider opacity-70 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{category}</h4>
                                    <div className="grid grid-cols-1 gap-1">
                                        {cols.map(col => (
                                            <label key={col.id} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${theme === 'dark'
                                                ? 'hover:bg-slate-800 text-slate-300'
                                                : 'hover:bg-slate-50 text-slate-600'
                                                }`}>
                                                <input
                                                    type="checkbox"
                                                    checked={visibleColumns.includes(col.id)}
                                                    onChange={() => toggleColumn(col.id)}
                                                    className={`w-4 h-4 rounded border text-purple-600 focus:ring-0 cursor-pointer ${theme === 'dark' ? 'border-slate-600 bg-slate-800' : 'border-slate-300 bg-white'}`}
                                                />
                                                <span className="text-sm md:text-xs font-medium">{col.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className={`p-4 md:p-3 border-t flex justify-end flex-shrink-0 pb-8 md:pb-3 ${theme === 'dark' ? 'border-slate-800 bg-slate-900' : 'border-slate-100 bg-white'}`}>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="w-full md:w-auto bg-slate-900 text-white hover:bg-slate-800 px-4 py-2.5 md:py-1.5 rounded-xl md:rounded-lg text-sm md:text-xs font-medium shadow-md transition-all border border-slate-800"
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
