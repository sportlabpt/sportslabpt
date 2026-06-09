import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, UserPlus, AlertCircle, Info } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    setError(null);
    setLoading(true);

    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ocorreu um erro ao processar sua requisição.');
      }

      // Store credentials
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fillMockCredentials = () => {
    setEmail('admin@sportluiz.com');
    setPassword('admin123');
  };

  return (
    <div className="min-h-screen bg-black text-neutral-100 flex flex-col justify-center items-center p-6 font-sans">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-8 shadow-xl space-y-6">
        
        {/* Branding header */}
        <div className="text-center">
          <h1 className="text-2xl font-black font-mono tracking-tighter text-white">
            SPORTLUIZ // LABS
          </h1>
          <p className="text-neutral-500 text-xs mt-1">
            Plataforma de Alta Performance Esportiva
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-neutral-950 p-1 rounded-lg border border-neutral-800/80">
          <button
            onClick={() => { setIsRegister(false); setError(null); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-mono font-bold rounded transition-all ${
              !isRegister ? 'bg-neutral-900 text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <LogIn size={13} /> Entrar
          </button>
          <button
            onClick={() => { setIsRegister(true); setError(null); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-mono font-bold rounded transition-all ${
              isRegister ? 'bg-neutral-900 text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <UserPlus size={13} /> Cadastrar
          </button>
        </div>

        {/* Error notification */}
        {error && (
          <div className="bg-red-950/40 border border-red-900 text-red-400 text-xs font-mono p-4 rounded-lg flex items-start gap-2 animate-pulse-slow">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Auth form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest block font-bold">
              Endereço de E-mail
            </label>
            <input
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 rounded-lg px-3.5 py-2.5 text-xs font-mono text-white placeholder-neutral-700 focus:outline-none transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest block font-bold">
              Senha de Acesso
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 rounded-lg px-3.5 py-2.5 text-xs font-mono text-white placeholder-neutral-700 focus:outline-none transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-neutral-800 text-black disabled:text-neutral-500 font-bold font-mono text-xs py-3 rounded-lg uppercase tracking-wider transition-all mt-6"
          >
            {loading ? 'Aguarde...' : isRegister ? 'Confirmar Cadastro' : 'Iniciar Sessão'}
          </button>
        </form>

        {/* Helper sandbox auto-fill */}
        <div className="bg-neutral-950 border border-neutral-900/60 p-4 rounded-lg text-neutral-500 text-[11px] font-mono space-y-2">
          <div className="flex items-center gap-1.5 text-neutral-400">
            <Info size={12} />
            <span className="font-bold">Modo de Teste Local</span>
          </div>
          <p>Para testar o login sem criar conta, clique no atalho abaixo para auto-preencher:</p>
          <button 
            type="button"
            onClick={fillMockCredentials}
            className="text-emerald-400 hover:underline cursor-pointer font-bold block"
          >
            Preencher admin@sportluiz.com / admin123
          </button>
        </div>

      </div>
    </div>
  );
}
