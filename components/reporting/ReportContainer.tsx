import React from 'react';

interface ReportContainerProps {
    children: React.ReactNode;
    refProp: React.RefObject<HTMLDivElement>;
    isDark: boolean;
    title: string;
    subtitle: string;
    dateRange: string;
}

export const ReportContainer: React.FC<ReportContainerProps> = ({ children, refProp, isDark, title, subtitle, dateRange }) => {
    return (
        <div className="flex justify-center w-full overflow-x-auto py-8 bg-slate-100 dark:bg-slate-950/50">
            {/* 1100px Fixed Width for PDF Consistency */}
            <div
                ref={refProp}
                style={{ width: '1100px', minWidth: '1100px' }}
                className={`relative flex flex-col p-12 shadow-2xl overflow-hidden ${isDark ? 'bg-slate-950 text-white' : 'bg-white text-slate-900'}`}
            >
                {/* SaaS Minimalist Background - Clean Slate/Matte + Mesh Gradient */}
                <div className={`absolute inset-0 pointer-events-none overflow-hidden rounded-xl border z-0 transition-colors duration-500
                    ${isDark ? 'bg-[#020617] border-slate-800' : 'bg-slate-100 border-slate-200'}`}
                    style={{
                        backgroundImage: isDark
                            ? `radial-gradient(circle at 100% 0%, rgba(59, 130, 246, 0.15) 0%, transparent 50%), 
                               radial-gradient(circle at 0% 100%, rgba(168, 85, 247, 0.15) 0%, transparent 50%)`
                            : `radial-gradient(circle at 100% 0%, rgba(59, 130, 246, 0.08) 0%, transparent 40%), 
                               radial-gradient(circle at 0% 100%, rgba(236, 72, 153, 0.08) 0%, transparent 40%),
                               radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.8) 0%, transparent 100%)`
                    }}
                >
                </div>

                {/* Elite Top Accent */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-90 z-20"></div>

                {/* 2. Micro-Grid Pattern Overlay (Modern Tech Feel) - Increased Opacity */}
                <div className="absolute inset-0 opacity-[0.05] pointer-events-none z-0"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%2364748b' fill-opacity='1' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='1'/%3E%3Ccircle cx='13' cy='13' r='1'/%3E%3C/g%3E%3C/svg%3E")` }}>
                </div>

                <div className="relative z-10">

                    {/* Header */}
                    {/* Header */}
                    {/* Header */}
                    <div className="flex justify-between items-start mb-12 pb-8 border-b border-slate-200 dark:border-white/5 relative">
                        <div>
                            <div className="flex items-center space-x-2 mb-4">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[9px] font-bold uppercase tracking-widest shadow-sm
                                    ${isDark ? 'bg-blue-950/30 text-blue-400 border-blue-900/50' : 'bg-blue-50 text-blue-600 border-blue-100'}
                                `}>
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse mr-2"></span>
                                    Confidential Report
                                </span>
                            </div>
                            <h1 className={`text-5xl font-black tracking-tighter mb-2 drop-shadow-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                {title}
                            </h1>
                            <p className={`text-lg font-medium tracking-wide ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                {subtitle}
                            </p>
                        </div>
                        <div className="text-right">
                            <div className={`text-[10px] font-bold uppercase tracking-widest mb-2 opacity-60 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                Reporting Period
                            </div>
                            <div className={`inline-flex items-center px-4 py-2 rounded-lg border text-sm font-bold font-mono shadow-sm
                                ${isDark ? 'bg-slate-900/50 border-white/10 text-slate-200' : 'bg-white border-slate-200 text-slate-700'}
                            `}>
                                <span className="mr-2 opacity-50">🗓</span>
                                {dateRange}
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                        {children}
                    </div>

                    {/* Footer */}
                    {/* Footer */}
                    <div className="mt-12 pt-8 border-t border-slate-200 dark:border-white/5 flex justify-between items-center text-[10px] font-medium tracking-wider uppercase text-slate-400">
                        <div className="flex items-center space-x-2">
                            <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-600 to-slate-400 dark:from-slate-200 dark:to-slate-400">
                                Generated by BSocial OS
                            </span>
                        </div>

                        <div className="flex items-center space-x-2 opacity-70">
                            <span>{new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
