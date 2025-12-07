
import React, { useState } from 'react';
import { generateAdCopy } from '../services/aiService';
import { PenTool, Copy, Check } from 'lucide-react';
import { Theme } from '../types';

interface AILabProps {
  theme: Theme;
}

const AILab: React.FC<AILabProps> = ({ theme }) => {
  const [productDesc, setProductDesc] = useState('');
  const [objective, setObjective] = useState('CONVERSIONS');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!productDesc) return;
    setLoading(true);
    const copy = await generateAdCopy(productDesc, objective);
    setResult(copy || "Failed to generate copy.");
    setLoading(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Styles
  const cardBg = theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-sm';
  const headingColor = theme === 'dark' ? 'text-white' : 'text-slate-800';
  const labelColor = theme === 'dark' ? 'text-slate-300' : 'text-slate-600';
  const subTextColor = theme === 'dark' ? 'text-slate-400' : 'text-slate-500';
  const inputBg = theme === 'dark' ? 'bg-slate-900 border-slate-600 text-white' : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white';
  const resultContainerBg = theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm';
  const resultTextBg = theme === 'dark' ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-8rem)]">
      {/* Input Section */}
      <div className={`${cardBg} border rounded-xl p-6 flex flex-col`}>
        <div className="mb-6">
           <h2 className={`text-2xl font-bold flex items-center ${headingColor}`}>
            <PenTool className="mr-2 text-brand-400" />
            Ad Copy Generator
           </h2>
           <p className={`mt-2 ${subTextColor}`}>Describe your product and let Gemini create high-converting ad variants.</p>
        </div>

        <div className="space-y-4 flex-1">
          <div>
            <label className={`block text-sm font-medium mb-2 ${labelColor}`}>Campaign Objective</label>
            <select 
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              className={`w-full ${inputBg} border rounded-lg p-3 focus:ring-2 focus:ring-brand-500`}
            >
              <option value="CONVERSIONS">Sales / Conversions</option>
              <option value="TRAFFIC">Traffic / Clicks</option>
              <option value="AWARENESS">Brand Awareness</option>
              <option value="LEADS">Lead Generation</option>
            </select>
          </div>

          <div className="flex-1 flex flex-col h-full">
            <label className={`block text-sm font-medium mb-2 ${labelColor}`}>Product Description / Unique Selling Proposition</label>
            <textarea
              value={productDesc}
              onChange={(e) => setProductDesc(e.target.value)}
              placeholder="E.g. A premium ergonomic office chair that fixes posture within 30 days. Uses memory foam and breathable mesh. Target audience: Remote workers."
              className={`w-full flex-1 ${inputBg} border rounded-lg p-4 focus:ring-2 focus:ring-brand-500 resize-none`}
              style={{ minHeight: '200px' }}
            />
          </div>
        </div>

        <button 
          onClick={handleGenerate}
          disabled={loading || !productDesc}
          className="w-full mt-6 bg-gradient-to-r from-brand-600 to-blue-600 hover:from-brand-500 hover:to-blue-500 text-white font-bold py-4 rounded-lg transition-all shadow-lg"
        >
          {loading ? 'Generating Magic...' : 'Generate Ad Variants'}
        </button>
      </div>

      {/* Output Section */}
      <div className={`${resultContainerBg} border rounded-xl p-6 relative overflow-hidden flex flex-col`}>
        <div className="absolute top-0 right-0 p-4">
            {result && (
                <button 
                onClick={handleCopy}
                className={`flex items-center space-x-2 text-sm transition-colors px-3 py-1 rounded-md ${theme === 'dark' ? 'text-slate-400 hover:text-white bg-slate-800' : 'text-slate-500 hover:text-slate-900 bg-slate-100'}`}
                >
                {copied ? <Check size={14} className="text-green-400"/> : <Copy size={14} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
            )}
        </div>
        
        <h3 className={`text-lg font-semibold mb-4 ${headingColor}`}>Generated Creative</h3>
        
        <div className={`flex-1 rounded-lg p-6 border overflow-auto font-mono text-sm leading-relaxed whitespace-pre-wrap ${resultTextBg}`}>
            {loading ? (
                 <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-50">
                    <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                    <p>Gemini is writing copy...</p>
                 </div>
            ) : result ? (
                result
            ) : (
                <div className={`h-full flex items-center justify-center ${subTextColor}`}>
                    Result will appear here.
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default AILab;
