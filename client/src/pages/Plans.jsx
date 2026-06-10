import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ShieldCheck, Zap, Layers, Sparkles } from 'lucide-react';

export default function Plans() {
  const navigate = useNavigate();
  const [loadingTier, setLoadingTier] = useState(null);
  const [error, setError] = useState(null);
  
  const token = localStorage.getItem('token');
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;
  const currentTier = user?.subscriptionTier || 'FREE';

  // Stripe prices - loaded from config or fallback keys
  const priceIds = {
    PRO: 'price_1PProMockPriceID2026',
    ENTERPRISE: 'price_1PEntMockPriceID2026'
  };

  const handleSubscribe = async (tierName) => {
    setError(null);
    setLoadingTier(tierName);

    if (!token) {
      setError('Por favor, faça login ou registre-se para contratar um plano.');
      setLoadingTier(null);
      return;
    }

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ priceId: priceIds[tierName] })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao processar checkout do Stripe.');
      }

      if (data.url) {
        // Redirect to Stripe checkout page
        window.location.href = data.url;
      } else {
        throw new Error('Sessão de checkout não retornou um link de pagamento.');
      }
    } catch (err) {
      console.error(err);
      setError(`${err.message} (Sandbox Local: Clique em "Simular Upgrade" abaixo para mudar seu nível instantaneamente).`);
      setLoadingTier(null);
    }
  };

  const handleSimulateUpgrade = (tierName) => {
    if (!user) return;
    const updatedUser = { ...user, subscriptionTier: tierName };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    // Also trigger mock updates on simulated storage check
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-black text-neutral-100 p-8 font-sans selection:bg-emerald-400 selection:text-black">
      <header className="flex justify-between items-center border-b border-neutral-900 pb-6 mb-12">
        <div className="cursor-pointer" onClick={() => navigate('/dashboard')}>
          <h1 className="text-xl font-black font-mono tracking-tighter text-white">SPORTLUIZ // PLANS</h1>
          <p className="text-neutral-500 text-xs mt-1">Selecione o plano ideal para suas análises táticas</p>
        </div>
        <button 
          onClick={() => navigate('/dashboard')}
          className="text-xs font-mono text-neutral-400 hover:text-emerald-400 border border-neutral-800 hover:border-emerald-500/30 bg-neutral-900/60 px-4 py-2 rounded-lg transition-all"
        >
          Voltar ao Dashboard
        </button>
      </header>

      {error && (
        <div className="max-w-4xl mx-auto bg-red-950/40 border border-red-900 text-red-400 text-xs font-mono p-4 rounded-lg mb-8">
          ⚠️ {error}
        </div>
      )}

      <div className="max-w-5xl mx-auto text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-4">
          Acesso Completo ao Ecossistema Performance Lab
        </h2>
        <p className="text-neutral-400 text-sm max-w-xl mx-auto">
          Colete, analise e tome decisões táticas com latência zero. Aumente seu limite de telemetria instantaneamente.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto items-stretch">
        
        {/* FREE PLAN */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 flex flex-col justify-between shadow-lg relative overflow-hidden">
          <div className="space-y-6">
            <div>
              <span className="text-[10px] font-mono font-bold bg-neutral-800 text-neutral-400 px-3 py-1 rounded-full uppercase tracking-wider">
                Básico
              </span>
              <h3 className="text-xl font-bold text-white mt-4">Plano FREE</h3>
              <p className="text-xs text-neutral-500 mt-2">Para analistas independentes iniciarem a coleta tática.</p>
            </div>
            
            <div className="flex items-baseline">
              <span className="text-4xl font-mono font-black text-white">€ 0</span>
              <span className="text-xs text-neutral-500 ml-2">/ sempre</span>
            </div>

            <hr className="border-neutral-800" />

            <ul className="space-y-3.5 text-xs text-neutral-400">
              <li className="flex items-center gap-2">
                <Check size={14} className="text-emerald-400 flex-shrink-0" />
                <span>15 eventos de telemetria por jogo</span>
              </li>
              <li className="flex items-center gap-2">
                <Check size={14} className="text-emerald-400 flex-shrink-0" />
                <span>Métricas Básicas Consolidadas</span>
              </li>
              <li className="flex items-center gap-2 text-neutral-600 line-through">
                <Check size={14} className="text-neutral-600 flex-shrink-0" />
                <span>Eventos Ilimitados de Telemetria</span>
              </li>
              <li className="flex items-center gap-2 text-neutral-600 line-through">
                <Check size={14} className="text-neutral-600 flex-shrink-0" />
                <span>Workspace Multi-Clubes</span>
              </li>
            </ul>
          </div>

          <div className="mt-8 space-y-2">
            <button
              disabled
              className="w-full py-2.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider bg-neutral-950 border border-neutral-800 text-neutral-500 cursor-not-allowed"
            >
              {currentTier === 'FREE' ? 'Plano Ativo' : 'Plano Básico'}
            </button>
            {currentTier !== 'FREE' && (
              <button 
                onClick={() => handleSimulateUpgrade('FREE')}
                className="w-full py-1 text-[10px] font-mono text-neutral-500 hover:text-neutral-300 transition-colors underline"
              >
                Simular Downgrade para Testes
              </button>
            )}
          </div>
        </div>

        {/* PRO PLAN */}
        <div className="bg-neutral-900 border-2 border-emerald-500/40 rounded-2xl p-6 flex flex-col justify-between shadow-xl relative overflow-hidden transform scale-105">
          <div className="absolute top-0 right-0 bg-emerald-500 text-black text-[9px] font-mono font-bold px-3 py-1 uppercase tracking-widest rounded-bl-lg">
            Popular
          </div>
          
          <div className="space-y-6">
            <div>
              <span className="text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-900 px-3 py-1 rounded-full uppercase tracking-wider inline-flex items-center gap-1">
                <Zap size={10} /> Alta Performance
              </span>
              <h3 className="text-xl font-bold text-white mt-4">Plano PRO</h3>
              <p className="text-xs text-neutral-400 mt-2">Para analistas de clubes profissionais que precisam de cobertura total.</p>
            </div>
            
            <div className="flex items-baseline">
              <span className="text-4xl font-mono font-black text-white">€ 14</span>
              <span className="text-xs text-neutral-500 ml-2">/ mês</span>
            </div>

            <hr className="border-neutral-800" />

            <ul className="space-y-3.5 text-xs text-neutral-300">
              <li className="flex items-center gap-2">
                <Check size={14} className="text-emerald-400 flex-shrink-0" />
                <span className="font-bold text-white">Telemetria Tática ILIMITADA</span>
              </li>
              <li className="flex items-center gap-2">
                <Check size={14} className="text-emerald-400 flex-shrink-0" />
                <span>Filtro de mapas de calor no Field2D</span>
              </li>
              <li className="flex items-center gap-2">
                <Check size={14} className="text-emerald-400 flex-shrink-0" />
                <span>Exportação de relatórios analíticos</span>
              </li>
              <li className="flex items-center gap-2 text-neutral-600 line-through">
                <Check size={14} className="text-neutral-600 flex-shrink-0" />
                <span>Multi-Club Tenant Workspace</span>
              </li>
            </ul>
          </div>

          <div className="mt-8 space-y-2">
            <button
              onClick={() => handleSubscribe('PRO')}
              disabled={loadingTier !== null || currentTier === 'PRO'}
              className={`w-full py-2.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all ${
                currentTier === 'PRO'
                  ? 'bg-emerald-400 text-black font-extrabold cursor-default'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg shadow-emerald-500/20'
              }`}
            >
              {loadingTier === 'PRO' ? 'Processando...' : currentTier === 'PRO' ? 'Plano Ativo' : 'Assinar PRO'}
            </button>
            <button 
              onClick={() => handleSimulateUpgrade('PRO')}
              className="w-full py-1 text-[10px] font-mono text-neutral-500 hover:text-neutral-300 transition-colors underline block text-center"
            >
              Simular Upgrade Local (Bypass Sandbox)
            </button>
          </div>
        </div>

        {/* ENTERPRISE PLAN */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 flex flex-col justify-between shadow-lg relative overflow-hidden">
          <div className="space-y-6">
            <div>
              <span className="text-[10px] font-mono font-bold bg-purple-950 text-purple-400 border border-purple-900 px-3 py-1 rounded-full uppercase tracking-wider inline-flex items-center gap-1">
                <Sparkles size={10} /> Escala
              </span>
              <h3 className="text-xl font-bold text-white mt-4">ENTERPRISE</h3>
              <p className="text-xs text-neutral-500 mt-2">Para confederações e grandes clubes esportivos multi-time.</p>
            </div>
            
            <div className="flex items-baseline">
              <span className="text-4xl font-mono font-black text-white">€ 25</span>
              <span className="text-xs text-neutral-500 ml-2">/ mês</span>
            </div>

            <hr className="border-neutral-800" />

            <ul className="space-y-3.5 text-xs text-neutral-400">
              <li className="flex items-center gap-2">
                <Check size={14} className="text-purple-400 flex-shrink-0" />
                <span className="font-bold text-white">Multi-Club Tenant (Vários clubes)</span>
              </li>
              <li className="flex items-center gap-2">
                <Check size={14} className="text-purple-400 flex-shrink-0" />
                <span>Telemetria ilimitada + Multi-analista</span>
              </li>
              <li className="flex items-center gap-2">
                <Check size={14} className="text-purple-400 flex-shrink-0" />
                <span>API de telemetria bruta disponível</span>
              </li>
              <li className="flex items-center gap-2">
                <Check size={14} className="text-purple-400 flex-shrink-0" />
                <span>Suporte 24/7 Dedicado</span>
              </li>
            </ul>
          </div>

          <div className="mt-8 space-y-2">
            <button
              onClick={() => handleSubscribe('ENTERPRISE')}
              disabled={loadingTier !== null || currentTier === 'ENTERPRISE'}
              className={`w-full py-2.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all ${
                currentTier === 'ENTERPRISE'
                  ? 'bg-purple-500 text-black font-extrabold cursor-default'
                  : 'bg-purple-600 hover:bg-purple-500 text-white hover:text-black shadow-lg shadow-purple-500/20'
              }`}
            >
              {loadingTier === 'ENTERPRISE' ? 'Processando...' : currentTier === 'ENTERPRISE' ? 'Plano Ativo' : 'Assinar Enterprise'}
            </button>
            <button 
              onClick={() => handleSimulateUpgrade('ENTERPRISE')}
              className="w-full py-1 text-[10px] font-mono text-neutral-500 hover:text-neutral-300 transition-colors underline block text-center"
            >
              Simular Upgrade Local (Bypass Sandbox)
            </button>
          </div>
        </div>

      </div>

      <div className="max-w-4xl mx-auto mt-16 p-6 bg-neutral-900/40 border border-neutral-800/80 rounded-xl text-center">
        <div className="flex justify-center mb-3 text-emerald-400">
          <ShieldCheck size={28} />
        </div>
        <h4 className="text-sm font-bold text-white font-mono uppercase tracking-wider mb-2">Transação Segura Stripe</h4>
        <p className="text-neutral-500 text-xs max-w-lg mx-auto">
          Todas as transações são criptografadas de ponta a ponta pelo Stripe. Nenhum dado de cartão de crédito é guardado em nossos servidores locais.
        </p>
      </div>
    </div>
  );
}
