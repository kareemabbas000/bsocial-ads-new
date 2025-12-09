import React, { useState } from 'react';
import { Image, Video, Upload, Layout } from 'lucide-react';
import { CreativeAsset, CallToAction } from '../../../../types';

interface AdStepProps {
    data: any;
    updateData: (data: any) => void;
    errors?: Record<string, string>;
}

export const AdStep: React.FC<AdStepProps> = ({ data, updateData, errors }) => {
    const [activeTab, setActiveTab] = useState<'create' | 'existing'>('create');

    // handlers for file upload would go here (using createCreative/uploadImage service)
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        // mock upload logic
        console.log("File selected", e.target.files);
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">

            {/* 1. AD NAME */}
            <div className="space-y-4">
                <label className="block text-sm font-medium text-slate-200">Ad Name</label>
                <input
                    type="text"
                    value={data.name || ''}
                    onChange={(e) => updateData({ ...data, name: e.target.value })}
                    placeholder="e.g., Summer Sale - Variant A"
                    className={`w-full bg-slate-800 border ${errors?.name ? 'border-red-500' : 'border-slate-700'} rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none`}
                />
            </div>

            {/* 2. FORMAT */}
            <div className="space-y-4">
                <label className="block text-sm font-medium text-slate-200">Format</label>
                <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={() => updateData({ ...data, format: 'IMAGE' })}
                        className={`p-4 border rounded-xl flex flex-col items-center gap-2 transition-all ${data.format === 'IMAGE' || !data.format
                                ? 'border-blue-500 bg-blue-500/10 text-white'
                                : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600'
                            }`}
                    >
                        <Image size={24} />
                        <span className="font-medium">Single Image/Video</span>
                    </button>
                    <button
                        onClick={() => updateData({ ...data, format: 'CAROUSEL' })}
                        className={`p-4 border rounded-xl flex flex-col items-center gap-2 transition-all ${data.format === 'CAROUSEL'
                                ? 'border-blue-500 bg-blue-500/10 text-white'
                                : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600'
                            }`}
                    >
                        <Layout size={24} />
                        <span className="font-medium">Carousel</span>
                    </button>
                </div>
            </div>

            {/* 3. AD CREATIVE */}
            <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 space-y-6">
                <h3 className="text-lg font-semibold text-white">Ad Creative</h3>

                {/* Media Upload */}
                <div className="space-y-3">
                    <label className="text-sm font-medium text-slate-300">Media</label>
                    <div className="border-2 border-dashed border-slate-700 rounded-xl p-8 flex flex-col items-center justify-center gap-3 hover:border-blue-500/50 hover:bg-slate-800 transition-all cursor-pointer relative">
                        <input
                            type="file"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={handleFileUpload}
                            accept="image/*,video/*"
                        />
                        <div className="p-3 bg-slate-700/50 rounded-full">
                            <Upload size={24} className="text-blue-400" />
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-medium text-white">Upload image or video</p>
                            <p className="text-xs text-slate-400">or drag and drop</p>
                        </div>
                    </div>
                </div>

                {/* Primary Text */}
                <div className="space-y-3">
                    <label className="text-sm font-medium text-slate-300">Primary Text</label>
                    <textarea
                        rows={3}
                        placeholder="Tell people what your ad is about..."
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                        value={data.creative?.link_data?.message || ''}
                        onChange={(e) => updateData({
                            ...data,
                            creative: {
                                ...data.creative,
                                link_data: { ...(data.creative?.link_data || {}), message: e.target.value }
                            }
                        })}
                    />
                </div>

                {/* Headline */}
                <div className="space-y-3">
                    <label className="text-sm font-medium text-slate-300">Headline</label>
                    <input
                        type="text"
                        placeholder="Write a short headline..."
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        value={data.creative?.link_data?.name || ''}
                        onChange={(e) => updateData({
                            ...data,
                            creative: {
                                ...data.creative,
                                link_data: { ...(data.creative?.link_data || {}), name: e.target.value }
                            }
                        })}
                    />
                </div>

                {/* Call to Action */}
                <div className="space-y-3">
                    <label className="text-sm font-medium text-slate-300">Call to Action</label>
                    <select
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white outline-none"
                        value={data.creative?.link_data?.call_to_action?.type || 'LEARN_MORE'}
                        onChange={(e) => {
                            // Deep merge logic simplified
                            const newData = { ...data };
                            if (!newData.creative) newData.creative = {};
                            if (!newData.creative.link_data) newData.creative.link_data = {};
                            if (!newData.creative.link_data.call_to_action) newData.creative.link_data.call_to_action = { value: { link: '' } };
                            newData.creative.link_data.call_to_action.type = e.target.value as CallToAction;
                            updateData(newData);
                        }}
                    >
                        <option value="LEARN_MORE">Learn More</option>
                        <option value="SHOP_NOW">Shop Now</option>
                        <option value="SIGN_UP">Sign Up</option>
                        <option value="CONTACT_US">Contact Us</option>
                        <option value="APPLY_NOW">Apply Now</option>
                        <option value="BOOK_NOW">Book Now</option>
                    </select>
                </div>
            </div>
        </div>
    );
};
