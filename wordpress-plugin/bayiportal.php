<?php
/**
 * Plugin Name: Bayi Portal - Tek Bayi Sistemi
 * Plugin URI: https://provanya.com
 * Description: WooCommerce bayi portal sistemi - tek bayi, ozel indirimler ve debug modu
 * Version: 2.0.0
 * Author: Provanya
 * Text Domain: bayiportal
 * Requires at least: 6.0
 * Requires PHP: 8.0
 */

if (!defined('ABSPATH')) {
    exit;
}

// Plugin sabitleri
define('BAYIPORTAL_VERSION', '2.0.0');
define('BAYIPORTAL_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('BAYIPORTAL_PLUGIN_URL', plugin_dir_url(__FILE__));

/**
 * Ana Plugin Sinifi
 */
class BayiPortal {
    
    private static $instance = null;
    private $debug_mode = false;
    
    public static function instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function __construct() {
        $this->debug_mode = get_option('bayiportal_debug_mode', false);
        
        add_action('init', [$this, 'init']);
        add_action('admin_menu', [$this, 'admin_menu']);
        add_action('admin_init', [$this, 'register_settings']);
        add_action('rest_api_init', [$this, 'register_rest_routes']);
        
        // WooCommerce hooks
        add_filter('woocommerce_product_get_price', [$this, 'apply_dealer_discount'], 10, 2);
        add_filter('woocommerce_product_get_regular_price', [$this, 'apply_dealer_discount'], 10, 2);
        add_filter('woocommerce_product_variation_get_price', [$this, 'apply_dealer_discount'], 10, 2);
        add_filter('woocommerce_product_variation_get_regular_price', [$this, 'apply_dealer_discount'], 10, 2);
    }
    
    /**
     * Plugin baslatma
     */
    public function init() {
        load_plugin_textdomain('bayiportal', false, dirname(plugin_basename(__FILE__)) . '/languages');
    }
    
    /**
     * Debug log fonksiyonu
     */
    public function debug_log($message, $data = null) {
        if (!$this->debug_mode) {
            return;
        }
        
        $log_message = '[BayiPortal Debug] ' . date('Y-m-d H:i:s') . ' - ' . $message;
        
        if ($data !== null) {
            $log_message .= ' | Data: ' . print_r($data, true);
        }
        
        error_log($log_message);
        
        // Debug dosyasina da yaz
        $debug_file = WP_CONTENT_DIR . '/bayiportal-debug.log';
        file_put_contents($debug_file, $log_message . "\n", FILE_APPEND);
    }
    
    /**
     * Admin menusu
     */
    public function admin_menu() {
        add_menu_page(
            __('Bayi Portal', 'bayiportal'),
            __('Bayi Portal', 'bayiportal'),
            'manage_options',
            'bayiportal',
            [$this, 'admin_page'],
            'dashicons-store',
            56
        );
        
        add_submenu_page(
            'bayiportal',
            __('Ayarlar', 'bayiportal'),
            __('Ayarlar', 'bayiportal'),
            'manage_options',
            'bayiportal-settings',
            [$this, 'settings_page']
        );
        
        add_submenu_page(
            'bayiportal',
            __('Debug Loglari', 'bayiportal'),
            __('Debug Loglari', 'bayiportal'),
            'manage_options',
            'bayiportal-debug',
            [$this, 'debug_page']
        );
    }
    
    /**
     * Ayarlari kaydet
     */
    public function register_settings() {
        // Genel Ayarlar
        register_setting('bayiportal_settings', 'bayiportal_debug_mode');
        register_setting('bayiportal_settings', 'bayiportal_dealer_enabled');
        
        // Bayi Ayarlari
        register_setting('bayiportal_settings', 'bayiportal_dealer_username');
        register_setting('bayiportal_settings', 'bayiportal_dealer_password');
        register_setting('bayiportal_settings', 'bayiportal_dealer_name');
        register_setting('bayiportal_settings', 'bayiportal_dealer_email');
        
        // Indirim Ayarlari
        register_setting('bayiportal_settings', 'bayiportal_discount_type'); // 'fixed', 'percentage', 'acf'
        register_setting('bayiportal_settings', 'bayiportal_discount_value'); // Manuel indirim degeri
        register_setting('bayiportal_settings', 'bayiportal_acf_discount_field'); // ACF alan adi
        register_setting('bayiportal_settings', 'bayiportal_acf_dealer_price_field'); // ACF bayi fiyati alani
        
        // Kategori bazli indirimler
        register_setting('bayiportal_settings', 'bayiportal_category_discounts');
    }
    
    /**
     * Ana admin sayfasi
     */
    public function admin_page() {
        $dealer_enabled = get_option('bayiportal_dealer_enabled', false);
        $dealer_name = get_option('bayiportal_dealer_name', '');
        $discount_type = get_option('bayiportal_discount_type', 'percentage');
        $discount_value = get_option('bayiportal_discount_value', 0);
        
        ?>
        <div class="wrap">
            <h1><?php _e('Bayi Portal Dashboard', 'bayiportal'); ?></h1>
            
            <div class="bayiportal-dashboard" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 20px;">
                
                <div class="card" style="padding: 20px; background: #fff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                    <h3 style="margin-top: 0; color: #FF4500;"><?php _e('Bayi Durumu', 'bayiportal'); ?></h3>
                    <p style="font-size: 24px; font-weight: bold; margin: 10px 0;">
                        <?php echo $dealer_enabled ? '<span style="color: #16a34a;">Aktif</span>' : '<span style="color: #dc2626;">Pasif</span>'; ?>
                    </p>
                    <p style="color: #666;"><?php echo esc_html($dealer_name ?: 'Bayi tanimlanmamis'); ?></p>
                </div>
                
                <div class="card" style="padding: 20px; background: #fff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                    <h3 style="margin-top: 0; color: #FF4500;"><?php _e('Indirim Tipi', 'bayiportal'); ?></h3>
                    <p style="font-size: 24px; font-weight: bold; margin: 10px 0;">
                        <?php 
                        switch($discount_type) {
                            case 'fixed': echo 'Sabit Tutar'; break;
                            case 'percentage': echo 'Yuzde'; break;
                            case 'acf': echo 'ACF Alani'; break;
                            default: echo 'Belirlenmemis';
                        }
                        ?>
                    </p>
                    <p style="color: #666;">
                        <?php 
                        if ($discount_type === 'percentage') {
                            echo '%' . esc_html($discount_value) . ' indirim';
                        } elseif ($discount_type === 'fixed') {
                            echo esc_html($discount_value) . ' TL indirim';
                        } else {
                            echo 'ACF alanlarindan alinir';
                        }
                        ?>
                    </p>
                </div>
                
                <div class="card" style="padding: 20px; background: #fff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                    <h3 style="margin-top: 0; color: #FF4500;"><?php _e('Debug Modu', 'bayiportal'); ?></h3>
                    <p style="font-size: 24px; font-weight: bold; margin: 10px 0;">
                        <?php echo $this->debug_mode ? '<span style="color: #f59e0b;">Aktif</span>' : '<span style="color: #666;">Pasif</span>'; ?>
                    </p>
                    <p style="color: #666;">
                        <a href="<?php echo admin_url('admin.php?page=bayiportal-debug'); ?>"><?php _e('Loglari Gor', 'bayiportal'); ?></a>
                    </p>
                </div>
                
            </div>
            
            <div style="margin-top: 30px;">
                <h2><?php _e('Hizli Erisim', 'bayiportal'); ?></h2>
                <p>
                    <a href="<?php echo admin_url('admin.php?page=bayiportal-settings'); ?>" class="button button-primary"><?php _e('Ayarlara Git', 'bayiportal'); ?></a>
                    <a href="<?php echo admin_url('admin.php?page=bayiportal-debug'); ?>" class="button"><?php _e('Debug Loglarini Gor', 'bayiportal'); ?></a>
                </p>
            </div>
        </div>
        <?php
    }
    
    /**
     * Ayarlar sayfasi
     */
    public function settings_page() {
        if (isset($_POST['bayiportal_save_settings']) && wp_verify_nonce($_POST['_wpnonce'], 'bayiportal_settings')) {
            // Ayarlari kaydet
            update_option('bayiportal_debug_mode', isset($_POST['bayiportal_debug_mode']));
            update_option('bayiportal_dealer_enabled', isset($_POST['bayiportal_dealer_enabled']));
            update_option('bayiportal_dealer_username', sanitize_text_field($_POST['bayiportal_dealer_username'] ?? ''));
            update_option('bayiportal_dealer_password', sanitize_text_field($_POST['bayiportal_dealer_password'] ?? ''));
            update_option('bayiportal_dealer_name', sanitize_text_field($_POST['bayiportal_dealer_name'] ?? ''));
            update_option('bayiportal_dealer_email', sanitize_email($_POST['bayiportal_dealer_email'] ?? ''));
            update_option('bayiportal_discount_type', sanitize_text_field($_POST['bayiportal_discount_type'] ?? 'percentage'));
            update_option('bayiportal_discount_value', floatval($_POST['bayiportal_discount_value'] ?? 0));
            update_option('bayiportal_acf_discount_field', sanitize_text_field($_POST['bayiportal_acf_discount_field'] ?? ''));
            update_option('bayiportal_acf_dealer_price_field', sanitize_text_field($_POST['bayiportal_acf_dealer_price_field'] ?? ''));
            
            // Kategori indirimlerini kaydet
            $category_discounts = [];
            if (isset($_POST['category_discount']) && is_array($_POST['category_discount'])) {
                foreach ($_POST['category_discount'] as $cat_id => $discount) {
                    $category_discounts[intval($cat_id)] = floatval($discount);
                }
            }
            update_option('bayiportal_category_discounts', $category_discounts);
            
            // Debug modunu guncelle
            $this->debug_mode = isset($_POST['bayiportal_debug_mode']);
            
            echo '<div class="notice notice-success"><p>' . __('Ayarlar kaydedildi!', 'bayiportal') . '</p></div>';
        }
        
        // Mevcut degerleri al
        $debug_mode = get_option('bayiportal_debug_mode', false);
        $dealer_enabled = get_option('bayiportal_dealer_enabled', false);
        $dealer_username = get_option('bayiportal_dealer_username', '');
        $dealer_password = get_option('bayiportal_dealer_password', '');
        $dealer_name = get_option('bayiportal_dealer_name', '');
        $dealer_email = get_option('bayiportal_dealer_email', '');
        $discount_type = get_option('bayiportal_discount_type', 'percentage');
        $discount_value = get_option('bayiportal_discount_value', 0);
        $acf_discount_field = get_option('bayiportal_acf_discount_field', '');
        $acf_dealer_price_field = get_option('bayiportal_acf_dealer_price_field', '');
        $category_discounts = get_option('bayiportal_category_discounts', []);
        
        // WooCommerce kategorileri
        $categories = get_terms([
            'taxonomy' => 'product_cat',
            'hide_empty' => false,
        ]);
        
        ?>
        <div class="wrap">
            <h1><?php _e('Bayi Portal Ayarlari', 'bayiportal'); ?></h1>
            
            <form method="post" action="">
                <?php wp_nonce_field('bayiportal_settings'); ?>
                
                <!-- Debug Modu -->
                <h2 class="title"><?php _e('Debug Ayarlari', 'bayiportal'); ?></h2>
                <table class="form-table">
                    <tr>
                        <th scope="row"><?php _e('Debug Modu', 'bayiportal'); ?></th>
                        <td>
                            <label>
                                <input type="checkbox" name="bayiportal_debug_mode" value="1" <?php checked($debug_mode); ?>>
                                <?php _e('Debug modunu aktif et (API istekleri ve hatalar loglanir)', 'bayiportal'); ?>
                            </label>
                            <p class="description"><?php _e('Sorun giderme icin aktif edin. Cozumlendikten sonra kapatmayi unutmayin.', 'bayiportal'); ?></p>
                        </td>
                    </tr>
                </table>
                
                <!-- Bayi Ayarlari -->
                <h2 class="title"><?php _e('Bayi Bilgileri', 'bayiportal'); ?></h2>
                <table class="form-table">
                    <tr>
                        <th scope="row"><?php _e('Bayi Aktif', 'bayiportal'); ?></th>
                        <td>
                            <label>
                                <input type="checkbox" name="bayiportal_dealer_enabled" value="1" <?php checked($dealer_enabled); ?>>
                                <?php _e('Bayi sistemini aktif et', 'bayiportal'); ?>
                            </label>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row"><?php _e('Bayi Adi', 'bayiportal'); ?></th>
                        <td>
                            <input type="text" name="bayiportal_dealer_name" value="<?php echo esc_attr($dealer_name); ?>" class="regular-text">
                        </td>
                    </tr>
                    <tr>
                        <th scope="row"><?php _e('Bayi E-posta', 'bayiportal'); ?></th>
                        <td>
                            <input type="email" name="bayiportal_dealer_email" value="<?php echo esc_attr($dealer_email); ?>" class="regular-text">
                        </td>
                    </tr>
                    <tr>
                        <th scope="row"><?php _e('Giris Kullanici Adi', 'bayiportal'); ?></th>
                        <td>
                            <input type="text" name="bayiportal_dealer_username" value="<?php echo esc_attr($dealer_username); ?>" class="regular-text">
                            <p class="description"><?php _e('Bayi portalina giris icin kullanilacak kullanici adi', 'bayiportal'); ?></p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row"><?php _e('Giris Sifresi', 'bayiportal'); ?></th>
                        <td>
                            <input type="password" name="bayiportal_dealer_password" value="<?php echo esc_attr($dealer_password); ?>" class="regular-text">
                            <p class="description"><?php _e('Bayi portalina giris icin kullanilacak sifre', 'bayiportal'); ?></p>
                        </td>
                    </tr>
                </table>
                
                <!-- Indirim Ayarlari -->
                <h2 class="title"><?php _e('Indirim Ayarlari', 'bayiportal'); ?></h2>
                <table class="form-table">
                    <tr>
                        <th scope="row"><?php _e('Indirim Tipi', 'bayiportal'); ?></th>
                        <td>
                            <select name="bayiportal_discount_type" id="discount_type">
                                <option value="percentage" <?php selected($discount_type, 'percentage'); ?>><?php _e('Yuzde Indirim (%)', 'bayiportal'); ?></option>
                                <option value="fixed" <?php selected($discount_type, 'fixed'); ?>><?php _e('Sabit Tutar Indirim (TL)', 'bayiportal'); ?></option>
                                <option value="acf" <?php selected($discount_type, 'acf'); ?>><?php _e('ACF Alanindan Al', 'bayiportal'); ?></option>
                            </select>
                        </td>
                    </tr>
                    <tr class="discount-manual" <?php echo $discount_type === 'acf' ? 'style="display:none;"' : ''; ?>>
                        <th scope="row"><?php _e('Indirim Degeri', 'bayiportal'); ?></th>
                        <td>
                            <input type="number" name="bayiportal_discount_value" value="<?php echo esc_attr($discount_value); ?>" step="0.01" min="0" class="small-text">
                            <p class="description"><?php _e('Yuzde icin 10 = %10, Sabit tutar icin 50 = 50 TL', 'bayiportal'); ?></p>
                        </td>
                    </tr>
                    <tr class="discount-acf" <?php echo $discount_type !== 'acf' ? 'style="display:none;"' : ''; ?>>
                        <th scope="row"><?php _e('ACF Indirim Alani', 'bayiportal'); ?></th>
                        <td>
                            <input type="text" name="bayiportal_acf_discount_field" value="<?php echo esc_attr($acf_discount_field); ?>" class="regular-text" placeholder="bayi_indirim_yuzdesi">
                            <p class="description"><?php _e('Urun bazli indirim yuzdesi icin ACF alan adi (ornek: bayi_indirim_yuzdesi)', 'bayiportal'); ?></p>
                        </td>
                    </tr>
                    <tr class="discount-acf" <?php echo $discount_type !== 'acf' ? 'style="display:none;"' : ''; ?>>
                        <th scope="row"><?php _e('ACF Bayi Fiyati Alani', 'bayiportal'); ?></th>
                        <td>
                            <input type="text" name="bayiportal_acf_dealer_price_field" value="<?php echo esc_attr($acf_dealer_price_field); ?>" class="regular-text" placeholder="bayi_fiyati">
                            <p class="description"><?php _e('Dogrudan bayi fiyati icin ACF alan adi (ornek: bayi_fiyati) - Bu alan dolu ise indirim yerine bu fiyat kullanilir', 'bayiportal'); ?></p>
                        </td>
                    </tr>
                </table>
                
                <!-- Kategori Bazli Indirimler -->
                <h2 class="title"><?php _e('Kategori Bazli Indirimler (Opsiyonel)', 'bayiportal'); ?></h2>
                <p class="description"><?php _e('Belirli kategoriler icin farkli indirim oranlari belirleyebilirsiniz. Bos birakirsaniz genel indirim uygulanir.', 'bayiportal'); ?></p>
                
                <table class="widefat" style="max-width: 600px; margin-top: 10px;">
                    <thead>
                        <tr>
                            <th><?php _e('Kategori', 'bayiportal'); ?></th>
                            <th><?php _e('Indirim (%)', 'bayiportal'); ?></th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($categories as $category): ?>
                        <tr>
                            <td><?php echo esc_html($category->name); ?></td>
                            <td>
                                <input type="number" name="category_discount[<?php echo esc_attr($category->term_id); ?>]" 
                                       value="<?php echo esc_attr($category_discounts[$category->term_id] ?? ''); ?>" 
                                       step="0.01" min="0" max="100" class="small-text" placeholder="Genel">
                            </td>
                        </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
                
                <p class="submit">
                    <input type="submit" name="bayiportal_save_settings" class="button button-primary" value="<?php _e('Ayarlari Kaydet', 'bayiportal'); ?>">
                </p>
            </form>
            
            <script>
            jQuery(document).ready(function($) {
                $('#discount_type').on('change', function() {
                    if ($(this).val() === 'acf') {
                        $('.discount-manual').hide();
                        $('.discount-acf').show();
                    } else {
                        $('.discount-manual').show();
                        $('.discount-acf').hide();
                    }
                });
            });
            </script>
        </div>
        <?php
    }
    
    /**
     * Debug sayfasi
     */
    public function debug_page() {
        $debug_file = WP_CONTENT_DIR . '/bayiportal-debug.log';
        
        // Log temizleme
        if (isset($_POST['clear_logs']) && wp_verify_nonce($_POST['_wpnonce'], 'bayiportal_clear_logs')) {
            if (file_exists($debug_file)) {
                unlink($debug_file);
            }
            echo '<div class="notice notice-success"><p>' . __('Loglar temizlendi!', 'bayiportal') . '</p></div>';
        }
        
        $logs = '';
        if (file_exists($debug_file)) {
            $logs = file_get_contents($debug_file);
            // Son 500 satiri al
            $lines = explode("\n", $logs);
            $lines = array_slice($lines, -500);
            $logs = implode("\n", $lines);
        }
        
        ?>
        <div class="wrap">
            <h1><?php _e('Debug Loglari', 'bayiportal'); ?></h1>
            
            <div style="margin-bottom: 20px;">
                <p>
                    <strong><?php _e('Debug Modu:', 'bayiportal'); ?></strong>
                    <?php echo $this->debug_mode ? '<span style="color: #16a34a;">Aktif</span>' : '<span style="color: #dc2626;">Pasif</span>'; ?>
                    <?php if (!$this->debug_mode): ?>
                    - <a href="<?php echo admin_url('admin.php?page=bayiportal-settings'); ?>"><?php _e('Aktif etmek icin Ayarlara gidin', 'bayiportal'); ?></a>
                    <?php endif; ?>
                </p>
                
                <form method="post" style="display: inline;">
                    <?php wp_nonce_field('bayiportal_clear_logs'); ?>
                    <input type="submit" name="clear_logs" class="button" value="<?php _e('Loglari Temizle', 'bayiportal'); ?>" onclick="return confirm('<?php _e('Tum loglar silinecek. Emin misiniz?', 'bayiportal'); ?>');">
                </form>
            </div>
            
            <div style="background: #1e1e1e; padding: 15px; border-radius: 8px; max-height: 600px; overflow-y: auto;">
                <pre style="color: #d4d4d4; margin: 0; font-family: 'Consolas', 'Monaco', monospace; font-size: 12px; line-height: 1.5; white-space: pre-wrap; word-wrap: break-word;"><?php echo esc_html($logs ?: __('Henuz log bulunmuyor. Debug modunu aktif edin ve API istekleri yapin.', 'bayiportal')); ?></pre>
            </div>
        </div>
        <?php
    }
    
    /**
     * REST API endpoint'lerini kaydet
     */
    public function register_rest_routes() {
        // Auth endpoint
        register_rest_route('bayiportal/v1', '/auth', [
            'methods' => 'POST',
            'callback' => [$this, 'api_auth'],
            'permission_callback' => '__return_true',
        ]);
        
        register_rest_route('bayiportal/v1', '/login', [
            'methods' => 'POST',
            'callback' => [$this, 'api_auth'],
            'permission_callback' => '__return_true',
        ]);
        
        // Products endpoint
        register_rest_route('bayiportal/v1', '/products', [
            'methods' => 'GET',
            'callback' => [$this, 'api_products'],
            'permission_callback' => [$this, 'check_auth'],
        ]);
        
        // Orders endpoint
        register_rest_route('bayiportal/v1', '/orders', [
            'methods' => ['GET', 'POST'],
            'callback' => [$this, 'api_orders'],
            'permission_callback' => [$this, 'check_auth'],
        ]);
        
        // Dealer info endpoint
        register_rest_route('bayiportal/v1', '/dealer-info', [
            'methods' => 'GET',
            'callback' => [$this, 'api_dealer_info'],
            'permission_callback' => [$this, 'check_auth'],
        ]);
        
        // Payment endpoints
        register_rest_route('bayiportal/v1', '/payment/create', [
            'methods' => 'POST',
            'callback' => [$this, 'api_payment_create'],
            'permission_callback' => [$this, 'check_auth'],
        ]);
        
        register_rest_route('bayiportal/v1', '/payment/status', [
            'methods' => 'GET',
            'callback' => [$this, 'api_payment_status'],
            'permission_callback' => [$this, 'check_auth'],
        ]);
        
        register_rest_route('bayiportal/v1', '/payment/callback', [
            'methods' => 'POST',
            'callback' => [$this, 'api_payment_callback'],
            'permission_callback' => '__return_true', // Callback icin auth gerekli degil
        ]);
    }
    
    /**
     * Auth kontrolu
     */
    public function check_auth($request) {
        $this->debug_log('Auth check started');
        
        // WooCommerce Basic Auth kontrolu
        $auth_header = $request->get_header('Authorization');
        
        if ($auth_header && strpos($auth_header, 'Basic') === 0) {
            $credentials = base64_decode(substr($auth_header, 6));
            list($key, $secret) = explode(':', $credentials);
            
            // WooCommerce API key kontrolu
            global $wpdb;
            $api_key = $wpdb->get_row($wpdb->prepare(
                "SELECT * FROM {$wpdb->prefix}woocommerce_api_keys WHERE consumer_key = %s",
                wc_api_hash($key)
            ));
            
            if ($api_key && hash_equals($api_key->consumer_secret, $secret)) {
                $this->debug_log('Auth success: WooCommerce API key');
                return true;
            }
        }
        
        // Bearer token kontrolu
        if ($auth_header && strpos($auth_header, 'Bearer') === 0) {
            $token = trim(substr($auth_header, 7));
            
            // Token dogrulama (basit ornek - production'da JWT kullanin)
            $stored_token = get_transient('bayiportal_auth_token');
            
            if ($token && $stored_token && hash_equals($stored_token, $token)) {
                $this->debug_log('Auth success: Bearer token');
                return true;
            }
        }
        
        $this->debug_log('Auth failed', ['header' => $auth_header ? 'present' : 'missing']);
        return new WP_Error('unauthorized', __('Yetkisiz erisim', 'bayiportal'), ['status' => 401]);
    }
    
    /**
     * API: Auth (Login)
     */
    public function api_auth($request) {
        $this->debug_log('Login attempt started');
        
        $params = $request->get_json_params();
        $username = sanitize_text_field($params['username'] ?? '');
        $password = sanitize_text_field($params['password'] ?? '');
        
        $this->debug_log('Login params', ['username' => $username, 'password' => '***']);
        
        // Bayi bilgilerini kontrol et
        $dealer_enabled = get_option('bayiportal_dealer_enabled', false);
        $dealer_username = get_option('bayiportal_dealer_username', '');
        $dealer_password = get_option('bayiportal_dealer_password', '');
        
        if (!$dealer_enabled) {
            $this->debug_log('Login failed: Dealer system disabled');
            return new WP_Error('dealer_disabled', __('Bayi sistemi aktif degil', 'bayiportal'), ['status' => 403]);
        }
        
        if ($username !== $dealer_username || $password !== $dealer_password) {
            $this->debug_log('Login failed: Invalid credentials');
            return new WP_Error('invalid_credentials', __('Gecersiz kullanici adi veya sifre', 'bayiportal'), ['status' => 401]);
        }
        
        // Token olustur
        $token = wp_generate_password(64, false);
        set_transient('bayiportal_auth_token', $token, DAY_IN_SECONDS);
        
        $this->debug_log('Login success', ['token_generated' => true]);
        
        return [
            'success' => true,
            'token' => $token,
            'dealer' => [
                'name' => get_option('bayiportal_dealer_name', ''),
                'email' => get_option('bayiportal_dealer_email', ''),
            ],
            'discount' => [
                'type' => get_option('bayiportal_discount_type', 'percentage'),
                'value' => get_option('bayiportal_discount_value', 0),
            ],
        ];
    }
    
    /**
     * API: Products (Bayi fiyatlari ile)
     */
    public function api_products($request) {
        $this->debug_log('Products request started');
        
        $args = [
            'status' => 'publish',
            'limit' => $request->get_param('per_page') ?: 100,
            'page' => $request->get_param('page') ?: 1,
        ];
        
        $category = $request->get_param('category');
        if ($category) {
            $args['category'] = [$category];
        }
        
        $products = wc_get_products($args);
        $result = [];
        
        foreach ($products as $product) {
            $dealer_price = $this->get_dealer_price($product);
            $regular_price = $product->get_regular_price();
            
            $result[] = [
                'id' => $product->get_id(),
                'name' => $product->get_name(),
                'slug' => $product->get_slug(),
                'sku' => $product->get_sku(),
                'regular_price' => $regular_price,
                'dealer_price' => $dealer_price,
                'discount_amount' => $regular_price - $dealer_price,
                'discount_percentage' => $regular_price > 0 ? round((($regular_price - $dealer_price) / $regular_price) * 100, 2) : 0,
                'stock_status' => $product->get_stock_status(),
                'stock_quantity' => $product->get_stock_quantity(),
                'categories' => wp_get_post_terms($product->get_id(), 'product_cat', ['fields' => 'names']),
                'images' => $this->get_product_images($product),
                'short_description' => $product->get_short_description(),
            ];
        }
        
        $this->debug_log('Products fetched', ['count' => count($result)]);
        
        return $result;
    }
    
    /**
     * API: Orders
     */
    public function api_orders($request) {
        if ($request->get_method() === 'POST') {
            return $this->create_order($request);
        }
        
        $this->debug_log('Orders list request');
        
        // Bayi siparislerini listele
        $args = [
            'limit' => $request->get_param('per_page') ?: 20,
            'page' => $request->get_param('page') ?: 1,
            'meta_key' => '_bayiportal_order',
            'meta_value' => '1',
        ];
        
        $orders = wc_get_orders($args);
        $result = [];
        
        foreach ($orders as $order) {
            $result[] = [
                'id' => $order->get_id(),
                'status' => $order->get_status(),
                'total' => $order->get_total(),
                'date_created' => $order->get_date_created()->format('Y-m-d H:i:s'),
                'items_count' => $order->get_item_count(),
            ];
        }
        
        return $result;
    }
    
    /**
     * Siparis olustur
     */
    private function create_order($request) {
        $this->debug_log('Order creation started');
        
        $params = $request->get_json_params();
        
        try {
            $order = wc_create_order();
            
            // Urunleri ekle
            foreach ($params['line_items'] ?? [] as $item) {
                $product = wc_get_product($item['product_id']);
                if (!$product) continue;
                
                $dealer_price = $this->get_dealer_price($product);
                $order->add_product($product, $item['quantity'], [
                    'subtotal' => $dealer_price * $item['quantity'],
                    'total' => $dealer_price * $item['quantity'],
                ]);
            }
            
            // Fatura bilgilerini ekle
            if (isset($params['billing'])) {
                $order->set_address($params['billing'], 'billing');
            }
            
            // Kargo bilgilerini ekle
            if (isset($params['shipping'])) {
                $order->set_address($params['shipping'], 'shipping');
            }
            
            // Bayi siparisi olarak isaretle
            $order->update_meta_data('_bayiportal_order', '1');
            $order->update_meta_data('_bayiportal_dealer_name', get_option('bayiportal_dealer_name', ''));
            
            $order->calculate_totals();
            $order->save();
            
            $this->debug_log('Order created', ['order_id' => $order->get_id()]);
            
            return [
                'id' => $order->get_id(),
                'status' => $order->get_status(),
                'total' => $order->get_total(),
            ];
            
        } catch (Exception $e) {
            $this->debug_log('Order creation failed', ['error' => $e->getMessage()]);
            return new WP_Error('order_error', $e->getMessage(), ['status' => 500]);
        }
    }
    
    /**
     * API: Dealer Info
     */
    public function api_dealer_info($request) {
        return [
            'name' => get_option('bayiportal_dealer_name', ''),
            'email' => get_option('bayiportal_dealer_email', ''),
            'discount' => [
                'type' => get_option('bayiportal_discount_type', 'percentage'),
                'value' => get_option('bayiportal_discount_value', 0),
            ],
        ];
    }
    
    /**
     * API: Payment Create
     */
    public function api_payment_create($request) {
        $this->debug_log('Payment create request started');
        
        $params = $request->get_json_params();
        $order_id = intval($params['order_id'] ?? 0);
        $return_url = sanitize_url($params['return_url'] ?? '');
        
        $this->debug_log('Payment params', ['order_id' => $order_id, 'return_url' => $return_url]);
        
        if (!$order_id) {
            return new WP_Error('missing_order_id', __('Siparis ID gerekli', 'bayiportal'), ['status' => 400]);
        }
        
        $order = wc_get_order($order_id);
        if (!$order) {
            $this->debug_log('Payment failed: Order not found');
            return new WP_Error('order_not_found', __('Siparis bulunamadi', 'bayiportal'), ['status' => 404]);
        }
        
        // VakifBank sanal POS entegrasyonu burada yapilacak
        // Simdilik mock response donuyoruz
        $session_id = 'bp_' . uniqid();
        
        // Session'i kaydet
        set_transient('bayiportal_payment_' . $session_id, [
            'order_id' => $order_id,
            'amount' => $order->get_total(),
            'return_url' => $return_url,
            'status' => 'pending',
            'created_at' => time(),
        ], HOUR_IN_SECONDS);
        
        $this->debug_log('Payment session created', ['session_id' => $session_id]);
        
        // Gercek VakifBank entegrasyonu icin buraya POS URL'i eklenmeli
        $payment_url = add_query_arg([
            'session_id' => $session_id,
            'order_id' => $order_id,
        ], home_url('/bayiportal-payment/'));
        
        return [
            'payment_url' => $payment_url,
            'session_id' => $session_id,
        ];
    }
    
    /**
     * API: Payment Status
     */
    public function api_payment_status($request) {
        $session_id = sanitize_text_field($request->get_param('session_id'));
        
        $this->debug_log('Payment status check', ['session_id' => $session_id]);
        
        if (!$session_id) {
            return new WP_Error('missing_session', __('Session ID gerekli', 'bayiportal'), ['status' => 400]);
        }
        
        $payment_data = get_transient('bayiportal_payment_' . $session_id);
        
        if (!$payment_data) {
            return [
                'status' => 'expired',
                'message' => __('Odeme oturumu suresi dolmus', 'bayiportal'),
            ];
        }
        
        return [
            'status' => $payment_data['status'],
            'order_id' => $payment_data['order_id'],
            'message' => $payment_data['status'] === 'success' 
                ? __('Odeme basarili', 'bayiportal') 
                : __('Odeme bekleniyor', 'bayiportal'),
        ];
    }
    
    /**
     * API: Payment Callback
     */
    public function api_payment_callback($request) {
        $this->debug_log('Payment callback received', $request->get_params());
        
        // VakifBank'tan gelen callback'i isle
        // Burada banka'nin gonderdigi parametreler kontrol edilmeli
        
        $session_id = sanitize_text_field($request->get_param('session_id'));
        $status = sanitize_text_field($request->get_param('status'));
        
        if ($session_id) {
            $payment_data = get_transient('bayiportal_payment_' . $session_id);
            
            if ($payment_data) {
                $payment_data['status'] = $status === 'success' ? 'success' : 'failed';
                set_transient('bayiportal_payment_' . $session_id, $payment_data, HOUR_IN_SECONDS);
                
                // Siparis durumunu guncelle
                if ($status === 'success' && isset($payment_data['order_id'])) {
                    $order = wc_get_order($payment_data['order_id']);
                    if ($order) {
                        $order->payment_complete();
                        $order->add_order_note(__('BayiPortal uzerinden odeme alindi', 'bayiportal'));
                    }
                }
                
                $this->debug_log('Payment callback processed', ['session_id' => $session_id, 'status' => $status]);
            }
        }
        
        return ['received' => true];
    }
    
    /**
     * Bayi indirimi uygula
     */
    public function apply_dealer_discount($price, $product) {
        // Sadece REST API isteklerinde veya bayi oturumu aktifse uygula
        if (!$this->is_dealer_session()) {
            return $price;
        }
        
        return $this->get_dealer_price($product);
    }
    
    /**
     * Bayi oturumu kontrolu
     */
    private function is_dealer_session() {
        // REST API isteklerinde kontrol
        if (defined('REST_REQUEST') && REST_REQUEST) {
            $auth_header = isset($_SERVER['HTTP_AUTHORIZATION']) ? $_SERVER['HTTP_AUTHORIZATION'] : '';
            
            if (strpos($auth_header, 'Bearer') === 0) {
                $token = trim(substr($auth_header, 7));
                $stored_token = get_transient('bayiportal_auth_token');
                return $token && $stored_token && hash_equals($stored_token, $token);
            }
        }
        
        return false;
    }
    
    /**
     * Bayi fiyatini hesapla
     */
    private function get_dealer_price($product) {
        $regular_price = floatval($product->get_regular_price());
        
        if ($regular_price <= 0) {
            return $regular_price;
        }
        
        $discount_type = get_option('bayiportal_discount_type', 'percentage');
        
        // ACF kullanimi
        if ($discount_type === 'acf') {
            // Oncelikle dogrudan bayi fiyati alanini kontrol et
            $acf_price_field = get_option('bayiportal_acf_dealer_price_field', '');
            if ($acf_price_field && function_exists('get_field')) {
                $dealer_price = get_field($acf_price_field, $product->get_id());
                if ($dealer_price && floatval($dealer_price) > 0) {
                    return floatval($dealer_price);
                }
            }
            
            // Indirim yuzdesi alanini kontrol et
            $acf_discount_field = get_option('bayiportal_acf_discount_field', '');
            if ($acf_discount_field && function_exists('get_field')) {
                $discount_percent = get_field($acf_discount_field, $product->get_id());
                if ($discount_percent && floatval($discount_percent) > 0) {
                    return $regular_price * (1 - (floatval($discount_percent) / 100));
                }
            }
        }
        
        // Kategori bazli indirim kontrolu
        $category_discounts = get_option('bayiportal_category_discounts', []);
        $product_categories = wp_get_post_terms($product->get_id(), 'product_cat', ['fields' => 'ids']);
        
        foreach ($product_categories as $cat_id) {
            if (isset($category_discounts[$cat_id]) && floatval($category_discounts[$cat_id]) > 0) {
                return $regular_price * (1 - (floatval($category_discounts[$cat_id]) / 100));
            }
        }
        
        // Genel indirim uygula
        $discount_value = floatval(get_option('bayiportal_discount_value', 0));
        
        if ($discount_value <= 0) {
            return $regular_price;
        }
        
        if ($discount_type === 'percentage') {
            return $regular_price * (1 - ($discount_value / 100));
        } elseif ($discount_type === 'fixed') {
            return max(0, $regular_price - $discount_value);
        }
        
        return $regular_price;
    }
    
    /**
     * Urun resimlerini al
     */
    private function get_product_images($product) {
        $images = [];
        
        // Ana resim
        $main_image_id = $product->get_image_id();
        if ($main_image_id) {
            $images[] = [
                'id' => $main_image_id,
                'src' => wp_get_attachment_url($main_image_id),
            ];
        }
        
        // Galeri resimleri
        $gallery_ids = $product->get_gallery_image_ids();
        foreach ($gallery_ids as $image_id) {
            $images[] = [
                'id' => $image_id,
                'src' => wp_get_attachment_url($image_id),
            ];
        }
        
        return $images;
    }
}

// Plugin'i baslat
function bayiportal_init() {
    return BayiPortal::instance();
}
add_action('plugins_loaded', 'bayiportal_init');

// Aktivasyon hook'u
register_activation_hook(__FILE__, function() {
    // Varsayilan ayarlari olustur
    add_option('bayiportal_debug_mode', false);
    add_option('bayiportal_dealer_enabled', false);
    add_option('bayiportal_discount_type', 'percentage');
    add_option('bayiportal_discount_value', 10);
});

// Deaktivasyon hook'u
register_deactivation_hook(__FILE__, function() {
    // Token'i temizle
    delete_transient('bayiportal_auth_token');
});
