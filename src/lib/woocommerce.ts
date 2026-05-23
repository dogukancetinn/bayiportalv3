// BayiPortal - WooCommerce REST API Entegrasyonu
// provanya.com ile entegre calisir

export interface WCProduct {
  id: number;
  name: string;
  slug: string;
  sku: string;
  price: string;
  regular_price: string;
  sale_price: string;
  on_sale: boolean;
  featured: boolean;
  purchasable: boolean;
  total_sales: number;
  stock_quantity: number | null;
  stock_status: string;
  manage_stock: boolean;
  short_description: string;
  description: string;
  categories: { id: number; name: string; slug: string }[];
  images: { id: number; src: string; alt: string }[];
  attributes: { id: number; name: string; options: string[] }[];
}

export interface WCOrder {
  id: number;
  number: string;
  status: string;
  date_created: string;
  total: string;
  currency: string;
  billing: {
    first_name: string;
    last_name: string;
    company: string;
    email: string;
    phone: string;
  };
  line_items: { 
    id: number;
    name: string; 
    quantity: number; 
    subtotal: string; 
    total: string;
    product_id: number;
  }[];
  payment_url?: string;
}

export interface WCCategory {
  id: number;
  name: string;
  slug: string;
  count: number;
  parent: number;
}

export interface WCCustomer {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  username: string;
  role: string;
  billing: {
    company: string;
    phone: string;
    address_1: string;
    city: string;
  };
  meta_data: { key: string; value: string }[];
}

const API_BASE = '/api/woocommerce';

// API Helper
async function wcFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'API error' }));
    throw new Error(error.message || 'API request failed');
  }
  
  return response.json();
}

// Urunleri cek
export async function fetchProducts(params?: Record<string, string>): Promise<WCProduct[]> {
  const searchParams = new URLSearchParams(params);
  return wcFetch<WCProduct[]>(`/products?${searchParams}`);
}

// Kategorileri cek
export async function fetchCategories(): Promise<WCCategory[]> {
  return wcFetch<WCCategory[]>('/categories');
}

// Kullanici siparislerini cek
export async function fetchOrders(customerId: number): Promise<WCOrder[]> {
  return wcFetch<WCOrder[]>(`/orders?customer=${customerId}`);
}

// Siparis olustur
export async function createOrder(orderData: {
  customer_id: number;
  billing: {
    first_name: string;
    last_name: string;
    company: string;
    email: string;
    phone: string;
    address_1: string;
    city: string;
  };
  line_items: {
    product_id: number;
    quantity: number;
  }[];
  payment_method?: string;
  set_paid?: boolean;
}): Promise<WCOrder> {
  return wcFetch<WCOrder>('/orders', {
    method: 'POST',
    body: JSON.stringify(orderData),
  });
}

// Siparis guncelle
export async function updateOrder(orderId: number, data: Partial<WCOrder>): Promise<WCOrder> {
  return wcFetch<WCOrder>(`/orders/${orderId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// Kullanici dogrulama (WordPress'ten)
export async function authenticateUser(username: string, password: string): Promise<{
  success: boolean;
  user?: WCCustomer;
  token?: string;
  error?: string;
}> {
  return wcFetch('/auth', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

// Kullanici bilgilerini cek
export async function fetchCustomer(customerId: number): Promise<WCCustomer> {
  return wcFetch<WCCustomer>(`/customers/${customerId}`);
}

// Odeme URL olustur (VakifBank sanal POS icin)
export async function createPaymentSession(orderId: number, returnUrl: string, token?: string): Promise<{
  payment_url: string;
  session_id: string;
}> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  // Bayi token'i varsa ekle (BayiPortal authentication)
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(`${API_BASE}/payment/create-session`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ order_id: orderId, return_url: returnUrl }),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Payment API error' }));
    throw new Error(error.message || error.error || 'Odeme oturumu olusturulamadi');
  }
  
  return response.json();
}

// Odeme durumunu kontrol et
export async function checkPaymentStatus(sessionId: string): Promise<{
  status: 'pending' | 'success' | 'failed';
  order_id?: number;
  message?: string;
}> {
  return wcFetch(`/payment/status?session_id=${sessionId}`);
}

// Fiyat formatlama
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);
}

// Indirimli fiyat hesaplama
export function getDealerPrice(regularPrice: string, discountRate: number): number {
  const price = parseFloat(regularPrice);
  if (isNaN(price)) return 0;
  return price * (1 - discountRate / 100);
}
