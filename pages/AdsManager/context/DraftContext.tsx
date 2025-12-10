import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createCampaign, createAdSet, createAd, createCreative } from '../../../services/metaService';

export type DraftStatus = 'DRAFT' | 'PUBLISHING' | 'PUBLISHED' | 'ERROR';

export interface DraftItem {
    id: string; // Internal UUID
    type: 'CAMPAIGN' | 'ADSET' | 'AD';
    name: string;
    data: any;
    status: DraftStatus;
    error?: string;
    createdAt: number;
    updatedAt: number;
}

interface DraftContextType {
    drafts: DraftItem[];
    saveDraft: (type: 'CAMPAIGN' | 'ADSET' | 'AD', data: any) => Promise<string>;
    publishDraft: (id: string, token: string, accountId: string) => Promise<boolean>;
    deleteDraft: (id: string) => void;
    clearDrafts: () => void;
}

const DraftContext = createContext<DraftContextType | undefined>(undefined);

export const DraftProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [drafts, setDrafts] = useState<DraftItem[]>(() => {
        // Load from local storage on init
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('ad_manager_drafts');
            try {
                return saved ? JSON.parse(saved) : [];
            } catch (e) {
                return [];
            }
        }
        return [];
    });

    // Auto-save to local storage
    useEffect(() => {
        localStorage.setItem('ad_manager_drafts', JSON.stringify(drafts));
    }, [drafts]);

    const saveDraft = async (type: 'CAMPAIGN' | 'ADSET' | 'AD', data: any): Promise<string> => {
        const id = crypto.randomUUID();
        const newDraft: DraftItem = {
            id,
            type,
            name: data.name || data.campaign?.name || data.adset?.name || 'Untitled Draft',
            data,
            status: 'DRAFT',
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        setDrafts(prev => [newDraft, ...prev]);
        return id;
    };

    const publishDraft = async (id: string, token: string, accountId: string): Promise<boolean> => {
        const draft = drafts.find(d => d.id === id);
        if (!draft) return false;

        // Optimistic Update
        setDrafts(prev => prev.map(d => d.id === id ? { ...d, status: 'PUBLISHING', error: undefined } : d));

        try {
            // EXECUTE PUBLISH BASED ON TYPE
            if (draft.type === 'CAMPAIGN') {
                // 1. Campaign
                const campRes = await createCampaign(accountId, draft.data.campaign, token);
                if (!campRes.id) throw new Error("Campaign creation failed");
                const campId = campRes.id;

                // 2. AdSet (if included in wizard data)
                if (draft.data.adset) {
                    const adSetData = { ...draft.data.adset, campaign_id: campId };
                    const adSetRes = await createAdSet(accountId, adSetData, token);
                    if (!adSetRes.id) throw new Error("Ad Set creation failed");
                    const adSetId = adSetRes.id;

                    // 3. Ad (if included)
                    if (draft.data.ad) {
                        // 3a. Creative
                        let creativeId = draft.data.ad.creative?.creative_id; // If selecting existing
                        if (!creativeId && draft.data.ad.creative) {
                            // Create new creative
                            const creativeRes = await createCreative(accountId, {
                                name: draft.data.ad.name + ' - Creative',
                                ...draft.data.ad.creative,
                            }, token);
                            creativeId = creativeRes.id;
                        }

                        const adData = {
                            ...draft.data.ad,
                            adset_id: adSetId,
                            creative: { id: creativeId } // Format expected by createAd
                        };

                        await createAd(accountId, adData, token);
                    }
                }
            }

            // Success
            setDrafts(prev => prev.map(d => d.id === id ? { ...d, status: 'PUBLISHED' } : d));

            // Clean up published drafts after short delay or keep them as history?
            // For now, keep as history.
            return true;

        } catch (e: any) {
            console.error("Publish Failed", e);
            setDrafts(prev => prev.map(d => d.id === id ? { ...d, status: 'ERROR', error: e.message } : d));
            return false;
        }
    };

    const deleteDraft = (id: string) => {
        setDrafts(prev => prev.filter(d => d.id !== id));
    };

    const clearDrafts = () => {
        setDrafts([]);
    };

    return (
        <DraftContext.Provider value={{ drafts, saveDraft, publishDraft, deleteDraft, clearDrafts }}>
            {children}
        </DraftContext.Provider>
    );
};

export const useDrafts = () => {
    const context = useContext(DraftContext);
    if (!context) throw new Error('useDrafts must be used within DraftProvider');
    return context;
};
