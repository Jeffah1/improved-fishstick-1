-- Supabase Schema for Sales Insights Pro

-- Users table (extends auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE NOT NULL,
  plan TEXT DEFAULT 'free',
  status TEXT DEFAULT 'active',
  store_id UUID,
  stripe_customer_id TEXT,
  subscription_id TEXT,
  subscription_status TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  two_factor_enabled BOOLEAN DEFAULT false
);

-- Stores table
CREATE TABLE public.stores (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  platform TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Products table
CREATE TABLE public.products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  sku TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  cost DECIMAL(10,2) NOT NULL,
  stock INTEGER NOT NULL,
  status TEXT NOT NULL,
  UNIQUE(store_id, sku)
);

-- Orders table
CREATE TABLE public.orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  shopify_order_id TEXT,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  product_cost DECIMAL(10,2) NOT NULL,
  shipping_cost DECIMAL(10,2) NOT NULL,
  transaction_fee DECIMAL(10,2) NOT NULL,
  tax DECIMAL(10,2) NOT NULL,
  net_profit DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  items JSONB NOT NULL
);

-- Competitor Prices table
CREATE TABLE public.competitor_prices (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  competitor_name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  url TEXT,
  currency TEXT DEFAULT 'USD',
  stock_status TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Price Alerts table
CREATE TABLE public.price_alerts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  competitor_name TEXT NOT NULL,
  competitor_price DECIMAL(10,2) NOT NULL,
  our_price DECIMAL(10,2) NOT NULL,
  difference DECIMAL(10,2) NOT NULL,
  percentage DECIMAL(10,2) NOT NULL,
  threshold_type TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  read BOOLEAN DEFAULT false
);

-- AI Recommendations table
CREATE TABLE public.ai_recommendations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  action_type TEXT NOT NULL,
  action_payload JSONB NOT NULL,
  confidence_score INTEGER NOT NULL,
  estimated_profit_impact DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Store Settings table
CREATE TABLE public.store_settings (
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE PRIMARY KEY,
  store_name TEXT NOT NULL,
  domain TEXT NOT NULL,
  webhooks_enabled BOOLEAN DEFAULT true,
  price_scraping_enabled BOOLEAN DEFAULT true,
  ai_reports_enabled BOOLEAN DEFAULT true,
  inventory_auto_reset_enabled BOOLEAN DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Policies (Basic example, should be refined)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own data" ON public.users FOR SELECT USING (auth.uid() = id);

-- Add more policies as needed...
