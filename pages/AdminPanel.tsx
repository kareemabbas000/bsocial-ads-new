
import React, { useEffect, useState } from 'react';
import { fetchAllUsers, updateUserRole, updateUserConfig, fetchSystemSetting, updateSystemSetting } from '../services/supabaseService';
import { fetchAdAccounts, fetchCampaignsBatch } from '../services/metaService';
import { UserProfile, UserConfig, Theme, AdAccount } from '../types';
import { Users, Settings, Shield, Save, X, Edit, CheckSquare, Search, Key, Calendar, Layers, Lock, AlertTriangle, Clock } from 'lucide-react';

interface AdminPanelProps {
  theme: Theme;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ theme }) => {
  const [users, setUsers] = useState<(UserProfile & { config?: UserConfig })[]>([]);
  const [loading, setLoading] = useState(true);
  const [metaToken, setMetaToken] = useState('');
  const [editingUser, setEditingUser] = useState<(UserProfile & { config?: UserConfig }) | null>(null);
  const [editForm, setEditForm] = useState<Partial<UserConfig> & { role?: 'admin'|'client' }>({});
  
  // Available Meta Assets
  const [availableAccounts, setAvailableAccounts] = useState<AdAccount[]>([]);
  const [fetchingAccounts, setFetchingAccounts] = useState(false);
  const [accountSearchQuery, setAccountSearchQuery] = useState(''); // New Search State

  // Campaign Search State
  const [accountCampaigns, setAccountCampaigns] = useState<{id: string, name: string, accountId: string}[]>([]);
  const [campaignSearch, setCampaignSearch] = useState('');
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);

  const isDark = theme === 'dark';
  const cardClass = isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200';
  const textClass = isDark ? 'text-white' : 'text-slate-900';
  const inputClass = isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
        const [usersData, token] = await Promise.all([
            fetchAllUsers(),
            fetchSystemSetting('meta_token')
        ]);
        setUsers(usersData);
        setMetaToken(token || '');
        if(token) fetchAccounts(token);
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  const fetchAccounts = async (token: string) => {
      setFetchingAccounts(true);
      try {
          const accounts = await fetchAdAccounts(token);
          setAvailableAccounts(accounts);
      } catch (e) {
          console.error("Failed to load ad accounts for admin selector");
      } finally {
          setFetchingAccounts(false);
      }
  };

  // Fetch campaigns when accounts change in edit mode
  useEffect(() => {
      if (editingUser && editForm.ad_account_ids && editForm.ad_account_ids.length > 0 && metaToken) {
          loadCampaignsForSearch(editForm.ad_account_ids);
      } else {
          setAccountCampaigns([]);
      }
  }, [editForm.ad_account_ids, metaToken]);

  const loadCampaignsForSearch = async (accountIds: string[]) => {
      setLoadingCampaigns(true);
      try {
          const camps = await fetchCampaignsBatch(accountIds, metaToken);
          setAccountCampaigns(camps);
      } catch (e) {
          console.error("Failed to batch fetch campaigns");
      } finally {
          setLoadingCampaigns(false);
      }
  };

  const handleSaveToken = async () => {
      await updateSystemSetting('meta_token', metaToken);
      alert("System Token Updated");
      fetchAccounts(metaToken);
  };

  const openEdit = (user: UserProfile & { config?: UserConfig }) => {
      setEditingUser(user);
      setEditForm({
          role: user.role,
          ad_account_ids: user.config?.ad_account_ids || [],
          allowed_profiles: user.config?.allowed_profiles || ['sales'],
          allowed_features: user.config?.allowed_features || ['dashboard', 'campaigns', 'creative-hub', 'ai-lab'],
          hide_total_spend: user.config?.hide_total_spend || false,
          spend_multiplier: user.config?.spend_multiplier || 1.0,
          global_campaign_filter: user.config?.global_campaign_filter || [],
          fixed_date_start: user.config?.fixed_date_start || '',
          fixed_date_end: user.config?.fixed_date_end || '',
          refresh_interval: user.config?.refresh_interval || 10
      });
  };

  const handleSaveUser = async () => {
      if (!editingUser) return;
      try {
          if (editForm.role && editForm.role !== editingUser.role) {
              await updateUserRole(editingUser.id, editForm.role);
          }
          
          const configUpdates: Partial<UserConfig> = {
              ad_account_ids: editForm.ad_account_ids,
              allowed_profiles: editForm.allowed_profiles,
              allowed_features: editForm.allowed_features,
              hide_total_spend: editForm.hide_total_spend,
              spend_multiplier: editForm.spend_multiplier,
              global_campaign_filter: editForm.global_campaign_filter,
              fixed_date_start: editForm.fixed_date_start || (null as any), 
              fixed_date_end: editForm.fixed_date_end || (null as any)
          };
          
          await updateUserConfig(editingUser.id, configUpdates);
          setEditingUser(null);
          loadData();
      } catch (e: any) {
          console.error("Error updating user:", e);
          const errorMsg = e.message || (typeof e === 'object' ? JSON.stringify(e) : String(e));
          alert(`Error updating user: ${errorMsg}`);
      }
  };

  const toggleArrayItem = (field: 'allowed_profiles' | 'allowed_features', value: string) => {
      const current = editForm[field] || [];
      if (current.includes(value)) {
          setEditForm({ ...editForm, [field]: current.filter(i => i !== value) });
      } else {
          setEditForm({ ...editForm, [field]: [...current, value] });
      }
  };

  const toggleAdAccount = (accountId: string) => {
      const current = editForm.ad_account_ids || [];
      if (current.includes(accountId)) {
          setEditForm({ ...editForm, ad_account_ids: current.filter(id => id !== accountId) });
      } else {
          setEditForm({ ...editForm, ad_account_ids: [...current, accountId] });
      }
  };

  const toggleCampaignFilter = (campaignId: string) => {
      const current = editForm.global_campaign_filter || [];
      if (current.includes(campaignId)) {
          setEditForm({ ...editForm, global_campaign_filter: current.filter(id => id !== campaignId) });
      } else {
          setEditForm({ ...editForm, global_campaign_filter: [...current, campaignId] });
      }
  };

  // Filter accounts based on search
  const filteredAccounts = availableAccounts.filter(acc => 
      acc.name.toLowerCase().includes(accountSearchQuery.toLowerCase()) || 
      acc.id.includes(accountSearchQuery)
  );

  if (loading) return <div className="p-8 text-center text-slate-500">Loading Administration...</div>;

  return (
    <div className="space-y-8 pb-12">
        {/* ... (Previous code remains) ... */}
        <div className="flex justify-between items-center">
            <div>
                <h1 className={`text-2xl font-bold ${textClass}`}>Admin Console</h1>
                <p className="text-slate-500 text-sm">Manage users, permissions, and system configuration.</p>
            </div>
        </div>

        {/* System Settings */}
        <div className={`p-6 rounded-xl border ${cardClass}`}>
            <h3 className={`text-lg font-bold mb-4 flex items-center ${textClass}`}>
                <Settings size={20} className="mr-2 text-brand-500"/>
                System Configuration
            </h3>
            <div className="flex gap-4 items-end">
                <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Global Meta Access Token (System Wide)</label>
                    <div className="relative">
                        <Key size={16} className="absolute left-3 top-3 text-slate-500" />
                        <input 
                            type="password"
                            value={metaToken}
                            onChange={(e) => setMetaToken(e.target.value)}
                            className={`w-full pl-10 p-2.5 rounded-lg border text-sm ${inputClass}`} 
                        />
                    </div>
                </div>
                <button onClick={handleSaveToken} className="bg-brand-600 hover:bg-brand-500 text-white px-4 py-2.5 rounded-lg font-bold text-sm flex items-center">
                    <Save size={16} className="mr-2"/> Save Token
                </button>
            </div>
        </div>

        {/* User Management */}
        <div className={`rounded-xl border overflow-hidden ${cardClass}`}>
            <div className={`p-4 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                <h3 className={`text-lg font-bold flex items-center ${textClass}`}>
                    <Users size={20} className="mr-2 text-brand-500"/>
                    User Management
                </h3>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className={`uppercase text-xs font-bold ${isDark ? 'bg-slate-950 text-slate-400' : 'bg-slate-50 text-slate-600'}`}>
                        <tr>
                            <th className="p-4">User</th>
                            <th className="p-4">Role</th>
                            <th className="p-4">Assigned Accounts</th>
                            <th className="p-4">Profiles</th>
                            <th className="p-4">Spend Rules</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-100'}`}>
                        {users.map(user => (
                            <tr key={user.id} className={isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}>
                                <td className="p-4">
                                    <div className={`font-bold ${textClass}`}>{user.email}</div>
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${user.role === 'admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-700 text-slate-400'}`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <div className="flex flex-wrap gap-1">
                                        {user.config?.ad_account_ids?.length 
                                            ? user.config.ad_account_ids.map(id => <span key={id} className="text-xs bg-brand-500/10 text-brand-500 px-1.5 py-0.5 rounded">{id}</span>)
                                            : <span className="text-slate-500 italic">None</span>
                                        }
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="text-xs text-slate-500">
                                        {user.config?.allowed_profiles?.join(', ') || 'All'}
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="text-xs">
                                        {user.config?.hide_total_spend && <span className="text-red-400 mr-2">Hide Spend</span>}
                                        {user.config?.spend_multiplier !== 1 && <span className="text-brand-400">x{user.config?.spend_multiplier}</span>}
                                    </div>
                                </td>
                                <td className="p-4 text-right">
                                    <button onClick={() => openEdit(user)} className="p-2 hover:bg-brand-500/20 text-brand-500 rounded transition-colors">
                                        <Edit size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

        {/* Edit Modal */}
        {editingUser && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <div className={`w-full max-w-4xl rounded-xl border shadow-2xl overflow-hidden flex flex-col max-h-[95vh] ${cardClass}`}>
                    <div className={`p-6 border-b flex justify-between items-center ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                        <div>
                            <h3 className={`text-xl font-bold ${textClass}`}>Edit User: {editingUser.email}</h3>
                            <p className="text-xs text-slate-500 mt-1">Configure permissions and data access</p>
                        </div>
                        <button onClick={() => setEditingUser(null)} className="text-slate-500 hover:text-white"><X size={24}/></button>
                    </div>
                    
                    <div className="p-6 overflow-y-auto space-y-8 custom-scrollbar">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* LEFT COLUMN: Access & Assets */}
                            <div className="space-y-6">
                                {/* Role */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Role</label>
                                    <div className="flex gap-4">
                                        <label className={`flex items-center p-3 rounded border cursor-pointer flex-1 transition-colors ${editForm.role === 'admin' ? 'border-brand-500 bg-brand-500/10' : 'border-slate-700'}`}>
                                            <input type="radio" name="role" checked={editForm.role === 'admin'} onChange={() => setEditForm({...editForm, role: 'admin'})} className="mr-2"/>
                                            <span className={textClass}>Admin</span>
                                        </label>
                                        <label className={`flex items-center p-3 rounded border cursor-pointer flex-1 transition-colors ${editForm.role === 'client' ? 'border-brand-500 bg-brand-500/10' : 'border-slate-700'}`}>
                                            <input type="radio" name="role" checked={editForm.role === 'client'} onChange={() => setEditForm({...editForm, role: 'client'})} className="mr-2"/>
                                            <span className={textClass}>Client</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Ad Accounts Selector with Search */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Assigned Ad Accounts</label>
                                    
                                    {/* Account Search Input */}
                                    <div className="relative mb-2">
                                        <Search size={14} className="absolute left-3 top-2.5 text-slate-500" />
                                        <input 
                                            type="text" 
                                            placeholder="Search accounts by name or ID..." 
                                            value={accountSearchQuery}
                                            onChange={(e) => setAccountSearchQuery(e.target.value)}
                                            className={`w-full pl-9 p-2 rounded border text-xs ${inputClass}`}
                                        />
                                    </div>

                                    {fetchingAccounts ? (
                                        <div className="p-4 text-center text-slate-500 text-sm italic">Loading accounts...</div>
                                    ) : (
                                        <div className={`border rounded-lg max-h-48 overflow-y-auto p-2 space-y-1 ${isDark ? 'border-slate-700 bg-slate-800/30' : 'border-slate-300 bg-slate-50'}`}>
                                            {filteredAccounts.length > 0 ? filteredAccounts.map(acc => (
                                                <label key={acc.id} className={`flex items-center p-2 rounded cursor-pointer text-sm ${isDark ? 'hover:bg-slate-700' : 'hover:bg-white'}`}>
                                                    <input 
                                                        type="checkbox" 
                                                        checked={editForm.ad_account_ids?.includes(acc.id)} 
                                                        onChange={() => toggleAdAccount(acc.id)}
                                                        className="mr-2 rounded text-brand-600"
                                                    />
                                                    <div className="flex-1 truncate">
                                                        <span className={textClass}>{acc.name}</span>
                                                        <span className="text-xs text-slate-500 ml-2">({acc.id})</span>
                                                    </div>
                                                </label>
                                            )) : (
                                                <div className="text-xs text-slate-500 p-2">
                                                    {availableAccounts.length === 0 ? "No accounts found. Check token." : "No matching accounts."}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    <p className="text-xs text-slate-500 mt-1">{editForm.ad_account_ids?.length || 0} accounts selected.</p>
                                </div>

                                {/* Section Access */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Feature Access (Sections)</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            { id: 'dashboard', label: 'Overview' },
                                            { id: 'campaigns', label: 'Campaign Manager' },
                                            { id: 'creative-hub', label: 'Creative Hub' },
                                            { id: 'ai-lab', label: 'AI Lab' }
                                        ].map(feat => (
                                            <label key={feat.id} className={`flex items-center p-2 rounded border cursor-pointer transition-colors ${editForm.allowed_features?.includes(feat.id) ? 'border-brand-500 bg-brand-500/10' : 'border-slate-700'}`}>
                                                <input 
                                                    type="checkbox" 
                                                    checked={editForm.allowed_features?.includes(feat.id)}
                                                    onChange={() => toggleArrayItem('allowed_features', feat.id)}
                                                    className="mr-2 rounded text-brand-600"
                                                />
                                                <span className={`text-sm ${textClass}`}>{feat.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT COLUMN: Limits & Filters */}
                            <div className="space-y-6">
                                {/* Profile Permissions */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">View Profiles (Dashboard)</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {['sales', 'engagement', 'leads', 'messenger'].map(p => (
                                            <label key={p} className={`flex items-center p-2 rounded hover:bg-slate-800 cursor-pointer`}>
                                                <input 
                                                    type="checkbox" 
                                                    checked={editForm.allowed_profiles?.includes(p)}
                                                    onChange={() => toggleArrayItem('allowed_profiles', p)}
                                                    className="mr-2 rounded text-brand-600"
                                                />
                                                <span className={`capitalize ${textClass}`}>{p}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Financial Logic */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Spend Multiplier</label>
                                        <div className="relative">
                                            <input 
                                                type="number"
                                                step="0.1"
                                                value={editForm.spend_multiplier}
                                                onChange={(e) => setEditForm({...editForm, spend_multiplier: parseFloat(e.target.value)})}
                                                className={`w-full p-2.5 rounded border text-sm ${inputClass}`}
                                            />
                                            <span className="absolute right-3 top-2.5 text-xs text-slate-500">x</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center pt-6">
                                        <label className="flex items-center cursor-pointer">
                                            <input 
                                                type="checkbox"
                                                checked={editForm.hide_total_spend}
                                                onChange={(e) => setEditForm({...editForm, hide_total_spend: e.target.checked})}
                                                className="w-5 h-5 rounded text-brand-600 mr-3"
                                            />
                                            <div>
                                                <span className={`block text-sm font-bold ${textClass}`}>Hide "Total Spend"</span>
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                {/* Global Constraints */}
                                <div className={`p-4 rounded-lg border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                    <h4 className={`text-sm font-bold mb-4 flex items-center ${textClass}`}>
                                        <Lock size={14} className="mr-2 text-brand-500"/>
                                        Optional Constraints
                                    </h4>
                                    
                                    {/* Date Lock */}
                                    <div className="mb-4">
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Fixed Date Range (Locks Picker)</label>
                                        <div className="flex gap-2 items-center">
                                            <input 
                                                type="date" 
                                                value={typeof editForm.fixed_date_start === 'string' ? editForm.fixed_date_start : ''}
                                                onChange={(e) => setEditForm({...editForm, fixed_date_start: e.target.value})}
                                                className={`w-full p-2 rounded border text-xs ${inputClass}`}
                                            />
                                            <span className="text-slate-500">-</span>
                                            <input 
                                                type="date" 
                                                value={typeof editForm.fixed_date_end === 'string' ? editForm.fixed_date_end : ''}
                                                onChange={(e) => setEditForm({...editForm, fixed_date_end: e.target.value})}
                                                className={`w-full p-2 rounded border text-xs ${inputClass}`}
                                            />
                                        </div>
                                    </div>

                                    {/* Campaign Search & Filter */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Force Campaigns (Search across accounts)</label>
                                        
                                        {/* Search Box */}
                                        <div className="relative mb-2">
                                            <Search size={14} className="absolute left-3 top-2.5 text-slate-500" />
                                            <input 
                                                type="text" 
                                                placeholder="Type to search campaigns..." 
                                                value={campaignSearch}
                                                onChange={(e) => setCampaignSearch(e.target.value)}
                                                className={`w-full pl-9 p-2 rounded border text-xs ${inputClass}`}
                                            />
                                            {loadingCampaigns && <div className="absolute right-3 top-2.5 text-[10px] text-slate-500 animate-pulse">Fetching...</div>}
                                        </div>

                                        {/* Suggestions Dropdown */}
                                        {campaignSearch.length > 1 && (
                                            <div className={`max-h-32 overflow-y-auto border rounded mb-2 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                                                {accountCampaigns
                                                    .filter(c => c.name.toLowerCase().includes(campaignSearch.toLowerCase()) && !editForm.global_campaign_filter?.includes(c.id))
                                                    .slice(0, 10)
                                                    .map(c => (
                                                        <div 
                                                            key={c.id} 
                                                            onClick={() => { toggleCampaignFilter(c.id); setCampaignSearch(''); }}
                                                            className={`p-2 text-xs cursor-pointer ${isDark ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-slate-50 text-slate-700'}`}
                                                        >
                                                            {c.name} <span className="opacity-50">({c.id})</span>
                                                        </div>
                                                    ))
                                                }
                                                {accountCampaigns.filter(c => c.name.toLowerCase().includes(campaignSearch.toLowerCase())).length === 0 && (
                                                    <div className="p-2 text-xs text-slate-500">No matching campaigns found.</div>
                                                )}
                                            </div>
                                        )}

                                        {/* Selected Tags */}
                                        <div className="flex flex-wrap gap-1 mb-2">
                                            {editForm.global_campaign_filter?.map(id => {
                                                const camp = accountCampaigns.find(c => c.id === id);
                                                return (
                                                    <div key={id} className={`text-[10px] px-2 py-1 rounded flex items-center gap-1 ${isDark ? 'bg-brand-900/30 text-brand-300 border border-brand-800' : 'bg-brand-50 text-brand-700 border border-brand-200'}`}>
                                                        <span className="truncate max-w-[100px]">{camp ? camp.name : id}</span>
                                                        <button onClick={() => toggleCampaignFilter(id)}><X size={10}/></button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <p className="text-[10px] text-slate-500 mt-1">
                                            Only selected campaigns will be visible to the user.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={`p-6 border-t flex justify-end gap-3 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                        <button onClick={() => setEditingUser(null)} className="px-4 py-2 text-slate-500 hover:text-white">Cancel</button>
                        <button onClick={handleSaveUser} className="px-6 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg font-bold">Save Configuration</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default AdminPanel;
