
import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Filter, ChevronDown, Check, Layers, Target, Lock } from 'lucide-react';
import { GlobalFilter as GlobalFilterType, AccountHierarchy, Theme } from '../types';

interface GlobalFilterProps {
  hierarchy: AccountHierarchy;
  filter: GlobalFilterType;
  onChange: (newFilter: GlobalFilterType) => void;
  theme: Theme;
  locked?: boolean;
}

const GlobalFilter: React.FC<GlobalFilterProps> = ({ hierarchy, filter, onChange, theme, locked = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'campaign' | 'adset'>('campaign');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter the list based on search text
  const filteredCampaigns = hierarchy.campaigns.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase())
  );
  
  const filteredAdSets = hierarchy.adSets.filter(a => 
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  const toggleCampaign = (id: string) => {
    const current = filter.selectedCampaignIds;
    const newIds = current.includes(id) 
        ? current.filter(cid => cid !== id) 
        : [...current, id];
    onChange({ ...filter, selectedCampaignIds: newIds });
  };

  const toggleAdSet = (id: string) => {
    const current = filter.selectedAdSetIds;
    const newIds = current.includes(id) 
        ? current.filter(aid => aid !== id) 
        : [...current, id];
    onChange({ ...filter, selectedAdSetIds: newIds });
  };

  const clearAll = () => {
      onChange({ searchQuery: '', selectedCampaignIds: [], selectedAdSetIds: [] });
      setSearch('');
  };

  const totalSelected = filter.selectedCampaignIds.length + filter.selectedAdSetIds.length;
  const isDark = theme === 'dark';

  return (
    <div className="relative z-50" ref={dropdownRef}>
        {/* Trigger Button */}
        <button 
            onClick={() => !locked && setIsOpen(!isOpen)}
            disabled={locked}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg border text-sm transition-all ${
                locked ? 'opacity-75 cursor-not-allowed' : 'cursor-pointer'
            } ${
                totalSelected > 0 
                ? 'bg-brand-600 text-white border-brand-500 shadow-md shadow-brand-500/20' 
                : isDark 
                    ? 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600' 
                    : 'bg-white border-slate-200 text-slate-600 hover:border-brand-300'
            }`}
        >
            <Filter size={14} className={locked ? "text-slate-500" : ""} />
            <span className="max-w-[100px] truncate flex items-center">
                {totalSelected > 0 ? `${totalSelected} Filter(s)` : 'Filter Data...'}
                {locked && <Lock size={12} className="ml-1.5 opacity-70" />}
            </span>
            {totalSelected > 0 && !locked && <span onClick={(e) => { e.stopPropagation(); clearAll(); }} className="p-0.5 hover:bg-white/20 rounded-full"><X size={12}/></span>}
            {!locked && <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />}
        </button>

        {/* Dropdown Panel */}
        {isOpen && !locked && (
            <div className={`absolute top-full mt-2 w-80 md:w-96 rounded-xl shadow-2xl border p-4 animate-fade-in-down ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                
                {/* Search Input */}
                <div className="relative mb-4">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input 
                        autoFocus
                        type="text" 
                        placeholder="Search campaigns or ad sets..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className={`w-full pl-9 pr-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-brand-500 ${isDark ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'}`}
                    />
                </div>

                {/* Tabs */}
                <div className="flex border-b mb-3 space-x-4 border-slate-700/50">
                    <button 
                        onClick={() => setActiveTab('campaign')}
                        className={`pb-2 text-xs font-bold uppercase tracking-wide border-b-2 transition-colors flex items-center ${activeTab === 'campaign' ? 'border-brand-500 text-brand-500' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                    >
                        <Layers size={12} className="mr-1"/> Campaigns ({filteredCampaigns.length})
                    </button>
                    <button 
                        onClick={() => setActiveTab('adset')}
                        className={`pb-2 text-xs font-bold uppercase tracking-wide border-b-2 transition-colors flex items-center ${activeTab === 'adset' ? 'border-brand-500 text-brand-500' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                    >
                        <Target size={12} className="mr-1"/> Ad Sets ({filteredAdSets.length})
                    </button>
                </div>

                {/* List */}
                <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-1">
                    {activeTab === 'campaign' && filteredCampaigns.map(c => {
                        const isSelected = filter.selectedCampaignIds.includes(c.id);
                        return (
                            <div 
                                key={c.id} 
                                onClick={() => toggleCampaign(c.id)}
                                className={`flex items-center p-2 rounded cursor-pointer text-sm group ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-50'} ${isSelected ? (isDark ? 'bg-brand-900/30' : 'bg-brand-50') : ''}`}
                            >
                                <div className={`w-4 h-4 rounded border flex items-center justify-center mr-3 transition-colors ${isSelected ? 'bg-brand-600 border-brand-600' : (isDark ? 'border-slate-600' : 'border-slate-300')}`}>
                                    {isSelected && <Check size={10} className="text-white" />}
                                </div>
                                <span className={`truncate flex-1 ${isSelected ? (isDark ? 'text-brand-200' : 'text-brand-900 font-medium') : (isDark ? 'text-slate-300' : 'text-slate-700')}`}>{c.name}</span>
                            </div>
                        )
                    })}
                    
                    {activeTab === 'adset' && filteredAdSets.map(a => {
                        const isSelected = filter.selectedAdSetIds.includes(a.id);
                        return (
                            <div 
                                key={a.id} 
                                onClick={() => toggleAdSet(a.id)}
                                className={`flex items-center p-2 rounded cursor-pointer text-sm group ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-50'} ${isSelected ? (isDark ? 'bg-brand-900/30' : 'bg-brand-50') : ''}`}
                            >
                                <div className={`w-4 h-4 rounded border flex items-center justify-center mr-3 transition-colors ${isSelected ? 'bg-brand-600 border-brand-600' : (isDark ? 'border-slate-600' : 'border-slate-300')}`}>
                                    {isSelected && <Check size={10} className="text-white" />}
                                </div>
                                <span className={`truncate flex-1 ${isSelected ? (isDark ? 'text-brand-200' : 'text-brand-900 font-medium') : (isDark ? 'text-slate-300' : 'text-slate-700')}`}>{a.name}</span>
                            </div>
                        )
                    })}

                    {(activeTab === 'campaign' && filteredCampaigns.length === 0) || (activeTab === 'adset' && filteredAdSets.length === 0) ? (
                        <div className="text-center py-6 text-slate-500 text-xs">
                            No results found for "{search}"
                        </div>
                    ) : null}
                </div>
                
                {/* Footer */}
                <div className={`mt-4 pt-3 border-t flex justify-between items-center ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                    <button onClick={clearAll} className="text-xs text-slate-500 hover:text-red-400">Clear Selection</button>
                    <button onClick={() => setIsOpen(false)} className="bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold px-4 py-2 rounded-lg">Apply Filter</button>
                </div>
            </div>
        )}
    </div>
  );
};

export default GlobalFilter;