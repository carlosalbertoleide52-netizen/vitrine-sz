
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { registerCompanyAndAdmin, getCompanyBySubdomain } from '../store';
import { ShoppingBag, ArrowLeft, ArrowRight, Loader2, AlertCircle, CheckCircle2, Globe, LogIn, Mail, Sparkles, Info } from 'lucide-react';
import { Link, Navigate, useRouter } from '../App';

const RegisterPage: React.FC = () => {
  const { navigate } = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  
  const [companyName, setCompanyName] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [error, setError] = useState('');

  const sanitizeSubdomain = (val: string) => {
    return val
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") 
      .replace(/[^a-z0-9]/g, ''); 
  };

  const handleCompanyNameChange = (val: string) => {
    setCompanyName(val);
    if (step === 1) {
      setSubdomain(sanitizeSubdomain(val));
    }
  };

  const validateSubdomain = async () => {
    if (!subdomain) return false;
    const { data } = await getCompanyBySubdomain(subdomain);
    if (data) {
      setError(`O link "loja/${subdomain}" já está sendo usado por outra empresa. Tente um nome um pouco diferente.`);
      return false;
    }
    return true;
  };

  const nextStep = async () => {
    setError('');
    if (!companyName || !subdomain) {
      setError("Por favor, preencha o nome da sua loja.");
      return;
    }
    
    setLoading(true);
    const isValid = await validateSubdomain();
    setLoading(false);
    
    if (isValid) setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: adminEmail,
        password: password,
        options: { data: { full_name: adminName } }
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          setError("Este e-mail já possui uma loja. Para criar uma nova conta, você deve usar um e-mail diferente.");
          setLoading(false);
          return;
        }
        throw authError;
      }

      const userId = authData.user?.id;
      if (!userId) throw new Error("Erro na criação do usuário.");

      await registerCompanyAndAdmin(companyName, subdomain, adminName, adminEmail, userId);
      setSuccess(true);
      setTimeout(() => setShouldRedirect(true), 2000);

    } catch (err: any) {
      setError(err.message || "Ocorreu um erro ao criar sua loja.");
    } finally {
      setLoading(false);
    }
  };

  if (shouldRedirect) return <Navigate to="/dashboard" />;

  const isUserRegisteredError = error.includes("e-mail já possui");
  const isSubdomainError = error.includes("já está sendo usado");

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-['Inter']">
      
      <div className="w-full max-w-4xl bg-white rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden grid grid-cols-1 md:grid-cols-2">
        <div className="bg-indigo-600 p-12 text-white flex flex-col justify-between hidden md:flex relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          <Link to="/" className="text-xl font-black flex items-center gap-2 relative z-10">
            <ShoppingBag size={24} /> Vitrine SZ
          </Link>
          <div className="relative z-10">
            <h2 className="text-4xl font-black leading-tight mb-4">Recomece com uma vitrine incrível.</h2>
            <p className="text-indigo-100 font-medium opacity-80">Isolamento total de dados e IA para cadastrar seus produtos.</p>
          </div>
          <div className="flex gap-2 relative z-10">
            <div className={`w-12 h-1.5 ${step === 1 ? 'bg-white' : 'bg-white/30'} rounded-full transition-all`}></div>
            <div className={`w-12 h-1.5 ${step === 2 ? 'bg-white' : 'bg-white/30'} rounded-full transition-all`}></div>
          </div>
        </div>

        <div className="p-8 md:p-14">
          {success ? (
            <div className="text-center py-10 animate-in zoom-in-95 duration-500">
               <div className="w-24 h-24 bg-emerald-100 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-emerald-100">
                 <CheckCircle2 size={48} className="text-emerald-500" />
               </div>
               <h3 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Sucesso!</h3>
               <p className="text-slate-500 font-medium">Sua nova loja está sendo preparada...</p>
            </div>
          ) : (
            <>
              <header className="mb-10">
                {step === 2 && (
                  <button onClick={() => setStep(1)} className="text-indigo-600 hover:text-indigo-700 flex items-center gap-1 mb-3 font-black text-[10px] uppercase tracking-widest transition-all">
                    <ArrowLeft size={14} /> Voltar para Nome da Loja
                  </button>
                )}
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                  {step === 1 ? 'Nova Vitrine' : 'Novo Cadastro'}
                </h1>
                <p className="text-slate-400 text-sm font-medium mt-1">Passo {step} de 2</p>
              </header>

              {error && (
                <div className={`mb-8 p-6 rounded-[2rem] flex flex-col gap-4 animate-in slide-in-from-top-2 border shadow-lg ${
                  isUserRegisteredError || isSubdomainError ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-red-50 border-red-100 text-red-600'
                }`}>
                  <div className="flex items-start gap-3">
                    <AlertCircle size={20} className="shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-black leading-tight mb-1">{error}</p>
                      <p className="text-xs font-medium opacity-80 leading-relaxed">
                        {isUserRegisteredError 
                          ? "Você está tentando criar uma conta nova, mas usando um e-mail que já existe. Para começar do zero, use um e-mail diferente." 
                          : "Parece que esse nome de loja já foi usado antes. Tente adicionar um número ou outra palavra ao final."}
                      </p>
                    </div>
                  </div>
                  
                  {isUserRegisteredError && (
                    <button 
                      type="button"
                      onClick={() => { setAdminEmail(''); setError(''); }}
                      className="w-full bg-indigo-600 text-white px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all"
                    >
                      <Mail size={14} /> Usar outro e-mail agora
                    </button>
                  )}
                </div>
              )}

              <form onSubmit={step === 1 ? (e) => { e.preventDefault(); nextStep(); } : handleSubmit} className="space-y-6">
                {step === 1 ? (
                  <>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome da Nova Loja</label>
                      <input 
                        required 
                        autoFocus 
                        className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:border-indigo-500 focus:bg-white font-bold transition-all shadow-inner" 
                        value={companyName} 
                        onChange={e => handleCompanyNameChange(e.target.value)} 
                        placeholder="Ex: Minha Loja 2.0" 
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Seu novo link:</label>
                      <div className="mt-2 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                        <p className="text-xs font-bold text-indigo-900 break-all">
                          .../loja/<span className="text-indigo-600 underline decoration-indigo-300 decoration-2">{subdomain || 'sua-loja'}</span>
                        </p>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-start gap-3">
                       <Info size={16} className="text-slate-400 shrink-0 mt-0.5" />
                       <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                         Dica: Se você quer recomeçar porque a loja antiga deu erro, tente um nome levemente diferente para o seu link.
                       </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl mb-4 flex items-center gap-3">
                      <Sparkles size={18} className="text-amber-600 shrink-0" />
                      <p className="text-[10px] font-black text-amber-800 uppercase tracking-widest">
                        ⚠️ Utilize um e-mail válido. Ele será usado para ativação e comunicação após o período de teste.
                      </p>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Seu Nome</label>
                      <input required autoFocus placeholder="Nome Completo" className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:border-indigo-500 focus:bg-white font-bold transition-all" value={adminName} onChange={e => setAdminName(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Novo E-mail</label>
                      <input required type="email" placeholder="email_novo@gmail.com" className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:border-indigo-500 focus:bg-white font-bold transition-all" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Senha</label>
                      <input required type="password" placeholder="Mínimo 6 caracteres" minLength={6} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:border-indigo-500 focus:bg-white font-bold transition-all" value={password} onChange={e => setPassword(e.target.value)} />
                    </div>
                  </>
                )}

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-lg shadow-2xl shadow-indigo-500/20 hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
                >
                  {loading ? <Loader2 className="animate-spin" /> : (step === 1 ? 'Avançar para Dados' : 'Criar minha Nova Loja')}
                  {!loading && <ArrowRight size={20} />}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
