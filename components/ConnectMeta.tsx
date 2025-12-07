
import React, { useState } from 'react';
import { ArrowRight, AlertCircle } from 'lucide-react';
import { fetchAdAccounts } from '../services/metaService';
import { AdAccount } from '../types';

interface ConnectMetaProps {
  onConnect: (token: string, accountId: string) => void;
}

const ConnectMeta: React.FC<ConnectMetaProps> = ({ onConnect }) => {
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<AdAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');

  const handleFetchAccounts = async () => {
    if (!token) {
      setError("Please enter a valid Access Token");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const adAccounts = await fetchAdAccounts(token);
      setAccounts(adAccounts);
      if (adAccounts.length > 0) {
        setSelectedAccount(adAccounts[0].id);
      } else {
        setError("No Ad Accounts found for this user.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to validate token.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = () => {
    if (token && selectedAccount) {
      onConnect(token, selectedAccount);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-600/10 rounded-full blur-[120px]"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-800/10 rounded-full blur-[120px]"></div>
        </div>

      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 z-10">
        
        {/* Left: Info */}
        <div className="space-y-6 flex flex-col justify-center">
          <div className="flex items-center space-x-3 mb-2">
             {/* BSocial Logo */}
             <img 
               src="https://vslsjgfhwknxjhtxlhhk.supabase.co/storage/v1/object/public/logos/Logo%20Bsocial%20Icon%20new.png" 
               alt="BSocial Logo"
               className="w-12 h-12 rounded-full object-contain bg-slate-900 border border-white/10 shadow-lg shadow-blue-500/30"
             />
             <span className="text-2xl font-bold text-white tracking-wide">BSOCIAL</span>
          </div>
          <div>
            <h2 className="text-4xl font-bold bg-gradient-to-r from-brand-400 to-blue-300 bg-clip-text text-transparent">
              Power Your Growth.
            </h2>
          </div>
          <p className="text-slate-400 text-lg">
            BSocial ADHub connects directly to the Meta Marketing API to analyze your campaigns using AI. Actionable insights for data-driven decisions.
          </p>
        </div>

        {/* Right: Form */}
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl">
          <h3 className="text-xl font-semibold text-white mb-6">Setup Connection</h3>
          
          {error && (
            <div className="bg-red-900/20 border border-red-800 text-red-200 p-3 rounded-lg flex items-center space-x-2 mb-4 text-sm">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {!accounts.length ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">
                  Meta User Access Token
                </label>
                <input 
                  type="password" 
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="EAA..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                />
              </div>

              <button 
                onClick={handleFetchAccounts}
                disabled={isLoading || !token}
                className="w-full bg-brand-600 hover:bg-brand-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-all flex items-center justify-center"
              >
                {isLoading ? 'Verifying...' : 'Verify Token & Fetch Accounts'}
              </button>
            </div>
          ) : (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">
                  Select Ad Account
                </label>
                <select 
                  value={selectedAccount}
                  onChange={(e) => setSelectedAccount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                >
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.id}) - {acc.currency}
                    </option>
                  ))}
                </select>
              </div>
              
              <button 
                onClick={handleSubmit}
                className="w-full bg-green-600 hover:bg-green-500 text-white font-semibold py-3 rounded-lg transition-all flex items-center justify-center space-x-2"
              >
                <span>Launch ADHub</span>
                <ArrowRight size={18} />
              </button>
              
              <button 
                onClick={() => setAccounts([])}
                className="w-full text-slate-500 text-sm hover:text-slate-300"
              >
                Back to Token
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConnectMeta;
