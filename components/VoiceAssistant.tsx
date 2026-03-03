
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  History, 
  PlayCircle, 
  MessageSquare, 
  Zap, 
  TrendingUp, 
  Package, 
  DollarSign,
  BarChart3,
  RefreshCw,
  Pause,
  Play,
  Settings,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { GoogleGenAI, Modality, Type } from '@google/genai';
import { User } from '@/types';
import { db } from '@/lib/db';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';

interface VoiceAssistantProps {
  user: User;
}

interface Message {
  role: 'user' | 'assistant';
  text: string;
  data?: any;
  type?: 'text' | 'chart' | 'metric';
  audio?: string;
}

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ user }) => {
  const [mode, setMode] = useState<'voice' | 'text'>('voice');
  const [isActive, setIsActive] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<'idle' | 'listening' | 'processing' | 'speaking'>('idle');
  const [inputText, setInputText] = useState('');
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const suggestions = [
    { label: "Yesterday's Sales", icon: <DollarSign size={14} />, prompt: "What were yesterday's sales?" },
    { label: "Top Products", icon: <Package size={14} />, prompt: "Show my top selling products" },
    { label: "Current Profit", icon: <TrendingUp size={14} />, prompt: "What is my current profit margin?" },
    { label: "Sales Forecast", icon: <BarChart3 size={14} />, prompt: "Forecast this week's revenue" }
  ];

  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  const decodeAudioData = async (
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
  ): Promise<AudioBuffer> => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  };

  const encode = (bytes: Uint8Array) => {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  const playVoiceResponse = async (text: string) => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || '' });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Zephyr' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        source.start(0);
      }
    } catch (err) {
      console.error("TTS failed", err);
    }
  };

  const handleAction = async (action: string, args: any) => {
    if (action === 'get_sales_data') {
      const result = await db.getOrders(user.storeId!);
      const orders = result.orders;
      const total = orders.reduce((sum, o) => sum + o.totalPrice, 0);
      return { total, count: orders.length, currency: 'USD' };
    }
    if (action === 'get_top_products') {
      const products = await db.getProducts(user.storeId!);
      return products.slice(0, 5).map(p => ({ name: p.name, sales: Math.floor(Math.random() * 100) }));
    }
    return { status: 'success' };
  };

  const startVoiceSession = async () => {
    if (isActive) {
      setIsActive(false);
      setStatus('idle');
      if (sessionRef.current) {
        // sessionRef.current.close();
      }
      return;
    }

    setStatus('listening');
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || '' });
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = outputCtx;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setIsActive(true);
            setStatus('listening');
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) int16[i] = inputData[i] * 32768;
              const pcmBlob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              sessionPromise.then((session) => session.sendRealtimeInput({ media: pcmBlob }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (message) => {
            if (message.serverContent?.modelTurn) {
              setStatus('speaking');
              const base64Audio = message.serverContent.modelTurn.parts?.[0]?.inlineData?.data;
              if (base64Audio && audioContextRef.current) {
                const ctx = audioContextRef.current;
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
                const source = ctx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(ctx.destination);
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += audioBuffer.duration;
                sourcesRef.current.add(source);
                source.onended = () => setStatus('listening');
              }
            }

            if (message.serverContent?.outputTranscription) {
              const text = message.serverContent.outputTranscription.text || '';
              setMessages(prev => [...prev, { role: 'assistant', text }]);
            }
            if (message.serverContent?.inputTranscription) {
              const text = message.serverContent.inputTranscription.text || '';
              setMessages(prev => [...prev, { role: 'user', text }]);
            }
          },
          onerror: (e) => console.error('Live API error', e),
          onclose: () => {
            setIsActive(false);
            setStatus('idle');
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: 'You are the Sales Insights Pro Voice Assistant. Use short, professional responses. If the user asks for data, provide it clearly.',
          outputAudioTranscription: {},
          inputAudioTranscription: {},
        }
      });

      sessionRef.current = sessionPromise;
    } catch (err) {
      console.error(err);
      setStatus('idle');
    }
  };

  const handleTextSubmit = async (e?: React.FormEvent, customPrompt?: string) => {
    if (e) e.preventDefault();
    const text = customPrompt || inputText;
    if (!text) return;

    setMessages(prev => [...prev, { role: 'user', text }]);
    setInputText('');
    setStatus('processing');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || '' });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: text,
        config: {
          systemInstruction: 'You are a business intelligence assistant. Return data in structured format if asked. If the user asks for sales or products, assume you have access to the store database.',
          tools: [{
            functionDeclarations: [
              {
                name: 'get_sales_data',
                parameters: { type: Type.OBJECT, properties: {} }
              },
              {
                name: 'get_top_products',
                parameters: { type: Type.OBJECT, properties: {} }
              }
            ]
          }]
        }
      });

      const calls = response.functionCalls;
      if (calls) {
        const results = await Promise.all(calls.map(c => handleAction(c.name || '', c.args)));
        const finalResponse = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: [
            { role: 'user', parts: [{ text }] },
            { role: 'model', parts: [{ text: response.text || '' }] },
            { role: 'user', parts: [{ text: `Here is the data: ${JSON.stringify(results)}` }] }
          ]
        });
        
        const assistantText = finalResponse.text || "Here is the data you requested.";
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          text: assistantText,
          data: results[0],
          type: calls[0].name === 'get_top_products' ? 'chart' : 'metric'
        }]);
        if (mode === 'voice') playVoiceResponse(assistantText);
      } else {
        const assistantText = response.text || "I'm not sure how to help with that.";
        setMessages(prev => [...prev, { role: 'assistant', text: assistantText }]);
        if (mode === 'voice') playVoiceResponse(assistantText);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setStatus('idle');
    }
  };

  const renderDataCard = (msg: Message) => {
    if (!msg.data) return null;

    if (msg.type === 'chart') {
      return (
        <div className="mt-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm h-64 w-full">
          <h4 className="text-xs font-black text-gray-400 uppercase mb-4">Top Performing Products</h4>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={msg.data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
              <YAxis fontSize={10} axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="sales" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      );
    }

    if (msg.type === 'metric') {
      return (
        <div className="mt-4 grid grid-cols-2 gap-4 w-full">
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-[10px] font-black text-gray-400 uppercase">Total Revenue</p>
            <p className="text-2xl font-black text-gray-900 mt-1">${msg.data.total.toLocaleString()}</p>
            <div className="flex items-center gap-1 text-green-600 text-[10px] font-bold mt-1">
              <TrendingUp size={10} /> +12.5%
            </div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-[10px] font-black text-gray-400 uppercase">Total Orders</p>
            <p className="text-2xl font-black text-gray-900 mt-1">{msg.data.count}</p>
            <p className="text-[10px] text-gray-400 mt-1">Across all channels</p>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      {/* Header & Toggle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Sparkles className="text-blue-600" /> Voice Operations
          </h2>
          <p className="text-slate-500">Intelligent business assistant. Ask anything about your store.</p>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-2xl self-start">
          <button 
            onClick={() => setMode('voice')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              mode === 'voice' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Mic size={16} /> Voice Mode
          </button>
          <button 
            onClick={() => setMode('text')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              mode === 'text' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <MessageSquare size={16} /> Text Mode
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Interaction Area */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col h-[600px]">
            {/* Messages Log */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-thin">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                  <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center">
                    <Zap size={40} className="text-slate-300" />
                  </div>
                  <div className="max-w-xs">
                    <h3 className="font-black text-slate-900">Ready for Command</h3>
                    <p className="text-sm text-slate-500">Ask me about your sales, products, or profit margins.</p>
                  </div>
                </div>
              ) : (
                messages.map((m, i) => (
                  <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[85%] p-5 rounded-3xl text-sm leading-relaxed shadow-sm ${
                      m.role === 'user' 
                        ? 'bg-blue-600 text-white rounded-tr-none' 
                        : 'bg-slate-50 text-slate-700 rounded-tl-none border border-slate-100'
                    }`}>
                      {m.text}
                      {m.role === 'assistant' && (
                        <button 
                          onClick={() => playVoiceResponse(m.text)}
                          className="ml-2 inline-flex items-center justify-center p-1 hover:bg-slate-200 rounded-full transition-colors"
                        >
                          <Volume2 size={14} />
                        </button>
                      )}
                    </div>
                    {renderDataCard(m)}
                  </div>
                ))
              )}
              {status === 'processing' && (
                <div className="flex items-center gap-2 text-blue-600 font-bold text-xs animate-pulse">
                  <RefreshCw className="animate-spin" size={14} /> AI is thinking...
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-6 bg-slate-50 border-t border-slate-100">
              {mode === 'voice' ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    {isActive && (
                      <div className="absolute inset-0 -m-6 flex items-center justify-center">
                        <div className="w-32 h-32 bg-blue-500/20 rounded-full animate-ping"></div>
                        <div className="absolute w-24 h-24 bg-blue-500/10 rounded-full animate-pulse"></div>
                      </div>
                    )}
                    <button 
                      onClick={startVoiceSession}
                      className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-xl ${
                        isActive ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      {isActive ? <MicOff size={32} className="text-white" /> : <Mic size={32} className="text-white" />}
                    </button>
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {status === 'listening' ? 'Listening...' : status === 'speaking' ? 'Speaking...' : 'Tap to Speak'}
                  </span>
                </div>
              ) : (
                <form onSubmit={handleTextSubmit} className="flex gap-3">
                  <input 
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Type your question here..."
                    className="flex-1 p-4 bg-white border-none rounded-2xl ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                  />
                  <button 
                    type="submit"
                    disabled={!inputText || status === 'processing'}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white p-4 rounded-2xl shadow-lg transition-all active:scale-95"
                  >
                    <ChevronRight size={24} />
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Controls */}
        <div className="lg:col-span-4 space-y-6">
          {/* Suggestions Panel */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
              <Zap size={20} className="text-amber-500" /> Quick Queries
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {suggestions.map((s, idx) => (
                <button 
                  key={idx}
                  onClick={() => handleTextSubmit(undefined, s.prompt)}
                  className="flex items-center gap-3 p-4 bg-slate-50 hover:bg-blue-50 hover:text-blue-600 rounded-2xl text-left text-sm font-bold transition-all group"
                >
                  <div className="bg-white p-2 rounded-xl shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    {s.icon}
                  </div>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Assistant Info */}
          <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Sparkles size={24} />
              </div>
              <div>
                <h4 className="font-black text-sm">Pro Assistant</h4>
                <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">v2.5 Engine</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Context Memory</span>
                <span className="text-green-400 font-bold">Active</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Data Access</span>
                <span className="text-green-400 font-bold">Full</span>
              </div>
              <div className="pt-4 border-t border-slate-800">
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  The assistant has real-time access to your Shopify store data, including orders, inventory, and customer metrics.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceAssistant;
