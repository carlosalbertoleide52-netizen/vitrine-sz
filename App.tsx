
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Company, UserRole } from './types';
import { supabase } from './supabaseClient';
import { getUserProfile, getCompanyById } from './store';
import LandingPage from './views/LandingPage';
import LoginPage from './views/LoginPage';
import RegisterPage from './views/RegisterPage';
import SuperAdminDashboard from './views/SuperAdmin/Dashboard';
import TenantDashboard from './views/Tenant/Dashboard';
import Storefront from './views/Storefront';
import SetupMaster from './views/SetupMaster';
import Settings from './views/Tenant/Settings';

interface RouterContextType {
  path: string;
  params: Record<string, string>;
  navigate: (to: string) => void;
}

const RouterContext = createContext<RouterContextType | undefined>(undefined);

export const useRouter = () => {
  const context = useContext(RouterContext);
  if (!context) throw new Error("useRouter must be used within RouterProvider");
  return context;
};

interface AuthContextType {
  user: User | null;
  company: Company | null;
  isLoading: boolean;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

export const Link: React.FC<{ to: string; className?: string; children: ReactNode }> = ({ to, className, children }) => {
  const { navigate } = useRouter();
  return (
    <a 
      href={`#${to}`} 
      className={className} 
      onClick={(e) => { e.preventDefault(); navigate(to); }}
    >
      {children}
    </a>
  );
};

export const Navigate: React.FC<{ to: string }> = ({ to }) => {
  const { navigate } = useRouter();
  useEffect(() => { navigate(to); }, [to, navigate]);
  return null;
};

const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  const { path } = useRouter();

  if (isLoading && (path.startsWith('/dashboard') || path === '/login')) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const cleanPath = path.toLowerCase().replace(/\/$/, "").trim() || "/";
  
  if (cleanPath === '/') return <LandingPage />;
  if (cleanPath === '/login') return user ? <Navigate to="/dashboard" /> : <LoginPage />;
  if (cleanPath === '/signup') return user ? <Navigate to="/dashboard" /> : <RegisterPage />;
  if (cleanPath === '/setup-master') return <SetupMaster />;
  
  if (cleanPath.startsWith('/loja/')) return <Storefront />;
  
  if (cleanPath.startsWith('/dashboard')) {
    if (!user) return <Navigate to="/login" />;
    if (cleanPath === '/dashboard/settings') return <Settings />;
    return user.role === UserRole.SUPER_ADMIN ? <SuperAdminDashboard /> : <TenantDashboard />;
  }

  return <LandingPage />;
};

export const App: React.FC = () => {
  const getHashPath = () => {
    try {
      let hash = window.location.hash.replace('#', '') || '/';
      if (!hash.startsWith('/')) hash = '/' + hash;
      return hash;
    } catch (e) {
      // If access to location.hash is denied, default to root
      return '/';
    }
  };

  const [path, setPath] = useState(getHashPath());
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const profile = await getUserProfile(session.user.id);
        setUser(profile);
        if (profile?.tenantId) {
          const comp = await getCompanyById(profile.tenantId);
          setCompany(comp);
        }
      } else {
        setUser(null);
        setCompany(null);
      }
    } catch (e) {
      setUser(null);
      setCompany(null);
    }
  };

  useEffect(() => {
    refreshProfile().finally(() => setIsLoading(false));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setCompany(null);
      } else {
        refreshProfile();
      }
    });

    const handleHashChange = () => {
      const newPath = getHashPath();
      setPath(newPath);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => {
      subscription.unsubscribe();
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const navigate = (to: string) => {
    const formattedTo = to.startsWith('/') ? to : '/' + to;
    try {
      // In some environments (like restricted iframes or blob origins), 
      // direct modification of location.hash is denied by the browser's security policy.
      if (window.location.hash !== '#' + formattedTo) {
        window.location.hash = formattedTo;
      }
    } catch (e) {
      // Gracefully handle access denial to location.hash
      console.warn("Navigation: Update to location.hash was blocked by the browser environment.", e);
    }
    // Always update internal state to ensure the component tree updates even if URL cannot be changed.
    setPath(formattedTo);
  };

  const params: Record<string, string> = {};
  if (path.startsWith('/loja/')) {
    const parts = path.split('/');
    if (parts.length >= 3) {
      params.subdomain = decodeURIComponent(parts[2] || '');
    }
  }

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setCompany(null);
      navigate('/');
    } catch (e) {
      console.error("Logout error:", e);
      // Fallback: Force clear local state even if server-side signout fails
      setUser(null);
      setCompany(null);
      setPath('/');
    }
  };

  return (
    <RouterContext.Provider value={{ path, params, navigate }}>
      <AuthContext.Provider value={{ user, company, isLoading, logout, refreshProfile }}>
        <AppContent />
      </AuthContext.Provider>
    </RouterContext.Provider>
  );
};

export default App;
