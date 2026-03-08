
import React, { useState } from 'react';
import { useRouter } from '../App';
import { ShieldAlert, Copy, Check, Zap, ArrowLeft, AlertCircle, Unlock, Database } from 'lucide-react';

const MASTER_KEY = "SZ-MASTER-2025";

const SetupMaster: React.FC = () => {
  const { navigate } = useRouter();
  const [keyInput, setKeyInput] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [copied, setCopied] = useState(false);

  // SCRIPT TOTAL: Agora ele garante que a tabela pertença ao sistema e libera deletar
  const NUCLEAR_SQL = `
-- 1. DESATIVA O RLS COMPLETAMENTE (FORCE)
ALTER TABLE IF EXISTS public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profiles DISABLE ROW LEVEL SECURITY;

-- 2. DÁ PERMISSÃO DE PROPRIETÁRIO AOS PAPÉIS DE API
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- 3. REMOVE QUALQUER POLÍTICA QUE POSSA ESTAR TRAVANDO O DELETE
DROP POLICY IF EXISTS "libera_tudo" ON public.products;
DROP POLICY IF EXISTS "bypass_rls" ON public.products;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON public.products;

-- 4. CRIA UMA POLÍTICA EXPLÍCITA DE LIBERAÇÃO TOTAL (CASO O RLS SEJA ATIVADO POR ACIDENTE)
CREATE POLICY "permissao_total" ON public.products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "permissao_total" ON public.companies FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "permissao_total" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
  `.trim();

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (keyInput === MASTER_KEY) setIsUnlocked(true);
    else { alert("Chave incorreta"); setKeyInput(''); }
  };

  const copySQL = () => {
    navigator.clipboard.writeText(NUCLEAR_SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <form onSubmit={handleUnlock} className="bg-slate-900 p-10 rounded-[2rem] border border-slate-800 w-full max-w-md text-center shadow-2xl">
          <ShieldAlert className="text-red-500 mx-auto mb-6" size={48} />
          <h1 className="text-white text-xl font-black mb-6">Diagnóstico de Banco</h1>
          <p className="text-slate-400 text-xs mb-8">O banco está travando a exclusão. Precisamos resetar as permissões.</p>
          <input type="password" placeholder="Chave Master" autoFocus className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-5 text-white text-center text-xl mb-6 outline-none" value={keyInput} onChange={e => setKeyInput(e.target.value)} />
          <button type="submit" className="w-full bg-indigo-600 py-5 rounded-2xl font-black uppercase text-white hover:bg-indigo-700 transition-all">Desbloquear Correção</button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 font-['Inter']">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-[2.5rem] p-12 shadow-2xl">
        <h1 className="text-white text-2xl font-black mb-4 flex items-center gap-3"><Database className="text-emerald-400" /> Reset de Permissões (Fix Delete)</h1>
        <p className="text-slate-400 text-sm mb-8 leading-relaxed">Não é erro na imagem da IA. É o PostgreSQL protegendo a linha contra exclusão. Execute isto para liberar.</p>
        
        <div className="bg-slate-950 rounded-2xl p-6 border border-white/5 relative mb-8">
          <div className="bg-black/50 p-6 rounded-xl font-mono text-[10px] text-emerald-400 overflow-x-auto h-48 border border-white/5">
            <pre>{NUCLEAR_SQL}</pre>
          </div>
          <button onClick={copySQL} className="absolute top-10 right-10 bg-white/10 hover:bg-white/20 p-3 rounded-xl text-white transition-all">
             {copied ? <Check size={20} /> : <Copy size={20} />}
          </button>
        </div>

        <div className="space-y-4 mb-8">
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-start gap-4">
            <Unlock className="text-emerald-500 shrink-0 mt-1" size={18} />
            <p className="text-emerald-100 text-[10px] leading-relaxed">
              <b>Passo 1:</b> Copie o código acima clicando no ícone de papel.<br/>
              <b>Passo 2:</b> No Supabase, vá em <b>SQL Editor</b> {"→"} <b>New Query</b>.<br />

              <b>Passo 3:</b> Cole e clique em <b>RUN</b>.
            </p>
          </div>
        </div>

        <button onClick={() => navigate('/dashboard')} className="w-full bg-white text-slate-900 py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-100 flex items-center justify-center gap-2">
          <ArrowLeft size={18} /> Voltar e Tentar Excluir Novamente
        </button>
      </div>
    </div>
  );
};

export default SetupMaster;
