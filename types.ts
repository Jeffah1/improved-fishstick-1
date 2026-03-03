
export type PlanType = 'free' | 'pro';

export interface User {
  id: string;
  name?: string;
  email: string;
  password?: string;
  avatarUrl?: string;
  plan: PlanType;
  status: 'active' | 'suspended' | 'pending';
  storeId?: string;
  stripeCustomerId?: string;
  subscriptionId?: string;
  subscriptionStatus?: string;
  createdAt: string;
  twoFactorEnabled?: boolean;
}

export interface Store {
  id: string;
  name: string;
  platform: 'shopify' | 'csv';
  createdAt: string;
}

export interface Product {
  id: string;
  storeId: string;
  name: string;
  sku: string;
  price: number;
  cost: number;
  stock: number;
  status: 'active' | 'draft' | 'archived';
}

export interface Order {
  id: string;
  storeId: string;
  shopifyOrderId: string;
  customerName: string;
  customerEmail: string;
  totalPrice: number;
  productCost: number;
  shippingCost: number;
  transactionFee: number;
  tax: number;
  netProfit: number;
  status: 'fulfilled' | 'unfulfilled' | 'cancelled' | 'refunded';
  createdAt: string;
  items: { name: string; quantity: number; price: number }[];
}

export interface Alert {
  id: string;
  type: 'stock' | 'price' | 'sales';
  severity: 'low' | 'medium' | 'high';
  message: string;
  timestamp: string;
  read: boolean;
}

export enum AppTab {
  DASHBOARD = 'dashboard',
  ORDERS = 'orders',
  PRODUCTS = 'products',
  ARCHITECT = 'architect',
  COMPETITORS = 'competitors',
  VOICE = 'voice',
  GENERATOR = 'generator',
  BILLING = 'billing',
  SETTINGS = 'settings',
  PROFILE = 'profile',
  RECOMMENDATIONS = 'recommendations'
}

export type WidgetType = 
  | 'REVENUE_CHART' 
  | 'PROFIT_CHART'
  | 'ORDERS_CHART'
  | 'TOP_PRODUCTS' 
  | 'CRITICAL_ALERTS' 
  | 'METRIC_REVENUE' 
  | 'METRIC_PROFIT' 
  | 'METRIC_ORDERS' 
  | 'METRIC_CLV' 
  | 'AI_INSIGHTS';

export interface WidgetInstance {
  id: string;
  type: WidgetType;
  w: number;
}

export interface Invoice {
  id: string;
  amount: number;
  status: string;
  date: string;
  pdfUrl: string;
}

export interface UsageStats {
  ordersAnalyzed: number;
  reportsGenerated: number;
  aiTokensUsed: number;
}

export interface PaymentMethod {
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
}

export interface CompetitorPrice {
  id: string;
  storeId: string;
  productId: string;
  competitorName: string;
  price: number;
  url: string;
  currency: string;
  stockStatus: string;
  timestamp: string;
}

export interface PriceAlert {
  id: string;
  storeId: string;
  productId: string;
  competitorName: string;
  competitorPrice: number;
  ourPrice: number;
  difference: number;
  percentage: number;
  thresholdType: 'percent' | 'floor';
  timestamp: string;
  read: boolean;
}

export interface AIRecommendation {
  id: string;
  storeId: string;
  type: 'pricing' | 'inventory' | 'marketing';
  title: string;
  description: string;
  actionType: 'price_update' | 'restock' | 'discount';
  actionPayload: any;
  confidenceScore: number;
  estimatedProfitImpact: number;
  status: 'pending' | 'applied' | 'dismissed';
  createdAt: string;
}

export interface StoreSettings {
  storeId: string;
  storeName: string;
  domain: string;
  webhooksEnabled: boolean;
  priceScrapingEnabled: boolean;
  aiReportsEnabled: boolean;
  inventoryAutoResetEnabled: boolean;
  updatedAt: string;
}

export interface UserSession {
  id: string;
  userId: string;
  device: string;
  location: string;
  ip: string;
  lastActive: string;
}

export interface SecurityActivity {
  id: string;
  userId: string;
  type: 'login' | 'password_change' | '2fa_enable' | '2fa_disable';
  timestamp: string;
  ip: string;
}
