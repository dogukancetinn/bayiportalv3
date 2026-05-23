// WooCommerce API Proxy - Urunler
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
  
  // WooCommerce API'ye istek yap
  const wcUrl = new URL(`${WC_URL}/wp-json/wc/v3/products`);
  
  // Parametreleri aktar
  params.forEach((value, key) => {
    wcUrl.searchParams.set(key, value);
  });
  
  // Varsayilan parametreler
  if (!params.has('per_page')) wcUrl.searchParams.set('per_page', '100');
  if (!params.has('status')) wcUrl.searchParams.set('status', 'publish');
  
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
    
    const products = await response.json();
    
    return new Response(JSON.stringify(products), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    console.error('WooCommerce fetch error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch products' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
