// WordPress Authentication API
// Vercel Serverless Function
// BayiPortal WordPress plugin ile entegre

const WC_URL = process.env.WOOCOMMERCE_URL || 'https://provanya.com';
const WC_KEY = process.env.WOOCOMMERCE_KEY || '';
const WC_SECRET = process.env.WOOCOMMERCE_SECRET || '';

// Izin verilen roller (normal musteriler giremez)
const ALLOWED_ROLES = ['administrator', 'bayi', 'premium_bayi', 'vip_bayi', 'dealer', 'premium_dealer', 'vip_dealer'];

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
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
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
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
    
    console.log('[Auth] Attempting login for:', username);
    
    // Oncelikle BayiPortal auth endpoint'ini dene
    let authData = null;
    let authSuccess = false;
    
    // 1. BayiPortal /auth endpoint
    try {
      console.log('[Auth] Trying bayiportal/v1/auth...');
      const authResponse = await fetch(`${WC_URL}/wp-json/bayiportal/v1/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      
      if (authResponse.ok) {
        authData = await authResponse.json();
        authSuccess = true;
        console.log('[Auth] bayiportal/v1/auth success');
      } else {
        const errorText = await authResponse.text();
        console.log('[Auth] bayiportal/v1/auth failed:', authResponse.status, errorText);
      }
    } catch (e) {
      console.log('[Auth] bayiportal/v1/auth error:', e);
    }
    
    // 2. BayiPortal /login endpoint (fallback)
    if (!authSuccess) {
      try {
        console.log('[Auth] Trying bayiportal/v1/login...');
        const loginResponse = await fetch(`${WC_URL}/wp-json/bayiportal/v1/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        });
        
        if (loginResponse.ok) {
          authData = await loginResponse.json();
          authSuccess = true;
          console.log('[Auth] bayiportal/v1/login success');
        } else {
          const errorText = await loginResponse.text();
          console.log('[Auth] bayiportal/v1/login failed:', loginResponse.status, errorText);
        }
      } catch (e) {
        console.log('[Auth] bayiportal/v1/login error:', e);
      }
    }
    
    // 3. JWT Auth endpoint (fallback)
    if (!authSuccess) {
      try {
        console.log('[Auth] Trying jwt-auth/v1/token...');
        const jwtResponse = await fetch(`${WC_URL}/wp-json/jwt-auth/v1/token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        });
        
        if (jwtResponse.ok) {
          const jwtData = await jwtResponse.json();
          authData = {
            success: true,
            user: {
              id: jwtData.user_id,
              username: jwtData.user_nicename,
              email: jwtData.user_email,
              display_name: jwtData.user_display_name,
              role: 'bayi', // JWT doesn't return role, default to bayi
            },
            token: jwtData.token,
          };
          authSuccess = true;
          console.log('[Auth] jwt-auth/v1/token success');
        } else {
          const errorText = await jwtResponse.text();
          console.log('[Auth] jwt-auth/v1/token failed:', jwtResponse.status, errorText);
        }
      } catch (e) {
        console.log('[Auth] jwt-auth/v1/token error:', e);
      }
    }
    
    if (!authSuccess || !authData) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Giris basarisiz. Kullanici adi veya sifre hatali.' 
      }), {
        status: 401,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
    
    // authData yapisini normalize et
    const user = authData.user || authData;
    const userRole = user.role || user.roles?.[0] || '';
    
    // Rol kontrolu - sadece bayiler ve yoneticiler girebilir
    if (!ALLOWED_ROLES.includes(userRole)) {
      console.log('[Auth] Role not allowed:', userRole);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Bu portala erisim yetkiniz yok. Sadece bayiler giris yapabilir.' 
      }), {
        status: 403,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
    
    // WooCommerce customer bilgilerini al
    let customerData = null;
    if (user.id && WC_KEY && WC_SECRET) {
      try {
        const customerResponse = await fetch(
          `${WC_URL}/wp-json/wc/v3/customers/${user.id}`,
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
        console.error('[Auth] Customer fetch error:', e);
      }
    }
    
    console.log('[Auth] Login successful for:', username, 'role:', userRole);
    
    return new Response(JSON.stringify({
      success: true,
      user: {
        id: user.id || user.ID,
        username: user.username || user.user_login || user.user_nicename,
        email: user.email || user.user_email,
        displayName: user.display_name || user.displayName || user.name,
        role: userRole,
        company: customerData?.billing?.company || user.company || '',
        phone: customerData?.billing?.phone || user.phone || '',
        address: customerData?.billing?.address_1 || user.address || '',
        city: customerData?.billing?.city || user.city || '',
        discountRate: getMetaValue(user.meta_data || customerData?.meta_data, 'discount_rate') || 
                      user.discount_rate || user.discountRate || 0,
      },
      token: authData.token,
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
    
  } catch (error) {
    console.error('[Auth] Error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Giris sirasinda bir hata olustu' 
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}

function getMetaValue(metaData: { key: string; value: unknown }[] | undefined, key: string): unknown {
  if (!metaData) return null;
  const meta = metaData.find(m => m.key === key);
  return meta ? meta.value : null;
}
