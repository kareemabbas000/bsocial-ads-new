
import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { ArrowRight, AlertCircle, Mail, Lock, Zap, BarChart2, Target, CheckCircle2, ChevronRight, Play, ArrowLeft, Shield } from 'lucide-react';
import { NotificationBanner } from '../components/Modal';

import MetaPartnerBadge from '../components/MetaPartnerBadge';

const Login: React.FC = () => {
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
    React.useEffect(() => {
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
                    options: {
                        data: {
                            first_name: firstName,
                            last_name: lastName,
                            full_name: `${firstName} ${lastName}`,
                            company: organization
                        }
                    }
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
                src="https://vslsjgfhwknxjhtxlhhk.supabase.co/storage/v1/object/public/logos/Logo%20Bsocial%20Icon%20new.png"
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

    // 1. LANDING VIEW
    if (view === 'landing') {
        return (
            <div className="min-h-screen bg-slate-950 relative overflow-hidden font-sans selection:bg-brand-500/30 text-white">
                {/* Ambient Background Effects */}
                <div className="absolute inset-0 grid-bg opacity-30 z-0 pointer-events-none"></div>
                <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-brand-600/20 rounded-full blur-[120px] animate-blob"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] bg-purple-600/10 rounded-full blur-[120px] animate-blob" style={{ animationDelay: '2s' }}></div>

                {/* Header */}
                <header className="relative z-50 px-4 py-4 md:px-12 flex justify-between items-center max-w-7xl mx-auto">
                    <div className="scale-90 md:scale-100 origin-left">
                        <Logo />
                    </div>
                    <div className="flex items-center space-x-2 md:space-x-8">
                        <button onClick={() => switchView('login', true)} className="hidden md:flex text-sm font-medium text-slate-400 hover:text-white transition-colors items-center">
                            <Shield size={14} className="mr-1.5" /> Client Portal
                        </button>
                        <button
                            onClick={() => switchView('login', true)}
                            className="px-3 md:px-6 py-2 md:py-2.5 rounded-full border border-white/10 hover:border-brand-500/50 bg-white/5 hover:bg-brand-500/10 backdrop-blur-md text-xs md:text-sm font-semibold transition-all hover:shadow-[0_0_20px_rgba(0,85,255,0.3)]"
                        >
                            Sign In
                        </button>
                        <button
                            onClick={() => switchView('signup')}
                            className="px-4 md:px-6 py-2 md:py-2.5 rounded-full bg-brand-600 hover:bg-brand-500 text-white text-xs md:text-sm font-bold shadow-lg shadow-brand-600/20 transition-all hover:scale-105 whitespace-nowrap"
                        >
                            Get Started
                        </button>
                    </div>
                </header>

                {/* Hero Section */}
                <main className="relative z-10 max-w-7xl mx-auto px-6 pt-12 md:pt-20 pb-20 flex flex-col items-center text-center">
                    <div className="inline-flex items-center px-3 py-1 rounded-full border border-brand-500/30 bg-brand-500/10 text-brand-300 text-xs font-bold tracking-wide uppercase mb-8 animate-fade-in backdrop-blur-md">
                        <Zap size={12} className="mr-1.5" /> Now with Latest AI Models
                    </div>

                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter mb-6 leading-[1.1] animate-slide-up">
                        Stop Guessing. <br className="hidden md:block" />
                        <span className="text-gradient-brand">Start Scaling.</span>
                    </h1>

                    <p className="text-lg md:text-xl text-slate-400 max-w-2xl mb-10 animate-slide-up leading-relaxed" style={{ animationDelay: '0.1s' }}>
                        The AI-powered command center for your Meta Ads. Analyze creatives, predict fatigue, and optimize budgets with military precision.
                    </p>

                    <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                        <button
                            onClick={() => switchView('signup')}
                            className="group relative px-8 py-4 bg-white text-slate-950 rounded-full font-bold text-lg shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_-15px_rgba(255,255,255,0.5)] transition-all hover:-translate-y-1"
                        >
                            <span className="relative z-10 flex items-center">
                                Get Started <ChevronRight className="ml-2 transition-transform group-hover:translate-x-1" size={20} />
                            </span>
                        </button>

                        <button onClick={() => switchView('login', true)} className="group flex items-center text-slate-300 hover:text-white font-medium transition-colors px-6 py-4">
                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mr-3 group-hover:bg-brand-600 transition-colors">
                                <Play size={14} className="ml-1 fill-current" />
                            </div>
                            <span>Client Login</span>
                        </button>
                    </div>

                    {/* Meta Partner Badge */}
                    <div className="mt-12 md:mt-16 animate-slide-up" style={{ animationDelay: '0.3s' }}>
                        <MetaPartnerBadge />
                    </div>

                    {/* Dashboard Preview / Floating UI Element */}
                    <div className="mt-20 w-full max-w-5xl relative animate-slide-up" style={{ animationDelay: '0.4s' }}>
                        <div className="absolute inset-0 bg-brand-500/20 blur-[100px] rounded-full"></div>
                        <div className="glass-panel rounded-2xl border border-white/10 p-2 shadow-2xl relative overflow-hidden group">
                            {/* Mock UI Header */}
                            <div className="h-10 border-b border-white/5 flex items-center px-4 space-x-2">
                                <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
                                <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                                <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
                                <div className="ml-4 h-4 w-64 bg-white/5 rounded-full"></div>
                            </div>
                            {/* Mock UI Content */}
                            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Card 1 */}
                                <div className="bg-white/5 rounded-lg p-4 border border-white/5 h-32 flex flex-col justify-between">
                                    <div className="flex justify-between">
                                        <div className="w-8 h-8 rounded bg-brand-500/20"></div>
                                        <div className="text-brand-400 font-mono text-xs">+12.5%</div>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-white mb-1">4.2x</div>
                                        <div className="text-xs text-slate-400 uppercase tracking-wider">ROAS Average</div>
                                    </div>
                                </div>
                                {/* Card 2 */}
                                <div className="bg-white/5 rounded-lg p-4 border border-white/5 h-32 flex flex-col justify-between">
                                    <div className="flex justify-between">
                                        <div className="w-8 h-8 rounded bg-purple-500/20"></div>
                                        <div className="text-purple-400 font-mono text-xs">-8.2%</div>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-white mb-1">$14.20</div>
                                        <div className="text-xs text-slate-400 uppercase tracking-wider">Cost Per Acq.</div>
                                    </div>
                                </div>
                                {/* Card 3 (Graph) */}
                                <div className="bg-white/5 rounded-lg p-4 border border-white/5 h-32 relative overflow-hidden flex items-end">
                                    <div className="w-full flex items-end justify-between space-x-1 h-16">
                                        {[40, 60, 45, 70, 85, 60, 75, 50, 65, 90].map((h, i) => (
                                            <div key={i} className="flex-1 bg-brand-500/50 rounded-sm hover:bg-brand-400 transition-colors" style={{ height: `${h}%` }}></div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Reflection Effect */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
                        </div>
                    </div>

                    {/* Features Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 w-full max-w-6xl text-left">
                        <FeatureCard
                            icon={BarChart2}
                            title="Predictive Analytics"
                            desc="Stop analyzing yesterday. Our AI models predict campaign fatigue 48 hours before it kills your ROAS."
                            delay="0.5s"
                        />
                        <FeatureCard
                            icon={Target}
                            title="Creative Intelligence"
                            desc="Computer vision analyzes your thumbnails and copy to tell you exactly why an ad is winning or failing."
                            delay="0.6s"
                        />
                        <FeatureCard
                            icon={Zap}
                            title="Automated Scaling"
                            desc="Set rules once. Let BSocial handle bid adjustments and budget scaling across 50+ ad accounts."
                            delay="0.7s"
                        />
                    </div>
                </main>

                <footer className="relative z-10 border-t border-white/5 py-8 mt-20 bg-slate-950/50 backdrop-blur-lg">
                    <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center text-xs text-slate-500">
                        <div>&copy; 2024 BSocial ADHub. All rights reserved.</div>
                        <div className="flex space-x-6 mt-4 md:mt-0">
                            <a href="#" className="hover:text-white transition-colors">Privacy</a>
                            <a href="#" className="hover:text-white transition-colors">Terms</a>
                            <a href="#" className="hover:text-white transition-colors">Status</a>
                        </div>
                    </div>
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
                    className="absolute top-6 left-6 lg:hidden text-slate-400 hover:text-white flex items-center"
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

                            {view === 'signup' && (
                                <div className="space-y-4 animate-slide-up">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">First Name</label>
                                            <input
                                                type="text"
                                                value={firstName}
                                                onChange={(e) => setFirstName(e.target.value)}
                                                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 outline-none transition-all"
                                                placeholder="John"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Last Name</label>
                                            <input
                                                type="text"
                                                value={lastName}
                                                onChange={(e) => setLastName(e.target.value)}
                                                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 outline-none transition-all"
                                                placeholder="Doe"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Organization</label>
                                        <div className="relative group">
                                            <Target className="absolute left-4 top-3.5 text-slate-500 group-focus-within:text-brand-400 transition-colors" size={18} />
                                            <input
                                                type="text"
                                                value={organization}
                                                onChange={(e) => setOrganization(e.target.value)}
                                                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl pl-11 pr-4 py-3 text-white placeholder-slate-600 focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 outline-none transition-all"
                                                placeholder="BSocial LLC"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>
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

export default Login;
