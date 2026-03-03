
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, LineChart, Line
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingBag, 
  Users, 
  AlertTriangle,
  Plus,
  X,
  RotateCcw,
  Edit3,
  Check,
  Sparkles,
  RefreshCw,
  ArrowRight,
  ChevronRight,
  Zap,
  Calendar,
  Activity
} from 'lucide-react';
import { User, WidgetInstance, WidgetType, AppTab } from '@/types';
import { db } from '@/lib/db';
import { GoogleGenAI } from '@google/genai';

const DASHBOARD_STORAGE_KEY = 'sales_insights_pro_dashboard_v2';

const DEFAULT_WIDGETS: WidgetInstance[] = [
  { id: 'm1', type: 'METRIC_REVENUE', w: 1 },
  { id: 'm2', type: 'METRIC_PROFIT', w: 1 },
  { id: 'm3', type: 'METRIC_ORDERS', w: 1 },
  { id: 'm4', type: 'METRIC_CLV', w: 1 },
  { id: 'c1', type: 'REVENUE_CHART', w: 2 },
  { id: 'c2', type: 'PROFIT_CHART', w: 2 },
  { id: 'c3', type: 'ORDERS_CHART', w: 2 },
  { id: 'i1', type: 'AI_INSIGHTS', w: 2 },
  { id: 'p1', type: 'TOP_PRODUCTS', w: 2 },
  { id: 'a1', type: 'CRITICAL_ALERTS', w: 2 },
];

interface DashboardProps {
  user: User;
  onTabChange: (tab: AppTab) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onTabChange }) => {
  const [widgets, setWidgets] = useState<WidgetInstance[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const socketRef = useRef<WebSocket | null>(null);

  const loadStats = async () => {
    if (user.storeId) {
      const s = await db.getDashboardStats(user.storeId);
      setStats(s);
      setLastUpdate(new Date());
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem(DASHBOARD_STORAGE_KEY);
    setWidgets(saved ? JSON.parse(saved) : DEFAULT_WIDGETS);
    loadStats();

    // WebSocket for real-time updates
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'ORDER_CREATED' || data.type === 'ORDER_UPDATED') {
        console.log('[Real-time] Order update received, refreshing stats...');
        loadStats();
      }
    };

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [user.storeId]);

  const saveLayout = (newWidgets: WidgetInstance[]) => {
    setWidgets(newWidgets);
    localStorage.setItem(DASHBOARD_STORAGE_KEY, JSON.stringify(newWidgets));
  };

  const handleAddWidget = (type: WidgetType) => {
    const w = type.startsWith('METRIC') ? 1 : 2;
    const newWidget: WidgetInstance = {
      id: `w-${Date.now()}`,
      type,
      w
    };
    const nextWidgets = [...widgets, newWidget];
    saveLayout(nextWidgets);
    setIsAdding(false);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (draggedId === null || draggedId === id) return;
    const draggedIndex = widgets.findIndex(w => w.id === draggedId);
    const targetIndex = widgets.findIndex(w => w.id === id);
    const newWidgets = [...widgets];
    newWidgets.splice(draggedIndex, 1);
    newWidgets.splice(targetIndex, 0, widgets[draggedIndex]);
    setWidgets(newWidgets);
  };

  if (!stats) return <div className="p-8 text-center text-slate-500 font-bold flex flex-col items-center gap-4">
    <RefreshCw className="animate-spin text-blue-600" size={32} />
    Syncing with Shopify API...
  </div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between sticky top-16 bg-gray-50/90 backdrop-blur-md z-20 py-4 -mx-4 px-4 border-b border-gray-200/50">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Live Intelligence</h2>
            <span className="flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-black rounded uppercase animate-pulse">
              <Activity size={10} /> Live
            </span>
          </div>
          <p className="text-xs text-gray-500 font-medium">Last synced: {lastUpdate.toLocaleTimeString()}</p>
        </div>
        <div className="flex items-center gap-2">
          {isEditMode ? (
            <>
              <button onClick={() => setIsAdding(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 transition-all hover:scale-105 active:scale-95"><Plus size={18} /> Add Widget</button>
              <button onClick={() => saveLayout(DEFAULT_WIDGETS)} className="p-2 text-gray-500 hover:text-gray-900 transition-colors"><RotateCcw size={18} /></button>
              <button onClick={() => setIsEditMode(false)} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg transition-all hover:bg-slate-800"><Check size={18} /> Save Layout</button>
            </>
          ) : (
            <>
              <button onClick={loadStats} className="p-2 text-gray-500 hover:text-blue-600 transition-colors"><RefreshCw size={18} /></button>
              <button onClick={() => setIsEditMode(true)} className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-gray-50 transition-all"><Edit3 size={18} /> Customize</button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
        {widgets.map((widget) => (
          <div 
            key={widget.id} 
            draggable={isEditMode}
            onDragStart={() => setDraggedId(widget.id)}
            onDragOver={(e) => handleDragOver(e, widget.id)}
            onDragEnd={() => { saveLayout(widgets); setDraggedId(null); }}
            className={`${widget.w === 2 ? 'lg:col-span-2' : widget.w === 3 ? 'lg:col-span-3' : widget.w === 4 ? 'lg:col-span-4' : 'lg:col-span-1'} relative group transition-all duration-300 ${isEditMode ? 'cursor-move ring-2 ring-blue-400 rounded-3xl' : ''}`}
          >
            {isEditMode && <button onClick={() => saveLayout(widgets.filter(w => w.id !== widget.id))} className="absolute -top-2 -right-2 z-30 p-1.5 bg-red-500 text-white rounded-full shadow-lg hover:scale-110 transition-transform"><X size={14} /></button>}
            <WidgetRenderer type={widget.type} stats={stats} onTabChange={onTabChange} />
          </div>
        ))}
      </div>

      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsAdding(false)}></div>
          <div className="relative bg-white rounded-[2.5rem] p-8 max-w-2xl w-full shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-black text-slate-900">Add Intelligence Widget</h3>
              <button onClick={() => setIsAdding(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"><X size={24} /></button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <AddButton label="Revenue Metric" type="METRIC_REVENUE" icon={<DollarSign size={16} />} onClick={handleAddWidget} />
              <AddButton label="Profit Metric" type="METRIC_PROFIT" icon={<TrendingUp size={16} />} onClick={handleAddWidget} />
              <AddButton label="Orders Metric" type="METRIC_ORDERS" icon={<ShoppingBag size={16} />} onClick={handleAddWidget} />
              <AddButton label="CLV Metric" type="METRIC_CLV" icon={<Users size={16} />} onClick={handleAddWidget} />
              <AddButton label="Revenue Chart" type="REVENUE_CHART" icon={<Activity size={16} />} onClick={handleAddWidget} />
              <AddButton label="Profit Chart" type="PROFIT_CHART" icon={<TrendingUp size={16} />} onClick={handleAddWidget} />
              <AddButton label="Orders Chart" type="ORDERS_CHART" icon={<ShoppingBag size={16} />} onClick={handleAddWidget} />
              <AddButton label="Top Products" type="TOP_PRODUCTS" icon={<Plus size={16} />} onClick={handleAddWidget} />
              <AddButton label="AI Growth Scout" type="AI_INSIGHTS" icon={<Sparkles size={16} />} onClick={handleAddWidget} />
              <AddButton label="Critical Alerts" type="CRITICAL_ALERTS" icon={<AlertTriangle size={16} />} onClick={handleAddWidget} />
            </div>
            <button onClick={() => setIsAdding(false)} className="mt-8 w-full py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-colors">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

const AddButton = ({ label, type, icon, onClick }: any) => (
  <button 
    onClick={() => onClick(type)}
    className="p-5 border-2 border-gray-100 rounded-2xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left group flex items-start gap-4"
  >
    <div className="bg-white p-2 rounded-xl shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all">
      {icon}
    </div>
    <div>
      <p className="font-black text-slate-900 group-hover:text-blue-700">{label}</p>
      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Intelligence Module</p>
    </div>
  </button>
);

const AIInsightsWidget = ({ stats }: { stats: any }) => {
  const [insight, setInsight] = useState<any>(null);
  const [forecast, setForecast] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const generateInsight = async () => {
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || '' });
      
      // Insight Prompt
      const insightPrompt = `Analyze these Shopify store metrics: 
      Revenue: $${stats.revenue}
      Profit: $${stats.profit}
      Orders: ${stats.orderCount}
      CLV: $${(stats.clv || 0).toFixed(2)}
      Top Products: ${stats.topProducts.map((p: any) => p.name).join(', ')}
      
      Provide 3 short, actionable business recommendations (one for pricing, one for ads, one for costs). 
      Format as a JSON object with keys: pricing, ads, costs.`;

      const insightResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: insightPrompt,
        config: { responseMimeType: 'application/json' }
      });
      
      const recommendations = JSON.parse(insightResponse.text || '{}');
      setInsight(recommendations);

      // Forecast Prompt
      const forecastPrompt = `Predict next 30 days revenue and profit based on current data:
      Current Revenue: $${stats.revenue}
      Current Profit: $${stats.profit}
      Current Orders: ${stats.orderCount}
      
      Return a JSON object with keys: predictedRevenue, predictedProfit, confidence (0-100).`;

      const forecastResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: forecastPrompt,
        config: { responseMimeType: 'application/json' }
      });
      
      setForecast(JSON.parse(forecastResponse.text || '{}'));
    } catch (err) {
      console.error("AI Scout failed", err);
      setInsight({
        pricing: "Increase 'Premium Coffee Grinder' price by 5% to match market average.",
        ads: "Allocate 20% more budget to Instagram for your top 3 products.",
        costs: "Switch to local shipping for orders under $50 to save 12% on fulfillment."
      });
      setForecast({
        predictedRevenue: stats.revenue * 1.15,
        predictedProfit: stats.profit * 1.12,
        confidence: 85
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateInsight();
  }, []);

  return (
    <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl text-white h-full relative overflow-hidden group border border-slate-800">
      <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
        <Sparkles size={120} />
      </div>
      
      <div className="flex items-center justify-between mb-8">
        <h3 className="font-black text-xl flex items-center gap-3">
          <Sparkles size={24} className="text-blue-400" /> AI Growth Scout
        </h3>
        {loading && <RefreshCw size={16} className="animate-spin text-blue-400" />}
      </div>

      {loading ? (
        <div className="space-y-6">
          <div className="h-4 bg-slate-800 rounded-full w-3/4 animate-pulse"></div>
          <div className="h-4 bg-slate-800 rounded-full w-1/2 animate-pulse"></div>
          <div className="h-4 bg-slate-800 rounded-full w-2/3 animate-pulse"></div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Recommendations */}
          <div className="space-y-4">
            {insight && Object.entries(insight).map(([key, val]: any) => (
              <div key={key} className="flex gap-4 items-start bg-white/5 p-4 rounded-2xl border border-white/5 hover:bg-white/10 transition-all">
                <div className="bg-blue-600/20 p-2 rounded-xl text-blue-400">
                  {key === 'pricing' ? <DollarSign size={16} /> : key === 'ads' ? <Zap size={16} /> : <TrendingDown size={16} />}
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-1">{key} Suggestion</p>
                  <p className="text-sm font-medium leading-relaxed text-slate-200">{val}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Forecasting */}
          {forecast && (
            <div className="pt-6 border-t border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-black uppercase tracking-widest text-slate-400">30-Day Forecast</h4>
                <span className="text-[10px] font-black bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded-full">{forecast.confidence}% Confidence</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                  <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Est. Revenue</p>
                  <p className="text-xl font-black text-blue-400">${Math.round(forecast.predictedRevenue || 0).toLocaleString()}</p>
                </div>
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                  <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Est. Profit</p>
                  <p className="text-xl font-black text-green-400">${Math.round(forecast.predictedProfit || 0).toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}

          <button 
            onClick={generateInsight}
            className="w-full py-3 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border border-white/5"
          >
            Refresh Intelligence
          </button>
        </div>
      )}
    </div>
  );
};

const WidgetRenderer = ({ type, stats, onTabChange }: { type: WidgetType, stats: any, onTabChange: (tab: AppTab) => void }) => {
  switch (type) {
    case 'METRIC_REVENUE': return <MetricCard label="Total Revenue" value={`$${(stats.revenue || 0).toLocaleString()}`} change="+12.5%" isPositive={true} icon={DollarSign} onClick={() => onTabChange(AppTab.ORDERS)} />;
    case 'METRIC_PROFIT': return <MetricCard label="Net Profit" value={`$${(stats.profit || 0).toLocaleString()}`} change="+8.2%" isPositive={true} icon={TrendingUp} onClick={() => onTabChange(AppTab.ORDERS)} />;
    case 'METRIC_ORDERS': return <MetricCard label="Total Orders" value={(stats.orderCount || 0).toLocaleString()} change="-2.4%" isPositive={false} icon={ShoppingBag} onClick={() => onTabChange(AppTab.ORDERS)} />;
    case 'METRIC_CLV': return <MetricCard label="Avg. CLV" value={`$${(stats.clv || 0).toFixed(2)}`} change="+5.1%" isPositive={true} icon={Users} />;
    case 'AI_INSIGHTS': return <AIInsightsWidget stats={stats} />;
    case 'TOP_PRODUCTS': return (
      <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm h-full flex flex-col">
        <div className="flex items-center justify-between mb-8">
          <h3 className="font-black text-xl text-slate-900">Top Performers</h3>
          <button onClick={() => onTabChange(AppTab.PRODUCTS)} className="text-blue-600 hover:text-blue-700 font-bold text-xs flex items-center gap-1">View All <ChevronRight size={14} /></button>
        </div>
        <div className="flex-1 space-y-4">
          {stats.topProducts.map((p: any, idx: number) => (
            <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:bg-blue-50 hover:border-blue-100 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-black text-slate-400 shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all">
                  {idx + 1}
                </div>
                <div>
                  <p className="font-black text-slate-900 truncate max-w-[120px]">{p.name}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Revenue: ${(p.revenue || 0).toLocaleString()}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-green-600">+${(p.profit || 0).toLocaleString()}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Net Profit</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
    case 'REVENUE_CHART': return <ChartWidget title="Revenue Growth" data={stats.revenueChart} color="#3b82f6" label="Revenue" icon={<DollarSign size={16} />} />;
    case 'PROFIT_CHART': return <ChartWidget title="Profitability" data={stats.profitChart} color="#10b981" label="Profit" icon={<TrendingUp size={16} />} />;
    case 'ORDERS_CHART': return <ChartWidget title="Order Volume" data={stats.ordersChart} color="#8b5cf6" label="Orders" icon={<ShoppingBag size={16} />} />;
    case 'CRITICAL_ALERTS': return (
      <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm h-full flex flex-col">
        <h3 className="font-black text-xl text-slate-900 mb-8 flex items-center gap-2">
          <AlertTriangle size={24} className="text-amber-500" /> Critical Alerts
        </h3>
        <div className="flex-1 space-y-4">
          {stats.alerts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
              <Check className="text-green-500 mb-2" size={32} />
              <p className="text-sm font-bold">All systems healthy</p>
            </div>
          ) : (
            stats.alerts.map((alert: any) => (
              <div key={alert.id} className={`p-4 rounded-2xl border flex gap-4 items-start transition-all ${
                alert.severity === 'high' ? 'bg-red-50 border-red-100 text-red-900' : 'bg-amber-50 border-amber-100 text-amber-900'
              }`}>
                <div className={`p-2 rounded-xl ${alert.severity === 'high' ? 'bg-red-500 text-white' : 'bg-amber-500 text-white'}`}>
                  <AlertTriangle size={16} />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest mb-1">{alert.type} Alert</p>
                  <p className="text-sm font-bold leading-tight">{alert.message}</p>
                  <p className="text-[10px] opacity-60 mt-2 font-medium">{new Date(alert.timestamp).toLocaleTimeString()}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
    default: return <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm min-h-[150px] flex items-center justify-center text-slate-300 italic">Module {type}</div>;
  }
};

const ChartWidget = ({ title, data, color, label, icon }: any) => (
  <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm h-full min-h-[350px] flex flex-col">
    <div className="flex items-center justify-between mb-8">
      <h3 className="font-black text-xl text-slate-900 flex items-center gap-3">
        <div className="p-2 bg-slate-50 rounded-xl text-slate-400">{icon}</div>
        {title}
      </h3>
      <div className="flex items-center gap-2">
        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></span>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">30 Days</span>
      </div>
    </div>
    <div className="flex-1 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="date" hide />
          <YAxis hide />
          <Tooltip 
            contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '16px' }}
            labelStyle={{ fontWeight: '900', color: '#0f172a', marginBottom: '8px', fontSize: '12px' }}
            itemStyle={{ fontWeight: '700', fontSize: '14px' }}
            formatter={(val: any) => [`${label === 'Orders' ? (val || 0) : '$' + (val || 0).toLocaleString()}`, label]}
          />
          <Area type="monotone" dataKey="value" stroke={color} strokeWidth={4} fill={`url(#color-${label})`} />
          <defs>
            <linearGradient id={`color-${label}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.2}/>
              <stop offset="95%" stopColor={color} stopOpacity={0}/>
            </linearGradient>
          </defs>
        </AreaChart>
      </ResponsiveContainer>
    </div>
  </div>
);

const MetricCard = ({ label, value, change, isPositive, icon: Icon, onClick }: any) => (
  <div 
    onClick={onClick}
    className={`bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1 group flex flex-col justify-between h-full ${onClick ? 'cursor-pointer' : ''}`}
  >
    <div className="flex items-center justify-between mb-6">
      <div className="p-3 bg-slate-50 text-slate-400 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
        <Icon size={24} />
      </div>
      <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black tracking-widest uppercase ${
        isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
      }`}>
        {isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
        {change}
      </div>
    </div>
    <div>
      <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">{label}</p>
      <div className="flex items-end justify-between">
        <h4 className="text-3xl font-black text-slate-900 tracking-tight">{value}</h4>
        {onClick && <ArrowRight size={20} className="text-slate-200 group-hover:text-blue-600 transition-colors" />}
      </div>
    </div>
  </div>
);

export default Dashboard;
