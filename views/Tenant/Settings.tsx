
import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../App';
import { updateCompany } from '../../store';
import { Save, Phone, Type, CheckCircle, Loader2, MessageCircle, AlertCircle } from 'lucide-react';

const Settings: React.FC = () => {
  const { company, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    whatsapp: ''
  });

  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name || '',
        whatsapp: company.whatsapp || ''
      });
    }
  }, [company]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;
    
    setLoading(true);
    setSuccess(false);
    setErrorMsg(null);
    
    try {
      const cleanWhatsapp = formData.whatsapp.replace(/\D/g, '');
      
      await updateCompany(company.id, {
        name: formData.name,
        whatsapp: cleanWhatsapp
      });
      
      await refreshProfile();
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error("Falha ao salvar configurações:", err);
      setErrorMsg(err.message || "Erro desconhecido ao salvar.");
    } finally {
      setLoading(false);
    }
  };

  const testWhatsapp = () => {
    const num = formData.whatsapp.replace(/\D/g, '');
    if (num.length < 10) {
      alert("Digite um número válido com DDD para testar.");
      return;
    }
    const finalPhone = num.length <= 11 ? `55${num}` : num;
    const msg = encodeURIComponent("Olá! Este é um teste da minha nova vitrine virtual.");
    window.open(`https://wa.me/${finalPhone}?text=${msg}`, '_blank');
  };

  if (!company) {
    return (
      <div className="flex bg-slate-50 min-h-screen">
        <Sidebar />
        <main className="ml-64 flex-1 p-8 flex items-center justify-center">
          <Loader2 className="animate-spin text-blue-600" size={32} />
        </main>
      </div>
    );
  }

  return (
    <div className="flex bg-slate-50 min-h-screen font-['Inter']">
      <Sidebar />
      <main className="ml-64 flex-1 p-8">
        <header className="mb-12">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Configurações</h1>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Personalize sua vitrine de vendas</p>
        </header>

        <div className="max-w-2xl bg-white rounded-[3rem] p-10 shadow-sm border border-slate-100">
          <form onSubmit={handleSave} className="space-y-8">
            {errorMsg && (
              <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-start gap-3 text-red-600">
                <AlertCircle size={20} className="shrink-0" />
                <div>
                  <p className="text-xs font-black uppercase tracking-widest">Erro ao Salvar</p>
                  <p className="text-[10px] font-medium leading-relaxed">{errorMsg}</p>
                </div>
              </div>
            )}

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Type size={14} /> Nome da Vitrine
                </label>
                <input 
                  required
                  placeholder="Ex: Minha Loja"
                  className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Phone size={14} /> WhatsApp de Vendas
                </label>
               <div className="flex flex-col sm:flex-row gap-2">
  <input
    placeholder="DDD + Número"
    className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
    value={formData.whatsapp}
    onChange={(e) =>
      setFormData({
        ...formData,
        whatsapp: e.target.value.replace(/\D/g, "")
      })
    }
  />

  <button
    type="button"
    onClick={testWhatsapp}
    className="w-full sm:w-auto bg-emerald-500 text-white px-4 py-3 rounded-xl font-black text-[12px] flex items-center justify-center gap-1"
  >
    <MessageCircle size={12} />
    Testar
  </button>
</div>
              </div>
            </div>

            <div className="pt-4">
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-xl shadow-slate-200"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : (success ? <CheckCircle size={20} /> : <Save size={20} />)}
                {loading ? 'Salvando...' : (success ? 'Configurações Salvas!' : 'Salvar Alterações')}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default Settings;
