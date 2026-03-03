
'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/db';
import { Order } from '@/types';
import { 
  ShoppingBag, 
  Search, 
  Filter, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  TrendingUp, 
  CreditCard, 
  Truck, 
  FileText,
  Calendar,
  DollarSign,
  RefreshCw,
  Eye
} from 'lucide-react';

const OrdersList: React.FC<{ storeId: string }> = ({ storeId }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  const [filters, setFilters] = useState({
    dateStart: '',
    dateEnd: '',
    minProfit: '',
    maxProfit: ''
  });

  const limit = 10;

  const loadOrders = async () => {
    setLoading(true);
    const options: any = {
      search,
      status,
      page,
      limit
    };

    if (filters.dateStart && filters.dateEnd) {
      options.dateRange = { start: filters.dateStart, end: filters.dateEnd };
    }

    if (filters.minProfit || filters.maxProfit) {
      options.profitRange = { 
        min: parseFloat(filters.minProfit) || -Infinity, 
        max: parseFloat(filters.maxProfit) || Infinity 
      };
    }

    const result = await db.getOrders(storeId, options);
    setOrders(result.orders);
    setTotal(result.total);
    setLoading(false);
  };

  useEffect(() => {
    loadOrders();
  }, [storeId, page, status, search]);

  const handleSync = async () => {
    setSyncing(true);
    await db.syncShopifyOrders(storeId);
    await loadOrders();
    setSyncing(false);
  };

  const exportCSV = () => {
    const headers = ['Order ID', 'Date', 'Customer', 'Email', 'Total', 'Profit', 'Status'];
    const rows = orders.map(o => [
      o.shopifyOrderId,
      new Date(o.createdAt).toLocaleDateString(),
      o.customerName,
      o.customerEmail,
      (o.totalPrice || 0).toFixed(2),
      (o.netProfit || 0).toFixed(2),
      o.status
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `orders_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Historical Orders</h2>
          <p className="text-slate-500">Analyze every transaction and track net profitability across your store.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-5 py-3 rounded-2xl text-sm font-bold hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50"
          >
            <RefreshCw size={18} className={syncing ? 'animate-spin' : ''} /> 
            {syncing ? 'Syncing...' : 'Sync Shopify'}
          </button>
          <button 
            onClick={exportCSV}
            className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl text-sm font-bold hover:bg-black transition-all shadow-xl shadow-slate-200"
          >
            <Download size={18} /> Export CSV
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by ID, name, or email..." 
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Status:</span>
            <select 
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="bg-slate-50 border-none rounded-xl ring-1 ring-slate-200 px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="fulfilled">Fulfilled</option>
              <option value="unfulfilled">Unfulfilled</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <button 
            onClick={() => loadOrders()}
            className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
          >
            <Filter size={18} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-slate-50">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Start Date</label>
            <input 
              type="date" 
              value={filters.dateStart}
              onChange={e => setFilters({...filters, dateStart: e.target.value})}
              className="w-full p-3 bg-slate-50 rounded-xl ring-1 ring-slate-200 text-sm outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">End Date</label>
            <input 
              type="date" 
              value={filters.dateEnd}
              onChange={e => setFilters({...filters, dateEnd: e.target.value})}
              className="w-full p-3 bg-slate-50 rounded-xl ring-1 ring-slate-200 text-sm outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Min Profit ($)</label>
            <input 
              type="number" 
              placeholder="0.00"
              value={filters.minProfit}
              onChange={e => setFilters({...filters, minProfit: e.target.value})}
              className="w-full p-3 bg-slate-50 rounded-xl ring-1 ring-slate-200 text-sm outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Max Profit ($)</label>
            <input 
              type="number" 
              placeholder="1000.00"
              value={filters.maxProfit}
              onChange={e => setFilters({...filters, maxProfit: e.target.value})}
              className="w-full p-3 bg-slate-50 rounded-xl ring-1 ring-slate-200 text-sm outline-none"
            />
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Order ID</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Price</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Net Profit</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-8 py-20 text-center">
                    <RefreshCw className="animate-spin mx-auto text-slate-300 mb-4" size={32} />
                    <p className="text-slate-400 font-bold">Loading your orders...</p>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-8 py-20 text-center">
                    <ShoppingBag className="mx-auto text-slate-200 mb-4" size={48} />
                    <p className="text-slate-400 font-bold">No orders found matching your criteria.</p>
                  </td>
                </tr>
              ) : orders.map(o => (
                <tr 
                  key={o.id} 
                  onClick={() => setSelectedOrder(o)}
                  className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                >
                  <td className="px-8 py-6">
                    <p className="text-sm font-mono font-black text-blue-600 uppercase">{o.shopifyOrderId}</p>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-sm text-slate-500">{new Date(o.createdAt).toLocaleDateString()}</p>
                    <p className="text-[10px] text-slate-400">{new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-sm font-black text-slate-900">{o.customerName}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{o.customerEmail}</p>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-sm font-black text-slate-900">${(o.totalPrice || 0).toFixed(2)}</p>
                  </td>
                  <td className="px-8 py-6">
                    <div className={`flex items-center gap-1 font-black text-sm ${(o.netProfit || 0) > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      <TrendingUp size={14} className={(o.netProfit || 0) < 0 ? 'rotate-180' : ''} />
                      ${(o.netProfit || 0).toFixed(2)}
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
                      {((o.netProfit || 0) / (o.totalPrice || 1) * 100).toFixed(1)}% Margin
                    </p>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      o.status === 'fulfilled' ? 'bg-green-50 text-green-600' : 
                      o.status === 'unfulfilled' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'
                    }`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button className="p-2 text-slate-400 group-hover:text-blue-600 group-hover:bg-blue-50 rounded-xl transition-all">
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-6 bg-slate-50/50 border-t border-slate-50 flex items-center justify-between">
          <p className="text-xs font-bold text-slate-500">
            Showing <span className="text-slate-900">{(page - 1) * limit + 1}</span> to <span className="text-slate-900">{Math.min(page * limit, total)}</span> of <span className="text-slate-900">{total}</span> orders
          </p>
          <div className="flex items-center gap-2">
            <button 
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-all"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="flex items-center gap-1">
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                const p = i + 1;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-10 h-10 rounded-xl text-xs font-black transition-all ${
                      page === p ? 'bg-slate-900 text-white shadow-lg' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
            <button 
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-all"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setSelectedOrder(null)}></div>
          <div className="relative bg-white rounded-[3rem] p-10 max-w-3xl w-full shadow-2xl animate-in zoom-in duration-300 max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setSelectedOrder(null)} 
              className="absolute top-8 right-8 p-2 text-slate-400 hover:text-slate-900 rounded-full hover:bg-slate-100 transition-all"
            >
              <X size={24} />
            </button>
            
            <div className="flex items-center gap-4 mb-8">
              <div className="p-4 bg-blue-600 text-white rounded-3xl shadow-lg shadow-blue-500/20">
                <FileText size={32} />
              </div>
              <div>
                <h3 className="text-3xl font-black text-slate-900 tracking-tight">Order {selectedOrder.shopifyOrderId}</h3>
                <p className="text-slate-500">Placed on {new Date(selectedOrder.createdAt).toLocaleString()}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="bg-slate-50 p-6 rounded-3xl space-y-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <CreditCard size={14} /> Customer Information
                </h4>
                <div>
                  <p className="text-lg font-black text-slate-900">{selectedOrder.customerName}</p>
                  <p className="text-sm text-slate-500">{selectedOrder.customerEmail}</p>
                </div>
                <div className="pt-4 border-t border-slate-200">
                  <p className="text-xs font-bold text-slate-400 uppercase">Status</p>
                  <span className={`inline-block mt-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    selectedOrder.status === 'fulfilled' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {selectedOrder.status}
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-3xl space-y-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <TrendingUp size={14} /> Profit Breakdown
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Total Revenue</span>
                    <span className="font-black text-slate-900">${(selectedOrder.totalPrice || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Product Cost</span>
                    <span className="font-bold text-red-600">-${(selectedOrder.productCost || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Shipping Cost</span>
                    <span className="font-bold text-red-600">-${(selectedOrder.shippingCost || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Transaction Fees</span>
                    <span className="font-bold text-red-600">-${(selectedOrder.transactionFee || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Taxes</span>
                    <span className="font-bold text-red-600">-${(selectedOrder.tax || 0).toFixed(2)}</span>
                  </div>
                  <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                    <span className="text-sm font-black text-slate-900">Net Profit</span>
                    <span className={`text-xl font-black ${(selectedOrder.netProfit || 0) > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      ${(selectedOrder.netProfit || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 ml-1">
                <ShoppingBag size={14} /> Order Items
              </h4>
              <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Product</th>
                      <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Qty</th>
                      <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {(selectedOrder.items || []).map((item, i) => (
                      <tr key={i}>
                        <td className="px-6 py-4 text-sm font-bold text-slate-900">{item.name}</td>
                        <td className="px-6 py-4 text-sm text-slate-500 text-center">{item.quantity}</td>
                        <td className="px-6 py-4 text-sm font-black text-slate-900 text-right">${(item.price || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-8 flex gap-4">
              <button className="flex-1 py-4 bg-slate-100 text-slate-600 font-black uppercase tracking-widest rounded-2xl hover:bg-slate-200 transition-all flex items-center justify-center gap-2">
                <Truck size={18} /> Manage Shipping
              </button>
              <button className="flex-1 py-4 bg-slate-900 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-black transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-200">
                <DollarSign size={18} /> Issue Refund
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersList;
