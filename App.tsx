
import React, { useState, useEffect } from 'react';
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
import { fetchUserProfile, fetchUserConfig, fetchSystemSetting } from './services/supabaseService';
import LoadingSpinner from './components/LoadingSpinner'; // Added

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [appState, setAppState] = useState<AppState>({
    metaToken: null,
    adAccountIds: [],
    isConnected: false,
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [dateSelection, setDateSelection] = useState<DateSelection>({ preset: 'last_30d' });
  
  // CHANGED: Default theme set to 'dark'
  const [theme, setTheme] = useState<Theme>('dark');
  
  const [hierarchy, setHierarchy] = useState<AccountHierarchy>({ campaigns: [], adSets: [] });
  const [filter, setFilter] = useState<GlobalFilter>({ searchQuery: '', selectedCampaignIds: [], selectedAdSetIds: [] });
  const [loading, setLoading] = useState(true);
  
  // New: Account Display Info
  const [accountNames, setAccountNames] = useState<string[]>([]);

  // Manual Refresh Trigger
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Initialize Session
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
          // This prevents "flicker" on window focus when Supabase just refreshes the token.
          if (!appState.isConnected) {
              initializeUser(session.user.id);
          }
      } else {
          setAppState({ metaToken: null, adAccountIds: [], isConnected: false });
          setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [appState.isConnected]); // Depend on connection state to know if we need to init

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

          } else {
              setAppState(prev => ({
                  ...prev,
                  metaToken: token,
                  isConnected: !!token,
                  userRole: profile?.role,
                  userConfig: config || undefined
              }));
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
    await supabase.auth.signOut();
  };

  const toggleTheme = () => {
      setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleManualRefresh = () => {
      clearCache(); // Force next fetches to hit API
      setRefreshTrigger(prev => prev + 1);
  };

  // Replaced ugly div with LoadingSpinner
  if (loading) return <LoadingSpinner theme={theme} message="Initializing ADHub..." />;

  if (!session) {
    return <Login />;
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
    
    switch (activeTab) {
      case 'dashboard':
        if (!isAdmin && allowed.length > 0 && !allowed.includes('dashboard')) return <div className="p-8 text-center text-slate-500">Access Restricted</div>;
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
        if (!isAdmin && allowed.length > 0 && !allowed.includes('campaigns')) return <div className="p-8 text-center text-slate-500">Access Restricted</div>;
        return <Campaigns 
            token={appState.metaToken!} 
            accountIds={appState.adAccountIds} 
            datePreset={dateSelection} 
            theme={theme} 
            filter={filter} 
            userConfig={appState.userConfig}
            refreshInterval={refreshInterval}
            refreshTrigger={refreshTrigger}
        />;
      case 'creative-hub':
        if (!isAdmin && allowed.length > 0 && !allowed.includes('creative-hub')) return <div className="p-8 text-center text-slate-500">Access Restricted</div>;
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
        if (!isAdmin && allowed.length > 0 && !allowed.includes('ai-lab')) return <div className="p-8 text-center text-slate-500">Access Restricted</div>;
        return <AILab theme={theme} />;
      default:
        if (!isAdmin && allowed.length > 0 && !allowed.includes('dashboard')) {
             return <div className="p-8 text-center text-slate-500">Please select a section from the menu.</div>;
        }
        return <Dashboard token={appState.metaToken!} accountIds={appState.adAccountIds} datePreset={dateSelection} theme={theme} filter={filter} userConfig={appState.userConfig} refreshInterval={refreshInterval} refreshTrigger={refreshTrigger}/>;
    }
  };

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
    >
        {React.cloneElement(renderContent() as React.ReactElement<any>, { filterLocked: isFilterLocked })}
    </Layout>
  );
};

export default App;
