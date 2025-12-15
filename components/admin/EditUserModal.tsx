import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, Save, User, Layers, Settings, Calendar, Shield, Search, Check, Info } from 'lucide-react';
import { UserProfile, UserConfig, Theme, AdAccount } from '../../types';

interface EditUserModalProps {
    theme: Theme;
    user: UserProfile & { config?: UserConfig };
    availableAccounts: AdAccount[];
    accountCampaigns: { id: string, name: string, accountId: string }[];
    onClose: () => void;
    onSave: (updates: any) => Promise<void>;
    fetchCampaigns: (accountIds: string[]) => void;
}

const EditUserModal: React.FC<EditUserModalProps> = ({
    theme,
    user,
    availableAccounts,
    accountCampaigns,
    onClose,
    onSave,
    fetchCampaigns
}) => {
    const isDark = theme === 'dark';
    const cardClass = isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200';
    const textClass = isDark ? 'text-white' : 'text-slate-900';
    const inputClass = isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900';

    const [activeTab, setActiveTab] = useState<'profile' | 'accounts' | 'features' | 'config'>('profile');
    const [loading, setLoading] = useState(false);
    const [accountSearch, setAccountSearch] = useState('');

    const [formData, setFormData] = useState({
        role: user.role,
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        company: user.company || '',
        ad_account_ids: user.config?.ad_account_ids || [],
        allowed_profiles: user.config?.allowed_profiles || ['sales'],
        allowed_profiles: user.config?.allowed_profiles || ['sales'],
        allowed_features: (user.config?.allowed_features || ['dashboard', 'campaigns', 'ads-hub', 'ai-lab']).map(f => {
            // Auto-migrate legacy keys on edit to ensure toggling works correctly
            if (f === 'creative-hub') return 'ads-hub';
            if (f === 'reporting-engine' || f === 'reporting') return 'report-kitchen';
            return f;
        }),
        hide_total_spend: user.config?.hide_total_spend || false,
        spend_multiplier: user.config?.spend_multiplier || 1.0,
        global_campaign_filter: user.config?.global_campaign_filter || [],
        fixed_date_start: user.config?.fixed_date_start || '',
        fixed_date_end: user.config?.fixed_date_end || '',
        disable_ai: user.config?.disable_ai || false,
        disable_creative_tags: user.config?.disable_creative_tags || false,
        hide_account_name: user.config?.hide_account_name || false,
        enable_report_preview: user.config?.enable_report_preview || false,
        refresh_interval: user.config?.refresh_interval || 10
    });

    // Helper to toggle array items
    const toggleArrayItem = (field: 'allowed_profiles' | 'allowed_features' | 'global_campaign_filter', value: string) => {
        const currentArray = formData[field] || [];
        const newArray = currentArray.includes(value)
            ? currentArray.filter(item => item !== value)
            : [...currentArray, value];
        setFormData({ ...formData, [field]: newArray });
    };
    useEffect(() => {
        if (formData.ad_account_ids.length > 0) {
            fetchCampaigns(formData.ad_account_ids);
        }
    }, [formData.ad_account_ids]);

    const handleSave = async () => {
        setLoading(true);
        try {
            await onSave(formData);
            onClose();
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };



    const toggleAdAccount = (accountId: string) => {
        const current = formData.ad_account_ids || [];
        if (current.includes(accountId)) {
            setFormData({ ...formData, ad_account_ids: current.filter(id => id !== accountId) });
        } else {
            setFormData({ ...formData, ad_account_ids: [...current, accountId] });
        }
    };

    const filteredAccounts = availableAccounts.filter(acc =>
        acc.name.toLowerCase().includes(accountSearch.toLowerCase()) ||
        acc.id.includes(accountSearch)
    );

    const tabs = [
        { id: 'profile', label: 'Identity', icon: User },
        { id: 'accounts', label: 'Accounts', icon: Layers },
        { id: 'features', label: 'Access', icon: Shield },
        { id: 'config', label: 'Settings', icon: Settings },
    ];

    const modalContent = (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in text-left">
            <div className={`w-full max-w-4xl rounded-2xl border shadow-2xl flex flex-col max-h-[90vh] ${cardClass}`}>

                {/* Header */}
                <div className={`px-6 py-4 border-b flex justify-between items-center ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                    <div>
                        <h3 className={`text-lg font-bold ${textClass}`}>Edit User: {user.email}</h3>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Configuration & Permission Management</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-slate-500 hover:text-white transition-colors"><X size={20} /></button>
                </div>

                {/* Tabs */}
                <div className={`flex border-b px-6 space-x-6 overflow-x-auto no-scrollbar ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center space-x-2 py-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap -mb-px ${isActive
                                    ? 'border-brand-500 text-brand-500'
                                    : 'border-transparent text-slate-500 hover:text-slate-300'
                                    }`}
                            >
                                <Icon size={16} />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Scrollable Body */}
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1">

                    {/* --- TAB: PROFILE --- */}
                    {activeTab === 'profile' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">First Name</label>
                                    <input type="text" value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} className={`w-full px-4 py-2.5 rounded-xl border text-sm ${inputClass}`} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Last Name</label>
                                    <input type="text" value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} className={`w-full px-4 py-2.5 rounded-xl border text-sm ${inputClass}`} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Company</label>
                                    <input type="text" value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} className={`w-full px-4 py-2.5 rounded-xl border text-sm ${inputClass}`} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Role</label>
                                    <div className="flex bg-slate-500/10 rounded-xl p-1">
                                        <button onClick={() => setFormData({ ...formData, role: 'admin' })} className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${formData.role === 'admin' ? 'bg-brand-600 text-white shadow-md' : 'text-slate-500'}`}>ADMIN</button>
                                        <button onClick={() => setFormData({ ...formData, role: 'client' })} className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${formData.role === 'client' ? 'bg-brand-600 text-white shadow-md' : 'text-slate-500'}`}>CLIENT</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- TAB: ACCOUNTS --- */}
                    {activeTab === 'accounts' && (
                        <div className="space-y-4 animate-fade-in h-full flex flex-col">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                                    <Layers size={14} /> Assigned Ad Accounts
                                    <span className="bg-brand-500 text-white px-2 py-0.5 rounded-full text-[10px]">{formData.ad_account_ids.length} selected</span>
                                </label>
                                <div className="relative w-full md:w-64">
                                    <Search size={14} className="absolute left-3 top-3 text-slate-500" />
                                    <input
                                        type="text"
                                        placeholder="Search accounts..."
                                        value={accountSearch}
                                        onChange={(e) => setAccountSearch(e.target.value)}
                                        className={`w-full pl-9 py-2 rounded-xl border text-xs ${inputClass}`}
                                    />
                                </div>
                            </div>

                            <div className={`border rounded-xl flex-1 overflow-y-auto custom-scrollbar p-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[40vh] ${isDark ? 'border-slate-800 bg-slate-950/30' : 'border-slate-200 bg-slate-50'}`}>
                                {filteredAccounts.map(acc => (
                                    <label key={acc.id} onClick={(e) => {
                                        e.preventDefault();
                                        toggleAdAccount(acc.id);
                                    }} className={`flex items-start p-3 rounded-lg cursor-pointer border transition-all ${formData.ad_account_ids.includes(acc.id)
                                        ? (isDark ? 'bg-brand-500/10 border-brand-500/50' : 'bg-brand-50 border-brand-200')
                                        : 'border-transparent hover:bg-slate-500/5'
                                        }`}>
                                        <div className={`w-5 h-5 rounded border flex items-center justify-center mr-3 mt-0.5 transition-colors ${formData.ad_account_ids.includes(acc.id) ? 'bg-brand-500 border-brand-500' : 'border-slate-400'}`}>
                                            {formData.ad_account_ids.includes(acc.id) && <Check size={12} className="text-white" />}
                                        </div>
                                        <div className="overflow-hidden">
                                            <div className={`text-xs font-bold truncate ${textClass}`}>{acc.name}</div>
                                            <div className={`text-[10px] font-mono truncate ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{acc.id}</div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* --- TAB: ACCESS --- */}
                    {activeTab === 'features' && (
                        <div className="space-y-8 animate-fade-in">
                            {/* Feature Modules */}
                            <div>
                                <h4 className="text-sm font-bold text-slate-500 uppercase mb-4 border-b border-slate-700/50 pb-2">Module Access</h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {[
                                        { id: 'dashboard', label: 'Overview Dashboard', desc: 'Main aggregated metrics view' },
                                        { id: 'campaigns', label: 'Campaign Manager', desc: 'Full campaign structure view' },
                                        { id: 'ads-hub', label: 'Ads Hub', desc: 'Visual creative analysis' },
                                        { id: 'ai-lab', label: 'AI Laboratory', desc: 'AI insights and chat' },
                                        { id: 'report-kitchen', label: 'Report Kitchen', desc: 'Custom report builder' }
                                    ].map(feat => (
                                        <button
                                            key={feat.id}
                                            onClick={() => toggleArrayItem('allowed_features', feat.id)}
                                            className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden group ${formData.allowed_features.includes(feat.id)
                                                ? 'bg-brand-600 text-white border-brand-500 shadow-lg shadow-brand-500/20'
                                                : isDark ? 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                                                }`}
                                        >
                                            <div className="font-bold text-sm mb-1">{feat.label}</div>
                                            <div className={`text-[10px] ${formData.allowed_features.includes(feat.id) ? 'text-brand-100' : 'text-slate-500'}`}>{feat.desc}</div>
                                            {formData.allowed_features.includes(feat.id) && (
                                                <div className="absolute top-2 right-2 p-1 bg-white/20 rounded-full">
                                                    <Check size={10} className="text-white" />
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Profile Views */}
                            <div>
                                <h4 className="text-sm font-bold text-slate-500 uppercase mb-4 border-b border-slate-700/50 pb-2">Data Profiles</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {['sales', 'engagement', 'leads', 'messenger'].map(p => (
                                        <button
                                            key={p}
                                            onClick={() => toggleArrayItem('allowed_profiles', p)}
                                            className={`p-3 rounded-xl border text-center font-bold text-xs uppercase transition-all ${formData.allowed_profiles.includes(p)
                                                ? 'bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-500/20'
                                                : isDark ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-white border-slate-200 text-slate-500'
                                                }`}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- TAB: SETTINGS & CONSTRAINTS --- */}
                    {activeTab === 'config' && (
                        <div className="space-y-8 animate-fade-in">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Toggles */}
                                <div className="space-y-3">
                                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Display Preferences</h4>
                                    {[
                                        { label: 'Hide Financial Data', field: 'hide_total_spend', desc: 'Hides all spend and cost metrics' },
                                        { label: 'Disable AI Features', field: 'disable_ai', desc: 'Removes AI analysis tools' },
                                        { label: 'Disable Creative Tags', field: 'disable_creative_tags', desc: 'Hides creative breakdown tags' },
                                        { label: 'Hide Account Names', field: 'hide_account_name', desc: 'Anonymize account identifiers' },
                                        { label: 'Enable Report Preview', field: 'enable_report_preview', desc: 'Allow viewing generated reports' }
                                    ].map((toggle: any) => (
                                        <div key={toggle.field} className={`flex items-center justify-between p-3 rounded-xl border ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                                            <div>
                                                <div className={`text-xs font-bold ${textClass}`}>{toggle.label}</div>
                                                <div className="text-[10px] text-slate-500">{toggle.desc}</div>
                                            </div>
                                            <div
                                                className={`w-10 h-5 rounded-full p-0.5 cursor-pointer transition-colors ${(formData as any)[toggle.field] ? 'bg-brand-500' : 'bg-slate-600'}`}
                                                onClick={() => setFormData({ ...formData, [toggle.field]: !(formData as any)[toggle.field] })}
                                            >
                                                <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${(formData as any)[toggle.field] ? 'translate-x-5' : 'translate-x-0'}`} />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Inputs */}
                                <div className="space-y-6">
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Spend Multiplier</h4>
                                        <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                                            <label className="text-xs text-slate-500 flex items-center gap-2 mb-2">
                                                <Info size={12} /> Adjusts all displayed currency values
                                            </label>
                                            <div className="flex items-center gap-2">
                                                <span className="text-brand-500 font-bold text-lg">x</span>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={formData.spend_multiplier}
                                                    onChange={(e) => setFormData({ ...formData, spend_multiplier: parseFloat(e.target.value) })}
                                                    className={`w-full bg-transparent text-xl font-bold focus:outline-none ${textClass}`}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Fixed Date Range (Optional)</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[10px] text-slate-500 mb-1 block">Start Date</label>
                                                <input type="date" value={typeof formData.fixed_date_start === 'string' ? formData.fixed_date_start : ''} onChange={(e) => setFormData({ ...formData, fixed_date_start: e.target.value })} className={`w-full py-2 px-3 rounded-xl border text-xs ${inputClass} dark:[color-scheme:dark]`} />
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-slate-500 mb-1 block">End Date</label>
                                                <input type="date" value={typeof formData.fixed_date_end === 'string' ? formData.fixed_date_end : ''} onChange={(e) => setFormData({ ...formData, fixed_date_end: e.target.value })} className={`w-full py-2 px-3 rounded-xl border text-xs ${inputClass} dark:[color-scheme:dark]`} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                </div>

                {/* Footer */}
                <div className={`px-6 py-4 border-t flex justify-between items-center bg-transparent ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                    <button onClick={onClose} className="px-5 py-2.5 rounded-xl font-bold text-xs text-slate-500 hover:bg-slate-800 hover:text-white transition-colors">
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className={`px-6 py-2.5 rounded-xl font-bold text-xs shadow-xl shadow-brand-500/20 active:scale-95 transition-all text-white flex items-center ${loading ? 'bg-slate-700 cursor-not-allowed' : 'bg-brand-600 hover:bg-brand-500'
                            }`}
                    >
                        {loading ? 'Saving...' : (
                            <>
                                <Save size={16} className="mr-2" /> Save Changes
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );

    return ReactDOM.createPortal(modalContent, document.body);
};

export default EditUserModal;
