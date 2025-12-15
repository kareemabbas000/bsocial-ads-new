import React from 'react';
import { Settings, Key, Save, Copy, Check } from 'lucide-react';
import { Theme } from '../../types';

interface SystemConfigurationProps {
    theme: Theme;
    metaToken: string;
    setMetaToken: (token: string) => void;
    enableGoogleAuth: boolean;
    toggleGoogleAuth: () => void;
    enableRouter: boolean;
    toggleRouter: () => void;
    onSaveToken: () => void;
}

const SystemConfiguration: React.FC<SystemConfigurationProps> = ({
    theme,
    metaToken,
    setMetaToken,
    enableGoogleAuth,
    toggleGoogleAuth,
    enableRouter,
    toggleRouter,
    onSaveToken
}) => {
    const isDark = theme === 'dark';
    const cardClass = isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200';
    const textClass = isDark ? 'text-white' : 'text-slate-900';
    const inputClass = isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900';

    const [copied, setCopied] = React.useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(metaToken);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className={`p-5 rounded-2xl border mb-8 shadow-sm ${cardClass}`}>
            <div className="flex flex-col gap-6">
                <div>
                    <h3 className={`text-lg font-bold flex items-center mb-1 ${textClass}`}>
                        <Settings size={20} className="mr-2 text-brand-500" />
                        System Configuration
                    </h3>
                    <p className="text-xs text-slate-500">Global settings applied to the entire application instance.</p>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    {/* Toggles Group */}
                    <div className={`p-4 rounded-xl border flex flex-col justify-center gap-4 h-full ${isDark ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-50 border-slate-200/60'}`}>
                        {/* Google Auth Toggle */}
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-slate-500 uppercase tracking-wide">Google Sign Up</span>
                            <div
                                className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${enableGoogleAuth ? 'bg-brand-500' : 'bg-slate-600'}`}
                                onClick={toggleGoogleAuth}
                            >
                                <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${enableGoogleAuth ? 'translate-x-6' : 'translate-x-0'}`} />
                            </div>
                        </div>

                        {/* React Router Toggle */}
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-slate-500 uppercase tracking-wide">Links Router</span>
                            <div
                                className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${enableRouter ? 'bg-brand-500' : 'bg-slate-600'}`}
                                onClick={toggleRouter}
                            >
                                <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${enableRouter ? 'translate-x-6' : 'translate-x-0'}`} />
                            </div>
                        </div>
                    </div>

                    {/* Meta Token Section - Spans 2 cols on large screens */}
                    <div className="md:col-span-1 lg:col-span-2 flex flex-col gap-2">
                        <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                            <Key size={14} /> Global Meta Access Token
                        </label>
                        <div className="flex gap-2">
                            <div className="relative flex-1 group">
                                <input
                                    type="password"
                                    value={metaToken}
                                    onChange={(e) => setMetaToken(e.target.value)}
                                    className={`w-full pl-4 pr-10 py-2.5 rounded-xl border text-sm font-mono transition-all focus:ring-2 focus:ring-brand-500/20 ${inputClass}`}
                                    placeholder="Enter generic access token..."
                                />
                                <button
                                    onClick={handleCopy}
                                    className="absolute right-2 top-2 p-1 text-slate-400 hover:text-brand-500 transition-colors bg-transparent border-0"
                                    title="Copy Token"
                                >
                                    {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                                </button>
                            </div>
                            <button
                                onClick={onSaveToken}
                                className="bg-brand-600 hover:bg-brand-500 text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center shadow-lg shadow-brand-500/20 active:scale-95 transition-all whitespace-nowrap"
                            >
                                <Save size={16} className="mr-2" /> Save
                            </button>
                        </div>
                        <p className="text-[10px] text-slate-400 pl-1">
                            This token is used for system-wide operations and account fetching. Ensure it has valid permissions.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SystemConfiguration;
