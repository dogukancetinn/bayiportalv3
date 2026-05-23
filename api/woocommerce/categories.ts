// WooCommerce API Proxy - Kategoriler
// Vercel Serverless Function

const WC_URL = process.env.WOOCOMMERCE_URL || 'https://provanya.com';
const WC_KEY = process.env.WOOCOMMERCE_KEY || '';
const WC_SECRET = process.env.WOOCOMMERCE_SECRET || '';

export const config = {
  runtime: 'edge',
};

export default async function handler() {
  const wcUrl = `${WC_URL}/wp-json/wc/v3/products/categories?per_page=100`;
  
  try {
    const response = await fetch(wcUrl, {
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
    
    const categories = await response.json();
    
    return new Response(JSON.stringify(categories), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('WooCommerce fetch error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch categories' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
