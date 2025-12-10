import React, { useState } from 'react';
import { X, ArrowRight, ArrowLeft, Check, Zap, Users, MousePointer, Loader2 } from 'lucide-react';
import { CampaignStep } from './CampaignStep';
import { AdSetStep } from './AdSetStep';
import { AdStep } from './AdStep';
import { AdEntityDraft } from '../../../../types';
import { useAdsManager } from '../../context/AdsManagerContext';
import { useDrafts } from '../../context/DraftContext';

interface CreationWizardProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (draft: AdEntityDraft) => void;
}

const STEPS = [
    { id: 1, label: 'Campaign', desc: 'Objective & details' },
    { id: 2, label: 'Ad Set', desc: 'Audience & budget' },
    { id: 3, label: 'Ad', desc: 'Creative & format' }
];

export const CreationWizard: React.FC<CreationWizardProps> = ({ isOpen, onClose, onSave }) => {
    const { theme, accountIds, token } = useAdsManager();
    const { saveDraft, publishDraft } = useDrafts();
    const isDark = theme === 'dark';

    const [currentStep, setCurrentStep] = useState(1);
    const [isPublishing, setIsPublishing] = useState(false);
    const [reachEstimate, setReachEstimate] = useState<{ users: number; bid_estimate?: any } | null>(null);
    const [formData, setFormData] = useState<any>({
        campaign: {
            objective: 'OUTCOME_TRAFFIC',
            buying_type: 'AUCTION',
            special_ad_categories: ['NONE'],
        },
        adset: {
            targeting: { age_min: 18, age_max: 65, genders: [1, 2], geo_locations: { countries: ['US'] } },
            daily_budget: '2000', // $20.00
            billing_event: 'IMPRESSIONS',
            optimization_goal: 'REACH',
            bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
        },
        ad: {
            format: 'IMAGE',
            creative: {
                object_story_spec: {
                    page_id: '',
                    link_data: {
                        call_to_action: { type: 'LEARN_MORE', value: { link: '' } }
                    }
                }
            }
        }
    });
    const [errors, setErrors] = useState<any>({});

    const updateFormData = (stepKey: string, data: any) => {
        setFormData((prev: any) => ({
            ...prev,
            [stepKey]: { ...prev[stepKey], ...data }
        }));
    };

    if (!isOpen) return null;

    const handleNext = () => {
        if (currentStep < STEPS.length) setCurrentStep(c => c + 1);
    };

    const handleBack = () => {
        if (currentStep > 1) setCurrentStep(c => c - 1);
    };

    const handleSaveDraft = async () => {
        // Save to Drafts
        await saveDraft('CAMPAIGN', formData);
        onSave(formData); // Optional: Callback for parent
        onClose();
    };

    const handleFinish = async () => {
        setIsPublishing(true);
        try {
            // Save as draft first, then publish
            const draftId = await saveDraft('CAMPAIGN', formData);

            // Publish using first selected account
            const accountId = accountIds.length > 0 ? accountIds[0] : '';
            if (!accountId) throw new Error("No ad account selected");

            const success = await publishDraft(draftId, token, accountId);

            if (success) {
                onSave(formData);
                onClose();
            } else {
                console.error("Publish failed");
                // TODO: Show Error Toast (handled by global error boundary or toast provider normally)
            }
        } catch (e) {
            console.error("Critical publish error", e);
        } finally {
            setIsPublishing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm md:p-4 animate-in fade-in duration-200">
            {/* MODAL CONTAINER */}
            <div className={`
                w-full h-full md:max-w-4xl md:h-[80vh] md:max-h-[700px]
                md:rounded-2xl shadow-2xl md:border flex flex-col overflow-hidden 
                transition-all duration-300 transform
                ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}
            `}>
                {/* HEADER */}
                <div className={`
                    flex-shrink-0 h-14 px-4 border-b flex items-center justify-between
                    ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-100 bg-white'}
                `}>
                    <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-lg ${isDark ? 'bg-gradient-to-br from-blue-600 to-indigo-600' : 'bg-blue-600'}`}>
                            <Zap size={18} className="text-white" fill="currentColor" />
                        </div>
                        <div>
                            <h2 className={`font-bold text-base leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                Create Campaign
                            </h2>
                            <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                AI-Powered Setup
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className={`p-1.5 rounded-full transition-colors ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* PROGRESS BAR (Mobile) */}
                <div className={`md:hidden px-4 py-3 border-b ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-100 bg-slate-50'}`}>
                    <div className="flex justify-between text-xs font-medium mb-2">
                        <span className={isDark ? 'text-blue-400' : 'text-blue-600'}>Step {currentStep} of {STEPS.length}</span>
                        <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>{STEPS[currentStep - 1].label}</span>
                    </div>
                    <div className={`h-1.5 w-full rounded-full ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                        <div
                            className="h-full bg-blue-600 rounded-full transition-all duration-300"
                            style={{ width: `${(currentStep / STEPS.length) * 100}%` }}
                        />
                    </div>
                </div>

                {/* MAIN CONTENT AREA */}
                <div className="flex-1 flex overflow-hidden relative">

                    {/* SIDEBAR (Desktop) */}
                    <div className={`
                        hidden md:flex w-56 flex-col border-r p-4 space-y-6
                        ${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-white'}
                    `}>
                        <div className="space-y-2">
                            {STEPS.map((step) => {
                                const isActive = currentStep === step.id;
                                const isCompleted = currentStep > step.id;

                                return (
                                    <div key={step.id} className="relative pl-3">
                                        {/* Connecting Line */}
                                        {step.id !== STEPS.length && (
                                            <div className={`absolute left-[18px] top-8 w-0.5 h-8 -ml-px ${isCompleted ? 'bg-blue-600' : isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />
                                        )}

                                        <button
                                            disabled={currentStep < step.id} // Allow going back
                                            onClick={() => currentStep > step.id && setCurrentStep(step.id)}
                                            className={`group flex items-center gap-3 w-full text-left transition-all ${isActive ? 'scale-105 origin-left' : ''
                                                }`}
                                        >
                                            <div className={`
                                                w-7 h-7 rounded-full flex items-center justify-center border-2 z-10 transition-colors
                                                ${isActive
                                                    ? 'border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                                                    : isCompleted
                                                        ? 'border-blue-600 bg-blue-600 text-white'
                                                        : isDark
                                                            ? 'border-slate-700 bg-slate-800 text-slate-500'
                                                            : 'border-slate-200 bg-white text-slate-300'
                                                }
                                            `}>
                                                {isCompleted ? <Check size={12} strokeWidth={3} /> : <span className="text-[10px] font-bold">{step.id}</span>}
                                            </div>
                                            <div>
                                                <p className={`text-xs font-semibold transition-colors ${isActive
                                                    ? (isDark ? 'text-white' : 'text-slate-900')
                                                    : isCompleted
                                                        ? (isDark ? 'text-slate-300' : 'text-slate-600')
                                                        : (isDark ? 'text-slate-500' : 'text-slate-400')
                                                    }`}>
                                                    {step.label}
                                                </p>
                                                <p className={`text-[9px] ${isActive
                                                    ? 'text-blue-500'
                                                    : (isDark ? 'text-slate-600' : 'text-slate-400')
                                                    }`}>
                                                    {step.desc}
                                                </p>
                                            </div>
                                        </button>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Estimated Daily Results (Desktop Sidebar) */}
                        {currentStep >= 2 && (
                            <div className={`
                                mt-auto p-3 rounded-lg border animate-in fade-in slide-in-from-bottom-4
                                ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}
                            `}>
                                <h4 className={`text-[10px] font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                    Estimated Daily Results
                                </h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <Users size={12} className={isDark ? 'text-slate-400' : 'text-slate-500'} />
                                            <span className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Reach</span>
                                        </div>
                                        <span className={`text-xs font-mono font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>12K - 34K</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <MousePointer size={12} className={isDark ? 'text-slate-400' : 'text-slate-500'} />
                                            <span className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Clicks</span>
                                        </div>
                                        <span className={`text-xs font-mono font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>240 - 580</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* STEPS CONTENT */}
                    <div className={`
                        flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6
                        ${isDark ? 'bg-slate-900' : 'bg-slate-50'}
                    `}>
                        {currentStep === 1 && (
                            <CampaignStep
                                data={formData.campaign}
                                updateData={(data) => updateFormData('campaign', data)}
                                errors={errors}
                            />
                        )}
                        {currentStep === 2 && (
                            <AdSetStep
                                data={formData.adset}
                                updateData={(data) => updateFormData('adset', data)}
                                errors={errors}
                                onReachUpdate={setReachEstimate}
                            />
                        )}
                        {currentStep === 3 && (
                            <AdStep
                                data={formData.ad}
                                updateData={(data) => updateFormData('ad', data)}
                                errors={errors}
                            />
                        )}
                    </div>
                </div>

                {/* FOOTER */}
                <div className={`
                    p-4 border-t flex justify-between items-center flex-shrink-0
                    ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-100 bg-white'}
                `}>
                    <button
                        onClick={handleBack}
                        disabled={currentStep === 1}
                        className={`
                            px-3 py-1.5 rounded-lg font-medium text-xs transition-colors
                            ${currentStep === 1
                                ? 'opacity-0 cursor-default'
                                : isDark
                                    ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                            }
                        `}
                    >
                        Back
                    </button>

                    <div className="flex gap-3">
                        <button
                            onClick={handleSaveDraft}
                            disabled={isPublishing}
                            className={`
                                px-4 py-2 rounded-lg font-medium text-xs transition-colors whitespace-nowrap
                                ${isDark
                                    ? 'text-slate-300 hover:bg-slate-800'
                                    : 'text-slate-600 hover:bg-slate-100'
                                }
                            `}
                        >
                            Save Draft
                        </button>
                        <button
                            onClick={currentStep === STEPS.length ? handleFinish : handleNext}
                            disabled={isPublishing}
                            className={`
                                bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-semibold text-xs shadow-lg shadow-blue-600/20 flex items-center gap-2 transform transition-all active:scale-95
                                ${isPublishing ? 'opacity-50 cursor-wait' : ''}
                            `}
                        >
                            {isPublishing ? (
                                <><Loader2 size={14} className="animate-spin" /> Publishing...</>
                            ) : (
                                currentStep === STEPS.length ? 'Publish Campaign' : <>Next <ArrowRight size={14} /></>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
