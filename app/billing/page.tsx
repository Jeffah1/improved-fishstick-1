'use client';
import Billing from '@/components/Billing';
import { useState, useEffect } from 'react';
import { User } from '@/types';

export default function BillingPage() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('sales_pro_session');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  if (!user) return <div>Loading...</div>;

  return (
    <div className="p-8">
      <Billing user={user} onUpdatePlan={setUser} />
    </div>
  );
}
