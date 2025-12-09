import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAdsManager } from '../context/AdsManagerContext';

interface DropdownPortalProps {
    children: React.ReactNode;
    triggerRef?: React.RefObject<HTMLElement>;
    isOpen: boolean;
    onClose: () => void;
    position?: { top: number, left: number };
}

export const DropdownPortal: React.FC<DropdownPortalProps> = ({ children, triggerRef, isOpen, onClose, position: explicitPosition }) => {
    const [position, setPosition] = useState(explicitPosition || { top: 0, left: 0 });

    useEffect(() => {
        if (explicitPosition) {
            setPosition(explicitPosition);
            return;
        }
        if (isOpen && triggerRef?.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setPosition({
                top: rect.bottom + window.scrollY + 4,
                left: rect.left + window.scrollX
            });
        }
    }, [isOpen, explicitPosition, triggerRef]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (isOpen && triggerRef?.current && !triggerRef.current.contains(e.target as Node)) {
                // Check if click was inside the portal is tricky without a ref to the portal content
                // So we rely on the parent to handle close if needed, but for 'click outside' usually implies
                // clicking anywhere else.
                // We'll add a ref to the portal div.
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            window.addEventListener('resize', onClose);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('resize', onClose);
        };
    }, [isOpen, onClose]);

    const { theme } = useAdsManager();
    const isDark = theme === 'dark';

    if (!isOpen) return null;

    return createPortal(
        <div
            className="fixed z-[9999]"
            style={{ top: position.top, left: position.left }}
            onMouseDown={(e) => e.stopPropagation()}
        >
            <div className={`border rounded-lg shadow-xl overflow-hidden min-w-[140px] animate-in fade-in zoom-in-95 duration-150 ${isDark
                ? 'bg-slate-900 border-slate-700'
                : 'bg-white border-slate-200'
                }`}>
                {children}
            </div>
        </div>,
        document.body
    );
};
