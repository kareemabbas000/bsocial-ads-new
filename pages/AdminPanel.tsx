
import React, { useEffect, useState } from 'react';
import { fetchAllUsers, updateUserRole, updateUserConfig, fetchSystemSetting, updateSystemSetting, createUser, updateUserProfile, deleteUser } from '../services/supabaseService';
import { fetchAdAccounts, fetchCampaignsBatch } from '../services/metaService';
import { UserProfile, UserConfig, Theme, AdAccount } from '../types';
import { Users, Settings, Shield, Save, X, Edit, CheckSquare, Search, Key, Calendar, Layers, Lock, AlertTriangle, Clock, Plus, Trash2, Layout } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { Modal, NotificationBanner } from '../components/Modal';

interface AdminPanelProps {
    theme: Theme;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ theme }) => {
    const [users, setUsers] = useState<(UserProfile & { config?: UserConfig })[]>([]);
    const [loading, setLoading] = useState(true);
    const [metaToken, setMetaToken] = useState('');

    // Edit State
    const [editingUser, setEditingUser] = useState<(UserProfile & { config?: UserConfig }) | null>(null);
    const [editForm, setEditForm] = useState<Partial<UserConfig> & { role?: 'admin' | 'client', first_name?: string, last_name?: string, company?: string }>({});

    // Create State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createForm, setCreateForm] = useState({
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        company: '',
        role: 'client' as 'admin' | 'client'
    });
    const [creating, setCreating] = useState(false);

    // Available Meta Assets
    const [availableAccounts, setAvailableAccounts] = useState<AdAccount[]>([]);
    const [fetchingAccounts, setFetchingAccounts] = useState(false);
    const [accountSearchQuery, setAccountSearchQuery] = useState(''); // New Search State

    // Campaign Search State
    const [accountCampaigns, setAccountCampaigns] = useState<{ id: string, name: string, accountId: string }[]>([]);
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
            if (token) fetchAccounts(token);
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





    const refreshUsers = async () => {
        try {
            const usersData = await fetchAllUsers();
            setUsers(usersData);
        } catch (e) {
            console.error("Failed to refresh users:", e);
        }
    };

    const handleCreateUser = async () => {
        setCreating(true);
        try {
            await createUser(createForm);

            // 1. Close modal immediately for responsiveness
            setShowCreateModal(false);

            // 2. Reset form
            setCreateForm({
                email: '',
                password: '',
                first_name: '',
                last_name: '',
                company: '',
                role: 'client'
            });

            // 3. Silently refresh the list (no full page loading spinner)
            await refreshUsers();

        } catch (e: any) {
            console.error("Error creating user:", e);
            const errorMsg = e.message || (typeof e === 'object' ? JSON.stringify(e) : String(e));
            alert(`Error creating user: ${errorMsg}`);
        } finally {
            setCreating(false);
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

    const openEdit = (user: UserProfile & { config?: UserConfig }) => {
        setEditingUser(user);
        setEditForm({
            role: user.role,
            first_name: user.first_name || '',
            last_name: user.last_name || '',
            company: user.company || '',
            ad_account_ids: user.config?.ad_account_ids || [],
            allowed_profiles: user.config?.allowed_profiles || ['sales'],
            allowed_features: user.config?.allowed_features || ['dashboard', 'campaigns', 'creative-hub', 'ai-lab'],
            hide_total_spend: user.config?.hide_total_spend || false,
            spend_multiplier: user.config?.spend_multiplier || 1.0,
            global_campaign_filter: user.config?.global_campaign_filter || [],
            fixed_date_start: user.config?.fixed_date_start || '',
            fixed_date_end: user.config?.fixed_date_end || '',
            disable_ai: user.config?.disable_ai || false,
            disable_creative_tags: user.config?.disable_creative_tags || false,
            hide_account_name: user.config?.hide_account_name || false,
            refresh_interval: user.config?.refresh_interval || 10
        });
    };

    // --- Notifications State ---
    const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);
    const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 5000); // Auto dismiss
    };

    // --- Delete Confirmation State ---
    const [userToDelete, setUserToDelete] = useState<{ id: string, email: string } | null>(null);

    const handleSaveToken = async () => {
        await updateSystemSetting('meta_token', metaToken);
        showNotification('success', "System Token Updated Successfully");
        fetchAccounts(metaToken);
    };

    const handleSaveUser = async () => {
        if (!editingUser) return;
        try {
            // Update Profile Fields
            await updateUserProfile(editingUser.id, {
                role: editForm.role,
                first_name: editForm.first_name,
                last_name: editForm.last_name,
                company: editForm.company
            });

            // Update Config Fields
            const configUpdates: Partial<UserConfig> = {
                ad_account_ids: editForm.ad_account_ids,
                allowed_profiles: editForm.allowed_profiles,
                allowed_features: editForm.allowed_features,
                hide_total_spend: editForm.hide_total_spend,
                spend_multiplier: editForm.spend_multiplier,
                global_campaign_filter: editForm.global_campaign_filter,
                fixed_date_start: editForm.fixed_date_start || (null as any),
                fixed_date_end: editForm.fixed_date_end || (null as any),
                disable_ai: editForm.disable_ai,
                disable_creative_tags: editForm.disable_creative_tags,
                hide_account_name: editForm.hide_account_name,
                refresh_interval: editForm.refresh_interval
            };

            await updateUserConfig(editingUser.id, configUpdates);
            setEditingUser(null);
            await refreshUsers();
            showNotification('success', `User ${editingUser.email} updated successfully`);
        } catch (e: any) {
            console.error("Error updating user:", e);
            const errorMsg = e.message || (typeof e === 'object' ? JSON.stringify(e) : String(e));
            showNotification('error', `Error updating user: ${errorMsg}`);
        }
    };

    const confirmDeleteUser = (user: { id: string, email: string }) => {
        setUserToDelete(user);
    }

    const executeDeleteUser = async () => {
        if (!userToDelete) return;

        console.log(`[AdminPanel] Initiating delete for user: ${userToDelete.email} (${userToDelete.id})`);

        try {
            await deleteUser(userToDelete.id);
            console.log(`[AdminPanel] Successfully deleted user: ${userToDelete.email}`);
            await refreshUsers();
            showNotification('success', `User ${userToDelete.email} deleted successfully`);
        } catch (e: any) {
            console.error("Failed to delete user:", e);
            showNotification('error', `Failed to delete user: ${e.message}`);
        } finally {
            setUserToDelete(null);
        }
    };



    // ... (rest of helper functions) ...

    if (loading) return <LoadingSpinner theme={theme} message="Loading Administration..." bgClass="bg-transparent" />;

    return (
        <div className="space-y-8 pb-12">
            {/* ... (Previous code remains) ... */}
            <div className="flex justify-between items-center bg-transparent">
                <div>
                    <h1 className={`text-3xl font-black tracking-tight ${textClass}`}>Admin Console</h1>
                    <p className="text-slate-500 text-sm mt-1">Manage users, permissions, and system configuration.</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center space-x-2 bg-brand-600 hover:bg-brand-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-brand-500/20 transition-all hover:scale-105 active:scale-95"
                >
                    <Plus size={18} />
                    <span>Create User</span>
                </button>
            </div>

            {/* Compressed System Settings */}
            <div className={`p-4 rounded-xl border ${cardClass}`}>
                <div className="flex justify-between items-center mb-0">
                    <h3 className={`text-base font-bold flex items-center ${textClass}`}>
                        <Settings size={18} className="mr-2 text-brand-500" />
                        System Configuration
                    </h3>
                    <div className="flex gap-2 items-center">
                        <div className="relative w-96">
                            <Key size={14} className="absolute left-2.5 top-2 text-slate-500" />
                            <input
                                type="password"
                                value={metaToken}
                                onChange={(e) => setMetaToken(e.target.value)}
                                className={`w-full pl-8 py-1.5 rounded-lg border text-xs ${inputClass}`}
                                placeholder="Global Meta Access Token"
                            />
                        </div>
                        <button onClick={handleSaveToken} className="bg-brand-600 hover:bg-brand-500 text-white px-3 py-1.5 rounded-lg font-bold text-xs flex items-center shadow-lg shadow-brand-500/20 active:scale-95 transition-all">
                            <Save size={14} className="mr-1.5" /> Save Token
                        </button>
                    </div>
                </div>
            </div>

            {/* User Management */}
            <div className={`rounded-xl border overflow-hidden ${cardClass}`}>
                <div className={`p-4 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                    <h3 className={`text-lg font-bold flex items-center ${textClass}`}>
                        <Users size={20} className="mr-2 text-brand-500" />
                        User Management
                    </h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                        <thead className={`uppercase text-[11px] tracking-wider font-bold ${isDark ? 'bg-slate-900/50 text-slate-400' : 'bg-slate-50 text-slate-500'}`}>
                            <tr>
                                <th className="px-4 py-2 border-b border-transparent">User / Client</th>
                                <th className="px-4 py-2 border-b border-transparent">Role</th>
                                <th className="px-4 py-2 border-b border-transparent">Assigned Accounts</th>
                                <th className="px-4 py-2 border-b border-transparent">Profiles</th>
                                <th className="px-4 py-2 border-b border-transparent">Money View</th>
                                <th className="px-4 py-2 border-b border-transparent text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-100'}`}>
                            {users.map(user => (
                                <tr key={user.id} className={`group transition-colors ${isDark ? 'hover:bg-slate-800/60' : 'hover:bg-slate-50'}`}>
                                    <td className="px-4 py-2.5 whitespace-nowrap">
                                        <div className="flex flex-col justify-center h-full">
                                            <div className={`font-bold text-sm ${textClass}`}>
                                                {user.first_name ? `${user.first_name} ${user.last_name}` : user.email.split('@')[0]}
                                            </div>
                                            <div className="text-[10px] text-slate-500">{user.email}</div>
                                            {user.company && (
                                                <div className={`text-[9px] uppercase font-bold tracking-wider mt-0.5 inline-block px-1.5 py-0 rounded w-fit ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                                                    {user.company}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-2.5 align-middle">
                                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${user.role === 'admin' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-slate-500/10 text-slate-500 border border-slate-500/20'}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2.5 align-middle">
                                        <div className="flex flex-wrap gap-1">
                                            {user.config?.ad_account_ids?.length
                                                ? user.config.ad_account_ids.map(id => {
                                                    const account = availableAccounts.find(a => a.id === id);
                                                    return (
                                                        <span key={id} className="text-[9px] font-bold bg-brand-500/10 text-brand-500 px-1.5 py-0.5 rounded border border-brand-500/20 truncate max-w-[120px] inline-block shadow-[0_0_8px_rgba(99,102,241,0.1)]" title={id}>
                                                            {account ? account.name : id}
                                                        </span>
                                                    );
                                                })
                                                : <span className="text-slate-400 italic text-[10px]">No accounts assigned</span>}
                                        </div>
                                    </td>
                                    <td className="px-4 py-2.5 align-middle">
                                        <div className="text-[10px] text-slate-500 max-w-[150px] truncate leading-tight">
                                            {user.config?.allowed_profiles?.join(', ') || 'All'}
                                        </div>
                                    </td>
                                    <td className="px-4 py-2.5 align-middle">
                                        <div className="text-[10px] flex flex-col leading-tight">
                                            {user.config?.hide_total_spend && <span className="text-red-400 font-medium">Hides Financials</span>}
                                            {user.config?.spend_multiplier !== 1 && <span className="text-brand-400 font-bold">x{user.config?.spend_multiplier} Multiplier</span>}
                                            {!user.config?.hide_total_spend && (user.config?.spend_multiplier === undefined || user.config?.spend_multiplier === 1) && <span className="text-slate-500 opacity-50">-</span>}
                                        </div>
                                    </td>
                                    <td className="px-4 py-2.5 text-right align-middle">
                                        <div className="flex justify-end gap-1">
                                            <button onClick={() => openEdit(user)} className="p-1.5 hover:bg-brand-500/10 text-slate-400 hover:text-brand-500 rounded-lg transition-colors" title="Edit User">
                                                <Edit size={14} />
                                            </button>
                                            <button onClick={() => confirmDeleteUser({ id: user.id, email: user.email })} className="p-1.5 hover:bg-red-500/10 text-slate-400 hover:text-red-500 rounded-lg transition-colors" title="Delete User">
                                                <Trash2 size={14} />

                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Super-Compressed Edit Modal */}
            {editingUser && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className={`w-full max-w-3xl rounded-xl border shadow-2xl flex flex-col max-h-[85vh] ${cardClass}`}>
                        {/* Header */}
                        <div className={`px-4 py-3 border-b flex justify-between items-center ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                            <div>
                                <h3 className={`text-sm font-bold ${textClass}`}>Edit User: {editingUser.email}</h3>
                                <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Configuration & Permission Management</p>
                            </div>
                            <button onClick={() => setEditingUser(null)} className="p-1 rounded-lg hover:bg-white/10 text-slate-500 hover:text-white transition-colors"><X size={16} /></button>
                        </div>

                        {/* Scrollable Body - Hyper Dense Grid */}
                        <div className="p-4 overflow-y-auto custom-scrollbar flex-1">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">

                                {/* LEFT: IDENTITY & ACCESS (Cols 7) */}
                                <div className="md:col-span-7 space-y-3">

                                    {/* 1. Identity Card */}
                                    <div className={`p-3 rounded-lg border relative overflow-hidden group ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                        <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                                            <Users size={80} />
                                        </div>
                                        <div className="flex items-start gap-3 relaitve z-10">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 shadow-lg ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-white text-slate-500'}`}>
                                                {(editForm.first_name?.[0] || '')}{(editForm.last_name?.[0] || '')}
                                            </div>
                                            <div className="flex-1 space-y-2">
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <label className="block text-[8px] font-bold text-slate-500 uppercase mb-0.5">First Name</label>
                                                        <input type="text" value={editForm.first_name || ''} onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })} className={`w-full px-2 py-1 rounded border text-[10px] font-medium ${inputClass}`} />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[8px] font-bold text-slate-500 uppercase mb-0.5">Last Name</label>
                                                        <input type="text" value={editForm.last_name || ''} onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })} className={`w-full px-2 py-1 rounded border text-[10px] font-medium ${inputClass}`} />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <label className="block text-[8px] font-bold text-slate-500 uppercase mb-0.5">Company</label>
                                                        <input type="text" value={editForm.company || ''} onChange={(e) => setEditForm({ ...editForm, company: e.target.value })} className={`w-full px-2 py-1 rounded border text-[10px] font-medium ${inputClass}`} />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[8px] font-bold text-slate-500 uppercase mb-0.5">Role</label>
                                                        <div className="flex bg-slate-500/10 rounded p-0.5">
                                                            <button onClick={() => setEditForm({ ...editForm, role: 'admin' })} className={`flex-1 text-[9px] font-bold py-0.5 rounded transition-colors ${editForm.role === 'admin' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}>ADMIN</button>
                                                            <button onClick={() => setEditForm({ ...editForm, role: 'client' })} className={`flex-1 text-[9px] font-bold py-0.5 rounded transition-colors ${editForm.role === 'client' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}>CLIENT</button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 2. Access Control (Pills) */}
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1.5 flex items-center gap-1">
                                                <Layers size={10} /> Feature Access
                                            </label>
                                            <div className="flex flex-wrap gap-1.5">
                                                {[
                                                    { id: 'dashboard', label: 'Overview' },
                                                    { id: 'campaigns', label: 'Campaign Manager' },
                                                    { id: 'creative-hub', label: 'Ads Hub' },
                                                    { id: 'ai-lab', label: 'AI Laboratory' }
                                                ].map(feat => (
                                                    <button
                                                        key={feat.id}
                                                        onClick={() => toggleArrayItem('allowed_features', feat.id)}
                                                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all active:scale-95 ${editForm.allowed_features?.includes(feat.id)
                                                            ? 'bg-brand-500 text-white border-brand-500 shadow-md shadow-brand-500/20'
                                                            : isDark ? 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                                                            }`}
                                                    >
                                                        {feat.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1.5 flex items-center gap-1">
                                                <Layout size={10} /> Profile Views
                                            </label>
                                            <div className="flex flex-wrap gap-1.5">
                                                {['sales', 'engagement', 'leads', 'messenger'].map(p => (
                                                    <button
                                                        key={p}
                                                        onClick={() => toggleArrayItem('allowed_profiles', p)}
                                                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all active:scale-95 capitalize ${editForm.allowed_profiles?.includes(p)
                                                            ? 'bg-purple-500 text-white border-purple-500 shadow-md shadow-purple-500/20'
                                                            : isDark ? 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                                                            }`}
                                                    >
                                                        {p}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* 3. Control Center Grid */}
                                    <div>
                                        <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1.5 flex items-center gap-1">
                                            <Settings size={10} /> Control Center
                                        </label>
                                        <div className={`grid grid-cols-2 sm:grid-cols-4 gap-1.5`}>
                                            <div className={`p-1.5 rounded border flex flex-col justify-between ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'}`}>
                                                <span className="text-[8px] text-slate-500 font-bold uppercase mb-0.5">Spend Mult.</span>
                                                <div className="flex items-center">
                                                    <span className="text-[10px] text-brand-500 font-bold mr-0.5">x</span>
                                                    <input
                                                        type="number"
                                                        step="0.1"
                                                        value={editForm.spend_multiplier}
                                                        onChange={(e) => setEditForm({ ...editForm, spend_multiplier: parseFloat(e.target.value) })}
                                                        className={`w-full bg-transparent text-xs font-bold focus:outline-none ${textClass}`}
                                                    />
                                                </div>
                                            </div>

                                            {[
                                                { label: 'Hide Finance', field: 'hide_total_spend', color: 'text-red-400' },
                                                { label: 'Disable AI', field: 'disable_ai', color: 'text-orange-400' },
                                                { label: 'Hide Account Name', field: 'hide_account_name', color: 'text-blue-400' }
                                            ].map((toggle: any) => (
                                                <button
                                                    key={toggle.field}
                                                    onClick={() => setEditForm({ ...editForm, [toggle.field]: !editForm[toggle.field as keyof UserConfig] })}
                                                    className={`p-1.5 rounded border flex flex-col justify-between text-left transition-all ${editForm[toggle.field as keyof UserConfig]
                                                        ? (isDark ? 'bg-slate-800 border-slate-600' : 'bg-slate-50 border-slate-300')
                                                        : (isDark ? 'bg-slate-900 border-slate-800 opacity-60 hover:opacity-100' : 'bg-white border-slate-100 opacity-60 hover:opacity-100')
                                                        }`}
                                                >
                                                    <span className={`text-[8px] font-bold uppercase truncate ${editForm[toggle.field as keyof UserConfig] ? toggle.color : 'text-slate-500'}`}>{toggle.label}</span>
                                                    <div className={`w-6 h-3 rounded-full p-0.5 transition-colors ${editForm[toggle.field as keyof UserConfig] ? 'bg-brand-500' : 'bg-slate-600'}`}>
                                                        <div className={`w-2 h-2 rounded-full bg-white transition-transform ${editForm[toggle.field as keyof UserConfig] ? 'translate-x-3' : ''}`} />
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* RIGHT: DATA & CONSTRAINTS (Cols 5) */}
                                <div className="md:col-span-5 space-y-3">

                                    {/* 1. Account Selector (Optimized) */}
                                    <div className="flex flex-col h-56">
                                        <div className="flex justify-between items-end mb-1.5">
                                            <label className="text-[9px] font-bold text-slate-500 uppercase">Assigned Accounts</label>
                                            <span className="text-[8px] font-bold bg-brand-500 text-white px-1.5 py-0.5 rounded">{editForm.ad_account_ids?.length || 0} selected</span>
                                        </div>
                                        <div className="relative mb-1.5">
                                            <Search size={10} className="absolute left-2.5 top-2 text-slate-500" />
                                            <input
                                                type="text"
                                                placeholder="Search..."
                                                value={accountSearchQuery}
                                                onChange={(e) => setAccountSearchQuery(e.target.value)}
                                                className={`w-full pl-7 py-1 rounded-lg border text-[10px] ${inputClass}`}
                                            />
                                        </div>
                                        <div className={`border rounded-lg flex-1 overflow-y-auto custom-scrollbar p-1 space-y-0.5 ${isDark ? 'border-slate-700 bg-slate-900/50' : 'border-slate-200 bg-slate-50'}`}>
                                            {filteredAccounts.length > 0 ? filteredAccounts.map(acc => (
                                                <label key={acc.id} className={`flex items-center p-1 rounded cursor-pointer group hover:bg-brand-500/10 transition-colors`}>
                                                    <input type="checkbox" checked={editForm.ad_account_ids?.includes(acc.id)} onChange={() => toggleAdAccount(acc.id)} className="rounded text-brand-600 w-3 h-3 mr-2" />
                                                    <div className="overflow-hidden">
                                                        <div className={`text-[10px] font-medium truncate group-hover:text-brand-500 ${textClass}`}>{acc.name}</div>
                                                        <div className="text-[8px] text-slate-500 font-mono truncate">{acc.id}</div>
                                                    </div>
                                                </label>
                                            )) : (
                                                <div className="p-4 text-center text-[10px] text-slate-500 italic">No accounts</div>
                                            )}
                                        </div>
                                    </div>

                                    {/* 2. Optional Constraints (Compact) */}
                                    <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                        <h4 className={`text-[10px] font-bold mb-2 flex items-center ${textClass}`}>
                                            <Lock size={10} className="mr-1.5 text-brand-500" /> Optional Constraints
                                        </h4>
                                        <div className="space-y-2">
                                            <div>
                                                <label className="block text-[8px] font-bold text-slate-500 uppercase mb-0.5">Fixed Date Range</label>
                                                <div className="flex gap-1.5">
                                                    <input type="date" value={typeof editForm.fixed_date_start === 'string' ? editForm.fixed_date_start : ''} onChange={(e) => setEditForm({ ...editForm, fixed_date_start: e.target.value })} className={`w-full py-0.5 px-1.5 rounded border text-[9px] ${inputClass}`} />
                                                    <input type="date" value={typeof editForm.fixed_date_end === 'string' ? editForm.fixed_date_end : ''} onChange={(e) => setEditForm({ ...editForm, fixed_date_end: e.target.value })} className={`w-full py-0.5 px-1.5 rounded border text-[9px] ${inputClass}`} />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-[8px] font-bold text-slate-500 uppercase mb-0.5">Force Campaigns</label>
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        placeholder="Enter the campaign name..."
                                                        value={campaignSearch}
                                                        onChange={(e) => setCampaignSearch(e.target.value)}
                                                        className={`w-full py-0.5 px-1.5 rounded border text-[9px] ${inputClass}`}
                                                    />

                                                    {/* Campaign Dropdown */}
                                                    {campaignSearch.length >= 2 && (
                                                        <div className={`absolute left-0 right-0 top-full mt-1.5 rounded border shadow-xl z-50 max-h-32 overflow-y-auto custom-scrollbar ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                                                            {loadingCampaigns ? (
                                                                <div className="p-2 text-center text-[9px] text-slate-500">Loading...</div>
                                                            ) : accountCampaigns.filter(c => c.name.toLowerCase().includes(campaignSearch.toLowerCase())).length > 0 ? (
                                                                accountCampaigns.filter(c => c.name.toLowerCase().includes(campaignSearch.toLowerCase())).map(camp => (
                                                                    <div
                                                                        key={camp.id}
                                                                        onClick={() => {
                                                                            toggleCampaignFilter(camp.id);
                                                                            setCampaignSearch('');
                                                                        }}
                                                                        className={`px-2 py-1.5 text-[9px] font-medium cursor-pointer hover:bg-brand-500 hover:text-white transition-colors border-b last:border-0 ${isDark ? 'text-slate-300 border-slate-700' : 'text-slate-600 border-slate-100'}`}
                                                                    >
                                                                        <div className="truncate">{camp.name}</div>
                                                                        <div className="text-[7px] opacity-70 font-mono">{camp.id}</div>
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <div className="p-2 text-center text-[9px] text-slate-500">No campaigns found</div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap gap-1 mt-1.5">
                                                    {editForm.global_campaign_filter?.map(id => {
                                                        const campaign = accountCampaigns.find(c => c.id === id);
                                                        return (
                                                            <span key={id} onClick={() => toggleCampaignFilter(id)} className="text-[8px] px-1.5 py-0.5 bg-brand-500/20 text-brand-500 rounded cursor-pointer hover:bg-red-500/20 hover:text-red-500 truncate max-w-[150px]" title={id}>
                                                                {campaign ? campaign.name : id}
                                                            </span>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className={`px-4 py-2 border-t flex justify-end gap-2 rounded-b-xl ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-slate-50'}`}>
                            <button onClick={() => setEditingUser(null)} className="px-3 py-1 text-[10px] font-bold text-slate-500 hover:text-white transition-colors">Cancel</button>
                            <button onClick={handleSaveUser} className="px-4 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-lg font-bold text-[10px] shadow-lg shadow-brand-500/20 active:scale-95 transition-all">Save Changes</button>
                        </div>
                    </div>
                </div>
            )}
            {/* Compressed Create User Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className={`w-full max-w-md rounded-xl border shadow-2xl overflow-hidden flex flex-col ${cardClass}`}>
                        <div className={`px-4 py-3 border-b flex justify-between items-center ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                            <div>
                                <h3 className={`text-sm font-bold ${textClass}`}>Create New User</h3>
                                <p className="text-[9px] text-slate-500 mt-0.5">Add a new user to the platform.</p>
                            </div>
                            <button onClick={() => setShowCreateModal(false)} className="text-slate-500 hover:text-white"><X size={18} /></button>
                        </div>

                        <div className="p-4 space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">First Name</label>
                                    <input
                                        type="text"
                                        value={createForm.first_name}
                                        onChange={(e) => setCreateForm({ ...createForm, first_name: e.target.value })}
                                        className={`w-full px-2 py-1.5 rounded-lg border text-[10px] ${inputClass}`}
                                        placeholder="John"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">Last Name</label>
                                    <input
                                        type="text"
                                        value={createForm.last_name}
                                        onChange={(e) => setCreateForm({ ...createForm, last_name: e.target.value })}
                                        className={`w-full px-2 py-1.5 rounded-lg border text-[10px] ${inputClass}`}
                                        placeholder="Doe"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">Company / Client</label>
                                <input
                                    type="text"
                                    value={createForm.company}
                                    onChange={(e) => setCreateForm({ ...createForm, company: e.target.value })}
                                    className={`w-full px-2 py-1.5 rounded-lg border text-[10px] ${inputClass}`}
                                    placeholder="BSocial LLC"
                                />
                            </div>

                            <div>
                                <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">Email Address</label>
                                <input
                                    type="email"
                                    value={createForm.email}
                                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                                    className={`w-full px-2 py-1.5 rounded-lg border text-[10px] ${inputClass}`}
                                    placeholder="user@example.com"
                                />
                            </div>

                            <div>
                                <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">Password</label>
                                <input
                                    type="password"
                                    value={createForm.password}
                                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                                    className={`w-full px-2 py-1.5 rounded-lg border text-[10px] ${inputClass}`}
                                    placeholder="••••••••"
                                />
                            </div>

                            <div>
                                <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">Role</label>
                                <div className="flex gap-3">
                                    <label className={`flex items-center justify-center p-2 rounded-lg border cursor-pointer flex-1 transition-colors ${createForm.role === 'admin' ? 'border-brand-500 bg-brand-500/10' : 'border-slate-700'}`}>
                                        <input type="radio" name="create-role" checked={createForm.role === 'admin'} onChange={() => setCreateForm({ ...createForm, role: 'admin' })} className="hidden" />
                                        <div className="text-center">
                                            <Shield size={16} className={`mx-auto mb-0.5 ${createForm.role === 'admin' ? 'text-brand-500' : 'text-slate-500'}`} />
                                            <span className={`text-[9px] font-bold ${createForm.role === 'admin' ? 'text-brand-500' : 'text-slate-500'}`}>Admin</span>
                                        </div>
                                    </label>
                                    <label className={`flex items-center justify-center p-2 rounded-lg border cursor-pointer flex-1 transition-colors ${createForm.role === 'client' ? 'border-brand-500 bg-brand-500/10' : 'border-slate-700'}`}>
                                        <input type="radio" name="create-role" checked={createForm.role === 'client'} onChange={() => setCreateForm({ ...createForm, role: 'client' })} className="hidden" />
                                        <div className="text-center">
                                            <Users size={16} className={`mx-auto mb-0.5 ${createForm.role === 'client' ? 'text-brand-500' : 'text-slate-500'}`} />
                                            <span className={`text-[9px] font-bold ${createForm.role === 'client' ? 'text-brand-500' : 'text-slate-500'}`}>Client</span>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className={`p-6 border-t flex justify-end gap-3 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                            <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-slate-500 hover:text-white">Cancel</button>
                            <button
                                onClick={handleCreateUser}
                                disabled={creating}
                                className="px-6 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                            >
                                {creating ? <LoadingSpinner theme={theme} message="" variant="small" /> : (
                                    <>
                                        <Plus size={18} className="mr-2" />
                                        Create User
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* ... (Previous Modals) ... */}

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={!!userToDelete}
                onClose={() => setUserToDelete(null)}
                title="Confirm User Deletion"
                theme={theme}
                footer={
                    <>
                        <button onClick={() => setUserToDelete(null)} className="px-4 py-2 text-slate-500 hover:text-white transition-colors">Cancel</button>
                        <button
                            onClick={executeDeleteUser}
                            className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-lg font-bold shadow-lg shadow-red-500/20 flex items-center"
                        >
                            <Trash2 size={16} className="mr-2" />
                            Delete User
                        </button>
                    </>
                }
            >
                <div className="flex flex-col items-center text-center p-4">
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4 text-red-500 border border-red-500/20">
                        <AlertTriangle size={32} />
                    </div>
                    <h4 className={`text-lg font-bold mb-2 ${textClass}`}>Delete this user?</h4>
                    <p className="text-slate-500 text-sm mb-6">
                        Are you sure you want to delete <strong className={textClass}>{userToDelete?.email}</strong>?
                        <br />This action cannot be undone and will revoke all access immediately.
                    </p>
                </div>
            </Modal>

            {/* Notification Banner */}
            {notification && (
                <NotificationBanner
                    type={notification.type}
                    message={notification.message}
                    onClose={() => setNotification(null)}
                    theme={theme}
                />
            )}
        </div>
    );
};

export default AdminPanel;
