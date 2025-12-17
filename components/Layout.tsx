
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, Megaphone, Zap, Settings, LogOut, Layers, Calendar, Command, Sun, Moon, Menu, ChevronLeft, ChevronRight, Shield, Radio, CheckCircle2, RefreshCw, FileText } from 'lucide-react';
import { DateSelection, Theme, GlobalFilter as GlobalFilterType, AccountHierarchy } from '../types';
import CommandBar from './CommandBar';
import GlobalFilter from './GlobalFilter';
import DateRangeSelector from './DateRangeSelector';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onNavigate: (tab: string) => void;
  onDisconnect: () => void;
  dateSelection: DateSelection;
  onDateChange: (selection: DateSelection) => void;
  theme: Theme;
  onThemeToggle: () => void;

  // Filter Props
  hierarchy: AccountHierarchy;
  filter: GlobalFilterType;
  onFilterChange: (filter: GlobalFilterType) => void;
  userRole?: 'admin' | 'client';

  // Config Props
  allowedFeatures?: string[];
  isDateLocked?: boolean;

  // New: Account Display
  accountNames?: string[];

  // New: Manual Refresh
  onManualRefresh?: () => void;

  // New: Hide Account Name
  hideAccountName?: boolean;

  // New: Navigation Mode
  navigationMode?: 'state' | 'router';
}

const Layout: React.FC<LayoutProps> = ({
  children, activeTab, onNavigate, onDisconnect,
  dateSelection, onDateChange, theme, onThemeToggle,
  hierarchy, filter, onFilterChange, userRole,
  allowedFeatures, isDateLocked, accountNames = [],
  onManualRefresh, hideAccountName, navigationMode = 'state'
}) => {
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    // Persist state: recover from storage or default to false
    const saved = localStorage.getItem('isSidebarCollapsed');
    return saved === 'true';
  });

  // Save sidebar state on change
  useEffect(() => {
    localStorage.setItem('isSidebarCollapsed', String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  const allNavItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'campaigns', label: 'Campaign Manager', icon: Layers },
    { id: 'ads-hub', label: 'Ads Hub', icon: Megaphone },
    { id: 'report-kitchen', label: 'Report Kitchen', icon: FileText },
    { id: 'ai-lab', label: 'AI Laboratory', icon: Zap },
  ];

  // Filter Nav Items based on Permissions
  const navItems = allNavItems.filter(item => {
    // If no config provided (legacy/admin self), show all. 
    // If config provided, strictly filter.
    if (!allowedFeatures) return true;

    // Legacy Compatibility Check
    const legacyMap: Record<string, string> = {
      'ads-hub': 'creative-hub',
      'report-kitchen': 'reporting-engine'
    };

    return allowedFeatures.includes(item.id) || (legacyMap[item.id] && allowedFeatures.includes(legacyMap[item.id]));
  });

  if (userRole === 'admin') {
    navItems.push({ id: 'admin', label: 'Admin Panel', icon: Shield });
  }

  // Global Theme Classes
  const bgClass = theme === 'dark' ? 'bg-[#0f172a]' : 'bg-slate-50';
  const textClass = theme === 'dark' ? 'text-slate-100' : 'text-slate-900';
  const borderClass = theme === 'dark' ? 'border-slate-800' : 'border-slate-200';
  const sidebarBg = theme === 'dark' ? 'bg-slate-950' : 'bg-white';

  // Handle screen resize to reset sidebar state
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(false); // Reset mobile state on desktop
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className={`${theme} ${theme === 'dark' ? 'dark' : ''} flex h-screen overflow-hidden font-sans theme-transition ${bgClass} ${textClass}`}>
      <CommandBar
        isOpen={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
        onNavigate={onNavigate}
        theme={theme}
      />

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-[90] lg:hidden backdrop-blur-sm transition-opacity" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Sidebar - Mobile (Slide Over) & Desktop (Fixed/Collapsible) */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-[100] flex flex-col border-r transform will-change-[width] ${theme === 'dark'
          ? 'bg-[#040B1C] border-white/5 shadow-[10px_0_50px_0_rgba(0,0,0,0.7)]'
          : 'bg-white lg:bg-white/80 border-slate-200/60 backdrop-blur-2xl shadow-[5px_0_30px_0_rgba(0,0,0,0.03)]'
          } 
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} 
        ${isSidebarCollapsed ? 'w-24' : 'w-64'}
        `}
      >
        {/* --- ELITE BACKGROUND LAYERS --- */}
        {/* Wrapped in overflow-hidden to prevent the large Radial Glow from bleeding out of the sidebar */}
        <div className="absolute inset-0 overflow-hidden rounded-none z-0 pointer-events-none">
          {/* Subtle Radial Glow for "Premium" feel without noise */}
          {theme === 'dark' && (
            <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full blur-[120px] bg-brand-600/10 pointer-events-none z-0"></div>
          )}
        </div>

        <div className="relative z-10 flex flex-col h-full">
          {/* --- LOGO AREA --- */}
          <div className={`relative z-10 flex flex-col items-center justify-center ${isSidebarCollapsed ? 'py-6' : 'py-5'}`}>
            <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'space-x-3'}`}>

              {/* Logo Container with "Reactor Core" Glow - Elite Spread */}
              <div className="relative group cursor-pointer flex items-center justify-center">
                {/* 1. Main Soft Spread Glow (Persistent) */}
                <div className={`absolute inset-0 rounded-full bg-blue-500/20 blur-2xl group-hover:bg-blue-500/30 group-hover:blur-3xl ${isSidebarCollapsed ? 'w-16 h-16 scale-125' : 'w-14 h-14 scale-125'}`}></div>

                {/* 2. Core Glow (Intense Center) */}
                <div className={`absolute inset-0 rounded-full bg-indigo-500/10 blur-xl group-hover:bg-indigo-500/20 ${isSidebarCollapsed ? 'scale-110' : 'scale-100'}`}></div>

                <img
                  src="https://icgkbruoltgvchbqednf.supabase.co/storage/v1/object/public/logos/Logo%20Bsocial%20Icon%20new.png"
                  alt="BSocial Logo"
                  className={`relative z-10 object-contain drop-shadow-[0_0_15px_rgba(59,130,246,0.3)] saturate-200 contrast-110 group-hover:scale-105 group-hover:drop-shadow-[0_0_30px_rgba(59,130,246,0.6)] ${isSidebarCollapsed ? 'w-8 h-auto' : 'w-9 h-auto'}`}
                />
              </div>

              {!isSidebarCollapsed && (
                <div className="flex flex-col">
                  <h1 className={`text-xl font-bold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    BSOCIAL
                  </h1>
                  <div className="flex items-center space-x-2">
                    <div className="h-px w-3 bg-brand-500"></div>
                    <p className={`text-[9px] font-bold uppercase tracking-[0.25em] ${theme === 'dark' ? 'text-brand-400' : 'text-brand-600'}`}>INTELLIGENCE</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* --- SEARCH / COMMAND --- */}
          <div className={`px-4 mb-4 ${isSidebarCollapsed ? 'flex justify-center' : ''}`}>
            <button
              onClick={() => setIsCommandOpen(true)}
              className={`relative overflow-hidden group border rounded-xl flex items-center
            ${theme === 'dark'
                  ? 'bg-[#0B1226] border-white/5 hover:border-white/10 text-slate-400'
                  : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100 text-slate-500'
                }
            ${isSidebarCollapsed ? 'w-10 h-10 justify-center p-0' : 'w-full justify-between py-2.5 px-3'}
            shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]
          `}
            >
              {/* Shimmer Effect on Hover - Removed for Speed */}

              <div className="flex items-center justify-center relative z-10">
                <Command size={16} className={`${isSidebarCollapsed ? '' : 'mr-3'} group-hover:text-brand-400`} />
                {!isSidebarCollapsed && <span className="font-medium text-sm">Search</span>}
              </div>
              {!isSidebarCollapsed && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border opacity-50 ${theme === 'dark' ? 'bg-black/30 border-white/10' : 'bg-white border-slate-200'}`}>⌘K</span>
              )}
            </button>
          </div>

          {/* --- MENU ITEMS --- */}
          <nav className={`flex-1 px-3 space-y-1 w-full flex flex-col items-center ${isSidebarCollapsed ? 'overflow-visible' : 'overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]'}`}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              const activeClasses = theme === 'dark'
                ? 'bg-gradient-to-r from-blue-900/40 via-blue-900/10 to-transparent text-white'
                : 'bg-gradient-to-r from-brand-50 to-transparent text-brand-700';

              const inactiveClasses = theme === 'dark'
                ? 'text-slate-400 hover:text-white hover:bg-white/5'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/80';

              const sharedClasses = `relative flex items-center group
            ${isActive ? activeClasses : inactiveClasses}
            ${isSidebarCollapsed ? 'justify-center w-10 h-10 p-0 rounded-xl' : 'w-full px-4 py-2.5 rounded-none lg:rounded-r-xl'}
            transition-all duration-300 ease-out
          `;

              const content = (
                <>
                  {/* Active Indicator Line (Left) - Restored for 'Pill' look without container border */}
                  {isActive && !isSidebarCollapsed && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-lg bg-[#3b82f6]"></div>
                  )}

                  {/* Icon Container */}
                  <div className={`relative flex items-center justify-center transition-transform duration-300 ease-out ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                    {isActive && (
                      <div className="absolute inset-0 bg-brand-500/40 blur-[8px] rounded-full"></div>
                    )}
                    <Icon size={18} className={`relative z-10 ${isActive ? (theme === 'dark' ? 'text-brand-300' : 'text-brand-600') : ''}`} />
                  </div>

                  {!isSidebarCollapsed && (
                    <span className={`ml-3 font-semibold tracking-wide text-sm ${isActive ? 'translate-x-1' : 'group-hover:translate-x-1'}`}>
                      {item.label}
                    </span>
                  )}

                  {/* Tooltip for collapsed */}
                  {isSidebarCollapsed && (
                    <div className={`absolute left-14 z-50 px-3 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none translate-x-2 group-hover:translate-x-0 border border-white/10 shadow-xl`}>
                      {item.label}
                      {/* Arrow */}
                      <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-slate-900 rotate-45 border-l border-b border-white/10"></div>
                    </div>
                  )}
                </>
              );

              if (navigationMode === 'router') {
                return (
                  <Link key={item.id} to={`/${item.id === 'dashboard' ? '' : item.id}`} className={sharedClasses} onClick={() => setIsSidebarOpen(false)}>
                    {content}
                  </Link>
                );
              }
              return (
                <button key={item.id} onClick={() => { onNavigate(item.id); setIsSidebarOpen(false); }} className={sharedClasses}>
                  {content}
                </button>
              );
            })}
          </nav>

          {/* --- FOOTER / CONTROL PAD --- */}
          <div className={`p-4 mt-auto mb-2 w-full ${isSidebarCollapsed ? 'items-center' : ''}`}>
            <div className={`rounded-2xl p-2 flex flex-col gap-1 ${isSidebarCollapsed ? 'bg-transparent' : (theme === 'dark' ? 'bg-[#0B1226] border border-white/5' : 'bg-slate-100/50 border border-slate-200')}`}>

              {/* Manual Refresh */}
              {onManualRefresh && (
                <button onClick={onManualRefresh} title="Refresh Data" className={`flex items-center rounded-lg p-2 hover:bg-brand-500/10 hover:text-brand-500 ${isSidebarCollapsed ? 'justify-center' : ''} ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                  <RefreshCw size={16} className={`${!isSidebarCollapsed && 'mr-3'}`} />
                  {!isSidebarCollapsed && <span className="text-xs font-semibold">Refresh System</span>}
                </button>
              )}

              {/* Theme Toggle */}
              <button onClick={onThemeToggle} title="Switch Theme" className={`flex items-center rounded-lg p-2 hover:bg-brand-500/10 hover:text-brand-500 ${isSidebarCollapsed ? 'justify-center' : 'justify-between'} ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                <div className="flex items-center">
                  {theme === 'dark' ? <Moon size={16} className={!isSidebarCollapsed ? "mr-3 text-brand-300" : ""} /> : <Sun size={16} className={!isSidebarCollapsed ? "mr-3 text-orange-500" : ""} />}
                  {!isSidebarCollapsed && <span className="text-xs font-semibold">{theme === 'dark' ? 'Dark Node' : 'Light Mode'}</span>}
                </div>
                {!isSidebarCollapsed && (
                  <div className={`w-6 h-3 rounded-full relative ${theme === 'dark' ? 'bg-brand-600' : 'bg-slate-300'}`}>
                    <div className={`absolute top-0.5 w-2 h-2 rounded-full bg-white ${theme === 'dark' ? 'left-[calc(100%-10px)]' : 'left-0.5'}`}></div>
                  </div>
                )}
              </button>

              {/* Sign Out */}
              <button onClick={onDisconnect} title="Sign Out" className={`mt-1 flex items-center rounded-lg p-2 hover:bg-red-500/10 hover:text-red-500 text-slate-400 ${isSidebarCollapsed ? 'justify-center' : ''}`}>
                <LogOut size={16} className={`${!isSidebarCollapsed && 'mr-3'}`} />
                {!isSidebarCollapsed && <span className="text-xs font-semibold">Sign Out</span>}
              </button>

            </div>
          </div>
        </div>

        {/* Floating Collapse Toggle - Glass Pill */}
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className={`hidden lg:flex items-center justify-center absolute -right-3 top-24 z-[100] w-6 h-6 rounded-full border shadow-lg backdrop-blur-md hover:scale-110 ${theme === 'dark'
            ? 'bg-slate-900/80 border-white/10 text-slate-400 hover:text-white hover:border-brand-500/50 shadow-black/50'
            : 'bg-white/80 border-white/60 text-slate-500 hover:text-brand-600 hover:border-brand-200 shadow-slate-200/50'
            }`}
        >
          {isSidebarCollapsed ? <ChevronRight size={10} /> : <ChevronLeft size={10} />}
        </button>
      </aside >

      {/* Main Content */}
      < main className={`flex-1 flex flex-col relative overflow-hidden ${bgClass} w-full`}>

        {/* --- ELITE TOP-RIGHT GLOW (AMBIENT) --- */}
        {/* Soft, modern dark blue gradient as requested. No noise. */}
        {theme === 'dark' && (
          <div
            className="absolute top-0 right-0 w-[800px] h-[600px] pointer-events-none z-0 opacity-40 mix-blend-screen"
            style={{
              background: 'radial-gradient(circle at top right, rgba(30, 58, 138, 0.4), rgba(30, 58, 138, 0.1), transparent 70%)',
              filter: 'blur(80px)',
              transform: 'translate3d(0, 0, 0)', // Force GPU acceleration for smoothness
            }}
          ></div>
        )}

        {/* Top Bar - Responsive */}
        {/* Top Bar - Native macOS Style Glass */}
        <header className={`min-h-[5rem] flex flex-col lg:flex-row items-center justify-between px-6 lg:px-8 z-[80] gap-4 py-3 sticky top-0 relative ${theme === 'dark'
          ? 'bg-[#020617]/80 border-b border-white/5 backdrop-blur-xl supports-[backdrop-filter]:bg-[#020617]/60 shadow-[0_4px_30px_rgba(0,0,0,0.5)]'
          : 'bg-white/80 border-b border-slate-200/60 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60 shadow-sm'
          }`}>

          {/* Elite Header Background Layers */}
          {theme === 'dark' && (
            <>
              {/* Noise */}
              <div className="absolute inset-0 opacity-[0.03] contrast-150 brightness-50 pointer-events-none z-0" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
              {/* Subtle Top Highlight */}
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
            </>
          )}
          <div className="flex items-center w-full lg:w-auto justify-between lg:justify-start space-x-4 max-w-2xl flex-1">
            <div className="flex items-center gap-3 w-full">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-2 -ml-2 text-slate-500 hover:text-brand-500 transition-colors"
              >
                <Menu size={24} />
              </button>

              <div className="flex items-center gap-3 text-sm flex-1">
                {/* Integrated Global Filter - Enhanced Container */}
                <div className={`flex relative ${theme === 'dark' ? 'hover:shadow-[0_0_15px_rgba(59,130,246,0.1)]' : ''}`}>
                  <GlobalFilter
                    hierarchy={hierarchy}
                    filter={filter}
                    onChange={onFilterChange}
                    theme={theme}
                    locked={isDateLocked}
                  />
                </div>
              </div>
            </div>

            {/* Date Selector moved here on Mobile */}
            <div className="lg:hidden">
              <DateRangeSelector
                selection={dateSelection}
                onChange={onDateChange}
                theme={theme}
                locked={isDateLocked}
              />
            </div>
          </div>

          {/* Account Display - ABSOLUTE CENTER */}
          {accountNames && accountNames.length > 0 && !hideAccountName && (
            <div className={`hidden lg:flex absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 items-center space-x-2 px-4 py-2 rounded-full border backdrop-blur-md text-xs font-semibold max-w-md truncate ${theme === 'dark' ? 'bg-[#0B0E16]/80 border-brand-500/20 text-brand-100' : 'bg-white/80 border-brand-200 text-brand-800'}`}>
              <CheckCircle2 size={14} className="text-emerald-500 animate-pulse" />
              <span className="truncate">
                Viewing: <span className={theme === 'dark' ? 'text-white' : 'text-slate-900'}>{accountNames.join(', ')}</span>
              </span>
            </div>
          )}

          {/* Desktop Date Selector Position */}
          <div className="hidden lg:flex items-center space-x-4">
            <DateRangeSelector
              selection={dateSelection}
              onChange={onDateChange}
              theme={theme}
              locked={isDateLocked}
            />
          </div>
        </header>

        {/* Live Data Strip - Redesigned: 'Holographic Laser Line' */}
        <div className={`w-full h-px relative flex items-center justify-center z-[60] mt-6 mb-2 ${theme === 'dark' ? 'bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent' : 'bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent'}`}>
          <div className={`absolute -top-3 px-3 py-1 rounded-full border shadow-[0_0_10px_rgba(16,185,129,0.1)] flex items-center gap-2 backdrop-blur-xl ${theme === 'dark'
            ? 'bg-[#0B0E16]/80 border-emerald-500/20 text-emerald-400'
            : 'bg-white/80 border-emerald-500/30 text-emerald-600'
            }`}>
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest">Live Realtime Data</span>
          </div>
        </div>

        <div className="flex-1 overflow-auto relative custom-scrollbar w-full">


          {/* For Campaign Manager, use full width/height without padding/constraints for 'Sheet' feel */}
          {activeTab === 'campaigns' ? (
            <div className="h-full w-full relative z-10">
              {children}
            </div>
          ) : (
            <div className="p-4 lg:p-8 relative z-10 max-w-[1600px] mx-auto w-full">
              {children}
            </div>
          )}
        </div>
      </main >
    </div >
  );
};

export default Layout;
