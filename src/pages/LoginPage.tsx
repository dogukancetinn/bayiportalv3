import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, LogIn, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await login(username, password, rememberMe);
    if (!result.success) {
      setError(result.error || 'Giris basarisiz');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: 'var(--color-bg)' }}>
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-40">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 30% 20%, rgba(255, 69, 0, 0.08) 0%, transparent 50%),
                           radial-gradient(circle at 70% 80%, rgba(255, 69, 0, 0.05) 0%, transparent 50%)`,
        }} />
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.02) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(0,0,0,0.02) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md relative z-10 px-6"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-md" style={{ 
            background: 'var(--color-bg-white)', 
            border: '1px solid var(--color-border)' 
          }}>
            <Shield className="w-8 h-8" style={{ color: 'var(--color-accent)' }} />
          </div>
          <h1 className="text-3xl font-bold f-display" style={{ color: 'var(--color-accent)' }}>BayiPortal</h1>
          <p className="text-sm tracking-widest uppercase mt-1 f-strong" style={{ color: 'var(--color-text-2)' }}>PROVANYA BAYI SISTEMI</p>
        </div>

        {/* Login Card */}
        <div className="glass-card rounded-2xl p-8">
          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6 p-4 rounded-xl text-sm"
                style={{ 
                  background: 'rgba(220, 38, 38, 0.08)', 
                  border: '1px solid rgba(220, 38, 38, 0.2)',
                  color: '#dc2626'
                }}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <div>
              <label className="block text-sm mb-2 f-strong" style={{ color: 'var(--color-accent)' }}>Kullanici Adi</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="form-input"
                placeholder="Kullanici adinizi girin"
                required
                autoComplete="username"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm mb-2 f-strong" style={{ color: 'var(--color-accent)' }}>Sifre</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="form-input pr-12"
                  placeholder="Sifrenizi girin"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: 'var(--color-text-4)' }}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <div className="flex items-center">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="sr-only"
                  />
                  <div 
                    className="w-5 h-5 rounded-md border-2 transition-all duration-200 flex items-center justify-center"
                    style={{ 
                      background: rememberMe ? 'var(--color-accent)' : 'var(--color-bg-gray)',
                      borderColor: rememberMe ? 'var(--color-accent)' : 'var(--color-border-dark)'
                    }}
                  >
                    {rememberMe && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
                <span className="text-sm transition-colors" style={{ color: 'var(--color-accent)' }}>Beni hatirla</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-full py-4 text-base"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Giris Yap
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs" style={{ color: 'var(--color-text-3)' }}>
            Provanya Bayi Portali
          </p>
          <p className="text-xs mt-2" style={{ color: 'var(--color-text-4)' }}>
            Bayi basvurusu icin{' '}
            <a 
              href="https://provanya.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="transition-colors hover:underline"
              style={{ color: 'var(--color-accent)' }}
            >
              provanya.com
            </a>
            {' '}adresini ziyaret edin
          </p>
        </div>
      </motion.div>
    </div>
  );
}
