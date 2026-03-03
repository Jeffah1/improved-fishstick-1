
'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/db';
import { StoreSettings } from '@/types';
import { 
  Settings, 
  Globe, 
  Zap, 
  Shield, 
  Save, 
  RefreshCw, 
  Check, 
  AlertTriangle,
  Link2,
  ExternalLink,
  Smartphone,
  Bell,
  Database,
  Eye
} from 'lucide-react';
import { motion } from 'motion/react';

interface GeneralSettingsProps {
  storeId: string;
}

const GeneralSettings: React.FC<GeneralSettingsProps> = ({ storeId }) => {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      const data = await db.getStoreSettings(storeId);
      setSettings(data);
      setLoading(false);
    };
    loadSettings();
  }, [storeId]);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    await db.saveStoreSettings(settings);
    setSaving(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-12 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Settings className="text-blue-600" /> Store Settings
          </h2>
          <p className="text-slate-500">Configure your store connection and automation preferences.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 disabled:opacity-50"
        >
          {saving ? <RefreshCw className="animate-spin" size={18} /> : (showSuccess ? <Check size={18} /> : <Save size={18} />)}
          {saving ? 'Saving...' : (showSuccess ? 'Saved!' : 'Save Changes')}
        </button>
      </div>

      {/* Store Information */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 ml-1">
          <Globe size={16} className="text-slate-400" />
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Store Information</h3>
        </div>
        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Store Display Name</label>
            <input 
              type="text" 
              value={settings.storeName}
              onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
              className="w-full bg-slate-50 border-0 rounded-2xl p-4 text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Shopify Domain</label>
            <div className="relative">
              <input 
                type="text" 
                value={settings.domain}
                onChange={(e) => setSettings({ ...settings, domain: e.target.value })}
                className="w-full bg-slate-50 border-0 rounded-2xl p-4 text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 transition-all pr-12"
              />
              <ExternalLink size={18} className="absolute right-4 top-4 text-slate-300" />
            </div>
          </div>
        </div>
      </section>

      {/* Automation & Features */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 ml-1">
          <Zap size={16} className="text-slate-400" />
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Automation & Features</h3>
        </div>
        <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-10 space-y-8">
            {/* Toggle Item */}
            <div className="flex items-center justify-between group">
              <div className="flex items-center gap-6">
                <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl group-hover:scale-110 transition-transform">
                  <Bell size={24} />
                </div>
                <div>
                  <h4 className="font-black text-slate-900">Real-time Webhooks</h4>
                  <p className="text-sm text-slate-500">Sync orders and products instantly as they happen.</p>
                </div>
              </div>
              <button 
                onClick={() => setSettings({ ...settings, webhooksEnabled: !settings.webhooksEnabled })}
                className={`w-14 h-8 rounded-full transition-all relative ${settings.webhooksEnabled ? 'bg-blue-600' : 'bg-slate-200'}`}
              >
                <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${settings.webhooksEnabled ? 'left-7' : 'left-1'}`}></div>
              </button>
            </div>

            <div className="h-px bg-slate-50"></div>

            <div className="flex items-center justify-between group">
              <div className="flex items-center gap-6">
                <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:scale-110 transition-transform">
                  <Eye size={24} />
                </div>
                <div>
                  <h4 className="font-black text-slate-900">Price Scraping</h4>
                  <p className="text-sm text-slate-500">Automatically track competitor prices daily.</p>
                </div>
              </div>
              <button 
                onClick={() => setSettings({ ...settings, priceScrapingEnabled: !settings.priceScrapingEnabled })}
                className={`w-14 h-8 rounded-full transition-all relative ${settings.priceScrapingEnabled ? 'bg-blue-600' : 'bg-slate-200'}`}
              >
                <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${settings.priceScrapingEnabled ? 'left-7' : 'left-1'}`}></div>
              </button>
            </div>

            <div className="h-px bg-slate-50"></div>

            <div className="flex items-center justify-between group">
              <div className="flex items-center gap-6">
                <div className="p-4 bg-purple-50 text-purple-600 rounded-2xl group-hover:scale-110 transition-transform">
                  <Database size={24} />
                </div>
                <div>
                  <h4 className="font-black text-slate-900">AI Weekly Reports</h4>
                  <p className="text-sm text-slate-500">Receive deep-dive profit analysis in your inbox.</p>
                </div>
              </div>
              <button 
                onClick={() => setSettings({ ...settings, aiReportsEnabled: !settings.aiReportsEnabled })}
                className={`w-14 h-8 rounded-full transition-all relative ${settings.aiReportsEnabled ? 'bg-blue-600' : 'bg-slate-200'}`}
              >
                <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${settings.aiReportsEnabled ? 'left-7' : 'left-1'}`}></div>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* API Connections */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 ml-1">
          <Link2 size={16} className="text-slate-400" />
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">API Connections</h3>
        </div>
        <div className="bg-slate-900 p-10 rounded-[3rem] text-white space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center p-3">
                <img src="https://cdn.worldvectorlogo.com/logos/shopify.svg" alt="Shopify" className="w-full h-full object-contain" />
              </div>
              <div>
                <h4 className="font-black text-xl">Shopify Connection</h4>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Connected & Active</span>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-black uppercase tracking-widest transition-all">Test Connection</button>
              <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl text-xs font-black uppercase tracking-widest transition-all">Sync Now</button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 border-t border-white/10">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Last Sync</p>
              <p className="text-sm font-bold">Today, 10:45 AM</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">API Version</p>
              <p className="text-sm font-bold">2024-04 (Latest)</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Webhook Status</p>
              <p className="text-sm font-bold text-emerald-500">Healthy (12/12)</p>
            </div>
          </div>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 ml-1">
          <AlertTriangle size={16} className="text-red-400" />
          <h3 className="text-xs font-black uppercase tracking-widest text-red-400">Danger Zone</h3>
        </div>
        <div className="bg-red-50 border border-red-100 p-10 rounded-[3rem] flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h4 className="font-black text-red-900">Disconnect Store</h4>
            <p className="text-sm text-red-600/70">This will stop all data syncing and delete your store configuration.</p>
          </div>
          <button className="px-8 py-4 bg-red-600 text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-xl shadow-red-500/20">
            Disconnect Shopify
          </button>
        </div>
      </section>
    </div>
  );
};

export default GeneralSettings;
