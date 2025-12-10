import React, { useState, useEffect, useRef } from 'react';
import { Mail, LogOut, ShieldAlert, Lock, ChevronRight, Fingerprint, Scan, AlertTriangle } from 'lucide-react';
import { Theme } from '../types';

interface AccessDeniedProps {
    theme: Theme;
    onContactSupport: () => void;
    onLogout?: () => void;
}

const AccessDenied: React.FC<AccessDeniedProps> = ({ theme, onContactSupport, onLogout }) => {
    const isDark = theme === 'dark';
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const cardRef = useRef<HTMLDivElement>(null);

    // Parallax & Glow Logic
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!cardRef.current) return;

            // Global glow position
            setMousePosition({
                x: (e.clientX / window.innerWidth) * 100,
                y: (e.clientY / window.innerHeight) * 100,
            });

            // Card 3D Tilt Effect
            const rect = cardRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = ((y - centerY) / centerY) * -5; // Max 5deg rotation
            const rotateY = ((x - centerX) / centerX) * 5;

            cardRef.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        };

        const resetTilt = () => {
            if (cardRef.current) cardRef.current.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg)`;
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseleave', resetTilt);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseleave', resetTilt);
        };
    }, []);

    return (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center overflow-hidden transition-colors duration-700 ${isDark ? 'bg-[#020617]' : 'bg-slate-50'}`}>

            {/* --- CUSTOM STYLES FOR ANIMATIONS --- */}
            <style>{`
                @keyframes scan-line {
                    0% { transform: translateY(-100%); opacity: 0; }
                    50% { opacity: 1; }
                    100% { transform: translateY(300%); opacity: 0; }
                }
                @keyframes pulse-ring {
                    0% { transform: scale(0.8); opacity: 0.5; }
                    100% { transform: scale(1.3); opacity: 0; }
                }
                @keyframes glitch {
                    0% { transform: translate(0); }
                    20% { transform: translate(-2px, 2px); }
                    40% { transform: translate(-2px, -2px); }
                    60% { transform: translate(2px, 2px); }
                    80% { transform: translate(2px, -2px); }
                    100% { transform: translate(0); }
                }
                .animate-scan {
                    animation: scan-line 3s linear infinite;
                }
                .animate-pulse-ring {
                    animation: pulse-ring 3s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
                }
                .animate-glitch {
                    animation: glitch 1s infinite alternate-reverse;
                }
            `}</style>

            {/* --- BACKGROUND FX --- */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                {/* Grid */}
                <div className={`absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]`}></div>

                {/* Dynamic Spotlight */}
                <div
                    className="absolute inset-0 transition-opacity duration-300"
                    style={{
                        background: `radial-gradient(1000px circle at ${mousePosition.x}% ${mousePosition.y}%, ${isDark ? 'rgba(45, 122, 255, 0.08)' : 'rgba(45, 122, 255, 0.05)'}, transparent 40%)`
                    }}
                ></div>

                {/* Floating Orbs */}
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-500/10 rounded-full blur-[100px] animate-blob"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] animate-blob" style={{ animationDelay: '2s' }}></div>
            </div>

            {/* --- MAIN CARD --- */}
            <div
                ref={cardRef}
                className="relative z-10 w-full max-w-md mx-4 transition-transform duration-100 ease-out"
                style={{ transformStyle: 'preserve-3d' }}
            >
                {/* Glow Border */}
                <div className={`absolute -inset-[1px] rounded-[32px] bg-gradient-to-b ${isDark ? 'from-white/10 via-brand-500/20 to-transparent' : 'from-brand-500/30 via-brand-500/10 to-transparent'} blur-md opacity-50`}></div>

                <div className={`relative rounded-[24px] md:rounded-[30px] overflow-hidden shadow-2xl backdrop-blur-3xl border border-white/10 flex flex-col w-full max-h-[95dvh] md:max-h-none ${isDark ? 'bg-slate-900/90' : 'bg-white/90'
                    }`}>

                    {/* TOP: ANIMATED SCANNER */}
                    {/* Balanced mobile height: h-32 */}
                    <div className="relative w-full h-36 md:h-48 shrink-0 bg-gradient-to-b from-black/5 to-transparent flex items-center justify-center overflow-hidden border-b border-white/5">

                        {/* Scanning beam */}
                        <div className="absolute inset-0 w-full h-1/2 bg-gradient-to-b from-transparent via-brand-500/20 to-transparent animate-scan z-0 opacity-50"></div>

                        {/* Central Lock Graphic */}
                        <div className="relative z-10 p-4 md:p-6 scale-95 md:scale-100 origin-center">
                            {/* Rings */}
                            <div className={`absolute inset-0 rounded-full border border-brand-500/30 animate-[spin_10s_linear_infinite]`}></div>
                            <div className={`absolute inset-0 rounded-full border border-dashed border-purple-500/30 animate-[spin_15s_linear_infinite_reverse] scale-125 opacity-50`}></div>

                            <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-600 to-purple-700 shadow-[0_0_30px_rgba(45,122,255,0.4)] flex items-center justify-center transform hover:scale-105 transition-transform duration-500">
                                <Lock className="text-white w-10 h-10 drop-shadow-md" />

                                {/* Status Dot */}
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-slate-900 flex items-center justify-center">
                                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                                </div>
                            </div>
                        </div>

                        {/* Tech details */}
                        <div className="absolute bottom-2 left-4 flex items-center gap-2">
                            <Fingerprint className={`w-6 h-6 md:w-8 md:h-8 opacity-20 ${isDark ? 'text-white' : 'text-slate-900'}`} />
                        </div>
                        <div className="absolute top-3 right-3 md:top-4 md:right-4 text-[9px] md:text-[10px] font-mono text-brand-500/50 flex flex-col items-end leading-tight">
                            <span>ID: {Math.random().toString(36).substr(2, 6).toUpperCase()}</span>
                            <span>SEC: 0</span>
                        </div>
                    </div>

                    {/* CONTENT */}
                    <div className="flex flex-col items-center justify-center flex-1 px-5 py-4 w-full md:px-8 md:py-8 text-center min-h-0">
                        {/* Badge */}
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border mb-3 md:mb-6 shrink-0 ${isDark ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-50 border-red-200 text-red-600'
                            }`}>
                            <ShieldAlert size={12} className="w-3 h-3 md:w-3 md:h-3" />
                            <span className="text-[9px] md:text-[10px] uppercase font-bold tracking-widest">Access Restricted</span>
                        </div>

                        {/* Title */}
                        <h2 className={`text-4xl md:text-5xl font-black mb-2 md:mb-4 tracking-tighter leading-none ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            Access <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-purple-400 drop-shadow-sm filter brightness-110">Denied.</span>
                        </h2>

                        {/* Description */}
                        <p className={`text-xs md:text-base leading-relaxed mb-5 md:mb-8 max-w-[280px] md:max-w-xs mx-auto ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                            Access to this platform is not enabled for your profile.
                            <span className="opacity-60 text-[10px] md:text-xs mt-1 md:mt-2 block font-medium">Please request authorization from the BSocial Team.</span>
                        </p>

                        {/* ACTIONS */}
                        <div className="space-y-2.5 md:space-y-3 w-full max-w-[260px] md:max-w-xs mx-auto mt-1 md:mt-0">
                            <button
                                onClick={() => window.location.href = 'mailto:info@bsocial-eg.com?subject=Request Access to ADHub'}
                                className={`w-full py-3 md:py-4 rounded-xl font-bold text-xs md:text-sm shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all flex items-center justify-center gap-2 group relative overflow-hidden ${isDark ? 'bg-white text-slate-950' : 'bg-brand-600 text-white'
                                    }`}
                            >
                                <span className="relative z-10 flex items-center gap-2">
                                    <Mail size={16} className="md:w-4 md:h-4" /> Contact BSocial Team
                                </span>
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                            </button>

                            {onLogout && (
                                <button
                                    onClick={onLogout}
                                    className={`w-full py-2.5 md:py-3 rounded-xl font-medium text-[10px] md:text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors ${isDark
                                        ? 'text-slate-500 hover:text-white hover:bg-white/5'
                                        : 'text-slate-500 hover:text-brand-700 hover:bg-brand-50'
                                        }`}
                                >
                                    <LogOut size={14} className="md:w-3.5 md:h-3.5" /> LOG OUT
                                </button>
                            )}
                        </div>
                    </div>

                    {/* POWERED BY FOOTER - Increased visibility */}
                    <div className={`w-full py-3 md:py-5 border-t flex flex-col items-center justify-center gap-1.5 md:gap-2 shrink-0 ${isDark ? 'border-white/5 bg-black/20' : 'border-slate-100 bg-slate-50'
                        }`}>
                        <span className={`text-[10px] md:text-xs items-center font-bold tracking-widest opacity-60 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>POWERED BY</span>
                        <div className="flex items-center gap-2 md:gap-2.5 opacity-100 transition-all duration-500">
                            <img
                                src="https://vslsjgfhwknxjhtxlhhk.supabase.co/storage/v1/object/public/logos/Logo%20Bsocial%20Icon%20new.png"
                                alt="BSocial Logo"
                                className="w-5 h-5 md:w-6 md:h-6 object-contain drop-shadow-sm"
                            />
                            <span className={`text-xs md:text-sm font-black tracking-widest ${isDark ? 'text-white' : 'text-brand-900'}`}>BSOCIAL</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile note */}
            <div className={`absolute bottom-8 text-center text-[10px] opacity-40 ${isDark ? 'text-white' : 'text-black'}`}>
                Secure Connection Enforced
            </div>
        </div>
    );
};

export default AccessDenied;
