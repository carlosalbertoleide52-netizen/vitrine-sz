
import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { ShoppingBag, ArrowRight, AlertCircle, Loader2, MailCheck } from 'lucide-react';
import { Link } from '../App';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}${window.location.pathname}`,
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
      } else {
        // Mensagem neutra: não revelamos se o e-mail existe ou não.
        setSent(true);
      }
    } catch (err) {
      setError('Erro de conexão com o servidor.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 font-['Inter']">
      <Link to="/" className="text-2xl font-black text-blue-600 flex items-center gap-2 mb-10 group">
        <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform">
          <ShoppingBag size={24} />
        </div>
        <span className="text-slate-900 tracking-tighter">Vitrine <span className="text-blue-600">SZ</span></span>
      </Link>

      <div className="bg-white w-full max-w-md p-10 rounded-[2.5rem] shadow-2xl shadow-slate-200 border border-slate-100">
        {sent ? (
          <div className="text-center py-6">
            <div className="w-20 h-20 bg-emerald-100 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-100">
              <MailCheck size={40} className="text-emerald-500" />
            </div>
            <h2 className="text-2xl font-black mb-2 tracking-tight">Verifique seu e-mail</h2>
            <p className="text-slate-400 font-medium text-sm mb-8">
              Se este e-mail estiver cadastrado, enviamos um link para você redefinir sua senha.
            </p>
            <Link to="/login" className="text-blue-600 font-black hover:underline text-sm">
              Voltar para o login
            </Link>
          </div>
        ) : (
          <>
            <h2 className="text-3xl font-black mb-2 tracking-tight">Recupere sua senha</h2>
            <p className="text-slate-400 mb-8 font-medium">Enviaremos um link de recuperação para o seu e-mail</p>

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

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-lg hover:bg-blue-700 flex items-center justify-center gap-3 transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : 'Enviar link de recuperação'}
                {!loading && <ArrowRight size={20} />}
              </button>
            </form>

            <div className="mt-8 pt-8 border-t border-slate-50 text-center">
              <p className="text-slate-400 font-medium text-sm">
                Lembrou sua senha? <br/>
                <Link to="/login" className="text-blue-600 font-black hover:underline mt-2 inline-block">Voltar para o login</Link>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
