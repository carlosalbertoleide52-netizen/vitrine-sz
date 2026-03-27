
import React, { useState, useEffect } from 'react';
import { useAuth, Link, useRouter } from '../App';
import { UserRole } from '../types';
import { LayoutDashboard, Building2, Package, Settings, LogOut, Store, ExternalLink, Menu, X } from 'lucide-react';

export function useIsMobile(breakpoint = 800): boolean {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < breakpoint
  );
  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [breakpoint]);
  return isMobile;
}

const Sidebar: React.FC = () => {
  const { user, company, logout } = useAuth();
  const { navigate } = useRouter();
  const isSuperAdmin = user?.role === UserRole.SUPER_ADMIN;
  const hasStore = !!user?.tenantId;
  const isMobile = useIsMobile();
  const [menuOpen, setMenuOpen] = useState(false);

  const goToStorefront = () => {
    if (company?.subdomain) {
      navigate(`/loja/${company.subdomain}`);
    } else {
      alert("Configure um subdomínio primeiro em Configurações.");
    }
    setMenuOpen(false);
  };

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
  };

  const Logo = () => (
    <h1 className="text-xl font-black tracking-tighter flex items-center gap-2">
      <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
        <Store size={18} />
      </div>
      Vitrine <span className="text-blue-500">SZ</span>
    </h1>
  );

  const NavContent = () => (
    <>
      <nav className="flex-1 p-6 space-y-1 mt-4 overflow-y-auto">
        {isSuperAdmin && (
          <div className="mb-8">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 px-4">Administração Global</p>
            <Link to="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-400 hover:bg-blue-600/10 hover:text-blue-400 transition-all group" onClick={() => setMenuOpen(false)}>
              <LayoutDashboard size={20} className="group-hover:scale-110 transition-transform" />
              <span className="font-bold text-sm">Painel Geral</span>
            </Link>
            <Link to="/dashboard/companies" className="flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-400 hover:bg-blue-600/10 hover:text-blue-400 transition-all group" onClick={() => setMenuOpen(false)}>
              <Building2 size={20} className="group-hover:scale-110 transition-transform" />
              <span className="font-bold text-sm">Empresas</span>
            </Link>
          </div>
        )}

        {hasStore && (
          <div className="mb-8">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 px-4">
              Gestão da Loja
            </p>
            <Link to="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-400 hover:bg-blue-600/10 hover:text-blue-400 transition-all group" onClick={() => setMenuOpen(false)}>
              <Package size={20} className="group-hover:scale-110 transition-transform" />
              <span className="font-bold text-sm">Produtos</span>
            </Link>
            <Link to="/dashboard/settings" className="flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-400 hover:bg-blue-600/10 hover:text-blue-400 transition-all group" onClick={() => setMenuOpen(false)}>
              <Settings size={20} className="group-hover:scale-110 transition-transform" />
              <span className="font-bold text-sm">Configurações</span>
            </Link>
            <button
              onClick={goToStorefront}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-blue-400 hover:bg-blue-600/10 transition-all group mt-4 border border-blue-600/20"
            >
              <ExternalLink size={20} className="group-hover:scale-110 transition-transform" />
              <span className="font-bold text-sm text-left">Ver Vitrine</span>
            </button>
          </div>
        )}
      </nav>

      <div className="p-6 border-t border-white/5">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-400 hover:bg-red-600/10 hover:text-red-400 transition-all group"
        >
          <LogOut size={20} className="group-hover:scale-110 transition-transform" />
          <span className="font-bold text-sm">Sair</span>
        </button>
      </div>
    </>
  );

  if (isMobile) {
    return (
      <>
        {/* Barra superior fixa */}
        <header className="fixed top-0 left-0 right-0 h-16 bg-slate-900 text-white flex items-center justify-between px-5 z-[50] shadow-lg">
          <Logo />
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 rounded-xl hover:bg-white/10 transition-colors"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </header>

        {/* Overlay */}
        {menuOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-[49] backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          />
        )}

        {/* Sidebar deslizante */}
        <aside
          className={`fixed top-0 left-0 h-screen w-64 bg-slate-900 text-white z-[50] flex flex-col shadow-2xl transform transition-transform duration-300 ease-in-out ${
            menuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="p-8 border-b border-white/5 flex items-center justify-between">
            <Logo />
            <button
              onClick={() => setMenuOpen(false)}
              className="p-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          <NavContent />
        </aside>
      </>
    );
  }

  // Desktop: layout original
  return (
    <aside className="w-64 bg-slate-900 text-white h-screen fixed left-0 top-0 flex flex-col z-[50] shadow-2xl">
      <div className="p-8 border-b border-white/5">
        <Logo />
      </div>
      <NavContent />
    </aside>
  );
};

export default Sidebar;
