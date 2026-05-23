// WooCommerce API Proxy - Siparisler
// Vercel Serverless Function

const WC_URL = process.env.WOOCOMMERCE_URL || 'https://provanya.com';
const WC_KEY = process.env.WOOCOMMERCE_KEY || '';
const WC_SECRET = process.env.WOOCOMMERCE_SECRET || '';

export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
  const url = new URL(request.url);
  const params = url.searchParams;
  
  if (request.method === 'GET') {
    // Siparisleri listele
    const wcUrl = new URL(`${WC_URL}/wp-json/wc/v3/orders`);
    params.forEach((value, key) => {
      wcUrl.searchParams.set(key, value);
    });
    wcUrl.searchParams.set('per_page', '50');
    
    try {
      const response = await fetch(wcUrl.toString(), {
        headers: {
          'Authorization': 'Basic ' + btoa(`${WC_KEY}:${WC_SECRET}`),
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        return new Response(JSON.stringify({ error: 'WooCommerce API error' }), {
          status: response.status,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
      const orders = await response.json();
      return new Response(JSON.stringify(orders), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('WooCommerce fetch error:', error);
      return new Response(JSON.stringify({ error: 'Failed to fetch orders' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }
  
  if (request.method === 'POST') {
    // Yeni siparis olustur
    try {
      const body = await request.json();
      
      const response = await fetch(`${WC_URL}/wp-json/wc/v3/orders`, {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + btoa(`${WC_KEY}:${WC_SECRET}`),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...body,
          status: 'pending', // Odeme bekliyor
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        return new Response(JSON.stringify({ error: error.message || 'Order creation failed' }), {
          status: response.status,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
      const order = await response.json();
      return new Response(JSON.stringify(order), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Order creation error:', error);
      return new Response(JSON.stringify({ error: 'Failed to create order' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }
  
  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json' },
  });
}
