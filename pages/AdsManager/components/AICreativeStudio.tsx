import React, { useState, useEffect } from 'react';
import { X, Sparkles, Image as ImageIcon, Copy, RefreshCw, Wand2, Star, ChevronRight, Search, CheckCircle, Download as ImageDown } from 'lucide-react';
import { useAdsManager } from '../context/AdsManagerContext';

interface AICreativeStudioProps {
    isOpen: boolean;
    onClose: () => void;
    initialPrompt?: string;
    initialImage?: string | null;
    availableAds?: any[]; // Optional list of ads to import from
}

const MOMENTUM_IMAGES = [
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80",
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80",
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80",
    "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&q=80"
];

export const AICreativeStudio: React.FC<AICreativeStudioProps> = ({ isOpen, onClose, initialPrompt = '', initialImage, availableAds = [] }) => {
    const [prompt, setPrompt] = useState(initialPrompt);
    const [selectedStyle, setSelectedStyle] = useState('Photorealistic');
    const [generatedImages, setGeneratedImages] = useState<string[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [activeTab, setActiveTab] = useState<'create' | 'variations'>('create');

    // Ad Selector State
    const [isSelectorOpen, setSelectorOpen] = useState(false);
    const [sourceImage, setSourceImage] = useState<string | null>(initialImage || null);

    useEffect(() => {
        if (isOpen) {
            setPrompt(initialPrompt);
            setSourceImage(initialImage || null);
        }
    }, [isOpen, initialPrompt, initialImage]);

    // ... generator logic ...
    const generateCreative = async () => {
        setIsGenerating(true);
        // Simulate AI "Thinking"
        setTimeout(() => {
            const randomImg = MOMENTUM_IMAGES[Math.floor(Math.random() * MOMENTUM_IMAGES.length)];
            setGeneratedImages(prev => [randomImg, ...prev]);
            setIsGenerating(false);
        }, 3000);
    };

    if (!isOpen) return null;

    const { theme } = useAdsManager();
    const isDark = theme === 'dark';

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm transition-all duration-300">
            <div className={`
                w-full h-full md:max-w-4xl md:h-[80vh] md:max-h-[750px] md:rounded-2xl shadow-2xl border-0 md:border overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200
                ${isDark ? 'bg-slate-950 border-purple-500/20 shadow-[0_0_50px_rgba(168,85,247,0.15)]' : 'bg-white border-slate-200'}
            `}>

                {/* Header */}
                <div className={`
                    h-14 flex items-center justify-between px-6 border-b flex-shrink-0
                    ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-100'}
                `}>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                            <Sparkles className="text-white" size={16} />
                        </div>
                        <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            AI Creative Studio
                        </h2>
                    </div>
                    <button onClick={onClose} className={`p-2 rounded-full transition-colors ${isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'}`}>
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col md:flex-row overflow-hidden">

                    {/* SIDEBAR - CONTROLS */}
                    <div className={`
                        w-full md:w-80 border-b md:border-b-0 md:border-r flex flex-col overflow-hidden
                        ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'}
                    `}>
                        <div className="flex-1 overflow-y-auto p-5 space-y-6">

                            {/* Source Image - Compact */}
                            <div className="space-y-2">
                                <label className={`text-[10px] font-bold uppercase tracking-wider flex justify-between items-center ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                    Reference Image
                                    {availableAds.length > 0 && (
                                        <button
                                            onClick={() => setSelectorOpen(true)}
                                            className="text-purple-500 hover:text-purple-400 flex items-center gap-1"
                                        >
                                            <Search size={10} /> Browse
                                        </button>
                                    )}
                                </label>

                                {sourceImage ? (
                                    <div className="relative group rounded-lg overflow-hidden h-24 border border-slate-700 bg-slate-900">
                                        <img src={sourceImage} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" alt="Source" />
                                        <button
                                            onClick={() => setSourceImage(null)}
                                            className="absolute top-1 right-1 bg-black/60 text-white p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                ) : (
                                    <div
                                        onClick={() => availableAds.length > 0 && setSelectorOpen(true)}
                                        className={`
                                            h-16 w-full rounded-lg border-2 border-dashed flex items-center justify-center gap-2 cursor-pointer transition-all
                                            ${isDark
                                                ? 'border-slate-800 hover:border-purple-500/50 hover:bg-slate-800/50 text-slate-500'
                                                : 'border-slate-200 hover:border-purple-300 hover:bg-purple-50 text-slate-400'
                                            }
                                        `}
                                    >
                                        <ImageIcon size={16} />
                                        <span className="text-xs font-medium">Add Reference</span>
                                    </div>
                                )}
                            </div>

                            {/* Prompt Input */}
                            <div className="space-y-2">
                                <label className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Prompt</label>
                                <textarea
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    className={`
                                        w-full rounded-xl p-3 text-sm outline-none min-h-[120px] resize-none border transition-all
                                        ${isDark
                                            ? 'bg-slate-950 border-slate-800 text-slate-200 placeholder-slate-600 focus:border-purple-500'
                                            : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus:border-purple-400 focus:ring-4 focus:ring-purple-50'
                                        }
                                    `}
                                    placeholder="Describe the ad creative you want to generate..."
                                />
                            </div>

                            {/* Styles */}
                            <div className="space-y-2">
                                <label className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Style Preset</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {['Photorealistic', '3D Render', 'Minimalist', 'Neon'].map(style => (
                                        <button
                                            key={style}
                                            onClick={() => setSelectedStyle(style)}
                                            className={`
                                                px-3 py-2 text-xs font-medium rounded-lg border text-left transition-all
                                                ${selectedStyle === style
                                                    ? 'border-purple-600 bg-purple-600 text-white shadow-md shadow-purple-500/20'
                                                    : (isDark
                                                        ? 'border-slate-800 text-slate-400 hover:bg-slate-800 bg-slate-900/50'
                                                        : 'border-slate-200 text-slate-600 hover:bg-slate-50 bg-white')
                                                }
                                            `}
                                        >
                                            {style}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Generate Button Footer */}
                        <div className={`p-5 border-t ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-100 bg-white'}`}>
                            <button
                                onClick={generateCreative}
                                disabled={isGenerating || !prompt}
                                className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-purple-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all active:scale-95"
                            >
                                {isGenerating ? <RefreshCw className="animate-spin" size={18} /> : <Wand2 size={18} />}
                                {isGenerating ? 'Generating...' : 'Generate Variations'}
                            </button>
                        </div>
                    </div>

                    {/* Canvas Area */}
                    <div className={`flex-1 p-6 md:p-10 overflow-y-auto ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
                        {generatedImages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center gap-6 opacity-60">
                                <div className={`
                                    w-32 h-32 rounded-full border-2 border-dashed flex items-center justify-center animate-pulse
                                    ${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-white/50'}
                                `}>
                                    <Sparkles size={40} className={isDark ? 'text-slate-700' : 'text-slate-300'} />
                                </div>
                                <div className="text-center max-w-sm">
                                    <p className={`text-lg font-bold mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>AI Canvas Empty</p>
                                    <p className={`text-sm ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                                        Select a style and enter a prompt to start generating high-converting ad creatives.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-10">
                                {generatedImages.map((img, idx) => (
                                    <div key={idx} className={`group relative aspect-video rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 ${isDark ? 'bg-slate-900 ring-1 ring-white/10' : 'bg-white ring-1 ring-black/5'}`}>
                                        <img src={img} alt="AI Generated" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />

                                        {/* Actions Overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-mono text-white/80 bg-black/50 px-2 py-1 rounded backdrop-blur-md border border-white/10">
                                                    V{generatedImages.length - idx}
                                                </span>
                                                <div className="flex gap-2">
                                                    <button className="p-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-lg text-white transition-colors border border-white/10" title="Download">
                                                        <ImageDown size={16} />
                                                    </button>
                                                    <button className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-lg" title="Use This">
                                                        <CheckCircle size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
