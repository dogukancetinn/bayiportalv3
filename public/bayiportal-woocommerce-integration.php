<?php
/**
 * BayiPortal - WooCommerce Bayi Entegrasyonu
 * PHP Backend Referans Dosyası
 * 
 * Bu dosya, BayiPortal frontend'inin WooCommerce ile nasıl entegre edileceğini
 * gösterir. Gerçek production ortamında bu dosyayı ana sitenizin WordPress
 * kurulumuna özel bir plugin olarak veya functions.php içine ekleyerek kullanabilirsiniz.
 * 
 * KURULUM:
 * 1. Bu dosyayı WordPress sitenizin wp-content/plugins/bayiportal/ klasörüne kopyalayın
 * 2. WordPress admin panelinden plugin'i aktifleştirin
 * 3. WooCommerce > Ayarlar > Gelişmiş > REST API bölümünden API anahtarları oluşturun
 * 4. BayiPortal frontend .env dosyasına API anahtarlarını ekleyin
 */

/**
 * 1. BAYİ ROLÜ TANIMLAMA
 * WordPress'e özel "dealer" kullanıcı rolü ekler
 */
function bayiportal_add_dealer_role() {
    add_role('dealer', 'Standart Bayi', [
        'read' => true,
        'edit_posts' => false,
        'delete_posts' => false,
    ]);
    
    add_role('premium_dealer', 'Premium Bayi', [
        'read' => true,
        'edit_posts' => false,
        'delete_posts' => false,
    ]);
    
    add_role('vip_dealer', 'VIP Bayi', [
        'read' => true,
        'edit_posts' => false,
        'delete_posts' => false,
    ]);
}
register_activation_hook(__FILE__, 'bayiportal_add_dealer_role');

/**
 * 2. BAYİ META VERİLERİ
 * Bayi kullanıcılarına özel meta alanları ekler
 */
function bayiportal_add_dealer_meta_fields($user_id) {
    if (!in_array('dealer', ['dealer', 'premium_dealer', 'vip_dealer'])) return;
    
    $defaults = [
        'dealer_company' => '',
        'dealer_discount_rate' => 15,
        'dealer_credit_limit' => 25000,
        'dealer_used_credit' => 0,
        'dealer_tax_id' => '',
        'dealer_phone' => '',
        'dealer_address' => '',
        'dealer_city' => '',
    ];
    
    foreach ($defaults as $key => $value) {
        if (!get_user_meta($user_id, $key, true)) {
            update_user_meta($user_id, $key, $value);
        }
    }
}

/**
 * 3. REST API ENDPOINT'LERİ
 * BayiPortal frontend'inin kullanacağı özel API endpoint'leri
 */

// Bayi Giriş Endpoint'i
add_action('rest_api_init', function () {
    register_rest_route('bayiportal/v1', '/login', [
        'methods' => 'POST',
        'callback' => 'bayiportal_login',
        'permission_callback' => '__return_true',
    ]);
});

function bayiportal_login(WP_REST_Request $request) {
    $username = sanitize_text_field($request->get_param('username'));
    $password = $request->get_param('password');
    
    $user = wp_authenticate($username, $password);
    
    if (is_wp_error($user)) {
        return new WP_REST_Response([
            'success' => false,
            'error' => 'Kullanıcı adı veya şifre hatalı',
        ], 401);
    }
    
    // Bayi rolü kontrolü
    $user_roles = $user->roles;
    $dealer_roles = ['dealer', 'premium_dealer', 'vip_dealer'];
    $has_dealer_role = !empty(array_intersect($user_roles, $dealer_roles));
    
    if (!$has_dealer_role) {
        return new WP_REST_Response([
            'success' => false,
            'error' => 'Bu platforma erişim yetkiniz bulunmamaktadır',
        ], 403);
    }
    
    // JWT token oluştur (Simple JWT Login plugin ile)
    $token = bayiportal_generate_jwt($user);
    
    // Bayi bilgilerini getir
    $dealer_info = bayiportal_get_dealer_info($user);
    
    return new WP_REST_Response([
        'success' => true,
        'token' => $token,
        'user' => $dealer_info,
    ], 200);
}

// Bayi Bilgileri Endpoint'i
add_action('rest_api_init', function () {
    register_rest_route('bayiportal/v1', '/dealer-info', [
        'methods' => 'GET',
        'callback' => 'bayiportal_get_info',
        'permission_callback' => 'bayiportal_verify_token',
    ]);
});

function bayiportal_get_info(WP_REST_Request $request) {
    $user = bayiportal_get_user_from_token($request);
    if (!$user) {
        return new WP_REST_Response(['error' => 'Yetkisiz erişim'], 401);
    }
    
    return new WP_REST_Response([
        'user' => bayiportal_get_dealer_info($user),
    ], 200);
}

// Bayiye Özel Fiyatlı Ürünler Endpoint'i
add_action('rest_api_init', function () {
    register_rest_route('bayiportal/v1', '/products', [
        'methods' => 'GET',
        'callback' => 'bayiportal_get_products',
        'permission_callback' => 'bayiportal_verify_token',
    ]);
});

function bayiportal_get_products(WP_REST_Request $request) {
    $user = bayiportal_get_user_from_token($request);
    if (!$user) {
        return new WP_REST_Response(['error' => 'Yetkisiz erişim'], 401);
    }
    
    $discount_rate = get_user_meta($user->ID, 'dealer_discount_rate', true) ?: 15;
    
    // WooCommerce ürünlerini getir
    $args = [
        'status' => 'publish',
        'limit' => $request->get_param('per_page') ?: 50,
        'page' => $request->get_param('page') ?: 1,
    ];
    
    // Kategori filtresi
    if ($category = $request->get_param('category')) {
        $args['category'] = $category;
    }
    
    // Arama
    if ($search = $request->get_param('search')) {
        $args['s'] = $search;
    }
    
    $products = wc_get_products($args);
    $result = [];
    
    foreach ($products as $product) {
        $regular_price = (float) $product->get_regular_price();
        $dealer_price = $regular_price * (1 - $discount_rate / 100);
        
        $result[] = [
            'id' => $product->get_id(),
            'name' => $product->get_name(),
            'slug' => $product->get_slug(),
            'sku' => $product->get_sku(),
            'regular_price' => $regular_price,
            'dealer_price' => round($dealer_price, 2),
            'discount_rate' => $discount_rate,
            'savings' => round($regular_price - $dealer_price, 2),
            'stock_quantity' => $product->get_stock_quantity(),
            'stock_status' => $product->get_stock_status(),
            'on_sale' => $product->is_on_sale(),
            'featured' => $product->is_featured(),
            'short_description' => $product->get_short_description(),
            'images' => array_map(function($img) {
                return ['src' => $img->get_src(), 'alt' => $img->get_alt()];
            }, $product->get_gallery_image_ids() ? 
                [wp_get_attachment_image_src($product->get_image_id(), 'medium')] : []),
            'categories' => array_map(function($cat) {
                return ['id' => $cat->term_id, 'name' => $cat->name, 'slug' => $cat->slug];
            }, wp_get_post_terms($product->get_id(), 'product_cat')),
        ];
    }
    
    return new WP_REST_Response($result, 200);
}

// Bayi Sipariş Endpoint'i
add_action('rest_api_init', function () {
    register_rest_route('bayiportal/v1', '/orders', [
        'methods' => 'GET',
        'callback' => 'bayiportal_get_orders',
        'permission_callback' => 'bayiportal_verify_token',
    ]);
    
    register_rest_route('bayiportal/v1', '/orders', [
        'methods' => 'POST',
        'callback' => 'bayiportal_create_order',
        'permission_callback' => 'bayiportal_verify_token',
    ]);
});

function bayiportal_get_orders(WP_REST_Request $request) {
    $user = bayiportal_get_user_from_token($request);
    if (!$user) return new WP_REST_Response(['error' => 'Yetkisiz erişim'], 401);
    
    $args = [
        'customer_id' => $user->ID,
        'limit' => 20,
    ];
    
    $orders = wc_get_orders($args);
    $result = [];
    
    foreach ($orders as $order) {
        $items = [];
        foreach ($order->get_items() as $item) {
            $items[] = [
                'name' => $item->get_name(),
                'quantity' => $item->get_quantity(),
                'subtotal' => $item->get_subtotal(),
                'total' => $item->get_total(),
            ];
        }
        
        $result[] = [
            'id' => $order->get_id(),
            'number' => $order->get_order_number(),
            'status' => $order->get_status(),
            'date_created' => $order->get_date_created()->date('c'),
            'total' => $order->get_total(),
            'items' => $items,
        ];
    }
    
    return new WP_REST_Response($result, 200);
}

function bayiportal_create_order(WP_REST_Request $request) {
    $user = bayiportal_get_user_from_token($request);
    if (!$user) return new WP_REST_Response(['error' => 'Yetkisiz erişim'], 401);
    
    $items = $request->get_param('items');
    $note = sanitize_text_field($request->get_param('note') ?: '');
    $discount_rate = (float) (get_user_meta($user->ID, 'dealer_discount_rate', true) ?: 15);
    
    // Kredi limiti kontrolü
    $credit_limit = (float) (get_user_meta($user->ID, 'dealer_credit_limit', true) ?: 25000);
    $used_credit = (float) (get_user_meta($user->ID, 'dealer_used_credit', true) ?: 0);
    
    // Sipariş oluştur
    $order = wc_create_order();
    $order->set_customer_id($user->ID);
    
    $total = 0;
    foreach ($items as $item) {
        $product = wc_get_product($item['product_id']);
        if (!$product) continue;
        
        $regular_price = (float) $product->get_regular_price();
        $dealer_price = $regular_price * (1 - $discount_rate / 100);
        
        $order->add_product($product, $item['quantity']);
        $total += $dealer_price * $item['quantity'];
    }
    
    // Kredi limiti aşımı kontrolü
    if (($used_credit + $total) > $credit_limit) {
        $order->delete(true);
        return new WP_REST_Response([
            'success' => false,
            'error' => 'Kredi limitiniz yetersiz. Kalan limit: ' . ($credit_limit - $used_credit) . ' TL',
        ], 400);
    }
    
    // Bayi indirimi uygulama
    $coupon_code = 'dealer_discount_' . $user->ID . '_' . time();
    $coupon = new WC_Coupon();
    $coupon->set_code($coupon_code);
    $coupon->set_discount_type('percent');
    $coupon->set_amount($discount_rate);
    $coupon->set_individual_use(true);
    $coupon->set_usage_limit(1);
    $coupon->save();
    
    $order->apply_coupon($coupon_code);
    
    if ($note) {
        $order->add_order_note($note);
    }
    
    $order->set_status('processing');
    $order->calculate_totals();
    $order->save();
    
    // Kredi kullanımını güncelle
    update_user_meta($user->ID, 'dealer_used_credit', $used_credit + $total);
    
    return new WP_REST_Response([
        'success' => true,
        'order_id' => $order->get_id(),
        'order_number' => $order->get_order_number(),
        'total' => $order->get_total(),
    ], 201);
}

/**
 * 4. YARDIMCI FONKSİYONLAR
 */

function bayiportal_get_dealer_info($user) {
    $role = 'dealer';
    $user_roles = $user->roles;
    if (in_array('vip_dealer', $user_roles)) $role = 'vip_dealer';
    elseif (in_array('premium_dealer', $user_roles)) $role = 'premium_dealer';
    
    return [
        'id' => $user->ID,
        'username' => $user->user_login,
        'email' => $user->user_email,
        'displayName' => $user->display_name,
        'role' => $role,
        'company' => get_user_meta($user->ID, 'dealer_company', true) ?: '',
        'discountRate' => (int) (get_user_meta($user->ID, 'dealer_discount_rate', true) ?: 15),
        'creditLimit' => (float) (get_user_meta($user->ID, 'dealer_credit_limit', true) ?: 25000),
        'usedCredit' => (float) (get_user_meta($user->ID, 'dealer_used_credit', true) ?: 0),
        'phone' => get_user_meta($user->ID, 'dealer_phone', true) ?: '',
        'taxId' => get_user_meta($user->ID, 'dealer_tax_id', true) ?: '',
        'address' => get_user_meta($user->ID, 'dealer_address', true) ?: '',
        'city' => get_user_meta($user->ID, 'dealer_city', true) ?: '',
        'joinDate' => $user->user_registered,
        'totalOrders' => wc_get_customer_order_count($user->ID),
        'totalSpent' => wc_get_customer_total_spent($user->ID),
    ];
}

function bayiportal_generate_jwt($user) {
    // Simple JWT Login veya Firebase JWT kullanın
    // Alternatif olarak WordPress session token kullanabilirsiniz
    $payload = [
        'user_id' => $user->ID,
        'username' => $user->user_login,
        'role' => $user->roles,
        'iat' => time(),
        'exp' => time() + (7 * 24 * 60 * 60), // 7 gün geçerli
    ];
    
    // JWT library gereklidir: composer require firebase/php-jwt
    // $token = \Firebase\JWT\JWT::encode($payload, JWT_SECRET_KEY, 'HS256');
    
    // Basit alternatif: WordPress transient
    $token = wp_generate_password(32, false);
    set_transient('bayiportal_token_' . $token, $user->ID, 7 * DAY_IN_SECONDS);
    
    return $token;
}

function bayiportal_verify_token(WP_REST_Request $request) {
    $token = $request->get_header('Authorization');
    if (!$token) return false;
    
    $token = str_replace('Bearer ', '', $token);
    $user_id = get_transient('bayiportal_token_' . $token);
    
    if (!$user_id) return false;
    return true;
}

function bayiportal_get_user_from_token(WP_REST_Request $request) {
    $token = $request->get_header('Authorization');
    if (!$token) return null;
    
    $token = str_replace('Bearer ', '', $token);
    $user_id = get_transient('bayiportal_token_' . $token);
    
    if (!$user_id) return null;
    return get_user_by('id', $user_id);
}

/**
 * 5. WOOCOMMERCE HOOK'LARI
 * Ana sitedeki fiyatları bayiye göre özelleştirme
 */

// Bayi kullanıcıları için otomatik fiyat uygulama
add_filter('woocommerce_product_get_price', 'bayiportal_custom_price', 10, 2);
add_filter('woocommerce_product_get_regular_price', 'bayiportal_custom_price', 10, 2);

function bayiportal_custom_price($price, $product) {
    if (!is_user_logged_in()) return $price;
    
    $user = wp_get_current_user();
    $dealer_roles = ['dealer', 'premium_dealer', 'vip_dealer'];
    
    if (empty(array_intersect($user->roles, $dealer_roles))) {
        return $price;
    }
    
    // Sadece bayi portalından gelen isteklerde uygula
    if (!defined('BAYIPORTAL_REQUEST')) return $price;
    
    $discount_rate = (float) (get_user_meta($user->ID, 'dealer_discount_rate', true) ?: 15);
    return $price * (1 - $discount_rate / 100);
}

/**
 * 6. SUBDOMAIN YÖNLENDİRME
 * subdomain.ana-site.com'u BayiPortal'a yönlendirme
 */
add_action('template_redirect', 'bayiportal_subdomain_redirect');

function bayiportal_subdomain_redirect() {
    $host = $_SERVER['HTTP_HOST'];
    $main_domain = 'ana-site.com'; // Kendi domaininizi yazın
    
    // Subdomain kontrolü (bayi.ana-site.com gibi)
    if (strpos($host, 'bayi.' . $main_domain) === 0 || 
        strpos($host, 'dealer.' . $main_domain) === 0) {
        
        // BayiPortal frontend sayfasını göster
        // Seçenek 1: Özel bir WordPress sayfası
        // Seçenek 2: Ayrı bir React uygulamasına yönlendirme
        // Seçenek 3: iframe ile gömme
        
        define('BAYIPORTAL_REQUEST', true);
        
        // Frontend uygulamasının URL'sine yönlendir
        // wp_redirect('https://bayi.ana-site.com/app');
        // exit;
    }
}

/**
 * 7. CACHING VE PERFORMANS
 * BayiPortal için özel caching ayarları
 */
add_action('init', 'bayiportal_setup_caching');

function bayiportal_setup_caching() {
    // REST API istekleri için cache-control header
    if (strpos($_SERVER['REQUEST_URI'], '/wp-json/bayiportal/') !== false) {
        header('Cache-Control: no-cache, must-revalidate, max-age=0');
        header('X-BayiPortal: active');
    }
}

/**
 * 8. .ENV YAPILANDIRMASI
 * Frontend .env dosyası örneği:
 * 
 * VITE_WC_SITE_URL=https://ana-site.com
 * VITE_WC_CONSUMER_KEY=ck_xxxxxxxxxxxxxxxxxxxx
 * VITE_WC_CONSUMER_SECRET=cs_xxxxxxxxxxxxxxxxxxxx
 * VITE_API_BASE_URL=https://ana-site.com/wp-json/bayiportal/v1
 */

?>
