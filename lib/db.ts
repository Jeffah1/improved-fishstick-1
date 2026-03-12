
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
import { getSupabase } from './supabase';

class SupabaseDatabase {
  private get supabase() {
    return getSupabase();
  }

  // Helper to map snake_case to camelCase for User
  private mapUser(data: any): User {
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      plan: data.plan as PlanType,
      status: data.status,
      storeId: data.store_id,
      stripeCustomerId: data.stripe_customer_id,
      subscriptionId: data.subscription_id,
      subscriptionStatus: data.subscription_status,
      createdAt: data.created_at,
      twoFactorEnabled: data.two_factor_enabled
    };
  }

  async register(email: string, password: string): Promise<User> {
    const { data: authData, error: authError } = await this.supabase.auth.signUp({
      email,
      password,
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error("Registration failed");

    const newUser: any = {
      id: authData.user.id,
      email,
      plan: 'free',
      status: 'active',
      name: email.split('@')[0]
    };

    const { data, error } = await this.supabase
      .from('users')
      .insert(newUser)
      .select()
      .maybeSingle();

    if (error) throw error;
    
    if (!data) {
      // If insert didn't return data, try to fetch existing
      const { data: existingData, error: fetchError } = await this.supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .maybeSingle();
      
      if (fetchError) throw fetchError;
      if (!existingData) throw new Error("User record could not be created");
      return this.mapUser(existingData);
    }

    return this.mapUser(data);
  }

  async login(email: string, password: string): Promise<User> {
    const { data: authData, error: authError } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error("Login failed");

    let { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      // User exists in Auth but not in users table, create them
      const newUser: any = {
        id: authData.user.id,
        email,
        plan: 'free',
        status: 'active',
        name: email.split('@')[0]
      };

      const { data: insertedData, error: insertError } = await this.supabase
        .from('users')
        .insert(newUser)
        .select()
        .maybeSingle();

      if (insertError) throw insertError;
      data = insertedData;
    }

    if (!data) throw new Error("User record not found");

    return this.mapUser(data);
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    const { data, error } = await this.supabase
      .from('users')
      .update({
        name: updates.name,
        plan: updates.plan,
        status: updates.status,
        store_id: updates.storeId,
        stripe_customer_id: updates.stripeCustomerId,
        subscription_id: updates.subscriptionId,
        subscription_status: updates.subscriptionStatus,
        two_factor_enabled: updates.twoFactorEnabled
      })
      .eq('id', userId)
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error("User not found for update");
    return this.mapUser(data);
  }

  async updateUserPlan(userId: string, plan: PlanType): Promise<void> {
    const { error } = await this.supabase
      .from('users')
      .update({ plan })
      .eq('id', userId);

    if (error) throw error;
  }

  async createStore(userId: string, name: string, platform: 'shopify' | 'csv'): Promise<Store> {
    const { data: storeData, error: storeError } = await this.supabase
      .from('stores')
      .insert({ name, platform })
      .select()
      .single();

    if (storeError) throw storeError;

    const { error: userError } = await this.supabase
      .from('users')
      .update({ store_id: storeData.id })
      .eq('id', userId);

    if (userError) throw userError;

    return {
      id: storeData.id,
      name: storeData.name,
      platform: storeData.platform as 'shopify' | 'csv',
      createdAt: storeData.created_at
    };
  }

  async seedStoreData(storeId: string) {
    // Implementation for seeding Supabase with initial data
    const products = [
      { store_id: storeId, name: 'Premium Coffee Grinder', sku: 'CG-001', price: 129.99, cost: 45.00, stock: 12, status: 'active' },
      { store_id: storeId, name: 'Gooseneck Kettle', sku: 'GK-99', price: 89.00, cost: 32.00, stock: 4, status: 'active' },
      { store_id: storeId, name: 'Ceramic Pour Over', sku: 'CPO-5', price: 24.50, cost: 8.00, stock: 142, status: 'active' }
    ];

    const { error: prodError } = await this.supabase.from('products').insert(products);
    if (prodError) throw prodError;

    // Seed some orders
    const orders = [];
    const now = new Date();
    for(let i=0; i<20; i++) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      orders.push({
        store_id: storeId,
        customer_name: 'Seed Customer',
        customer_email: `seed-${i}@example.com`,
        total_price: 100,
        product_cost: 40,
        shipping_cost: 10,
        transaction_fee: 3,
        tax: 8,
        net_profit: 39,
        status: 'fulfilled',
        created_at: date.toISOString(),
        items: [{ name: 'Seed Product', quantity: 1, price: 100 }]
      });
    }

    const { error: orderError } = await this.supabase.from('orders').insert(orders);
    if (orderError) throw orderError;
  }

  async getOrders(storeId: string, options: { 
    search?: string, 
    status?: string, 
    dateRange?: { start: string, end: string },
    profitRange?: { min: number, max: number },
    page?: number,
    limit?: number
  } = {}): Promise<{ orders: Order[], total: number }> {
    let query = this.supabase
      .from('orders')
      .select('*', { count: 'exact' })
      .eq('store_id', storeId);

    if (options.search) {
      query = query.or(`customer_name.ilike.%${options.search}%,customer_email.ilike.%${options.search}%,shopify_order_id.ilike.%${options.search}%`);
    }

    if (options.status && options.status !== 'all') {
      query = query.eq('status', options.status);
    }

    if (options.dateRange) {
      query = query.gte('created_at', options.dateRange.start).lte('created_at', options.dateRange.end);
    }

    if (options.profitRange) {
      query = query.gte('net_profit', options.profitRange.min).lte('net_profit', options.profitRange.max);
    }

    const page = options.page || 1;
    const limit = options.limit || 10;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    const orders: Order[] = (data || []).map(o => ({
      id: o.id,
      storeId: o.store_id,
      shopifyOrderId: o.shopify_order_id,
      customerName: o.customer_name,
      customerEmail: o.customer_email,
      totalPrice: Number(o.total_price),
      productCost: Number(o.product_cost),
      shippingCost: Number(o.shipping_cost),
      transactionFee: Number(o.transaction_fee),
      tax: Number(o.tax),
      netProfit: Number(o.net_profit),
      status: o.status as any,
      createdAt: o.created_at,
      items: o.items
    }));

    return { orders, total: count || 0 };
  }

  async getProducts(storeId: string): Promise<Product[]> {
    const { data, error } = await this.supabase
      .from('products')
      .select('*')
      .eq('store_id', storeId);

    if (error) throw error;

    return (data || []).map(p => ({
      id: p.id,
      storeId: p.store_id,
      name: p.name,
      sku: p.sku,
      price: Number(p.price),
      cost: Number(p.cost),
      stock: p.stock,
      status: p.status as any
    }));
  }

  async updateProductPrice(productId: string, newPrice: number): Promise<void> {
    const { error } = await this.supabase
      .from('products')
      .update({ price: newPrice })
      .eq('id', productId);

    if (error) throw error;
  }

  async addProduct(product: Omit<Product, 'id'>): Promise<Product> {
    const { data, error } = await this.supabase
      .from('products')
      .insert({
        store_id: product.storeId,
        name: product.name,
        sku: product.sku,
        price: product.price,
        cost: product.cost,
        stock: product.stock,
        status: product.status
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      storeId: data.store_id,
      name: data.name,
      sku: data.sku,
      price: Number(data.price),
      cost: Number(data.cost),
      stock: data.stock,
      status: data.status as any
    };
  }

  async updateProduct(productId: string, updates: Partial<Product>): Promise<void> {
    const { error } = await this.supabase
      .from('products')
      .update({
        name: updates.name,
        sku: updates.sku,
        price: updates.price,
        cost: updates.cost,
        stock: updates.stock,
        status: updates.status
      })
      .eq('id', productId);

    if (error) throw error;
  }

  async getDashboardStats(storeId: string) {
    const { data: orders, error: orderError } = await this.supabase
      .from('orders')
      .select('*')
      .eq('store_id', storeId);

    if (orderError) throw orderError;

    const { data: products, error: prodError } = await this.supabase
      .from('products')
      .select('*')
      .eq('store_id', storeId);

    if (prodError) throw prodError;

    const revenue = orders.reduce((sum: number, o: any) => sum + Number(o.total_price), 0);
    const profit = orders.reduce((sum: number, o: any) => sum + Number(o.net_profit), 0);
    const orderCount = orders.length;
    
    const customerOrders: Record<string, number> = {};
    orders.forEach((o: any) => {
      customerOrders[o.customer_email] = (customerOrders[o.customer_email] || 0) + Number(o.total_price);
    });
    const customers = Object.values(customerOrders);
    const clv = customers.length > 0 ? customers.reduce((a, b) => a + b, 0) / customers.length : 0;

    const dailyRevenue: Record<string, number> = {};
    const dailyProfit: Record<string, number> = {};
    const dailyOrders: Record<string, number> = {};
    
    orders.forEach((o: any) => {
      const date = (o.created_at || new Date().toISOString()).split('T')[0];
      dailyRevenue[date] = (dailyRevenue[date] || 0) + Number(o.total_price);
      dailyProfit[date] = (dailyProfit[date] || 0) + Number(o.net_profit);
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

    const productStats: Record<string, { name: string, revenue: number, profit: number }> = {};
    orders.forEach((o: any) => {
      (o.items || []).forEach((item: any) => {
        if (!productStats[item.name]) {
          productStats[item.name] = { name: item.name, revenue: 0, profit: 0 };
        }
        productStats[item.name].revenue += item.price * item.quantity;
        const p = products.find((prod: any) => prod.name === item.name);
        if (p) {
          productStats[item.name].profit += (Number(p.price) - Number(p.cost)) * item.quantity;
        }
      });
    });

    const topProducts = Object.values(productStats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const alerts: any[] = [];
    products.forEach((p: any) => {
      if (p.stock < 10) {
        alerts.push({ id: `alert-stock-${p.id}`, type: 'stock', severity: 'high', message: `Low stock: ${p.name} (${p.stock} left)`, timestamp: new Date().toISOString() });
      }
    });

    return { 
      revenue, 
      profit, 
      orderCount, 
      clv,
      products: products.map(p => ({ ...p, id: p.id, storeId: p.store_id, price: Number(p.price), cost: Number(p.cost) })),
      topProducts,
      revenueChart,
      profitChart,
      ordersChart,
      alerts
    };
  }

  async getInvoices(userId: string): Promise<Invoice[]> {
    // In a real app, fetch from Stripe or a DB table
    return [
      { id: 'inv_1', amount: 49.00, status: 'paid', date: '2024-02-01', pdfUrl: '#' },
      { id: 'inv_2', amount: 49.00, status: 'paid', date: '2024-01-01', pdfUrl: '#' }
    ];
  }

  async getUsage(userId: string): Promise<UsageStats> {
    return {
      ordersAnalyzed: 1240,
      reportsGenerated: 12,
      aiTokensUsed: 45000
    };
  }

  async getPaymentMethod(userId: string): Promise<PaymentMethod | null> {
    return { brand: 'visa', last4: '4242', expMonth: 12, expYear: 2025 };
  }

  async saveCompetitorPrice(price: Omit<CompetitorPrice, 'id'>): Promise<CompetitorPrice> {
    const { data, error } = await this.supabase
      .from('competitor_prices')
      .insert({
        store_id: price.storeId,
        product_id: price.productId,
        competitor_name: price.competitorName,
        price: price.price,
        url: price.url,
        currency: price.currency,
        stock_status: price.stockStatus
      })
      .select()
      .single();

    if (error) throw error;
    return {
      ...price,
      id: data.id,
      timestamp: data.timestamp
    };
  }

  async getCompetitorPrices(productId: string): Promise<CompetitorPrice[]> {
    const { data, error } = await this.supabase
      .from('competitor_prices')
      .select('*')
      .eq('product_id', productId);

    if (error) throw error;
    return (data || []).map(p => ({
      id: p.id,
      storeId: p.store_id,
      productId: p.product_id,
      competitorName: p.competitor_name,
      price: Number(p.price),
      url: p.url,
      currency: p.currency,
      stockStatus: p.stock_status,
      timestamp: p.timestamp
    }));
  }

  async savePriceAlert(alert: Omit<PriceAlert, 'id'>): Promise<PriceAlert> {
    const { data, error } = await this.supabase
      .from('price_alerts')
      .insert({
        store_id: alert.storeId,
        product_id: alert.productId,
        competitor_name: alert.competitorName,
        competitor_price: alert.competitorPrice,
        our_price: alert.ourPrice,
        difference: alert.difference,
        percentage: alert.percentage,
        threshold_type: alert.thresholdType
      })
      .select()
      .single();

    if (error) throw error;
    return {
      ...alert,
      id: data.id,
      timestamp: data.timestamp,
      read: data.read
    };
  }

  async getPriceAlerts(storeId: string): Promise<PriceAlert[]> {
    const { data, error } = await this.supabase
      .from('price_alerts')
      .select('*')
      .eq('store_id', storeId);

    if (error) throw error;
    return (data || []).map(a => ({
      id: a.id,
      storeId: a.store_id,
      productId: a.product_id,
      competitorName: a.competitor_name,
      competitorPrice: Number(a.competitor_price),
      ourPrice: Number(a.our_price),
      difference: Number(a.difference),
      percentage: Number(a.percentage),
      thresholdType: a.threshold_type as any,
      timestamp: a.timestamp,
      read: a.read
    }));
  }

  async getRecommendations(storeId: string): Promise<AIRecommendation[]> {
    const { data, error } = await this.supabase
      .from('ai_recommendations')
      .select('*')
      .eq('store_id', storeId);

    if (error) throw error;
    return (data || []).map(r => ({
      id: r.id,
      storeId: r.store_id,
      type: r.type as any,
      title: r.title,
      description: r.description,
      actionType: r.action_type as any,
      actionPayload: r.action_payload,
      confidenceScore: r.confidence_score,
      estimatedProfitImpact: Number(r.estimated_profit_impact),
      status: r.status as any,
      createdAt: r.created_at
    }));
  }

  async generateRecommendations(storeId: string): Promise<void> {
    // Mock logic for generating recommendations and saving to Supabase
    const recommendations = [
      {
        store_id: storeId,
        type: 'pricing',
        title: 'Optimize Price for Coffee Grinder',
        description: 'Competitor analysis shows you can increase price by 5% without losing volume.',
        action_type: 'price_update',
        action_payload: { productId: 'p1', newPrice: 136.50, oldPrice: 129.99 },
        confidence_score: 92,
        estimated_profit_impact: 450,
        status: 'pending'
      }
    ];

    const { error } = await this.supabase.from('ai_recommendations').insert(recommendations);
    if (error) throw error;
  }

  async applyRecommendation(recId: string): Promise<void> {
    const { data: rec, error: getError } = await this.supabase
      .from('ai_recommendations')
      .select('*')
      .eq('id', recId)
      .single();

    if (getError || !rec) return;

    if (rec.action_type === 'price_update') {
      await this.supabase
        .from('products')
        .update({ price: rec.action_payload.newPrice })
        .eq('id', rec.action_payload.productId);
    }

    await this.supabase
      .from('ai_recommendations')
      .update({ status: 'applied' })
      .eq('id', recId);
  }

  async undoRecommendation(recId: string): Promise<void> {
    const { data: rec, error: getError } = await this.supabase
      .from('ai_recommendations')
      .select('*')
      .eq('id', recId)
      .single();

    if (getError || !rec) return;

    if (rec.action_type === 'price_update') {
      await this.supabase
        .from('products')
        .update({ price: rec.action_payload.oldPrice })
        .eq('id', rec.action_payload.productId);
    }

    await this.supabase
      .from('ai_recommendations')
      .update({ status: 'pending' })
      .eq('id', recId);
  }

  async dismissRecommendation(recId: string): Promise<void> {
    await this.supabase
      .from('ai_recommendations')
      .update({ status: 'dismissed' })
      .eq('id', recId);
  }

  async getStoreSettings(storeId: string): Promise<StoreSettings> {
    const { data, error } = await this.supabase
      .from('store_settings')
      .select('*')
      .eq('store_id', storeId)
      .single();

    if (error || !data) {
      return {
        storeId,
        storeName: 'My Store',
        domain: 'mystore.myshopify.com',
        webhooksEnabled: true,
        priceScrapingEnabled: true,
        aiReportsEnabled: true,
        inventoryAutoResetEnabled: false,
        updatedAt: new Date().toISOString()
      };
    }

    return {
      storeId: data.store_id,
      storeName: data.store_name,
      domain: data.domain,
      webhooksEnabled: data.webhooks_enabled,
      priceScrapingEnabled: data.price_scraping_enabled,
      aiReportsEnabled: data.ai_reports_enabled,
      inventoryAutoResetEnabled: data.inventory_auto_reset_enabled,
      updatedAt: data.updated_at
    };
  }

  async saveStoreSettings(settings: StoreSettings): Promise<void> {
    const { error } = await this.supabase
      .from('store_settings')
      .upsert({
        store_id: settings.storeId,
        store_name: settings.storeName,
        domain: settings.domain,
        webhooks_enabled: settings.webhooksEnabled,
        price_scraping_enabled: settings.priceScrapingEnabled,
        ai_reports_enabled: settings.aiReportsEnabled,
        inventory_auto_reset_enabled: settings.inventoryAutoResetEnabled,
        updated_at: new Date().toISOString()
      });

    if (error) throw error;
  }

  async getSessions(userId: string): Promise<UserSession[]> {
    return [];
  }

  async getSecurityActivity(userId: string): Promise<SecurityActivity[]> {
    return [];
  }

  // Mock methods for Shopify sync
  async syncShopifyOrders(storeId: string): Promise<void> {}
  async syncShopifyProducts(storeId: string): Promise<void> {}
}

export const db = new SupabaseDatabase();
