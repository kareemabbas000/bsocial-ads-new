
import React, { useState, useEffect, useRef } from 'react';
import { flushSync } from 'react-dom';
import { supabase } from './services/supabaseClient';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Campaigns from './pages/Campaigns';
import AILab from './pages/AILab';
import CreativeHub from './pages/CreativeHub';
import AdminPanel from './pages/AdminPanel';
import { AppState, DateSelection, Theme, GlobalFilter, AccountHierarchy, AdAccount } from './types';
import { fetchAccountHierarchy, fetchAdAccounts, clearCache } from './services/metaService';
import { fetchUserProfile, fetchUserConfig, fetchSystemSetting, updateUserConfig } from './services/supabaseService';
import LoadingSpinner from './components/LoadingSpinner'; // Added
import AccessDenied from './components/AccessDenied';
// import CookieConsent from './components/CookieConsent'; // Moved to Login

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [appState, setAppState] = useState<AppState>({
    metaToken: null,
    adAccountIds: [],
    isConnected: false,
  });



  const [activeTab, setActiveTab] = useState('dashboard');

  const [dateSelection, setDateSelection] = useState<DateSelection>({ preset: 'last_30d' });

  // CHANGED: Default theme set to 'dark', checking localStorage first
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved === 'light' || saved === 'dark') return saved;
    }
    return 'dark';
  });

  const [hierarchy, setHierarchy] = useState<AccountHierarchy>({ campaigns: [], adSets: [], ads: [] });
  const [filter, setFilter] = useState<GlobalFilter>({ searchQuery: '', selectedCampaignIds: [], selectedAdSetIds: [] });
  const [loading, setLoading] = useState(true);

  // New: Account Display Info
  const [accountNames, setAccountNames] = useState<string[]>([]);

  // Manual Refresh Trigger
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Persist State
  useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Sync Theme with Body for Portals
  useEffect(() => {
    if (theme === 'dark') {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [theme]); // This keeps the effect for normal re-renders, but flushSync handles the immediate toggle


  // Stabilize Connection State for Listener
  const isConnectedRef = useRef(appState.isConnected);
  useEffect(() => {
    isConnectedRef.current = appState.isConnected;
  }, [appState.isConnected]);

  // Initialize Session & Auth Listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) initializeUser(session.user.id);
      else setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (session) {
        // Optimization: Only re-initialize if user CHANGED or we weren't connected.
        if (!isConnectedRef.current) {
          initializeUser(session.user.id);
        }
      } else {
        setAppState({ metaToken: null, adAccountIds: [], isConnected: false });
        // Clear all sensitive data on logout
        setHierarchy({ campaigns: [], adSets: [], ads: [] });
        setAccountNames([]);
        setFilter({ searchQuery: '', selectedCampaignIds: [], selectedAdSetIds: [] });
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []); // Run once on mount to prevent listener churn

  const initializeUser = async (userId: string) => {
    // Fix: Only show full screen loader if we don't have valid state yet. 
    // This prevents "dark screen" flicker on token refresh or window restore.
    if (!appState.isConnected) {
      setLoading(true);
    }

    try {
      const [profile, config, token] = await Promise.all([
        fetchUserProfile(userId),
        fetchUserConfig(userId),
        fetchSystemSetting('meta_token')
      ]);

      if (token && config && config.ad_account_ids.length > 0) {
        setAppState({
          metaToken: token,
          adAccountIds: config.ad_account_ids,
          isConnected: true,
          userRole: profile?.role,
          userConfig: config
        });

        // Fetch Account Names for Header Display
        try {
          const allAccounts = await fetchAdAccounts(token);
          const names = allAccounts
            .filter(acc => config.ad_account_ids.includes(acc.id))
            .map(acc => acc.name);
          setAccountNames(names);
        } catch (e) { console.error("Failed to fetch account names"); }

        // Set Theme if exists
        if (config.theme) {
          setTheme(config.theme);
        }

      } else {
        setAppState(prev => ({
          ...prev,
          metaToken: token,
          isConnected: !!token,
          userRole: profile?.role,
          userConfig: config || undefined
        }));

        // Set Theme if exists
        if (config?.theme) {
          setTheme(config.theme);
        }
      }

      // Apply Fixed Date Config
      if (config?.fixed_date_start && config?.fixed_date_end) {
        setDateSelection({
          preset: 'custom',
          custom: { startDate: config.fixed_date_start, endDate: config.fixed_date_end }
        });
      }

      // Apply Allowed Sections Rule
      const allowed = config?.allowed_features || ['dashboard', 'campaigns', 'creative-hub', 'ai-lab'];
      if (profile?.role !== 'admin' && !allowed.includes('dashboard') && allowed.length > 0) {
        if (activeTab === 'dashboard' && !allowed.includes('dashboard')) {
          setActiveTab(allowed[0]);
        }
      }

    } catch (e) {
      console.error("Init failed", e);
    } finally {
      setLoading(false);
    }
  };

  // Load Hierarchy when connection is ready
  useEffect(() => {
    if (appState.isConnected && appState.metaToken && appState.adAccountIds.length > 0) {
      const loadHierarchy = async () => {
        const data = await fetchAccountHierarchy(appState.adAccountIds, appState.metaToken!);
        setHierarchy(data);
      };
      loadHierarchy();
    }
  }, [appState.isConnected, appState.adAccountIds, appState.metaToken, refreshTrigger]);

  const handleDisconnect = async () => {
    // 1. Attempt native sign out (backend)
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error("Sign out error:", e);
    }

    // 2. FORCE update local state to redirect immediately
    // This guarantees the user is taken to Login screen even if backend lags
    setSession(null);
    setAppState({ metaToken: null, adAccountIds: [], isConnected: false });
    setHierarchy({ campaigns: [], adSets: [], ads: [] });
    setAccountNames([]);
    setFilter({ searchQuery: '', selectedCampaignIds: [], selectedAdSetIds: [] });
  };

  const toggleTheme = async () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';

    // 1. Visual Update (Instant)
    const updateVisuals = () => {
      setTheme(nextTheme);
      // Manually toggle body class immediately for the view transition snapshot
      // (React's useEffect would be too late for the snapshot without flushSync)
      if (nextTheme === 'dark') document.body.classList.add('dark');
      else document.body.classList.remove('dark');
    };

    // 2. Persist to DB (Background)
    const persistTheme = async () => {
      if (session?.user?.id && appState.userRole) {
        try {
          // Fixed: Use standard import
          await updateUserConfig(session.user.id, { theme: nextTheme });
        } catch (e) {
          console.error("Failed to save theme preference", e);
        }
      }
    };

    // 3. Execute Transition
    if ((document as any).startViewTransition) {
      (document as any).startViewTransition(() => {
        flushSync(() => {
          updateVisuals();
        });
      });
    } else {
      updateVisuals();
    }

    // Fire and forget persistence
    persistTheme();
  };

  const handleManualRefresh = () => {
    clearCache(); // Force next fetches to hit API

    // Also re-fetch ad accounts if connected
    if (appState.isConnected && appState.metaToken) {
      fetchAdAccounts(appState.metaToken).then(accounts => {
        // Update appState if needed? 
      });
    }

    setRefreshTrigger(prev => prev + 1);
  };

  // Replaced ugly div with LoadingSpinner
  if (loading) return <LoadingSpinner theme={theme} message="Initializing ADHub..." />;

  if (!session) {
    return <Login theme={theme} />;
  }

  // Admin View Logic
  if (appState.userRole === 'admin' && activeTab === 'admin') {
    return (
      <Layout
        activeTab={activeTab}
        onNavigate={setActiveTab}
        onDisconnect={handleDisconnect}
        dateSelection={dateSelection}
        onDateChange={setDateSelection}
        theme={theme}
        onThemeToggle={toggleTheme}
        hierarchy={hierarchy}
        filter={filter}
        onFilterChange={setFilter}
        userRole={appState.userRole}
        accountNames={accountNames}
        onManualRefresh={handleManualRefresh}
        allowedFeatures={appState.userConfig?.allowed_features}
      >
        <AdminPanel theme={theme} />
      </Layout>
    );
  }

  // Permissions Data
  const allowedFeatures = appState.userConfig?.allowed_features;
  const isDateLocked = !!(appState.userConfig?.fixed_date_start && appState.userConfig?.fixed_date_end);
  const isFilterLocked = !!(appState.userConfig?.global_campaign_filter && appState.userConfig.global_campaign_filter.length > 0);
  const refreshInterval = appState.userConfig?.refresh_interval || 10; // Default 10 mins

  const renderContent = () => {
    const allowed = allowedFeatures || [];
    const isAdmin = appState.userRole === 'admin';

    // Guard: Ensure we have a token before rendering data-heavy components (unless Admin Panel?)
    // This prevents "Empty Page" if connection is lost but session exists.
    if (!appState.metaToken && activeTab !== 'admin') {
      return <LoadingSpinner theme={theme} message="Connecting to Meta..." />;
    }

    switch (activeTab) {
      case 'dashboard':
        if (allowed.length > 0 && !allowed.includes('dashboard')) return <div className="p-8 text-center text-slate-500">Access Restricted</div>;
        return <Dashboard
          token={appState.metaToken!}
          accountIds={appState.adAccountIds}
          datePreset={dateSelection}
          theme={theme}
          filter={filter}
          userConfig={appState.userConfig}
          refreshInterval={refreshInterval}
          refreshTrigger={refreshTrigger}
        />;
      case 'campaigns':
        if (allowed.length > 0 && !allowed.includes('campaigns')) return <div className="p-8 text-center text-slate-500">Access Restricted</div>;
        return <Campaigns
          token={appState.metaToken!}
          accountIds={appState.adAccountIds}
          datePreset={dateSelection}
          theme={theme}
          filter={filter}
          userConfig={appState.userConfig}
          refreshInterval={refreshInterval}
          refreshTrigger={refreshTrigger}
          hierarchy={hierarchy}
        />;
      case 'creative-hub':
        if (allowed.length > 0 && !allowed.includes('creative-hub')) return <div className="p-8 text-center text-slate-500">Access Restricted</div>;
        return <CreativeHub
          token={appState.metaToken!}
          accountIds={appState.adAccountIds}
          datePreset={dateSelection}
          theme={theme}
          filter={filter}
          userConfig={appState.userConfig}
          refreshInterval={refreshInterval}
          refreshTrigger={refreshTrigger}
        />;
      case 'ai-lab':
        if (allowed.length > 0 && !allowed.includes('ai-lab')) return <div className="p-8 text-center text-slate-500">Access Restricted</div>;
        return <AILab theme={theme} />;
      default:
        // Default to Dashboard but check permission
        if (allowed.length > 0 && !allowed.includes('dashboard')) {
          // If dashboard is restricted, find first allowed tab
          if (allowed.includes('campaigns')) return <Campaigns token={appState.metaToken!} accountIds={appState.adAccountIds} datePreset={dateSelection} theme={theme} filter={filter} userConfig={appState.userConfig} refreshInterval={refreshInterval} refreshTrigger={refreshTrigger} hierarchy={hierarchy} />;
          if (allowed.includes('creative-hub')) return <CreativeHub token={appState.metaToken!} accountIds={appState.adAccountIds} datePreset={dateSelection} theme={theme} filter={filter} userConfig={appState.userConfig} refreshInterval={refreshInterval} refreshTrigger={refreshTrigger} />;
          if (allowed.includes('ai-lab')) return <AILab theme={theme} />;
          return <div className="p-8 text-center text-slate-500">Please select a section from the menu.</div>;
        }
        return <Dashboard token={appState.metaToken!} accountIds={appState.adAccountIds} datePreset={dateSelection} theme={theme} filter={filter} userConfig={appState.userConfig} refreshInterval={refreshInterval} refreshTrigger={refreshTrigger} />;
    }
  };

  const hasAccess = (appState.userRole === 'admin') || appState.adAccountIds.length > 0;

  if (!hasAccess) {
    return (
      <AccessDenied
        theme={theme}
        onContactSupport={() => window.location.href = 'mailto:info@bsocial-eg.com?subject=Request Access to ADHub'}
        onLogout={handleDisconnect}
      />
    );
  }

  return (
    <Layout
      activeTab={activeTab}
      onNavigate={setActiveTab}
      onDisconnect={handleDisconnect}
      dateSelection={dateSelection}
      onDateChange={setDateSelection}
      theme={theme}
      onThemeToggle={toggleTheme}
      hierarchy={hierarchy}
      filter={filter}
      onFilterChange={setFilter}
      userRole={appState.userRole}
      allowedFeatures={allowedFeatures}
      isDateLocked={isDateLocked}
      accountNames={accountNames}
      onManualRefresh={handleManualRefresh}
      hideAccountName={appState.userConfig?.hide_account_name}
    >
      {React.cloneElement(renderContent() as React.ReactElement<any>, { filterLocked: isFilterLocked })}

      {/* Global Overlays */}

    </Layout>
  );
};

export default App;
