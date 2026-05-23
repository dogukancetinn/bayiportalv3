// WooCommerce API Proxy - Urunler
// Vercel Serverless Function
// BayiPortal WordPress plugin ile entegre

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
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  const url = new URL(request.url);
  const params = url.searchParams;
  
  // Oncelikle BayiPortal endpoint'ini dene, basarisiz olursa WooCommerce API'yi kullan
  try {
    // BayiPortal endpoint - token gerektirmez, public urunleri dondurur
    const bayiPortalUrl = `${WC_URL}/wp-json/bayiportal/v1/products`;
    console.log('[WooCommerce] Trying BayiPortal endpoint:', bayiPortalUrl);
    
    const bayiResponse = await fetch(bayiPortalUrl, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (bayiResponse.ok) {
      const products = await bayiResponse.json();
      console.log('[WooCommerce] BayiPortal returned', Array.isArray(products) ? products.length : 0, 'products');
      
      return new Response(JSON.stringify(products), {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
    
    console.log('[WooCommerce] BayiPortal failed, falling back to WC API');
  } catch (e) {
    console.log('[WooCommerce] BayiPortal error, falling back to WC API:', e);
  }
  
  // Fallback: WooCommerce REST API
  const wcUrl = new URL(`${WC_URL}/wp-json/wc/v3/products`);
  
  // Parametreleri aktar
  params.forEach((value, key) => {
    wcUrl.searchParams.set(key, value);
  });
  
  // Varsayilan parametreler
  if (!params.has('per_page')) wcUrl.searchParams.set('per_page', '100');
  if (!params.has('status')) wcUrl.searchParams.set('status', 'publish');
  
  try {
    console.log('[WooCommerce] Fetching products from WC API:', wcUrl.toString());
    
    const response = await fetch(wcUrl.toString(), {
      headers: {
        'Authorization': 'Basic ' + btoa(`${WC_KEY}:${WC_SECRET}`),
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[WooCommerce] WC API Error:', response.status, errorText);
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
    
    const products = await response.json();
    console.log('[WooCommerce] WC API returned', products.length, 'products');
    
    return new Response(JSON.stringify(products), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('[WooCommerce] Fetch error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch products',
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
