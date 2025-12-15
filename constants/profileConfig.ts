import { DollarSign, Heart, Briefcase, MessageCircle, LucideIcon } from 'lucide-react';

export interface ProfileConfigItem {
    label: string;
    icon: LucideIcon;
    cards: { id: string; label: string; format: 'currency' | 'number' | 'percent' | 'x'; suffix?: string; color: string; reverseColor?: boolean }[];
    mainChart: {
        bar: { key: string; color: string; name: string; axisLabel: string };
        line: { key: string; color: string; name: string; axisLabel: string };
        title: string;
    };
    secondary1: { key: string; color: string; title: string; axisLabel: string };
    secondary2: { key: string; color: string; title: string; axisLabel: string };
    funnel: string[];
    breakdownMetric: string;
}

export const PROFILE_CONFIG: Record<string, ProfileConfigItem> = {
    sales: {
        label: 'Sales Kit',
        icon: DollarSign,
        cards: [
            { id: 'spend', label: 'Total Spend', format: 'currency', color: '#0055ff' },
            { id: 'clicks', label: 'Clicks', format: 'number', color: '#8b5cf6' },
            { id: 'purchases', label: 'Purchases', format: 'number', color: '#10b981' },
            { id: 'roas', label: 'ROAS', format: 'x', color: '#10b981' }
        ],
        mainChart: {
            bar: { key: 'spend', color: '#0055ff', name: 'Spend', axisLabel: 'SPEND ($)' },
            line: { key: 'roas', color: '#10b981', name: 'ROAS', axisLabel: 'ROAS (x)' },
            title: 'Spend vs. ROAS Trend'
        },
        secondary1: { key: 'ctr', color: '#f59e0b', title: 'CTR Performance', axisLabel: 'CTR (%)' },
        secondary2: { key: 'clicks', color: '#8b5cf6', title: 'Daily Volume (Clicks)', axisLabel: 'CLICKS' },
        funnel: ['Impressions', 'Clicks', 'Link Clicks', 'Purchases'],
        breakdownMetric: 'spend'
    },
    engagement: {
        label: 'Engagement',
        icon: Heart,
        cards: [
            { id: 'spend', label: 'Total Spend', format: 'currency', color: '#64748b' },
            { id: 'reach', label: 'Reach', format: 'number', color: '#0055ff' },
            { id: 'impressions', label: 'Impressions', format: 'number', color: '#8b5cf6' },
            { id: 'post_engagement', label: 'Post Engagements', format: 'number', color: '#ec4899' }
        ],
        mainChart: {
            bar: { key: 'reach', color: '#0055ff', name: 'Reach', axisLabel: 'REACH' },
            line: { key: 'impressions', color: '#8b5cf6', name: 'Impressions', axisLabel: 'IMPRESSIONS' },
            title: 'Reach vs. Impressions Trend'
        },
        secondary1: { key: 'engagement_rate', color: '#ec4899', title: 'Engagement Rate', axisLabel: 'ENG. RATE (%)' },
        secondary2: { key: 'post_engagement', color: '#8b5cf6', title: 'Post Engagements', axisLabel: 'ENGAGEMENTS' },
        funnel: ['Impressions', 'Post Engagements', 'Clicks'],
        breakdownMetric: 'impressions'
    },
    leads: {
        label: 'Leads Gen',
        icon: Briefcase,
        cards: [
            { id: 'spend', label: 'Total Spend', format: 'currency', color: '#64748b' },
            { id: 'reach', label: 'Reach', format: 'number', color: '#0055ff' },
            { id: 'impressions', label: 'Impressions', format: 'number', color: '#8b5cf6' },
            { id: 'leads', label: 'Leads', format: 'number', color: '#10b981' }
        ],
        mainChart: {
            bar: { key: 'reach', color: '#0055ff', name: 'Reach', axisLabel: 'REACH' },
            line: { key: 'impressions', color: '#8b5cf6', name: 'Impressions', axisLabel: 'IMPRESSIONS' },
            title: 'Reach vs. Impressions Trend'
        },
        secondary1: { key: 'ctr', color: '#f59e0b', title: 'CTR Performance', axisLabel: 'CTR (%)' },
        secondary2: { key: 'leads', color: '#10b981', title: 'Lead Volume', axisLabel: 'LEADS' },
        funnel: ['Impressions', 'Clicks', 'Leads'],
        breakdownMetric: 'impressions'
    },
    messenger: {
        label: 'Messenger',
        icon: MessageCircle,
        cards: [
            { id: 'spend', label: 'Total Spend', format: 'currency', color: '#64748b' },
            { id: 'reach', label: 'Reach', format: 'number', color: '#0055ff' },
            { id: 'impressions', label: 'Impressions', format: 'number', color: '#8b5cf6' },
            { id: 'messaging_conversations', label: 'Conversations', format: 'number', color: '#0055ff' }
        ],
        mainChart: {
            bar: { key: 'reach', color: '#0055ff', name: 'Reach', axisLabel: 'REACH' },
            line: { key: 'impressions', color: '#8b5cf6', name: 'Impressions', axisLabel: 'IMPRESSIONS' },
            title: 'Reach vs. Impressions Trend'
        },
        secondary1: { key: 'ctr', color: '#f59e0b', title: 'CTR Performance', axisLabel: 'CTR (%)' },
        secondary2: { key: 'messaging_conversations', color: '#0055ff', title: 'Conversations Started', axisLabel: 'MSGS' },
        funnel: ['Impressions', 'Clicks', 'Conversations'],
        breakdownMetric: 'impressions'
    }
};
