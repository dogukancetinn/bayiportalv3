import { useState } from 'react';
import { Shield, Package, Key, Users, Globe, Rocket, DollarSign, Settings, CheckCircle2, AlertTriangle, ChevronDown, ChevronRight, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface StepProps {
  number: string;
  title: string;
  children: React.ReactNode;
  icon: typeof Shield;
}

function Step({ number, title, children, icon: Icon }: StepProps) {
  const [open, setOpen] = useState(false);
  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-4 p-6 text-left hover:bg-navy-800/30 transition-colors">
        <div className="w-10 h-10 gold-gradient rounded-xl flex items-center justify-center text-navy-950 font-bold text-sm flex-shrink-0">{number}</div>
        <Icon className="w-5 h-5 text-gold-400 flex-shrink-0" />
        <span className="text-base font-semibold text-white flex-1">{title}</span>
        {open ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-6 pb-6 pt-2 border-t border-navy-700/50 space-y-4 text-sm text-slate-300 leading-relaxed">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return <code className="bg-navy-800 text-gold-300 px-2 py-0.5 rounded text-xs font-mono">{children}</code>;
}

function Warn({ children }: { children: React.ReactNode }) {
  return <div className="flex items-start gap-3 bg-amber-500/5 border border-amber-500/20 rounded-xl p-4"><AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" /><div>{children}</div></div>;
}

function Tip({ children }: { children: React.ReactNode }) {
  return <div className="flex items-start gap-3 bg-green-500/5 border border-green-500/20 rounded-xl p-4"><CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" /><div>{children}</div></div>;
}

export default function InstallGuidePage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center py-8">
        <div className="w-16 h-16 gold-gradient rounded-2xl flex items-center justify-center mx-auto mb-6">
          <BookOpen className="w-8 h-8 text-navy-950" />
        </div>
        <h1 className="text-4xl font-bold font-[var(--font-display)] text-white mb-3">Kurulum Rehberi</h1>
        <p className="text-lg text-slate-400">BayiPortal WooCommerce Entegreli Bayi Portalı — Sıfırdan Kurulum</p>
        <p className="text-sm text-slate-500 mt-2">Bash / SSH gerektirmez — Tamamen tarayıcı üzerinden yapılır</p>
      </div>

      {/* Gereksinimler */}
      <div className="glass-card rounded-2xl p-6">
        <h2 className="text-lg font-bold font-[var(--font-display)] text-white mb-4">📋 Gereksinimler</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            'WordPress kurulu ana site',
            'WooCommerce eklentisi aktif',
            'Hosting paneli erişimi (cPanel/Plesk)',
            'Domain DNS yönetimi',
            'Vercel hesabı (ücretsiz)',
            'FTP istemcisi (FileZilla vb.)',
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />{item}
            </div>
          ))}
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-3">
        <Step number="1" title="WooCommerce'i Kur" icon={Package}>
          <ol className="list-decimal list-inside space-y-2">
            <li>WordPress Admin → <Code>Eklentiler</Code> → <Code>Yeni Ekle</Code></li>
            <li>Arama kutusuna "WooCommerce" yaz</li>
            <li><Code>Şimdi Kur</Code> → <Code>Etkinleştir</Code></li>
            <li>Kurulum sihirbazını tamamla: Türkiye, Türk Lirası (₺)</li>
          </ol>
          <Tip>WooCommerce zaten kuruluysa bu adımı atla.</Tip>
        </Step>

        <Step number="2" title="Ürünlerini Ekle" icon={Package}>
          <ol className="list-decimal list-inside space-y-2">
            <li>WordPress Admin → <Code>Ürünler</Code> → <Code>Yeni Ekle</Code></li>
            <li>Her ürün için ad, fiyat, stok, kategori, görsel ekle</li>
            <li><Code>Yayınla</Code> ile kaydet</li>
          </ol>
          <Tip>En az 5-10 ürün ekle ki bayiler görebilsin.</Tip>
        </Step>

        <Step number="3" title="WooCommerce API Anahtarı Oluştur" icon={Key}>
          <ol className="list-decimal list-inside space-y-2">
            <li>WordPress Admin → <Code>WooCommerce</Code> → <Code>Ayarlar</Code> → <Code>Gelişmiş</Code> → <Code>REST API</Code></li>
            <li><Code>Anahtar ekle / oluştur</Code> butonuna tıkla</li>
            <li>Açıklama: <Code>BayiPortal API Anahtarı</Code></li>
            <li>Kullanıcı: Kendi admin hesabını seç</li>
            <li>İzinler: <strong className="text-gold-400">Oku/Yaz</strong> seç ← ÖNEMLİ!</li>
            <li><Code>API anahtarı oluştur</Code> butonuna tıkla</li>
          </ol>
          <div className="bg-navy-800 rounded-xl p-4 mt-3 font-mono text-sm">
            <p className="text-slate-400 mb-1">Oluşturulan anahtarlar:</p>
            <p className="text-gold-300">Consumer Key:    <Code>ck_xxxxxxxxxxxxxx</Code></p>
            <p className="text-gold-300">Consumer Secret: <Code>cs_xxxxxxxxxxxxxx</Code></p>
          </div>
          <Warn>Sayfayı kapatmadan ÖNCE bu kodları kopyala ve güvenli yerde sakla! Bir daha göremezsin!</Warn>
        </Step>

        <Step number="4" title="BayiPortal Plugin'ini Kur" icon={Shield}>
          <ol className="list-decimal list-inside space-y-2">
            <li>Proje dosyalarından <Code>public/bayiportal-plugin/</Code> klasörünü bilgisayarına indir</li>
            <li>Klasörü ZIP olarak sıkıştır → <Code>bayiportal-plugin.zip</Code></li>
            <li>WordPress Admin → <Code>Eklentiler</Code> → <Code>Yeni Ekle</Code> → <Code>Eklenti Yükle</Code></li>
            <li>ZIP dosyasını seç → <Code>Şimdi Kur</Code> → <Code>Etkinleştir</Code></li>
          </ol>
          <Tip>Sol menüde "Bayi Yönetimi" menüsü çıktıysa plugin doğru kurulmuş demektir.</Tip>
        </Step>

        <Step number="5" title="Bayi Kullanıcıları Oluştur" icon={Users}>
          <p className="mb-3">Her bayi için bir WordPress kullanıcı hesabı oluştur:</p>
          <ol className="list-decimal list-inside space-y-2">
            <li>WordPress Admin → <Code>Kullanıcılar</Code> → <Code>Yeni Ekle</Code></li>
            <li>Kullanıcı adı, e-posta, şifre gir</li>
            <li>Rol: <strong className="text-gold-400">Standart Bayi / Premium Bayi / VIP Bayi</strong> seç</li>
            <li><Code>Yeni Kullanıcı Ekle</Code> butonuna tıkla</li>
            <li>Kullanıcı listesinde bayiye tıkla → <strong>"Bayi Bilgileri"</strong> bölümünü doldur:</li>
          </ol>
          <div className="bg-navy-800 rounded-xl p-4 mt-3 space-y-1">
            <p>Firma Adı: <Code>Yılmaz Teknoloji</Code></p>
            <p>İndirim Oranı: <Code>25</Code> (% olarak)</p>
            <p>Kredi Limiti: <Code>50000</Code> (₺ olarak)</p>
            <p>Vergi No: <Code>1234567890</Code></p>
            <p>Telefon: <Code>+90 532 123 4567</Code></p>
            <p>Adres / Şehir: <Code>Atatürk Cad. No:45, İstanbul</Code></p>
          </div>
          <div className="mt-4">
            <p className="font-semibold text-white mb-2">Önerilen temel indirim oranları:</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-700/30 rounded-xl p-3 text-center">
                <p className="text-xs text-slate-400">Standart Bayi</p>
                <p className="text-lg font-bold text-slate-300">%10-20</p>
              </div>
              <div className="bg-gold-500/10 rounded-xl p-3 text-center">
                <p className="text-xs text-gold-400">Premium Bayi</p>
                <p className="text-lg font-bold text-gold-400">%20-35</p>
              </div>
              <div className="bg-amber-500/10 rounded-xl p-3 text-center">
                <p className="text-xs text-amber-300">VIP Bayi</p>
                <p className="text-lg font-bold text-amber-300">%35-50</p>
              </div>
            </div>
          </div>
        </Step>

        <Step number="6" title="Subdomain Oluştur" icon={Globe}>
          <p className="mb-3">cPanel veya Plesk üzerinden subdomain oluştur:</p>
          <div className="bg-navy-800 rounded-xl p-4">
            <p>Subdomain adı: <Code>bayi</Code></p>
            <p>Sonuç: <Code>bayi.siteniz.com</Code></p>
            <p>Belge kökü: <Code>public_html/bayi</Code></p>
          </div>
        </Step>

        <Step number="7" title="Frontend'i Yayınlama (Vercel)" icon={Rocket}>
          <p className="font-semibold text-white mb-3">Seçenek A: Vercel (Önerilen — Ücretsiz)</p>
          <ol className="list-decimal list-inside space-y-2 mb-4">
            <li>Proje kodunu GitHub'a push'la</li>
            <li><Code>vercel.com</Code> → GitHub hesabınla giriş yap</li>
            <li><Code>Add New → Project</Code> → GitHub repo'nu seç → Import</li>
            <li>Framework: <Code>Vite</Code> → Deploy</li>
          </ol>

          <p className="font-semibold text-white mb-3">Ortam değişkenlerini ayarla:</p>
          <p className="text-xs text-slate-400 mb-2">Vercel Dashboard → Settings → Environment Variables</p>
          <div className="bg-navy-800 rounded-xl p-4 space-y-2 mb-4">
            <p><Code>VITE_WC_SITE_URL</Code> = <Code>https://siteniz.com</Code></p>
            <p><Code>VITE_WC_API_URL</Code> = <Code>https://siteniz.com/wp-json/bayiportal/v1</Code></p>
            <p><Code>VITE_WC_CONSUMER_KEY</Code> = <Code>ck_3.ADIMDA_ALDIĞIN_ANAHTAR</Code></p>
            <p><Code>VITE_WC_CONSUMER_SECRET</Code> = <Code>cs_3.ADIMDA_ALDIĞIN_ANAHTAR</Code></p>
          </div>
          <Warn>Ortam değişkenleri ekledikten sonra mutlaka "Redeploy" yap!</Warn>

          <p className="font-semibold text-white mb-3 mt-4">Custom Domain ekle:</p>
          <ol className="list-decimal list-inside space-y-2">
            <li>Vercel Dashboard → Settings → Domains → <Code>bayi.siteniz.com</Code> ekle</li>
            <li>DNS yöneticinde CNAME kaydı ekle:</li>
          </ol>
          <div className="bg-navy-800 rounded-xl p-4 mt-2">
            <p>Tip: <Code>CNAME</Code></p>
            <p>Ad/Host: <Code>bayi</Code></p>
            <p>Değer: <Code>cname.vercel-dns.com</Code></p>
          </div>
          <Tip>DNS yayılması 5-30 dakika sürebilir. SSL otomatik kurulacak.</Tip>
        </Step>

        <Step number="8" title="Özel Fiyatlandırma Ayarla" icon={DollarSign}>
          <p className="mb-3">Bu senin istediğin en önemli özellik — her bayi × her ürün için bağımsız fiyat:</p>
          <ol className="list-decimal list-inside space-y-2">
            <li><Code>admin</Code> hesabıyla BayiPortal'a giriş yap</li>
            <li>Sol menüden <Code>Fiyat Yönetimi</Code> sayfasına git</li>
            <li>Bayi seç (örn: Ahmet Yılmaz)</li>
            <li>İstediğin üründe <Code>Özel Fiyat</Code> butonuna tıkla</li>
            <li>İki seçenek:</li>
          </ol>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-4">
              <p className="font-semibold text-purple-300 mb-1">% İndirim</p>
              <p className="text-xs text-slate-400">Liste fiyatından %X düş</p>
              <p className="text-xs text-slate-500 mt-1">Örn: 2.499₺ → %30 → 1.749₺</p>
              <p className="text-[10px] text-green-400 mt-1">Ana site fiyatı değişince otomatik güncellenir</p>
            </div>
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
              <p className="font-semibold text-blue-300 mb-1">₺ Sabit Fiyat</p>
              <p className="text-xs text-slate-400">Ne olursa olsun bu fiyat</p>
              <p className="text-xs text-slate-500 mt-1">Örn: 2.499₺ → Sabit 2.199₺</p>
              <p className="text-[10px] text-amber-400 mt-1">Ana site fiyatı değişse bile sabit kalır</p>
            </div>
          </div>

          <div className="mt-4">
            <p className="font-semibold text-white mb-2">Fiyat Öncelik Sistemi:</p>
            <div className="bg-navy-800 rounded-xl p-4 space-y-2">
              <p>1. <strong className="text-purple-300">Ürün bazlı özel fiyat</strong> var mı? → EVET → Uygula (en yüksek öncelik)</p>
              <p>2. <strong className="text-gold-400">Rol bazlı indirim</strong> var mı? → EVET → Liste fiyatından %X düş</p>
              <p>3. <strong className="text-slate-300">Liste fiyatı</strong> → İndirim yoksa bunu göster</p>
            </div>
          </div>

          <div className="mt-4">
            <p className="font-semibold text-white mb-2">Örnek Senaryo — Ahmet Yılmaz (%25 temel):</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-navy-700">
                    <th className="text-left py-2 text-slate-400">Ürün</th>
                    <th className="text-left py-2 text-slate-400">Liste</th>
                    <th className="text-left py-2 text-slate-400">Özel</th>
                    <th className="text-left py-2 text-slate-400">Bayi Fiyatı</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-navy-700/30">
                    <td className="py-2">Kulaklık Pro</td>
                    <td className="py-2 text-slate-400">2.499₺</td>
                    <td className="py-2 text-purple-300">%30 indirim</td>
                    <td className="py-2 font-bold text-purple-300">1.749₺</td>
                  </tr>
                  <tr className="border-b border-navy-700/30">
                    <td className="py-2">Air Max Pro</td>
                    <td className="py-2 text-slate-400">3.299₺</td>
                    <td className="py-2 text-blue-300">2.199₺ sabit</td>
                    <td className="py-2 font-bold text-blue-300">2.199₺</td>
                  </tr>
                  <tr className="border-b border-navy-700/30">
                    <td className="py-2">Bakım Seti</td>
                    <td className="py-2 text-slate-400">899₺</td>
                    <td className="py-2 text-slate-500">—</td>
                    <td className="py-2 font-bold text-gold-400">674₺ (%25)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </Step>

        <Step number="9" title="CORS Ayarları" icon={Settings}>
          <p className="mb-3">Subdomain'den ana siteye API isteği için CORS gerekli:</p>
          <ol className="list-decimal list-inside space-y-2">
            <li>WordPress Admin → <Code>Bayi Yönetimi</Code> → <Code>Ayarlar</Code></li>
            <li>"İzin Verilen Originler" alanına <Code>https://bayi.siteniz.com</Code> ekle</li>
            <li>Kaydet</li>
          </ol>
          <Warn>Eğer CORS hatası alırsan, Bölüm 8'deki .htaccess ayarlarını da yap.</Warn>
        </Step>

        <Step number="10" title="Test Et" icon={CheckCircle2}>
          <div className="space-y-4">
            <div>
              <p className="font-semibold text-white mb-2">Bayi Girişi Test:</p>
              <div className="space-y-1">
                <p>□ bayi.siteniz.com açılıyor mu?</p>
                <p>□ Bayi kullanıcı adı/şifre ile giriş yapılabiliyor mu?</p>
                <p>□ "Beni Hatırla" seçiliyse tarayıcı kapatıp açınca otomatik giriş yapıyor mu?</p>
              </div>
            </div>
            <div>
              <p className="font-semibold text-white mb-2">Ürünler Test:</p>
              <div className="space-y-1">
                <p>□ Ürün kataloğu görünüyor mu?</p>
                <p>□ Bayi fiyatları doğru mu?</p>
                <p>□ Özel fiyatlı ürünler mor etiketli mi?</p>
                <p>□ Sepete ekleme çalışıyor mu?</p>
              </div>
            </div>
            <div>
              <p className="font-semibold text-white mb-2">Admin Test:</p>
              <div className="space-y-1">
                <p>□ admin girişi ile Fiyat Yönetimi görünüyor mu?</p>
                <p>□ Özel fiyat tanımlama çalışıyor mu?</p>
                <p>□ Bayi hesabına geçince fiyat değişikliği yansıdı mı?</p>
              </div>
            </div>
          </div>
        </Step>
      </div>

      {/* Demo Credentials */}
      <div className="bg-gradient-to-br from-gold-500/10 to-gold-700/5 border border-gold-500/20 rounded-2xl p-6">
        <h2 className="text-lg font-bold font-[var(--font-display)] text-white mb-4">🔑 Demo Giriş Bilgileri</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-navy-800/50 rounded-xl p-4 text-center">
            <p className="text-xs text-purple-300 mb-1">🛡️ Yönetici</p>
            <p className="font-mono text-sm text-white">admin / admin</p>
          </div>
          <div className="bg-navy-800/50 rounded-xl p-4 text-center">
            <p className="text-xs text-gold-400 mb-1">Premium Bayi</p>
            <p className="font-mono text-sm text-white">bayi1 / 123456</p>
          </div>
          <div className="bg-navy-800/50 rounded-xl p-4 text-center">
            <p className="text-xs text-amber-300 mb-1">VIP Bayi</p>
            <p className="font-mono text-sm text-white">bayi2 / 123456</p>
          </div>
          <div className="bg-navy-800/50 rounded-xl p-4 text-center">
            <p className="text-xs text-slate-300 mb-1">Standart Bayi</p>
            <p className="font-mono text-sm text-white">demo / demo</p>
          </div>
        </div>
      </div>
    </div>
  );
}
