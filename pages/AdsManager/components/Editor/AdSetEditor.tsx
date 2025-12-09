import React from 'react';
import { AdSet } from '../../../../types';
import { AdSetForm } from '../Shared/AdSetForm';

interface AdSetEditorProps {
    data: Partial<AdSet>;
    onChange: (updates: Partial<AdSet>) => void;
    token: string;
    accountId: string;
}

export const AdSetEditor: React.FC<AdSetEditorProps> = ({ data, onChange, token, accountId }) => {
    return (
        <AdSetForm
            data={data}
            onChange={onChange}
            token={token}
            accountId={accountId}
            // In the drawer, we might show reach differently or not at all if not requested,
            // but let's wire it up for console/future use.
            onReachUpdate={(reach) => console.log('AdSetEditor Reach Estimate:', reach)}
        />
    );
};
