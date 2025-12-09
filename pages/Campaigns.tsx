import React from 'react';
import { AdsManager } from './AdsManager/AdsManager';
import { AccountHierarchy } from '../types';

// Compatible interface with App.tsx usage
interface CampaignsProps {
    token: string;
    accountIds: string[];
    datePreset: any;
    theme: any;
    filter: any;
    userConfig?: any;
    refreshInterval?: number;
    refreshTrigger?: number;
    hierarchy?: AccountHierarchy;
}

const Campaigns: React.FC<CampaignsProps> = (props) => {
    return (
        <div className="h-[calc(100vh-64px)] overflow-hidden">
            <AdsManager
                token={props.token}
                accountIds={props.accountIds}
                dateSelection={props.datePreset}
                filter={props.filter}
                refreshTrigger={props.refreshTrigger}
                hierarchy={props.hierarchy}
                theme={props.theme}
            />
        </div>
    );
};

export default Campaigns;