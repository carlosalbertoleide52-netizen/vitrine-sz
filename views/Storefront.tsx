
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { getCompanyBySubdomain, getTenantProducts } from '../store';
import { Company, Product } from '../types';
import { ShoppingBag, MessageCircle, Phone, Package, ShieldAlert, AlertTriangle, RefreshCw, Copy, Check, Terminal, LayoutDashboard, ArrowLeft, Database, SearchX, Heart, ChevronLeft, Minus, Plus, Trash2, MapPin, Loader2, RotateCcw, ArrowRight } from 'lucide-react';
import { useRouter, Link } from '../App';

interface CartItem {
  product: Product;
  quantity: number;
}

interface Address {
  cep: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  number: string;
  complement: string;
}

const EMPTY_ADDRESS: Address = {
  cep: '',
  street: '',
  neighborhood: '',
  city: '',
  state: '',
  number: '',
  complement: '',
};

type CepStatus = 'idle' | 'loading' | 'success' | 'error';

const formatCep = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
};

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

  const cartStorageKey = subdomain ? `vitrine_cart_${subdomain}` : null;

  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    if (!cartStorageKey) return [];
    try {
      const stored = localStorage.getItem(cartStorageKey);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (!cartStorageKey) return;
    try {
      if (cartItems.length === 0) {
        localStorage.removeItem(cartStorageKey);
      } else {
        localStorage.setItem(cartStorageKey, JSON.stringify(cartItems));
      }
    } catch { /* quota exceeded or private mode */ }
  }, [cartItems, cartStorageKey]);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const cartRef = useRef<HTMLDivElement>(null);

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

  const [cardQuantities, setCardQuantities] = useState<Record<string, number>>({});
  const [detailQuantity, setDetailQuantity] = useState(1);

  const [showCheckout, setShowCheckout] = useState(false);
  const [address, setAddress] = useState<Address>(EMPTY_ADDRESS);
  const [cepStatus, setCepStatus] = useState<CepStatus>('idle');

  // Close dropdown on click outside
  useEffect(() => {
    if (!isCartOpen) return;
    const handler = (e: MouseEvent) => {
      if (cartRef.current && !cartRef.current.contains(e.target as Node)) {
        setIsCartOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isCartOpen]);

  const toggleCart = useCallback(() => setIsCartOpen(prev => !prev), []);

  const updateQuantity = useCallback((productId: string, delta: number) => {
    setCartItems(prev => prev.map(item =>
      item.product.id === productId
        ? { ...item, quantity: Math.max(1, item.quantity + delta) }
        : item
    ));
  }, []);

  const removeItem = useCallback((productId: string) => {
    setCartItems(prev => prev.filter(item => item.product.id !== productId));
  }, []);

  const clearCart = useCallback(() => setCartItems([]), []);

  const addToCart = useCallback((product: Product, quantity: number) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
  }, []);

  const getCardQuantity = useCallback((productId: string) => cardQuantities[productId] ?? 1, [cardQuantities]);

  const updateCardQuantity = useCallback((productId: string, delta: number) => {
    setCardQuantities(prev => ({
      ...prev,
      [productId]: Math.max(1, (prev[productId] ?? 1) + delta),
    }));
  }, []);

  const handleAddToCartFromCard = useCallback((product: Product) => {
    addToCart(product, getCardQuantity(product.id));
    setCardQuantities(prev => {
      const next = { ...prev };
      delete next[product.id];
      return next;
    });
  }, [addToCart, getCardQuantity]);

  const handleAddToCartFromDetail = useCallback(() => {
    if (!selectedProduct) return;
    addToCart(selectedProduct, detailQuantity);
    setDetailQuantity(1);
  }, [addToCart, selectedProduct, detailQuantity]);

  const updateAddressField = useCallback((field: keyof Address, value: string) => {
    setAddress(prev => ({ ...prev, [field]: value }));
  }, []);

  const clearAddress = useCallback(() => {
    setAddress(EMPTY_ADDRESS);
    setCepStatus('idle');
  }, []);

  const handleCepChange = useCallback((value: string) => {
    const formatted = formatCep(value);
    setAddress(prev => ({ ...prev, cep: formatted }));

    const digits = formatted.replace(/\D/g, '');
    if (digits.length < 8) {
      setCepStatus('idle');
      return;
    }

    setCepStatus('loading');
    fetch(`https://viacep.com.br/ws/${digits}/json/`)
      .then(res => {
        if (!res.ok) throw new Error('Erro na busca');
        return res.json();
      })
      .then(data => {
        if (data.erro) {
          setCepStatus('error');
          return;
        }
        setAddress(prev => ({
          ...prev,
          street: data.logradouro || '',
          neighborhood: data.bairro || '',
          city: data.localidade || '',
          state: data.uf || '',
        }));
        setCepStatus('success');
      })
      .catch(() => setCepStatus('error'));
  }, []);

  const addressTouched = useMemo(() => {
    return (Object.values(address) as string[]).some(v => v.trim() !== '');
  }, [address]);

  const addressValid = useMemo(() => {
    if (!addressTouched) return true;
    const { street, neighborhood, city, state, number: num, cep } = address;
    return [cep, street, neighborhood, city, state, num].every(v => v.trim() !== '');
  }, [address, addressTouched]);

  const canFinalize = cartItems.length > 0 && addressValid;

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const buildWhatsAppMessage = useCallback(() => {
    let msg = `*Novo Pedido - ${company?.name}*\n\n`;
    msg += `*Itens do Pedido:*\n`;
    cartItems.forEach((item, i) => {
      msg += `${i + 1}. ${item.product.name} — ${item.quantity}x R$ ${item.product.price.toFixed(2)} = R$ ${(item.product.price * item.quantity).toFixed(2)}\n`;
    });
    const total = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    msg += `\n*Total: R$ ${total.toFixed(2)}*\n`;

    if (addressTouched && addressValid) {
      msg += `\n*Endereço de Entrega:*\n`;
      msg += `${address.street}, ${address.number}`;
      if (address.complement) msg += ` - ${address.complement}`;
      msg += `\n${address.neighborhood} - ${address.city}/${address.state}`;
      msg += `\nCEP: ${address.cep}`;
    }

    return msg;
  }, [company, cartItems, address, addressTouched, addressValid]);

  const handleFinalize = useCallback(() => {
    if (!company) return;
    const phone = company.whatsapp || '';
    if (!phone) {
      alert('Loja sem número de WhatsApp configurado.');
      return;
    }
    const finalPhone = phone.replace(/\D/g, '').length <= 11
      ? `55${phone.replace(/\D/g, '')}`
      : phone.replace(/\D/g, '');
    const message = buildWhatsAppMessage();
    window.open(`https://wa.me/${finalPhone}?text=${encodeURIComponent(message)}`, '_blank');
    setShowConfirmDialog(false);
  }, [company, buildWhatsAppMessage]);

  const cartTotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [cartItems]
  );

  const cartItemCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems]
  );

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
          <h1 className="text-xl font-black tracking-tighter text-indigo-600 uppercase italic cursor-pointer" onClick={() => { setSelectedProduct(null); setShowCheckout(false); }}>{company?.name}</h1>
          <div className="flex items-center gap-6">
            <div ref={cartRef} className="relative">
              <button
                onClick={toggleCart}
                className="relative p-2.5 rounded-xl hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 transition-all"
                aria-label="Abrir sacola de compras"
              >
                <ShoppingBag size={22} />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[10px] font-black min-w-[20px] h-5 rounded-full flex items-center justify-center px-1">
                    {cartItemCount}
                  </span>
                )}
              </button>

              <div
                className={`absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 transition-all duration-200 ease-out origin-top-right ${
                  isCartOpen
                    ? 'opacity-100 scale-100 translate-y-0'
                    : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
                }`}
              >
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShoppingBag size={16} className="text-indigo-600" />
                    <h3 className="font-black text-xs uppercase tracking-widest text-slate-900">Sacola</h3>
                    {cartItemCount > 0 && (
                      <span className="text-[10px] font-bold text-slate-400">({cartItemCount} {cartItemCount === 1 ? 'item' : 'itens'})</span>
                    )}
                  </div>
                  {cartItems.length > 0 && (
                    <button
                      onClick={clearCart}
                      className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-red-500 transition-colors"
                    >
                      Limpar
                    </button>
                  )}
                </div>

                {cartItems.length === 0 ? (
                  <div className="p-10 text-center">
                    <ShoppingBag size={36} className="text-slate-200 mx-auto mb-3" />
                    <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Sua sacola está vazia</p>
                  </div>
                ) : (
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                    {cartItems.map(item => (
                      <div key={item.product.id} className="p-4 flex gap-3 items-start">
                        {item.product.imageUrl && (
                          <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 border border-slate-100 bg-slate-50">
                            <img src={item.product.imageUrl} alt={item.product.name} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm text-slate-800 truncate">{item.product.name}</h4>
                          <p className="text-slate-500 text-xs font-medium mt-0.5">
                            R$ {item.product.price.toFixed(2)}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              onClick={() => updateQuantity(item.product.id, -1)}
                              disabled={item.quantity <= 1}
                              className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:border-indigo-300 hover:text-indigo-600 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="text-sm font-black text-slate-800 w-6 text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.product.id, 1)}
                              className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:border-indigo-300 hover:text-indigo-600 transition-all"
                            >
                              <Plus size={14} />
                            </button>
                            <button
                              onClick={() => removeItem(item.product.id)}
                              className="ml-auto w-7 h-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
                              aria-label={`Remover ${item.product.name}`}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                        <p className="text-sm font-black text-slate-900 flex-shrink-0">
                          R$ {(item.product.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="p-5 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-widest text-slate-400">Total</span>
                    <span className="text-lg font-black text-slate-900 tracking-tighter">R$ {cartTotal.toFixed(2)}</span>
                  </div>
                  <button
                    disabled={cartItems.length === 0}
                    onClick={() => { setShowCheckout(true); setIsCartOpen(false); }}
                    className="w-full bg-indigo-600 text-white py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-emerald-500 hover:shadow-lg hover:shadow-emerald-100 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-indigo-600 disabled:hover:shadow-none disabled:active:scale-100"
                  >
                    Finalizar Compra
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {showCheckout ? (
        /* Tela de Revisão e Finalização */
        <main className="max-w-[1200px] mx-auto px-4 md:px-8 py-10 md:py-16">
          <button
            onClick={() => setShowCheckout(false)}
            className="mb-8 flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-colors font-black text-xs uppercase tracking-widest group"
          >
            <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> Voltar para a Vitrine
          </button>

          <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-slate-900 uppercase mb-10">Finalizar Pedido</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
            {/* Coluna Esquerda - Resumo do Pedido */}
            <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <ShoppingBag size={20} className="text-indigo-600" />
                  <h3 className="font-black text-base uppercase tracking-widest text-slate-900">Resumo do Pedido</h3>
                  <span className="text-xs font-bold text-slate-400">({cartItemCount} {cartItemCount === 1 ? 'item' : 'itens'})</span>
                </div>
              </div>

              {cartItems.length === 0 ? (
                <div className="p-12 text-center">
                  <ShoppingBag size={44} className="text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-4">Seu carrinho está vazio</p>
                  <button
                    onClick={() => setShowCheckout(false)}
                    className="text-indigo-600 font-black text-sm uppercase tracking-widest hover:text-indigo-800 transition-colors"
                  >
                    Voltar para a Vitrine
                  </button>
                </div>
              ) : (
                <>
                  <div className="divide-y divide-slate-50">
                    {cartItems.map(item => (
                      <div key={item.product.id} className="p-5 flex gap-4 items-start">
                        {item.product.imageUrl && (
                          <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border border-slate-100 bg-slate-50">
                            <img src={item.product.imageUrl} alt={item.product.name} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-base text-slate-800 truncate">{item.product.name}</h4>
                          <p className="text-slate-500 text-sm font-medium mt-0.5">R$ {item.product.price.toFixed(2)} un.</p>
                          <div className="flex items-center gap-2 mt-3">
                            <button
                              onClick={() => updateQuantity(item.product.id, -1)}
                              disabled={item.quantity <= 1}
                              className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:border-indigo-300 hover:text-indigo-600 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <Minus size={15} />
                            </button>
                            <span className="text-base font-black text-slate-800 w-8 text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.product.id, 1)}
                              className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:border-indigo-300 hover:text-indigo-600 transition-all"
                            >
                              <Plus size={15} />
                            </button>
                            <button
                              onClick={() => removeItem(item.product.id)}
                              className="ml-auto w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
                              aria-label={`Remover ${item.product.name}`}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                        <p className="text-lg font-black text-slate-900 flex-shrink-0 tracking-tighter">
                          R$ {(item.product.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="p-6 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-sm font-black uppercase tracking-widest text-slate-400">Total</span>
                    <span className="text-3xl font-black text-slate-900 tracking-tighter">R$ {cartTotal.toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>

            {/* Coluna Direita - Endereço + Finalizar */}
            <div className="space-y-6">
              <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin size={20} className="text-indigo-600" />
                    <h3 className="font-black text-base uppercase tracking-widest text-slate-900">Endereço de Entrega</h3>
                  </div>
                  {addressTouched && (
                    <button
                      onClick={clearAddress}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                      title="Limpar endereço"
                    >
                      <RotateCcw size={18} />
                    </button>
                  )}
                </div>

                <div className="p-6">
                  <div className="bg-indigo-50/50 rounded-2xl border border-indigo-100/50 p-4 mb-6">
                    <p className="text-[13px] text-indigo-900 font-medium leading-relaxed">
                      O preenchimento do endereço é <span className="font-black">opcional</span>. Você poderá informar o endereço de entrega diretamente pelo WhatsApp na finalização do pedido.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {/* CEP */}
                    <div>
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 block">CEP</label>
                      <div className="relative">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={address.cep}
                          onChange={e => handleCepChange(e.target.value)}
                          placeholder="00000-000"
                          maxLength={9}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-base font-medium text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition-all"
                        />
                        {cepStatus === 'loading' && (
                          <Loader2 size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-400 animate-spin" />
                        )}
                      </div>
                      {cepStatus === 'error' && (
                        <p className="text-red-500 text-[13px] font-bold mt-1.5">CEP não encontrado. Preencha o endereço manualmente.</p>
                      )}
                    </div>

                    {/* Rua */}
                    <div>
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Rua / Logradouro</label>
                      <input
                        type="text"
                        value={address.street}
                        onChange={e => updateAddressField('street', e.target.value)}
                        disabled={cepStatus === 'loading'}
                        placeholder="Rua, Avenida..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-base font-medium text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>

                    {/* Número + Complemento */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Número</label>
                        <input
                          type="text"
                          value={address.number}
                          onChange={e => updateAddressField('number', e.target.value)}
                          placeholder="Nº"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-base font-medium text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Complemento</label>
                        <input
                          type="text"
                          value={address.complement}
                          onChange={e => updateAddressField('complement', e.target.value)}
                          placeholder="Apto, Bloco..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-base font-medium text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition-all"
                        />
                      </div>
                    </div>

                    {/* Bairro */}
                    <div>
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Bairro</label>
                      <input
                        type="text"
                        value={address.neighborhood}
                        onChange={e => updateAddressField('neighborhood', e.target.value)}
                        disabled={cepStatus === 'loading'}
                        placeholder="Bairro"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-base font-medium text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>

                    {/* Cidade + Estado */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Cidade</label>
                        <input
                          type="text"
                          value={address.city}
                          onChange={e => updateAddressField('city', e.target.value)}
                          disabled={cepStatus === 'loading'}
                          placeholder="Cidade"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-base font-medium text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 block">UF</label>
                        <input
                          type="text"
                          value={address.state}
                          onChange={e => updateAddressField('state', e.target.value.toUpperCase().slice(0, 2))}
                          disabled={cepStatus === 'loading'}
                          placeholder="UF"
                          maxLength={2}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-base font-medium text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </div>

                  {addressTouched && !addressValid && (
                    <p className="text-amber-600 text-[13px] font-bold mt-4">
                      Preencha todos os campos obrigatórios do endereço ou limpe o formulário para continuar sem endereço.
                    </p>
                  )}
                </div>
              </div>

              <button
                disabled={!canFinalize}
                onClick={() => setShowConfirmDialog(true)}
                className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-base uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-emerald-500 hover:shadow-2xl hover:shadow-emerald-200 transition-all active:scale-[0.98] shadow-xl shadow-indigo-100 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-indigo-600 disabled:hover:shadow-none disabled:active:scale-100"
              >
                Confirmar e Finalizar Pedido <ArrowRight size={22} />
              </button>
            </div>
          </div>
        </main>
      ) : !selectedProduct ? (
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
              <>
              <p className="text-center text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em] mb-8">Quer saber mais? Clique no produto!</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
                {products.map(p => (
                  <div key={p.id} onClick={() => { setSelectedProduct(p); setDetailQuantity(1); }} className="group flex flex-col bg-white transition-all duration-300 cursor-pointer">
                    <div
                      className="aspect-square bg-white relative overflow-hidden rounded-2xl border border-slate-100/60 shadow-sm"
                    >
                      <img
                        src={p.imageUrl}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-125"
                        alt={p.name}
                      />
                      <div className="absolute top-2 right-2 flex flex-col gap-2 z-10">
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

                        <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => updateCardQuantity(p.id, -1)}
                            disabled={getCardQuantity(p.id) <= 1}
                            className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:border-indigo-300 hover:text-indigo-600 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <Minus size={13} />
                          </button>
                          <span className="text-sm font-black text-slate-800 w-6 text-center">{getCardQuantity(p.id)}</span>
                          <button
                            onClick={() => updateCardQuantity(p.id, 1)}
                            className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:border-indigo-300 hover:text-indigo-600 transition-all"
                          >
                            <Plus size={13} />
                          </button>
                          <button
                            onClick={() => handleAddToCartFromCard(p)}
                            className="bg-indigo-600 text-white p-2 rounded-xl hover:bg-emerald-500 transition-all shadow-md shadow-indigo-100 ml-1"
                            title="Adicionar ao carrinho"
                          >
                            <ShoppingBag size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              </>
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

                   <div className="flex items-center gap-3">
                     <span className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Qtd</span>
                     <button
                       onClick={() => setDetailQuantity(prev => Math.max(1, prev - 1))}
                       disabled={detailQuantity <= 1}
                       className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:border-indigo-300 hover:text-indigo-600 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                     >
                       <Minus size={18} />
                     </button>
                     <span className="text-lg font-black text-slate-900 w-8 text-center">{detailQuantity}</span>
                     <button
                       onClick={() => setDetailQuantity(prev => prev + 1)}
                       className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:border-indigo-300 hover:text-indigo-600 transition-all"
                     >
                       <Plus size={18} />
                     </button>
                   </div>

                   <button
                    onClick={handleAddToCartFromDetail}
                    className="w-full bg-indigo-600 text-white py-6 rounded-3xl font-black text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-4 hover:bg-emerald-500 hover:shadow-2xl hover:shadow-emerald-200 transition-all active:scale-[0.98] shadow-xl shadow-indigo-100"
                   >
                     <ShoppingBag size={24} /> Adicionar ao Carrinho
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

          <button
            onClick={() => setSelectedProduct(null)}
            className="mt-12 flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-colors font-black text-[10px] uppercase tracking-widest group"
          >
            <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> Voltar para a Vitrine
          </button>
        </main>
      )}

      <footer className="max-w-[1440px] mx-auto px-6 py-12 border-t border-slate-100 text-center">
        <p className="text-slate-300 text-[9px] font-black uppercase tracking-[0.4em]">© {new Date().getFullYear()} {company?.name} • Vitrine Boutique Premium</p>
      </footer>

      {showConfirmDialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowConfirmDialog(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full p-8 md:p-10">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-5">
                <MessageCircle size={28} className="text-indigo-600" />
              </div>
              <h3 className="text-xl font-black tracking-tighter text-slate-900 uppercase mb-2">Finalizar Pedido</h3>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">
                Seu pedido será enviado para o WhatsApp da loja <span className="font-black text-indigo-600">{company?.name}</span>. Deseja continuar?
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 mb-8 border border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black uppercase tracking-widest text-slate-400">{cartItemCount} {cartItemCount === 1 ? 'item' : 'itens'}</span>
                <span className="text-lg font-black text-slate-900 tracking-tighter">R$ {cartTotal.toFixed(2)}</span>
              </div>
              {addressTouched && addressValid && (
                <p className="text-xs text-slate-500 font-medium mt-1 flex items-center gap-1.5">
                  <MapPin size={13} className="text-indigo-400 flex-shrink-0" />
                  {address.street}, {address.number} - {address.city}/{address.state}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="flex-1 py-4 rounded-2xl font-black text-sm uppercase tracking-widest text-slate-500 border border-slate-200 hover:bg-slate-50 transition-all active:scale-[0.98]"
              >
                Cancelar
              </button>
              <button
                onClick={handleFinalize}
                className="flex-1 py-4 rounded-2xl font-black text-sm uppercase tracking-widest text-white bg-indigo-600 hover:bg-emerald-500 hover:shadow-lg hover:shadow-emerald-100 transition-all active:scale-[0.98]"
              >
                Enviar Pedido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Storefront;
