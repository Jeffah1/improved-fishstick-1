
'use client';

import React, { useState } from 'react';
import { BarChart3, Mail, Lock, ArrowRight, Loader2, Key } from 'lucide-react';
import { db } from '@/lib/db';
import { User } from '@/types';

interface AuthProps {
  onLogin: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'reset') {
      setLoading(true);
      setTimeout(() => {
        setResetSent(true);
        setLoading(false);
      }, 1500);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const body = mode === 'login' 
        ? { email, password } 
        : { email, password, name: email.split('@')[0] };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      localStorage.setItem('sales_pro_session', JSON.stringify(data.user));
      onLogin(data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="bg-blue-600 p-2 rounded-xl">
            <BarChart3 className="text-white" size={32} />
          </div>
          <span className="text-2xl font-bold text-white tracking-tight">SalesInsights Pro</span>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-900">
              {mode === 'login' ? 'Welcome Back' : mode === 'signup' ? 'Create Account' : 'Reset Password'}
            </h1>
            <p className="text-slate-500 text-sm mt-2">
              {mode === 'reset' ? 'We will send a secure link to your email.' : 'The analytics OS for growing e-commerce stores.'}
            </p>
          </div>

          {resetSent ? (
            <div className="text-center py-6 space-y-4 animate-in zoom-in">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                <Key size={32} />
              </div>
              <p className="font-bold text-slate-900">Check your inbox!</p>
              <p className="text-slate-500 text-sm">If an account exists for {email}, you&apos;ll receive a recovery link shortly.</p>
              <button onClick={() => setMode('login')} className="text-blue-600 font-bold text-sm">Back to Login</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-xl border border-red-100">{error}</div>}
              
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="admin@startup.com" />
                </div>
              </div>

              {mode !== 'reset' && (
                <div className="space-y-1">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-xs font-bold text-slate-700">Password</label>
                    <button type="button" onClick={() => setMode('reset')} className="text-[10px] font-bold text-blue-600 hover:underline">Forgot Password?</button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="••••••••" />
                  </div>
                </div>
              )}

              <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg">
                {loading ? <Loader2 className="animate-spin" size={20} /> : (mode === 'login' ? 'Login to Dashboard' : mode === 'signup' ? 'Get Started' : 'Send Reset Link')}
                {!loading && <ArrowRight size={18} />}
              </button>
            </form>
          )}

          {!resetSent && (
            <div className="text-center pt-4">
              <button 
                onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                className="text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors"
              >
                {mode === 'login' ? "Don't have an account? Sign up" : "Already have an account? Login"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
