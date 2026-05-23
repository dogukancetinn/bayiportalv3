// VakifBank Sanal POS - Odeme Oturumu Olustur
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
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  // Bayi token'i al (client'tan gelen Bearer token)
  const authHeader = request.headers.get('Authorization');
  const bayiToken = authHeader?.replace('Bearer ', '');

  try {
    const { order_id, return_url } = await request.json();

    if (!order_id) {
      return new Response(JSON.stringify({ error: 'Order ID gerekli' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // BayiPortal plugin'inden odeme URL'i al
    // Plugin VakifBank sanal POS ile entegre calisir
    // Oncelikle bayi token'i ile dene, basarisiz olursa WC credentials ile dene
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Bayi token varsa onu kullan, yoksa WC key/secret kullan
    if (bayiToken) {
      headers['Authorization'] = `Bearer ${bayiToken}`;
      console.log('[Payment] Using bayi token for authentication');
    } else if (WC_KEY && WC_SECRET) {
      headers['Authorization'] = 'Basic ' + btoa(`${WC_KEY}:${WC_SECRET}`);
      console.log('[Payment] Using WC credentials for authentication');
    } else {
      console.error('[Payment] No authentication credentials available');
      return new Response(JSON.stringify({ 
        error: 'Authentication credentials missing' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    console.log('[Payment] Creating payment session for order:', order_id);

    const paymentResponse = await fetch(`${WC_URL}/wp-json/bayiportal/v1/payment/create`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        order_id,
        return_url: return_url || `${WC_URL}/payment-callback`,
      }),
    });

    console.log('[Payment] Response status:', paymentResponse.status);

    if (!paymentResponse.ok) {
      const errorText = await paymentResponse.text();
      console.error('[Payment] API Error:', paymentResponse.status, errorText);
      
      let errorMessage = 'Odeme oturumu olusturulamadi';
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorJson.error || errorMessage;
      } catch {
        // Text response
      }
      
      return new Response(JSON.stringify({ 
        error: errorMessage,
        status: paymentResponse.status
      }), {
        status: paymentResponse.status,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const paymentData = await paymentResponse.json();
    console.log('[Payment] Session created successfully');

    return new Response(JSON.stringify({
      payment_url: paymentData.payment_url,
      session_id: paymentData.session_id,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });

  } catch (error) {
    console.error('[Payment] Session error:', error);
    return new Response(JSON.stringify({ 
      error: 'Odeme oturumu olusturulurken hata olustu',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}
