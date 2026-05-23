// VakifBank Sanal POS - Odeme Oturumu Olustur
// Vercel Serverless Function

const WC_URL = process.env.WOOCOMMERCE_URL || 'https://provanya.com';
const WC_KEY = process.env.WOOCOMMERCE_KEY || '';
const WC_SECRET = process.env.WOOCOMMERCE_SECRET || '';

export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { order_id, return_url } = await request.json();

    if (!order_id) {
      return new Response(JSON.stringify({ error: 'Order ID gerekli' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // BayiPortal plugin'inden odeme URL'i al
    // Plugin VakifBank sanal POS ile entegre calisir
    const paymentResponse = await fetch(`${WC_URL}/wp-json/bayiportal/v1/payment/create`, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${WC_KEY}:${WC_SECRET}`),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        order_id,
        return_url: return_url || `${WC_URL}/payment-callback`,
      }),
    });

    if (!paymentResponse.ok) {
      const error = await paymentResponse.json().catch(() => ({}));
      return new Response(JSON.stringify({ 
        error: error.message || 'Odeme oturumu olusturulamadi' 
      }), {
        status: paymentResponse.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const paymentData = await paymentResponse.json();

    return new Response(JSON.stringify({
      payment_url: paymentData.payment_url,
      session_id: paymentData.session_id,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Payment session error:', error);
    return new Response(JSON.stringify({ 
      error: 'Odeme oturumu olusturulurken hata olustu' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
