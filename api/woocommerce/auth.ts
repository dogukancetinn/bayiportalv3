// WordPress Authentication API
// Vercel Serverless Function

const WC_URL = process.env.WOOCOMMERCE_URL || 'https://provanya.com';
const WC_KEY = process.env.WOOCOMMERCE_KEY || '';
const WC_SECRET = process.env.WOOCOMMERCE_SECRET || '';

// Izin verilen roller (normal musteriler giremez)
const ALLOWED_ROLES = ['administrator', 'bayi', 'premium_bayi', 'vip_bayi', 'dealer', 'premium_dealer', 'vip_dealer'];

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
    const { username, password } = await request.json();
    
    if (!username || !password) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Kullanici adi ve sifre gerekli' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // WordPress JWT veya Application Password ile dogrulama
    // BayiPortal plugin'i bu endpoint'i saglayacak
    const authResponse = await fetch(`${WC_URL}/wp-json/bayiportal/v1/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });
    
    if (!authResponse.ok) {
      const errorData = await authResponse.json().catch(() => ({}));
      return new Response(JSON.stringify({ 
        success: false, 
        error: errorData.message || 'Giris basarisiz' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    const authData = await authResponse.json();
    
    // Rol kontrolu - sadece bayiler ve yoneticiler girebilir
    const userRole = authData.user?.role || '';
    if (!ALLOWED_ROLES.includes(userRole)) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Bu portala erisim yetkiniz yok' 
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // WooCommerce customer bilgilerini al
    let customerData = null;
    if (authData.user?.id) {
      try {
        const customerResponse = await fetch(
          `${WC_URL}/wp-json/wc/v3/customers/${authData.user.id}`,
          {
            headers: {
              'Authorization': 'Basic ' + btoa(`${WC_KEY}:${WC_SECRET}`),
              'Content-Type': 'application/json',
            },
          }
        );
        if (customerResponse.ok) {
          customerData = await customerResponse.json();
        }
      } catch (e) {
        console.error('Customer fetch error:', e);
      }
    }
    
    return new Response(JSON.stringify({
      success: true,
      user: {
        id: authData.user.id,
        username: authData.user.username || authData.user.user_login,
        email: authData.user.email || authData.user.user_email,
        displayName: authData.user.display_name || authData.user.name,
        role: userRole,
        company: customerData?.billing?.company || authData.user.company || '',
        phone: customerData?.billing?.phone || '',
        address: customerData?.billing?.address_1 || '',
        city: customerData?.billing?.city || '',
        // Meta data'dan indirim orani
        discountRate: getMetaValue(authData.user.meta_data || customerData?.meta_data, 'discount_rate') || 0,
      },
      token: authData.token,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('Auth error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Giris sirasinda bir hata olustu' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

function getMetaValue(metaData: { key: string; value: any }[] | undefined, key: string): any {
  if (!metaData) return null;
  const meta = metaData.find(m => m.key === key);
  return meta ? meta.value : null;
}
