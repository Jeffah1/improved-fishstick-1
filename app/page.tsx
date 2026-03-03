"use client";

import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Settings as SettingsIcon, 
  BarChart3, 
  Zap, 
  ShieldCheck, 
  TrendingUp,
  Mic,
  Image as ImageIcon,
  CreditCard,
  LogOut,
  X,
  ShoppingCart,
  Package,
  Lock,
  CheckCircle,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Dashboard from '@/components/Dashboard';
import ArchitectSpec from '@/components/ArchitectSpec';
import CompetitorTracker from '@/components/CompetitorTracker';
import VoiceAssistant from '@/components/VoiceAssistant';
import MarketingGenerator from '@/components/MarketingGenerator';
import Auth from '@/components/Auth';
import StoreSetup from '@/components/StoreSetup';
import Billing from '@/components/Billing';
import AIRecommendations from '@/components/AIRecommendations';
import GeneralSettings from '@/components/GeneralSettings';
import UserProfile from '@/components/UserProfile';
import OrdersList from '@/components/OrdersList';
import ProductsList from '@/components/ProductsList';
import { AppTab, User, Store } from '@/types';
import { db } from '@/lib/db';

const ProGuard: React.FC<{ user: User, children: React.ReactNode, onUpgrade: () => void }> = ({ user, children, onUpgrade }) => {
  if (user.plan === 'pro') return <>{children}</>;
  return (
    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
      <div className="bg-slate-100 p-6 rounded-full mb-4 text-slate-400">
        <Lock size={48} />
      </div>
      <h3 className="text-2xl font-black text-slate-900 mb-2">Pro Feature Locked</h3>
      <p className="text-slate-500 mb-8 max-w-sm text-center">Unlock advanced analytics, market intelligence, and AI-driven insights by upgrading to Pro.</p>
      <button 
        onClick={onUpgrade}
        className="bg-blue-600 text-white font-bold px-8 py-3 rounded-xl shadow-lg shadow-blue-500/20 hover:scale-105 transition-all"
      >
        Upgrade Now
      </button>
    </div>
  );
};

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.DASHBOARD);
  const [loading, setLoading] = useState(true);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [appliedActions, setAppliedActions] = useState<string[]>([]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        const data = await response.json();
        if (data.user) {
          setUser(data.user);
          localStorage.setItem('sales_pro_session', JSON.stringify(data.user));
        } else {
          // If server says no session, clear local storage
          localStorage.removeItem('sales_pro_session');
          setUser(null);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        // Fallback to local storage if API fails
        const savedUser = localStorage.getItem('sales_pro_session');
        if (savedUser) setUser(JSON.parse(savedUser));
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout failed:', error);
    }
    localStorage.removeItem('sales_pro_session');
    setUser(null);
    setStore(null);
  };

  const handleApplyAction = (id: string, productId?: string, price?: number) => {
    setAppliedActions(prev => [...prev, id]);
    if (productId && price) {
      db.updateProductPrice(productId, price);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-bold text-blue-600">Loading SalesInsights Pro...</div>;

  if (!user) return <Auth onLogin={setUser} />;

  if (!user.storeId && !store) return <StoreSetup user={user} onComplete={(u, s) => { setUser(u); setStore(s); }} />;

  const navItems = [
    { id: AppTab.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
    { id: AppTab.RECOMMENDATIONS, label: 'AI Insights', icon: Sparkles },
    { id: AppTab.ORDERS, label: 'Orders', icon: ShoppingCart },
    { id: AppTab.PRODUCTS, label: 'Products', icon: Package },
    { id: AppTab.COMPETITORS, label: 'Market Intel', icon: TrendingUp },
    { id: AppTab.VOICE, label: 'Voice AI', icon: Mic },
    { id: AppTab.GENERATOR, label: 'Creatives', icon: ImageIcon },
    { id: AppTab.BILLING, label: 'Billing', icon: CreditCard },
    { id: AppTab.ARCHITECT, label: 'Architecture', icon: ShieldCheck },
  ];

  const handleUpgradeClick = () => setActiveTab(AppTab.BILLING);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6 flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab(AppTab.DASHBOARD)}>
          <div className="bg-blue-500 p-2 rounded-lg transition-transform hover:scale-110">
            <BarChart3 size={20} />
          </div>
          <span className="font-bold text-lg tracking-tight">SalesInsights Pro</span>
        </div>

        <nav className="flex-1 px-4 space-y-2 py-4">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === item.id 
                ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20' 
                : 'text-gray-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-2">
          <div 
            onClick={() => setActiveTab(AppTab.PROFILE)}
            className={`rounded-xl p-4 cursor-pointer transition-all ${activeTab === AppTab.PROFILE ? 'bg-blue-600/20 ring-1 ring-blue-500' : 'bg-slate-800 hover:bg-slate-750'}`}
          >
            <div className="flex justify-between items-center mb-1">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Plan</p>
              <span className="text-[10px] bg-blue-600 text-white px-1.5 rounded-full font-black uppercase">{user.plan}</span>
            </div>
            <p className="text-sm font-semibold truncate text-gray-200">{user.email}</p>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors font-bold"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto relative">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-black capitalize tracking-tight text-slate-900">{activeTab.replace('-', ' ')}</h1>
            <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-black rounded uppercase tracking-wider">MVP Stable</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setShowQuickActions(true)} className="text-gray-500 hover:text-blue-600 p-2 hover:bg-blue-50 rounded-lg transition-all relative">
              <Zap size={20} />
              {appliedActions.length === 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-blue-600 rounded-full animate-ping"></span>}
            </button>
            <button onClick={() => setActiveTab(AppTab.SETTINGS)} className={`p-2 rounded-lg transition-all ${activeTab === AppTab.SETTINGS ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}><SettingsIcon size={20} /></button>
            <div onClick={() => setActiveTab(AppTab.PROFILE)} className={`w-8 h-8 rounded-full cursor-pointer transition-all border-2 ${activeTab === AppTab.PROFILE ? 'border-blue-500 scale-110 shadow-lg' : 'border-slate-200 hover:border-gray-400'} bg-gradient-to-tr from-blue-500 to-indigo-600`}></div>
          </div>
        </header>

        <div className="p-8 pb-20">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === AppTab.DASHBOARD && <Dashboard user={user} onTabChange={setActiveTab} />}
              {activeTab === AppTab.RECOMMENDATIONS && <AIRecommendations storeId={user.storeId!} />}
              {activeTab === AppTab.ORDERS && <OrdersList storeId={user.storeId!} />}
              {activeTab === AppTab.PRODUCTS && <ProductsList storeId={user.storeId!} />}
              {activeTab === AppTab.COMPETITORS && (
                <ProGuard user={user} onUpgrade={handleUpgradeClick}>
                  <CompetitorTracker user={user} />
                </ProGuard>
              )}
              {activeTab === AppTab.VOICE && (
                <ProGuard user={user} onUpgrade={handleUpgradeClick}>
                  <VoiceAssistant user={user} />
                </ProGuard>
              )}
              {activeTab === AppTab.GENERATOR && (
                <ProGuard user={user} onUpgrade={handleUpgradeClick}>
                  <MarketingGenerator user={user} />
                </ProGuard>
              )}
              {activeTab === AppTab.BILLING && <Billing user={user} onUpdatePlan={setUser} />}
              {activeTab === AppTab.SETTINGS && <GeneralSettings storeId={user.storeId!} />}
              {activeTab === AppTab.PROFILE && <UserProfile user={user} onLogout={handleLogout} onUpdateUser={setUser} />}
              {activeTab === AppTab.ARCHITECT && <ArchitectSpec />}
            </motion.div>
          </AnimatePresence>
        </div>

        {showQuickActions && (
          <div className="fixed inset-0 z-[100] flex justify-end">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowQuickActions(false)}></div>
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="relative w-96 bg-white h-full shadow-2xl p-8 flex flex-col"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2"><Zap className="text-blue-600" size={24} /><h2 className="text-2xl font-black tracking-tight text-slate-900">Quick Insights</h2></div>
                <button onClick={() => setShowQuickActions(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"><X size={20} /></button>
              </div>
              <div className="flex-1 space-y-6 overflow-y-auto pr-2 scrollbar-hide">
                <QuickActionCard 
                  id="qa-1"
                  title="Pricing Optimization" 
                  desc="AI suggests increasing 'Premium Coffee Grinder' price to $134.99 based on competitor trends." 
                  tag="Growth" 
                  applied={appliedActions.includes('qa-1')}
                  onApply={() => handleApplyAction('qa-1', 'p1', 134.99)}
                />
                <QuickActionCard 
                  id="qa-2"
                  title="Inventory Warning" 
                  desc="Kettle stock will deplete in 4 days. Order restock (Min 20 units) to avoid stockout." 
                  tag="Urgent" 
                  color="red"
                  applied={appliedActions.includes('qa-2')}
                  onApply={() => handleApplyAction('qa-2')}
                />
                <QuickActionCard 
                  id="qa-3"
                  title="Discount Strategy" 
                  desc="Reduce 'Ceramic Pour Over' price to $21.99 to capture 15% more market share." 
                  tag="Strategy" 
                  color="amber"
                  applied={appliedActions.includes('qa-3')}
                  onApply={() => handleApplyAction('qa-3', 'p3', 21.99)}
                />
              </div>
              <button 
                onClick={() => setShowQuickActions(false)}
                className="mt-8 w-full bg-slate-900 text-white font-bold py-4 rounded-2xl shadow-xl active:scale-[0.98] transition-all"
              >
                Dismiss All
              </button>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
}

const QuickActionCard = ({ id, title, desc, tag, color = 'blue', applied, onApply }: any) => {
  const colors: any = {
    blue: 'bg-blue-100 text-blue-700',
    red: 'bg-red-100 text-red-700',
    amber: 'bg-amber-100 text-amber-700',
  };
  return (
    <div className={`p-6 rounded-[2rem] border border-gray-100 hover:border-blue-200 transition-all group relative ${applied ? 'opacity-50 grayscale bg-gray-50' : 'hover:shadow-lg'}`}>
      <div className="flex justify-between items-start mb-3">
        <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${colors[color]}`}>{tag}</span>
        {applied ? <CheckCircle className="text-green-500" size={18} /> : <Zap className="text-gray-300" size={16} />}
      </div>
      <h4 className="font-black text-slate-900 mb-2 leading-tight">{title}</h4>
      <p className="text-sm text-slate-500 leading-relaxed mb-4">{desc}</p>
      
      {!applied && (
        <button 
          onClick={onApply}
          className="w-full py-2.5 bg-slate-50 hover:bg-blue-600 hover:text-white text-slate-600 text-xs font-black rounded-xl transition-all uppercase tracking-widest border border-slate-100 hover:border-blue-600"
        >
          Apply Suggestion
        </button>
      )}
    </div>
  );
};
