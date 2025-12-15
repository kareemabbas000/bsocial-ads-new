
import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { fetchSystemSetting } from '../services/supabaseService';
import { ArrowRight, AlertCircle, Mail, Lock, Zap, BarChart2, Target, CheckCircle2, ChevronRight, Play, ArrowLeft, Shield } from 'lucide-react';
import { NotificationBanner } from '../components/Modal';

import MetaPartnerBadge from '../components/MetaPartnerBadge';

import CookieConsent from '../components/CookieConsent';
import { Theme } from '../types';

interface LoginProps {
    theme: Theme;
}

const Login: React.FC<LoginProps> = ({ theme }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);
    const [view, setView] = useState<'landing' | 'login' | 'signup'>('landing');

    // Specific state to toggle the "Client" visual context
    const [isClientMode, setIsClientMode] = useState(false);

    // New Fields
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [organization, setOrganization] = useState('');

    // Check for signup redirect
    const [googleAuthEnabled, setGoogleAuthEnabled] = useState(true);

    // Check for signup redirect & System Settings
    React.useEffect(() => {
        const init = async () => {
            // 1. Check Signup Success Logic
            const signupSuccess = sessionStorage.getItem('bsocial_signup_success');
            const signupEmail = sessionStorage.getItem('bsocial_signup_email');

            if (signupSuccess === 'true') {
                setView('login');
                if (signupEmail) setEmail(signupEmail);
                setNotification({
                    type: 'success',
                    message: "Welcome to BSocial! Your account is ready. Please log in to get started."
                });

                // Clear flags
                sessionStorage.removeItem('bsocial_signup_success');
                sessionStorage.removeItem('bsocial_signup_email');
            }

            // 2. Check System Settings for Google Auth
            try {
                // We use dynamic import to avoid circular dependencies if any, though here it's fine.
                // Assuming fetchSystemSetting is available via props or imported
                // It is imported at top.
            } catch (e) { }
        };
        init();

        // Use a separate effect or direct call for the async fetch
        const loadSettings = async () => {
            const enabled = await fetchSystemSetting('enable_google_auth');
            console.log("System Setting 'enable_google_auth':", enabled, typeof enabled);
            // Robust check for 'false' string or boolean false
            if (String(enabled).toLowerCase().trim() === 'false') {
                console.log("Disabling Google Auth in UI");
                setGoogleAuthEnabled(false);
            } else {
                setGoogleAuthEnabled(true);
            }
        };
        loadSettings();
    }, []);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setNotification(null);

        try {
            if (view === 'signup') {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    // No metadata: handled in Onboarding
                });
                if (error) throw error;

                // Store state for redirect after re-mount
                sessionStorage.setItem('bsocial_signup_success', 'true');
                sessionStorage.setItem('bsocial_signup_email', email);

                // Immediately sign out to prevent auto-login
                // This triggers App.tsx to unmount/remount Login
                await supabase.auth.signOut();

            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
            }
        } catch (err: any) {
            setNotification({ type: 'error', message: err.message });
        } finally {
            setLoading(false);
        }
    };

    const switchView = (newView: 'landing' | 'login' | 'signup', clientMode = false) => {
        setNotification(null);
        setIsClientMode(clientMode);
        setView(newView);
        // Reset fields
        setEmail('');
        setPassword('');
        setFirstName('');
        setLastName('');
        setOrganization('');
    };

    // --- SUB-COMPONENTS ---

    const Logo = () => (
        <div className="flex items-center space-x-3 group cursor-pointer" onClick={() => switchView('landing')}>
            {/* BSocial Logo */}
            <img
                src="https://icgkbruoltgvchbqednf.supabase.co/storage/v1/object/public/logos/Logo%20Bsocial%20Icon%20new.png"
                alt="BSocial Logo"
                className="w-12 h-12 rounded-full object-contain bg-slate-900 shadow-lg shadow-blue-500/30 border border-white/10 shrink-0"
            />
            <div className="flex flex-col">
                <span className="text-2xl font-bold text-white tracking-tight leading-none">BSocial</span>
                <span className="text-[10px] font-bold text-brand-400 uppercase tracking-[0.2em] leading-none mt-1">ADHub</span>
            </div>
        </div>
    );

    const FeatureCard = ({ icon: Icon, title, desc, delay }: { icon: any, title: string, desc: string, delay: string }) => (
        <div className={`glass-panel p-6 rounded-2xl hover:bg-white/5 transition-all duration-300 hover:-translate-y-1 opacity-0 animate-slide-up`} style={{ animationDelay: delay }}>
            <div className="w-12 h-12 rounded-lg bg-brand-500/10 flex items-center justify-center mb-4 border border-brand-500/20 text-brand-400">
                <Icon size={24} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
            <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
        </div>
    );

    // --- VIEWS ---

    const renderContent = () => {
        // 1. LANDING VIEW (Redesigned)
        if (view === 'landing') {
            return (
                <div className="min-h-screen bg-[#030014] relative overflow-hidden font-sans text-white selection:bg-brand-500/30">

                    {/* --- CSS FX --- */}
                    <style>{`
                    @keyframes aurora {
                        0% { background-position: 50% 50%, 50% 50%; }
                        100% { background-position: 350% 50%, 350% 50%; }
                    }
                    @keyframes float-slow {
                        0%, 100% { transform: translateY(0); }
                        50% { transform: translateY(-20px); }
                    }
                    @keyframes float-delay {
                        0%, 100% { transform: translateY(0); }
                        50% { transform: translateY(-15px); }
                    }
                    @keyframes tilt-3d {
                        0% { transform: perspective(1000px) rotateX(20deg) rotateY(0deg) scale(0.9); }
                        100% { transform: perspective(1000px) rotateX(25deg) rotateY(2deg) scale(0.95); }
                    }
                    @keyframes shimmer {
                        from { background-position: 0 0; }
                        to { background-position: -200% 0; }
                    }
                    .aurora-bg {
                        background-image: 
                            radial-gradient(circle at 100% 100%, rgba(67, 56, 202, 0.4) 0, transparent 50%), 
                            radial-gradient(circle at 0% 0%, rgba(59, 130, 246, 0.4) 0, transparent 50%);
                        animation: aurora 15s linear infinite alternate;
                    }
                    .text-shimmer {
                        background: linear-gradient(to right, #b8cbb8 0%, #b8cbb8 20%, #fff 40%, #fff 60%, #b8cbb8 80%, #b8cbb8 100%);
                        background-size: 200% auto;
                        color: transparent;
                        -webkit-background-clip: text;
                        background-clip: text;
                        animation: shimmer 3s linear infinite;
                    }
                    .glass-card-hover:hover {
                        background: rgba(255, 255, 255, 0.05);
                        border-color: rgba(255, 255, 255, 0.2);
                        box-shadow: 0 0 40px rgba(59, 130, 246, 0.15);
                    }
                    .perspective-container {
                        perspective: 2000px;
                    }
                    .tilted-dashboard {
                        transform: rotateX(20deg) scale(0.9);
                        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                        transition: transform 0.5s ease-out;
                    }
                    .tilted-dashboard:hover {
                        transform: rotateX(10deg) scale(0.95);
                    }
                `}</style>

                    {/* --- BACKGROUND LAYERS --- */}
                    {/* Grid */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_50%_200px,#3b82f615,transparent)]"></div>
                    {/* Aurora Blobs */}
                    <div className="absolute top-[-10%] left-[-20%] w-[800px] h-[800px] bg-purple-600/20 rounded-full blur-[120px] mix-blend-screen animate-[pulse_8s_infinite]"></div>
                    <div className="absolute bottom-[-20%] right-[-20%] w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[100px] mix-blend-screen animate-[pulse_10s_infinite_reverse]"></div>

                    {/* --- NAV --- */}
                    <nav className="relative z-50 w-full max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-brand-500 to-purple-600 rounded-full blur opacity-40 group-hover:opacity-75 transition duration-200"></div>
                                <img src="https://icgkbruoltgvchbqednf.supabase.co/storage/v1/object/public/logos/Logo%20Bsocial%20Icon%20new.png"
                                    className="relative w-10 h-10 rounded-full bg-black object-contain border border-white/10" alt="Logo" />
                            </div>
                            <span className="font-bold text-xl tracking-tight text-white hidden md:block">BSocial <span className="text-white/40 font-normal">Ads</span></span>
                        </div>

                        <div className="flex items-center gap-4">
                            <button onClick={() => switchView('login', true)} className="text-sm font-medium text-slate-400 hover:text-white transition-colors hidden md:block">
                                Client Portal
                            </button>
                            <button
                                onClick={() => switchView('login')}
                                className="px-5 py-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-white text-sm font-medium transition-all backdrop-blur-md"
                            >
                                Sign In
                            </button>
                            <button
                                onClick={() => switchView('signup')}
                                className="group relative px-6 py-2 rounded-full bg-brand-600 text-white text-sm font-bold overflow-hidden shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] transition-all"
                            >
                                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1s_infinite]"></div>
                                <span className="relative">Get Started</span>
                            </button>
                        </div>
                    </nav>

                    {/* --- HERO --- */}
                    <main className="relative z-10 pt-20 pb-12 flex flex-col items-center justify-center text-center px-4 overflow-visible">

                        {/* Badge */}
                        <div className="mb-8 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-brand-500/30 bg-brand-500/10 backdrop-blur-md animate-[float-slow_4s_ease-in-out_infinite]">
                            <span className="flex h-2 w-2 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
                            </span>
                            <span className="text-xs font-bold tracking-wide text-brand-300 uppercase">Beta Version Just Released</span>
                        </div>

                        {/* Headline */}
                        <h1 className="max-w-4xl mx-auto text-5xl md:text-8xl font-black tracking-[-0.04em] leading-[0.95] mb-8 text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/50 drop-shadow-sm">
                            Stop Guessing. <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-purple-400 to-brand-400 animate-gradient-x">Start Scaling.</span>
                        </h1>

                        <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-400 leading-relaxed mb-10 max-w-[600px]">
                            The AI-powered command center for your Meta Ads. Analyze creatives, predict fatigue, and optimize budgets with <span className="text-white font-medium">military precision</span>.
                        </p>

                        {/* CTAs */}
                        <div className="flex flex-col sm:flex-row items-center gap-5 mb-12">
                            <button
                                onClick={() => switchView('signup')}
                                className="relative group px-8 py-4 rounded-full bg-white text-black font-bold text-lg shadow-[0_0_40px_-5px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_-5px_rgba(255,255,255,0.5)] hover:-translate-y-1 transition-all duration-300"
                            >
                                <span className="flex items-center gap-2">
                                    Start Free Trial <ChevronRight size={18} />
                                </span>
                            </button>
                            <button
                                onClick={() => switchView('login', true)}
                                className="px-8 py-4 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-white font-medium transition-all hover:scale-105 flex items-center gap-3"
                            >
                                <Play size={16} className="fill-current" /> Client Login
                            </button>
                        </div>

                        {/* Levitating Holographic UI - MAXIMIZED */}
                        <div className="mt-6 w-full max-w-7xl mx-auto relative group h-[500px] md:h-[700px] flex items-center justify-center perspective-container">

                            {/* Rotating Radar / Grid Base - Intensified */}
                            <div className="absolute inset-0 bg-brand-500/10 rounded-full blur-[100px] animate-pulse"></div>
                            <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.25)_0%,transparent_70%)] animate-[spin_20s_linear_infinite_reverse]"></div>

                            {/* Floater 1: AI Insight (Top Left) - Larger & Brighter */}
                            <div className="absolute top-[0%] left-[-5%] md:left-[0%] z-30 animate-[float-delay_6s_ease-in-out_infinite]">
                                <div className="glass-panel px-6 py-4 rounded-2xl border border-white/30 bg-slate-900/60 backdrop-blur-xl shadow-[0_0_40px_rgba(59,130,246,0.4)] flex items-center gap-4 hover:scale-105 transition-transform duration-300">
                                    <div className="w-12 h-12 rounded-full bg-brand-500/20 flex items-center justify-center border border-brand-500/40 shadow-[0_0_20px_rgba(59,130,246,0.5)]">
                                        <Zap size={20} className="text-white drop-shadow-md" />
                                    </div>
                                    <div>
                                        <div className="text-[11px] text-brand-200 font-bold tracking-wider uppercase mb-0.5">AI Opportunity</div>
                                        <div className="text-base font-bold text-white text-shadow-sm">Scale "Summer Promo"</div>
                                    </div>
                                </div>
                            </div>

                            {/* Floater 2: ROAS Card (Bottom Right) - Larger & Brighter */}
                            <div className="absolute bottom-[5%] right-[-5%] md:right-[0%] z-30 animate-[float-slow_7s_ease-in-out_infinite]">
                                <div className="glass-panel px-8 py-6 rounded-2xl border border-white/30 bg-slate-900/60 backdrop-blur-xl shadow-[0_0_40px_rgba(16,185,129,0.3)] hover:scale-105 transition-transform duration-300">
                                    <div className="text-[11px] text-emerald-200 font-bold tracking-wider uppercase mb-2">Live ROAS</div>
                                    <div className="flex items-end gap-3">
                                        <span className="text-5xl font-black text-white drop-shadow-md">5.2x</span>
                                        <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-sm font-bold text-emerald-300 mb-2 flex items-center shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                                            <ArrowRight size={12} className="-rotate-45 mr-1" /> 18%
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Central Main Console - Larger (90%) & Cleaner */}
                            <div className="relative z-20 w-[98%] md:w-[90%] aspect-video bg-[#0B0E16]/90 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)] overflow-hidden tilted-dashboard ring-1 ring-white/10 group-hover:ring-white/20 transition-all">
                                {/* Top Bar - No Text */}
                                <div className="h-16 border-b border-white/5 flex items-center px-8 justify-between bg-white/[0.03]">
                                    <div className="flex gap-3">
                                        <div className="w-3.5 h-3.5 rounded-full bg-red-500/80 shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
                                        <div className="w-3.5 h-3.5 rounded-full bg-yellow-500/80 shadow-[0_0_10px_rgba(234,179,8,0.5)]"></div>
                                        <div className="w-3.5 h-3.5 rounded-full bg-green-500/80 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                                    </div>
                                    {/* Decorative tech lines */}
                                    <div className="flex gap-1.5 opacity-30">
                                        <div className="w-12 h-1.5 bg-white rounded-full"></div>
                                        <div className="w-24 h-1.5 bg-white rounded-full"></div>
                                    </div>
                                </div>

                                {/* Inner Graph Area */}
                                <div className="relative p-8 md:p-12 h-full flex flex-col">
                                    <div className="flex justify-between items-start mb-6 md:mb-12">
                                        <div>
                                            <div className="text-base md:text-lg text-slate-400 mb-2 font-medium">Total Spend (Live)</div>
                                            <div className="text-6xl md:text-7xl font-black text-white tracking-tight drop-shadow-2xl">$24,850<span className="text-slate-500 text-4xl md:text-5xl">.00</span></div>
                                        </div>
                                        <div className="px-5 py-2 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-300 text-sm font-bold shadow-[0_0_25px_rgba(59,130,246,0.4)] animate-pulse">
                                            ● Real-time
                                        </div>
                                    </div>

                                    {/* Dynamic CSS Wave Graph - Chunkier & Brighter */}
                                    <div className="flex-1 relative w-full flex items-end justify-between px-2 pb-6 gap-2 md:gap-4">
                                        {/* Grid Lines */}
                                        <div className="absolute inset-0 border-t border-dashed border-white/5 top-[20%]"></div>
                                        <div className="absolute inset-0 border-t border-dashed border-white/5 top-[50%]"></div>
                                        <div className="absolute inset-0 border-t border-dashed border-white/5 top-[80%]"></div>

                                        {[35, 50, 40, 65, 55, 80, 65, 90, 85, 75, 95, 100, 90, 100, 70, 50, 60, 80].map((h, i) => (
                                            <div key={i} className="relative w-full group/bar h-full flex items-end">
                                                <div
                                                    style={{ height: `${h}%` }}
                                                    className="w-full min-w-[10px] md:min-w-[20px] bg-gradient-to-t from-brand-600 to-cyan-400 rounded-t-lg transition-all duration-300 group-hover/bar:bg-brand-300 group-hover/bar:from-brand-400 group-hover/bar:to-white shadow-[0_0_25px_rgba(59,130,246,0.5)] opacity-95"
                                                ></div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Scan Line - Brighter */}
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-400/10 to-transparent h-[30px] w-full animate-scan pointer-events-none"></div>
                            </div>
                        </div>
                    </main>

                    {/* --- FEATURES BENTO GRID --- */}
                    <section className="relative z-10 max-w-7xl mx-auto px-6 py-20">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Engineered for <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Growth</span></h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-auto md:h-[500px]">
                            {/* Large Card */}
                            <div className="md:col-span-2 group relative rounded-3xl overflow-hidden border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-500 glass-card-hover">
                                <div className="absolute inset-0 bg-gradient-to-br from-brand-600/10 to-transparent opacity-0 group-hover:opacity-100 transition duration-500"></div>
                                <div className="p-10 relative z-10 h-full flex flex-col justify-between">
                                    <div>
                                        <div className="w-14 h-14 rounded-2xl bg-brand-500/20 flex items-center justify-center text-brand-400 mb-6 border border-brand-500/20 group-hover:scale-110 transition-transform duration-500">
                                            <Target size={28} />
                                        </div>
                                        <h3 className="text-3xl font-bold text-white mb-4">Precision Targeting</h3>
                                        <p className="text-slate-400 text-lg leading-relaxed max-w-sm">Identify your ideal audience using second-generation AI demographic analysis. Stop wasting spend on cold leads.</p>
                                    </div>
                                    <div className="w-full h-48 rounded-xl bg-gradient-to-t from-brand-900/50 to-transparent border border-brand-500/20 mt-8 relative overflow-hidden">
                                        {/* Radar Scan FX */}
                                        <div className="absolute inset-0 bg-[conic-gradient(from_0deg_at_50%_50%,transparent_0deg,rgba(59,130,246,0.2)_360deg)] animate-[spin_4s_linear_infinite]"></div>
                                        <div className="absolute inset-[2px] bg-[#050812] rounded-xl"></div>
                                        {/* Dots */}
                                        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
                                        <div className="absolute bottom-1/3 right-1/3 w-2 h-2 bg-green-500 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
                                    </div>
                                </div>
                            </div>

                            {/* Stacked Small Cards */}
                            <div className="flex flex-col gap-6">
                                <div className="flex-1 group relative rounded-3xl overflow-hidden border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-all glass-card-hover p-8">
                                    <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400 mb-4 border border-purple-500/20">
                                        <Zap size={24} />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">Automated Scaling</h3>
                                    <p className="text-slate-400 text-sm">Automatically boost high-performing ads and kill budget-drainers instantly.</p>
                                </div>

                                <div className="flex-1 group relative rounded-3xl overflow-hidden border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-all glass-card-hover p-8">
                                    <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 border border-emerald-500/20">
                                        <CheckCircle2 size={24} />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">Creative Audit</h3>
                                    <p className="text-slate-400 text-sm">Get instant scoring and improvement suggestions for your visuals.</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-20 text-center opacity-60">
                            <MetaPartnerBadge />
                        </div>
                    </section>

                    {/* Footer simple */}
                    <footer className="w-full py-8 text-center text-slate-600 text-sm relative z-10 border-t border-white/5 bg-black/20 backdrop-blur-md">
                        <p>&copy; {new Date().getFullYear()} BSocial ADHub. All rights reserved.</p>
                    </footer>
                </div>
            );
        }

        // 2. AUTH VIEW (LOGIN / SIGNUP)
        return (
            <div className="min-h-screen flex relative overflow-hidden bg-slate-950">
                {/* Background Visuals */}
                <div className="absolute inset-0 grid-bg opacity-20 z-0"></div>
                <div className="absolute top-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-brand-800/20 rounded-full blur-[150px] animate-blob"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-blue-900/10 rounded-full blur-[150px]"></div>

                {/* Left Side: Visual Content (Desktop) */}
                <div className="hidden lg:flex flex-col justify-between w-1/2 relative z-10 p-12 lg:p-16 border-r border-white/5 backdrop-blur-[2px]">
                    <div className="cursor-pointer" onClick={() => switchView('landing')}>
                        <Logo />
                    </div>

                    <div className="max-w-lg">
                        {isClientMode ? (
                            <div className="animate-fade-in">
                                <div className="inline-flex items-center px-3 py-1 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-xs font-bold tracking-wide uppercase mb-6">
                                    <Shield size={12} className="mr-2" /> Secure Client Gateway
                                </div>
                                <h2 className="text-5xl font-black text-white mb-6 leading-tight">
                                    Your performance.<br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-brand-400">Real-time.</span>
                                </h2>
                                <p className="text-lg text-slate-400 leading-relaxed">
                                    Access your dedicated dashboard, approve creatives, and view live campaign metrics without the noise.
                                </p>
                            </div>
                        ) : (
                            <div className="animate-fade-in">
                                <h2 className="text-5xl font-black text-white mb-6 leading-tight">
                                    {view === 'login' ? 'Welcome back,' : 'Join the revolution.'}<br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-cyan-300">Commander.</span>
                                </h2>
                                <p className="text-lg text-slate-400 leading-relaxed">
                                    {view === 'login'
                                        ? "Your campaigns have been running. Let's see what the AI found while you were away."
                                        : "15 years of growth-driven advertising."}
                                </p>

                                <div className="mt-12 grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-xl bg-white/5 border border-white/5 backdrop-blur-sm">
                                        <div className="text-3xl font-bold text-white mb-1">5k+</div>
                                        <div className="text-xs text-slate-400 uppercase tracking-wider">Campaigns Launched</div>
                                    </div>
                                    <div className="p-4 rounded-xl bg-white/5 border border-white/5 backdrop-blur-sm">
                                        <div className="text-3xl font-bold text-white mb-1">200+</div>
                                        <div className="text-xs text-slate-400 uppercase tracking-wider">Clients Served</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="text-xs text-slate-600 font-mono">
                        System Status: <span className="text-emerald-500">● Operational</span>
                    </div>
                </div>

                {/* Right Side: Auth Form */}
                <div className="w-full lg:w-1/2 flex items-center justify-center p-6 relative z-20">
                    <button
                        onClick={() => switchView('landing')}
                        className="absolute top-6 left-6 lg:hidden text-slate-400 hover:text-white flex items-center z-50 p-2 -ml-2 rounded-full active:bg-white/10 transition-all"
                    >
                        <ArrowLeft size={18} className="mr-1" /> Back
                    </button>

                    <div className="w-full max-w-md animate-slide-up">
                        {/* Mobile Logo */}
                        <div className="lg:hidden mb-10 flex justify-center">
                            <Logo />
                        </div>

                        <div className="glass-panel p-8 md:p-10 rounded-2xl shadow-2xl relative">
                            {/* Decorative Top Line */}
                            <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${isClientMode ? 'from-purple-500 to-brand-500' : 'from-brand-500 to-cyan-500'}`}></div>

                            {/* Notification Banner */}
                            {notification && (
                                <div className="mb-6 animate-fade-in relative z-20">
                                    <NotificationBanner
                                        type={notification.type}
                                        message={notification.message}
                                        onClose={() => setNotification(null)}
                                        theme="dark"
                                        inline={true}
                                    />
                                </div>
                            )}

                            <div className="text-center mb-8">
                                <h3 className="text-2xl font-bold text-white mb-2">
                                    {view === 'login' ? (isClientMode ? 'Client Portal Login' : 'Sign In to ADHub') : 'Create Account'}
                                </h3>
                                <p className="text-slate-400 text-sm">
                                    {view === 'login' ? 'Enter your credentials to access the terminal.' : 'Start optimizing your ads in seconds.'}
                                </p>
                            </div>



                            <form onSubmit={handleAuth} className="space-y-5">


                                {/* Google Login Button */}
                                {/* Google Login Button */}
                                {googleAuthEnabled && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={async () => {
                                                setLoading(true);
                                                try {
                                                    const { error } = await supabase.auth.signInWithOAuth({
                                                        provider: 'google',
                                                        options: {
                                                            redirectTo: window.location.origin
                                                        }
                                                    });
                                                    if (error) throw error;
                                                } catch (err: any) {
                                                    setNotification({ type: 'error', message: err.message });
                                                    setLoading(false);
                                                }
                                            }}
                                            disabled={loading}
                                            className="w-full py-3.5 rounded-xl font-bold bg-white text-slate-900 shadow-lg hover:bg-slate-50 transition-all flex items-center justify-center space-x-3 group"
                                        >
                                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                            </svg>
                                            <span>Continue with Google</span>
                                        </button>

                                        <div className="relative my-4">
                                            <div className="absolute inset-0 flex items-center">
                                                <div className="w-full border-t border-slate-700"></div>
                                            </div>
                                            <div className="relative flex justify-center text-sm">
                                                <span className="px-2 bg-slate-900 text-slate-500 rounded-full border border-slate-700">Or continue with email</span>
                                            </div>
                                        </div>
                                    </>
                                )}

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Email</label>
                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-3.5 text-slate-500 group-focus-within:text-brand-400 transition-colors" size={18} />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl pl-11 pr-4 py-3 text-white placeholder-slate-600 focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 outline-none transition-all"
                                            placeholder="name@company.com"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <div className="flex justify-between ml-1">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Password</label>
                                        {view === 'login' && <a href="#" className="text-xs text-brand-400 hover:text-brand-300">Forgot?</a>}
                                    </div>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-3.5 text-slate-500 group-focus-within:text-brand-400 transition-colors" size={18} />
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl pl-11 pr-4 py-3 text-white placeholder-slate-600 focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 outline-none transition-all"
                                            placeholder="••••••••"
                                            required
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all transform hover:-translate-y-0.5 hover:shadow-xl flex items-center justify-center space-x-2 ${isClientMode
                                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-purple-900/20'
                                        : 'bg-gradient-to-r from-brand-600 to-blue-600 hover:from-brand-500 hover:to-blue-500 shadow-brand-900/20'
                                        }`}
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <span>{view === 'login' ? 'Authenticate' : 'Launch Account'}</span>
                                            <ArrowRight size={18} />
                                        </>
                                    )}
                                </button>
                            </form>

                            <div className="mt-8 text-center">
                                <p className="text-slate-500 text-sm">
                                    {view === 'login' ? "Don't have an account yet?" : "Already have an account?"}
                                    <button
                                        onClick={() => switchView(view === 'login' ? 'signup' : 'login')}
                                        className="ml-2 font-bold text-white hover:text-brand-400 underline decoration-slate-700 hover:decoration-brand-400 underline-offset-4 transition-all"
                                    >
                                        {view === 'login' ? 'Sign Up' : 'Sign In'}
                                    </button>
                                </p>
                            </div>

                            {!isClientMode && view === 'login' && (
                                <div className="mt-6 pt-6 border-t border-white/5 text-center">
                                    <p className="text-xs text-slate-500 mb-3">Are you an agency client?</p>
                                    <button onClick={() => setIsClientMode(true)} className="text-xs font-bold text-purple-400 hover:text-purple-300 flex items-center justify-center">
                                        <Shield size={12} className="mr-1.5" /> Switch to Client Portal
                                    </button>
                                </div>
                            )}

                            {isClientMode && (
                                <div className="mt-6 pt-6 border-t border-white/5 text-center">
                                    <button onClick={() => setIsClientMode(false)} className="text-xs text-slate-500 hover:text-white">
                                        &larr; Return to Team Login
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <>
            {renderContent()}
            <CookieConsent theme={theme} />
        </>
    );
};

export default Login;
