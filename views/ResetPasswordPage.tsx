
import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { ShoppingBag, ArrowRight, AlertCircle, Loader2, CheckCircle2, KeyRound } from 'lucide-react';
import { Link, Navigate } from '../App';

const ResetPasswordPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [redirect, setRedirect] = useState(false);
  // Erro quando não há sessão de recuperação (link inválido/expirado ou acesso direto à rota).
  const [invalidLink, setInvalidLink] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }
    if (password !== confirm) {
      setError('As senhas não conferem.');
      return;
    }

    setLoading(true);

    try {
      const { error: authError } = await supabase.auth.updateUser({ password });

      if (authError) {
        if (authError.message.toLowerCase().includes('session') || authError.name === 'AuthSessionMissingError') {
          setInvalidLink(true);
        } else {
          setError(authError.message);
        }
        setLoading(false);
      } else {
        setDone(true);
        // A sessão de recuperação já é válida → login automático no dashboard.
        setTimeout(() => setRedirect(true), 2000);
      }
    } catch (err) {
      setError('Erro de conexão com o servidor.');
      setLoading(false);
    }
  };

  if (redirect) return <Navigate to="/dashboard" />;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 font-['Inter']">
      <Link to="/" className="text-2xl font-black text-blue-600 flex items-center gap-2 mb-10 group">
        <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform">
          <ShoppingBag size={24} />
        </div>
        <span className="text-slate-900 tracking-tighter">Vitrine <span className="text-blue-600">SZ</span></span>
      </Link>

      <div className="bg-white w-full max-w-md p-10 rounded-[2.5rem] shadow-2xl shadow-slate-200 border border-slate-100">
        {invalidLink ? (
          <div className="text-center py-6">
            <div className="w-20 h-20 bg-red-100 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-red-100">
              <AlertCircle size={40} className="text-red-500" />
            </div>
            <h2 className="text-2xl font-black mb-2 tracking-tight">Link inválido ou expirado</h2>
            <p className="text-slate-400 font-medium text-sm mb-8">
              Não encontramos uma sessão de recuperação válida. Solicite a recuperação de senha novamente.
            </p>
            <Link to="/forgot-password" className="text-blue-600 font-black hover:underline text-sm">
              Recuperar senha novamente
            </Link>
          </div>
        ) : done ? (
          <div className="text-center py-6">
            <div className="w-20 h-20 bg-emerald-100 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-100">
              <CheckCircle2 size={40} className="text-emerald-500" />
            </div>
            <h2 className="text-2xl font-black mb-2 tracking-tight">Senha alterada!</h2>
            <p className="text-slate-400 font-medium text-sm">Redirecionando para o seu painel...</p>
          </div>
        ) : (
          <>
            <h2 className="text-3xl font-black mb-2 tracking-tight">Nova senha</h2>
            <p className="text-slate-400 mb-8 font-medium">Defina uma nova senha para acessar sua vitrine</p>

            {error && (
              <div className="mb-6 p-4 rounded-2xl text-xs font-bold flex items-start gap-3 bg-red-50 text-red-600 border border-red-100">
                <AlertCircle className="shrink-0" size={18} />
                <p>{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Nova senha"
                  minLength={6}
                  className="w-full pr-24 px-6 py-4 rounded-2xl border border-slate-100 bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="absolute inset-y-0 right-4 flex items-center text-sm font-bold text-slate-500 hover:text-slate-900"
                >
                  {showPassword ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>

              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Confirmar nova senha"
                minLength={6}
                className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-lg hover:bg-blue-700 flex items-center justify-center gap-3 transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : (<><KeyRound size={20} /> Salvar nova senha</>)}
                {!loading && <ArrowRight size={20} />}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordPage;
