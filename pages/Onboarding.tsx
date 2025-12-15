import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { ArrowRight, Building2, User, LogOut, LayoutDashboard } from 'lucide-react'; // Added Icons
import { updateUserProfile } from '../services/supabaseService';
import { UserProfile } from '../types';

interface OnboardingProps {
    session: any;
    onComplete: () => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ session, onComplete }) => {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [company, setCompany] = useState('');
    const [loading, setLoading] = useState(false);
    const [initializing, setInitializing] = useState(true);
    // State to track if we started with names (so we can hide inputs)
    const [namesPreFilled, setNamesPreFilled] = useState(false);

    // Pre-fill from existing profile if available (e.g. from Google)
    useEffect(() => {
        const loadExisting = async () => {
            try {
                // 1. Try fetching from DB Profile
                const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();

                let foundFirst = data?.first_name;
                let foundLast = data?.last_name;

                // 2. Fallback: Check Session Metadata (Google Auth usually puts it here directly)
                if (!foundFirst || !foundLast) {
                    const meta = session.user.user_metadata;
                    if (meta) {
                        const fullName = meta.full_name || meta.name || '';
                        if (fullName) {
                            const parts = fullName.split(' ');
                            foundFirst = foundFirst || parts[0];
                            foundLast = foundLast || parts.slice(1).join(' '); // Join rest as last name
                        }
                    }
                }

                // 3. Set State
                if (foundFirst && foundLast) {
                    setFirstName(foundFirst);
                    setLastName(foundLast);
                    setNamesPreFilled(true); // Mark as pre-filled to hide inputs
                } else if (foundFirst) {
                    // Only first name found? Maybe just set that
                    setFirstName(foundFirst);
                }

            } catch (e) {
                console.error(e);
            } finally {
                setInitializing(false);
            }
        };
        loadExisting();
    }, [session.user.id, session.user.user_metadata]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await updateUserProfile(session.user.id, {
                first_name: firstName,
                last_name: lastName,
                full_name: `${firstName} ${lastName}`,
                company: company
            });
            // Update local state in App via callback
            onComplete();
            // Force reload to ensure all states sync? optional
            window.location.reload();
        } catch (error) {
            console.error("Onboarding failed", error);
            alert("Failed to save profile. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.reload();
    };

    // Logo Component reused from Login.tsx for consistency
    const Logo = () => (
        <div className="flex items-center space-x-3 select-none">
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

    if (initializing) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500">Loading...</div>;

    return (
        <div className="min-h-screen bg-slate-950 relative overflow-hidden font-sans selection:bg-brand-500/30 text-white flex flex-col">
            {/* Ambient Background Effects - Exact match to Login.tsx */}
            <div className="absolute inset-0 grid-bg opacity-30 z-0 pointer-events-none"></div>
            <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-brand-600/20 rounded-full blur-[120px] animate-blob"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] bg-purple-600/10 rounded-full blur-[120px] animate-blob" style={{ animationDelay: '2s' }}></div>

            {/* HEADER */}
            <header className="relative z-50 px-6 py-6 flex justify-between items-center max-w-7xl mx-auto w-full">
                <div className="scale-100 origin-left">
                    <Logo />
                </div>

                <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors text-sm font-medium px-4 py-2 hover:bg-white/5 rounded-lg border border-transparent hover:border-white/10"
                >
                    <LogOut size={16} />
                    <span>Sign Out</span>
                </button>
            </header>

            {/* MAIN CONTENT */}
            <div className="flex-1 flex items-center justify-center p-6 relative z-10 w-full">
                <div className="w-full max-w-lg animate-slide-up">
                    <div className="text-center mb-10">
                        {/* Avatar/Icon */}
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-tr from-brand-500/20 to-blue-500/20 border border-brand-500/20 text-brand-400 mb-6 shadow-glow">
                            <User size={40} />
                        </div>

                        {namesPreFilled ? (
                            <h1 className="text-4xl font-bold text-white mb-3">Welcome, {firstName}!</h1>
                        ) : (
                            <h1 className="text-4xl font-bold text-white mb-3">Welcome to BSocial</h1>
                        )}
                        <p className="text-lg text-slate-400">Let's set up your profile.</p>
                    </div>

                    <div className="glass-panel p-8 md:p-10 rounded-3xl shadow-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl ring-1 ring-white/5">
                        <form onSubmit={handleSubmit} className="space-y-8">

                            {!namesPreFilled && (
                                <div className="grid grid-cols-2 gap-5">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">First Name</label>
                                        <input
                                            type="text"
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                            className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3.5 text-white focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 outline-none transition-all placeholder-slate-600"
                                            placeholder="John"
                                            required={!namesPreFilled}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Last Name</label>
                                        <input
                                            type="text"
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
                                            className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3.5 text-white focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 outline-none transition-all placeholder-slate-600"
                                            placeholder="Doe"
                                            required={!namesPreFilled}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Company / Organization</label>
                                <div className="relative group">
                                    <Building2 className="absolute left-4 top-4 text-slate-500 group-focus-within:text-brand-400 transition-colors" size={20} />
                                    <input
                                        type="text"
                                        value={company}
                                        onChange={(e) => setCompany(e.target.value)}
                                        className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl pl-12 pr-4 py-3.5 text-white focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 outline-none transition-all placeholder-slate-600"
                                        placeholder="BSocial LLC"
                                        required
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 rounded-xl font-bold text-lg text-white bg-gradient-to-r from-brand-600 to-blue-600 hover:from-brand-500 hover:to-blue-500 shadow-lg shadow-brand-900/20 transition-all transform hover:-translate-y-0.5 flex items-center justify-center space-x-2 ring-1 ring-white/10"
                            >
                                {loading ? (
                                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <span>Create Profile</span>
                                        <ArrowRight size={20} />
                                    </>
                                )}
                            </button>

                        </form>
                    </div>

                    <div className="text-center mt-8">
                        <p className="text-slate-500 text-sm">Having trouble? <a href="#" onClick={handleLogout} className="text-brand-400 hover:text-brand-300">Contact Support</a> or Try a different account.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Onboarding;
