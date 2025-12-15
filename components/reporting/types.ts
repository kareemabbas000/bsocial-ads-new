import { DailyInsight, AdPerformance, Campaign } from '../../types';

export interface PDFComponentProps {
    data: any;
    isDark: boolean;
    styles: any;
}

export interface PDFChartProps {
    dailyData: DailyInsight[];
    isDark: boolean;
    activeConfig?: any; // To be typed more strictly if needed
}

export interface PDFFunnelProps {
    funnelData: { name: string; value: number; fill: string }[];
    isDark: boolean;
}

export interface PDFGridProps {
    items: any[];
    isDark: boolean;
}
