import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, Check, ArrowRight, X, Lock } from 'lucide-react';
import { DateSelection, DatePreset, Theme } from '../types';
import { resolveDateRange } from '../services/metaService';

interface DateRangeSelectorProps {
    selection: DateSelection;
    onChange: (selection: DateSelection) => void;
    theme: Theme;
    locked?: boolean;
}

const PRESETS: { id: DatePreset; label: string }[] = [
    { id: 'today', label: 'Today' },
    { id: 'yesterday', label: 'Yesterday' },
    { id: 'last_3d', label: 'Last 3 Days' },
    { id: 'last_7d', label: 'Last 7 Days' },
    { id: 'last_14d', label: 'Last 14 Days' },
    { id: 'last_30d', label: 'Last 30 Days' },
    { id: 'last_90d', label: 'Last 90 Days' },
    { id: 'last_3months', label: 'Last 3 Months' },
    { id: 'this_month', label: 'This Month' },
    { id: 'last_month', label: 'Last Month' },
    { id: 'this_year', label: 'This Year' },
    { id: 'last_year', label: 'Last Year' },
    { id: 'custom', label: 'Custom Range...' },
];

const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({ selection, onChange, theme, locked = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Custom range temporary state
    const [showCustomInputs, setShowCustomInputs] = useState(selection.preset === 'custom');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');

    // Determine date limits
    // Max date is today
    const maxDate = new Date().toISOString().split('T')[0];
    // Min date is 365 days ago
    const oneYearAgo = new Date();
    oneYearAgo.setDate(oneYearAgo.getDate() - 365);
    const minDate = oneYearAgo.toISOString().split('T')[0];

    const isDark = theme === 'dark';

    // Initialize custom fields if currently custom
    useEffect(() => {
        if (selection.preset === 'custom' && selection.custom) {
            setCustomStart(selection.custom.startDate);
            setCustomEnd(selection.custom.endDate);
            setShowCustomInputs(true);
        } else {
            setShowCustomInputs(false);
        }
    }, [selection]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleApplyCustom = () => {
        if (customStart && customEnd) {
            onChange({
                preset: 'custom',
                custom: { startDate: customStart, endDate: customEnd }
            });
            setIsOpen(false);
        }
    };

    const handlePresetClick = (presetId: DatePreset) => {
        if (presetId === 'custom') {
            setShowCustomInputs(true);
        } else {
            onChange({ preset: presetId });
            setIsOpen(false);
            setShowCustomInputs(false);
        }
    };

    const currentLabel = selection.preset === 'custom' && selection.custom
        ? `${selection.custom.startDate} - ${selection.custom.endDate}`
        : PRESETS.find(p => p.id === selection.preset)?.label || 'Select Date';

    // Mobile Short Label (e.g. "Last 30 Days" -> "30D")
    const getShortLabel = () => {
        if (selection.preset === 'custom') return 'Custom';
        if (selection.preset.includes('last_')) {
            const part = selection.preset.replace('last_', '');
            return part.toUpperCase().replace('MONTHS', 'M').replace('DAYS', 'D'); // e.g. 30D, 3M
        }
        if (selection.preset === 'today') return 'Today';
        if (selection.preset === 'yesterday') return 'Yest.';
        return currentLabel; // Fallback
    };

    // Resolve dates for subtitle display
    const resolved = resolveDateRange(selection);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => !locked && setIsOpen(!isOpen)}
                disabled={locked}
                className={`flex items-center space-x-2 rounded-lg p-2 border transition-all ${locked ? 'opacity-75 cursor-not-allowed' : 'cursor-pointer'
                    } ${isDark
                        ? 'bg-slate-900 border-slate-800 hover:border-slate-700 text-white'
                        : 'bg-white border-slate-200 hover:border-brand-300 shadow-sm text-slate-700'
                    }`}
            >
                <Calendar size={16} className={locked ? "text-slate-500" : "text-brand-500"} />

                {/* Desktop View */}
                <div className="hidden md:flex flex-col items-start leading-none">
                    <span className="text-xs font-bold whitespace-nowrap flex items-center">
                        {currentLabel}
                        {locked && <Lock size={10} className="ml-1 text-slate-500" />}
                    </span>
                    <span className="text-[10px] opacity-60 font-mono mt-0.5">{resolved.since} to {resolved.until}</span>
                </div>

                {/* Mobile View (Compact) */}
                <div className="md:hidden flex flex-col items-start leading-none">
                    <span className="text-xs font-bold whitespace-nowrap flex items-center">
                        {getShortLabel()}
                        {locked && <Lock size={10} className="ml-1 text-slate-500" />}
                    </span>
                </div>

                {!locked && <ChevronDown size={14} className={`ml-2 opacity-50 transition-transform ${isOpen ? 'rotate-180' : ''}`} />}
            </button>

            {isOpen && !locked && (
                <>
                    {/* Mobile: Modal/Backdrop style to ensure it fits screen */}
                    <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={() => setIsOpen(false)} />

                    <div className={`absolute top-full right-0 mt-2 rounded-xl shadow-2xl border p-2 z-50 animate-fade-in-down origin-top-right 
            w-[calc(100vw-2rem)] right-[-10px] md:w-80 md:right-0
            ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}
        `}>
                        {/* Custom Range Inputs - Shown only when 'Custom' active or selected */}
                        {showCustomInputs && (
                            <div className={`p-3 mb-2 rounded-lg border animate-fade-in ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                                <div className="flex justify-between items-center mb-2">
                                    <div className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Select Range</div>
                                    <button onClick={() => setShowCustomInputs(false)} className="text-slate-500 hover:text-red-500"><X size={12} /></button>
                                </div>

                                <div className="text-[10px] mb-2 text-slate-500">
                                    Date range limited to the last 365 days.
                                </div>

                                <div className="flex items-center space-x-2">
                                    <input
                                        type="date"
                                        min={minDate}
                                        max={maxDate}
                                        value={customStart}
                                        onChange={(e) => setCustomStart(e.target.value)}
                                        style={{ colorScheme: isDark ? 'dark' : 'light' }}
                                        className={`w-full p-1.5 text-xs rounded border outline-none focus:border-brand-500 ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'}`}
                                    />
                                    <ArrowRight size={12} className="text-slate-400" />
                                    <input
                                        type="date"
                                        min={minDate}
                                        max={maxDate}
                                        value={customEnd}
                                        onChange={(e) => setCustomEnd(e.target.value)}
                                        style={{ colorScheme: isDark ? 'dark' : 'light' }}
                                        className={`w-full p-1.5 text-xs rounded border outline-none focus:border-brand-500 ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'}`}
                                    />
                                </div>
                                <button
                                    onClick={handleApplyCustom}
                                    disabled={!customStart || !customEnd}
                                    className="w-full mt-2 bg-brand-600 hover:bg-brand-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-xs font-bold py-1.5 rounded transition-colors"
                                >
                                    Apply Range
                                </button>
                                <div className={`h-px w-full mt-3 ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}></div>
                            </div>
                        )}

                        {/* Presets List */}
                        <div className="max-h-60 overflow-y-auto custom-scrollbar">
                            {PRESETS.map(preset => {
                                const isSelected = selection.preset === preset.id;
                                // Don't show custom in list if already showing inputs at top to avoid redundancy, 
                                // unless we want it as a toggle. Let's keep it as a toggle.
                                if (preset.id === 'custom' && showCustomInputs) return null;

                                return (
                                    <button
                                        key={preset.id}
                                        onClick={() => handlePresetClick(preset.id)}
                                        className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${isSelected
                                                ? (isDark ? 'bg-brand-900/30 text-brand-400' : 'bg-brand-50 text-brand-700')
                                                : (isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-50')
                                            }`}
                                    >
                                        <span>{preset.label}</span>
                                        {isSelected && <Check size={14} />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default DateRangeSelector;