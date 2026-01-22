
import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../../components/Sidebar';
import { useAuth, useRouter } from '../../App';
import { getTenantProducts, createProduct, deleteProduct, uploadProductImage, analyzeProductImage, updateProduct } from '../../store';
import { Product } from '../../types';
import { ShoppingBag, Loader2, Trash2, X, Edit3, Camera, Sparkles, Package, Check, ExternalLink, AlertCircle, Database, Zap, Link2, RefreshCw, Info } from 'lucide-react';

const TenantDashboard: React.FC = () => {
  const { company } = useAuth();
  const { navigate } = useRouter();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  
  const [newProd, setNewProd] = useState({ name: '', price: '', description: '' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadProducts = async () => {
    if (company) {
      try {
        const prods = await getTenantProducts(company.id);
        setProducts(prods || []);
      } catch (err) {
        console.error("Erro ao carregar produtos:", err);
      }
    }
  };

  useEffect(() => { loadProducts(); }, [company]);

  // Auxiliar para converter arquivo em Base64 para a IA
  const blobToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));

    // DISPARAR ANÁLISE POR IA
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const base64 = await blobToBase64(file);
      const suggestions = await analyzeProductImage(base64);
      
      if (suggestions) {
        setNewProd({
          name: suggestions.name || '',
          price: suggestions.suggestedPrice?.toString() || '',
          description: suggestions.description || ''
        });
      }
    } catch (err: any) {
      console.error("Erro na análise IA:", err);
      // Não bloqueia o usuário se a IA falhar, apenas avisa
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (p: Product) => {
    if (!confirm(`Deseja tentar excluir "${p.name}"? Se falhar, use a opção 'Reciclar'.`)) return;

    setDeletingId(p.id);
    setErrorMessage(null);
    
    try {
      await deleteProduct(p.id);
      setProducts(current => current.filter(item => item.id !== p.id));
    } catch (err: any) {
      console.error("DEBUG DELETE:", err);
      setErrorMessage("Não foi possível excluir (Erro de permissão do banco). Use a função 'Reciclar' para trocar este produto por um novo.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleRecycle = (p: Product) => {
    setEditingProduct(p);
    setNewProd({ name: '', price: '', description: '' }); 
    setPreviewUrl(null);
    setSelectedFile(null);
    setIsAdding(true);
    setErrorMessage("Modo Reciclagem: Selecione uma nova foto e a IA preencherá os dados para substituição.");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      let finalImageUrl = editingProduct?.imageUrl || '';
      if (selectedFile) finalImageUrl = await uploadProductImage(company.id, selectedFile);
      const productData = { name: newProd.name, price: parseFloat(newProd.price), description: newProd.description, imageUrl: finalImageUrl };
      
      if (editingProduct) {
        await updateProduct(editingProduct.id, productData);
      } else {
        await createProduct({ tenantId: company.id, ...productData });
      }
      
      await loadProducts();
      setIsAdding(false);
      resetForm();
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setEditingProduct(null);
    setNewProd({ name: '', price: '', description: '' });
    setSelectedFile(null);
    setPreviewUrl(null);
    setErrorMessage(null);
  };

  const copyStoreLink = () => {
    if (!company?.subdomain) return;
    const fullUrl = `${window.location.origin}/#/loja/${company.subdomain}`;
    navigator.clipboard.writeText(fullUrl).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  return (
    <div className="flex bg-slate-50 min-h-screen font-['Inter']">
      <Sidebar />
      <main className="ml-64 flex-1 p-8 pb-24">
        
        {errorMessage && (
          <div className="mb-8 p-6 bg-indigo-50 border-2 border-indigo-100 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6 animate-in slide-in-from-top duration-300 shadow-lg">
             <div className="flex items-start gap-4">
                <div className="p-3 bg-white text-indigo-600 rounded-2xl shrink-0 shadow-sm">
                   <Info size={24} />
                </div>
                <div>
                   <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-1">Dica de Gestão</p>
                   <p className="text-indigo-900 font-bold text-sm leading-tight max-w-md">{errorMessage}</p>
                </div>
             </div>
             <button 
              onClick={() => setErrorMessage(null)}
              className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-md shrink-0"
             >
               Entendi
             </button>
          </div>
        )}

        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Painel de Gestão</h1>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">{company?.name || 'Carregando...'}</p>
          </div>
          <div className="flex flex-wrap gap-3">
             <button 
              onClick={copyStoreLink}
              className={`px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 shadow-sm border ${
                copySuccess ? 'bg-emerald-500 border-emerald-500 text-white shadow-emerald-100' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {copySuccess ? <Check size={18} /> : <Link2 size={18} />}
              {copySuccess ? 'Copiado!' : 'Copiar Link'}
            </button>
             <button 
              onClick={() => navigate(`/loja/${company?.subdomain}`)}
              className="bg-indigo-600 text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-xl shadow-indigo-100"
            >
              <ExternalLink size={18} /> Ver Vitrine
            </button>
             <button 
              onClick={() => { resetForm(); setIsAdding(true); }} 
              className="bg-white text-slate-900 border border-slate-200 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm"
            >
              <Sparkles size={18} className="text-indigo-600" /> IA + Foto
            </button>
          </div>
        </header>

        {products.length === 0 ? (
          <div className="bg-white rounded-[3rem] p-20 border border-dashed border-slate-200 text-center">
             <Package size={40} className="text-slate-200 mx-auto mb-4" />
             <h2 className="text-xl font-black text-slate-900 mb-2">Sua vitrine está vazia</h2>
             <button onClick={() => setIsAdding(true)} className="text-blue-600 font-black uppercase text-xs tracking-widest hover:underline">Cadastrar Primeiro Produto</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map(p => (
              <div key={p.id} className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl transition-all group animate-in fade-in duration-500">
                <div className="aspect-square bg-slate-50 relative overflow-hidden">
                  <img src={p.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={p.name} />
                  <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  
                  <div className="absolute top-4 right-4 flex flex-col gap-2 translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
                     <button 
                      title="Editar Dados"
                      onClick={() => { resetForm(); setEditingProduct(p); setNewProd({ name: p.name, price: p.price.toString(), description: p.description }); setPreviewUrl(p.imageUrl || null); setIsAdding(true); }} 
                      className="p-3 bg-white/95 backdrop-blur rounded-xl text-blue-600 shadow-lg hover:bg-blue-600 hover:text-white transition-colors"
                     >
                        <Edit3 size={16} />
                     </button>
                     
                     <button 
                      title="Reciclar Slot (Substituir Produto)"
                      onClick={() => handleRecycle(p)}
                      className="p-3 bg-white/95 backdrop-blur rounded-xl text-amber-500 shadow-lg hover:bg-amber-500 hover:text-white transition-colors"
                     >
                        <RefreshCw size={16} />
                     </button>

                     <button 
                      title="Tentar Excluir"
                      onClick={() => handleDelete(p)} 
                      disabled={deletingId === p.id}
                      className={`p-3 bg-white/95 backdrop-blur rounded-xl shadow-lg transition-colors disabled:opacity-50 ${deletingId === p.id ? 'text-slate-400' : 'text-red-500 hover:bg-red-500 hover:text-white'}`}
                     >
                       {deletingId === p.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                     </button>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="font-black text-slate-900 truncate tracking-tight">{p.name}</h3>
                  <p className="text-indigo-600 font-black text-lg">R$ {p.price.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {isAdding && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[2000] flex items-center justify-center p-6">
            <div className="bg-white w-full max-w-2xl rounded-[3rem] p-10 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                    {editingProduct ? (newProd.name === '' ? 'Substituir Produto' : 'Editar Produto') : 'Novo Produto'}
                  </h2>
                  {editingProduct && newProd.name === '' && (
                    <p className="text-[10px] text-amber-600 font-black uppercase tracking-widest mt-1">Você está reciclando um espaço existente</p>
                  )}
                </div>
                <button onClick={() => setIsAdding(false)} className="p-2 hover:bg-slate-50 rounded-full transition-colors"><X size={24} /></button>
              </div>
              
              <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div onClick={() => fileInputRef.current?.click()} className="aspect-square bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center relative overflow-hidden cursor-pointer group hover:border-indigo-400 transition-colors">
                  {previewUrl ? <img src={previewUrl} className="w-full h-full object-cover" /> : (
                    <div className="text-center p-6">
                      <ShoppingBag size={32} className="text-slate-300 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Toque para Nova Foto</p>
                    </div>
                  )}
                  {isProcessing && (
                    <div className="absolute inset-0 bg-indigo-600/90 flex flex-col items-center justify-center text-white p-6 text-center">
                      <Loader2 className="animate-spin mb-3" size={32} />
                      <p className="text-[10px] font-black uppercase tracking-[0.2em]">IA Analisando...</p>
                    </div>
                  )}
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                <div className="space-y-4">
                  <input required placeholder="Nome do Produto" className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold outline-none focus:ring-2 focus:ring-indigo-500" value={newProd.name} onChange={e => setNewProd({...newProd, name: e.target.value})} />
                  <input required type="number" step="0.01" placeholder="Preço (R$)" className="w-full p-4 bg-slate-50 rounded-2xl border-none font-black outline-none focus:ring-2 focus:ring-indigo-500" value={newProd.price} onChange={e => setNewProd({...newProd, price: e.target.value})} />
                  <textarea placeholder="Descrição" className="w-full p-4 bg-slate-50 rounded-2xl border-none font-medium text-sm outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px]" value={newProd.description} onChange={e => setNewProd({...newProd, description: e.target.value})} />
                  <button type="submit" disabled={isProcessing} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition-all disabled:opacity-50">
                    {isProcessing ? 'Gravando...' : 'Salvar Alterações'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default TenantDashboard;
