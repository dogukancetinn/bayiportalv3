import { useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { fetchProducts, fetchCategories, formatPrice, WCProduct, WCCategory } from '../lib/woocommerce';
import { calculateDealerPrice, getDealerPrice } from '../lib/pricing';
import { Search, ShoppingCart, Grid3X3, List, Star, Package, Plus, Minus, Tag, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useSWR from 'swr';

export default function ProductsPage() {
  const { user } = useAuth();
  const { addToCart, cart } = useCart();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [filterOnSale, setFilterOnSale] = useState(false);
  const [filterInStock, setFilterInStock] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'price_asc' | 'price_desc' | 'newest'>('name');
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [addedProducts, setAddedProducts] = useState<Record<number, boolean>>({});

  const isAdmin = user?.role === 'administrator';
  const discountRate = user?.discountRate || 0;

  // API'den urunleri cek
  const { data: products = [], isLoading: productsLoading, mutate: refreshProducts } = useSWR(
    'products',
    () => fetchProducts({
      category: selectedCategory || undefined,
      search: searchQuery || undefined,
      on_sale: filterOnSale ? 'true' : undefined,
    }),
    { revalidateOnFocus: false }
  );

  // API'den kategorileri cek
  const { data: categories = [] } = useSWR<WCCategory[]>('categories', fetchCategories, { revalidateOnFocus: false });

  const filteredProducts = useMemo(() => {
    let filtered = [...products];
    if (filterInStock) filtered = filtered.filter(p => p.stock_status === 'instock');
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(query) || 
        p.sku?.toLowerCase().includes(query)
      );
    }
    switch (sortBy) {
      case 'price_asc': filtered.sort((a, b) => parseFloat(a.price) - parseFloat(b.price)); break;
      case 'price_desc': filtered.sort((a, b) => parseFloat(b.price) - parseFloat(a.price)); break;
      case 'newest': filtered.sort((a, b) => b.id - a.id); break;
      default: filtered.sort((a, b) => a.name.localeCompare(b.name));
    }
    return filtered;
  }, [products, filterInStock, sortBy, searchQuery]);

  const getQuantity = (pid: number) => quantities[pid] || 1;
  const updateQuantity = (pid: number, d: number) => setQuantities(prev => ({ ...prev, [pid]: Math.max(1, (prev[pid] || 1) + d) }));

  const handleAddToCart = (product: WCProduct) => {
    const dealerPrice = getDealerPrice(product.regular_price, discountRate);
    addToCart(product, getQuantity(product.id), dealerPrice);
    setAddedProducts(prev => ({ ...prev, [product.id]: true }));
    setTimeout(() => setAddedProducts(prev => ({ ...prev, [product.id]: false })), 1500);
  };

  const isInCart = (pid: number) => cart.some(i => i.product.id === pid);

  if (isAdmin) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold font-[var(--font-display)] text-white">Fiyat Yonetimi</h1>
          <p className="text-sm text-slate-400 mt-1">Ana siteden urunleri ve bayileri yonetin</p>
        </div>
        <div className="glass-card rounded-2xl p-8 text-center">
          <p className="text-slate-400">Fiyat yonetimi WordPress admin panelinden yapilmaktadir.</p>
          <a 
            href="https://provanya.com/wp-admin" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-block mt-4 px-6 py-3 gold-gradient text-navy-950 font-semibold rounded-xl"
          >
            WordPress Admin Paneli
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-[var(--font-display)] text-white">Urun Katalogu</h1>
          <p className="text-sm text-slate-400 mt-1">Size ozel fiyatlarla sunulan urunler</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => refreshProducts()} 
            className="p-2 rounded-lg bg-navy-800 border border-navy-700 text-slate-400 hover:text-gold-400 transition-colors"
            title="Urunleri yenile"
          >
            <RefreshCw className={`w-4 h-4 ${productsLoading ? 'animate-spin' : ''}`} />
          </button>
          <span className="text-sm text-slate-400">{filteredProducts.length} urun</span>
          <div className="flex bg-navy-800 rounded-lg p-1 border border-navy-700">
            <button onClick={() => setViewMode('grid')} className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-gold-500/20 text-gold-400' : 'text-slate-400 hover:text-white'}`}><Grid3X3 className="w-4 h-4" /></button>
            <button onClick={() => setViewMode('list')} className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-gold-500/20 text-gold-400' : 'text-slate-400 hover:text-white'}`}><List className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <input 
            type="text" 
            value={searchQuery} 
            onChange={e => setSearchQuery(e.target.value)} 
            placeholder="Urun adi veya SKU ile ara..." 
            className="w-full bg-navy-800 border border-navy-700 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-gold-500/50" 
          />
        </div>
        <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium border transition-all ${showFilters ? 'bg-gold-500/10 border-gold-500/30 text-gold-400' : 'bg-navy-800 border-navy-700 text-slate-300'}`}>
          <Package className="w-4 h-4" /> Filtreler
        </button>
        <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)} className="bg-navy-800 border border-navy-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-gold-500/50 cursor-pointer">
          <option value="name">Ada Gore</option>
          <option value="price_asc">Fiyat (Dusuk)</option>
          <option value="price_desc">Fiyat (Yuksek)</option>
          <option value="newest">En Yeni</option>
        </select>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="glass-card rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">Filtreler</h3>
                <button onClick={() => { setSelectedCategory(''); setFilterOnSale(false); setFilterInStock(false); }} className="text-xs text-gold-400">Temizle</button>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-2">Kategori</label>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setSelectedCategory('')} className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${!selectedCategory ? 'bg-gold-500 text-navy-950' : 'bg-navy-800 text-slate-300 border border-navy-700'}`}>Tumu</button>
                  {categories.map(c => (
                    <button key={c.id} onClick={() => setSelectedCategory(c.slug)} className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${selectedCategory === c.slug ? 'bg-gold-500 text-navy-950' : 'bg-navy-800 text-slate-300 border border-navy-700'}`}>
                      {c.name} ({c.count})
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={filterOnSale} onChange={e => setFilterOnSale(e.target.checked)} className="w-4 h-4 rounded border-navy-600 bg-navy-800 text-gold-500 focus:ring-gold-500" />
                  <span className="text-sm text-slate-300">Indirimdekiler</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={filterInStock} onChange={e => setFilterInStock(e.target.checked)} className="w-4 h-4 rounded border-navy-600 bg-navy-800 text-gold-500 focus:ring-gold-500" />
                  <span className="text-sm text-slate-300">Stokta Olanlar</span>
                </label>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {productsLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredProducts.map((p, i) => (
            <ProductCard 
              key={p.id} 
              product={p} 
              index={i} 
              discountRate={discountRate} 
              quantity={getQuantity(p.id)} 
              onQuantity={(d) => updateQuantity(p.id, d)} 
              onAdd={() => handleAddToCart(p)} 
              inCart={isInCart(p.id)} 
              justAdded={!!addedProducts[p.id]} 
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredProducts.map((p, i) => (
            <ProductListItem 
              key={p.id} 
              product={p} 
              index={i} 
              discountRate={discountRate} 
              quantity={getQuantity(p.id)} 
              onQuantity={(d) => updateQuantity(p.id, d)} 
              onAdd={() => handleAddToCart(p)} 
              inCart={isInCart(p.id)} 
              justAdded={!!addedProducts[p.id]} 
            />
          ))}
        </div>
      )}

      {!productsLoading && filteredProducts.length === 0 && (
        <div className="text-center py-20">
          <Package className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Urun bulunamadi</h3>
          <p className="text-slate-400 text-sm">Farkli filtreler deneyin</p>
        </div>
      )}
    </div>
  );
}

interface ProductCardProps {
  product: WCProduct;
  index: number;
  discountRate: number;
  quantity: number;
  onQuantity: (delta: number) => void;
  onAdd: () => void;
  inCart: boolean;
  justAdded: boolean;
}

function ProductCard({ product: p, index, discountRate, quantity, onQuantity, onAdd, inCart, justAdded }: ProductCardProps) {
  const dealerPrice = getDealerPrice(p.regular_price, discountRate);
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ delay: index * 0.04 }} 
      className="glass-card rounded-2xl overflow-hidden group hover:border-gold-500/30 transition-all duration-300"
    >
      <div className="relative aspect-square bg-navy-800 overflow-hidden">
        <img 
          src={p.images?.[0]?.src || '/placeholder.jpg'} 
          alt={p.name} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
          loading="lazy" 
        />
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {p.featured && (
            <span className="bg-gold-500 text-navy-950 text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1">
              <Star className="w-3 h-3" /> ONE CIKAN
            </span>
          )}
          {p.on_sale && (
            <span className="bg-red-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg">
              INDIRIM
            </span>
          )}
        </div>
        <div className="absolute top-3 right-3">
          <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${p.stock_status === 'instock' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
            {p.stock_status === 'instock' ? `Stok: ${p.stock_quantity || 'Var'}` : 'Tukendi'}
          </span>
        </div>
        <div className="absolute inset-0 bg-navy-950/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="flex items-center gap-2">
            <button onClick={() => onQuantity(-1)} className="w-8 h-8 rounded-lg bg-navy-800 border border-navy-600 flex items-center justify-center text-white hover:bg-navy-700"><Minus className="w-3 h-3" /></button>
            <span className="w-10 text-center text-white font-bold text-sm">{quantity}</span>
            <button onClick={() => onQuantity(1)} className="w-8 h-8 rounded-lg bg-navy-800 border border-navy-600 flex items-center justify-center text-white hover:bg-navy-700"><Plus className="w-3 h-3" /></button>
          </div>
        </div>
      </div>
      <div className="p-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] text-slate-500 font-mono">{p.sku}</span>
          {p.categories?.[0] && <span className="text-[10px] text-gold-400/60">- {p.categories[0].name}</span>}
        </div>
        <h3 className="text-sm font-semibold text-white mb-1 line-clamp-2 leading-snug">{p.name}</h3>
        <p className="text-xs text-slate-500 mb-3 line-clamp-1">{p.short_description?.replace(/<[^>]*>/g, '')}</p>
        <div className="mb-4">
          <span className="text-xl font-bold text-gold-400">{formatPrice(dealerPrice)}</span>
        </div>
        <button 
          onClick={onAdd} 
          disabled={p.stock_status !== 'instock'}
          className={`w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
            justAdded ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 
            inCart ? 'bg-gold-500/10 text-gold-400 border border-gold-500/30' : 
            'gold-gradient text-navy-950 shadow-md shadow-gold-500/10'
          }`}
        >
          {justAdded ? 'Eklendi' : inCart ? <><ShoppingCart className="w-4 h-4" /> Ekle (+)</> : <><ShoppingCart className="w-4 h-4" /> Sepete Ekle</>}
        </button>
      </div>
    </motion.div>
  );
}

function ProductListItem({ product: p, index, discountRate, quantity, onQuantity, onAdd, inCart, justAdded }: ProductCardProps) {
  const dealerPrice = getDealerPrice(p.regular_price, discountRate);
  
  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }} 
      animate={{ opacity: 1, x: 0 }} 
      transition={{ delay: index * 0.04 }} 
      className="glass-card rounded-2xl p-4 flex gap-5 hover:border-gold-500/30 transition-all"
    >
      <div className="w-24 h-24 rounded-xl overflow-hidden bg-navy-800 flex-shrink-0">
        <img src={p.images?.[0]?.src || '/placeholder.jpg'} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] text-slate-500 font-mono">{p.sku}</span>
              {p.on_sale && <span className="bg-red-500/20 text-red-400 text-[10px] font-bold px-1.5 py-0.5 rounded">INDIRIM</span>}
            </div>
            <h3 className="text-sm font-semibold text-white">{p.name}</h3>
          </div>
          <span className="text-lg font-bold flex-shrink-0 text-gold-400">{formatPrice(dealerPrice)}</span>
        </div>
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-3">
            <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${p.stock_status === 'instock' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
              Stok: {p.stock_quantity || (p.stock_status === 'instock' ? 'Var' : '0')}
            </span>
            <div className="flex items-center gap-2">
              <button onClick={() => onQuantity(-1)} className="w-7 h-7 rounded-lg bg-navy-800 border border-navy-700 flex items-center justify-center text-white hover:bg-navy-700"><Minus className="w-3 h-3" /></button>
              <span className="w-8 text-center text-white font-bold text-sm">{quantity}</span>
              <button onClick={() => onQuantity(1)} className="w-7 h-7 rounded-lg bg-navy-800 border border-navy-700 flex items-center justify-center text-white hover:bg-navy-700"><Plus className="w-3 h-3" /></button>
            </div>
          </div>
          <button 
            onClick={onAdd} 
            disabled={p.stock_status !== 'instock'}
            className={`px-5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all disabled:opacity-50 ${
              justAdded ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 
              inCart ? 'bg-gold-500/10 text-gold-400 border border-gold-500/30' : 
              'gold-gradient text-navy-950'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />{justAdded ? 'Eklendi' : inCart ? 'Ekle (+)' : 'Sepete Ekle'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
