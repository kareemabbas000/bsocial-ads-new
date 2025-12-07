
import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { Theme } from '../types';

interface StatCardProps {
  label: string;
  value: string;
  trend?: number; // percentage
  prefix?: string;
  suffix?: string;
  sparklineData?: any[]; // Array of { value: number }
  dataKey?: string;
  color?: string;
  theme: Theme;
  reverseColor?: boolean; // If true, negative trend is Good (Green), positive is Bad (Red). e.g., CPA
}

const StatCard: React.FC<StatCardProps> = ({ 
  label, 
  value, 
  trend, 
  prefix = '', 
  suffix = '', 
  sparklineData,
  dataKey = 'value',
  color = '#0055ff',
  theme,
  reverseColor = false
}) => {
  const isPositiveMath = trend !== undefined && trend > 0;
  const isNeutral = !trend || trend === 0;

  // Determine sentiment color based on reverseColor logic
  // Standard: Up = Green, Down = Red
  // Reverse: Up = Red, Down = Green
  const isGood = reverseColor ? !isPositiveMath : isPositiveMath;

  // Fix: SVG IDs cannot contain spaces or special characters. 
  // We sanitize the label to ensure the gradient reference url(#id) works correctly in all browsers.
  // This fixes the issue where charts appeared black/grey in light mode.
  const gradientId = `grad-${label.replace(/[^a-zA-Z0-9]/g, '')}-${theme}`;

  return (
    <div className={`
      relative overflow-hidden rounded-xl border p-5 transition-all duration-300 group
      ${theme === 'dark' 
        ? 'bg-slate-900/50 border-slate-800 hover:border-slate-700 backdrop-blur-sm' 
        : 'bg-white border-slate-200 shadow-sm hover:border-brand-200 hover:shadow-md'
      }
    `}>
      <div className="flex justify-between items-start mb-2 relative z-10">
        <h3 className={`text-xs font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
          {label}
        </h3>
        {trend !== undefined && (
          <div className={`flex items-center space-x-1 text-xs font-bold px-2 py-0.5 rounded-full border ${
            isNeutral
                ? (theme === 'dark' ? 'text-slate-400 bg-slate-800 border-transparent' : 'text-slate-600 bg-slate-100 border-slate-200')
                : isGood
                    ? (theme === 'dark' ? 'text-emerald-400 bg-emerald-950/30 border-emerald-900/50' : 'text-emerald-700 bg-emerald-50 border-emerald-200')
                    : (theme === 'dark' ? 'text-rose-400 bg-rose-950/30 border-rose-900/50' : 'text-rose-700 bg-rose-50 border-rose-200')
          }`}>
            {isPositiveMath ? <TrendingUp size={10} /> : isNeutral ? <Minus size={10} /> : <TrendingDown size={10} />}
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
      
      <div className="flex items-end justify-between relative z-10">
        <div className={`text-3xl font-bold tracking-tight tabular-nums ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            {prefix}{value}{suffix}
        </div>
        
        {/* Sparkline Chart */}
        {sparklineData && sparklineData.length > 0 && (
            <div className="h-12 w-28 -mb-2 -mr-2 opacity-80 group-hover:opacity-100 transition-opacity relative">
                {/* Added debounce to fix width(-1) warnings */}
                <ResponsiveContainer width="100%" height="100%" debounce={50}>
                    <AreaChart data={sparklineData}>
                        <defs>
                            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={color} stopOpacity={theme === 'dark' ? 0.3 : 0.15}/>
                                <stop offset="95%" stopColor={color} stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <Area 
                            type="monotone" 
                            dataKey={dataKey} 
                            stroke={color} 
                            strokeWidth={2} 
                            fillOpacity={1} 
                            fill={`url(#${gradientId})`} 
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
