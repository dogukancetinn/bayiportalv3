import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface User {
  id: number;
  username: string;
  email: string;
  displayName: string;
  role: string;
  company: string;
  discountRate: number;
  phone: string;
  address: string;
  city: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  rememberMe: boolean;
}

interface AuthContextType {
  authState: AuthState;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string, rememberMe: boolean) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const AUTH_KEY = 'bayiportal_auth';
const REMEMBER_KEY = 'bayiportal_remember';

function getStoredAuth(): AuthState | null {
  const local = localStorage.getItem(AUTH_KEY);
  const session = sessionStorage.getItem(AUTH_KEY);
  const stored = local || session;
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }
  return null;
}

function saveAuth(state: AuthState, rememberMe: boolean) {
  const data = JSON.stringify(state);
  if (rememberMe) {
    localStorage.setItem(AUTH_KEY, data);
    localStorage.setItem(REMEMBER_KEY, 'true');
  } else {
    sessionStorage.setItem(AUTH_KEY, data);
  }
}

function clearAuth() {
  localStorage.removeItem(AUTH_KEY);
  sessionStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(REMEMBER_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null,
    rememberMe: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = getStoredAuth();
    if (stored && stored.isAuthenticated) {
      setAuthState(stored);
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string, rememberMe: boolean) => {
    try {
      const response = await fetch('/api/woocommerce/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!data.success) {
        return { success: false, error: data.error || 'Giris basarisiz' };
      }

      const newState: AuthState = {
        isAuthenticated: true,
        user: data.user,
        token: data.token,
        rememberMe,
      };

      saveAuth(newState, rememberMe);
      setAuthState(newState);

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Baglanti hatasi' };
    }
  };

  const logout = () => {
    clearAuth();
    setAuthState({
      isAuthenticated: false,
      user: null,
      token: null,
      rememberMe: false,
    });
  };

  return (
    <AuthContext.Provider
      value={{
        authState,
        user: authState.user,
        isAuthenticated: authState.isAuthenticated,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
