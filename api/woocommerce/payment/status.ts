// VakifBank Sanal POS - Odeme Durumu Kontrol
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

  const url = new URL(request.url);
  const sessionId = url.searchParams.get('session_id');

  if (!sessionId) {
    return new Response(JSON.stringify({ error: 'Session ID gerekli' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  // Bayi token'i al
  const authHeader = request.headers.get('Authorization');
  const bayiToken = authHeader?.replace('Bearer ', '');

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (bayiToken) {
      headers['Authorization'] = `Bearer ${bayiToken}`;
    } else if (WC_KEY && WC_SECRET) {
      headers['Authorization'] = 'Basic ' + btoa(`${WC_KEY}:${WC_SECRET}`);
    }

    // BayiPortal plugin'inden odeme durumunu sorgula
    const statusResponse = await fetch(
      `${WC_URL}/wp-json/bayiportal/v1/payment/status?session_id=${sessionId}`,
      { headers }
    );

    if (!statusResponse.ok) {
      const error = await statusResponse.json().catch(() => ({}));
      return new Response(JSON.stringify({ 
        status: 'failed',
        message: error.message || 'Odeme durumu alinamadi' 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const statusData = await statusResponse.json();

    return new Response(JSON.stringify({
      status: statusData.status, // 'pending', 'success', 'failed'
      order_id: statusData.order_id,
      message: statusData.message,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });

  } catch (error) {
    console.error('[Payment] Status error:', error);
    return new Response(JSON.stringify({ 
      status: 'failed',
      message: 'Odeme durumu kontrol edilirken hata olustu' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}
