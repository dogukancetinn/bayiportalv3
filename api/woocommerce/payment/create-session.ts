// VakifBank Sanal POS - Odeme Oturumu Olustur
// Vercel Serverless Function
// Debug modu: PAYMENT_DEBUG=true ortam degiskeni ile aktif edilir

const WC_URL = process.env.WOOCOMMERCE_URL || 'https://provanya.com';
const WC_KEY = process.env.WOOCOMMERCE_KEY || '';
const WC_SECRET = process.env.WOOCOMMERCE_SECRET || '';
const DEBUG_MODE = process.env.PAYMENT_DEBUG === 'true';

// Debug logger - sadece debug modu aktifse loglar
function debugLog(...args: unknown[]) {
  if (DEBUG_MODE) {
    console.log('[Payment Debug]', new Date().toISOString(), ...args);
  }
}

function debugError(...args: unknown[]) {
  if (DEBUG_MODE) {
    console.error('[Payment Debug Error]', new Date().toISOString(), ...args);
  }
}

export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
  debugLog('Request received:', request.method, request.url);
  
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
    debugLog('Method not allowed:', request.method);
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  // Bayi token'i al (client'tan gelen Bearer token)
  const authHeader = request.headers.get('Authorization');
  const bayiToken = authHeader?.replace('Bearer ', '');
  
  debugLog('Auth header present:', !!authHeader);
  debugLog('Bayi token present:', !!bayiToken);
  debugLog('WC_KEY present:', !!WC_KEY);
  debugLog('WC_SECRET present:', !!WC_SECRET);
  debugLog('WC_URL:', WC_URL);

  try {
    const body = await request.json();
    const { order_id, return_url } = body;
    
    debugLog('Request body:', { order_id, return_url });

    if (!order_id) {
      debugLog('Order ID missing');
      return new Response(JSON.stringify({ 
        error: 'Order ID gerekli',
        debug: DEBUG_MODE ? { received_body: body } : undefined
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // Authentication headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    let authMethod = 'none';
    
    // Bayi token varsa onu kullan, yoksa WC key/secret kullan
    if (bayiToken) {
      headers['Authorization'] = `Bearer ${bayiToken}`;
      authMethod = 'bayi_token';
      debugLog('Using bayi token for authentication');
    } else if (WC_KEY && WC_SECRET) {
      headers['Authorization'] = 'Basic ' + btoa(`${WC_KEY}:${WC_SECRET}`);
      authMethod = 'wc_basic';
      debugLog('Using WC credentials for authentication');
    } else {
      debugError('No authentication credentials available');
      return new Response(JSON.stringify({ 
        error: 'Authentication credentials missing',
        debug: DEBUG_MODE ? {
          wc_key_set: !!WC_KEY,
          wc_secret_set: !!WC_SECRET,
          bayi_token_set: !!bayiToken
        } : undefined
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const paymentEndpoint = `${WC_URL}/wp-json/bayiportal/v1/payment/create`;
    const paymentBody = {
      order_id,
      return_url: return_url || `${WC_URL}/payment-callback`,
    };
    
    debugLog('Payment endpoint:', paymentEndpoint);
    debugLog('Payment body:', paymentBody);
    debugLog('Auth method:', authMethod);

    const paymentResponse = await fetch(paymentEndpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(paymentBody),
    });

    debugLog('Response status:', paymentResponse.status);
    debugLog('Response headers:', Object.fromEntries(paymentResponse.headers.entries()));

    const responseText = await paymentResponse.text();
    debugLog('Response body (raw):', responseText.substring(0, 500));

    if (!paymentResponse.ok) {
      debugError('API Error:', paymentResponse.status, responseText);
      
      let errorMessage = 'Odeme oturumu olusturulamadi';
      let errorDetails = null;
      
      try {
        const errorJson = JSON.parse(responseText);
        errorMessage = errorJson.message || errorJson.error || errorMessage;
        errorDetails = errorJson;
      } catch {
        errorDetails = { raw: responseText.substring(0, 200) };
      }
      
      return new Response(JSON.stringify({ 
        error: errorMessage,
        status: paymentResponse.status,
        debug: DEBUG_MODE ? {
          endpoint: paymentEndpoint,
          auth_method: authMethod,
          response_status: paymentResponse.status,
          error_details: errorDetails
        } : undefined
      }), {
        status: paymentResponse.status,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    let paymentData;
    try {
      paymentData = JSON.parse(responseText);
    } catch {
      debugError('Failed to parse response JSON:', responseText);
      return new Response(JSON.stringify({ 
        error: 'Invalid response from payment API',
        debug: DEBUG_MODE ? { raw_response: responseText.substring(0, 200) } : undefined
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }
    
    debugLog('Payment session created successfully:', {
      has_payment_url: !!paymentData.payment_url,
      has_session_id: !!paymentData.session_id
    });

    return new Response(JSON.stringify({
      payment_url: paymentData.payment_url,
      session_id: paymentData.session_id,
      debug: DEBUG_MODE ? {
        endpoint: paymentEndpoint,
        auth_method: authMethod,
        response_keys: Object.keys(paymentData)
      } : undefined
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });

  } catch (error) {
    debugError('Session error:', error);
    return new Response(JSON.stringify({ 
      error: 'Odeme oturumu olusturulurken hata olustu',
      details: error instanceof Error ? error.message : 'Unknown error',
      debug: DEBUG_MODE ? {
        error_name: error instanceof Error ? error.name : 'Unknown',
        error_stack: error instanceof Error ? error.stack?.substring(0, 300) : undefined
      } : undefined
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}
