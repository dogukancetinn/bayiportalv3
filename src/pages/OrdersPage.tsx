import { useAuth } from '../contexts/AuthContext';
import { fetchOrders, formatPrice } from '../lib/woocommerce';
import { Clock, CheckCircle2, AlertCircle, XCircle, Package, Inbox, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import useSWR from 'swr';

const statusConfig: Record<string, { icon: typeof CheckCircle2; color: string; bg: string; label: string }> = {
  'completed': { icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20', label: 'Tamamlandi' },
  'processing': { icon: Clock, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', label: 'Hazirlaniyor' },
  'on-hold': { icon: AlertCircle, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', label: 'Beklemede' },
  'pending': { icon: Clock, color: 'text-slate-400', bg: 'bg-slate-500/10 border-slate-500/20', label: 'Odeme Bekleniyor' },
  'cancelled': { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', label: 'Iptal' },
  'failed': { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', label: 'Basarisiz' },
};

export default function OrdersPage() {
  const { user } = useAuth();
  
  const { data: orders = [], isLoading, mutate } = useSWR(
    user ? ['orders', user.id] : null, 
    () => fetchOrders(user!.id),
    { revalidateOnFocus: false }
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold font-[var(--font-display)] text-white">Siparislerim</h1>
          <p className="text-sm text-slate-400 mt-1">Siparis gecmisiniz</p>
        </div>
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold font-[var(--font-display)] text-white">Siparislerim</h1>
          <p className="text-sm text-slate-400 mt-1">Siparis gecmisiniz</p>
        </div>
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-navy-800 flex items-center justify-center mx-auto mb-6">
              <Inbox className="w-10 h-10 text-slate-600" />
            </div>
            <h2 className="text-xl font-bold font-[var(--font-display)] text-white mb-2">Henuz Siparisiniz Yok</h2>
            <p className="text-slate-400 mb-6">Ilk siparisinizi vermek icin urun kataloguna goz atin</p>
            <button 
              onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'products' }))} 
              className="gold-gradient text-navy-950 font-semibold px-8 py-3 rounded-xl inline-flex items-center gap-2 hover:opacity-90"
            >
              <Package className="w-5 h-5" /> Urunlere Goz At
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-[var(--font-display)] text-white">Siparislerim</h1>
          <p className="text-sm text-slate-400 mt-1">{orders.length} siparis</p>
        </div>
        <button 
          onClick={() => mutate()} 
          className="p-2 rounded-lg bg-navy-800 border border-navy-700 text-slate-400 hover:text-gold-400 transition-colors"
          title="Yenile"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
      
      <div className="space-y-4">
        {orders.map((order: any, i: number) => {
          const status = statusConfig[order.status] || statusConfig['processing'];
          const StatusIcon = status.icon;
          return (
            <motion.div 
              key={order.id} 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: i * 0.05 }} 
              className="glass-card rounded-2xl p-5"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className={`p-3 rounded-xl border ${status.bg}`}>
                  <StatusIcon className={`w-5 h-5 ${status.color}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-white">#{order.number}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${status.bg} ${status.color}`}>
                      {status.label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {new Date(order.date_created).toLocaleDateString('tr-TR', { 
                      day: 'numeric', 
                      month: 'long', 
                      year: 'numeric', 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
                <span className="text-lg font-bold text-white">
                  {formatPrice(parseFloat(order.total))}
                </span>
              </div>
              
              <div className="space-y-2 pl-16">
                {order.line_items?.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between bg-navy-800/50 rounded-lg p-3">
                    <div>
                      <p className="text-sm text-white">{item.name}</p>
                      <p className="text-[10px] text-slate-500">Adet: {item.quantity}</p>
                    </div>
                    <span className="text-sm text-white font-semibold">
                      {formatPrice(parseFloat(item.total))}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
