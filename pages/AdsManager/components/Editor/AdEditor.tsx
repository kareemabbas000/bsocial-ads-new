import React, { useState } from 'react';
import { Ad } from '../../../../types';
import { uploadImage } from '../../../../services/metaCreative';
import { Sparkles, Upload } from 'lucide-react';
import { AICreativeStudio } from '../AICreativeStudio';
import { useAdsManager } from '../../context/AdsManagerContext';

interface AdEditorProps {
    data: Partial<Ad>;
    onChange: (updates: Partial<Ad>) => void;
    token: string;
    accountId: string;
}

export const AdEditor: React.FC<AdEditorProps> = ({ data, onChange, token, accountId }) => {
    const { theme } = useAdsManager();
    const isDark = theme === 'dark';

    const [uploading, setUploading] = useState(false);
    const [isAIStudioOpen, setAIStudioOpen] = useState(false);

    // Helpers
    const updateCreative = (field: string, value: any) => {
        const spec = (data as any).creative_spec || {};
        onChange({
            ...data,
            [field]: value,
            creative_spec: { ...spec, [field]: value }
        } as any);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        setUploading(true);
        try {
            const result = await uploadImage(accountId, file, token);
            updateCreative('image_hash', result.hash);
            updateCreative('image_url', result.url);
        } catch (err) {
            alert("Upload failed");
        } finally {
            setUploading(false);
        }
    };

    const creativeSpec = (data as any).creative_spec || data.creative || {};

    // Styles
    const labelClass = isDark ? 'text-slate-400' : 'text-slate-500';
    const inputClass = isDark
        ? 'bg-slate-900 border-slate-700 text-white focus:border-blue-500'
        : 'bg-white border-slate-200 text-slate-900 focus:border-blue-500 shadow-sm';
    const cardClass = isDark ? 'bg-slate-800/30 border-slate-700' : 'bg-white border-slate-200 shadow-sm';

    return (
        <div className="space-y-6">
            {/* NAME */}
            <div className="space-y-2">
                <label className={`text-xs font-bold uppercase tracking-wider ${labelClass}`}>Ad Name</label>
                <input
                    type="text"
                    value={data.name || ''}
                    onChange={(e) => onChange({ name: e.target.value })}
                    className={`w-full border rounded-lg p-2.5 outline-none transition-colors ${inputClass}`}
                    placeholder="Ad Name"
                />
            </div>

            {/* IDENTITY */}
            <div className="space-y-2">
                <label className={`text-xs font-bold uppercase tracking-wider ${labelClass}`}>Identity</label>
                <div className={`p-3 rounded-lg text-sm border flex items-center justify-between ${isDark ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                    <span>Selected Page: <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>BSocial Demo Page</span></span>
                </div>
            </div>

            {/* CREATIVE */}
            <div className={`p-5 rounded-xl border space-y-5 ${cardClass}`}>
                <h3 className={`font-semibold border-b pb-3 ${isDark ? 'text-slate-200 border-slate-700' : 'text-slate-800 border-slate-100'}`}>Ad Creative</h3>

                {/* PRIMARY TEXT */}
                <div className="space-y-2">
                    <label className={`text-xs font-bold uppercase tracking-wider ${labelClass}`}>Primary Text</label>
                    <textarea
                        rows={3}
                        value={creativeSpec.body || ''}
                        onChange={(e) => updateCreative('body', e.target.value)}
                        className={`w-full border rounded-lg p-2.5 text-sm outline-none resize-none ${inputClass}`}
                        placeholder="Tell people what your ad is about..."
                    />
                </div>

                {/* HEADLINE */}
                <div className="space-y-2">
                    <label className={`text-xs font-bold uppercase tracking-wider ${labelClass}`}>Headline</label>
                    <input
                        type="text"
                        value={creativeSpec.title || ''}
                        onChange={(e) => updateCreative('title', e.target.value)}
                        className={`w-full border rounded-lg p-2.5 text-sm outline-none ${inputClass}`}
                        placeholder="Chat with us"
                    />
                </div>

                {/* DESTINATION */}
                <div className="space-y-2">
                    <label className={`text-xs font-bold uppercase tracking-wider ${labelClass}`}>Website URL</label>
                    <input
                        type="url"
                        value={creativeSpec.object_story_spec?.link_data?.link || creativeSpec.link_url || ''}
                        onChange={(e) => updateCreative('link_url', e.target.value)}
                        className={`w-full border rounded-lg p-2.5 text-sm outline-none ${inputClass}`}
                        placeholder="https://example.com"
                    />
                </div>

                {/* MEDIA */}
                <div className="space-y-2">
                    <label className={`text-xs font-bold uppercase tracking-wider ${labelClass}`}>Media</label>
                    {creativeSpec.image_url ? (
                        <div className={`relative group rounded-lg overflow-hidden border ${isDark ? 'border-slate-700' : 'border-slate-200 shadow-sm'}`}>
                            <img src={creativeSpec.image_url} alt="Ad Media" className="w-full h-48 object-cover" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button
                                    onClick={() => updateCreative('image_url', null)}
                                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg"
                                >
                                    Remove Media
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${isDark ? 'border-slate-700 hover:border-blue-500 hover:bg-slate-800' : 'border-slate-300 hover:border-blue-500 hover:bg-slate-50'}`}>
                            {uploading ? (
                                <span className={labelClass}>Uploading...</span>
                            ) : (
                                <label className="cursor-pointer flex flex-col items-center gap-2">
                                    <div className={`p-3 rounded-full ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}>
                                        <Upload size={20} className="text-blue-500" />
                                    </div>
                                    <div>
                                        <span className="text-blue-500 font-bold hover:underline">Click to upload</span>
                                        <span className={labelClass}> or drag and drop</span>
                                    </div>
                                    <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>PNG, JPG up to 10MB</p>
                                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                                </label>
                            )}
                        </div>
                    )}
                </div>

                {/* AI GENERATION OPTION */}
                {!creativeSpec.image_url && (
                    <div className="flex justify-center">
                        <button
                            onClick={() => setAIStudioOpen(true)}
                            className={`flex items-center gap-2 text-xs font-bold px-5 py-2.5 rounded-full border transition-all ${isDark
                                    ? 'text-purple-400 bg-purple-500/10 border-purple-500/20 hover:border-purple-500/50 hover:bg-purple-500/20'
                                    : 'text-purple-600 bg-purple-50 border-purple-100 hover:border-purple-200 hover:bg-purple-100'
                                }`}
                        >
                            <Sparkles size={14} /> Generate with AI Creative Studio
                        </button>
                    </div>
                )}

                {/* AI Studio Component for Ad Level */}
                <AICreativeStudio
                    isOpen={isAIStudioOpen}
                    onClose={() => setAIStudioOpen(false)}
                    initialImage={creativeSpec.image_url}
                    initialPrompt={creativeSpec.body || "High converting ad creative..."}
                />
            </div>

            {/* CALL TO ACTION */}
            <div className="space-y-2">
                <label className={`text-xs font-bold uppercase tracking-wider ${labelClass}`}>Call to Action</label>
                <select
                    value={creativeSpec.call_to_action_type || 'LEARN_MORE'}
                    onChange={(e) => updateCreative('call_to_action_type', e.target.value)}
                    className={`w-full border rounded-lg p-2.5 text-sm outline-none ${inputClass}`}
                >
                    <option value="LEARN_MORE">Learn More</option>
                    <option value="SHOP_NOW">Shop Now</option>
                    <option value="SIGN_UP">Sign Up</option>
                    <option value="CONTACT_US">Contact Us</option>
                    <option value="APPLY_NOW">Apply Now</option>
                </select>
            </div>

            {/* TRACKING */}
            <div className={`pt-5 border-t space-y-3 ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
                <label className={`text-xs font-bold uppercase tracking-wider ${labelClass}`}>Tracking</label>
                <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded flex items-center justify-center border ${isDark ? 'bg-slate-800 border-slate-600' : 'bg-blue-50 border-blue-200'}`}>
                        <div className="w-2.5 h-2.5 bg-blue-500 rounded-sm" />
                    </div>
                    <span className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Website Events (Pixel)</span>
                </div>
                <div className="text-xs pl-8 text-slate-400">
                    BSocial Default Pixel (ID: 123456789)
                </div>
            </div>
        </div>
    );
};
