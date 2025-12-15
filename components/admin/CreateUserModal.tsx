import React, { useState } from 'react';
import { X, UserPlus } from 'lucide-react';
import { Theme } from '../../types';

interface CreateUserModalProps {
    theme: Theme;
    onClose: () => void;
    onCreate: (data: any) => Promise<void>;
}

const CreateUserModal: React.FC<CreateUserModalProps> = ({ theme, onClose, onCreate }) => {
    const isDark = theme === 'dark';
    const cardClass = isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200';
    const textClass = isDark ? 'text-white' : 'text-slate-900';
    const inputClass = isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900';

    const [form, setForm] = useState({
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        company: '',
        role: 'client' as 'admin' | 'client'
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onCreate(form);
            onClose();
        } catch (error) {
            console.error("Failed to create user", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className={`w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden flex flex-col ${cardClass}`}>
                <div className={`px-6 py-4 border-b flex justify-between items-center ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                    <div>
                        <h3 className={`text-lg font-bold ${textClass}`}>Create New User</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Add a new user to the platform.</p>
                    </div>
                    <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors p-1"><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">First Name</label>
                            <input
                                type="text"
                                required
                                value={form.first_name}
                                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                                className={`w-full px-3 py-2 rounded-xl border text-sm ${inputClass}`}
                                placeholder="John"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Last Name</label>
                            <input
                                type="text"
                                required
                                value={form.last_name}
                                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                                className={`w-full px-3 py-2 rounded-xl border text-sm ${inputClass}`}
                                placeholder="Doe"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Company / Client</label>
                        <input
                            type="text"
                            value={form.company}
                            onChange={(e) => setForm({ ...form, company: e.target.value })}
                            className={`w-full px-3 py-2 rounded-xl border text-sm ${inputClass}`}
                            placeholder="BSocial LLC"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email Address</label>
                        <input
                            type="email"
                            required
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            className={`w-full px-3 py-2 rounded-xl border text-sm ${inputClass}`}
                            placeholder="user@example.com"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Password</label>
                        <input
                            type="password"
                            required
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                            className={`w-full px-3 py-2 rounded-xl border text-sm ${inputClass}`}
                            placeholder="••••••••"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Role</label>
                        <div className="flex gap-3">
                            <label className={`flex items-center justify-center p-3 rounded-xl border cursor-pointer flex-1 transition-all ${form.role === 'admin'
                                    ? 'border-brand-500 bg-brand-500/10 text-brand-500 ring-1 ring-brand-500'
                                    : `border-slate-700 text-slate-500 hover:bg-slate-800`
                                }`}>
                                <input
                                    type="radio"
                                    name="role"
                                    value="admin"
                                    checked={form.role === 'admin'}
                                    onChange={() => setForm({ ...form, role: 'admin' })}
                                    className="hidden"
                                />
                                <span className="text-xs font-bold uppercase">Administrator</span>
                            </label>

                            <label className={`flex items-center justify-center p-3 rounded-xl border cursor-pointer flex-1 transition-all ${form.role === 'client'
                                    ? 'border-brand-500 bg-brand-500/10 text-brand-500 ring-1 ring-brand-500'
                                    : `border-slate-700 text-slate-500 hover:bg-slate-800`
                                }`}>
                                <input
                                    type="radio"
                                    name="role"
                                    value="client"
                                    checked={form.role === 'client'}
                                    onChange={() => setForm({ ...form, role: 'client' })}
                                    className="hidden"
                                />
                                <span className="text-xs font-bold uppercase">Client User</span>
                            </label>
                        </div>
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-3 rounded-xl font-bold text-sm shadow-xl shadow-brand-500/20 active:scale-95 transition-all text-white flex items-center justify-center ${loading ? 'bg-slate-700 cursor-not-allowed' : 'bg-brand-600 hover:bg-brand-500'
                                }`}
                        >
                            {loading ? 'Creating...' : (
                                <>
                                    <UserPlus size={18} className="mr-2" /> Create User
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateUserModal;
