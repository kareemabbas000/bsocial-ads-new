import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAdsManager } from '../context/AdsManagerContext';
import { Edit3, BarChart2, ChevronRight, GripVertical, MoreVertical, Copy, Trash2, Loader2, ChevronUp, ChevronDown } from 'lucide-react';
import { deleteEntity, duplicateEntity } from '../../../services/metaService';
import { formatCurrency, formatNumber } from '../../../services/utils/format';
import { AVAILABLE_COLUMNS } from '../constants/columns';
import { AdsTableRow } from './AdsTableRow';
import { EditorDrawer } from './EditorDrawer';
import { InsightsDrawer } from './InsightsDrawer';
import { DropdownPortal } from './DropdownPortal';

interface AdsTableProps {
    data: any[];
    isLoading: boolean;
    sortConfig?: { key: string, direction: 'asc' | 'desc' } | null;
    onSort?: (key: string) => void;
    hasMore?: boolean;
    onLoadMore?: () => void;
}

export const AdsTable: React.FC<AdsTableProps> = ({ data, isLoading, sortConfig, onSort, hasMore, onLoadMore }) => {
    const {
        token,
        currentLevel,
        setCurrentLevel,
        pushBreadcrumb,
        selectedIds,
        toggleSelection,
        selectAll,
        clearSelection,
        visibleColumns,
        columnOrder,
        setColumnOrder,
        theme
    } = useAdsManager();

    const isDark = theme === 'dark';

    // Editor State
    const [editItem, setEditItem] = useState<any | null>(null);
    const [activeInsightsItem, setActiveInsightsItem] = useState<any | null>(null);
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [dragOver, setDragOver] = useState<string | null>(null);

    // Column Resizing State
    const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    const handleEdit = (item: any) => {
        setEditItem(item);
        setIsEditorOpen(true);
    };

    const handleDrillDown = (item: any) => {
        if (currentLevel === 'CAMPAIGN') {
            pushBreadcrumb({ id: item.id, name: item.name, level: 'CAMPAIGN' });
            setCurrentLevel('ADSET');
        } else if (currentLevel === 'ADSET') {
            pushBreadcrumb({ id: item.id, name: item.name, level: 'ADSET' });
            setCurrentLevel('AD');
        }
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            selectAll(data.map(d => d.id));
        } else {
            clearSelection();
        }
    };

    // Resizing Logic (Live Resize - Matches Creative Hub)
    const tableContainerRef = useRef<HTMLDivElement>(null);
    const resizingRef = useRef<{ id: string, startX: number, startWidth: number } | null>(null);

    const onMouseMove = useCallback((e: MouseEvent) => {
        if (!resizingRef.current) return;

        const diff = e.clientX - resizingRef.current.startX;
        const newWidth = Math.max(80, resizingRef.current.startWidth + diff);
        const colId = resizingRef.current.id;

        // Live Update
        setColumnWidths(prev => ({ ...prev, [colId]: newWidth }));
    }, []);

    const onMouseUp = useCallback(() => {
        resizingRef.current = null;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        document.body.style.cursor = 'default';
        document.body.style.userSelect = 'auto'; // Restore text selection
    }, [onMouseMove]);

    const startResize = useCallback((e: React.MouseEvent, colId: string, currentWidth: number) => {
        e.preventDefault();
        e.stopPropagation();

        resizingRef.current = { id: colId, startX: e.clientX, startWidth: currentWidth };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none'; // Prevent text selection while resizing
    }, [onMouseMove, onMouseUp]);

    // Safety Cleanup
    useEffect(() => {
        return () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            document.body.style.cursor = 'default';
            document.body.style.userSelect = 'auto';
        };
    }, [onMouseMove, onMouseUp]);

    // Drag and Drop Logic
    const onDragStart = (e: React.DragEvent, colId: string) => {
        e.dataTransfer.setData('colId', colId);
    };

    const onDragOver = (e: React.DragEvent, colId: string) => {
        e.preventDefault();
        setDragOver(colId);
    };

    const onDrop = (e: React.DragEvent, targetColId: string) => {
        e.preventDefault();
        const draggedColId = e.dataTransfer.getData('colId');
        setDragOver(null);

        if (!draggedColId || draggedColId === targetColId) return;

        // activeColumns includes 'name' but we only reorder visibleColumns usually?
        // Actually columnOrder controls the whole thing.
        // activeColumns is currently derived as ['name', ...visibleColumns].
        // We should switch activeColumns to use columnOrder if valid.

        // For now, let's just swap in valid columns and update columnOrder.
        const currentOrder = [...columnOrder]; // Use the actual columnOrder from context
        const fromIndex = currentOrder.indexOf(draggedColId);
        const toIndex = currentOrder.indexOf(targetColId);
        if (fromIndex === -1 || toIndex === -1) return;

        const newOrder = [...currentOrder];
        newOrder.splice(fromIndex, 1);
        newOrder.splice(toIndex, 0, draggedColId);

        setColumnOrder(newOrder);
    };

    // ACTIONS MENU Logic
    const [menuState, setMenuState] = useState<{ id: string, top: number, left: number } | null>(null);

    const handleActionClick = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (menuState?.id === id) {
            setMenuState(null);
        } else {
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            setMenuState({
                id,
                top: rect.bottom + 4,
                left: rect.left - 100 // Shift slightly left to align right edge
            });
        }
    };

    // Check if we need to close menu on outside click
    useEffect(() => {
        const checkClose = () => setMenuState(null);
        if (menuState) window.addEventListener('click', checkClose);
        return () => window.removeEventListener('click', checkClose);
    }, [menuState]);



    const activeColumns = columnOrder.length > 0 ? columnOrder : ['name', ...visibleColumns];
    const allSelected = data.length > 0 && data.every(d => selectedIds.has(d.id));
    const isIndeterminate = data.some(d => selectedIds.has(d.id)) && !allSelected;

    // Grid Template Builder
    const getGridTemplate = () => {
        const checkW = 40;
        const actionsW = 80;
        const dynamicW = activeColumns.map(colId => {
            const def = AVAILABLE_COLUMNS.find(c => c.id === colId) || { width: 100 };
            return `${columnWidths[colId] || def.width || 120}px`;
        }).join(' ');
        return `${checkW}px ${actionsW}px ${dynamicW}`;
    };

    return (
        <>
            <div className={`flex-1 flex flex-col relative overflow-hidden ${isDark ? 'bg-slate-950' : 'bg-slate-50'
                }`}>
                <div ref={tableContainerRef} className="overflow-x-auto flex-1 custom-scrollbar relative">
                    <div className="min-w-max flex flex-col gap-1 pb-4">
                        {/* HEADER */}
                        <div
                            className={`sticky top-0 z-30 grid items-center gap-0 border-b shadow-lg backdrop-blur-xl ${isDark ? 'bg-slate-950/90 border-slate-800 text-slate-300' : 'bg-slate-50/90 border-slate-200 text-slate-600'}`}
                            style={{ gridTemplateColumns: getGridTemplate() }}
                        >
                            {/* Checkbox Header */}
                            <div className={`sticky left-0 z-40 h-full flex items-center justify-center border-r ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                <input
                                    type="checkbox"
                                    checked={allSelected}
                                    ref={input => { if (input) input.indeterminate = isIndeterminate; }}
                                    onChange={handleSelectAll}
                                    className="rounded border-slate-600 bg-slate-800 text-purple-500 focus:ring-purple-500 cursor-pointer"
                                />
                            </div>

                            {/* Actions Header */}
                            <div className={`sticky left-[40px] z-40 h-full flex items-center justify-center font-bold text-[10px] uppercase tracking-wider border-r ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                Actions
                            </div>

                            {/* Dynamic Headers */}
                            {activeColumns.map(colId => {
                                const def = AVAILABLE_COLUMNS.find(c => c.id === colId) || { label: colId, width: 100 };
                                const width = columnWidths[colId] || def.width || 120;
                                const isDraggingOver = dragOver === colId;

                                return (
                                    <div
                                        key={colId}
                                        className={`relative h-full flex items-center px-4 py-3 group cursor-pointer select-none border-r last:border-0 transition-colors ${isDark ? 'border-slate-800 hover:bg-white/5' : 'border-slate-200 hover:bg-black/5'} ${isDraggingOver ? 'bg-purple-500/20' : ''}`}
                                        draggable
                                        onDragStart={(e) => onDragStart(e, colId)}
                                        onDragOver={(e) => onDragOver(e, colId)}
                                        onDrop={(e) => onDrop(e, colId)}
                                        onClick={() => onSort && onSort(colId)}
                                    >
                                        <div className="flex items-center justify-between w-full text-[10px] font-black uppercase tracking-wider">
                                            <span className={`truncate flex items-center gap-1 ${sortConfig?.key === colId ? 'text-purple-500' : ''}`}>
                                                {def.label}
                                                {sortConfig?.key === colId && (
                                                    sortConfig.direction === 'asc' ? <ChevronUp size={10} /> : <ChevronDown size={10} />
                                                )}
                                            </span>
                                        </div>
                                        {/* RESIZER */}
                                        <div
                                            className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-purple-500/50 transition-colors z-50"
                                            onMouseDown={(e) => startResize(e, colId, width)}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </div>
                                );
                            })}
                        </div>

                        {/* BODY */}
                        {isLoading ? (
                            // FANCY SKELETON LOADER
                            Array.from({ length: 12 }).map((_, i) => (
                                <div key={i} className={`grid items-center gap-0 border-b last:border-0 ${isDark ? 'border-slate-800/50' : 'border-slate-100'} animate-pulse`} style={{ gridTemplateColumns: getGridTemplate() }}>
                                    <div className={`h-10 border-r ${isDark ? 'border-slate-800' : 'border-slate-100'} bg-slate-800/20`}></div>
                                    <div className={`h-10 border-r ${isDark ? 'border-slate-800' : 'border-slate-100'} bg-slate-800/20`}></div>
                                    <div className={`h-10 border-r ${isDark ? 'border-slate-800' : 'border-slate-100'} px-3 py-2 flex items-center`}><div className="h-3 w-32 rounded bg-slate-500/10"></div></div>
                                    {activeColumns.slice(1).map((_, j) => (
                                        <div key={j} className={`h-10 border-r ${isDark ? 'border-slate-800' : 'border-slate-100'} px-3 py-2 flex items-center`}><div className="h-3 w-16 rounded bg-slate-500/10"></div></div>
                                    ))}
                                </div>
                            ))
                        ) : data.length === 0 ? (
                            <div className="p-8 text-center text-slate-500">No {currentLevel.toLowerCase()}s found.</div>
                        ) : (
                            data.map((item) => (
                                <AdsTableRow
                                    key={item.id}
                                    item={item}
                                    isSelected={selectedIds.has(item.id)}
                                    onToggleSelection={toggleSelection}
                                    currentLevel={currentLevel}
                                    activeColumns={activeColumns}
                                    gridTemplate={getGridTemplate()}
                                    isDark={isDark}
                                    onEdit={handleEdit}
                                    onDrillDown={handleDrillDown}
                                    onViewInsights={setActiveInsightsItem}
                                    onActionMenu={handleActionClick}
                                    isMenuOpen={menuState?.id === item.id}
                                />
                            ))
                        )}
                        {/* LOAD MORE */}
                        {!isLoading && (data.length > 0) && hasMore && (
                            <button
                                onClick={onLoadMore}
                                className={`mt-2 w-full py-3 flex items-center justify-center gap-2 text-sm font-medium transition-all rounded-lg border border-dashed ${isDark
                                    ? 'bg-slate-900/50 border-slate-700 hover:bg-slate-800 text-slate-400 hover:text-white'
                                    : 'bg-slate-50 border-slate-300 hover:bg-slate-100 text-slate-500 hover:text-slate-900'
                                    }`}
                            >
                                Load More <ChevronDown size={14} />
                            </button>
                        )}
                    </div>
                </div>

                {/* FOOTER SUMMARY */}
                <div className={`border-t p-3 flex justify-between items-center text-xs ${isDark ? 'border-slate-800 bg-slate-950 text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-500'
                    }`}>
                    <span>{data.length} items</span>
                    <span>{selectedIds.size} selected</span>
                </div>
            </div>

            {/* EDITOR DRAWER */}
            <EditorDrawer
                isOpen={isEditorOpen}
                onClose={() => setIsEditorOpen(false)}
                editItem={editItem}
                level={currentLevel}
            />

            {/* INSIGHTS DRAWER */}
            {activeInsightsItem && (
                <InsightsDrawer
                    isOpen={!!activeInsightsItem}
                    onClose={() => setActiveInsightsItem(null)}
                    itemName={activeInsightsItem.name}
                    itemId={activeInsightsItem.id}
                />
            )}

            {/* ACTIONS MENU PORTAL */}
            {menuState && (
                <DropdownPortal
                    isOpen={true}
                    position={{ top: menuState.top, left: menuState.left }}
                    onClose={() => setMenuState(null)}
                >
                    <div className="py-1">
                        <button
                            onClick={() => {
                                duplicateEntity(menuState.id, token);
                                setMenuState(null);
                            }}
                            className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${isDark ? 'text-slate-300 hover:bg-slate-800 hover:text-white' : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                                }`}
                        >
                            <Copy size={14} /> Duplicate
                        </button>
                        <button
                            onClick={() => {
                                if (confirm('Are you sure you want to delete?')) {
                                    deleteEntity(menuState.id, token);
                                    setMenuState(null);
                                }
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-rose-500 hover:bg-rose-500/10 flex items-center gap-2"
                        >
                            <Trash2 size={14} /> Delete
                        </button>
                    </div>
                </DropdownPortal>
            )}
        </>
    );
};
