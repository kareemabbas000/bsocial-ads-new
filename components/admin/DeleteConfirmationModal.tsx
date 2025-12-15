import React from 'react';
import ReactDOM from 'react-dom';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { Theme } from '../../types';

interface DeleteConfirmationModalProps {
    theme: Theme;
    userEmail: string;
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    loading?: boolean;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
    theme,
    userEmail,
    isOpen,
    onClose,
    onConfirm,
    loading = false
}) => {
    if (!isOpen) return null;

    const isDark = theme === 'dark';
    const cardClass = isDark ? 'bg-slate-900/95 border-slate-800 text-white' : 'bg-white/95 border-slate-200 text-slate-900';

    const modalContent = (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div
                className={`w-full max-w-md rounded-2xl border shadow-2xl flex flex-col items-center text-center p-8 transform transition-all scale-100 ${cardClass}`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Warning Icon with Pulse Effect */}
                <div className="relative mb-6">
                    <div className="absolute inset-0 bg-red-500 blur-xl opacity-20 rounded-full animate-pulse"></div>
                    <div className={`relative p-4 rounded-full ${isDark ? 'bg-red-500/10' : 'bg-red-50'} border-2 border-red-500/20`}>
                        <AlertTriangle size={32} className="text-red-500" />
                    </div>
                </div>

                {/* Header */}
                <h3 className="text-xl font-bold mb-2">Delete User?</h3>

                {/* Description */}
                <p className={`text-sm mb-6 leading-relaxed max-w-[85%] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Are you sure you want to permanently delete <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{userEmail}</span>?
                    This action completely removes their access and configuration.
                    <span className="block mt-2 font-bold text-red-500/80">This cannot be undone.</span>
                </p>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 w-full">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs transition-colors border ${isDark
                            ? 'border-slate-700 hover:bg-slate-800 text-slate-300'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                            }`}
                    >
                        Cancel
                    </button>

                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs shadow-lg shadow-red-500/20 active:scale-95 transition-all text-white flex items-center justify-center gap-2 ${loading
                            ? 'bg-red-900/50 cursor-not-allowed'
                            : 'bg-red-600 hover:bg-red-500'
                            }`}
                    >
                        {loading ? (
                            <span className="animate-pulse">Deleting...</span>
                        ) : (
                            <>
                                <Trash2 size={16} /> Delete User
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );

    return ReactDOM.createPortal(modalContent, document.body);
};

export default DeleteConfirmationModal;
