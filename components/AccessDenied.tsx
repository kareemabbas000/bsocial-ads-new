import React, { useState, useEffect } from 'react';
import { Mail, LogOut, ShieldCheck, Lock, ChevronRight } from 'lucide-react';
import { Theme } from '../types';

interface AccessDeniedProps {
    theme: Theme;
    onContactSupport: () => void;
    onLogout?: () => void;
}

const AccessDenied: React.FC<AccessDeniedProps> = ({ theme, onContactSupport, onLogout }) => {
    const isDark = theme === 'dark';
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePosition({
                x: (e.clientX / window.innerWidth) * 100,
                y: (e.clientY / window.innerHeight) * 100,
            });
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center overflow-hidden transition-colors duration-700 ${isDark ? 'bg-[#030712]' : 'bg-slate-50'}`}>

            {/* --- Enterprise Ambient Background --- */}
            <div className="absolute inset-0 z-0">
                {/* Grid Pattern */}
                <div
                    className={`absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]`}
                ></div>

                {/* Moving Spotlight Gradient (Brand Blue) */}
                <div
                    className={`absolute inset-0 opacity-40 transition-opacity duration-1000`}
                    style={{
                        background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, ${isDark ? '#2d7aff1a' : '#2d7aff10'}, transparent 25%)`
                    }}
                ></div>

                <div className={`absolute top-0 left-0 right-0 h-[500px] ${isDark ? 'bg-gradient-to-b from-brand-900/20 via-transparent to-transparent' : 'bg-gradient-to-b from-brand-100/40 via-transparent to-transparent'}`}></div>
            </div>

            {/* --- Main Glass Interface --- */}
            <div className={`relative z-10 w-full max-w-lg p-1 rounded-3xl animate-fade-in-up duration-700`}>

                {/* Border Gradient Container */}
                <div className={`absolute inset-0 rounded-3xl bg-gradient-to-b ${isDark ? 'from-white/10 to-transparent' : 'from-brand-200 to-transparent'} pointer-events-none`}></div>

                {/* Card Content */}
                <div className={`relative rounded-[22px] overflow-hidden backdrop-blur-2xl shadow-2xl transition-all duration-300 group ${isDark
                    ? 'bg-[#0f172a]/80 shadow-black/50 border border-white/5'
                    : 'bg-white/70 shadow-brand-500/5 border border-white/60'
                    }`}>

                    {/* Security Visualizer - Brand Aligned */}
                    <div className="relative h-40 flex items-center justify-center overflow-hidden border-b border-dashed border-slate-200/10">
                        <div className={`absolute inset-0 opacity-20 ${isDark ? 'bg-grid-white/[0.02]' : 'bg-grid-black/[0.02]'}`}></div>

                        {/* Animated Rings (Brand Colors) */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className={`w-64 h-64 rounded-full border border-dashed opacity-20 animate-spin-slow ${isDark ? 'border-brand-400' : 'border-brand-500'}`}></div>
                            <div className={`absolute w-48 h-48 rounded-full border border-dashed opacity-20 animate-reverse-spin-slow ${isDark ? 'border-brand-600' : 'border-brand-300'}`}></div>
                        </div>

                        {/* Central Icon - Brand Gradient */}
                        <div className="relative z-10 p-5 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 shadow-xl shadow-brand-500/20 animate-float">
                            <Lock className="text-white w-10 h-10" strokeWidth={1.5} />
                            <div className="absolute -top-1.5 -right-1.5 bg-emerald-500 rounded-full p-1 border-4 border-[#0f172a] shadow-lg">
                                <ShieldCheck size={12} className="text-white" strokeWidth={3} />
                            </div>
                        </div>
                    </div>

                    <div className="px-8 pb-10 pt-8 text-center bg-gradient-to-b from-transparent to-black/5">
                        <h1 className={`text-4xl font-bold tracking-tight mb-3 bg-clip-text text-transparent bg-gradient-to-r ${isDark ? 'from-white via-brand-100 to-brand-200' : 'from-brand-900 via-brand-700 to-brand-600'
                            }`}>
                            Account Pending
                        </h1>

                        <p className={`text-[15px] leading-relaxed mb-8 max-w-sm mx-auto font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                            Your account is currently pending approval from our team.
                            <span className={`block mt-3 text-xs font-mono py-1 px-3 rounded-full border inline-block ${isDark ? 'bg-brand-950/30 border-brand-900/50 text-brand-400' : 'bg-brand-50 border-brand-100 text-brand-600'}`}>
                                Your account is inactive
                            </span>
                        </p>

                        <div className="space-y-3">
                            {/* Primary Action - Brand Button */}
                            <button
                                onClick={onContactSupport}
                                className={`group relative w-full py-4 px-6 rounded-xl font-semibold text-sm tracking-wide overflow-hidden transition-all transform hover:scale-[1.01] active:scale-[0.99] shadow-lg ${isDark
                                    ? 'bg-white text-brand-950 hover:shadow-brand-500/20'
                                    : 'bg-brand-700 text-white hover:bg-brand-600 hover:shadow-brand-500/30'
                                    }`}
                            >
                                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer"></div>
                                <div className="flex items-center justify-center space-x-2 relative z-10">
                                    <Mail size={18} />
                                    <span>Contact BSocial Team</span>
                                    <ChevronRight size={16} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                                </div>
                            </button>

                            {/* Secondary Action: Logout */}
                            {onLogout && (
                                <button
                                    onClick={onLogout}
                                    className={`w-full py-3.5 px-6 rounded-xl font-medium text-xs tracking-wider uppercase transition-colors flex items-center justify-center space-x-2 ${isDark
                                        ? 'text-slate-500 hover:text-white hover:bg-white/5'
                                        : 'text-slate-500 hover:text-brand-900 hover:bg-brand-50'
                                        }`}
                                >
                                    <LogOut size={14} />
                                    <span>Sign Out</span>
                                </button>
                            )}
                        </div>

                        {/* Enterprise Status Footer */}
                        <div className={`mt-10 pt-6 border-t flex justify-center ${isDark ? 'border-white/5' : 'border-slate-200/50'}`}>
                            <div className={`flex items-center gap-3 px-4 py-1.5 rounded-full border ${isDark ? 'bg-slate-900/50 border-white/5' : 'bg-white/50 border-brand-100'}`}>
                                <span className={`text-[10px] uppercase tracking-widest font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Platform Status</span>
                                <div className="h-3 w-px bg-slate-700/50"></div>
                                <div className="flex items-center space-x-1.5 text-emerald-500">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                    </span>
                                    <span className="text-[11px] font-bold tracking-wide">Active</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Branding Footer */}
                <div className="mt-8 text-center group cursor-default">
                    <div className="flex items-center justify-center space-x-2 opacity-30 group-hover:opacity-100 transition-all duration-500">
                        <img
                            src="https://vslsjgfhwknxjhtxlhhk.supabase.co/storage/v1/object/public/logos/Logo%20Bsocial%20Icon%20new.png"
                            alt="BSocial"
                            className="w-5 h-5 grayscale group-hover:grayscale-0 group-hover:drop-shadow-[0_0_8px_rgba(45,122,255,0.8)] transition-all duration-500"
                        />
                        <span className={`text-[10px] font-medium tracking-[0.3em] transition-colors duration-500 ${isDark ? 'text-slate-400 group-hover:text-brand-400' : 'text-slate-500 group-hover:text-brand-600'}`}>SECURE ENVIRONMENT</span>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AccessDenied;
