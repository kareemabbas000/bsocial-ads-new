import React from 'react';
import { Users, Edit, Trash2, Shield, Briefcase } from 'lucide-react';
import { UserProfile, UserConfig, Theme, AdAccount } from '../../types';

interface UserManagementProps {
    theme: Theme;
    users: (UserProfile & { config?: UserConfig })[];
    availableAccounts: AdAccount[];
    onEditUser: (user: UserProfile & { config?: UserConfig }) => void;
    onDeleteUser: (user: { id: string; email: string }) => void;
}

const UserManagement: React.FC<UserManagementProps> = ({
    theme,
    users,
    availableAccounts,
    onEditUser,
    onDeleteUser
}) => {
    const isDark = theme === 'dark';
    const cardClass = isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200';
    const textClass = isDark ? 'text-white' : 'text-slate-900';

    // Renders the role badge
    const RoleBadge = ({ role }: { role: string }) => (
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${role === 'admin'
            ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
            : 'bg-slate-500/10 text-slate-500 border-slate-500/20'
            }`}>
            {role}
        </span>
    );

    // Renders the assigned accounts chips
    const AccountChips = ({ config }: { config?: UserConfig }) => {
        if (!config?.ad_account_ids?.length) {
            return <span className="text-slate-400 italic text-[10px]">No accounts assigned</span>;
        }
        return (
            <div className="flex flex-wrap gap-1.5">
                {config.ad_account_ids.map(id => {
                    const account = availableAccounts.find(a => a.id === id);
                    return (
                        <span
                            key={id}
                            className="text-[10px] font-bold bg-brand-500/10 text-brand-500 px-2 py-0.5 rounded border border-brand-500/20 inline-block shadow-sm"
                            title={`${id} - ${account?.name || 'Unknown'}`}
                        >
                            {account ? account.name : id}
                        </span>
                    );
                })}
            </div>
        );
    };

    return (
        <div className={`rounded-2xl border overflow-hidden shadow-sm ${cardClass}`}>
            <div className={`p-5 border-b backdrop-blur-sm ${isDark ? 'border-slate-800' : 'border-slate-100 bg-slate-50/50'}`}>
                <h3 className={`text-lg font-bold flex items-center ${textClass}`}>
                    <Users size={20} className="mr-3 text-brand-500" />
                    User Management
                </h3>
            </div>

            {/* MULTI-DEVICE VIEW: Table for Large Screens Only (Responsive) */}
            <div className="hidden lg:block overflow-x-auto custom-scrollbar pb-2">
                <table className="w-full text-left text-sm border-collapse min-w-[900px]">
                    <thead className={`uppercase text-[11px] tracking-wider font-bold ${isDark ? 'bg-slate-950/30 text-slate-400' : 'bg-slate-50 text-slate-500'}`}>
                        <tr>
                            <th className="px-4 py-3 border-b border-transparent">User / Client</th>
                            <th className="px-4 py-3 border-b border-transparent">Role</th>
                            <th className="px-4 py-3 border-b border-transparent">Assigned Accounts</th>
                            <th className="px-4 py-3 border-b border-transparent">Access</th>
                            <th className="px-4 py-3 border-b border-transparent">Config</th>
                            <th className="px-4 py-3 border-b border-transparent text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-100'}`}>
                        {users.map(user => (
                            <tr key={user.id} className={`group transition-colors ${isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'}`}>
                                <td className="px-4 py-3 align-top">
                                    <div className="flex flex-col">
                                        <div className={`font-bold text-sm mb-0.5 ${textClass}`}>
                                            {user.first_name ? `${user.first_name} ${user.last_name}` : user.email.split('@')[0]}
                                        </div>
                                        <div className="text-xs text-slate-500 mb-1.5">{user.email}</div>
                                        {user.company && (
                                            <div className={`flex items-center text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md w-fit ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                                                <Briefcase size={10} className="mr-1.5" />
                                                {user.company}
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td className="px-4 py-3 align-top">
                                    <RoleBadge role={user.role} />
                                </td>
                                <td className="px-4 py-3 align-top max-w-[300px]">
                                    <AccountChips config={user.config} />
                                </td>
                                <td className="px-4 py-3 align-top">
                                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                                        {user.config?.allowed_features?.map(f => (
                                            <span key={f} className={`text-[9px] px-1.5 py-0.5 rounded border uppercase ${isDark ? 'border-slate-700 text-slate-400' : 'border-slate-200 text-slate-500'}`}>
                                                {f}
                                            </span>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-4 py-3 align-top">
                                    <div className="text-[10px] flex flex-col gap-1">
                                        {user.config?.hide_total_spend && <span className="text-red-400 font-bold bg-red-400/10 px-2 py-0.5 rounded w-fit">Hidden Financials</span>}
                                        {user.config?.spend_multiplier && user.config?.spend_multiplier !== 1 && <span className="text-brand-400 font-bold bg-brand-400/10 px-2 py-0.5 rounded w-fit">x{user.config?.spend_multiplier} Mult</span>}
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-right align-top">
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => onEditUser(user)}
                                            className="p-2 hover:bg-brand-500/10 text-slate-400 hover:text-brand-500 rounded-lg transition-colors group-hover:visible"
                                            title="Edit Configuration"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            onClick={() => onDeleteUser({ id: user.id, email: user.email })}
                                            className="p-2 hover:bg-red-500/10 text-slate-400 hover:text-red-500 rounded-lg transition-colors group-hover:visible"
                                            title="Delete User"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* MOBILE & TABLET & LAPTOP VIEW: Cards */}
            <div className="lg:hidden p-4 space-y-4">
                {users.map(user => (
                    <div key={user.id} className={`p-4 rounded-xl border flex flex-col gap-4 ${isDark ? 'bg-slate-950/30 border-slate-800' : 'bg-slate-50/50 border-slate-200'}`}>
                        {/* Header */}
                        <div className="flex justify-between items-start">
                            <div>
                                <div className={`font-bold text-base ${textClass}`}>
                                    {user.first_name ? `${user.first_name} ${user.last_name}` : user.email.split('@')[0]}
                                </div>
                                <div className="text-xs text-slate-500">{user.email}</div>
                                {user.company && (
                                    <div className="mt-1.5 inline-flex items-center text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-200/50 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                        {user.company}
                                    </div>
                                )}
                            </div>
                            <RoleBadge role={user.role} />
                        </div>

                        <div className={`h-px w-full ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />

                        {/* Details */}
                        <div className="space-y-3">
                            <div>
                                <label className="text-[10px] uppercase font-bold text-slate-500 mb-1.5 block">Assigned Accounts</label>
                                <AccountChips config={user.config} />
                            </div>

                            {(user.config?.hide_total_spend || (user.config?.spend_multiplier && user.config?.spend_multiplier !== 1)) && (
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-slate-500 mb-1.5 block">Restrictions</label>
                                    <div className="flex gap-2">
                                        {user.config?.hide_total_spend && <span className="text-[10px] text-red-400 font-bold bg-red-400/10 px-2 py-0.5 rounded">Hidden Financials</span>}
                                        {user.config?.spend_multiplier !== 1 && <span className="text-[10px] text-brand-400 font-bold bg-brand-400/10 px-2 py-0.5 rounded">x{user.config?.spend_multiplier} Multiplier</span>}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="grid grid-cols-2 gap-3 mt-2">
                            <button
                                onClick={() => onEditUser(user)}
                                className="flex items-center justify-center p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-brand-50 hover:border-brand-200 dark:hover:bg-slate-800 dark:hover:border-slate-600 transition-colors text-xs font-bold text-slate-600 dark:text-slate-300"
                            >
                                <Edit size={14} className="mr-2" /> Configure
                            </button>
                            <button
                                onClick={() => onDeleteUser({ id: user.id, email: user.email })}
                                className="flex items-center justify-center p-2.5 rounded-lg border border-red-200 dark:border-red-900/30 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-xs font-bold text-red-500"
                            >
                                <Trash2 size={14} className="mr-2" /> Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default UserManagement;
