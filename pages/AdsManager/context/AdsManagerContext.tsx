import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { DateSelection, GlobalFilter, AccountHierarchy } from '../../../types';

type Level = 'CAMPAIGN' | 'ADSET' | 'AD';

interface BreadcrumbItem { // Changed from Section to BreadcrumbItem
    id: string;
    name: string;
    level: Level;
}

interface AdsManagerContextType {
    token: string;
    accountIds: string[];
    dateSelection: DateSelection;
    filter?: GlobalFilter;
    refreshTrigger: number;
    hierarchy?: AccountHierarchy;
    theme: 'light' | 'dark';

    // Navigation
    currentLevel: 'CAMPAIGN' | 'ADSET' | 'AD';
    setCurrentLevel: (level: 'CAMPAIGN' | 'ADSET' | 'AD') => void;
    breadcrumbs: BreadcrumbItem[];
    pushBreadcrumb: (item: BreadcrumbItem) => void;
    popBreadcrumb: () => void;
    setBreadcrumbs: (items: BreadcrumbItem[]) => void;
    resetBreadcrumbs: () => void;

    // Selection
    selectedIds: Set<string>;
    toggleSelection: (id: string) => void;
    selectAll: (ids: string[]) => void;
    clearSelection: () => void;

    // Columns
    visibleColumns: string[];
    setVisibleColumns: (cols: string[]) => void;
    columnOrder: string[];
    setColumnOrder: (order: string[]) => void;
}

const AdsManagerContext = createContext<AdsManagerContextType | undefined>(undefined);

interface AdsManagerProviderProps {
    children: ReactNode;
    token: string;
    accountIds: string[];
    dateSelection: DateSelection;
    filter?: GlobalFilter;
    refreshTrigger?: number;
    hierarchy?: AccountHierarchy;
    theme: 'light' | 'dark';
}

export const AdsManagerProvider: React.FC<AdsManagerProviderProps> = ({
    children,
    token,
    accountIds,
    dateSelection,
    filter,
    refreshTrigger = 0,
    hierarchy,
    theme
}) => {
    const [currentLevel, setCurrentLevel] = useState<'CAMPAIGN' | 'ADSET' | 'AD'>('CAMPAIGN');
    const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Default columns and order
    const DEFAULT_COLS = ['delivery', 'budget', 'results', 'reach', 'impressions', 'cpm', 'spend'];
    const [visibleColumns, setVisibleColumns] = useState<string[]>(DEFAULT_COLS);
    const [columnOrder, setColumnOrder] = useState<string[]>(['name', ...DEFAULT_COLS]);

    // Update columnOrder when visibleColumns changes
    useEffect(() => {
        // Ensure name is always first
        const newOrder = ['name', ...visibleColumns.filter(c => c !== 'name')];
        // Merge with existing order preference if possible, but for now simple sync
        setColumnOrder(newOrder);
    }, [visibleColumns]);

    // Reset selection when level changes
    // ... existing navigation logic ...

    const pushBreadcrumb = (item: BreadcrumbItem) => {
        setBreadcrumbs(prev => [...prev, item]);
        clearSelection();
    };

    const popBreadcrumb = () => {
        setBreadcrumbs(prev => prev.slice(0, -1));
        clearSelection();
    };

    const resetBreadcrumbs = () => {
        setBreadcrumbs([]);
        setCurrentLevel('CAMPAIGN'); // Added back setCurrentLevel as it was in original
        clearSelection();
    };

    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedIds(newSet);
    };

    const selectAll = (ids: string[]) => {
        setSelectedIds(new Set(ids));
    };

    const clearSelection = () => {
        setSelectedIds(new Set());
    };

    return (
        <AdsManagerContext.Provider value={{
            token,
            accountIds,
            dateSelection,
            filter,
            refreshTrigger,
            hierarchy,
            theme,
            currentLevel,
            setCurrentLevel,
            breadcrumbs,
            pushBreadcrumb,
            popBreadcrumb,
            resetBreadcrumbs,
            selectedIds,
            toggleSelection,
            selectAll,
            clearSelection,
            visibleColumns,
            setVisibleColumns,
            setBreadcrumbs,
            columnOrder,
            setColumnOrder
        }}>
            {children}
        </AdsManagerContext.Provider>
    );
};

export const useAdsManager = () => {
    const context = useContext(AdsManagerContext);
    if (!context) throw new Error('useAdsManager must be used within AdsManagerProvider');
    return context;
};
