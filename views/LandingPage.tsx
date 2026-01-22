
import React, { useState, useEffect } from 'react';
import { ShoppingBag, Zap, Sparkles, Store, Globe } from 'lucide-react';
import { useAuth, Link, useRouter } from '../App';
import { supabase } from '../supabaseClient';

const LandingPage: React.FC = () => {
  const { user, logout } = useAuth();
  const { navigate } = useRouter();
  const [hasAuthSession, setHasAuthSession] = useState(false);
  const [clickCount, setClickCount] = useState(0);

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      setHasAuthSession(!!data.session);
    };
    checkSession();
  }, []);

  const handleSecretClick = () => {
    const newCount = clickCount + 1;
    if (newCount >= 3) {
      navigate('/setup-master');
      setClickCount(0);
    } else {
      setClickCount(newCount);
      // Resetar contador após 2 segundos de inatividade
      setTimeout(() => setClickCount(0), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-white font-['Inter'] selection:bg-blue-100">
      {/* Navigation */}
      <nav className="max-w-7xl mx-auto py-6 px-6 md:px-12 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-[100]">
        <Link to="/" className="text-2xl font-black text-slate-900 flex items-center gap-2">
           <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-200">
            <ShoppingBag className="text-white" size={24} />
           </div>
           <span className="tracking-tighter">Vitrine <span className="text-blue-600">SZ Soluções</span></span>
        </Link>
        
        <div className="flex gap-8 items-center">
          {(user || hasAuthSession) ? (
            <>
              <button onClick={logout} className="text-slate-600 font-bold text-sm hover:text-red-600 transition-colors">Sair</button>
              <Link to="/dashboard" className="bg-slate-900 text-white px-6 py-3 rounded-full font-black text-sm hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-200">
                Acessar Painel
              </Link>
            </>
          ) : (
            <>
              <Link to="/login" className="text-slate-900 font-bold text-sm hover:text-blue-600 transition-colors">Entrar</Link>
              <Link to="/signup" className="bg-slate-900 text-white px-8 py-3.5 rounded-full font-black text-sm hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-200">
                Começar Grátis
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <header className="max-w-7xl mx-auto px-6 md:px-12 pt-16 md:pt-24 pb-8 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="flex flex-col items-start text-left">
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-full text-xs font-black mb-8 border border-blue-100 uppercase tracking-widest">
              <Zap size={14} fill="currentColor" />
              <span>Multi-tenant Isolation v2.0</span>
            </div>
            
            <h1 className="text-6xl md:text-[5.5rem] font-black text-[#0f172a] leading-[1.1] tracking-tighter mb-8">
              Sua Vitrine <br />
              <span className="text-blue-600">Virtual</span> <br />
              em segundos.
            </h1>
            
            <p className="text-slate-500 text-xl max-w-lg mb-12 font-medium leading-relaxed">
              Crie sua vitrine virtual profissional e transforme conversas em vendas. Simples, rápido e totalmente integrado ao WhatsApp.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Link to={user ? "/dashboard" : "/signup"} className="bg-blue-600 text-white px-10 py-5 rounded-2xl text-lg font-black shadow-2xl shadow-blue-500/30 flex items-center justify-center gap-3 hover:bg-blue-700 transition-all hover:-translate-y-1 active:scale-95">
                Criar minha Loja
                <Sparkles size={22} className="opacity-80" />
              </Link>
              <button className="bg-white text-slate-900 border-2 border-slate-100 px-10 py-5 rounded-2xl text-lg font-black hover:border-slate-900 transition-all active:scale-95">
                Agendar Demo
              </button>
            </div>
          </div>

          {/* Product Mockup Image */}
          <div className="relative group">
            <div className="absolute -inset-4 bg-blue-100/50 rounded-[3rem] blur-3xl opacity-50 group-hover:opacity-80 transition-opacity"></div>
            <div className="relative bg-white rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-slate-50 overflow-hidden">
               {/* Header Fake */}
               <div className="px-8 pt-8 flex justify-between items-center mb-6">
                 <div className="w-12 h-3 bg-slate-100 rounded-full"></div>
                 <div className="flex gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-50"></div>
                    <div className="w-6 h-6 rounded-full bg-blue-50"></div>
                 </div>
               </div>
               
               {/* Product Image */}
               <div className="px-8 pb-16">
                  <div className="aspect-[4/3] bg-slate-50 rounded-[2rem] overflow-hidden relative mb-8">
                    <img 
                      src="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" 
                      alt="Product Mockup" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-4 right-4 bg-blue-600 text-white text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest">
                      Premium Quality
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-end relative z-10">
                     <div className="space-y-2">
                        <div className="w-32 h-4 bg-slate-100 rounded-full"></div>
                        <div className="w-24 h-3 bg-slate-50 rounded-full"></div>
                     </div>
                     <div className="text-right">
                        <p className="text-3xl font-black text-[#0f172a] whitespace-nowrap">R$ 24,90</p>
                     </div>
                  </div>
               </div>
               
               {/* Floating Icon */}
               <div className="absolute bottom-8 left-8 w-12 h-12 bg-white rounded-2xl shadow-xl flex items-center justify-center border border-slate-100">
                  <ShoppingBag size={20} className="text-slate-300" />
               </div>
            </div>
          </div>
      </header>

      {/* Feature Cards Section */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 pt-4 pb-24 mb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group">
            <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mb-10 shadow-xl shadow-emerald-200">
              <Store className="text-white" size={32} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-5 tracking-tight">Vitrine Profissional</h3>
            <p className="text-slate-500 font-medium leading-relaxed">
              Crie um catálogo completo com fotos, descrições e preços. Seus produtos sempre organizados e acessíveis.
            </p>
          </div>

          <div className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group">
            <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mb-10 shadow-xl shadow-emerald-200">
              <Zap className="text-white" size={32} fill="currentColor" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-5 tracking-tight">Vendas Instantâneas</h3>
            <p className="text-slate-500 font-medium leading-relaxed">
              Cliente escolhe o produto e já cai direto no WhatsApp com a mensagem pronta. Venda em segundos.
            </p>
          </div>

          <div className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group">
            <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mb-10 shadow-xl shadow-blue-200">
              <Globe className="text-white" size={32} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-5 tracking-tight">Compras de Produtos</h3>
            <p className="text-slate-500 font-medium leading-relaxed">
              Aqui você encontra as ofertas de grandes fornecedores do Brasil para escalar o seu negócio.
            </p>
          </div>
        </div>
      </section>

      {/* Footer / Copyright */}
      <footer className="py-12 border-t border-slate-50 text-center relative">
        <p className="text-slate-400 text-sm font-medium">
          © 2024 <span 
            onClick={handleSecretClick} 
            className="cursor-pointer select-none hover:text-blue-600 transition-colors underline decoration-dotted"
          >Vitrine SZ Soluções</span> Enterprise. Imagens nítidas, negócios focados.
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;
