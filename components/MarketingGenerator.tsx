
'use client';

import React, { useState, useEffect } from 'react';
import { 
  ImageIcon, 
  Wand2, 
  Download, 
  Layers, 
  Monitor, 
  RefreshCw, 
  Grid, 
  Save, 
  Copy, 
  Check, 
  AlertCircle,
  ExternalLink,
  Trash2,
  ChevronRight,
  Layout
} from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { User, Product } from '@/types';
import { db } from '@/lib/db';

interface MarketingGeneratorProps {
  user: User;
}

interface GeneratedAsset {
  id: string;
  url: string;
  prompt: string;
  platform: string;
  goal: string;
  timestamp: number;
}

const MarketingGenerator: React.FC<MarketingGeneratorProps> = ({ user }) => {
  const [prompt, setPrompt] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [products, setProducts] = useState<Product[]>([]);
  const [platform, setPlatform] = useState('Instagram Post');
  const [goal, setGoal] = useState('Increase Conversions');
  const [loading, setLoading] = useState(false);
  const [variations, setVariations] = useState<string[]>([]);
  const [savedAssets, setSavedAssets] = useState<GeneratedAsset[]>([]);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  const platforms = [
    { name: 'Instagram Post', aspect: '1:1' },
    { name: 'Instagram Story', aspect: '9:16' },
    { name: 'Facebook Ad', aspect: '1.91:1' },
    { name: 'Shopify Banner', aspect: '16:9' },
    { name: 'Email Banner', aspect: '3:1' },
    { name: 'Google Ad', aspect: '4:3' }
  ];

  const goals = [
    'Increase Conversions',
    'Product Launch',
    'Discount Promotion',
    'Brand Awareness',
    'Retargeting'
  ];

  useEffect(() => {
    const loadProducts = async () => {
      if (user.storeId) {
        const prods = await db.getProducts(user.storeId);
        setProducts(prods);
        if (prods.length > 0) setSelectedProduct(prods[0].id);
      }
    };
    loadProducts();

    const saved = localStorage.getItem('sales_pro_assets');
    if (saved) setSavedAssets(JSON.parse(saved));
  }, [user.storeId]);

  const generateCreatives = async () => {
    if (!prompt && !selectedProduct) return;
    setLoading(true);
    setVariations([]);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || '' });
      const product = products.find(p => p.id === selectedProduct);
      const currentPlatform = platforms.find(p => p.name === platform);
      
      const enhancedPrompt = `
        Professional e-commerce marketing asset for ${platform}.
        Objective: ${goal}.
        Product: ${product ? `${product.name} (Price: $${product.price})` : 'Generic Product'}.
        Art Direction: ${prompt}.
        Style: High-end commercial photography, studio lighting, clean background, premium aesthetic.
      `.trim();

      // Generate 3 variations in parallel
      const generationPromises = [1, 2, 3].map(async () => {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: {
            parts: [{ text: enhancedPrompt }],
          },
          config: {
            imageConfig: {
              aspectRatio: (currentPlatform?.aspect === '1.91:1' || currentPlatform?.aspect === '3:1' || currentPlatform?.aspect === '4:3') ? '16:9' : currentPlatform?.aspect as any,
            }
          }
        });

        for (const part of response.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData) {
            return `data:image/png;base64,${part.inlineData.data}`;
          }
        }
        return null;
      });

      const results = await Promise.all(generationPromises);
      setVariations(results.filter((r): r is string => r !== null));
    } catch (err) {
      console.error(err);
      alert("Creative generation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const saveToLibrary = (url: string) => {
    const newAsset: GeneratedAsset = {
      id: `asset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      url,
      prompt,
      platform,
      goal,
      timestamp: Date.now()
    };
    const updated = [newAsset, ...savedAssets];
    setSavedAssets(updated);
    localStorage.setItem('sales_pro_assets', JSON.stringify(updated));
  };

  const handleDownload = (url: string, format: 'png' | 'jpg') => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `sales-pro-asset-${Date.now()}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyPrompt = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopyStatus(text);
    setTimeout(() => setCopyStatus(null), 2000);
  };

  const deleteAsset = (id: string) => {
    const updated = savedAssets.filter(a => a.id !== id);
    setSavedAssets(updated);
    localStorage.setItem('sales_pro_assets', JSON.stringify(updated));
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Creative Studio</h2>
          <p className="text-slate-500">AI-powered marketing engine for high-conversion assets.</p>
        </div>
        <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full border border-blue-100">
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
          <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Image Engine Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Controls Panel */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
            <div className="space-y-4">
              <label className="block">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">1. Select Product</span>
                <select 
                  value={selectedProduct} 
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  className="w-full p-4 bg-slate-50 border-none rounded-2xl ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-slate-700"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </label>

              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">2. Platform</span>
                  <select 
                    value={platform} 
                    onChange={(e) => setPlatform(e.target.value)}
                    className="w-full p-4 bg-slate-50 border-none rounded-2xl ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-medium"
                  >
                    {platforms.map(p => (
                      <option key={p.name} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">3. Campaign Goal</span>
                  <select 
                    value={goal} 
                    onChange={(e) => setGoal(e.target.value)}
                    className="w-full p-4 bg-slate-50 border-none rounded-2xl ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-medium"
                  >
                    {goals.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="block">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">4. Visual Direction</span>
                <textarea 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={4}
                  placeholder="Describe the mood, lighting, and background..." 
                  className="w-full p-4 bg-slate-50 border-none rounded-2xl ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none text-sm"
                />
              </label>

              <button 
                onClick={generateCreatives} 
                disabled={loading} 
                className="w-full bg-slate-900 hover:bg-black disabled:bg-slate-400 text-white font-bold py-5 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl active:scale-95"
              >
                {loading ? <RefreshCw className="animate-spin" size={20} /> : <Wand2 size={20} />}
                {loading ? "Generating Variations..." : "Generate Variations"}
              </button>
            </div>
          </div>

          {/* Saved Assets Sidebar */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
              <Layers size={20} className="text-blue-600" /> Asset Library
            </h3>
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
              {savedAssets.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  <ImageIcon size={32} className="mx-auto mb-2 opacity-20" />
                  <p className="text-xs">No saved assets yet.</p>
                </div>
              ) : (
                savedAssets.map(asset => (
                  <div key={asset.id} className="group relative bg-slate-50 rounded-2xl p-3 border border-slate-100 hover:border-blue-200 transition-all">
                    <div className="flex gap-3">
                      <img src={asset.url} alt="Saved" className="w-16 h-16 object-cover rounded-xl shadow-sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black text-blue-600 uppercase truncate">{asset.platform}</p>
                        <p className="text-xs font-bold text-slate-700 truncate">{asset.goal}</p>
                        <div className="flex gap-2 mt-2">
                          <button onClick={() => handleDownload(asset.url, 'png')} className="text-slate-400 hover:text-blue-600"><Download size={14} /></button>
                          <button onClick={() => copyPrompt(asset.prompt)} className="text-slate-400 hover:text-blue-600"><Copy size={14} /></button>
                          <button onClick={() => deleteAsset(asset.id)} className="text-slate-400 hover:text-red-500"><Trash2 size={14} /></button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Results Canvas */}
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200 min-h-[600px] p-8 flex flex-col items-center justify-center relative overflow-hidden">
            {loading ? (
              <div className="text-center space-y-6 animate-in fade-in duration-500">
                <div className="relative">
                  <div className="w-24 h-24 bg-blue-600/10 rounded-full animate-ping absolute inset-0"></div>
                  <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center relative shadow-xl">
                    <RefreshCw className="animate-spin text-blue-600" size={40} />
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-slate-900">Crafting Visuals...</h3>
                  <p className="text-slate-400 text-sm max-w-xs mx-auto">Our AI is rendering multiple variations optimized for {platform}.</p>
                </div>
              </div>
            ) : variations.length > 0 ? (
              <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
                {variations.map((url, idx) => (
                  <div key={idx} className="group relative bg-white p-4 rounded-[2.5rem] shadow-xl border border-slate-100 hover:scale-[1.02] transition-all">
                    <img src={url} alt={`Variation ${idx}`} className="w-full aspect-square object-cover rounded-[2rem] shadow-sm" />
                    <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-[2.5rem] flex items-center justify-center gap-3">
                      <button 
                        onClick={() => saveToLibrary(url)}
                        className="bg-white text-slate-900 p-3 rounded-full shadow-2xl hover:scale-110 transition-transform active:scale-95"
                        title="Save to Library"
                      >
                        <Save size={20} />
                      </button>
                      <button 
                        onClick={() => handleDownload(url, 'png')}
                        className="bg-blue-600 text-white p-3 rounded-full shadow-2xl hover:scale-110 transition-transform active:scale-95"
                        title="Download PNG"
                      >
                        <Download size={20} />
                      </button>
                      <button 
                        onClick={() => copyPrompt(prompt)}
                        className="bg-white text-slate-900 p-3 rounded-full shadow-2xl hover:scale-110 transition-transform active:scale-95"
                        title="Copy Prompt"
                      >
                        {copyStatus === prompt ? <Check size={20} className="text-green-600" /> : <Copy size={20} />}
                      </button>
                    </div>
                    <div className="mt-4 flex justify-between items-center px-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Variation {idx + 1}</span>
                      <div className="flex gap-2">
                        <button onClick={() => handleDownload(url, 'jpg')} className="text-[10px] font-bold text-blue-600 hover:underline">JPG</button>
                        <button onClick={() => handleDownload(url, 'png')} className="text-[10px] font-bold text-blue-600 hover:underline">PNG</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center space-y-6">
                <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center mx-auto shadow-sm text-slate-200">
                  <Layout size={48} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-slate-300">Canvas Ready</h3>
                  <p className="text-slate-400 text-sm max-w-xs mx-auto">Select a product and platform to begin generating marketing variations.</p>
                </div>
              </div>
            )}
          </div>

          {/* Tips Section */}
          <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 flex items-start gap-4">
            <div className="bg-white p-3 rounded-2xl text-blue-600 shadow-sm"><AlertCircle size={24} /></div>
            <div>
              <h4 className="font-bold text-blue-900 text-sm">Pro Tip: Platform Optimization</h4>
              <p className="text-xs text-blue-700/70 leading-relaxed mt-1">
                Selecting a platform automatically adjusts the generation model&apos;s focus to match industry-standard layouts. For example, &quot;Instagram Story&quot; prioritizes vertical negative space for text overlays.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketingGenerator;
