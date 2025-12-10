import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Sparkles, Send, Bot, FileText, ChevronRight, BarChart3, AlertTriangle, TrendingUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useAdsManager } from '../context/AdsManagerContext';
import { analyzeCampaignPerformance } from '../../../services/aiService';

interface CampaignStrategistProps {
    isOpen: boolean;
    onClose: () => void;
    initialPrompt?: string; // If opened from Analyst
    data?: any[]; // Full campaign data
}

export const CampaignStrategist: React.FC<CampaignStrategistProps> = ({ isOpen, onClose, initialPrompt, data = [] }) => {
    const { theme } = useAdsManager();
    const isDark = theme === 'dark';

    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<{ role: 'user' | 'ai'; content: string }[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [strategyDoc, setStrategyDoc] = useState<string | null>(null);

    // Auto-Run Analysis on Open
    useEffect(() => {
        if (isOpen && data.length > 0 && !strategyDoc) {
            runInitialAnalysis();
        }
    }, [isOpen, data]);

    const runInitialAnalysis = async () => {
        setIsAnalyzing(true);
        try {
            // Flatten generic data to Campaign[] type if needed, or pass directly
            // For now assuming data is compatible with analyzeCampaignPerformance
            const result = await analyzeCampaignPerformance(data);
            setStrategyDoc(result.analysis);
            setMessages([{ role: 'ai', content: "I've analyzed your account. Here is your executive strategy document." }]);

            // If there was an initial prompt from Analyst, handle it *after* strategy
            if (initialPrompt) {
                // Logic to handle specific question could be added here
            }
        } catch (e) {
            setStrategyDoc("Failed to generate strategy. Please try again.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleSend = () => {
        if (!input.trim()) return;
        const newMsg = { role: 'user' as const, content: input };
        setMessages(prev => [...prev, newMsg]);
        setInput('');

        // Mock Chat Response for now (Integrate full chat service later)
        setTimeout(() => {
            setMessages(prev => [...prev, { role: 'ai', content: "I'm focusing on the strategy document above. Based on the data, I recommend prioritizing the 'Scale Candidates' identified." }]);
        }, 1000);
    };

    if (!isOpen) return null;

    if (typeof document === 'undefined') return null;

    return createPortal(
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm md:p-4 animate-in fade-in duration-200">
            <div className={`
                w-full h-full md:max-w-4xl md:h-[80vh] md:max-h-[700px]
                md:rounded-2xl shadow-2xl border-0 md:border flex flex-col overflow-hidden 
                transition-all duration-300 transform
                ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}
            `}>

                {/* HEADER */}
                <div className={`h-14 px-5 border-b flex items-center justify-between shrink-0 ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                    <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-lg ${isDark ? 'bg-purple-600' : 'bg-purple-600'}`}>
                            <Bot size={18} className="text-white" />
                        </div>
                        <div>
                            <h2 className={`text-base font-bold leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                Campaign Strategist
                            </h2>
                            <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                Data-Driven Executive Planning
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className={`p-1.5 rounded-full transition-colors ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-200 text-slate-500'}`}>
                        <X size={18} />
                    </button>
                </div>

                {/* CONTENT GRID */}
                <div className="flex-1 flex flex-col md:flex-row overflow-hidden">

                    {/* LEFT PANEL: CHAT / CONTROLS (30% on desktop, Top on mobile) */}
                    <div className={`w-full md:w-80 border-b md:border-b-0 md:border-r flex flex-col order-2 md:order-1 ${isDark ? 'bg-slate-900/30 border-slate-800' : 'bg-slate-50/50 border-slate-200'}`}>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[200px] md:max-h-none">
                            {messages.map((msg, i) => (
                                <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'ai'
                                        ? (isDark ? 'bg-purple-600' : 'bg-purple-600')
                                        : (isDark ? 'bg-slate-700' : 'bg-slate-300')
                                        }`}>
                                        {msg.role === 'ai' ? <Bot size={14} className="text-white" /> : <span className="text-xs font-bold">You</span>}
                                    </div>
                                    <div className={`p-3 rounded-2xl text-sm max-w-[85%] ${msg.role === 'ai'
                                        ? (isDark ? 'bg-slate-800 text-slate-200' : 'bg-white text-slate-700 shadow-sm')
                                        : (isDark ? 'bg-purple-600 text-white' : 'bg-purple-600 text-white')
                                        }`}>
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                            {isAnalyzing && (
                                <div className="flex items-center gap-3 text-sm text-purple-500 animate-pulse px-4">
                                    <Sparkles size={14} /> Analyzing account metrics...
                                </div>
                            )}
                        </div>

                        {/* INPUT */}
                        <div className={`p-4 border-t ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder="Ask about strategy..."
                                    className={`w-full pl-4 pr-12 py-3 rounded-xl text-sm outline-none border transition-all placeholder:text-slate-500 ${isDark
                                        ? 'bg-slate-800 border-slate-700 text-white focus:border-purple-500'
                                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-purple-500'
                                        }`}
                                />
                                <button
                                    onClick={handleSend}
                                    className="absolute right-2 top-2 p-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors"
                                >
                                    <Send size={16} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT PANEL: STRATEGY DOCUMENT (70% on desktop, Main view on mobile) */}
                    <div className={`flex-1 flex flex-col overflow-hidden order-1 md:order-2 ${isDark ? 'bg-slate-950' : 'bg-white'}`}>
                        {strategyDoc ? (
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                                <div className={`prose prose-sm max-w-none ${isDark
                                    ? 'prose-invert prose-p:text-slate-300 prose-headings:text-white prose-strong:text-white prose-li:text-slate-300 text-slate-300'
                                    : 'prose-slate'}`}>
                                    <ReactMarkdown>{strategyDoc}</ReactMarkdown>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 opacity-50">
                                <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                                    <FileText size={40} className={isDark ? 'text-slate-600' : 'text-slate-400'} />
                                </div>
                                <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>No Strategy Generated Yet</h3>
                                <p className={`max-w-md ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                                    The AI is analyzing your historical data to generate a comprehensive execution plan.
                                </p>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>,
        document.body
    );
};
