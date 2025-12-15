import React from 'react';
import { Plus } from 'lucide-react';
import { Theme } from '../../types';

interface AdminHeaderProps {
    theme: Theme;
    onCreateUser: () => void;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({ theme, onCreateUser }) => {
    const isDark = theme === 'dark';
    const textClass = isDark ? 'text-white' : 'text-slate-900';

    return (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0 bg-transparent mb-8">
            <div>
                <h1 className={`text-3xl font-black tracking-tight ${textClass}`}>Admin Console</h1>
                <p className="text-slate-500 text-sm mt-1">Manage users, permissions, and system configuration.</p>
            </div>

            {/* Sticky/Floating Create Button for Mobile */}
            <div className="fixed bottom-6 right-6 md:static z-[100] md:z-auto">
                <button
                    onClick={onCreateUser}
                    className="flex items-center justify-center space-x-2 bg-brand-600 hover:bg-brand-500 text-white px-5 py-3 md:py-2.5 rounded-full md:rounded-xl font-bold text-sm shadow-xl shadow-brand-500/30 md:shadow-brand-500/20 transition-all hover:scale-105 active:scale-95 w-14 md:w-auto h-14 md:h-auto md:aspect-auto aspect-square md:px-5"
                    aria-label="Create User"
                >
                    <Plus size={24} className="md:w-[18px] md:h-[18px]" />
                    <span className="hidden md:inline">Create User</span>
                </button>
            </div>
        </div>
    );
};

export default AdminHeader;
