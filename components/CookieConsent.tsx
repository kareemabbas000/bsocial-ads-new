import React, { useState, useEffect } from 'react';
import { Cookie, X, ShieldCheck, ChevronDown, ChevronUp, Settings, Check } from 'lucide-react';
import { Theme } from '../types';

interface CookieConsentProps {
    theme: Theme;
}

interface CookiePreferences {
    essential: boolean;
    analytics: boolean;
    marketing: boolean;
    timestamp?: string;
}

const CookieConsent: React.FC<CookieConsentProps> = ({ theme }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [preferences, setPreferences] = useState<CookiePreferences>({
        essential: true,
        analytics: false,
        marketing: false,
    });

    const isDark = theme === 'dark';

    useEffect(() => {
        const saved = localStorage.getItem('cookie_consent_data');
        if (!saved) {
            // Delay slightly for smooth entrance
            const timer = setTimeout(() => setIsVisible(true), 1000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAcceptAll = () => {
        const newPrefs = { essential: true, analytics: true, marketing: true, timestamp: new Date().toISOString() };
        savePreferences(newPrefs);
    };

    const handleRejectAll = () => {
        const newPrefs = { essential: true, analytics: false, marketing: false, timestamp: new Date().toISOString() };
        savePreferences(newPrefs);
    };

    const handleSavePreferences = () => {
        savePreferences({ ...preferences, timestamp: new Date().toISOString() });
    };

    const savePreferences = (prefs: CookiePreferences) => {
        localStorage.setItem('cookie_consent_data', JSON.stringify(prefs));
        // Also keep the simple key for legacy/simple checks
        localStorage.setItem('cookie_consent', 'accepted');
        setIsVisible(false);
    };

    const togglePreference = (key: keyof CookiePreferences) => {
        if (key === 'essential') return; // Locked
        setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
    };

    useEffect(() => {
        if (showDetails) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [showDetails]);

    if (!isVisible) return null;

    return (
        <div className={`
            fixed bottom-4 left-4 right-4 md:bottom-6 md:left-6 md:right-auto md:w-full md:max-w-md z-[200]
            flex justify-center md:block
            animate-in slide-in-from-bottom duration-700 fade-in
        `}>
            {/* Backdrop for Details Mode */}
            {showDetails && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[-1] transition-opacity duration-500"
                    onClick={() => setShowDetails(false)}
                />
            )}
            <div className={`
                w-full transition-all duration-300
                ${showDetails ? 'max-w-xl rounded-2xl shadow-2xl' : 'max-w-md rounded-2xl shadow-xl'}
                border backdrop-blur-xl flex flex-col relative overflow-hidden
                ${isDark
                    ? 'bg-[#0f172a]/95 border-slate-700/50 shadow-black/50'
                    : 'bg-white/95 border-white/50 shadow-slate-200/50'
                }
            `}>
                {/* Mobile Drag Handle (Visual Only) */}
                {
                    showDetails && (
                        <div className="md:hidden flex justify-center pt-3 pb-1 w-full" onClick={() => setShowDetails(false)}>
                            <div className={`w-12 h-1.5 rounded-full ${isDark ? 'bg-slate-700' : 'bg-slate-300'}`}></div>
                        </div>
                    )
                }

                {/* Main Banner Content */}
                <div className="p-4 md:p-5">
                    <div className="flex flex-col md:flex-col items-start gap-4 md:gap-4">
                        {/* Icon & title */}
                        <div className="flex items-start gap-3 flex-1 w-full">
                            <div className={`
                                p-3 rounded-xl flex-shrink-0 shadow-lg
                                ${isDark ? 'bg-indigo-500/10 text-indigo-400 shadow-indigo-900/20' : 'bg-indigo-50 text-indigo-600 shadow-indigo-100'}
                            `}>
                                <Cookie size={24} strokeWidth={1.5} />
                            </div>
                            <div className="flex-1">
                                <h3 className={`font-bold text-base mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                    Cookie Preferences
                                </h3>
                                <p className={`text-xs md:text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                                    We respect your privacy. Choose tailored ad experiences or stick to the essentials.
                                    {!showDetails && (
                                        <button
                                            onClick={() => setShowDetails(true)}
                                            className="text-xs font-semibold ml-1.5 underline decoration-dashed underline-offset-4 hover:text-indigo-500 transition-colors"
                                        >
                                            Preferences
                                        </button>
                                    )}
                                </p>
                            </div>
                        </div>

                        {/* Primary Buttons - Stacked on Mobile, Row on Desktop? No, let's make it compact. */}
                        {!showDetails && (
                            <div className="flex w-full gap-2 mt-1">
                                <button
                                    onClick={handleAcceptAll}
                                    className={`
                                        flex-1 py-2.5 rounded-lg font-bold text-xs transition-all text-white shadow-lg
                                        bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500
                                        shadow-indigo-500/25 hover:shadow-indigo-500/40 transform hover:-translate-y-0.5
                                    `}
                                >
                                    Accept All
                                </button>
                                <button
                                    onClick={() => setShowDetails(true)}
                                    className={`
                                        px-4 py-2.5 rounded-lg font-semibold text-xs transition-all border
                                        ${isDark
                                            ? 'border-white/10 text-slate-400 hover:bg-white/5'
                                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                                        }
                                    `}
                                >
                                    More
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Expanded Details / Preferences Drawer */}
                {
                    showDetails && (
                        <div className={`
                        border-t px-6 py-6 space-y-4 animate-in slide-in-from-bottom-4 duration-500
                        ${isDark ? 'border-white/5 bg-black/20' : 'border-slate-100 bg-slate-50/50'}
                    `}>
                            {/* Toggle Items */}
                            <div className="grid gap-4">
                                {/* Essential */}
                                <div className={`p-4 rounded-xl border flex items-center justify-between opacity-80 ${isDark ? 'border-white/5 bg-white/5' : 'border-slate-200 bg-white'}`}>
                                    <div>
                                        <div className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>Essential & Security</div>
                                        <div className={`text-xs mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Required for the app to function. Cannot be disabled.</div>
                                    </div>
                                    <div className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-bold border border-emerald-500/20">
                                        ALWAYS ON
                                    </div>
                                </div>

                                {/* Analytics */}
                                <div
                                    onClick={() => togglePreference('analytics')}
                                    className={`
                                    p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all
                                    ${preferences.analytics
                                            ? (isDark ? 'border-indigo-500/50 bg-indigo-500/10' : 'border-indigo-200 bg-indigo-50')
                                            : (isDark ? 'border-white/5 hover:border-white/10' : 'border-slate-200 hover:border-slate-300 bg-white')
                                        }
                                `}
                                >
                                    <div>
                                        <div className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>Analytics & Performance</div>
                                        <div className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Help us improve by measuring how you use the app.</div>
                                    </div>
                                    <div className={`
                                    w-12 h-6 rounded-full relative transition-colors duration-300
                                    ${preferences.analytics ? 'bg-indigo-500' : (isDark ? 'bg-slate-700' : 'bg-slate-300')}
                                `}>
                                        <div className={`
                                        absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 shadow-sm
                                        ${preferences.analytics ? 'left-7' : 'left-1'}
                                    `} />
                                    </div>
                                </div>

                                {/* Marketing */}
                                <div
                                    onClick={() => togglePreference('marketing')}
                                    className={`
                                    p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all
                                    ${preferences.marketing
                                            ? (isDark ? 'border-indigo-500/50 bg-indigo-500/10' : 'border-indigo-200 bg-indigo-50')
                                            : (isDark ? 'border-white/5 hover:border-white/10' : 'border-slate-200 hover:border-slate-300 bg-white')
                                        }
                                `}
                                >
                                    <div>
                                        <div className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>Marketing & Personalization</div>
                                        <div className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Tailored ads and content based on your interests.</div>
                                    </div>
                                    <div className={`
                                    w-12 h-6 rounded-full relative transition-colors duration-300
                                    ${preferences.marketing ? 'bg-indigo-500' : (isDark ? 'bg-slate-700' : 'bg-slate-300')}
                                `}>
                                        <div className={`
                                        absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 shadow-sm
                                        ${preferences.marketing ? 'left-7' : 'left-1'}
                                    `} />
                                    </div>
                                </div>
                            </div>

                            {/* Detailed Actions */}
                            <div className="flex flex-col sm:flex-row gap-3 pt-4 mt-4 border-t border-dashed border-slate-500/20">
                                <button
                                    onClick={handleRejectAll}
                                    className={`
                                    w-full py-3.5 rounded-xl font-semibold text-sm transition-all
                                    ${isDark ? 'text-slate-400 hover:bg-white/5' : 'text-slate-600 hover:bg-slate-100'}
                                `}
                                >
                                    Decline Optional
                                </button>
                                <button
                                    onClick={handleSavePreferences}
                                    className="w-full py-3.5 rounded-xl font-semibold text-sm text-white shadow-lg bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600"
                                >
                                    Save Preferences
                                </button>
                                <button
                                    onClick={handleAcceptAll}
                                    className="w-full py-3.5 rounded-xl font-semibold text-sm text-white shadow-lg bg-indigo-600 hover:bg-indigo-500"
                                >
                                    Accept All
                                </button>
                            </div>
                        </div>
                    )
                }
            </div >
        </div >
    );
};

export default CookieConsent;
