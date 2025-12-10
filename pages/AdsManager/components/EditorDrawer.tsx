import React, { useState, useEffect } from 'react';
import { X, Save, RefreshCw, Edit3 } from 'lucide-react';
import { Campaign, AdSet, Ad } from '../../../types';
import { useAdsManager } from '../context/AdsManagerContext';
import { CampaignEditor } from './Editor/CampaignEditor';
import { AdSetEditor } from './Editor/AdSetEditor';
import { AdEditor } from './Editor/AdEditor';
import { updateCampaign, updateAdSet, updateAd } from '../../../services/metaService';

interface EditorDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    editItem: any; // Can be Campaign, AdSet, or Ad
    level: 'CAMPAIGN' | 'ADSET' | 'AD';
}

export const EditorDrawer: React.FC<EditorDrawerProps> = ({ isOpen, onClose, editItem, level }) => {
    const { token, accountIds, theme } = useAdsManager();
    const isDark = theme === 'dark';
    const [formData, setFormData] = useState<any>({});
    const [saving, setSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    // Reset form data when item changes
    useEffect(() => {
        if (editItem) {
            setFormData(JSON.parse(JSON.stringify(editItem))); // Deep copy
            setHasChanges(false);
        }
    }, [editItem]);

    const handleChange = (updates: any) => {
        setFormData((prev: any) => ({ ...prev, ...updates }));
        setHasChanges(true);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Determine which update function to call
            if (level === 'CAMPAIGN') {
                await updateCampaign(formData.id, formData as Partial<Campaign>, token);
            } else if (level === 'ADSET') {
                await updateAdSet(formData.id, formData as Partial<AdSet>, token);
            } else if (level === 'AD') {
                await updateAd(formData.id, formData as Partial<Ad>, token);
            }
            setHasChanges(false);
            onClose(); // Close on success
            // Trigger refresh? Ideally context should support refresh trigger.
            // For now rely on local optimistic/cache clear.
            alert("Draft Saved & Published to Meta!");
        } catch (e: any) {
            alert("Error saving: " + e.message);
        } finally {
            setSaving(false);
        }
    };

    // Account ID for services (take first for now)
    const activeAccountId = accountIds[0] || '';

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex justify-end pointer-events-none">
            {/* BACKDROP */}
            <div
                className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 pointer-events-auto ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            />

            {/* DRAWER CONTENT */}
            <div
                className={`
                    pointer-events-auto
                    absolute bottom-0 w-full h-[85vh] md:h-full md:top-0 md:right-0 md:w-[600px] md:bottom-auto
                    border-t md:border-t-0 md:border-l 
                    shadow-2xl transition-transform duration-300 ease-out
                    flex flex-col
                    rounded-t-2xl md:rounded-none
                    ${isOpen ? 'translate-y-0 md:translate-x-0' : 'translate-y-full md:translate-x-full'}
                    ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}
                `}
            >
                {/* HEADER */}
                <div className={`flex items-center justify-between p-4 border-b shrink-0 rounded-t-2xl md:rounded-none backdrop-blur-md ${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-white'}`}>
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isDark ? 'bg-gradient-to-br from-purple-500/20 to-blue-500/20' : 'bg-blue-50'}`}>
                            <Edit3 size={18} className={isDark ? 'text-purple-400' : 'text-blue-600'} />
                        </div>
                        <div>
                            <h2 className={`text-lg font-bold leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Edit {level.charAt(0) + level.slice(1).toLowerCase()}</h2>
                            <p className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>ID: {editItem?.id}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className={`p-2 rounded-full transition-colors ${isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-900'}`}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* SCROLLABLE CONTENT */}
                <div className={`flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 space-y-8 ${isDark ? 'bg-slate-900' : 'bg-slate-50/50'}`}>
                    {level === 'CAMPAIGN' && (
                        <CampaignEditor
                            data={formData}
                            onChange={handleChange}
                        />
                    )}
                    {level === 'ADSET' && (
                        <AdSetEditor
                            data={formData}
                            onChange={handleChange}
                            token={token}
                            accountId={activeAccountId}
                        />
                    )}
                    {level === 'AD' && (
                        <AdEditor
                            data={formData}
                            onChange={handleChange}
                            token={token}
                            accountId={activeAccountId}
                        />
                    )}
                </div>

                {/* FOOTER */}
                <div className={`p-4 border-t flex justify-between items-center ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-100 bg-white'}`}>
                    <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        {hasChanges ? 'Unsaved changes' : 'No changes'}
                    </span>
                    <div className="flex gap-2">
                        <button onClick={onClose} className={`px-4 py-2 rounded text-sm transition-colors ${isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'}`}>
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={!hasChanges || saving}
                            className={`px-6 py-2 rounded text-sm font-medium flex items-center gap-2 transition-all ${hasChanges && !saving
                                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                                : (isDark ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-slate-100 text-slate-400 cursor-not-allowed')
                                }`}
                        >
                            {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                            Publish Changes
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
