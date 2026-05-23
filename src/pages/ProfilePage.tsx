import { useAuth } from '../contexts/AuthContext';
import { formatPrice } from '../lib/pricing';
import { getRoleLabel, getRoleBadgeClass } from '../lib/auth';
import { User, Building2, Mail, Phone, MapPin, Hash, Calendar, Award, Edit3, Save, X, Shield, Settings } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';

export default function ProfilePage() {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ phone: user?.phone || '', address: user?.address || '', city: user?.city || '' });

  if (!user) return null;

  const isAdmin = user.role === 'admin';
  const infoItems = [
    { icon: User, label: 'Ad Soyad', value: user.displayName },
    { icon: Building2, label: 'Firma', value: user.company },
    { icon: Mail, label: 'E-posta', value: user.email },
    { icon: Phone, label: 'Telefon', value: user.phone || '—' },
    { icon: Hash, label: 'Vergi No', value: user.taxId || '—' },
    { icon: MapPin, label: 'Adres', value: user.address && user.city ? `${user.address}, ${user.city}` : '—' },
    { icon: Calendar, label: 'Kayıt Tarihi', value: new Date(user.joinDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="h-28 bg-gradient-to-r from-navy-800 via-navy-700 to-gold-500/20 relative"><div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(212,168,83,0.2) 0%, transparent 50%)' }} /></div>
        <div className="px-8 pb-8 relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5 -mt-10">
            <div className="w-20 h-20 rounded-2xl gold-gradient flex items-center justify-center text-navy-950 font-bold text-2xl border-4 border-navy-900 shadow-xl">{user.displayName.split(' ').map(n => n[0]).join('')}</div>
            <div className="flex-1"><h1 className="text-2xl font-bold font-[var(--font-display)] text-white">{user.displayName}</h1><div className="flex items-center gap-3 mt-1"><span className="text-sm text-slate-400">{user.company}</span><span className={`text-[10px] px-2.5 py-0.5 rounded-full border ${getRoleBadgeClass(user.role)}`}>{getRoleLabel(user.role)}</span></div></div>
            {!isAdmin && <button onClick={() => setEditing(!editing)} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${editing ? 'bg-red-500/10 text-red-400 border border-red-500/30' : 'bg-gold-500/10 text-gold-400 border border-gold-500/30'}`}>{editing ? <><X className="w-4 h-4" /> İptal</> : <><Edit3 className="w-4 h-4" /> Düzenle</>}</button>}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card rounded-2xl p-6">
          <h2 className="text-lg font-bold font-[var(--font-display)] text-white mb-6">Bayi Bilgileri</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {infoItems.map(item => <div key={item.label} className="flex items-start gap-3"><div className="w-9 h-9 rounded-lg bg-navy-800 flex items-center justify-center text-slate-400 flex-shrink-0"><item.icon className="w-4 h-4" /></div><div><p className="text-xs text-slate-500">{item.label}</p><p className="text-sm text-white font-medium">{item.value}</p></div></div>)}
          </div>
          {editing && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-6 pt-6 border-t border-navy-700 space-y-4">
              <h3 className="text-sm font-semibold text-gold-400">Düzenlenebilir Alanlar</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="block text-xs text-slate-400 mb-1.5">Telefon</label><input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full bg-navy-800 border border-navy-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-gold-500/50" /></div>
                <div><label className="block text-xs text-slate-400 mb-1.5">Şehir</label><input type="text" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className="w-full bg-navy-800 border border-navy-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-gold-500/50" /></div>
              </div>
              <div><label className="block text-xs text-slate-400 mb-1.5">Adres</label><input type="text" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="w-full bg-navy-800 border border-navy-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-gold-500/50" /></div>
              <button onClick={() => setEditing(false)} className="gold-gradient text-navy-950 font-semibold px-6 py-2.5 rounded-xl text-sm flex items-center gap-2 hover:opacity-90"><Save className="w-4 h-4" />Kaydet</button>
            </motion.div>
          )}
        </div>
        <div className="space-y-5">
          {!isAdmin && <div className="bg-gradient-to-br from-gold-500/10 to-gold-700/5 border border-gold-500/20 rounded-2xl p-6"><div className="flex items-center gap-2 mb-3"><Award className="w-4 h-4 text-gold-400" /><span className="text-xs font-semibold text-gold-400">Bayi Fiyatları</span></div><p className="text-sm text-slate-300">Size özel fiyatlar ürün kataloğunda görüntülenir</p></div>}
          {isAdmin && <div className="bg-purple-500/5 border border-purple-500/20 rounded-2xl p-6"><div className="flex items-center gap-2 mb-3"><Settings className="w-4 h-4 text-purple-300" /><span className="text-xs font-semibold text-purple-300">Yönetici</span></div><p className="text-sm text-slate-300">Fiyat yönetimi panelinden bayi bazlı özel fiyatlandırma yapabilirsiniz</p></div>}
          <div className="glass-card rounded-2xl p-6"><div className="flex items-center gap-2 mb-3"><Shield className="w-4 h-4 text-green-400" /><span className="text-xs font-semibold text-white">Entegrasyon</span></div><div className="space-y-2"><div className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-green-400 rounded-full" /><span className="text-xs text-slate-300">WooCommerce Aktif</span></div><div className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-green-400 rounded-full" /><span className="text-xs text-slate-300">Stok Senkronizasyonu</span></div><div className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-green-400 rounded-full" /><span className="text-xs text-slate-300">Sipariş Senkronizasyonu</span></div></div></div>
        </div>
      </div>
    </div>
  );
}