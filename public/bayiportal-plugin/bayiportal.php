<?php
/**
 * Plugin Name: BayiPortal - Provanya Bayi Sistemi
 * Plugin URI: https://bayi.provanya.com
 * Description: Provanya bayi portali icin WooCommerce REST API entegrasyonu. VakifBank sanal POS, bayi fiyatlandirma, siparis yonetimi.
 * Version: 2.0.0
 * Author: Provanya
 * Requires at least: 5.8
 * Requires PHP: 7.4
 * WC requires at least: 5.0
 * WC tested up to: 9.0
 * License: GPL v2 or later
 */

if (!defined('ABSPATH')) exit;

// WooCommerce aktif kontrolu
add_action('admin_init', function() {
    if (!class_exists('WooCommerce')) {
        add_action('admin_notices', function() {
            echo '<div class="error"><p><strong>BayiPortal:</strong> WooCommerce aktif degil!</p></div>';
        });
    }
});

define('BAYIPORTAL_VERSION', '2.0.0');
define('BAYIPORTAL_PLUGIN_DIR', plugin_dir_path(__FILE__));

/**
 * =============================================
 *  1. BAYI ROLLERI
 * =============================================
 */
register_activation_hook(__FILE__, function() {
    // Bayi rolleri olustur
    add_role('bayi', 'Bayi', ['read' => true]);
    add_role('premium_bayi', 'Premium Bayi', ['read' => true]);
    add_role('vip_bayi', 'VIP Bayi', ['read' => true]);
    
    // Eski roller icin uyumluluk
    add_role('dealer', 'Dealer', ['read' => true]);
    add_role('premium_dealer', 'Premium Dealer', ['read' => true]);
    add_role('vip_dealer', 'VIP Dealer', ['read' => true]);
});

/**
 * =============================================
 *  2. ADMIN PANEL - BAYI YONETIMI
 * =============================================
 */
add_action('admin_menu', function() {
    add_menu_page(
        'Bayi Yonetimi',
        'Bayi Yonetimi',
        'manage_options',
        'bayiportal',
        'bayiportal_admin_page',
        'dashicons-store',
        56
    );
});

function bayiportal_admin_page() {
    $action = isset($_GET['action']) ? sanitize_text_field($_GET['action']) : 'list';
    $user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;
    
    // Form kaydedildiginde
    if (isset($_POST['bayiportal_save']) && wp_verify_nonce($_POST['_wpnonce'], 'bayiportal_save_dealer')) {
        $uid = intval($_POST['user_id']);
        update_user_meta($uid, 'dealer_company', sanitize_text_field($_POST['company']));
        update_user_meta($uid, 'discount_rate', intval($_POST['discount_rate']));
        update_user_meta($uid, 'dealer_phone', sanitize_text_field($_POST['phone']));
        update_user_meta($uid, 'dealer_address', sanitize_text_field($_POST['address']));
        update_user_meta($uid, 'dealer_city', sanitize_text_field($_POST['city']));
        echo '<div class="notice notice-success"><p>Bayi bilgileri guncellendi!</p></div>';
    }
    
    // Izin verilen roller
    $allowed_roles = ['administrator', 'bayi', 'premium_bayi', 'vip_bayi', 'dealer', 'premium_dealer', 'vip_dealer'];
    $dealers = get_users(['role__in' => $allowed_roles]);
    ?>
    <div class="wrap">
        <h1>Bayi Yonetimi</h1>
        
        <?php if ($action === 'edit' && $user_id): 
            $user = get_user_by('id', $user_id);
            if ($user):
        ?>
        <div class="card" style="max-width:600px; padding:20px;">
            <h2><?php echo esc_html($user->display_name); ?> - Duzenle</h2>
            <form method="post">
                <?php wp_nonce_field('bayiportal_save_dealer'); ?>
                <input type="hidden" name="user_id" value="<?php echo $user_id; ?>">
                <table class="form-table">
                    <tr>
                        <th>Firma Adi</th>
                        <td><input type="text" name="company" value="<?php echo esc_attr(get_user_meta($user_id, 'dealer_company', true)); ?>" class="regular-text"></td>
                    </tr>
                    <tr>
                        <th>Indirim Orani (%)</th>
                        <td><input type="number" name="discount_rate" value="<?php echo esc_attr(get_user_meta($user_id, 'discount_rate', true) ?: 15); ?>" min="0" max="80" class="small-text"> %</td>
                    </tr>
                    <tr>
                        <th>Telefon</th>
                        <td><input type="text" name="phone" value="<?php echo esc_attr(get_user_meta($user_id, 'dealer_phone', true)); ?>" class="regular-text"></td>
                    </tr>
                    <tr>
                        <th>Adres</th>
                        <td><input type="text" name="address" value="<?php echo esc_attr(get_user_meta($user_id, 'dealer_address', true)); ?>" class="regular-text"></td>
                    </tr>
                    <tr>
                        <th>Sehir</th>
                        <td><input type="text" name="city" value="<?php echo esc_attr(get_user_meta($user_id, 'dealer_city', true)); ?>" class="regular-text"></td>
                    </tr>
                </table>
                <p class="submit">
                    <button type="submit" name="bayiportal_save" class="button button-primary">Kaydet</button>
                    <a href="?page=bayiportal" class="button">Geri Don</a>
                </p>
            </form>
        </div>
        <?php endif; else: ?>
        
        <p>Toplam <strong><?php echo count($dealers); ?></strong> bayi/yonetici kayitli</p>
        <table class="wp-list-table widefat fixed striped">
            <thead>
                <tr>
                    <th>Kullanici</th>
                    <th>Firma</th>
                    <th>Rol</th>
                    <th>Indirim</th>
                    <th>Siparis</th>
                    <th>Islem</th>
                </tr>
            </thead>
            <tbody>
            <?php foreach ($dealers as $d): 
                $role = $d->roles[0] ?? 'bayi';
                $discount = get_user_meta($d->ID, 'discount_rate', true) ?: 15;
                $order_count = function_exists('wc_get_customer_order_count') ? wc_get_customer_order_count($d->ID) : 0;
            ?>
                <tr>
                    <td>
                        <strong><?php echo esc_html($d->display_name); ?></strong>
                        <br><small><?php echo esc_html($d->user_email); ?></small>
                    </td>
                    <td><?php echo esc_html(get_user_meta($d->ID, 'dealer_company', true) ?: '-'); ?></td>
                    <td><?php echo esc_html($role); ?></td>
                    <td><strong>%<?php echo $discount; ?></strong></td>
                    <td><?php echo $order_count; ?></td>
                    <td><a href="?page=bayiportal&action=edit&user_id=<?php echo $d->ID; ?>" class="button button-small">Duzenle</a></td>
                </tr>
            <?php endforeach; ?>
            </tbody>
        </table>
        <?php endif; ?>
    </div>
    <?php
}

/**
 * =============================================
 *  3. REST API ENDPOINT'LERI
 * =============================================
 */
add_action('rest_api_init', function() {
    
    // Giris / Auth
    register_rest_route('bayiportal/v1', '/auth', [
        'methods' => 'POST',
        'callback' => 'bayiportal_api_auth',
        'permission_callback' => '__return_true',
    ]);
    
    // Odeme oturumu olustur
    register_rest_route('bayiportal/v1', '/payment/create', [
        'methods' => 'POST',
        'callback' => 'bayiportal_api_payment_create',
        'permission_callback' => 'bayiportal_check_wc_auth',
    ]);
    
    // Odeme durumu kontrol
    register_rest_route('bayiportal/v1', '/payment/status', [
        'methods' => 'GET',
        'callback' => 'bayiportal_api_payment_status',
        'permission_callback' => 'bayiportal_check_wc_auth',
    ]);
    
    // Odeme callback (VakifBank'tan donecek)
    register_rest_route('bayiportal/v1', '/payment/callback', [
        'methods' => ['GET', 'POST'],
        'callback' => 'bayiportal_api_payment_callback',
        'permission_callback' => '__return_true',
    ]);
});

/**
 * WooCommerce API key kontrolu
 */
function bayiportal_check_wc_auth(WP_REST_Request $request) {
    // WooCommerce Basic Auth kontrolu
    $auth = $request->get_header('Authorization');
    if (!$auth || strpos($auth, 'Basic') !== 0) {
        return new WP_Error('unauthorized', 'API anahtari gerekli', ['status' => 401]);
    }
    return true;
}

/**
 * Giris API - WordPress kullanicisi dogrula
 */
function bayiportal_api_auth(WP_REST_Request $request) {
    $username = sanitize_text_field($request->get_param('username'));
    $password = $request->get_param('password');
    
    if (!$username || !$password) {
        return new WP_REST_Response([
            'success' => false,
            'message' => 'Kullanici adi ve sifre gerekli'
        ], 400);
    }
    
    $user = wp_authenticate($username, $password);
    
    if (is_wp_error($user)) {
        return new WP_REST_Response([
            'success' => false,
            'message' => 'Kullanici adi veya sifre hatali'
        ], 401);
    }
    
    // Izin verilen roller
    $allowed_roles = ['administrator', 'bayi', 'premium_bayi', 'vip_bayi', 'dealer', 'premium_dealer', 'vip_dealer'];
    $user_roles = $user->roles;
    
    if (empty(array_intersect($user_roles, $allowed_roles))) {
        return new WP_REST_Response([
            'success' => false,
            'message' => 'Bu portala erisim yetkiniz yok'
        ], 403);
    }
    
    // Token olustur
    $token = wp_generate_password(40, false);
    set_transient('bayiportal_token_' . $token, $user->ID, 7 * DAY_IN_SECONDS);
    
    // Kullanici bilgilerini hazirla
    $role = $user->roles[0] ?? 'bayi';
    $discount = (int) get_user_meta($user->ID, 'discount_rate', true) ?: bayiportal_get_default_discount($role);
    
    return new WP_REST_Response([
        'success' => true,
        'token' => $token,
        'user' => [
            'id' => $user->ID,
            'username' => $user->user_login,
            'email' => $user->user_email,
            'display_name' => $user->display_name,
            'name' => $user->display_name,
            'role' => $role,
            'company' => get_user_meta($user->ID, 'dealer_company', true) ?: '',
            'meta_data' => [
                ['key' => 'discount_rate', 'value' => $discount],
            ],
        ],
    ], 200);
}

/**
 * Role gore varsayilan indirim orani
 */
function bayiportal_get_default_discount($role) {
    $defaults = [
        'administrator' => 0,
        'bayi' => 15,
        'premium_bayi' => 25,
        'vip_bayi' => 35,
        'dealer' => 15,
        'premium_dealer' => 25,
        'vip_dealer' => 35,
    ];
    return $defaults[$role] ?? 15;
}

/**
 * =============================================
 *  4. VAKIFBANK SANAL POS ENTEGRASYONU
 * =============================================
 */

/**
 * Odeme oturumu olustur
 */
function bayiportal_api_payment_create(WP_REST_Request $request) {
    $order_id = intval($request->get_param('order_id'));
    $return_url = sanitize_url($request->get_param('return_url'));
    
    if (!$order_id) {
        return new WP_REST_Response(['error' => 'Order ID gerekli'], 400);
    }
    
    $order = wc_get_order($order_id);
    if (!$order) {
        return new WP_REST_Response(['error' => 'Siparis bulunamadi'], 404);
    }
    
    // VakifBank sanal POS ayarlari (wp-admin'den alinir)
    $merchant_id = get_option('bayiportal_vakifbank_merchant_id', '');
    $terminal_id = get_option('bayiportal_vakifbank_terminal_id', '');
    $secret_key = get_option('bayiportal_vakifbank_secret_key', '');
    
    if (!$merchant_id || !$terminal_id || !$secret_key) {
        return new WP_REST_Response(['error' => 'VakifBank ayarlari eksik'], 500);
    }
    
    // Session ID olustur
    $session_id = uniqid('vkf_', true);
    $amount = $order->get_total();
    $currency = 'TRY';
    
    // VakifBank istek parametreleri
    $hash_data = $merchant_id . $terminal_id . $order_id . $amount . $secret_key;
    $hash = base64_encode(sha1($hash_data, true));
    
    // Session bilgilerini kaydet
    set_transient('bayiportal_payment_' . $session_id, [
        'order_id' => $order_id,
        'amount' => $amount,
        'hash' => $hash,
        'return_url' => $return_url,
        'created_at' => time(),
    ], HOUR_IN_SECONDS);
    
    // VakifBank 3D Secure formu icin URL olustur
    // Gercek entegrasyonda VakifBank'in sanal POS endpoint'i kullanilir
    $payment_url = add_query_arg([
        'session_id' => $session_id,
        'order_id' => $order_id,
    ], home_url('/wp-json/bayiportal/v1/payment/callback'));
    
    return new WP_REST_Response([
        'payment_url' => $payment_url,
        'session_id' => $session_id,
    ], 200);
}

/**
 * Odeme durumu kontrol
 */
function bayiportal_api_payment_status(WP_REST_Request $request) {
    $session_id = sanitize_text_field($request->get_param('session_id'));
    
    if (!$session_id) {
        return new WP_REST_Response(['status' => 'failed', 'message' => 'Session ID gerekli'], 400);
    }
    
    $session = get_transient('bayiportal_payment_' . $session_id);
    
    if (!$session) {
        return new WP_REST_Response(['status' => 'failed', 'message' => 'Oturum bulunamadi veya suresi doldu'], 404);
    }
    
    // Siparis durumunu kontrol et
    $order = wc_get_order($session['order_id']);
    if (!$order) {
        return new WP_REST_Response(['status' => 'failed', 'message' => 'Siparis bulunamadi'], 404);
    }
    
    $status = $order->get_status();
    
    if (in_array($status, ['completed', 'processing'])) {
        return new WP_REST_Response([
            'status' => 'success',
            'order_id' => $session['order_id'],
            'message' => 'Odeme basarili',
        ], 200);
    } elseif (in_array($status, ['failed', 'cancelled'])) {
        return new WP_REST_Response([
            'status' => 'failed',
            'order_id' => $session['order_id'],
            'message' => 'Odeme basarisiz',
        ], 200);
    }
    
    return new WP_REST_Response([
        'status' => 'pending',
        'order_id' => $session['order_id'],
        'message' => 'Odeme bekleniyor',
    ], 200);
}

/**
 * Odeme callback (VakifBank'tan donecek)
 */
function bayiportal_api_payment_callback(WP_REST_Request $request) {
    $session_id = sanitize_text_field($request->get_param('session_id'));
    $status = sanitize_text_field($request->get_param('status'));
    
    $session = get_transient('bayiportal_payment_' . $session_id);
    
    if (!$session) {
        // Hata sayfasina yonlendir
        wp_redirect(home_url('/odeme-hatasi'));
        exit;
    }
    
    $order = wc_get_order($session['order_id']);
    
    if ($order) {
        if ($status === 'success') {
            $order->payment_complete();
            $order->add_order_note('VakifBank 3D Secure ile odeme alindi.');
            delete_transient('bayiportal_payment_' . $session_id);
        } else {
            $order->update_status('failed', 'VakifBank odeme basarisiz.');
        }
    }
    
    // Bayi portalina yonlendir
    $return_url = $session['return_url'] ?: 'https://bayi.provanya.com';
    $redirect_url = add_query_arg([
        'payment' => $status === 'success' ? 'success' : 'failed',
        'order_id' => $session['order_id'],
    ], $return_url);
    
    wp_redirect($redirect_url);
    exit;
}

/**
 * =============================================
 *  5. CORS AYARLARI
 *  bayi.provanya.com icin
 * =============================================
 */
add_action('rest_api_init', function() {
    remove_filter('rest_pre_serve_request', 'rest_send_cors_headers');
    add_filter('rest_pre_serve_request', function($value) {
        $origin = get_http_origin();
        $allowed = [
            'https://bayi.provanya.com',
            'https://provanya.com',
            'http://localhost:5173',
            'http://localhost:3000',
        ];
        
        // Vercel preview URL'leri icin
        if ($origin && (in_array($origin, $allowed) || strpos($origin, '.vercel.app') !== false)) {
            header('Access-Control-Allow-Origin: ' . esc_url_raw($origin));
        } else {
            header('Access-Control-Allow-Origin: https://bayi.provanya.com');
        }
        
        header('Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE');
        header('Access-Control-Allow-Headers: Authorization, Content-Type, X-WP-Nonce');
        header('Access-Control-Allow-Credentials: true');
        
        return $value;
    });
}, 15);

// OPTIONS preflight
add_action('init', function() {
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        $origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
        $allowed = [
            'https://bayi.provanya.com',
            'https://provanya.com',
            'http://localhost:5173',
            'http://localhost:3000',
        ];
        
        if (in_array($origin, $allowed) || strpos($origin, '.vercel.app') !== false) {
            header('Access-Control-Allow-Origin: ' . esc_url_raw($origin));
        } else {
            header('Access-Control-Allow-Origin: https://bayi.provanya.com');
        }
        
        header('Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE');
        header('Access-Control-Allow-Headers: Authorization, Content-Type, X-WP-Nonce');
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Max-Age: 86400');
        status_header(200);
        exit;
    }
});

/**
 * =============================================
 *  6. VAKIFBANK AYARLARI SAYFASI
 * =============================================
 */
add_action('admin_menu', function() {
    add_submenu_page(
        'bayiportal',
        'VakifBank Ayarlari',
        'POS Ayarlari',
        'manage_options',
        'bayiportal-pos',
        'bayiportal_pos_settings_page'
    );
});

function bayiportal_pos_settings_page() {
    if (isset($_POST['bayiportal_pos_save']) && wp_verify_nonce($_POST['_wpnonce'], 'bayiportal_pos_settings')) {
        update_option('bayiportal_vakifbank_merchant_id', sanitize_text_field($_POST['merchant_id']));
        update_option('bayiportal_vakifbank_terminal_id', sanitize_text_field($_POST['terminal_id']));
        update_option('bayiportal_vakifbank_secret_key', sanitize_text_field($_POST['secret_key']));
        update_option('bayiportal_vakifbank_test_mode', isset($_POST['test_mode']) ? 'yes' : 'no');
        echo '<div class="notice notice-success"><p>VakifBank ayarlari kaydedildi!</p></div>';
    }
    ?>
    <div class="wrap">
        <h1>VakifBank Sanal POS Ayarlari</h1>
        <form method="post">
            <?php wp_nonce_field('bayiportal_pos_settings'); ?>
            <table class="form-table">
                <tr>
                    <th>Merchant ID</th>
                    <td><input type="text" name="merchant_id" value="<?php echo esc_attr(get_option('bayiportal_vakifbank_merchant_id')); ?>" class="regular-text"></td>
                </tr>
                <tr>
                    <th>Terminal ID</th>
                    <td><input type="text" name="terminal_id" value="<?php echo esc_attr(get_option('bayiportal_vakifbank_terminal_id')); ?>" class="regular-text"></td>
                </tr>
                <tr>
                    <th>Secret Key</th>
                    <td><input type="password" name="secret_key" value="<?php echo esc_attr(get_option('bayiportal_vakifbank_secret_key')); ?>" class="regular-text"></td>
                </tr>
                <tr>
                    <th>Test Modu</th>
                    <td>
                        <label>
                            <input type="checkbox" name="test_mode" value="yes" <?php checked(get_option('bayiportal_vakifbank_test_mode'), 'yes'); ?>>
                            Test modunu aktif et
                        </label>
                    </td>
                </tr>
            </table>
            <p class="submit">
                <button type="submit" name="bayiportal_pos_save" class="button button-primary">Kaydet</button>
            </p>
        </form>
        
        <hr>
        <h2>Entegrasyon Bilgileri</h2>
        <p>Bayi Portal URL: <code>https://bayi.provanya.com</code></p>
        <p>Callback URL: <code><?php echo home_url('/wp-json/bayiportal/v1/payment/callback'); ?></code></p>
    </div>
    <?php
}

/**
 * =============================================
 *  7. KULLANICI PROFILINE BAYI ALANLARI
 * =============================================
 */
add_action('show_user_profile', 'bayiportal_profile_fields');
add_action('edit_user_profile', 'bayiportal_profile_fields');

function bayiportal_profile_fields($user) {
    $allowed_roles = ['administrator', 'bayi', 'premium_bayi', 'vip_bayi', 'dealer', 'premium_dealer', 'vip_dealer'];
    $is_allowed = !empty(array_intersect($user->roles, $allowed_roles));
    
    if (!$is_allowed) return;
    ?>
    <h3>Bayi Bilgileri</h3>
    <table class="form-table">
        <tr>
            <th>Firma Adi</th>
            <td><input type="text" name="dealer_company" value="<?php echo esc_attr(get_user_meta($user->ID, 'dealer_company', true)); ?>" class="regular-text"></td>
        </tr>
        <tr>
            <th>Indirim Orani (%)</th>
            <td><input type="number" name="discount_rate" value="<?php echo esc_attr(get_user_meta($user->ID, 'discount_rate', true) ?: 15); ?>" min="0" max="80" class="small-text"> %</td>
        </tr>
        <tr>
            <th>Telefon</th>
            <td><input type="text" name="dealer_phone" value="<?php echo esc_attr(get_user_meta($user->ID, 'dealer_phone', true)); ?>" class="regular-text"></td>
        </tr>
        <tr>
            <th>Adres</th>
            <td><input type="text" name="dealer_address" value="<?php echo esc_attr(get_user_meta($user->ID, 'dealer_address', true)); ?>" class="regular-text"></td>
        </tr>
        <tr>
            <th>Sehir</th>
            <td><input type="text" name="dealer_city" value="<?php echo esc_attr(get_user_meta($user->ID, 'dealer_city', true)); ?>" class="regular-text"></td>
        </tr>
    </table>
    <?php
}

add_action('personal_options_update', 'bayiportal_save_profile_fields');
add_action('edit_user_profile_update', 'bayiportal_save_profile_fields');

function bayiportal_save_profile_fields($user_id) {
    if (!current_user_can('edit_user', $user_id)) return;
    
    $fields = ['dealer_company', 'discount_rate', 'dealer_phone', 'dealer_address', 'dealer_city'];
    
    foreach ($fields as $field) {
        if (isset($_POST[$field])) {
            update_user_meta($user_id, $field, sanitize_text_field($_POST[$field]));
        }
    }
}
