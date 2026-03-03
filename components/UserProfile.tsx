
'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/db';
import { User, UserSession, SecurityActivity } from '@/types';
import { 
  User as UserIcon, 
  Mail, 
  Shield, 
  Key, 
  Smartphone, 
  LogOut, 
  Camera, 
  Check, 
  RefreshCw,
  MapPin,
  Clock,
  Globe,
  Monitor,
  AlertCircle,
  CreditCard,
  ChevronRight,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface UserProfileProps {
  user: User;
  onLogout: () => void;
  onUpdateUser: (user: User) => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ user, onLogout, onUpdateUser }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'billing'>('profile');
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email,
    avatarUrl: user.avatarUrl || ''
  });
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [activity, setActivity] = useState<SecurityActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadSecurityData = async () => {
      const [sessData, actData] = await Promise.all([
        db.getSessions(user.id),
        db.getSecurityActivity(user.id)
      ]);
      setSessions(sessData);
      setActivity(actData);
      setLoading(false);
    };
    loadSecurityData();
  }, [user.id]);

  const handleSaveProfile = async () => {
    setSaving(true);
    // Mock update
    const updatedUser = { ...user, ...formData };
    onUpdateUser(updatedUser);
    setSaving(false);
    setEditing(false);
  };

  return (
    <div className="max-w-6xl mx-auto pb-20">
      {/* Profile Header */}
      <div className="relative mb-12">
        <div className="h-48 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-[3rem] overflow-hidden">
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        </div>
        <div className="absolute -bottom-12 left-12 flex items-end gap-8">
          <div className="relative group">
            <div className="w-32 h-32 rounded-[2.5rem] bg-white p-2 shadow-2xl">
              <img 
                src={user.avatarUrl || `https://ui-avatars.com/api/?name=${user.name || user.email}&background=random`} 
                alt="Avatar" 
                className="w-full h-full rounded-[2rem] object-cover"
              />
            </div>
            <button className="absolute bottom-0 right-0 p-3 bg-slate-900 text-white rounded-2xl shadow-xl hover:scale-110 transition-transform">
              <Camera size={18} />
            </button>
          </div>
          <div className="pb-4 space-y-1">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">{user.name || 'User'}</h2>
            <p className="text-slate-500 font-medium">{user.email}</p>
          </div>
        </div>
        <div className="absolute -bottom-12 right-12 pb-4">
          <button 
            onClick={onLogout}
            className="flex items-center gap-2 px-6 py-3 bg-white text-red-600 font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-slate-200 hover:bg-red-50 transition-all"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-4 mb-10 mt-20">
        {[
          { id: 'profile', label: 'Personal Info', icon: UserIcon },
          { id: 'security', label: 'Security', icon: Shield },
          { id: 'billing', label: 'Billing & Plan', icon: CreditCard }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-8 py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all ${
              activeTab === tab.id 
                ? 'bg-slate-900 text-white shadow-xl shadow-slate-200' 
                : 'bg-white text-slate-400 hover:text-slate-600'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Main Content */}
        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            {activeTab === 'profile' && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-10"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black text-slate-900">Personal Information</h3>
                  {!editing ? (
                    <button 
                      onClick={() => setEditing(true)}
                      className="text-blue-600 font-black uppercase tracking-widest text-xs hover:text-blue-700"
                    >
                      Edit Profile
                    </button>
                  ) : (
                    <div className="flex gap-4">
                      <button 
                        onClick={() => setEditing(false)}
                        className="text-slate-400 font-black uppercase tracking-widest text-xs"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={handleSaveProfile}
                        className="text-blue-600 font-black uppercase tracking-widest text-xs"
                      >
                        Save Changes
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Full Name</label>
                    <div className="relative">
                      <UserIcon className="absolute left-4 top-4 text-slate-300" size={18} />
                      <input 
                        type="text" 
                        disabled={!editing}
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full bg-slate-50 border-0 rounded-2xl p-4 pl-12 text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-60"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-4 text-slate-300" size={18} />
                      <input 
                        type="email" 
                        disabled={!editing}
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full bg-slate-50 border-0 rounded-2xl p-4 pl-12 text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-60"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-10 border-t border-slate-50 space-y-6">
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Account Status</h4>
                  <div className="flex items-center gap-4">
                    <div className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                      {user.status}
                    </div>
                    <p className="text-xs text-slate-400">Member since {new Date(user.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'security' && (
              <motion.div
                key="security"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                {/* Password Section */}
                <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl">
                        <Key size={24} />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-slate-900">Password</h3>
                        <p className="text-sm text-slate-500">Last changed 2 months ago</p>
                      </div>
                    </div>
                    <button className="px-6 py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all">Change Password</button>
                  </div>
                </div>

                {/* 2FA Section */}
                <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-4 bg-purple-50 text-purple-600 rounded-2xl">
                        <Smartphone size={24} />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-slate-900">Two-Factor Authentication</h3>
                        <p className="text-sm text-slate-500">Add an extra layer of security to your account.</p>
                      </div>
                    </div>
                    <button className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                      user.twoFactorEnabled ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-600 text-white'
                    }`}>
                      {user.twoFactorEnabled ? 'Enabled' : 'Enable 2FA'}
                    </button>
                  </div>
                </div>

                {/* Active Sessions */}
                <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
                  <h3 className="text-xl font-black text-slate-900">Active Sessions</h3>
                  <div className="space-y-6">
                    {sessions.map(session => (
                      <div key={session.id} className="flex items-center justify-between group">
                        <div className="flex items-center gap-6">
                          <div className="p-4 bg-slate-50 text-slate-400 rounded-2xl group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                            <Monitor size={24} />
                          </div>
                          <div>
                            <h4 className="font-black text-slate-900">{session.device}</h4>
                            <div className="flex items-center gap-3 text-xs text-slate-400">
                              <span className="flex items-center gap-1"><Globe size={12} /> {session.ip}</span>
                              <span className="flex items-center gap-1"><MapPin size={12} /> {session.location}</span>
                            </div>
                          </div>
                        </div>
                        <button className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:text-red-600">Revoke</button>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'billing' && (
              <motion.div
                key="billing"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                {/* Current Plan */}
                <div className="bg-slate-900 p-10 rounded-[3rem] text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-10 opacity-10">
                    <CreditCard size={120} />
                  </div>
                  <div className="relative z-10 space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Current Plan</p>
                        <h3 className="text-3xl font-black text-blue-400 uppercase tracking-tight">{user.plan}</h3>
                      </div>
                      <button className="px-8 py-4 bg-white text-slate-900 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-blue-50 transition-all">Upgrade Plan</button>
                    </div>
                    <div className="h-px bg-white/10"></div>
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-slate-400">Next billing date: <span className="text-white font-bold">May 12, 2024</span></p>
                      <button className="text-xs font-black text-blue-400 uppercase tracking-widest flex items-center gap-1">Manage Subscription <ChevronRight size={14} /></button>
                    </div>
                  </div>
                </div>

                {/* Payment Methods */}
                <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-black text-slate-900">Payment Methods</h3>
                    <button className="text-blue-600 font-black uppercase tracking-widest text-xs">+ Add New</button>
                  </div>
                  <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-10 bg-white rounded-lg border border-slate-200 flex items-center justify-center p-2">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="w-full h-full object-contain" />
                      </div>
                      <div>
                        <p className="font-black text-slate-900">Visa ending in 4242</p>
                        <p className="text-xs text-slate-400 uppercase tracking-widest">Expires 12/26</p>
                      </div>
                    </div>
                    <div className="px-4 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest">Default</div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar Activity */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
            <div className="flex items-center gap-2">
              <Activity size={18} className="text-slate-400" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Security Activity</h3>
            </div>
            <div className="space-y-6">
              {activity.map(act => (
                <div key={act.id} className="flex gap-4 items-start pb-6 border-b border-slate-50 last:border-0 last:pb-0">
                  <div className={`p-2 rounded-xl ${
                    act.type === 'login' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
                  }`}>
                    {act.type === 'login' ? <LogOut size={16} className="rotate-180" /> : <Shield size={16} />}
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-900 capitalize">{act.type.replace('_', ' ')}</p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <span className="flex items-center gap-1"><Clock size={10} /> {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span>•</span>
                      <span>{act.ip}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full py-4 bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-100 transition-all">View Full Log</button>
          </div>

          {/* Advanced Mode */}
          <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Advanced Mode</h4>
              <button className="w-12 h-6 bg-slate-200 rounded-full relative">
                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full"></div>
              </button>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Enable developer features, API key management, and raw data exports.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
