
import { 
  User, 
  Store, 
  Product, 
  Order, 
  PlanType, 
  Invoice, 
  UsageStats, 
  PaymentMethod, 
  CompetitorPrice, 
  PriceAlert,
  AIRecommendation,
  StoreSettings,
  UserSession,
  SecurityActivity
} from '@/types';
import { GoogleGenAI } from "@google/genai";

class LocalDatabase {
  private STORAGE_KEY = 'sales_insights_pro_db_v3';

  constructor() {
    if (typeof window !== 'undefined' && !localStorage.getItem(this.STORAGE_KEY)) {
      this.save({
        users: [],
        stores: [],
        products: [],
        orders: [],
        invoices: [],
        usage: {},
        competitorPrices: [],
        priceAlerts: [],
        aiRecommendations: [],
        storeSettings: [],
        sessions: [],
        securityActivity: []
      });
    }
  }

  private get data() {
    if (typeof window === 'undefined') return this.getEmptyData();
    const d = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '{}');
    return {
      ...this.getEmptyData(),
      ...d
    };
  }

  private getEmptyData() {
    return {
      users: [],
      stores: [],
      products: [],
      orders: [],
      invoices: [],
      usage: {},
      competitorPrices: [],
      priceAlerts: [],
      aiRecommendations: [],
      storeSettings: [],
      sessions: [],
      securityActivity: []
    };
  }

  private save(data: any) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    }
  }

  async register(email: string, password: string): Promise<User> {
    const d = this.data;
    if (d.users.find((u: any) => u.email === email)) throw new Error("Email exists");
    const newUser: User = { 
      id: `u-${Date.now()}`, 
      email, 
      plan: 'free', 
      status: 'active', 
      createdAt: new Date().toISOString(),
      name: email.split('@')[0]
    };
    d.users.push({ ...newUser, password });
    this.save(d);
    return newUser;
  }

  async login(email: string, password: string): Promise<User> {
    const d = this.data;
    const user = d.users.find((u: any) => u.email === email && u.password === password);
    if (!user) throw new Error("Invalid credentials");
    const { password: _, ...safeUser } = user;
    return safeUser;
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    const d = this.data;
    const idx = d.users.findIndex((u: any) => u.id === userId);
    if (idx !== -1) {
      d.users[idx] = { ...d.users[idx], ...updates };
      const { password: _, ...safeUser } = d.users[idx];
      this.save(d);
      return safeUser;
    }
    throw new Error("User not found");
  }

  async updateUserPlan(userId: string, plan: PlanType): Promise<void> {
    const d = this.data;
    const idx = d.users.findIndex((u: any) => u.id === userId);
    if (idx !== -1) {
      d.users[idx].plan = plan;
      this.save(d);
    }
  }

  async createStore(userId: string, name: string, platform: 'shopify' | 'csv'): Promise<Store> {
    const d = this.data;
    const newStore: Store = { id: `s-${Date.now()}`, name, platform, createdAt: new Date().toISOString() };
    d.stores.push(newStore);
    const userIdx = d.users.findIndex((u: any) => u.id === userId);
    if (userIdx !== -1) d.users[userIdx].storeId = newStore.id;
    this.save(d);
    return newStore;
  }

  async seedStoreData(storeId: string) {
    const d = this.data;
    d.products = d.products.filter((p: any) => p.storeId !== storeId);
    d.orders = d.orders.filter((o: any) => o.storeId !== storeId);

    const products: Product[] = [
      { id: 'p1', storeId, name: 'Premium Coffee Grinder', sku: 'CG-001', price: 129.99, cost: 45.00, stock: 12, status: 'active' },
      { id: 'p2', storeId, name: 'Gooseneck Kettle', sku: 'GK-99', price: 89.00, cost: 32.00, stock: 4, status: 'active' },
      { id: 'p3', storeId, name: 'Ceramic Pour Over', sku: 'CPO-5', price: 24.50, cost: 8.00, stock: 142, status: 'active' }
    ];
    const customers = [
      { name: 'John Doe', email: 'john@example.com' },
      { name: 'Jane Smith', email: 'jane@example.com' },
      { name: 'Alice Johnson', email: 'alice@example.com' },
      { name: 'Bob Miller', email: 'bob@example.com' },
      { name: 'Carol White', email: 'carol@example.com' }
    ];
    const orders: Order[] = [];
    const now = new Date();
    for(let i=0; i<50; i++) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      const dailyOrders = 2 + Math.floor(Math.random() * 3);
      for(let j=0; j<dailyOrders; j++) {
        const prod = products[Math.floor(Math.random() * products.length)];
        const customer = customers[Math.floor(Math.random() * customers.length)];
        const totalPrice = prod.price;
        const productCost = prod.cost;
        const shippingCost = 5.00;
        const transactionFee = totalPrice * 0.029 + 0.30;
        const tax = totalPrice * 0.08;
        const netProfit = totalPrice - (productCost + shippingCost + transactionFee + tax);

        orders.push({
          id: `o-${i}-${j}`,
          storeId,
          shopifyOrderId: `sh-${1000 + i * 10 + j}`,
          customerName: customer.name,
          customerEmail: customer.email,
          totalPrice,
          productCost,
          shippingCost,
          transactionFee,
          tax,
          netProfit,
          status: Math.random() > 0.1 ? 'fulfilled' : 'unfulfilled',
          createdAt: date.toISOString(),
          items: [{ name: prod.name, quantity: 1, price: prod.price }]
        });
      }
    }
    d.products = [...d.products, ...products];
    d.orders = [...d.orders, ...orders];
    this.save(d);
  }

  async getOrders(storeId: string, options: { 
    search?: string, 
    status?: string, 
    dateRange?: { start: string, end: string },
    profitRange?: { min: number, max: number },
    page?: number,
    limit?: number
  } = {}): Promise<{ orders: Order[], total: number }> {
    const d = this.data;
    let filtered = d.orders.filter((o: any) => o.storeId === storeId);

    if (options.search) {
      const s = options.search.toLowerCase();
      filtered = filtered.filter((o: any) => 
        o.customerName.toLowerCase().includes(s) || 
        o.customerEmail.toLowerCase().includes(s) || 
        o.shopifyOrderId.toLowerCase().includes(s)
      );
    }

    if (options.status && options.status !== 'all') {
      filtered = filtered.filter((o: any) => o.status === options.status);
    }

    if (options.dateRange) {
      filtered = filtered.filter((o: any) => 
        o.createdAt >= options.dateRange!.start && 
        o.createdAt <= options.dateRange!.end
      );
    }

    if (options.profitRange) {
      filtered = filtered.filter((o: any) => 
        o.netProfit >= options.profitRange!.min && 
        o.netProfit <= options.profitRange!.max
      );
    }

    filtered.sort((a: any, b: any) => (b.createdAt || '').localeCompare(a.createdAt || ''));

    const total = filtered.length;
    const page = options.page || 1;
    const limit = options.limit || 10;
    const orders = filtered.slice((page - 1) * limit, page * limit);

    return { orders, total };
  }

  async syncShopifyOrders(storeId: string): Promise<void> {
    const d = this.data;
    // Simulate Shopify Order Sync
    const newOrders: Order[] = [
      {
        id: `o-sync-${Date.now()}`,
        storeId,
        shopifyOrderId: `sh-${Date.now()}`,
        customerName: 'New Shopify Customer',
        customerEmail: 'new@shopify.com',
        totalPrice: 150.00,
        productCost: 60.00,
        shippingCost: 10.00,
        transactionFee: 4.65,
        tax: 12.00,
        netProfit: 63.35,
        status: 'fulfilled',
        createdAt: new Date().toISOString(),
        items: [{ name: 'Sync Product', quantity: 1, price: 150.00 }]
      }
    ];
    d.orders = [...newOrders, ...d.orders];
    this.save(d);
  }

  async getProducts(storeId: string): Promise<Product[]> {
    return this.data.products.filter((p: any) => p.storeId === storeId);
  }

  async updateProductPrice(productId: string, newPrice: number): Promise<void> {
    const d = this.data;
    const idx = d.products.findIndex((p: any) => p.id === productId);
    if (idx !== -1) {
      d.products[idx].price = newPrice;
      this.save(d);
    }
  }

  async addProduct(product: Omit<Product, 'id'>): Promise<Product> {
    const d = this.data;
    const newProduct: Product = { ...product, id: `p-${Date.now()}` };
    d.products.push(newProduct);
    this.save(d);
    return newProduct;
  }

  async updateProduct(productId: string, updates: Partial<Product>): Promise<void> {
    const d = this.data;
    const idx = d.products.findIndex((p: any) => p.id === productId);
    if (idx !== -1) {
      d.products[idx] = { ...d.products[idx], ...updates };
      this.save(d);
    }
  }

  async syncShopifyProducts(storeId: string): Promise<void> {
    const d = this.data;
    // Simulate Shopify Sync
    const shopifyProducts = [
      { name: 'Shopify French Press', sku: 'SFP-101', price: 45.00, cost: 15.00, stock: 50, status: 'active' as const },
      { name: 'Shopify Espresso Machine', sku: 'SEM-202', price: 599.00, cost: 250.00, stock: 5, status: 'active' as const }
    ];

    shopifyProducts.forEach(sp => {
      const existingIdx = d.products.findIndex((p: any) => p.sku === sp.sku && p.storeId === storeId);
      if (existingIdx !== -1) {
        d.products[existingIdx] = { ...d.products[existingIdx], ...sp };
      } else {
        d.products.push({ ...sp, id: `p-sh-${Date.now()}-${Math.random()}`, storeId });
      }
    });
    this.save(d);
  }

  async getDashboardStats(storeId: string) {
    const d = this.data;
    const orders = d.orders.filter((o: any) => o.storeId === storeId);
    const products = d.products.filter((p: any) => p.storeId === storeId);
    
    const revenue = orders.reduce((sum: number, o: any) => sum + o.totalPrice, 0);
    const profit = orders.reduce((sum: number, o: any) => sum + o.netProfit, 0);
    const orderCount = orders.length;
    
    // Calculate CLV
    const customerOrders: Record<string, number> = {};
    orders.forEach((o: any) => {
      customerOrders[o.customerEmail] = (customerOrders[o.customerEmail] || 0) + o.totalPrice;
    });
    const customers = Object.values(customerOrders);
    const clv = customers.length > 0 ? customers.reduce((a, b) => a + b, 0) / customers.length : 0;

    // Daily Data
    const dailyRevenue: Record<string, number> = {};
    const dailyProfit: Record<string, number> = {};
    const dailyOrders: Record<string, number> = {};
    
    orders.forEach((o: any) => {
      const date = (o.createdAt || new Date().toISOString()).split('T')[0];
      dailyRevenue[date] = (dailyRevenue[date] || 0) + (o.totalPrice || 0);
      dailyProfit[date] = (dailyProfit[date] || 0) + (o.netProfit || 0);
      dailyOrders[date] = (dailyOrders[date] || 0) + 1;
    });

    const revenueChart = Object.entries(dailyRevenue)
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const profitChart = Object.entries(dailyProfit)
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const ordersChart = Object.entries(dailyOrders)
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Top Products with Revenue & Profit
    const productStats: Record<string, { name: string, revenue: number, profit: number }> = {};
    orders.forEach((o: any) => {
      (o.items || []).forEach((item: any) => {
        if (!productStats[item.name]) {
          productStats[item.name] = { name: item.name, revenue: 0, profit: 0 };
        }
        productStats[item.name].revenue += item.price * item.quantity;
        // Estimate profit per item if not directly in order items
        const p = products.find((prod: any) => prod.name === item.name);
        if (p) {
          productStats[item.name].profit += (p.price - p.cost) * item.quantity;
        }
      });
    });

    const topProducts = Object.values(productStats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Critical Alerts
    const alerts = [];
    products.forEach((p: any) => {
      if (p.stock < 10) {
        alerts.push({ id: `alert-stock-${p.id}`, type: 'stock', severity: 'high', message: `Low stock: ${p.name} (${p.stock} left)`, timestamp: new Date().toISOString() });
      }
    });
    
    // Simulated profit/sales drop alerts
    if (profit < 1000) {
      alerts.push({ id: 'alert-profit-drop', type: 'price', severity: 'medium', message: 'Net profit is below $1,000 threshold this month.', timestamp: new Date().toISOString() });
    }

    return { 
      revenue, 
      profit, 
      orderCount, 
      clv,
      products,
      topProducts,
      revenueChart,
      profitChart,
      ordersChart,
      alerts
    };
  }

  async getInvoices(userId: string): Promise<Invoice[]> {
    const d = this.data;
    // Mock invoices if none exist
    if (!d.invoices || d.invoices.length === 0) {
      return [
        { id: 'inv_1', amount: 49.00, status: 'paid', date: '2024-02-01', pdfUrl: '#' },
        { id: 'inv_2', amount: 49.00, status: 'paid', date: '2024-01-01', pdfUrl: '#' }
      ];
    }
    return d.invoices.filter((i: any) => i.userId === userId);
  }

  async getUsage(userId: string): Promise<UsageStats> {
    const d = this.data;
    return d.usage[userId] || {
      ordersAnalyzed: 1240,
      reportsGenerated: 12,
      aiTokensUsed: 45000
    };
  }

  async getPaymentMethod(userId: string): Promise<PaymentMethod | null> {
    return {
      brand: 'visa',
      last4: '4242',
      expMonth: 12,
      expYear: 2025
    };
  }

  async saveCompetitorPrice(price: Omit<CompetitorPrice, 'id'>): Promise<CompetitorPrice> {
    const d = this.data;
    const newPrice: CompetitorPrice = { ...price, id: `cp-${Date.now()}-${Math.random()}` };
    if (!d.competitorPrices) d.competitorPrices = [];
    d.competitorPrices.push(newPrice);
    this.save(d);
    return newPrice;
  }

  async getCompetitorPrices(productId: string): Promise<CompetitorPrice[]> {
    const d = this.data;
    if (!d.competitorPrices) return [];
    return d.competitorPrices.filter((p: any) => p.productId === productId);
  }

  async savePriceAlert(alert: Omit<PriceAlert, 'id'>): Promise<PriceAlert> {
    const d = this.data;
    const newAlert: PriceAlert = { ...alert, id: `pa-${Date.now()}-${Math.random()}` };
    if (!d.priceAlerts) d.priceAlerts = [];
    d.priceAlerts.push(newAlert);
    this.save(d);
    return newAlert;
  }

  async getPriceAlerts(storeId: string): Promise<PriceAlert[]> {
    const d = this.data;
    if (!d.priceAlerts) return [];
    return d.priceAlerts.filter((a: any) => a.storeId === storeId);
  }

  // AI Recommendations
  async getRecommendations(storeId: string): Promise<AIRecommendation[]> {
    const d = this.data;
    return (d.aiRecommendations || []).filter((r: any) => r.storeId === storeId);
  }

  async generateRecommendations(storeId: string): Promise<void> {
    const d = this.data;
    const products = d.products.filter((p: any) => p.storeId === storeId);
    const orders = d.orders.filter((o: any) => o.storeId === storeId);
    
    // Mock generation logic
    const recommendations: AIRecommendation[] = [
      {
        id: `rec-${Date.now()}-1`,
        storeId,
        type: 'pricing',
        title: 'Optimize Price for Coffee Grinder',
        description: 'Competitor analysis shows you can increase price by 5% without losing volume.',
        actionType: 'price_update',
        actionPayload: { productId: 'p1', newPrice: 136.50, oldPrice: 129.99 },
        confidenceScore: 92,
        estimatedProfitImpact: 450,
        status: 'pending',
        createdAt: new Date().toISOString()
      },
      {
        id: `rec-${Date.now()}-2`,
        storeId,
        type: 'inventory',
        title: 'Restock Gooseneck Kettle',
        description: 'Current stock is 4. Based on sales velocity, you will be out of stock in 3 days.',
        actionType: 'restock',
        actionPayload: { productId: 'p2', quantity: 20 },
        confidenceScore: 98,
        estimatedProfitImpact: 1200,
        status: 'pending',
        createdAt: new Date().toISOString()
      }
    ];

    d.aiRecommendations = [...(d.aiRecommendations || []), ...recommendations];
    this.save(d);
  }

  async applyRecommendation(recId: string): Promise<void> {
    const d = this.data;
    const idx = d.aiRecommendations.findIndex((r: any) => r.id === recId);
    if (idx === -1) return;

    const rec = d.aiRecommendations[idx];
    if (rec.status !== 'pending') return;

    // Execute Action
    if (rec.actionType === 'price_update' || rec.actionType === 'discount') {
      const pIdx = d.products.findIndex((p: any) => p.id === rec.actionPayload.productId);
      if (pIdx !== -1) d.products[pIdx].price = rec.actionPayload.newPrice;
    } else if (rec.actionType === 'restock') {
      const pIdx = d.products.findIndex((p: any) => p.id === rec.actionPayload.productId);
      if (pIdx !== -1) d.products[pIdx].stock += rec.actionPayload.quantity;
    }

    d.aiRecommendations[idx].status = 'applied';
    this.save(d);
  }

  async undoRecommendation(recId: string): Promise<void> {
    const d = this.data;
    const idx = d.aiRecommendations.findIndex((r: any) => r.id === recId);
    if (idx === -1) return;

    const rec = d.aiRecommendations[idx];
    if (rec.status !== 'applied') return;

    // Reverse Action
    if (rec.actionType === 'price_update' || rec.actionType === 'discount') {
      const pIdx = d.products.findIndex((p: any) => p.id === rec.actionPayload.productId);
      if (pIdx !== -1) d.products[pIdx].price = rec.actionPayload.oldPrice || d.products[pIdx].price;
    } else if (rec.actionType === 'restock') {
      const pIdx = d.products.findIndex((p: any) => p.id === rec.actionPayload.productId);
      if (pIdx !== -1) d.products[pIdx].stock -= rec.actionPayload.quantity;
    }

    d.aiRecommendations[idx].status = 'pending';
    this.save(d);
  }

  async dismissRecommendation(recId: string): Promise<void> {
    const d = this.data;
    const idx = d.aiRecommendations.findIndex((r: any) => r.id === recId);
    if (idx !== -1) {
      d.aiRecommendations[idx].status = 'dismissed';
      this.save(d);
    }
  }

  // Store Settings
  async getStoreSettings(storeId: string): Promise<StoreSettings> {
    const d = this.data;
    const settings = (d.storeSettings || []).find((s: any) => s.storeId === storeId);
    if (settings) return settings;

    // Default settings
    const store = d.stores.find((s: any) => s.id === storeId);
    return {
      storeId,
      storeName: store?.name || 'My Store',
      domain: `${store?.name?.toLowerCase().replace(/\s+/g, '-')}.myshopify.com`,
      webhooksEnabled: true,
      priceScrapingEnabled: true,
      aiReportsEnabled: true,
      inventoryAutoResetEnabled: false,
      updatedAt: new Date().toISOString()
    };
  }

  async saveStoreSettings(settings: StoreSettings): Promise<void> {
    const d = this.data;
    const idx = d.storeSettings.findIndex((s: any) => s.storeId === settings.storeId);
    if (idx !== -1) {
      d.storeSettings[idx] = { ...settings, updatedAt: new Date().toISOString() };
    } else {
      d.storeSettings.push({ ...settings, updatedAt: new Date().toISOString() });
    }
    this.save(d);
  }

  // Sessions & Activity
  async getSessions(userId: string): Promise<UserSession[]> {
    return [
      { id: 'sess-1', userId, device: 'MacBook Pro - Chrome', location: 'San Francisco, US', ip: '192.168.1.1', lastActive: new Date().toISOString() },
      { id: 'sess-2', userId, device: 'iPhone 15 - Safari', location: 'San Francisco, US', ip: '192.168.1.2', lastActive: new Date(Date.now() - 86400000).toISOString() }
    ];
  }

  async getSecurityActivity(userId: string): Promise<SecurityActivity[]> {
    return [
      { id: 'act-1', userId, type: 'login', timestamp: new Date().toISOString(), ip: '192.168.1.1' },
      { id: 'act-2', userId, type: 'password_change', timestamp: new Date(Date.now() - 172800000).toISOString(), ip: '192.168.1.1' }
    ];
  }
}

export const db = new LocalDatabase();
