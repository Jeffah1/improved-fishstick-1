
'use client';

import React from 'react';
import { 
  Database, 
  Server, 
  Lock, 
  Layers, 
  Zap, 
  Code, 
  ShieldCheck, 
  Globe, 
  Activity, 
  CreditCard, 
  Share2, 
  Cpu, 
  Eye, 
  Repeat,
  Search
} from 'lucide-react';

const ArchitectSpec: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto space-y-16 pb-32">
      {/* Header Section */}
      <section>
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-200">
            <Layers size={32} />
          </div>
          <div>
            <h2 className="text-3xl font-black tracking-tight text-slate-900">Enterprise System Architecture</h2>
            <p className="text-slate-500 font-medium">Sales Insights Pro - Technical Specification v2.0</p>
          </div>
        </div>
        <p className="text-lg text-slate-600 leading-relaxed max-w-3xl">
          A high-availability, multi-tenant event-driven architecture designed for massive scale. 
          The system leverages a decoupled microservices approach with strict tenant isolation and 
          AI-native processing layers.
        </p>
      </section>

      {/* 1. Architecture Diagram */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <Share2 className="text-blue-600" size={24} />
          <h3 className="text-xl font-bold text-slate-800">High-Level Infrastructure Diagram</h3>
        </div>
        <div className="bg-slate-900 rounded-3xl p-10 shadow-2xl border border-slate-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4">
            <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-[10px] font-black rounded-full uppercase tracking-widest border border-blue-500/30">Production Grade</span>
          </div>
          <pre className="mono text-blue-400 text-sm leading-relaxed overflow-x-auto">
{`[ Clients: Web / Mobile / POS ]
           |
           v
[ API Gateway (Cloudflare / Nginx) ]
           |
           v
[ Tenant Resolver Middleware ] <---------- [ Redis (Session Cache) ]
           | (JWT -> store_id Context)
           |
           +-----> [ Auth Service ] <-----> [ Auth0 / JWT ]
           |
           +-----> [ Billing Service ] <---> [ Stripe API ]
           |
           +-----> [ Core API (Node/TS) ] 
           |            |
           |            +-----> [ Internal AI Service ] <---> [ Gemini 2.5/3 Pro ]
           |            |       (Vendor Abstraction Layer)
           |            |
           |            +-----> [ PostgreSQL Cluster ]
           |                        |-- [ Primary (Write) ]
           |                        |-- [ Read Replicas (Analytics) ]
           |                        |-- [ TimescaleDB (Time-series) ]
           |
           +-----> [ Data Ingestion ] <---- [ Shopify Webhooks ]
           |       (Validation, Dedupe)
           |            |
           |            v
           |       [ BullMQ / Redis ]
           |            |
           |            +--> [ Price Scraper ]
           |            +--> [ Report Engine ]
           |
           +-----> [ Real-time Engine ] <--- [ WebSockets ]
           |
           +-----> [ Elasticsearch ] <------ [ Search / Filtering ]

[ Observability: Prometheus / Grafana / Sentry / ELK ]`}
          </pre>
        </div>
      </section>

      {/* 2. Service-by-Service Breakdown */}
      <section>
        <div className="flex items-center gap-3 mb-8">
          <Server className="text-blue-600" size={24} />
          <h3 className="text-xl font-bold text-slate-800">Service Catalog</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ServiceCard 
            icon={<ShieldCheck size={20} />}
            title="Tenant Resolver"
            description="Intercepts every request to extract and validate the tenant context from JWT. Injects 'store_id' into the request lifecycle to prevent cross-tenant access."
          />
          <ServiceCard 
            icon={<Repeat size={20} />}
            title="Data Ingestion"
            description="Dedicated high-throughput service for Shopify webhooks. Handles payload validation, schema normalization, and idempotency checks to prevent duplicate orders."
          />
          <ServiceCard 
            icon={<CreditCard size={20} />}
            title="Billing Service"
            description="Centralized Stripe integration. Manages subscriptions, usage-based billing, and provides feature-flag toggles based on active plan status."
          />
          <ServiceCard 
            icon={<Cpu size={20} />}
            title="Internal AI Service"
            description="An abstraction layer over LLMs (Gemini). Provides standard interfaces for market grounding and sentiment analysis, preventing vendor lock-in."
          />
          <ServiceCard 
            icon={<Database size={20} />}
            title="Database Layer"
            description="Primary PostgreSQL for writes, Read Replicas for heavy dashboard queries, and TimescaleDB for high-velocity competitor price history."
          />
          <ServiceCard 
            icon={<Activity size={20} />}
            title="Observability Stack"
            description="Integrated logging (ELK), metrics (Prometheus), and error tracking (Sentry) providing full-stack visibility and proactive alerting."
          />
        </div>
      </section>

      {/* 3. Data Flow & Security Model */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <section className="bg-slate-50 p-8 rounded-3xl border border-slate-100">
          <div className="flex items-center gap-3 mb-6">
            <Share2 className="text-blue-600" size={24} />
            <h3 className="text-xl font-bold text-slate-800">Data Flow Lifecycle</h3>
          </div>
          <div className="space-y-6">
            <FlowStep 
              number="01" 
              title="Ingestion" 
              text="Shopify sends a webhook. The Ingestion Service validates HMAC, normalizes the JSON, and pushes to BullMQ." 
            />
            <FlowStep 
              number="02" 
              title="Processing" 
              text="Workers pick up jobs, update the Primary DB, and trigger the Real-time Engine to notify connected clients." 
            />
            <FlowStep 
              number="03" 
              title="Intelligence" 
              text="The AI Service Layer asynchronously analyzes the new data for anomalies or market trends using Gemini." 
            />
            <FlowStep 
              number="04" 
              title="Consumption" 
              text="Users view dashboards. Queries are routed to Read Replicas or Elasticsearch for sub-second response times." 
            />
          </div>
        </section>

        <section className="bg-blue-600 p-8 rounded-3xl text-white shadow-xl shadow-blue-200">
          <div className="flex items-center gap-3 mb-6">
            <Lock size={24} />
            <h3 className="text-xl font-bold">Security & Isolation</h3>
          </div>
          <div className="space-y-6">
            <div className="border-l-2 border-blue-400 pl-4">
              <p className="font-bold mb-1">Strict Multi-Tenancy</p>
              <p className="text-blue-100 text-sm">PostgreSQL Row Level Security (RLS) ensures that even with a shared database, data is logically siloed at the engine level.</p>
            </div>
            <div className="border-l-2 border-blue-400 pl-4">
              <p className="font-bold mb-1">AES-256 Encryption</p>
              <p className="text-blue-100 text-sm">All sensitive credentials (Shopify tokens) are encrypted at rest using AES-256-GCM with rotating master keys.</p>
            </div>
            <div className="border-l-2 border-blue-400 pl-4">
              <p className="font-bold mb-1">JWT + Tenant Context</p>
              <p className="text-blue-100 text-sm">The Tenant Resolver ensures that the `store_id` in the JWT matches the resource being accessed, preventing IDOR attacks.</p>
            </div>
          </div>
        </section>
      </div>

      {/* 4. Scaling & Multi-Tenant Strategy */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div>
          <div className="flex items-center gap-3 mb-6">
            <Zap className="text-amber-500" size={24} />
            <h3 className="text-xl font-bold text-slate-800">Scaling Model</h3>
          </div>
          <ul className="space-y-4 text-slate-600">
            <li className="flex items-start gap-3">
              <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
              <span><strong className="text-slate-900">Horizontal Pod Autoscaling:</strong> Core API and Ingestion services scale based on CPU/Memory pressure.</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
              <span><strong className="text-slate-900">Database Sharding Ready:</strong> While currently using RLS, the schema is designed for future sharding by `store_id`.</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
              <span><strong className="text-slate-900">Edge Caching:</strong> Static assets and common API responses are cached at the CDN level (Cloudflare).</span>
            </li>
          </ul>
        </div>
        <div>
          <div className="flex items-center gap-3 mb-6">
            <Eye className="text-emerald-500" size={24} />
            <h3 className="text-xl font-bold text-slate-800">Observability & Reliability</h3>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">System Health</span>
              <span className="text-xs font-black text-emerald-500 bg-emerald-50 px-2 py-1 rounded">99.99% Uptime</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 w-[99%]" />
            </div>
            <p className="text-sm text-slate-500">
              Real-time monitoring via Prometheus metrics and structured logging allows for <strong className="text-slate-700">MTTR (Mean Time To Recovery)</strong> of under 5 minutes.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Billing & Feature Control */}
      <section className="bg-slate-900 rounded-3xl p-10 text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="max-w-xl">
            <div className="flex items-center gap-3 mb-4">
              <CreditCard className="text-blue-400" size={24} />
              <h3 className="text-2xl font-bold">Billing Service Integration</h3>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Our dedicated Billing Service acts as the gatekeeper for feature access. It synchronizes with Stripe webhooks to maintain real-time subscription status, which is then cached in Redis for high-performance authorization checks across all microservices.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-800 rounded-2xl border border-slate-700">
              <p className="text-[10px] font-black text-blue-400 uppercase mb-1">Integration</p>
              <p className="text-sm font-bold">Stripe Billing</p>
            </div>
            <div className="p-4 bg-slate-800 rounded-2xl border border-slate-700">
              <p className="text-[10px] font-black text-blue-400 uppercase mb-1">Logic</p>
              <p className="text-sm font-bold">Plan Toggles</p>
            </div>
            <div className="p-4 bg-slate-800 rounded-2xl border border-slate-700">
              <p className="text-[10px] font-black text-blue-400 uppercase mb-1">Security</p>
              <p className="text-sm font-bold">Webhook HMAC</p>
            </div>
            <div className="p-4 bg-slate-800 rounded-2xl border border-slate-700">
              <p className="text-[10px] font-black text-blue-400 uppercase mb-1">Cache</p>
              <p className="text-sm font-bold">Redis Auth</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

const ServiceCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4">
      {icon}
    </div>
    <h4 className="font-bold text-slate-900 mb-2">{title}</h4>
    <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
  </div>
);

const FlowStep = ({ number, title, text }: { number: string, title: string, text: string }) => (
  <div className="flex gap-4">
    <div className="text-2xl font-black text-blue-200 mono leading-none">{number}</div>
    <div>
      <h4 className="font-bold text-slate-800 mb-1">{title}</h4>
      <p className="text-sm text-slate-500 leading-relaxed">{text}</p>
    </div>
  </div>
);

export default ArchitectSpec;
