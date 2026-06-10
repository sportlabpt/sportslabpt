import React, { useState, useEffect } from 'react';
import { 
  Trophy, Plus, Trash2, Award, Settings, Users, Calendar, Table as TableIcon,
  RotateCcw, MapPin, CheckCircle2, AlertCircle
} from 'lucide-react';

export default function Competitions() {
  const [activeTab, setActiveTab] = useState('table'); // config, opponents, competitions, matches, table

  // State Management
  const [config, setConfig] = useState({
    pointsWin: 3,
    pointsDraw: 1,
    pointsLoss: 0,
    venues: []
  });
  const [clubs, setClubs] = useState([
    { id: '1', name: 'SportLuiz Futsal', emoji: '⚽' },
    { id: '2', name: 'Benfica Futsal', emoji: '🦅' },
    { id: '3', name: 'Sporting CP', emoji: '🦁' },
    { id: '4', name: 'Braga Futsal', emoji: '🛡️' }
  ]);
  const [competitions, setCompetitions] = useState([
    { id: '1', name: 'Liga Futsal Principal' }
  ]);
  const [activeCompId, setActiveCompId] = useState('1');
  const [matches, setMatches] = useState([
    { id: '1', compId: '1', homeId: '1', awayId: '2', homeGoals: 4, awayGoals: 2, venueId: '' },
    { id: '2', compId: '1', homeId: '3', awayId: '4', homeGoals: 2, awayGoals: 2, venueId: '' },
    { id: '3', compId: '1', homeId: '2', awayId: '3', homeGoals: 1, awayGoals: 3, venueId: '' }
  ]);

  // Load Data
  useEffect(() => {
    const savedConfig = localStorage.getItem('sl_league_config');
    const savedClubs = localStorage.getItem('sl_league_clubs');
    const savedMatches = localStorage.getItem('sl_league_matches');
    const savedComps = localStorage.getItem('sl_league_comps');
    const savedActiveComp = localStorage.getItem('sl_active_comp');

    if (savedConfig) setConfig(JSON.parse(savedConfig));
    if (savedClubs) setClubs(JSON.parse(savedClubs));
    if (savedMatches) setMatches(JSON.parse(savedMatches));
    if (savedComps) setCompetitions(JSON.parse(savedComps));
    if (savedActiveComp) setActiveCompId(savedActiveComp);
  }, []);

  // Save Data
  const saveState = (newConfig, newClubs, newComps, newMatches, newActiveComp) => {
    setConfig(newConfig);
    setClubs(newClubs);
    setCompetitions(newComps);
    setMatches(newMatches);
    setActiveCompId(newActiveComp);

    localStorage.setItem('sl_league_config', JSON.stringify(newConfig));
    localStorage.setItem('sl_league_clubs', JSON.stringify(newClubs));
    localStorage.setItem('sl_league_comps', JSON.stringify(newComps));
    localStorage.setItem('sl_league_matches', JSON.stringify(newMatches));
    localStorage.setItem('sl_active_comp', newActiveComp);
  };

  // ---- CONFIGURATIONS ----
  const [newVenue, setNewVenue] = useState('');
  const handleAddVenue = (e) => {
    e.preventDefault();
    if (!newVenue.trim()) return;
    const v = { id: Date.now().toString(), name: newVenue };
    saveState({ ...config, venues: [...config.venues, v] }, clubs, competitions, matches, activeCompId);
    setNewVenue('');
  };
  const handleRemoveVenue = (id) => {
    saveState({ ...config, venues: config.venues.filter(v => v.id !== id) }, clubs, competitions, matches, activeCompId);
  };

  // ---- CLUBS (Adversários) ----
  const [newClubName, setNewClubName] = useState('');
  const [newClubEmoji, setNewClubEmoji] = useState('🛡️');
  const handleAddClub = (e) => {
    e.preventDefault();
    if (!newClubName.trim()) return;
    const nClub = { id: Date.now().toString(), name: newClubName, emoji: newClubEmoji };
    saveState(config, [...clubs, nClub], competitions, matches, activeCompId);
    setNewClubName('');
  };
  const handleDeleteClub = (id) => {
    const newClubs = clubs.filter(c => c.id !== id);
    const newMatches = matches.filter(m => m.homeId !== id && m.awayId !== id);
    saveState(config, newClubs, competitions, newMatches, activeCompId);
  };

  // ---- COMPETITIONS ----
  const [newCompName, setNewCompName] = useState('');
  const handleAddComp = (e) => {
    e.preventDefault();
    if (!newCompName.trim()) return;
    const nComp = { id: Date.now().toString(), name: newCompName };
    const newComps = [...competitions, nComp];
    saveState(config, clubs, newComps, matches, activeCompId || nComp.id);
    setNewCompName('');
  };
  const handleDeleteComp = (id) => {
    const newComps = competitions.filter(c => c.id !== id);
    const newMatches = matches.filter(m => m.compId !== id);
    const nextActive = activeCompId === id ? (newComps[0]?.id || '') : activeCompId;
    saveState(config, clubs, newComps, newMatches, nextActive);
  };

  // ---- MATCHES ----
  const [homeClubId, setHomeClubId] = useState('');
  const [awayClubId, setAwayClubId] = useState('');
  const [homeGoalsInput, setHomeGoalsInput] = useState(0);
  const [awayGoalsInput, setAwayGoalsInput] = useState(0);
  const [selectedVenue, setSelectedVenue] = useState('');

  const handleAddMatch = (e) => {
    e.preventDefault();
    if (!homeClubId || !awayClubId || homeClubId === awayClubId) {
      alert("Selecione dois clubes diferentes para o confronto.");
      return;
    }
    if (!activeCompId) {
      alert("Crie uma competição primeiro.");
      return;
    }
    const nMatch = {
      id: Date.now().toString(),
      compId: activeCompId,
      homeId: homeClubId,
      awayId: awayClubId,
      homeGoals: parseInt(homeGoalsInput) || 0,
      awayGoals: parseInt(awayGoalsInput) || 0,
      venueId: selectedVenue
    };
    saveState(config, clubs, competitions, [nMatch, ...matches], activeCompId);
    setHomeGoalsInput(0);
    setAwayGoalsInput(0);
  };
  const handleDeleteMatch = (id) => {
    saveState(config, clubs, competitions, matches.filter(m => m.id !== id), activeCompId);
  };

  // ---- STANDINGS CALCULATION ----
  const calculateStandings = () => {
    const stats = {};
    clubs.forEach(c => {
      stats[c.id] = {
        id: c.id, name: c.name, emoji: c.emoji,
        played: 0, wins: 0, draws: 0, losses: 0,
        goalsFor: 0, goalsAgainst: 0, goalDiff: 0, points: 0
      };
    });

    const activeMatches = matches.filter(m => m.compId === activeCompId);

    activeMatches.forEach(m => {
      const h = stats[m.homeId];
      const a = stats[m.awayId];
      if (!h || !a) return;

      h.played += 1; a.played += 1;
      h.goalsFor += m.homeGoals; h.goalsAgainst += m.awayGoals;
      a.goalsFor += m.awayGoals; a.goalsAgainst += m.homeGoals;

      if (m.homeGoals > m.awayGoals) {
        h.wins += 1; h.points += Number(config.pointsWin);
        a.losses += 1; a.points += Number(config.pointsLoss);
      } else if (m.homeGoals < m.awayGoals) {
        a.wins += 1; a.points += Number(config.pointsWin);
        h.losses += 1; h.points += Number(config.pointsLoss);
      } else {
        h.draws += 1; h.points += Number(config.pointsDraw);
        a.draws += 1; a.points += Number(config.pointsDraw);
      }

      h.goalDiff = h.goalsFor - h.goalsAgainst;
      a.goalDiff = a.goalsFor - a.goalsAgainst;
    });

    return Object.values(stats).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
      return b.goalsFor - a.goalsFor;
    });
  };

  const standings = calculateStandings();
  const activeMatches = matches.filter(m => m.compId === activeCompId);

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-6xl mx-auto">
      
      {/* Header & Tabs */}
      <div className="border-b border-neutral-900 pb-5">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-xl font-black font-mono tracking-tighter text-white uppercase flex items-center gap-2">
              <Trophy className="text-emerald-400" /> Gestor de Competições
            </h1>
            <p className="text-neutral-500 text-xs mt-1">Crie ligas, configure critérios e acompanhe classificações automaticamente.</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'config', label: 'Configuração', icon: Settings },
            { id: 'opponents', label: 'Adversários', icon: Users },
            { id: 'competitions', label: 'Competições', icon: Award },
            { id: 'matches', label: 'Jogos', icon: Calendar },
            { id: 'table', label: 'Tabela', icon: TableIcon }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg font-mono text-xs font-bold transition-all border-b-2 ${
                  isActive 
                  ? 'bg-neutral-900 text-emerald-400 border-emerald-500' 
                  : 'bg-transparent text-neutral-500 border-transparent hover:text-white hover:bg-neutral-900/50'
                }`}
              >
                <Icon size={14} /> {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="min-h-[500px]">
        {/* --- TAB: CONFIGURAÇÃO --- */}
        {activeTab === 'config' && (
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-5">
              <h2 className="text-sm font-bold font-mono text-white flex items-center gap-2">
                <Settings size={16} className="text-emerald-400" /> Pontos por Resultado
              </h2>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] font-mono text-neutral-500 uppercase block mb-1">Vitória</label>
                  <input type="number" value={config.pointsWin} 
                    onChange={(e) => saveState({ ...config, pointsWin: e.target.value }, clubs, competitions, matches, activeCompId)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white font-bold" />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-neutral-500 uppercase block mb-1">Empate</label>
                  <input type="number" value={config.pointsDraw} 
                    onChange={(e) => saveState({ ...config, pointsDraw: e.target.value }, clubs, competitions, matches, activeCompId)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white font-bold" />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-neutral-500 uppercase block mb-1">Derrota</label>
                  <input type="number" value={config.pointsLoss} 
                    onChange={(e) => saveState({ ...config, pointsLoss: e.target.value }, clubs, competitions, matches, activeCompId)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white font-bold" />
                </div>
              </div>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-5">
              <h2 className="text-sm font-bold font-mono text-white flex items-center gap-2">
                <MapPin size={16} className="text-emerald-400" /> Pavilhões / Locais
              </h2>
              <form onSubmit={handleAddVenue} className="flex gap-2">
                <input type="text" placeholder="Nome do local..." value={newVenue} onChange={(e) => setNewVenue(e.target.value)}
                  className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white" />
                <button type="submit" className="bg-emerald-500 hover:bg-emerald-400 text-black px-4 rounded-lg font-bold">
                  <Plus size={16} />
                </button>
              </form>
              <div className="space-y-2">
                {config.venues.length === 0 ? <p className="text-xs text-neutral-500">Nenhum pavilhão cadastrado.</p> : null}
                {config.venues.map(v => (
                  <div key={v.id} className="flex justify-between items-center bg-neutral-950 p-3 rounded-lg border border-neutral-850">
                    <span className="text-xs text-white">{v.name}</span>
                    <button onClick={() => handleRemoveVenue(v.id)} className="text-neutral-600 hover:text-red-400"><Trash2 size={14}/></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* --- TAB: ADVERSÁRIOS --- */}
        {activeTab === 'opponents' && (
          <div className="grid md:grid-cols-3 gap-8">
            <div className="col-span-1">
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
                <h2 className="text-sm font-bold font-mono text-white mb-4 flex items-center gap-2">
                  <Plus size={16} className="text-emerald-400" /> Novo Clube
                </h2>
                <form onSubmit={handleAddClub} className="space-y-3">
                  <div>
                    <label className="text-[10px] text-neutral-500 uppercase block mb-1">Nome</label>
                    <input type="text" required value={newClubName} onChange={(e) => setNewClubName(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white" />
                  </div>
                  <div>
                    <label className="text-[10px] text-neutral-500 uppercase block mb-1">Emoji / Escudo</label>
                    <input type="text" value={newClubEmoji} onChange={(e) => setNewClubEmoji(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white" />
                  </div>
                  <button type="submit" className="w-full bg-emerald-500 text-black font-bold py-2 rounded-lg text-xs mt-2">
                    CADASTRAR CLUBE
                  </button>
                </form>
              </div>
            </div>
            <div className="col-span-2">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {clubs.map(c => (
                  <div key={c.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{c.emoji}</span>
                      <span className="text-sm font-bold text-white">{c.name}</span>
                    </div>
                    <button onClick={() => handleDeleteClub(c.id)} className="text-neutral-600 hover:text-red-400"><Trash2 size={16}/></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* --- TAB: COMPETIÇÕES --- */}
        {activeTab === 'competitions' && (
          <div className="grid md:grid-cols-3 gap-8">
            <div className="col-span-1">
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
                <h2 className="text-sm font-bold font-mono text-white mb-4">Nova Competição</h2>
                <form onSubmit={handleAddComp} className="space-y-3">
                  <input type="text" required placeholder="Ex: Liga de Inverno 2026" value={newCompName} onChange={(e) => setNewCompName(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white" />
                  <button type="submit" className="w-full bg-emerald-500 text-black font-bold py-2 rounded-lg text-xs">CRIAR COMPETIÇÃO</button>
                </form>
              </div>
            </div>
            <div className="col-span-2 space-y-3">
              {competitions.length === 0 && <p className="text-neutral-500 text-sm">Nenhuma competição criada.</p>}
              {competitions.map(comp => (
                <div key={comp.id} className={`flex justify-between items-center p-4 rounded-xl border ${activeCompId === comp.id ? 'bg-emerald-950/20 border-emerald-500/50' : 'bg-neutral-900 border-neutral-800'}`}>
                  <div className="flex items-center gap-3">
                    <Award className={activeCompId === comp.id ? "text-emerald-400" : "text-neutral-500"} size={20} />
                    <span className="font-bold text-white">{comp.name}</span>
                    {activeCompId === comp.id && <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded font-mono uppercase">Ativa</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    {activeCompId !== comp.id && (
                      <button onClick={() => saveState(config, clubs, competitions, matches, comp.id)} className="text-xs bg-neutral-800 hover:bg-neutral-700 text-white px-3 py-1.5 rounded-lg">Selecionar</button>
                    )}
                    <button onClick={() => handleDeleteComp(comp.id)} className="text-neutral-500 hover:text-red-400 p-2"><Trash2 size={16}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- TAB: JOGOS --- */}
        {activeTab === 'matches' && (
          <div className="grid md:grid-cols-3 gap-8">
            <div className="col-span-1">
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
                <h2 className="text-sm font-bold font-mono text-white mb-4">Registrar Placar</h2>
                <form onSubmit={handleAddMatch} className="space-y-4">
                  <div>
                    <label className="text-[10px] text-neutral-500 uppercase block mb-1">Competição Alvo</label>
                    <select value={activeCompId} onChange={(e) => saveState(config, clubs, competitions, matches, e.target.value)}
                      className="w-full bg-neutral-950 border border-emerald-500/30 text-emerald-100 rounded-lg px-3 py-2 text-xs">
                      {competitions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-end">
                    <div>
                      <label className="text-[10px] text-neutral-500 block mb-1">Mandante</label>
                      <select required value={homeClubId} onChange={(e) => setHomeClubId(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2 py-2 text-xs text-white">
                        <option value="">Clube...</option>
                        {clubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                      <input type="number" min="0" value={homeGoalsInput} onChange={(e) => setHomeGoalsInput(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2 py-2 text-xs text-white text-center mt-2" />
                    </div>
                    <div className="pb-4 font-bold text-neutral-600">X</div>
                    <div>
                      <label className="text-[10px] text-neutral-500 block mb-1">Visitante</label>
                      <select required value={awayClubId} onChange={(e) => setAwayClubId(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2 py-2 text-xs text-white">
                        <option value="">Clube...</option>
                        {clubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                      <input type="number" min="0" value={awayGoalsInput} onChange={(e) => setAwayGoalsInput(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2 py-2 text-xs text-white text-center mt-2" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-neutral-500 uppercase block mb-1">Pavilhão (Opcional)</label>
                    <select value={selectedVenue} onChange={(e) => setSelectedVenue(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white">
                      <option value="">Selecionar Pavilhão...</option>
                      {config.venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                    </select>
                  </div>
                  <button type="submit" className="w-full bg-emerald-500 text-black font-bold py-2 rounded-lg text-xs">SALVAR JOGO</button>
                </form>
              </div>
            </div>
            <div className="col-span-2 space-y-3">
              <h2 className="text-sm font-bold font-mono text-white">Últimos Jogos ({competitions.find(c => c.id === activeCompId)?.name || 'Nenhuma Competição'})</h2>
              {activeMatches.length === 0 && <p className="text-neutral-500 text-sm">Nenhum jogo nesta competição.</p>}
              {activeMatches.map(m => {
                const home = clubs.find(c => c.id === m.homeId);
                const away = clubs.find(c => c.id === m.awayId);
                const venue = config.venues.find(v => v.id === m.venueId);
                return (
                  <div key={m.id} className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl flex items-center justify-between">
                    <div className="flex flex-1 items-center justify-between">
                      <span className="font-bold text-white w-1/3 text-right">{home?.name} {home?.emoji}</span>
                      <span className="bg-neutral-950 border border-neutral-800 px-4 py-1 rounded-lg font-black text-emerald-400 font-mono mx-4">
                        {m.homeGoals} - {m.awayGoals}
                      </span>
                      <span className="font-bold text-white w-1/3">{away?.emoji} {away?.name}</span>
                    </div>
                    {venue && <div className="text-[10px] text-neutral-500 ml-4 hidden md:flex items-center gap-1"><MapPin size={10}/> {venue.name}</div>}
                    <button onClick={() => handleDeleteMatch(m.id)} className="text-neutral-600 hover:text-red-400 ml-4"><Trash2 size={16}/></button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* --- TAB: TABELA --- */}
        {activeTab === 'table' && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-sm font-bold font-mono text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                <TableIcon size={16} /> Classificação Oficial
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-500 uppercase">Torneio:</span>
                <select value={activeCompId} onChange={(e) => saveState(config, clubs, competitions, matches, e.target.value)}
                  className="bg-neutral-950 border border-neutral-800 text-white font-bold rounded-lg px-3 py-1.5 text-xs">
                  {competitions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left font-mono text-sm select-none">
                <thead>
                  <tr className="border-b-2 border-neutral-800 text-xs text-neutral-500 uppercase font-bold">
                    <th className="py-3 w-10 text-center">#</th>
                    <th className="py-3">Clube</th>
                    <th className="py-3 w-12 text-center text-white">PTS</th>
                    <th className="py-3 w-10 text-center">J</th>
                    <th className="py-3 w-10 text-center">V</th>
                    <th className="py-3 w-10 text-center">E</th>
                    <th className="py-3 w-10 text-center">D</th>
                    <th className="py-3 w-12 text-center">GM</th>
                    <th className="py-3 w-12 text-center">GS</th>
                    <th className="py-3 w-12 text-center">SG</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/50 text-neutral-300">
                  {standings.map((st, index) => (
                    <tr 
                      key={st.id} 
                      className={`hover:bg-neutral-950/60 transition-colors ${
                        index === 0 ? 'bg-emerald-950/10 text-emerald-400' : ''
                      }`}
                    >
                      <td className="py-4 text-center font-bold text-neutral-500">{index + 1}</td>
                      <td className="py-4 font-bold text-white flex items-center gap-3">
                        <span className="text-xl">{st.emoji}</span> <span>{st.name}</span>
                      </td>
                      <td className="py-4 text-center text-white font-extrabold text-base bg-neutral-950/30">{st.points}</td>
                      <td className="py-4 text-center">{st.played}</td>
                      <td className="py-4 text-center">{st.wins}</td>
                      <td className="py-4 text-center">{st.draws}</td>
                      <td className="py-4 text-center">{st.losses}</td>
                      <td className="py-4 text-center">{st.goalsFor}</td>
                      <td className="py-4 text-center">{st.goalsAgainst}</td>
                      <td className={`py-4 text-center font-bold ${
                        st.goalDiff > 0 ? 'text-emerald-500' :
                        st.goalDiff < 0 ? 'text-rose-500' : 'text-neutral-500'
                      }`}>{st.goalDiff > 0 ? `+${st.goalDiff}` : st.goalDiff}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {standings.length === 0 && (
              <div className="text-center py-12 text-neutral-500 text-sm">
                Nenhum clube cadastrado nesta liga. Vá em "Adversários" para adicionar.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
