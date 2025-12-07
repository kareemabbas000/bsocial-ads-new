
import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Megaphone, Zap, Settings, LogOut, Layers, Calendar, Command, Sun, Moon, Menu, ChevronLeft, ChevronRight, Shield, Radio, CheckCircle2, RefreshCw } from 'lucide-react';
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
}

const Layout: React.FC<LayoutProps> = ({ 
  children, activeTab, onNavigate, onDisconnect, 
  dateSelection, onDateChange, theme, onThemeToggle,
  hierarchy, filter, onFilterChange, userRole,
  allowedFeatures, isDateLocked, accountNames = [],
  onManualRefresh
}) => {
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false); // Desktop state

  const allNavItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'campaigns', label: 'Campaign Manager', icon: Layers },
    { id: 'creative-hub', label: 'Creative Hub', icon: Megaphone },
    { id: 'ai-lab', label: 'AI Laboratory', icon: Zap },
  ];

  // Filter Nav Items based on Permissions
  const navItems = allNavItems.filter(item => {
      // If no config provided (legacy/admin self), show all. 
      // If config provided, strictly filter.
      if (!allowedFeatures) return true;
      return allowedFeatures.includes(item.id);
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
      <div className="p-6 flex items-center justify-between">
          <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center w-full' : 'space-x-3'}`}>
              {/* BSocial Logo */}
              <img 
                src="https://vslsjgfhwknxjhtxlhhk.supabase.co/storage/v1/object/public/logos/Logo%20Bsocial%20Icon%20new.png" 
                alt="BSocial Logo" 
                className="w-10 h-10 rounded-full object-contain bg-slate-900 shadow-lg shadow-blue-500/30 shrink-0 border border-white/10" 
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

      <div className="px-4 mb-4">
          <button 
              onClick={() => setIsCommandOpen(true)}
              className={`w-full border text-sm py-2 px-3 rounded-md flex items-center transition-all group ${
                  theme === 'dark' 
                  ? 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-400' 
                  : 'bg-white border-slate-200 hover:border-brand-300 hover:shadow-sm text-slate-600'
              } ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}
          >
              <div className="flex items-center">
                  <Command size={14} className={`${isSidebarCollapsed ? '' : 'mr-2'} group-hover:text-brand-500`} />
                  {!isSidebarCollapsed && <span>Search...</span>}
              </div>
              {!isSidebarCollapsed && <span className={`text-xs px-1.5 py-0.5 rounded border ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200 text-slate-500'}`}>⌘K</span>}
          </button>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                  onNavigate(item.id);
                  setIsSidebarOpen(false); // Close mobile menu on click
              }}
              className={`w-full flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium group relative ${
                isActive 
                  ? theme === 'dark' 
                      ? 'bg-brand-900/20 text-brand-100 border border-brand-500/20 shadow-sm'
                      : 'bg-brand-50 text-brand-700 border border-brand-200 shadow-sm'
                  : theme === 'dark'
                      ? 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                      : 'text-slate-500 hover:bg-slate-100 hover:text-brand-900'
              } ${isSidebarCollapsed ? 'justify-center' : 'space-x-3'}`}
            >
              <Icon size={18} className={`shrink-0 ${isActive ? 'text-brand-500' : 'text-slate-400 group-hover:text-brand-400'}`} />
              {!isSidebarCollapsed && <span>{item.label}</span>}
              
              {/* Tooltip for collapsed mode */}
              {isSidebarCollapsed && (
                  <div className={`absolute left-full ml-2 px-2 py-1 rounded bg-slate-900 text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg border border-slate-700`}>
                      {item.label}
                  </div>
              )}
            </button>
          );
        })}
      </nav>

      <div className={`p-4 border-t flex flex-col gap-2 ${borderClass}`}>
        {onManualRefresh && (
            <button 
              onClick={onManualRefresh}
              className={`w-full flex items-center px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  theme === 'dark' 
                  ? 'bg-slate-900 text-slate-400 hover:text-white border border-transparent' 
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 shadow-sm'
              } ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}
              title="Refresh Data"
            >
              <span className="flex items-center">
                  <span className={isSidebarCollapsed ? '' : 'mr-2'}><RefreshCw size={14} /></span> 
                  {!isSidebarCollapsed && 'Refresh Data'}
              </span>
            </button>
        )}

        <button 
          onClick={onThemeToggle}
          className={`w-full flex items-center px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              theme === 'dark' 
              ? 'bg-slate-900 text-slate-400 hover:text-white border border-transparent' 
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 shadow-sm'
          } ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}
        >
          <span className="flex items-center">
              <span className={isSidebarCollapsed ? '' : 'mr-2'}>{theme === 'dark' ? <Moon size={14}/> : <Sun size={14} className="text-orange-500"/>}</span> 
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
          className={`w-full flex items-center space-x-2 px-4 py-2 text-xs font-medium text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors ${isSidebarCollapsed ? 'justify-center' : 'justify-center'}`}
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
        className={`fixed md:static inset-y-0 left-0 z-50 flex flex-col border-r transform transition-all duration-300 ease-in-out ${sidebarBg} ${borderClass} 
        ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'} 
        ${isSidebarCollapsed ? 'w-20' : 'w-64'}
        `}
      >
        <NavContent />
        
        {/* Floating Collapse Toggle on Border - Enhanced UI */}
        <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className={`hidden md:flex absolute -right-3 top-24 z-50 p-1 rounded-full border shadow-sm transition-all ${
                theme === 'dark'
                ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700'
                : 'bg-white border-slate-200 text-slate-400 hover:text-brand-600 hover:border-brand-200'
            }`}
            title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
            {isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 flex flex-col relative overflow-hidden ${bgClass} w-full`}>
        
        {/* Top Bar - Responsive */}
        <header className={`min-h-[4rem] border-b backdrop-blur-xl flex flex-col md:flex-row items-center justify-between px-4 md:px-8 z-20 transition-colors gap-2 md:gap-4 py-2 ${
            theme === 'dark' ? 'border-slate-800/60 bg-slate-950/30' : 'border-slate-200/60 bg-white/70'
        }`}>
            <div className="flex items-center w-full md:w-auto justify-between md:justify-start space-x-4">
                <div className="flex items-center gap-2">
                    {/* Mobile Menu Button */}
                    <button 
                        onClick={() => setIsSidebarOpen(true)}
                        className="md:hidden p-2 -ml-2 text-slate-500 hover:text-brand-500"
                    >
                        <Menu size={24} />
                    </button>

                    <div className="flex items-center space-x-2 text-sm">
                        {/* Integrated Global Filter */}
                        <GlobalFilter 
                            hierarchy={hierarchy} 
                            filter={filter} 
                            onChange={onFilterChange} 
                            theme={theme}
                            locked={isDateLocked} // Use date lock here as heuristic for "Admin Configured"
                        />
                    </div>
                </div>
                
                {/* Date Selector moved here on Mobile for better top bar balance */}
                <div className="md:hidden">
                     <DateRangeSelector 
                        selection={dateSelection} 
                        onChange={onDateChange} 
                        theme={theme}
                        locked={isDateLocked}
                     />
                </div>
            </div>
            
            {/* Account Display */}
            {accountNames && accountNames.length > 0 && (
                <div className={`hidden lg:flex items-center space-x-2 px-3 py-1.5 rounded-full border text-xs font-medium max-w-xs truncate ${theme === 'dark' ? 'bg-slate-900 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-600'}`}>
                    <CheckCircle2 size={12} className="text-green-500" />
                    <span className="truncate">
                        Viewing: {accountNames.join(', ')}
                    </span>
                </div>
            )}
            
            {/* Desktop Date Selector Position */}
            <div className="hidden md:flex items-center space-x-3">
                 <div className="text-xs text-slate-500 font-medium uppercase tracking-wide">Period</div>
                 <DateRangeSelector 
                    selection={dateSelection} 
                    onChange={onDateChange} 
                    theme={theme}
                    locked={isDateLocked}
                 />
            </div>
        </header>

        {/* Live Data Strip - Modern, Simple, Attractive */}
        <div className={`w-full py-1 flex items-center justify-center space-x-2 z-10 transition-colors border-b ${
            theme === 'dark' 
            ? 'bg-slate-950 border-slate-800/80 text-brand-400' 
            : 'bg-brand-50/50 border-brand-100 text-brand-600'
        }`}>
            <div className={`flex items-center px-3 py-0.5 rounded-full border shadow-sm ${
                theme === 'dark' 
                ? 'bg-slate-900 border-slate-800' 
                : 'bg-white border-brand-200'
            }`}>
                <span className="relative flex h-2 w-2 mr-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className={`text-[10px] font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                    Live Realtime Data
                </span>
            </div>
        </div>

        <div className="flex-1 overflow-auto relative custom-scrollbar w-full">
           {/* Subtle ambient background */}
           <div className={`absolute inset-0 pointer-events-none transition-opacity duration-500 ${
               theme === 'dark' 
               ? 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-900/10 via-slate-950/0 to-slate-950/0 opacity-100' 
               : 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-100/40 via-white/0 to-white/0 opacity-100'
           }`} />
           
           <div className="p-4 md:p-8 relative z-10 max-w-[1600px] mx-auto w-full">
             {children}
           </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;
