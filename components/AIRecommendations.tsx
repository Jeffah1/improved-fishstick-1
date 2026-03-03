
'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/db';
import { AIRecommendation } from '@/types';
import { 
  Sparkles, 
  TrendingUp, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  AlertCircle, 
  ChevronRight,
  ArrowUpRight,
  Zap,
  DollarSign,
  Package,
  RefreshCw,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AIRecommendationsProps {
  storeId: string;
}

const AIRecommendations: React.FC<AIRecommendationsProps> = ({ storeId }) => {
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [confirmingRec, setConfirmingRec] = useState<AIRecommendation | null>(null);

  const loadRecommendations = async () => {
    setLoading(true);
    const data = await db.getRecommendations(storeId);
    setRecommendations(data);
    setLoading(false);
  };

  useEffect(() => {
    loadRecommendations();
  }, [storeId]);

  const handleGenerate = async () => {
    setLoading(true);
    await db.generateRecommendations(storeId);
    await loadRecommendations();
  };

  const handleApply = async (rec: AIRecommendation) => {
    setProcessingId(rec.id);
    await db.applyRecommendation(rec.id);
    await loadRecommendations();
    setProcessingId(null);
    setConfirmingRec(null);
  };

  const handleUndo = async (rec: AIRecommendation) => {
    setProcessingId(rec.id);
    await db.undoRecommendation(rec.id);
    await loadRecommendations();
    setProcessingId(null);
  };

  const handleDismiss = async (rec: AIRecommendation) => {
    await db.dismissRecommendation(rec.id);
    await loadRecommendations();
  };

  const activeRecs = recommendations.filter(r => r.status === 'pending');
  const appliedRecs = recommendations.filter(r => r.status === 'applied');

  return (
    <div className="space-y-10 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Sparkles className="text-blue-600" /> AI Growth Scout
          </h2>
          <p className="text-slate-500">Intelligent recommendations to optimize your margins and inventory.</p>
        </div>
        <button 
          onClick={handleGenerate}
          disabled={loading}
          className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl text-sm font-bold hover:bg-black transition-all shadow-xl shadow-slate-200 disabled:opacity-50"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} /> 
          {loading ? 'Analyzing...' : 'Generate New Insights'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Active Recommendations */}
        <div className="lg:col-span-8 space-y-6">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Active Suggestions</h3>
          
          <AnimatePresence mode="popLayout">
            {activeRecs.length === 0 && !loading ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200 p-20 text-center space-y-6"
              >
                <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center mx-auto shadow-sm text-slate-200">
                  <CheckCircle2 size={40} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-slate-300">All Caught Up!</h3>
                  <p className="text-slate-400 text-sm max-w-xs mx-auto">Your store is currently optimized. Check back later for new insights.</p>
                </div>
              </motion.div>
            ) : (
              activeRecs.map(rec => (
                <motion.div 
                  key={rec.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group"
                >
                  <div className="flex flex-col md:flex-row gap-8">
                    <div className={`p-6 rounded-3xl h-fit ${
                      rec.type === 'pricing' ? 'bg-blue-50 text-blue-600' : 
                      rec.type === 'inventory' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                    }`}>
                      {rec.type === 'pricing' ? <DollarSign size={32} /> : 
                       rec.type === 'inventory' ? <Package size={32} /> : <Zap size={32} />}
                    </div>
                    
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{rec.type}</span>
                          <div className="w-1 h-1 bg-slate-200 rounded-full"></div>
                          <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{rec.confidenceScore}% Confidence</span>
                        </div>
                        <button onClick={() => handleDismiss(rec)} className="text-slate-300 hover:text-red-500 transition-colors">
                          <XCircle size={20} />
                        </button>
                      </div>
                      
                      <div>
                        <h4 className="text-xl font-black text-slate-900 mb-2">{rec.title}</h4>
                        <p className="text-slate-500 text-sm leading-relaxed">{rec.description}</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-slate-50">
                        <div className="flex items-center gap-2">
                          <TrendingUp size={18} className="text-emerald-500" />
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Est. Profit Impact</p>
                            <p className="text-sm font-black text-slate-900">+${rec.estimatedProfitImpact.toLocaleString()}/mo</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Zap size={18} className="text-blue-500" />
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Action Type</p>
                            <p className="text-sm font-black text-slate-900 uppercase">{rec.actionType.replace('_', ' ')}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 justify-center min-w-[160px]">
                      <button 
                        onClick={() => setConfirmingRec(rec)}
                        className="w-full py-4 bg-blue-600 text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                      >
                        Apply Suggestion <ArrowUpRight size={14} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Applied History */}
        <div className="lg:col-span-4 space-y-6">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Applied Recently</h3>
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
            {appliedRecs.length === 0 ? (
              <div className="text-center py-10 text-slate-300">
                <p className="text-xs font-bold">No suggestions applied yet.</p>
              </div>
            ) : (
              appliedRecs.map(rec => (
                <div key={rec.id} className="flex gap-4 items-start pb-6 border-b border-slate-50 last:border-0 last:pb-0">
                  <div className="bg-emerald-50 p-2 rounded-xl text-emerald-600">
                    <Check size={16} />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-bold text-slate-900">{rec.title}</p>
                    <p className="text-[10px] text-slate-400">{new Date(rec.createdAt).toLocaleDateString()}</p>
                    <button 
                      onClick={() => handleUndo(rec)}
                      disabled={processingId === rec.id}
                      className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1 hover:text-blue-700 transition-colors"
                    >
                      <RotateCcw size={10} /> {processingId === rec.id ? 'Undoing...' : 'Undo Action'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Impact Summary */}
          <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <TrendingUp size={80} />
            </div>
            <div className="relative z-10 space-y-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Optimization Impact</p>
              <h4 className="text-3xl font-black text-emerald-400">
                +${appliedRecs.reduce((sum, r) => sum + r.estimatedProfitImpact, 0).toLocaleString()}
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Estimated monthly profit increase based on applied recommendations.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmingRec && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" 
              onClick={() => setConfirmingRec(null)}
            ></motion.div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white rounded-[3rem] p-10 max-w-lg w-full shadow-2xl"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="p-4 bg-blue-600 text-white rounded-3xl shadow-lg shadow-blue-500/20">
                  <AlertCircle size={32} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Confirm Action</h3>
                  <p className="text-slate-500">Are you sure you want to apply this optimization?</p>
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-3xl mb-8 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-400 uppercase">Action</span>
                  <span className="text-sm font-black text-slate-900 uppercase">{confirmingRec.actionType.replace('_', ' ')}</span>
                </div>
                {confirmingRec.actionType === 'price_update' && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-400 uppercase">Price Change</span>
                    <span className="text-sm font-black text-slate-900">
                      ${confirmingRec.actionPayload.oldPrice} → <span className="text-emerald-600">${confirmingRec.actionPayload.newPrice}</span>
                    </span>
                  </div>
                )}
                {confirmingRec.actionType === 'restock' && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-400 uppercase">Restock Qty</span>
                    <span className="text-sm font-black text-slate-900">+{confirmingRec.actionPayload.quantity} Units</span>
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => setConfirmingRec(null)}
                  className="flex-1 py-4 bg-slate-100 text-slate-600 font-black uppercase tracking-widest rounded-2xl hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleApply(confirmingRec)}
                  disabled={processingId === confirmingRec.id}
                  className="flex-2 py-4 bg-blue-600 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                >
                  {processingId === confirmingRec.id ? <RefreshCw className="animate-spin" size={18} /> : <Check size={18} />}
                  Confirm & Apply
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AIRecommendations;
