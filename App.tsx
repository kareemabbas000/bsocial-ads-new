import React, { useState, useEffect, useRef } from 'react';
import { flushSync } from 'react-dom';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { supabase } from './services/supabaseClient';
import { Session } from '@supabase/supabase-js';
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
import LoadingSpinner from './components/LoadingSpinner';
import AccessDenied from './components/AccessDenied';
import ReportingEngine from './pages/ReportingEngine';
import Onboarding from './pages/Onboarding';

// Helper Component for Router Mode (Extracting logic that needs Router Context)
const RouterApp: React.FC<{
  appProps: any;
  theme: Theme;
  toggleTheme: () => void;
  handleDisconnect: () => void;
  hierarchy: AccountHierarchy;
  filter: GlobalFilter;
  setFilter: (f: GlobalFilter) => void;
  accountNames: string[];
  handleManualRefresh: () => void;
  enableManualRefresh: boolean; // New Prop
  dateSelection: DateSelection;
  setDateSelection: (d: DateSelection) => void;
  loading: boolean;
}> = ({
  appProps, theme, toggleTheme, handleDisconnect, hierarchy, filter, setFilter,
  accountNames, handleManualRefresh, enableManualRefresh, dateSelection, setDateSelection, loading
}) => {
    const location = useLocation();
    const activeTab = location.pathname.substring(1) || 'dashboard';
    const { appState, allowedFeatures, isDateLocked, isFilterLocked, refreshInterval, refreshTrigger } = appProps;

    // ... (rest of logic same)

    // Guard: Connection Wait
    if (!appState.metaToken && activeTab !== 'admin' && activeTab !== 'login') {
      return <LoadingSpinner theme={theme} message="Connecting to Meta..." />;
    }

    // Guard: Access Denied (Zero Access)
    const hasGlobalAccess = (appState.userRole === 'admin') || appState.adAccountIds.length > 0;
    if (!hasGlobalAccess) {
      return <AccessDenied theme={theme} onContactSupport={() => window.location.href = 'mailto:info@bsocial-eg.com'} onLogout={handleDisconnect} />;
    }

    const commonProps = {
      token: appState.metaToken!,
      accountIds: appState.adAccountIds,
      datePreset: dateSelection,
      theme,
      filter,
      userConfig: appState.userConfig,
      refreshInterval,
      refreshTrigger,
      hierarchy
    };

    const hasAccess = (feature: string) => {
      if (appState.userRole === 'admin') return true;
      const allowed = appState.userConfig?.allowed_features || [];
      return allowed.includes(feature);
    };

    const ProtectedRoute = ({ feature, children }: { feature: string, children: React.ReactNode }) => {
      if (!hasAccess(feature)) {
        return <div className="p-8 text-center text-slate-500">Access Restricted</div>;
      }
      return <>{children}</>;
    };

    return (
      <Layout
        activeTab={activeTab}
        onNavigate={() => { }} // Controlled by Link in Router Mode
        navigationMode="router"
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
        onManualRefresh={enableManualRefresh ? handleManualRefresh : undefined}
        hideAccountName={appState.userConfig?.hide_account_name}
      >
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<ProtectedRoute feature="dashboard"><Dashboard {...commonProps} /></ProtectedRoute>} />
          <Route path="/campaigns" element={<ProtectedRoute feature="campaigns"><Campaigns {...commonProps} /></ProtectedRoute>} />
          <Route path="/ads-hub" element={<ProtectedRoute feature="ads-hub"><CreativeHub {...commonProps} /></ProtectedRoute>} />
          <Route path="/ai-lab" element={<ProtectedRoute feature="ai-lab"><AILab theme={theme} /></ProtectedRoute>} />
          <Route path="/report-kitchen" element={<ProtectedRoute feature="report-kitchen"><ReportingEngine {...commonProps} hierarchy={hierarchy} /></ProtectedRoute>} />
          {/* Admin Route */}
          {appState.userRole === 'admin' && (
            <Route path="/admin" element={<AdminPanel theme={theme} />} />
          )}
          <Route path="*" element={<div className="p-8 text-center text-slate-500">Page Not Found</div>} />
        </Routes>
      </Layout>
    );
  };

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Prevent aggressive refetching
      retry: 1, // Limited retries
    },
  },
});

const App: React.FC = () => {
  // ... existing state
  const [session, setSession] = useState<any>(null);
  const [appState, setAppState] = useState<AppState>({
    metaToken: null,
    adAccountIds: [],
    isConnected: false,
  });

  // New: Feature Flag
  const [enableRouter, setEnableRouter] = useState(false);
  const [enableManualRefresh, setEnableManualRefresh] = useState(false); // New State

  // ... (keep all existing state: activeTab, dateSelection, theme, etc.)
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
  const [accountNames, setAccountNames] = useState<string[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // ... (keep useEffects for persistence) ...
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
  }, [theme]);

  // Stabilize Connection
  const isConnectedRef = useRef(appState.isConnected);
  useEffect(() => {
    isConnectedRef.current = appState.isConnected;
  }, [appState.isConnected]);

  // Auth Listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) initializeUser(session.user.id);
      else setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession((prev: Session | null) => {
        if (prev?.access_token === session?.access_token) return prev;
        return session;
      });

      if (session) {
        if (!isConnectedRef.current) {
          initializeUser(session.user.id);
        }
      } else {
        setAppState({ metaToken: null, adAccountIds: [], isConnected: false });
        setHierarchy({ campaigns: [], adSets: [], ads: [] });
        setAccountNames([]);
        setFilter({ searchQuery: '', selectedCampaignIds: [], selectedAdSetIds: [] });
        setLoading(false);

        if (typeof window !== 'undefined' && window.location.pathname !== '/') {
          window.history.replaceState(null, '', '/');
        }
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const initializeUser = async (userId: string, retryCount = 0) => {
    if (!appState.isConnected && retryCount === 0) {
      setLoading(true);
    }
    try {
      const [profile, config, token, routerEnabled, manualRefreshEnabled] = await Promise.all([
        fetchUserProfile(userId),
        fetchUserConfig(userId),
        fetchSystemSetting('meta_token'),
        fetchSystemSetting('enable_react_router'),
        fetchSystemSetting('enable_manual_refresh')
      ]);

      if (routerEnabled !== null) {
        setEnableRouter(routerEnabled === 'true');
      }
      if (manualRefreshEnabled !== null) {
        setEnableManualRefresh(manualRefreshEnabled === 'true');
      }

      if ((!profile || !config) && retryCount < 3) {
        console.warn(`Fetch failed. Retrying... (${retryCount + 1}/3)`);
        setTimeout(() => initializeUser(userId, retryCount + 1), 500);
        return;
      }

      if (token && config && config.ad_account_ids.length > 0) {
        setAppState({
          metaToken: token,
          adAccountIds: config.ad_account_ids,
          isConnected: true,
          userRole: profile?.role,
          userConfig: config
        });

        if (!profile?.company || profile.company === 'Default Organization') {
          setAppState(prev => ({ ...prev, needsOnboarding: true }));
        } else {
          setAppState(prev => ({ ...prev, needsOnboarding: false }));
        }

        try {
          const allAccounts = await fetchAdAccounts(token);
          const names = allAccounts
            .filter(acc => {
              const accIdClean = acc.id.replace('act_', '');
              const configIdsClean = config.ad_account_ids.map(id => id.replace('act_', ''));
              return configIdsClean.includes(accIdClean);
            })
            .map(acc => acc.name);
          setAccountNames(names);
        } catch (e) {
          console.error(e);
        }

        if (config.theme) setTheme(config.theme);
      } else {
        setAppState(prev => ({
          ...prev,
          metaToken: token,
          isConnected: !!token,
          userRole: profile?.role,
          userConfig: config || undefined
        }));
        if (!profile?.company || profile.company === 'Default Organization') {
          setAppState(prev => ({ ...prev, needsOnboarding: true }));
        } else {
          setAppState(prev => ({ ...prev, needsOnboarding: false }));
        }
        if (config?.theme) setTheme(config.theme);
      }

      if (config?.fixed_date_start && config?.fixed_date_end) {
        setDateSelection({
          preset: 'custom',
          custom: { startDate: config.fixed_date_start, endDate: config.fixed_date_end }
        });
      }

      const allowed = config?.allowed_features || ['dashboard', 'campaigns', 'ads-hub', 'ai-lab'];
      if (profile?.role !== 'admin' && !allowed.includes('dashboard') && allowed.length > 0) {
        if (activeTab === 'dashboard' && !allowed.includes('dashboard')) {
          setActiveTab(allowed[0]);
        }
      }

      setLoading(false);
    } catch (e) {
      console.error(e);
      if (retryCount < 3) {
        setTimeout(() => initializeUser(userId, retryCount + 1), 1000);
      } else {
        setLoading(false);
      }
    }
  };

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
    try { await supabase.auth.signOut(); } catch (e) { console.error(e); }
    setSession(null);
    setAppState({ metaToken: null, adAccountIds: [], isConnected: false });
    setHierarchy({ campaigns: [], adSets: [], ads: [] });
    setAccountNames([]);
    setFilter({ searchQuery: '', selectedCampaignIds: [], selectedAdSetIds: [] });
    setLoading(false);
  };

  const toggleTheme = async () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    const updateVisuals = () => {
      setTheme(nextTheme);
      if (nextTheme === 'dark') document.body.classList.add('dark');
      else document.body.classList.remove('dark');
    };

    const persistTheme = async () => {
      if (session?.user?.id && appState.userRole) {
        try { await updateUserConfig(session.user.id, { theme: nextTheme }); } catch (e) { }
      }
    };

    if ((document as any).startViewTransition) {
      (document as any).startViewTransition(() => {
        flushSync(() => { updateVisuals(); });
      });
    } else {
      updateVisuals();
    }
    persistTheme();
  };

  const handleManualRefresh = () => {
    clearCache();
    queryClient.invalidateQueries();
    if (appState.isConnected && appState.metaToken) {
      fetchAdAccounts(appState.metaToken).then(() => { });
    }
    setRefreshTrigger(prev => prev + 1);
  };

  if (loading) return <LoadingSpinner theme={theme} message="Initializing ADHub..." />;
  if (!session) return <Login theme={theme} />;

  if (appState.needsOnboarding) {
    return (
      <QueryClientProvider client={queryClient}>
        <Onboarding session={session} onComplete={() => handleManualRefresh()} />
      </QueryClientProvider>
    );
  }

  // --- ROUTER MODE RENDER ---
  if (enableRouter) {
    const allowedFeatures = appState.userConfig?.allowed_features;
    const isDateLocked = !!(appState.userConfig?.fixed_date_start && appState.userConfig?.fixed_date_end);
    const isFilterLocked = !!(appState.userConfig?.global_campaign_filter && appState.userConfig.global_campaign_filter.length > 0);
    const refreshInterval = appState.userConfig?.refresh_interval || 10;

    const appProps = {
      appState,
      allowedFeatures,
      isDateLocked,
      isFilterLocked,
      refreshInterval,
      refreshTrigger
    };

    return (
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <RouterApp
            appProps={appProps}
            theme={theme}
            toggleTheme={toggleTheme}
            handleDisconnect={handleDisconnect}
            hierarchy={hierarchy}
            filter={filter}
            setFilter={setFilter}
            accountNames={accountNames}
            handleManualRefresh={handleManualRefresh}
            enableManualRefresh={enableManualRefresh}
            dateSelection={dateSelection}
            setDateSelection={setDateSelection}
            loading={loading}
          />
        </BrowserRouter>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    );
  }

  // --- LEGACY STATE MODE RENDER ---
  if (appState.userRole === 'admin' && activeTab === 'admin') {
    return (
      <QueryClientProvider client={queryClient}>
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
          onManualRefresh={enableManualRefresh ? handleManualRefresh : undefined}
          allowedFeatures={appState.userConfig?.allowed_features}
        >
          <AdminPanel theme={theme} />
        </Layout>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    );
  }

  const allowedFeatures = appState.userConfig?.allowed_features;
  const isDateLocked = !!(appState.userConfig?.fixed_date_start && appState.userConfig?.fixed_date_end);
  const isFilterLocked = !!(appState.userConfig?.global_campaign_filter && appState.userConfig.global_campaign_filter.length > 0);
  const refreshInterval = appState.userConfig?.refresh_interval || 10;

  const renderContent = () => {
    const allowed = allowedFeatures || [];

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
      case 'ads-hub':
        if (allowed.length > 0 && !allowed.includes('ads-hub') && !allowed.includes('creative-hub')) return <div className="p-8 text-center text-slate-500">Access Restricted</div>;
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
      case 'report-kitchen':
        if (allowed.length > 0 && !allowed.includes('report-kitchen') && !allowed.includes('reporting-engine')) return <div className="p-8 text-center text-slate-500">Access Restricted</div>;
        return <ReportingEngine
          token={appState.metaToken!}
          accountIds={appState.adAccountIds}
          datePreset={dateSelection}
          theme={theme}
          filter={filter}
          userConfig={appState.userConfig}
          hierarchy={hierarchy}
        />;
      default:
        // Default Fallbacks
        if (allowed.length > 0 && !allowed.includes('dashboard')) {
          if (allowed.includes('campaigns')) return <Campaigns token={appState.metaToken!} accountIds={appState.adAccountIds} datePreset={dateSelection} theme={theme} filter={filter} userConfig={appState.userConfig} refreshInterval={refreshInterval} refreshTrigger={refreshTrigger} hierarchy={hierarchy} />;
          if (allowed.includes('ads-hub') || allowed.includes('creative-hub')) return <CreativeHub token={appState.metaToken!} accountIds={appState.adAccountIds} datePreset={dateSelection} theme={theme} filter={filter} userConfig={appState.userConfig} refreshInterval={refreshInterval} refreshTrigger={refreshTrigger} />;
          if (allowed.includes('report-kitchen') || allowed.includes('reporting-engine')) return <ReportingEngine token={appState.metaToken!} accountIds={appState.adAccountIds} datePreset={dateSelection} theme={theme} filter={filter} userConfig={appState.userConfig} hierarchy={hierarchy} />;
          if (allowed.includes('ai-lab')) return <AILab theme={theme} />;
          return <div className="p-8 text-center text-slate-500">Please select a section from the menu.</div>;
        }
        return <Dashboard token={appState.metaToken!} accountIds={appState.adAccountIds} datePreset={dateSelection} theme={theme} filter={filter} userConfig={appState.userConfig} refreshInterval={refreshInterval} refreshTrigger={refreshTrigger} />;
    }
  };

  const hasAccess = (appState.userRole === 'admin') || appState.adAccountIds.length > 0;
  if (!hasAccess) {
    return <AccessDenied theme={theme} onContactSupport={() => window.location.href = 'mailto:info@bsocial-eg.com'} onLogout={handleDisconnect} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
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
        onManualRefresh={enableManualRefresh ? handleManualRefresh : undefined}
        hideAccountName={appState.userConfig?.hide_account_name}
      >
        {React.cloneElement(renderContent() as React.ReactElement<any>, { filterLocked: isFilterLocked })}
      </Layout>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
};

export default App;
