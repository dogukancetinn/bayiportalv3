import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { Package, ShoppingCart, Clock, ArrowUpRight, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import useSWR from 'swr';
import { fetchProducts, fetchOrders, formatPrice } from '../lib/woocommerce';

export default function DashboardPage() {
  const { user } = useAuth();
  const { total, itemCount } = useCart();
  
  const { data: products = [] } = useSWR(user ? 'products' : null, fetchProducts);
  const { data: orders = [] } = useSWR(user ? ['orders', user.id] : null, () => fetchOrders(user!.id));

  if (!user) return null;

  const isAdmin = user.role === 'administrator';

  const stats = isAdmin ? [
    { label: 'Toplam Urun', value: products.length.toString(), icon: Package, color: 'text-blue-400' },
    { label: 'Toplam Siparis', value: orders.length.toString(), icon: Clock, color: 'text-gold-400' },
  ] : [
    { label: 'Toplam Urun', value: products.length.toString(), icon: Package, color: 'text-blue-400' },
    { label: 'Sepet Tutari', value: formatPrice(total), icon: ShoppingCart, color: 'text-gold-400' },
    { label: 'Sepetteki Urun', value: itemCount.toString(), icon: ShoppingCart, color: 'text-green-400' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-[var(--font-display)] text-white">
          Hos Geldiniz, <span className="text-gold-gradient">{user.displayName.split(' ')[0]}</span>
        </h1>
        <p className="text-slate-400 mt-2">{user.company}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {stats.map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass-card rounded-2xl p-6 hover:border-gold-500/30 transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-xl bg-navy-800 ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <span className="flex items-center gap-1 text-xs font-medium text-green-400">
                <ArrowUpRight className="w-3 h-3" />Aktif
              </span>
            </div>
            <div className="text-2xl font-bold text-white">{stat.value}</div>
            <div className="text-sm text-slate-400 mt-1">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {!isAdmin && (
        <div className="glass-card rounded-2xl p-8">
          <h3 className="text-sm font-bold text-white mb-4">Son Siparisler</h3>
          {orders.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-slate-500 text-sm">Henuz siparisiniz yok</p>
              <p className="text-xs text-slate-600 mt-1">Urun katalogundan siparis verebilirsiniz</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.slice(0, 5).map((order: any) => (
                <div key={order.id} className="flex items-center justify-between bg-navy-800/50 rounded-xl p-3">
                  <div>
                    <p className="text-sm font-semibold text-white">#{order.number}</p>
                    <p className="text-[10px] text-slate-500">{new Date(order.date_created).toLocaleDateString('tr-TR')}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-white">{formatPrice(parseFloat(order.total))}</span>
                    <p className="text-[10px] text-slate-500">{order.status === 'completed' ? 'Tamamlandi' : order.status === 'processing' ? 'Hazirlaniyor' : 'Beklemede'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {isAdmin && (
        <div className="glass-card rounded-2xl p-8">
          <h3 className="text-sm font-bold text-white mb-4">Yonetici Paneli</h3>
          <p className="text-slate-400 text-sm mb-4">Sol menuden Fiyat Yonetimi sayfasina giderek her bayi icin ozel fiyatlandirma yapabilirsiniz.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-navy-800/50 rounded-xl p-4">
              <p className="text-xs text-slate-400 mb-1">Toplam Urun</p>
              <p className="text-2xl font-bold text-white">{products.length}</p>
            </div>
            <div className="bg-navy-800/50 rounded-xl p-4">
              <p className="text-xs text-slate-400 mb-1">Toplam Siparis</p>
              <p className="text-2xl font-bold text-white">{orders.length}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
