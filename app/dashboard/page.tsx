'use client';
import Dashboard from '@/components/Dashboard';
import { useState, useEffect } from 'react';
import { User, AppTab } from '@/types';

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('sales_pro_session');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  if (!user) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8">
      <Dashboard user={user} onTabChange={(tab) => console.log('Tab changed to', tab)} />
    </div>
  );
}
