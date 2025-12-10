
import React, { useEffect, useState } from 'react';
import { Search, Zap, LayoutDashboard, Layers, Megaphone, X } from 'lucide-react';
import { Theme } from '../types';

interface CommandBarProps {
  onNavigate: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
  theme: Theme;
}

const CommandBar: React.FC<CommandBarProps> = ({ onNavigate, isOpen, onClose, theme }) => {
  const [query, setQuery] = useState('');

  // Handle keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        isOpen ? onClose() : onClose(); // Toggle handled by parent usually
      }
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const actions = [
    { id: 'dashboard', label: 'Go to Dashboard', icon: LayoutDashboard, type: 'nav' },
    { id: 'campaigns', label: 'Manage Campaigns', icon: Layers, type: 'nav' },
    { id: 'creative-hub', label: 'Creative Analysis', icon: Megaphone, type: 'nav' },
    { id: 'audit', label: 'Run AI Account Audit', icon: Zap, type: 'action' },
    { id: 'optimize', label: 'Generate Optimization Report', icon: Zap, type: 'action' },
  ];

  const filteredActions = actions.filter(a => a.label.toLowerCase().includes(query.toLowerCase()));

  const handleAction = (action: any) => {
    if (action.type === 'nav') {
      onNavigate(action.id);
    }
    onClose();
  };

  // Styles
  const overlayBg = 'bg-black/60 backdrop-blur-sm';
  const modalBg = theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200';
  const headerBorder = theme === 'dark' ? 'border-slate-800' : 'border-slate-100';
  const inputColor = theme === 'dark' ? 'text-white placeholder-slate-500' : 'text-slate-900 placeholder-slate-400';
  const itemHover = theme === 'dark' ? 'hover:bg-slate-800' : 'hover:bg-slate-50';
  const itemText = theme === 'dark' ? 'text-slate-200 group-hover:text-white' : 'text-slate-700 group-hover:text-slate-900';
  const footerBg = theme === 'dark' ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-50 border-slate-100';

  return (
    <div className={`fixed inset-0 z-[60] flex items-start justify-center ${overlayBg} transition-all md:pt-[20vh]`}>
      <div className={`w-full md:max-w-xl ${modalBg} md:border md:rounded-xl shadow-2xl overflow-hidden animate-fade-in-down flex flex-col h-full md:h-auto`}>
        <div className={`flex items-center px-4 py-4 border-b ${headerBorder} shrink-0`}>
          <Search className="text-slate-400 mr-3" size={20} />
          <input
            autoFocus
            type="text"
            placeholder="Search..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className={`flex-1 bg-transparent border-none outline-none text-lg ${inputColor}`}
          />
          <button onClick={onClose} className="p-2 -mr-2 text-slate-500 hover:text-slate-700 dark:hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          <div className="text-xs font-semibold text-slate-500 px-3 py-2 uppercase tracking-wider">Suggested</div>
          {filteredActions.map((action, idx) => (
            <button
              key={idx}
              onClick={() => handleAction(action)}
              className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg ${itemHover} transition-colors text-left group`}
            >
              <div className={`p-2 rounded-md ${action.type === 'action'
                  ? (theme === 'dark' ? 'bg-brand-500/10 text-brand-400' : 'bg-brand-50 text-brand-600')
                  : (theme === 'dark' ? 'bg-slate-700/30 text-slate-400' : 'bg-slate-100 text-slate-500')
                } ${theme === 'dark' ? 'group-hover:bg-slate-700' : 'group-hover:bg-slate-200'}`}>
                <action.icon size={18} />
              </div>
              <span className={`font-medium ${itemText}`}>{action.label}</span>
              {idx === 0 && <span className="ml-auto text-xs text-slate-500 hidden md:inline">↵ Enter</span>}
            </button>
          ))}

          {filteredActions.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              No results found.
            </div>
          )}
        </div>

        <div className={`${footerBg} px-4 py-3 md:py-2 border-t flex justify-between items-center text-xs text-slate-500 shrink-0 mt-auto md:mt-0 safe-area-bottom`}>
          <span>Ask AI to analyze specific metrics</span>
          <div className="flex space-x-2 hidden md:flex">
            <span className={`px-1.5 py-0.5 rounded border ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>esc</span>
            <span>to close</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandBar;
