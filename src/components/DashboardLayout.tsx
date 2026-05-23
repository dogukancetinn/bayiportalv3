import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { 
  LayoutDashboard, Package, ShoppingCart, User, LogOut, Menu, X, Bell, Search,
  ChevronDown, Clock, BarChart3, Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DashboardLayoutProps {
  children: React.ReactNode;
  activePage: string;
  onNavigate: (page: string) => void;
}

export default function DashboardLayout({ children, activePage, onNavigate }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const isAdmin = user?.role === 'administrator';

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ...(isAdmin ? [{ id: 'products', label: 'Fiyat Yonetimi', icon: Settings }] : [{ id: 'products', label: 'Urunler', icon: Package }]),
    ...(!isAdmin ? [{ id: 'cart', label: 'Sepetim', icon: ShoppingCart, badge: itemCount }] : []),
    ...(!isAdmin ? [{ id: 'orders', label: 'Siparisler', icon: Clock }] : []),
    { id: 'profile', label: 'Profilim', icon: User },
  ];

  if (!user) return null;

  return (
    <div className="min-h-screen bg-navy-950 flex">
      <AnimatePresence>
        {sidebarOpen && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      </AnimatePresence>

      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-navy-900 border-r border-navy-700/50 flex flex-col transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-navy-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 gold-gradient rounded-xl flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-navy-950" />
            </div>
            <div>
              <h1 className="text-lg font-bold font-[var(--font-display)] text-white">BayiPortal</h1>
              <p className="text-[10px] text-gold-400 tracking-widest uppercase">Provanya</p>
            </div>
          </div>
        </div>

        <div className="p-4">
          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-navy-700 flex items-center justify-center text-gold-400 font-bold text-sm">
                {user.displayName.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{user.displayName}</p>
                <p className="text-[10px] text-slate-400 truncate">{user.company}</p>
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 py-2 space-y-1">
          {navItems.map(item => (
            <button 
              key={item.id} 
              onClick={() => { onNavigate(item.id); setSidebarOpen(false); }} 
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                activePage === item.id 
                  ? 'bg-gold-500/10 text-gold-400 border border-gold-500/20' 
                  : 'text-slate-400 hover:text-white hover:bg-navy-800'
              }`}
            >
              <item.icon className={`w-5 h-5 ${activePage === item.id ? 'text-gold-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
              {item.label}
              {item.badge ? <span className="ml-auto bg-gold-500 text-navy-950 text-[10px] font-bold px-2 py-0.5 rounded-full">{item.badge}</span> : null}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-navy-700/50">
          <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all">
            <LogOut className="w-5 h-5" /> Cikis Yap
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 bg-navy-950/80 backdrop-blur-xl border-b border-navy-700/50">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 rounded-lg hover:bg-navy-800 text-slate-400">
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              <div className="relative hidden sm:block">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input 
                  type="text" 
                  placeholder="Urun ara..." 
                  className="bg-navy-800 border border-navy-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-gold-500/50 w-64" 
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button className="relative p-2 rounded-lg hover:bg-navy-800 text-slate-400">
                <Bell className="w-5 h-5" />
              </button>
              {!isAdmin && (
                <button onClick={() => onNavigate('cart')} className="relative p-2 rounded-lg hover:bg-navy-800 text-slate-400">
                  <ShoppingCart className="w-5 h-5" />
                  {itemCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-gold-500 text-navy-950 text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">{itemCount}</span>
                  )}
                </button>
              )}
              <div className="relative">
                <button onClick={() => setProfileOpen(!profileOpen)} className="flex items-center gap-3 p-2 rounded-xl hover:bg-navy-800">
                  <div className="w-8 h-8 rounded-full bg-navy-700 flex items-center justify-center text-gold-400 font-bold text-xs">
                    {user.displayName.split(' ').map(n => n[0]).join('')}
                  </div>
                  <span className="hidden md:block text-sm text-white font-medium">{user.company}</span>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>
                <AnimatePresence>
                  {profileOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      exit={{ opacity: 0, y: 10 }} 
                      className="absolute right-0 top-full mt-2 w-56 bg-navy-800 border border-navy-700 rounded-xl shadow-2xl overflow-hidden"
                    >
                      <div className="p-4 border-b border-navy-700">
                        <p className="text-sm font-semibold text-white">{user.displayName}</p>
                        <p className="text-xs text-slate-400">{user.email}</p>
                      </div>
                      <div className="p-2">
                        <button onClick={() => { onNavigate('profile'); setProfileOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-navy-700">
                          <User className="w-4 h-4" /> Profilim
                        </button>
                        <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10">
                          <LogOut className="w-4 h-4" /> Cikis Yap
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 p-6">
          <motion.div key={activePage} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
