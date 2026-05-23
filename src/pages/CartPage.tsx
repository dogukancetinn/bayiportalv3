import { useState } from 'react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { formatPrice } from '../lib/pricing';
import { createOrder, createPaymentSession } from '../lib/woocommerce';
import { ShoppingCart, Trash2, Plus, Minus, Package, CheckCircle2, CreditCard, Shield, Truck, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CartPage() {
  const { cart, total, removeFromCart, updateQuantity, clearCart } = useCart();
  const { user, authState } = useAuth();
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [note, setNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  const handlePlaceOrder = async () => {
    if (!user) return;
    
    setIsProcessing(true);
    setError('');
    
    try {
      // 1. WooCommerce'de siparis olustur
      const order = await createOrder({
        customer_id: user.id,
        billing: {
          first_name: user.displayName.split(' ')[0] || '',
          last_name: user.displayName.split(' ').slice(1).join(' ') || '',
          company: user.company,
          email: user.email,
          phone: user.phone || '',
          address_1: user.address || '',
          city: user.city || '',
        },
        line_items: cart.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity,
        })),
        payment_method: 'vakifbank',
        set_paid: false,
      });
      
      // 2. VakifBank odeme oturumu olustur
      const returnUrl = `${window.location.origin}/payment-callback`;
      const paymentSession = await createPaymentSession(order.id, returnUrl, authState.token || undefined);
      
      // 3. Odeme sayfasina yonlendir
      if (paymentSession.payment_url) {
        // Siparis numarasini kaydet (callback icin)
        sessionStorage.setItem('pending_order', JSON.stringify({
          orderId: order.id,
          orderNumber: order.number,
          sessionId: paymentSession.session_id,
        }));
        
        // VakifBank 3D Secure sayfasina yonlendir
        window.location.href = paymentSession.payment_url;
      } else {
        throw new Error('Odeme sayfasi olusturulamadi');
      }
      
    } catch (err: any) {
      console.error('Order error:', err);
      setError(err.message || 'Siparis olusturulurken bir hata olustu');
      setIsProcessing(false);
    }
  };

  // Odeme basarili oldugunda
  if (orderPlaced) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
          <div className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold font-[var(--font-display)] text-white mb-2">Siparis Alindi!</h2>
          <p className="text-slate-400">Siparisiniz basariyla olusturuldu.</p>
          <p className="text-sm text-gold-400 mt-2 font-semibold">Siparis No: {orderNumber}</p>
        </motion.div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-navy-800 flex items-center justify-center mx-auto mb-6">
            <ShoppingCart className="w-10 h-10 text-slate-600" />
          </div>
          <h2 className="text-2xl font-bold font-[var(--font-display)] text-white mb-2">Sepetiniz Bos</h2>
          <p className="text-slate-400 mb-6">Urun katalogundan urun ekleyerek baslayin</p>
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'products' }))} 
            className="gold-gradient text-navy-950 font-semibold px-8 py-3 rounded-xl inline-flex items-center gap-2 hover:opacity-90"
          >
            <Package className="w-5 h-5" /> Urunlere Goz At
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-[var(--font-display)] text-white">Sepetim</h1>
          <p className="text-sm text-slate-400 mt-1">{cart.length} urun</p>
        </div>
        <button 
          onClick={clearCart} 
          className="text-sm text-red-400 hover:text-red-300 transition-colors flex items-center gap-2"
        >
          <Trash2 className="w-4 h-4" />Temizle
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-300 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-4">
          <AnimatePresence>
            {cart.map(item => (
              <motion.div 
                key={item.product.id} 
                layout 
                initial={{ opacity: 0, x: -20 }} 
                animate={{ opacity: 1, x: 0 }} 
                exit={{ opacity: 0, x: 20 }} 
                className="glass-card rounded-2xl p-5 flex gap-5"
              >
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-navy-800 flex-shrink-0">
                  <img src={item.product.images?.[0]?.src || '/placeholder.jpg'} alt={item.product.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-semibold text-white">{item.product.name}</h3>
                      <p className="text-[10px] text-slate-500 mt-0.5">SKU: {item.product.sku}</p>
                    </div>
                    <button 
                      onClick={() => removeFromCart(item.product.id)} 
                      className="p-2 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2 bg-navy-800 rounded-xl border border-navy-700">
                      <button 
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)} 
                        className="w-8 h-8 flex items-center justify-center text-white hover:text-gold-400"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center text-white font-bold text-sm">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)} 
                        className="w-8 h-8 flex items-center justify-center text-white hover:text-gold-400"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="text-lg font-bold text-gold-400">{formatPrice(item.totalPrice)}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          <div className="glass-card rounded-2xl p-5">
            <label className="block text-sm font-semibold text-white mb-2">Siparis Notu</label>
            <textarea 
              value={note} 
              onChange={e => setNote(e.target.value)} 
              placeholder="Siparisinizle ilgili notunuz varsa..." 
              className="w-full bg-navy-800 border border-navy-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-gold-500/50 resize-none h-24" 
            />
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6 sticky top-24 h-fit">
          <h2 className="text-lg font-bold font-[var(--font-display)] text-white mb-6">Siparis Ozeti</h2>
          
          <div className="space-y-4 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Ara Toplam</span>
              <span className="text-white font-semibold">{formatPrice(total)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Kargo</span>
              <span className="text-green-400">Ucretsiz</span>
            </div>
            <div className="border-t border-navy-700 pt-4">
              <div className="flex justify-between">
                <span className="text-white font-bold">Toplam</span>
                <span className="text-2xl font-bold text-gold-400">{formatPrice(total)}</span>
              </div>
            </div>
          </div>

          <button 
            onClick={handlePlaceOrder} 
            disabled={isProcessing}
            className="w-full gold-gradient text-navy-950 font-bold py-4 rounded-xl hover:opacity-90 flex items-center justify-center gap-2 shadow-lg shadow-gold-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Odeme sayfasina yonlendiriliyor...
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5" />
                Siparisi Onayla ve Ode
              </>
            )}
          </button>

          <div className="mt-5 space-y-3">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Shield className="w-3.5 h-3.5" />
              <span>VakifBank 3D Secure ile guvenli odeme</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Truck className="w-3.5 h-3.5" />
              <span>Ucretsiz kargo</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-navy-700">
            <div className="flex items-center justify-center gap-2">
              <img src="https://www.vakifbank.com.tr/favicon.ico" alt="VakifBank" className="h-6 opacity-50" />
              <span className="text-[10px] text-slate-500">VakifBank Sanal POS</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
