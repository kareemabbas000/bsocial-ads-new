import React, { useEffect, useState } from 'react';
import { fetchAllUsers, updateUserConfig, fetchSystemSetting, updateSystemSetting, createUser, updateUserProfile, deleteUser } from '../services/supabaseService';
import { fetchAdAccounts, fetchCampaignsBatch } from '../services/metaService';
import { UserProfile, UserConfig, Theme, AdAccount } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

// New Modular Components
import AdminHeader from '../components/admin/AdminHeader';
import SystemConfiguration from '../components/admin/SystemConfiguration';
import UserManagement from '../components/admin/UserManagement';
import CreateUserModal from '../components/admin/CreateUserModal';

import EditUserModal from '../components/admin/EditUserModal';
import DeleteConfirmationModal from '../components/admin/DeleteConfirmationModal';

interface AdminPanelProps {
    theme: Theme;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ theme }) => {
    // --- State Management ---
    const [users, setUsers] = useState<(UserProfile & { config?: UserConfig })[]>([]);
    const [loading, setLoading] = useState(true);

    // System Config State
    const [metaToken, setMetaToken] = useState('');
    const [enableGoogleAuth, setEnableGoogleAuth] = useState(true);
    const [enableRouter, setEnableRouter] = useState(false);
    const [enableManualRefresh, setEnableManualRefresh] = useState(false);

    // Modal States
    const [showCreateModal, setShowCreateModal] = useState(false);

    const [editingUser, setEditingUser] = useState<(UserProfile & { config?: UserConfig }) | null>(null);
    const [userToDelete, setUserToDelete] = useState<{ id: string, email: string } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Data Sources
    const [availableAccounts, setAvailableAccounts] = useState<AdAccount[]>([]);
    const [accountCampaigns, setAccountCampaigns] = useState<{ id: string, name: string, accountId: string }[]>([]);

    // Notification State
    const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);

    // --- Effects & Data Loading ---
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [usersData, token, googleAuth, routerEnabled, manualRefreshEnabled] = await Promise.all([
                fetchAllUsers(),
                fetchSystemSetting('meta_token'),
                fetchSystemSetting('enable_google_auth'),
                fetchSystemSetting('enable_react_router'),
                fetchSystemSetting('enable_manual_refresh')
            ]);
            setUsers(usersData);
            setMetaToken(token || '');
            if (googleAuth !== null) setEnableGoogleAuth(googleAuth !== 'false');
            if (routerEnabled !== null) setEnableRouter(routerEnabled === 'true');
            if (manualRefreshEnabled !== null) setEnableManualRefresh(manualRefreshEnabled === 'true');
            if (token) fetchAccounts(token);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const fetchAccounts = async (token: string) => {
        try {
            const accounts = await fetchAdAccounts(token);
            setAvailableAccounts(accounts);
        } catch (e) {
            console.error("Failed to load ad accounts for admin selector");
        }
    };

    const loadCampaignsForSearch = async (accountIds: string[]) => {
        if (!metaToken) return;
        try {
            const camps = await fetchCampaignsBatch(accountIds, metaToken);
            setAccountCampaigns(camps);
        } catch (e) {
            console.error("Failed to batch fetch campaigns");
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

    // --- Handlers ---

    const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 5000);
    };

    const handleToggleGoogleAuth = async () => {
        const newValue = !enableGoogleAuth;
        setEnableGoogleAuth(newValue);
        try {
            await updateSystemSetting('enable_google_auth', String(newValue));
            showNotification('success', `Google Auth ${newValue ? 'Enabled' : 'Disabled'}`);
        } catch (e) {
            setEnableGoogleAuth(!newValue);
            showNotification('error', "Failed to update Google Auth setting");
        }
    };

    const handleToggleRouter = async () => {
        const newValue = !enableRouter;
        setEnableRouter(newValue);
        try {
            await updateSystemSetting('enable_react_router', String(newValue));
            showNotification('success', `React Router ${newValue ? 'Enabled' : 'Disabled'} - Please Refresh`);
        } catch (e) {
            setEnableRouter(!newValue);
            showNotification('error', "Failed to update Router setting");
        }
    };

    const handleToggleManualRefresh = async () => {
        const newValue = !enableManualRefresh;
        setEnableManualRefresh(newValue);
        try {
            await updateSystemSetting('enable_manual_refresh', String(newValue));
            showNotification('success', `Manual Refresh ${newValue ? 'Enabled' : 'Disabled'} - Please Refresh`);
        } catch (e) {
            setEnableManualRefresh(!newValue);
            showNotification('error', "Failed to update Manual Refresh setting");
        }
    };

    const handleSaveToken = async () => {
        await updateSystemSetting('meta_token', metaToken);
        showNotification('success', "System Token Updated Successfully");
        fetchAccounts(metaToken);
    };

    // Create User Handler
    const handleCreateUser = async (formData: any) => {
        try {
            await createUser(formData);
            showNotification('success', 'User created successfully');
            await refreshUsers();
        } catch (e: any) {
            const errorMsg = e.message || String(e);
            showNotification('error', `Error creating user: ${errorMsg}`);
            throw e;
        }
    };

    // Update User Handler
    const handleUpdateUser = async (formData: any) => {
        if (!editingUser) return;
        try {
            // Update Profile
            await updateUserProfile(editingUser.id, {
                role: formData.role,
                first_name: formData.first_name,
                last_name: formData.last_name,
                company: formData.company
            });

            // Update Config
            const configUpdates: Partial<UserConfig> = {
                ad_account_ids: formData.ad_account_ids,
                allowed_profiles: formData.allowed_profiles,
                allowed_features: Array.from(new Set(
                    (formData.allowed_features || []).map((f: string) => {
                        if (f === 'creative-hub') return 'ads-hub';
                        if (f === 'reporting-engine' || f === 'reporting') return 'report-kitchen';
                        return f;
                    })
                )),
                hide_total_spend: formData.hide_total_spend,
                spend_multiplier: formData.spend_multiplier,
                global_campaign_filter: formData.global_campaign_filter,
                fixed_date_start: formData.fixed_date_start || null,
                fixed_date_end: formData.fixed_date_end || null,
                disable_ai: formData.disable_ai,
                disable_creative_tags: formData.disable_creative_tags,
                hide_account_name: formData.hide_account_name,
                enable_report_preview: formData.enable_report_preview,
                refresh_interval: formData.refresh_interval
            };

            await updateUserConfig(editingUser.id, configUpdates);
            await refreshUsers();
            showNotification('success', `User updated successfully`);
        } catch (e: any) {
            const errorMsg = e.message || String(e);
            showNotification('error', `Error updating user: ${errorMsg}`);
            throw e;
        }
    };

    // Delete User Handler - Trigger Modal
    const handleDeleteUser = (user: { id: string, email: string }) => {
        setUserToDelete(user);
    };

    // Actual Delete Action
    const confirmDeleteUser = async () => {
        if (!userToDelete) return;
        setIsDeleting(true);

        try {
            await deleteUser(userToDelete.id);
            await refreshUsers();
            showNotification('success', `User ${userToDelete.email} deleted successfully`);
            setUserToDelete(null);
        } catch (e: any) {
            showNotification('error', `Failed to delete user: ${e.message}`);
        } finally {
            setIsDeleting(false);
        }
    };

    if (loading) return <LoadingSpinner theme={theme} message="Loading Administration..." bgClass="bg-transparent" />;

    return (
        <div className="pb-12 max-w-[1600px] mx-auto animate-fade-in px-4 md:px-8 pt-6">
            {/* Notification Banner - Elite Bottom Right Toast */}
            {notification && (
                <div className={`fixed bottom-8 right-8 z-[200] max-w-sm w-full p-4 rounded-xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] flex items-start gap-4 border backdrop-blur-md animate-fade-in-up transition-all duration-300 ${notification.type === 'success' ? 'bg-emerald-900/90 border-emerald-500/30 text-emerald-50' :
                    notification.type === 'error' ? 'bg-rose-900/90 border-rose-500/30 text-rose-50' :
                        'bg-slate-800/90 border-slate-600/30 text-slate-50'
                    }`}>
                    <div className={`mt-0.5 p-1 rounded-full ${notification.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' :
                        notification.type === 'error' ? 'bg-rose-500/20 text-rose-400' :
                            'bg-blue-500/20 text-blue-400'
                        }`}>
                        {notification.type === 'success' ? <CheckCircle size={18} /> :
                            notification.type === 'error' ? <AlertCircle size={18} /> :
                                <Info size={18} />}
                    </div>
                    <div className="flex-1">
                        <h4 className="font-bold text-sm mb-0.5 capitalize">{notification.type}</h4>
                        <p className="text-xs opacity-90 leading-relaxed font-medium">{notification.message}</p>
                    </div>
                    <button onClick={() => setNotification(null)} className="text-white/40 hover:text-white transition-colors">
                        <X size={14} />
                    </button>
                </div>
            )}

            <AdminHeader
                theme={theme}
                onCreateUser={() => setShowCreateModal(true)}
            />

            <SystemConfiguration
                theme={theme}
                metaToken={metaToken}
                setMetaToken={setMetaToken}
                enableGoogleAuth={enableGoogleAuth}
                toggleGoogleAuth={handleToggleGoogleAuth}
                enableRouter={enableRouter}
                toggleRouter={handleToggleRouter}
                enableManualRefresh={enableManualRefresh}
                toggleManualRefresh={handleToggleManualRefresh}
                onSaveToken={handleSaveToken}
            />

            <UserManagement
                theme={theme}
                users={users}
                availableAccounts={availableAccounts}
                onEditUser={setEditingUser}
                onDeleteUser={handleDeleteUser}
            />

            {showCreateModal && (
                <CreateUserModal
                    theme={theme}
                    onClose={() => setShowCreateModal(false)}
                    onCreate={handleCreateUser}
                />
            )}

            {editingUser && (
                <EditUserModal
                    theme={theme}
                    user={editingUser}
                    availableAccounts={availableAccounts}
                    accountCampaigns={accountCampaigns}
                    onClose={() => setEditingUser(null)}
                    onSave={handleUpdateUser}
                    fetchCampaigns={loadCampaignsForSearch}
                />
            )}

            {userToDelete && (
                <DeleteConfirmationModal
                    theme={theme}
                    userEmail={userToDelete.email}
                    isOpen={!!userToDelete}
                    onClose={() => setUserToDelete(null)}
                    onConfirm={confirmDeleteUser}
                    loading={isDeleting}
                />
            )}
        </div>
    );
};

export default AdminPanel;
