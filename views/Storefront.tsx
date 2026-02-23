
import React, { useState, useEffect } from 'react';
import { getCompanyBySubdomain, getTenantProducts } from '../store';
import { Company, Product } from '../types';
import { ShoppingBag, MessageCircle, Phone, Package, ShieldAlert, AlertTriangle, RefreshCw, Copy, Check, Terminal, LayoutDashboard, ArrowLeft, Database, SearchX, Heart, ChevronLeft } from 'lucide-react';
import { useRouter, Link } from '../App';

const Storefront: React.FC = () => {
  const { params, path, navigate } = useRouter();
  
  const getSubdomain = () => {
    if (params.subdomain) return params.subdomain;
    const hash = window.location.hash;
    const match = hash.match(/\/loja\/([^\/\?]+)/);
    return match ? match[1] : null;
  };

  const subdomain = getSubdomain();
  
  const [company, setCompany] = useState<Company | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const load = async () => {
    if (!subdomain) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const { data: comp, error: compError } = await getCompanyBySubdomain(subdomain);
      
      if (compError) {
        setError(compError);
        setLoading(false);
        return;
      }

      if (comp) {
        setCompany(comp);
        try {
          const prods = await getTenantProducts(comp.id);
          setProducts(prods || []);
        } catch (prodErr: any) {
          console.error("Erro ao carregar produtos:", prodErr);
          setError({ message: "Acesso aos produtos bloqueado.", code: "RLS_PRODS" });
        }
      } else {
        setCompany(null);
      }
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    if (subdomain) load(); 
  }, [subdomain]);

  const handleWhatsApp = (p: Product) => {
    if (!company) return;
    const phone = company.whatsapp || '';
    if (!phone) {
      alert("Loja sem número de WhatsApp configurado.");
      return;
    }
    const message = `Olá! Vi o produto *${p.name}* na sua vitrine.\nPreço: R$ ${p.price.toFixed(2)}`;
    const finalPhone = phone.replace(/\D/g, '').length <= 11 ? `55${phone.replace(/\D/g, '')}` : phone.replace(/\D/g, '');
    window.open(`https://wa.me/${finalPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-white font-['Inter']">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-400 font-black text-[10px] uppercase tracking-widest">Carregando Vitrine...</p>
      </div>
    );
  }

  if (error || (!company && subdomain)) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-['Inter']">
        <div className="max-w-xl w-full bg-white rounded-[3rem] p-12 shadow-2xl border border-slate-100 text-center">
           <SearchX size={44} className="text-slate-300 mx-auto mb-6" />
           <h1 className="text-2xl font-black text-slate-900 tracking-tight">Loja não encontrada</h1>
           <button onClick={() => navigate('/dashboard')} className="mt-8 bg-slate-900 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs">Voltar ao Painel</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-['Inter'] pb-20">
      <nav className="bg-white sticky top-0 z-50 border-b border-slate-100">
        <div className="max-w-[1440px] mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-xl font-black tracking-tighter text-indigo-600 uppercase italic cursor-pointer" onClick={() => setSelectedProduct(null)}>{company?.name}</h1>
          <div className="flex items-center gap-6">
            
          </div>
        </div>
      </nav>

      {/* Se não houver produto selecionado, mostra o Header e o Grid */}
      {!selectedProduct ? (
        <>
          <header className="bg-white border-b border-slate-100 py-12 text-center">
             <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-black text-white mx-auto mb-4 shadow-xl bg-indigo-600 ring-4 ring-indigo-50">
               {company?.name?.[0] || 'V'}
             </div>
             <h2 className="text-2xl font-black tracking-tighter text-slate-900 uppercase">{company?.name}</h2>
             <p className="text-slate-400 font-bold text-[9px] uppercase tracking-[0.4em] mt-1">Boutique Selection</p>
          </header>

          <main className="max-w-[1440px] mx-auto px-4 md:px-8 py-10">
            {products.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-slate-100">
                <Package className="text-slate-200 mx-auto mb-4" size={48} />
                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Aguardando novos lançamentos.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
                {products.map(p => (
                  <div key={p.id} className="group flex flex-col bg-white transition-all duration-300">
                    <div 
                      onClick={() => setSelectedProduct(p)}
                      className="aspect-square bg-white relative overflow-hidden rounded-2xl border border-slate-100/60 shadow-sm cursor-pointer"
                    >
                      <img 
                        src={p.imageUrl} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-125" 
                        alt={p.name} 
                      />
                      <div className="absolute top-2 right-2 flex flex-col gap-2">
                        <button className="text-slate-400 hover:text-red-500 transition-colors">
                          <Heart size={20} strokeWidth={1.5} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="py-5 px-1 flex flex-col flex-1">
                      <h4 className="font-bold text-slate-800 text-sm tracking-tight uppercase truncate">
                        {p.name}
                      </h4>
                      <p className="text-slate-600 font-medium text-[11px] mt-1 line-clamp-1 h-4">
                        {p.description || ""}
                      </p>
                      
                      <div className="mt-8 flex items-center justify-between border-t border-slate-50 pt-4">
                        <p className="text-slate-900 font-black text-base tracking-tighter">R$ {p.price.toFixed(2)}</p>
                        
                        <button 
                          onClick={() => handleWhatsApp(p)} 
                          className="bg-indigo-600 text-white p-2.5 rounded-xl hover:bg-emerald-500 transition-all shadow-md shadow-indigo-100"
                          title="Chamar no WhatsApp"
                        >
                          <MessageCircle size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </>
      ) : (
        /* Visualização Detalhada do Produto */
        <main className="max-w-[1200px] mx-auto px-4 md:px-12 py-10 md:py-20 animate-in fade-in slide-in-from-bottom-8 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-24 items-start">
            
            {/* Coluna da Imagem */}
            <div className="relative group">
              <button 
                onClick={() => setSelectedProduct(null)}
                className="mb-8 flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-colors font-black text-[10px] uppercase tracking-widest group"
              >
                <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> Voltar para a Vitrine
              </button>
              
              <div className="aspect-[4/5] md:aspect-square bg-white rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-100">
                <img 
                  src={selectedProduct.imageUrl} 
                  alt={selectedProduct.name} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-125 cursor-zoom-in"
                />
              </div>
            </div>

            {/* Coluna das Informações */}
            <div className="pt-2 md:pt-16">
              <div className="mb-10">
                <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase mb-4 leading-none">
                  {selectedProduct.name}
                </h2>
                
                <div className="w-12 h-1.5 bg-indigo-600 rounded-full mb-8"></div>
                
                <div className="space-y-6 mb-12">
                   <p className="text-slate-800 font-bold text-base md:text-lg leading-relaxed bg-slate-50 p-6 rounded-3xl border border-slate-100">
                    {selectedProduct.description || "Este item premium foi selecionado especialmente para nossa coleção boutique, garantindo qualidade e exclusividade em cada detalhe."}
                  </p>
                </div>

                <div className="flex flex-col gap-6">
                   <div className="flex items-baseline gap-2">
                     <span className="text-slate-400 font-black text-xs uppercase tracking-widest">Valor do Investimento</span>
                     <p className="text-indigo-600 font-black text-4xl tracking-tighter">
                       R$ {selectedProduct.price.toFixed(2)}
                     </p>
                   </div>

                   <button 
                    onClick={() => handleWhatsApp(selectedProduct)}
                    className="w-full bg-indigo-600 text-white py-6 rounded-3xl font-black text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-4 hover:bg-emerald-500 hover:shadow-2xl hover:shadow-emerald-200 transition-all active:scale-[0.98] shadow-xl shadow-indigo-100"
                   >
                     <MessageCircle size={24} /> Comprar via WhatsApp
                   </button>
                </div>
              </div>

              <div className="p-6 bg-indigo-50/50 rounded-3xl border border-indigo-100/50">
                 <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Exclusividade Garantida</p>
                 <p className="text-[11px] text-indigo-900 font-medium leading-relaxed">
                   Ao clicar em comprar, você será redirecionado para o atendimento personalizado da nossa boutique para finalizar seu pedido com segurança.
                 </p>
              </div>
            </div>
          </div>
        </main>
      )}
      
      <footer className="max-w-[1440px] mx-auto px-6 py-12 border-t border-slate-100 text-center">
        <p className="text-slate-300 text-[9px] font-black uppercase tracking-[0.4em]">© {new Date().getFullYear()} {company?.name} • Vitrine Boutique Premium</p>
      </footer>
    </div>
  );
};

export default Storefront;
