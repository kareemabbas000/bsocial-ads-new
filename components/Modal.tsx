
import React, { useEffect } from 'react';
import { X, AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
    theme?: 'light' | 'dark';
    maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    children,
    footer,
    theme = 'dark',
    maxWidth = 'max-w-lg'
}) => {
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const isDark = theme === 'dark';
    const bgClass = isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900';
    const overlayClass = isDark ? 'bg-black/80' : 'bg-slate-900/50';

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${overlayClass} backdrop-blur-sm animate-fade-in`}>
            <div
                className={`w-full ${maxWidth} rounded-xl border shadow-2xl overflow-hidden flex flex-col transform transition-all animate-scale-up ${bgClass}`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className={`p-5 border-b flex justify-between items-center ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                    <h3 className="text-lg font-bold tracking-tight">{title}</h3>
                    <button
                        onClick={onClose}
                        className={`p-1 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'}`}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto max-h-[70vh]">
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div className={`p-5 border-t flex justify-end gap-3 ${isDark ? 'border-slate-800 bg-slate-950/30' : 'border-slate-100 bg-slate-50/50'}`}>
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};

interface NotificationProps {
    type: 'success' | 'error' | 'info';
    message: string;
    onClose?: () => void;
    theme?: 'light' | 'dark';
}

export const NotificationBanner: React.FC<NotificationProps & { inline?: boolean }> = ({ type, message, onClose, theme = 'dark', inline = false }) => {
    const isDark = theme === 'dark';

    const styles = {
        success: {
            bg: isDark ? 'bg-emerald-500/20 shadow-emerald-900/20' : 'bg-emerald-50 shadow-emerald-100',
            border: isDark ? 'border-emerald-500/30' : 'border-emerald-200',
            text: isDark ? 'text-white' : 'text-emerald-900',
            icon: <CheckCircle size={20} className={isDark ? 'text-emerald-400' : 'text-emerald-600'} />
        },
        error: {
            bg: isDark ? 'bg-red-500/20 shadow-red-900/20' : 'bg-red-50 shadow-red-100',
            border: isDark ? 'border-red-500/30' : 'border-red-200',
            text: isDark ? 'text-white' : 'text-red-900',
            icon: <AlertTriangle size={20} className={isDark ? 'text-red-400' : 'text-red-600'} />
        },
        info: {
            bg: isDark ? 'bg-blue-500/20 shadow-blue-900/20' : 'bg-blue-50 shadow-blue-100',
            border: isDark ? 'border-blue-500/30' : 'border-blue-200',
            text: isDark ? 'text-white' : 'text-blue-900',
            icon: <Info size={20} className={isDark ? 'text-blue-400' : 'text-blue-600'} />
        }
    };

    const style = styles[type];
    const positionClasses = inline
        ? 'relative w-full mb-4'
        : 'fixed bottom-6 right-6 z-[60] max-w-sm w-full';

    return (
        <div className={`${positionClasses} p-4 rounded-xl border shadow-lg backdrop-blur-md flex items-start gap-3 animate-slide-in-right ${style.bg} ${style.border}`}>
            <div className="shrink-0 mt-0.5 animate-pulse-slow">{style.icon}</div>
            <p className={`text-sm font-medium flex-1 leading-relaxed ${style.text}`}>{message}</p>
            {onClose && (
                <button onClick={onClose} className={`shrink-0 opacity-60 hover:opacity-100 transition-opacity ${style.text}`}>
                    <X size={16} />
                </button>
            )}
        </div>
    );
};
