
'use client';

import React, { useState } from 'react';
import { Store, ShoppingCart, FileSpreadsheet, Loader2, CheckCircle2, ChevronRight } from 'lucide-react';
import { db } from '@/lib/db';
import { User, Store as StoreType } from '@/types';

interface StoreSetupProps {
  user: User;
  onComplete: (user: User, store: StoreType) => void;
}

const StoreSetup: React.FC<StoreSetupProps> = ({ user, onComplete }) => {
  const [step, setStep] = useState(1);
  const [storeName, setStoreName] = useState('');
  const [platform, setPlatform] = useState<'shopify' | 'csv' | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleStartSync = async () => {
    if (!platform || !storeName) return;
    setIsSyncing(true);
    try {
      const store = await db.createStore(user.id, storeName, platform);
      await db.seedStoreData(store.id);
      
      const updatedUser = { ...user, storeId: store.id };
      localStorage.setItem('sales_pro_session', JSON.stringify(updatedUser));
      
      setTimeout(() => {
        onComplete(updatedUser, store);
      }, 1500);
    } catch (err) {
      alert("Failed to sync store");
      setIsSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-extrabold text-slate-900">Let&apos;s set up your store</h1>
          <p className="text-slate-500">Connecting your data takes less than 60 seconds.</p>
        </div>

        <div className="bg-white rounded-[2rem] shadow-xl p-10 space-y-8">
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 uppercase tracking-widest">Store Display Name</label>
                <input 
                  type="text" 
                  value={storeName}
                  onChange={e => setStoreName(e.target.value)}
                  className="w-full p-4 bg-slate-50 rounded-2xl ring-1 ring-slate-200 outline-none focus:ring-2 focus:ring-blue-500 text-xl font-medium"
                  placeholder="My Awesome Shop"
                />
              </div>
              <button 
                disabled={!storeName}
                onClick={() => setStep(2)}
                className="w-full bg-slate-900 text-white font-bold py-5 rounded-2xl flex items-center justify-center gap-2 disabled:opacity-50 transition-all shadow-xl"
              >
                Continue <ChevronRight size={20} />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button 
                  onClick={() => setPlatform('shopify')}
                  className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-4 text-center ${platform === 'shopify' ? 'border-blue-500 bg-blue-50' : 'border-slate-100 hover:border-slate-300'}`}
                >
                  <div className={`p-4 rounded-2xl ${platform === 'shopify' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                    <ShoppingCart size={32} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Shopify</h3>
                    <p className="text-xs text-slate-500">Auto-sync orders, products, and costs.</p>
                  </div>
                </button>
                <button 
                  onClick={() => setPlatform('csv')}
                  className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-4 text-center ${platform === 'csv' ? 'border-blue-500 bg-blue-50' : 'border-slate-100 hover:border-slate-300'}`}
                >
                  <div className={`p-4 rounded-2xl ${platform === 'csv' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                    <FileSpreadsheet size={32} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">CSV Upload</h3>
                    <p className="text-xs text-slate-500">Upload your exported sales history.</p>
                  </div>
                </button>
              </div>
              
              <button 
                disabled={!platform || isSyncing}
                onClick={handleStartSync}
                className="w-full bg-blue-600 text-white font-bold py-5 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-blue-500/20"
              >
                {isSyncing ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
                {isSyncing ? 'Syncing your data...' : 'Connect & Import'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoreSetup;
