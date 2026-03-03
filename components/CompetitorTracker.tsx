'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  ExternalLink, 
  RefreshCw, 
  AlertCircle, 
  DollarSign, 
  ShieldAlert, 
  TrendingDown, 
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  Info,
  History,
  BarChart3,
  ChevronRight,
  Globe
} from 'lucide-react';
import { GoogleGenAI, Type } from '@google/genai';
import { User, CompetitorPrice, PriceAlert, Product } from '@/types';
import { db } from '@/lib/db';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend,
  AreaChart,
  Area
} from 'recharts';

interface CompetitorTrackerProps {
  user: User;
}

const CompetitorTracker: React.FC<CompetitorTrackerProps> = ({ user }) => {
  const [query, setQuery] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [thresholdPercent, setThresholdPercent] = useState('10');
  const [thresholdFloor, setThresholdFloor] = useState('');
  const [scanResults, setScanResults] = useState<{
    competitors: any[];
    recommendation: string;
    analysis: string;
  } | null>(null);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);

  useEffect(() => {
    const loadData = async () => {
      if (user.storeId) {
        const prods = await db.getProducts(user.storeId);
        setProducts(prods);
        if (prods.length > 0) setSelectedProductId(prods[0].id);
        
        const existingAlerts = await db.getPriceAlerts(user.storeId);
        setAlerts(existingAlerts);
      }
    };
    loadData();
  }, [user.storeId]);

  useEffect(() => {
    const loadHistory = async () => {
      if (selectedProductId) {
        const prices = await db.getCompetitorPrices(selectedProductId);
        // Transform for chart
        const groupedByDate: Record<string, any> = {};
        const product = products.find(p => p.id === selectedProductId);
        
        prices.forEach(p => {
          const date = new Date(p.timestamp).toLocaleDateString();
          if (!groupedByDate[date]) {
            groupedByDate[date] = { date, ourPrice: product?.price || 0 };
          }
          groupedByDate[date][p.competitorName] = p.price;
        });
        
        setHistoryData(Object.values(groupedByDate).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
      }
    };
    loadHistory();
  }, [selectedProductId, products]);

  const handleResearch = async () => {
    if (!query || !selectedProductId) return;
    setLoading(true);
    setScanResults(null);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || '' });
      const product = products.find(p => p.id === selectedProductId);
      
      const prompt = `Research current market prices for: ${query}. 
      Our current price is $${product?.price}. 
      
      Analyze competitor listings and return a structured JSON response.
      Include:
      1. A list of competitors with their name, price, URL, and stock status.
      2. A concise market analysis.
      3. A specific pricing recommendation.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              competitors: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    price: { type: Type.NUMBER },
                    url: { type: Type.STRING },
                    stockStatus: { type: Type.STRING },
                    currency: { type: Type.STRING }
                  },
                  required: ['name', 'price', 'url']
                }
              },
              analysis: { type: Type.STRING },
              recommendation: { type: Type.STRING }
            },
            required: ['competitors', 'analysis', 'recommendation']
          }
        },
      });

      const data = JSON.parse(response.text || '{}');
      setScanResults(data);

      // Save to DB and check for alerts
      for (const comp of data.competitors) {
        const savedPrice = await db.saveCompetitorPrice({
          storeId: user.storeId!,
          productId: selectedProductId,
          competitorName: comp.name,
          price: comp.price,
          url: comp.url,
          currency: comp.currency || 'USD',
          stockStatus: comp.stockStatus || 'In Stock',
          timestamp: new Date().toISOString()
        });

        // Check alerts
        const diff = (product?.price || 0) - comp.price;
        const perc = ((product?.price || 0) - comp.price) / (product?.price || 1) * 100;

        let triggered = false;
        let type: 'percent' | 'floor' = 'percent';

        if (perc >= parseFloat(thresholdPercent)) {
          triggered = true;
          type = 'percent';
        } else if (thresholdFloor && comp.price < parseFloat(thresholdFloor)) {
          triggered = true;
          type = 'floor';
        }

        if (triggered) {
          const newAlert = await db.savePriceAlert({
            storeId: user.storeId!,
            productId: selectedProductId,
            competitorName: comp.name,
            competitorPrice: comp.price,
            ourPrice: product?.price || 0,
            difference: diff,
            percentage: perc,
            thresholdType: type,
            timestamp: new Date().toISOString(),
            read: false
          });
          setAlerts(prev => [newAlert, ...prev]);
        }
      }

      // Refresh history
      const prices = await db.getCompetitorPrices(selectedProductId);
      const groupedByDate: Record<string, any> = {};
      prices.forEach(p => {
        const date = new Date(p.timestamp).toLocaleDateString();
        if (!groupedByDate[date]) {
          groupedByDate[date] = { date, ourPrice: product?.price || 0 };
        }
        groupedByDate[date][p.competitorName] = p.price;
      });
      setHistoryData(Object.values(groupedByDate).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));

    } catch (error) {
      console.error(error);
      alert('Error fetching market data.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Globe className="text-blue-600" /> Price Intelligence
          </h2>
          <p className="text-slate-500">Monitor competitor pricing automatically with AI & Google Search.</p>
        </div>
        <div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-full border border-green-100">
          <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
          <span className="text-[10px] font-black text-green-600 uppercase tracking-widest">Auto-Scan Active (6h)</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Configuration Panel */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
            <div className="space-y-4">
              <label className="block">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">1. Select Product</span>
                <select 
                  value={selectedProductId} 
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full p-4 bg-slate-50 border-none rounded-2xl ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-slate-700"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (${p.price})</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">2. Search Query</span>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Product name for search..." 
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                  />
                </div>
              </label>

              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Alert %</span>
                  <div className="relative">
                    <TrendingDown className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      type="number" 
                      value={thresholdPercent}
                      onChange={(e) => setThresholdPercent(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-xl ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-bold"
                    />
                  </div>
                </label>
                <label className="block">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Floor $</span>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      type="number" 
                      value={thresholdFloor}
                      onChange={(e) => setThresholdFloor(e.target.value)}
                      placeholder="None"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-xl ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-bold"
                    />
                  </div>
                </label>
              </div>

              <button 
                onClick={handleResearch} 
                disabled={loading} 
                className="w-full bg-slate-900 hover:bg-black disabled:bg-slate-400 text-white font-bold py-5 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl active:scale-95"
              >
                {loading ? <RefreshCw className="animate-spin" size={20} /> : <BarChart3 size={20} />}
                {loading ? "Scanning Market..." : "Run Intelligence Scan"}
              </button>
            </div>
          </div>

          {/* Critical Alerts Sidebar */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
              <ShieldAlert size={20} className="text-red-600" /> Recent Alerts
            </h3>
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
              {alerts.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  <CheckCircle2 size={32} className="mx-auto mb-2 opacity-20" />
                  <p className="text-xs">No price alerts triggered.</p>
                </div>
              ) : (
                alerts.map(alert => (
                  <div key={alert.id} className="bg-red-50 p-4 rounded-2xl border border-red-100 space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">Underpriced</span>
                      <span className="text-[10px] text-slate-400 font-bold">{new Date(alert.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-xs font-bold text-slate-700">
                      {alert.competitorName} is selling at <span className="text-red-600">${alert.competitorPrice}</span>
                    </p>
                    <p className="text-[10px] text-slate-500">
                      That&apos;s {(alert.percentage || 0).toFixed(1)}% below your price of ${alert.ourPrice}.
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-8 space-y-8">
          {/* Chart Section */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <History size={20} className="text-blue-600" /> Price History
              </h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                  <span className="text-[10px] font-black text-slate-400 uppercase">Our Price</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-slate-300 rounded-full"></div>
                  <span className="text-[10px] font-black text-slate-400 uppercase">Competitors</span>
                </div>
              </div>
            </div>
            
            <div className="h-80 w-full">
              {historyData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={historyData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="date" fontSize={10} axisLine={false} tickLine={false} />
                    <YAxis fontSize={10} axisLine={false} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Line type="monotone" dataKey="ourPrice" stroke="#2563eb" strokeWidth={3} dot={{ r: 4, fill: '#2563eb' }} />
                    {Object.keys(historyData[0] || {}).filter(k => k !== 'date' && k !== 'ourPrice').map((k, i) => (
                      <Line key={k} type="monotone" dataKey={k} stroke="#cbd5e1" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-4">
                  <BarChart3 size={48} className="opacity-20" />
                  <p className="text-sm font-bold">Run a scan to see price history</p>
                </div>
              )}
            </div>
          </div>

          {/* Scan Results */}
          {scanResults && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
              {/* Recommendation Card */}
              <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <ShieldAlert size={120} />
                </div>
                <div className="relative z-10 space-y-4">
                  <div className="flex items-center gap-2 bg-blue-600/20 text-blue-400 px-3 py-1 rounded-full w-fit">
                    <Info size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">AI Recommendation</span>
                  </div>
                  <h3 className="text-2xl font-black tracking-tight">{scanResults.recommendation}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed max-w-2xl">{scanResults.analysis}</p>
                </div>
              </div>

              {/* Competitors Table */}
              <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                  <h3 className="text-lg font-black text-slate-900">Market Listings</h3>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{scanResults.competitors.length} Sources Found</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50/50">
                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Competitor</th>
                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Price</th>
                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Difference</th>
                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {scanResults.competitors.map((comp, idx) => {
                        const product = products.find(p => p.id === selectedProductId);
                        const diff = (product?.price || 0) - comp.price;
                        const isUnder = diff > 0;
                        
                        return (
                          <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-8 py-6">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                                  <Globe size={16} />
                                </div>
                                <span className="text-sm font-bold text-slate-700">{comp.name}</span>
                              </div>
                            </td>
                            <td className="px-8 py-6">
                              <span className="text-sm font-black text-slate-900">${comp.price}</span>
                            </td>
                            <td className="px-8 py-6">
                              <div className={`flex items-center gap-1 text-xs font-bold ${isUnder ? 'text-red-600' : 'text-green-600'}`}>
                                {isUnder ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
                                {isUnder ? '-' : '+'}${Math.abs(diff).toFixed(2)}
                              </div>
                            </td>
                            <td className="px-8 py-6">
                              <span className={`text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest ${
                                comp.stockStatus?.toLowerCase().includes('out') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
                              }`}>
                                {comp.stockStatus || 'In Stock'}
                              </span>
                            </td>
                            <td className="px-8 py-6">
                              <a 
                                href={comp.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-700 transition-colors"
                              >
                                <ExternalLink size={18} />
                              </a>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {!scanResults && !loading && (
            <div className="bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200 p-20 text-center space-y-6">
              <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center mx-auto shadow-sm text-slate-200">
                <Globe size={40} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-300">Market Intelligence Ready</h3>
                <p className="text-slate-400 text-sm max-w-xs mx-auto">Select a product and run a scan to analyze competitor pricing across the web.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompetitorTracker;
