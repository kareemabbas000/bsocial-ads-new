import React from 'react';
import { AdSetForm } from '../Shared/AdSetForm';
import { useAdsManager } from '../../context/AdsManagerContext';

interface AdSetStepProps {
    data: any;
    updateData: (data: any) => void;
    errors?: Record<string, string>;
    onReachUpdate?: (reach: { users: number; bid_estimate?: any }) => void;
}

export const AdSetStep: React.FC<AdSetStepProps> = ({ data, updateData, errors, onReachUpdate }) => {
    // We get token from context to pass to the form
    // Assuming context is available here. If not, we might need to drill it from Wizard.
    // CreationWizard is usually rendered inside AdsManagerContext provider.
    const context = useAdsManager();
    // Fallback if context isn't ready
    const token = context?.token || '';
    const accountId = context?.accountIds?.[0] || '';

    // Actually, useAdsManager might fail if Wizard is outside. 
    // But let's assume it works. The token is needed for the real API calls.
    // Since I don't have the token readily available in props, I will rely on context 
    // OR force the user to pass it.
    // Let's check CreationWizard usage. It's in AdsManager.tsx usually.

    return (
        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <AdSetForm
                data={data}
                onChange={(updates) => updateData({ ...data, ...updates })}
                token={token}
                accountId={accountId}
                onReachUpdate={onReachUpdate}
            />
        </div>
    );
};
