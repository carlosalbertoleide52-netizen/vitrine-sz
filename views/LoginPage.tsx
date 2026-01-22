
import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { ShoppingBag, ArrowRight, AlertCircle, Loader2, MailCheck, HelpCircle, KeyRound } from 'lucide-react';
import { Link, Navigate } from '../App';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setNeedsConfirmation(false);
    setLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      
      if (authError) {
        if (authError.message.includes("Email not confirmed")) {
          setError('E-mail ainda não confirmado.');
          setNeedsConfirmation(true);
        } else if (authError.message.includes("Invalid login credentials")) {
          setError('E-mail ou senha incorretos. Tente cadastrar uma nova conta se não lembrar.');
        } else {
          setError(authError.message);
        }
        setLoading(false);
      } else {
        setDone(true);
      }
    } catch (err) {
      setError('Erro de conexão com o servidor.');
      setLoading(false);
    }
  };

  if (done) return <Navigate to="/dashboard" />;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 font-['Inter']">
      <Link to="/" className="text-2xl font-black text-blue-600 flex items-center gap-2 mb-10 group">
        <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform">
          <ShoppingBag size={24} />
        </div>
        <span className="text-slate-900 tracking-tighter">Vitrine <span className="text-blue-600">SZ</span></span>
      </Link>

      <div className="bg-white w-full max-w-md p-10 rounded-[2.5rem] shadow-2xl shadow-slate-200 border border-slate-100">
        <h2 className="text-3xl font-black mb-2 tracking-tight">Login</h2>
        <p className="text-slate-400 mb-8 font-medium">Acesse sua vitrine virtual</p>
        
        {error && (
          <div className="mb-6 p-4 rounded-2xl text-xs font-bold flex items-start gap-3 bg-red-50 text-red-600 border border-red-100">
            <AlertCircle className="shrink-0" size={18} />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input 
            type="email" 
            required 
            placeholder="E-mail" 
            className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 font-bold" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
          />
          <input 
            type="password" 
            required 
            placeholder="Senha" 
            className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 font-bold" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
          />
          
          <button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-lg hover:bg-blue-700 flex items-center justify-center gap-3 transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Entrar'}
            {!loading && <ArrowRight size={20} />}
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-slate-50 text-center">
          <p className="text-slate-400 font-medium text-sm">
            Não consegue entrar? <br/>
            <Link to="/signup" className="text-blue-600 font-black hover:underline mt-2 inline-block">Criar nova conta agora</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
