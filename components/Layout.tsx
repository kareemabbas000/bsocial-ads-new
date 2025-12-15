
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
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(false); // Reset mobile state on desktop
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const NavContent = () => (
    <>
      <div className={`transition-all duration-300 ease-in-out flex items-center ${isSidebarCollapsed ? 'w-full justify-center py-6 px-0' : 'w-full justify-between p-6'}`}>
        <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center w-full' : 'space-x-3'}`}>
          {/* BSocial Logo */}
          <img
            src="https://icgkbruoltgvchbqednf.supabase.co/storage/v1/object/public/logos/Logo%20Bsocial%20Icon%20new.png"
            alt="BSocial Logo"
            className={`rounded-full object-contain bg-slate-900 shadow-lg shadow-blue-500/30 shrink-0 border border-white/10 ${isSidebarCollapsed ? 'w-10 h-10' : 'w-10 h-10'}`}
          />

          {!isSidebarCollapsed && (
            <div className="overflow-hidden flex flex-col justify-center">
              <h1 className={`text-lg font-extrabold tracking-tight whitespace-nowrap ${theme === 'dark' ? 'text-white' : 'text-brand-900'}`}>
                BSOCIAL
              </h1>
              <p className={`text-[10px] font-bold uppercase tracking-[0.2em] whitespace-nowrap ${theme === 'dark' ? 'text-brand-400' : 'text-brand-600'}`}>AD INTELLIGENCE</p>
            </div>
          )}
        </div>
      </div>

      <div className={`px-4 mb-4 ${isSidebarCollapsed ? 'flex justify-center' : ''}`}>
        <button
          onClick={() => setIsCommandOpen(true)}
          className={`border text-sm py-2 px-3 rounded-md flex items-center transition-all group ${theme === 'dark'
            ? 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-400'
            : 'bg-white border-slate-200 hover:border-brand-300 hover:shadow-sm text-slate-600'
            } ${isSidebarCollapsed ? 'w-10 h-10 justify-center p-0' : 'w-full justify-between'}`}
        >
          <div className="flex items-center justify-center">
            <Command size={14} className={`${isSidebarCollapsed ? '' : 'mr-2'} group-hover:text-brand-500`} />
            {!isSidebarCollapsed && <span>Search...</span>}
          </div>
          {!isSidebarCollapsed && <span className={`text-xs px-1.5 py-0.5 rounded border ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200 text-slate-500'}`}>⌘K</span>}
        </button>
      </div>

      <nav className="flex-1 px-3 space-y-1 w-full flex flex-col items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          const sharedClasses = `flex items-center transition-all duration-200 text-sm font-semibold group relative overflow-hidden backdrop-blur-sm ${isActive
            ? theme === 'dark'
              ? 'bg-brand-500/10 text-white shadow-[inset_0_0_20px_rgba(59,130,246,0.1)] border border-brand-500/20 shadow-brand-500/10'
              : 'bg-white/60 text-brand-700 border border-white/50 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] backdrop-blur-md'
            : theme === 'dark'
              ? 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent hover:border-white/5'
              : 'text-slate-500 hover:bg-white/40 hover:text-brand-800 border border-transparent hover:border-white/30'
            } ${isSidebarCollapsed ? 'justify-center w-12 h-12 rounded-xl p-0' : 'space-x-3 w-full px-4 py-3.5 rounded-2xl'}`;

          const content = (
            <>
              <Icon size={18} className={`shrink-0 ${isActive ? 'text-brand-500' : 'text-slate-400 group-hover:text-brand-400'}`} />
              {!isSidebarCollapsed && <span>{item.label}</span>}

              {/* Tooltip for collapsed mode */}
              {isSidebarCollapsed && (
                <div className={`absolute left-full ml-2 px-2 py-1 rounded bg-slate-900 text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg border border-slate-700`}>
                  {item.label}
                </div>
              )}
            </>
          );

          if (navigationMode === 'router') {
            return (
              <Link
                key={item.id}
                to={`/${item.id === 'dashboard' ? '' : item.id}`}
                className={sharedClasses}
                onClick={() => setIsSidebarOpen(false)}
              >
                {content}
              </Link>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => {
                onNavigate(item.id);
                setIsSidebarOpen(false); // Close mobile menu on click
              }}
              className={sharedClasses}
            >
              {content}
            </button>
          );
        })}
      </nav>

      <div className={`p-4 border-t flex flex-col gap-2 w-full ${borderClass}`}>
        {onManualRefresh && (
          <button
            onClick={onManualRefresh}
            className={`flex items-center rounded-lg text-xs font-medium transition-all ${theme === 'dark'
              ? 'bg-slate-900 text-slate-400 hover:text-white border border-transparent'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 shadow-sm'
              } ${isSidebarCollapsed ? 'w-10 h-10 justify-center p-0' : 'w-full px-3 py-2 justify-between'}`}
            title="Refresh Data"
          >
            <span className="flex items-center justify-center">
              <span className={isSidebarCollapsed ? '' : 'mr-2'}><RefreshCw size={14} /></span>
              {!isSidebarCollapsed && 'Refresh Data'}
            </span>
          </button>
        )}

        <button
          onClick={onThemeToggle}
          className={`flex items-center rounded-lg text-xs font-medium transition-all ${theme === 'dark'
            ? 'bg-slate-900 text-slate-400 hover:text-white border border-transparent'
            : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 shadow-sm'
            } ${isSidebarCollapsed ? 'w-10 h-10 justify-center p-0' : 'w-full px-3 py-2 justify-between'}`}
        >
          <span className="flex items-center justify-center">
            <span className={isSidebarCollapsed ? '' : 'mr-2'}>{theme === 'dark' ? <Moon size={14} /> : <Sun size={14} className="text-orange-500" />}</span>
            {!isSidebarCollapsed && (theme === 'dark' ? 'Dark Mode' : 'Light Mode')}
          </span>
          {!isSidebarCollapsed && (
            <div className={`w-8 h-4 rounded-full p-0.5 flex transition-colors ${theme === 'dark' ? 'bg-brand-600 justify-end' : 'bg-slate-300 justify-start'}`}>
              <div className="w-3 h-3 bg-white rounded-full shadow-sm"></div>
            </div>
          )}
        </button>

        <button
          onClick={onDisconnect}
          className={`flex items-center space-x-2 text-xs font-medium text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors ${isSidebarCollapsed ? 'w-10 h-10 justify-center p-0' : 'w-full px-4 py-2 justify-center'}`}
        >
          <LogOut size={14} />
          {!isSidebarCollapsed && <span>Sign Out</span>}
        </button>
      </div>
    </>
  );

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
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Sidebar - Mobile (Slide Over) & Desktop (Fixed/Collapsible) */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 flex flex-col border-r transform transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${theme === 'dark'
          ? 'bg-[#0B0E16]/60 border-white/5 backdrop-blur-3xl shadow-[5px_0_30px_0_rgba(0,0,0,0.5)]'
          : 'bg-white/50 border-white/20 backdrop-blur-3xl shadow-[5px_0_30px_0_rgba(0,0,0,0.05)]'
          } 
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} 
        ${isSidebarCollapsed ? 'w-24' : 'w-80'}
        `}
      >
        {/* Glass Reflection / Noise Layer */}
        <div className={`absolute inset-0 pointer-events-none z-0 ${theme === 'dark' ? 'bg-gradient-to-b from-white/[0.01] to-transparent' : 'bg-gradient-to-b from-white/40 to-transparent'}`}></div>

        <div className="relative z-10 flex flex-col h-full">
          <NavContent />
        </div>

        {/* Ambient Glow for Dark Mode Sidebar */}
        {theme === 'dark' && (
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_0%_0%,rgba(2,6,23,0.4),transparent_50%)] pointer-events-none"></div>
        )}

        {/* Floating Collapse Toggle - Glass Pill */}
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className={`hidden md:flex items-center justify-center absolute -right-3 top-24 z-50 w-6 h-6 rounded-full border shadow-lg backdrop-blur-md transition-all hover:scale-110 ${theme === 'dark'
            ? 'bg-slate-900/80 border-white/10 text-slate-400 hover:text-white hover:border-brand-500/50 shadow-black/50'
            : 'bg-white/80 border-white/60 text-slate-500 hover:text-brand-600 hover:border-brand-200 shadow-slate-200/50'
            }`}
        >
          {isSidebarCollapsed ? <ChevronRight size={10} /> : <ChevronLeft size={10} />}
        </button>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 flex flex-col relative overflow-hidden ${bgClass} w-full`}>

        {/* Top Bar - Responsive */}
        {/* Top Bar - Native macOS Style Glass */}
        <header className={`min-h-[5rem] flex flex-col md:flex-row items-center justify-between px-6 md:px-8 z-20 transition-all gap-4 py-3 sticky top-0 relative ${theme === 'dark'
          ? 'bg-[#0B0E16]/50 border-b border-white/5 backdrop-blur-3xl supports-[backdrop-filter]:bg-[#0B0E16]/30'
          : 'bg-white/90 border-b border-slate-200/60 backdrop-blur-3xl supports-[backdrop-filter]:bg-white/80 shadow-sm'
          }`}>
          <div className="flex items-center w-full md:w-auto justify-between md:justify-start space-x-4 max-w-2xl flex-1">
            <div className="flex items-center gap-3 w-full">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="md:hidden p-2 -ml-2 text-slate-500 hover:text-brand-500 transition-colors"
              >
                <Menu size={24} />
              </button>

              <div className="flex items-center gap-3 text-sm flex-1">
                {/* Integrated Global Filter - Enhanced Container */}
                <div className={`flex relative transition-all duration-300 ${theme === 'dark' ? 'hover:shadow-[0_0_15px_rgba(59,130,246,0.1)]' : ''}`}>
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
            <div className="md:hidden">
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
          <div className="hidden md:flex items-center space-x-4">
            <DateRangeSelector
              selection={dateSelection}
              onChange={onDateChange}
              theme={theme}
              locked={isDateLocked}
            />
          </div>
        </header>

        {/* Live Data Strip - Redesigned: 'Holographic Laser Line' */}
        <div className={`w-full h-px relative flex items-center justify-center z-30 mt-6 mb-2 ${theme === 'dark' ? 'bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent' : 'bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent'}`}>
          <div className={`absolute -top-3 px-3 py-1 rounded-full border shadow-[0_0_15px_rgba(16,185,129,0.2)] flex items-center gap-2 backdrop-blur-md ${theme === 'dark'
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
            <div className="p-4 md:p-8 relative z-10 max-w-[1600px] mx-auto w-full">
              {children}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Layout;
