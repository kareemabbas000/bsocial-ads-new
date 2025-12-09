import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';

interface SmartLoaderProps {
    loading: boolean;
    messages?: string[];
}

const SmartLoader: React.FC<SmartLoaderProps> = ({
    loading,
    messages = [
        "Connecting to Neural Network...",
        "Aggregating Global Data...",
        "Analyzing Creative Patterns...",
        "Optimizing Insight Delivery..."
    ]
}) => {
    const [messageIndex, setMessageIndex] = useState(0);

    useEffect(() => {
        if (!loading) {
            setMessageIndex(0);
            return;
        }

        const interval = setInterval(() => {
            setMessageIndex(prev => (prev + 1) % messages.length);
        }, 1200);

        return () => clearInterval(interval);
    }, [loading, messages]);

    if (!loading) return null;

    return (
        <div className="absolute inset-0 z-[50] flex flex-col items-center justify-center bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm animate-fade-in">
            <div className="relative">
                {/* Pulsing Orb */}
                <div className="w-16 h-16 rounded-full bg-brand-500/20 animate-ping absolute inset-0"></div>
                <div className="w-16 h-16 rounded-full bg-brand-500/10 animate-pulse delay-75 absolute inset-0"></div>

                {/* Icon Circle */}
                <div className="relative w-16 h-16 rounded-full bg-gradient-to-tr from-brand-600 to-purple-600 flex items-center justify-center shadow-lg shadow-brand-500/30">
                    <Sparkles className="text-white w-8 h-8 animate-spin-slow" />
                </div>
            </div>

            {/* Smart Message */}
            <div className="mt-8 text-center max-w-xs">
                <div className="h-6 overflow-hidden relative">
                    <p className="text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-600 to-purple-600 dark:from-brand-400 dark:to-purple-400 animate-slide-up-fade" key={messageIndex}>
                        {messages[messageIndex]}
                    </p>
                </div>
                <div className="mt-2 flex justify-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600 animate-bounce delay-0"></span>
                    <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600 animate-bounce delay-100"></span>
                    <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600 animate-bounce delay-200"></span>
                </div>
            </div>
        </div>
    );
};

export default SmartLoader;
