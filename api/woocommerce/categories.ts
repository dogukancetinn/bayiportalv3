// WooCommerce API Proxy - Kategoriler
// Vercel Serverless Function

const WC_URL = process.env.WOOCOMMERCE_URL || 'https://provanya.com';
const WC_KEY = process.env.WOOCOMMERCE_KEY || '';
const WC_SECRET = process.env.WOOCOMMERCE_SECRET || '';

export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
  // CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  // Check credentials
  if (!WC_KEY || !WC_SECRET) {
    console.error('[WooCommerce] API credentials not configured');
    return new Response(JSON.stringify({ 
      error: 'API credentials not configured',
      message: 'WOOCOMMERCE_KEY ve WOOCOMMERCE_SECRET ortam degiskenleri ayarlanmali'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const wcUrl = `${WC_URL}/wp-json/wc/v3/products/categories?per_page=100`;
  
  try {
    console.log('[WooCommerce] Fetching categories from:', wcUrl);
    
    const response = await fetch(wcUrl, {
      headers: {
        'Authorization': 'Basic ' + btoa(`${WC_KEY}:${WC_SECRET}`),
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[WooCommerce] API Error:', response.status, errorText);
      return new Response(JSON.stringify({ 
        error: 'WooCommerce API error',
        status: response.status,
        details: errorText
      }), {
        status: response.status,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
    
    const categories = await response.json();
    console.log('[WooCommerce] Fetched', categories.length, 'categories');
    
    return new Response(JSON.stringify(categories), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('[WooCommerce] Fetch error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch categories',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}
