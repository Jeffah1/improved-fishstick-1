
'use client';

import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Check, 
  ShieldCheck, 
  Zap, 
  Loader2, 
  History, 
  Activity, 
  Download, 
  ExternalLink,
  AlertCircle,
  ArrowUpRight,
  Clock
} from 'lucide-react';
import { User, Invoice, UsageStats, PaymentMethod } from '@/types';
import { db } from '@/lib/db';

interface BillingProps {
  user: User;
  onUpdatePlan: (u: User) => void;
}

const Billing: React.FC<BillingProps> = ({ user, onUpdatePlan }) => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'checkout' | 'success'>('idle');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const [invData, usageData, pmData] = await Promise.all([
        db.getInvoices(user.id),
        db.getUsage(user.id),
        db.getPaymentMethod(user.id)
      ]);
      setInvoices(invData);
      setUsage(usageData);
      setPaymentMethod(pmData);
    };
    fetchData();
  }, [user.id]);

  const handleUpgrade = async () => {
    setLoading(true);
    setStatus('checkout');
    
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          email: user.email,
          priceId: 'price_pro_monthly' // Example ID
        })
      });
      
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        // Fallback for demo if Stripe keys not set
        setTimeout(async () => {
          await db.updateUserPlan(user.id, 'pro');
          const updatedUser = { ...user, plan: 'pro' as const };
          localStorage.setItem('sales_pro_session', JSON.stringify(updatedUser));
          onUpdatePlan(updatedUser);
          setStatus('success');
          setLoading(false);
        }, 2000);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      setLoading(false);
      setStatus('idle');
    }
  };

  const handleManageBilling = async () => {
    if (!user.stripeCustomerId) {
      alert("No active subscription found. Please upgrade first.");
      return;
    }
    
    try {
      const response = await fetch('/api/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: user.stripeCustomerId })
      });
      const data = await response.json();
      if (data.url) window.location.href = data.url;
    } catch (error) {
      console.error('Portal error:', error);
    }
  };

  if (status === 'success') {
    return (
      <div className="max-w-md mx-auto text-center space-y-6 py-20 animate-in fade-in zoom-in">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-green-500/10">
          <Check size={40} strokeWidth={3} />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-extrabold">Welcome to PRO</h2>
          <p className="text-slate-500">Your account has been upgraded. All advanced features are now unlocked.</p>
        </div>
        <button 
          onClick={() => setStatus('idle')}
          className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-xl transition-all active:scale-95"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  if (status === 'checkout') {
    return (
      <div className="max-w-md mx-auto text-center space-y-8 py-20">
        <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto" />
        <div>
          <h2 className="text-2xl font-bold">Connecting to Stripe</h2>
          <p className="text-slate-500 mt-2">Please wait while we set up your secure checkout session.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Billing & Subscription</h2>
          <p className="text-slate-500">Manage your plan, usage, and payment methods.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleManageBilling}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
          >
            <ExternalLink size={16} /> Stripe Portal
          </button>
          {user.plan === 'free' && (
            <button 
              onClick={handleUpgrade}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
            >
              <Zap size={16} fill="currentColor" /> Upgrade to Pro
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Current Plan Card */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl ${user.plan === 'pro' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Current Plan</p>
                  <h3 className="text-xl font-black text-slate-900 uppercase">{user.plan} Edition</h3>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-slate-900">{user.plan === 'pro' ? '$49' : '$0'}<span className="text-sm text-slate-400 font-bold">/mo</span></p>
                <span className="text-[10px] font-black bg-green-100 text-green-600 px-2 py-0.5 rounded-full uppercase">Active</span>
              </div>
            </div>
            <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase">Billing Cycle</p>
                <p className="font-bold text-slate-700">Monthly</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase">Next Invoice</p>
                <p className="font-bold text-slate-700 flex items-center gap-2">
                  <Clock size={14} className="text-blue-500" /> March 24, 2026
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase">Payment Method</p>
                {paymentMethod ? (
                  <p className="font-bold text-slate-700 flex items-center gap-2">
                    <CreditCard size={14} className="text-slate-400" /> 
                    <span className="capitalize">{paymentMethod.brand}</span> •••• {paymentMethod.last4}
                  </p>
                ) : (
                  <p className="font-bold text-slate-400 italic text-sm">No card on file</p>
                )}
              </div>
            </div>
          </div>

          {/* Usage Section */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <Activity className="text-blue-600" size={24} />
                <h3 className="text-xl font-bold text-slate-900">Usage Metrics</h3>
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Current Period</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <UsageCard 
                label="Orders Analyzed" 
                value={usage?.ordersAnalyzed || 0} 
                limit={user.plan === 'pro' ? 'Unlimited' : '1,000'} 
                percent={user.plan === 'pro' ? 15 : 85}
              />
              <UsageCard 
                label="Reports Generated" 
                value={usage?.reportsGenerated || 0} 
                limit={user.plan === 'pro' ? 'Unlimited' : '5'} 
                percent={user.plan === 'pro' ? 20 : 100}
                isCritical={user.plan === 'free' && (usage?.reportsGenerated || 0) >= 5}
              />
              <UsageCard 
                label="AI Tokens" 
                value={`${((usage?.aiTokensUsed || 0) / 1000).toFixed(1)}k`} 
                limit={user.plan === 'pro' ? '500k' : '10k'} 
                percent={user.plan === 'pro' ? 10 : 100}
                isCritical={user.plan === 'free'}
              />
            </div>
          </div>
        </div>

        {/* Sidebar: Billing History & Payment */}
        <div className="space-y-8">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <History size={18} className="text-blue-600" /> Billing History
            </h3>
            <div className="space-y-4">
              {invoices.map(inv => (
                <div key={inv.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <div>
                    <p className="text-sm font-bold text-slate-700">${(inv.amount || 0).toFixed(2)}</p>
                    <p className="text-[10px] text-slate-400 font-medium">{inv.date}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded-full uppercase">Paid</span>
                    <button className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors">
                      <Download size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 py-2 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
              View All Invoices
            </button>
          </div>

          <div className="bg-slate-900 rounded-3xl p-6 text-white relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-600/20 rounded-full blur-2xl group-hover:bg-blue-600/30 transition-all"></div>
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Zap size={18} className="text-blue-400" /> Pro Benefits
            </h3>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-2 text-xs text-slate-300">
                <Check size={12} className="text-blue-400" /> Priority AI Processing
              </li>
              <li className="flex items-center gap-2 text-xs text-slate-300">
                <Check size={12} className="text-blue-400" /> Unlimited Market Scans
              </li>
              <li className="flex items-center gap-2 text-xs text-slate-300">
                <Check size={12} className="text-blue-400" /> Custom Alert Thresholds
              </li>
            </ul>
            {user.plan === 'free' ? (
              <button 
                onClick={handleUpgrade}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2"
              >
                Upgrade Now <ArrowUpRight size={14} />
              </button>
            ) : (
              <div className="p-3 bg-slate-800 rounded-xl border border-slate-700 text-center">
                <p className="text-[10px] font-black text-blue-400 uppercase">You are on Pro</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const UsageCard = ({ label, value, limit, percent, isCritical }: { label: string, value: string | number, limit: string, percent: number, isCritical?: boolean }) => (
  <div className="space-y-3">
    <div className="flex justify-between items-end">
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-lg font-black text-slate-900">{value}</p>
      </div>
      <p className="text-[10px] font-bold text-slate-400">Limit: {limit}</p>
    </div>
    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
      <div 
        className={`h-full rounded-full transition-all duration-1000 ${isCritical ? 'bg-red-500' : 'bg-blue-600'}`} 
        style={{ width: `${Math.min(percent, 100)}%` }}
      />
    </div>
    {isCritical && (
      <p className="text-[10px] font-bold text-red-500 flex items-center gap-1">
        <AlertCircle size={10} /> Limit reached. Please upgrade.
      </p>
    )}
  </div>
);

export default Billing;
