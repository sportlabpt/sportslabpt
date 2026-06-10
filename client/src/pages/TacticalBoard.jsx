import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, Plus, Trash2, Save, Download, 
  Settings, BookOpen, PenTool, Image as ImageIcon,
  Search, Filter, MousePointer, User, Users, Clock,
  Triangle, Square, ArrowUpRight, Minus, MoreHorizontal,
  ArrowLeft, ArrowRight, Type
} from 'lucide-react';
import html2pdf from 'html2pdf.js';

export default function TacticalBoard() {
  const [activeTab, setActiveTab] = useState('exercises'); // config, exercises, notebook

  // Data States
  const [categories, setCategories] = useState([
    { id: '1', name: 'Ataque', color: 'bg-red-500' },
    { id: '2', name: 'Defesa', color: 'bg-blue-500' },
    { id: '3', name: 'Transição', color: 'bg-amber-500' },
    { id: '4', name: 'Bolas Paradas', color: 'bg-purple-500' },
    { id: '5', name: 'Aquecimento', color: 'bg-emerald-500' },
  ]);
  const [drills, setDrills] = useState([]);

  // Load from local storage
  useEffect(() => {
    const savedCategories = localStorage.getItem('sl_tactical_cats');
    const savedDrills = localStorage.getItem('sportluiz_drills_db');
    
    if (savedCategories) setCategories(JSON.parse(savedCategories));
    if (savedDrills) setDrills(JSON.parse(savedDrills));
  }, []);

  const saveState = (newCategories, newDrills) => {
    setCategories(newCategories);
    setDrills(newDrills);
    localStorage.setItem('sl_tactical_cats', JSON.stringify(newCategories));
    localStorage.setItem('sportluiz_drills_db', JSON.stringify(newDrills));
  };

  // ---- CONFIGURATIONS TAB ----
  const [newCatName, setNewCatName] = useState('');
  const handleAddCategory = (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    const colors = ['bg-red-500', 'bg-blue-500', 'bg-amber-500', 'bg-purple-500', 'bg-emerald-500', 'bg-pink-500'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const nCat = { id: Date.now().toString(), name: newCatName, color: randomColor };
    saveState([...categories, nCat], drills);
    setNewCatName('');
  };
  const handleDeleteCategory = (id) => {
    saveState(categories.filter(c => c.id !== id), drills);
  };
  const [catSearch, setCatSearch] = useState('');

  // ---- EXERCISES TAB (CANVAS STATE) ----
  const [activeDrillId, setActiveDrillId] = useState(null);
  const [drillTitle, setDrillTitle] = useState('Jogada Ensaiada 1');
  const [drillCategory, setDrillCategory] = useState('');
  const [drillLevel, setDrillLevel] = useState('Sem nível');
  const [drillDescription, setDrillDescription] = useState('');
  const [courtType, setCourtType] = useState('futsal'); // restored
  
  const initialFrame = {
    players: [
      { id: 'h1', team: 'home', number: '1', name: 'GR', x: 8, y: 50, color: 'bg-emerald-500' },
      { id: 'h2', team: 'home', number: '5', name: 'Fixo', x: 25, y: 50, color: 'bg-emerald-500' },
      { id: 'h3', team: 'home', number: '10', name: 'Ala D', x: 40, y: 20, color: 'bg-emerald-500' },
      { id: 'h4', team: 'home', number: '7', name: 'Ala E', x: 40, y: 80, color: 'bg-emerald-500' },
      { id: 'h5', team: 'home', number: '9', name: 'Pivô', x: 70, y: 50, color: 'bg-emerald-500' },
      { id: 'a1', team: 'away', number: '1', name: 'GR', x: 92, y: 50, color: 'bg-blue-500' },
      { id: 'a2', team: 'away', number: '3', name: 'D1', x: 65, y: 35, color: 'bg-blue-500' },
      { id: 'a3', team: 'away', number: '4', name: 'D2', x: 65, y: 65, color: 'bg-blue-500' }
    ],
    balls: [{ id: 'b1', x: 28, y: 50 }],
    cones: []
  };
  const [frames, setFrames] = useState([JSON.parse(JSON.stringify(initialFrame))]);
  const [activeFrameIndex, setActiveFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const playbackInterval = useRef(null);

  // Drawing overlay canvas
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawColor, setDrawColor] = useState('#34d399'); // restored original color
  const [toolMode, setToolMode] = useState('drag'); // drag, draw

  // Animation Playback
  useEffect(() => {
    if (isPlaying) {
      playbackInterval.current = setInterval(() => {
        setActiveFrameIndex((prev) => (prev >= frames.length - 1 ? 0 : prev + 1));
      }, 800); // restored original 800ms
    } else {
      clearInterval(playbackInterval.current);
    }
    return () => clearInterval(playbackInterval.current);
  }, [isPlaying, frames.length]);

  const updateActiveFrame = (updater) => {
    const updated = [...frames];
    updated[activeFrameIndex] = updater(frames[activeFrameIndex]);
    setFrames(updated);
  };

  // Drag-and-drop
  const [draggedElement, setDraggedElement] = useState(null);
  const handlePointerDown = (type, id, e) => {
    if (toolMode !== 'drag') return;
    const rect = e.currentTarget.parentElement.getBoundingClientRect();
    setDraggedElement({ type, id, rect });
  };
  const handlePointerMove = (e) => {
    if (!draggedElement) return;
    const { type, id, rect } = draggedElement;
    const x = Math.max(2, Math.min(98, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(2, Math.min(98, ((e.clientY - rect.top) / rect.height) * 100));

    updateActiveFrame((frame) => {
      if (type === 'player') return { ...frame, players: frame.players.map(p => p.id === id ? { ...p, x, y } : p) };
      if (type === 'ball') return { ...frame, balls: frame.balls.map(b => b.id === id ? { ...b, x, y } : b) };
      if (type === 'cone') return { ...frame, cones: frame.cones.map(c => c.id === id ? { ...c, x, y } : c) };
      return frame;
    });
  };
  const handlePointerUp = () => setDraggedElement(null);

  // Drawing logic
  const startDrawing = (e) => {
    if (toolMode !== 'draw') return;
    const ctx = canvasRef.current.getContext('2d');
    const rect = canvasRef.current.getBoundingClientRect();
    ctx.beginPath();
    ctx.strokeStyle = drawColor;
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
  };
  const draw = (e) => {
    if (!isDrawing || toolMode !== 'draw') return;
    const ctx = canvasRef.current.getContext('2d');
    const rect = canvasRef.current.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };
  const stopDrawing = () => setIsDrawing(false);
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if(canvas) canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
  };

  // Ensure canvas dimensions match container
  useEffect(() => {
    if (activeTab === 'exercises' && canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
      const ctx = canvas.getContext('2d');
      ctx.lineCap = 'round';
      ctx.lineWidth = 3;
    }
  }, [activeTab, toolMode, courtType]);

  // Frame management
  const addFrame = () => {
    const newFrames = [...frames];
    newFrames.splice(activeFrameIndex + 1, 0, JSON.parse(JSON.stringify(frames[activeFrameIndex])));
    setFrames(newFrames);
    setActiveFrameIndex(activeFrameIndex + 1);
  };
  const removeFrame = (index) => {
    if (frames.length <= 1) return;
    const newFrames = frames.filter((_, idx) => idx !== index);
    setFrames(newFrames);
    setActiveFrameIndex(Math.max(0, activeFrameIndex - 1));
  };
  const handleAddCone = () => {
    updateActiveFrame((frame) => ({ ...frame, cones: [...frame.cones, { id: `cone-${Date.now()}`, x: 50, y: 15 }] }));
  };

  // Drill save/load/delete
  const handleNewDrill = () => {
    setActiveDrillId(null);
    setDrillTitle('Novo Exercício');
    setDrillCategory('');
    setDrillLevel('Sem nível');
    setDrillDescription('');
    setFrames([JSON.parse(JSON.stringify(initialFrame))]);
    setActiveFrameIndex(0);
    clearCanvas();
  };

  const handleSaveDrill = () => {
    if (!drillTitle.trim()) return alert("Dê um nome ao exercício.");
    
    const drillData = {
      id: activeDrillId || Date.now().toString(),
      title: drillTitle,
      category: drillCategory,
      level: drillLevel,
      description: drillDescription,
      courtType,
      frames,
      updatedAt: new Date().toISOString()
    };

    let newDrills;
    if (activeDrillId) {
      newDrills = drills.map(d => d.id === activeDrillId ? drillData : d);
    } else {
      newDrills = [drillData, ...drills];
      setActiveDrillId(drillData.id);
    }
    saveState(categories, newDrills);
    alert('Exercício salvo com sucesso!');
  };

  const handleLoadDrill = (drill) => {
    setActiveDrillId(drill.id);
    setDrillTitle(drill.title);
    setDrillCategory(drill.category || '');
    setDrillLevel(drill.level || 'Sem nível');
    setDrillDescription(drill.description || '');
    setCourtType(drill.courtType || 'futsal');
    setFrames(drill.frames);
    setActiveFrameIndex(0);
    setActiveTab('exercises');
    setTimeout(() => clearCanvas(), 50); // clear after render
  };

  const handleDeleteDrill = (id) => {
    if(confirm("Tem certeza que deseja eliminar este exercício?")) {
      const newDrills = drills.filter(d => d.id !== id);
      saveState(categories, newDrills);
      if(activeDrillId === id) handleNewDrill();
    }
  };

  const currentFrame = frames[activeFrameIndex] || frames[0];

  // ---- NOTEBOOK EXPORT ----
  const notebookRef = useRef(null);
  const handleExportPDF = () => {
    if (!notebookRef.current) return;
    const opt = {
      margin:       10,
      filename:     'caderno-tatico-sportluiz.pdf',
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };
    html2pdf().set(opt).from(notebookRef.current).save();
  };

  return (
    <div className="p-0 md:p-6 lg:p-8 w-full max-w-[1400px] mx-auto min-h-screen flex flex-col space-y-6">
      
      {/* Header & Court Switcher */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-neutral-900 pb-5 gap-4">
        <div>
          <h1 className="text-xl font-black font-mono tracking-tighter text-white uppercase flex items-center gap-2">
            <Play className="text-emerald-400" /> Quadro Tático & Animador
          </h1>
          <p className="text-neutral-500 text-xs mt-1">
            Desenha exercícios, cria animações e organiza o teu caderno tático em PDF.
          </p>
        </div>

        {/* RESTORED: Court layout switcher */}
        <div className="flex bg-neutral-950 p-1 rounded-lg border border-neutral-900">
          <button 
            onClick={() => setCourtType('futsal')}
            className={`px-3 py-1.5 text-xs font-mono font-bold rounded transition-all cursor-pointer ${
              courtType === 'futsal' ? 'bg-neutral-900 text-emerald-400' : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            Quadra Futsal
          </button>
          <button 
            onClick={() => setCourtType('football')}
            className={`px-3 py-1.5 text-xs font-mono font-bold rounded transition-all cursor-pointer ${
              courtType === 'football' ? 'bg-neutral-900 text-emerald-400' : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            Campo Futebol
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { id: 'config', label: 'Configurações', icon: Settings },
          { id: 'exercises', label: 'Exercícios', icon: PenTool },
          { id: 'notebook', label: 'Caderno', icon: BookOpen }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg font-mono text-xs font-bold transition-all border-b-2 ${
                activeTab === tab.id 
                ? 'bg-neutral-900 text-emerald-400 border-emerald-500' 
                : 'bg-transparent text-neutral-500 border-transparent hover:text-white hover:bg-neutral-900/50'
              }`}
            >
              <Icon size={14} /> {tab.label}
            </button>
          )
        })}
      </div>

      <div className="min-h-[600px]">
        
        {/* --- TAB: CONFIGURAÇÕES --- */}
        {activeTab === 'config' && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-xl">
            <h2 className="text-sm font-bold font-mono text-white mb-6 flex items-center gap-2">
              <Settings size={16} className="text-emerald-400" /> Gerir Categorias
            </h2>
            <div className="flex gap-4 mb-8">
              <form onSubmit={handleAddCategory} className="flex-shrink-0">
                <button type="submit" className="bg-emerald-500 hover:bg-emerald-400 text-black px-4 py-2.5 rounded-lg font-bold text-xs font-mono flex items-center gap-2 transition-colors">
                  <Plus size={14} /> NOVA CATEGORIA
                </button>
              </form>
              <div className="relative flex-grow max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={14} />
                <input 
                  type="text" 
                  placeholder="Pesquisar categoria..." 
                  value={catSearch}
                  onChange={(e) => setCatSearch(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-9 pr-4 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {categories.filter(c => c.name.toLowerCase().includes(catSearch.toLowerCase())).map(cat => (
                <div key={cat.id} className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 flex items-center gap-3 group transition-all">
                  <div className={`w-8 h-8 rounded-lg ${cat.color} flex items-center justify-center font-bold text-sm text-white shadow-lg`}>
                    {cat.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-semibold text-xs font-mono text-white flex-grow truncate">{cat.name}</span>
                  <button onClick={() => handleDeleteCategory(cat.id)} className="opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-red-400 transition-all">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- TAB: EXERCÍCIOS (RESTORED ORIGINAL LAYOUT + NEW FIELDS) --- */}
        {activeTab === 'exercises' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            
            {/* Left Column: Toolbox and Details */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* RESTORED: Details Form */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4 shadow-xl">
                <div className="flex justify-between items-center">
                  <h2 className="text-xs font-bold font-mono text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Save size={14} className="text-emerald-400" /> Detalhes
                  </h2>
                  <button onClick={handleNewDrill} className="text-[10px] bg-neutral-950 px-2 py-1 border border-neutral-800 rounded text-neutral-300 hover:text-white">Limpar</button>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-mono text-neutral-500 uppercase block mb-1">Título do Exercício</label>
                    <input type="text" value={drillTitle} onChange={(e) => setDrillTitle(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500" />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-neutral-500 uppercase block mb-1">Categoria</label>
                    <select value={drillCategory} onChange={(e) => setDrillCategory(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500">
                      <option value="">Sem categoria</option>
                      {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-neutral-500 uppercase block mb-1">Nível</label>
                    <select value={drillLevel} onChange={e => setDrillLevel(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500">
                      <option value="Sem nível">Sem nível</option>
                      <option value="Iniciante">Iniciante</option>
                      <option value="Intermediário">Intermediário</option>
                      <option value="Avançado">Avançado</option>
                      <option value="Profissional">Profissional</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-neutral-500 uppercase block mb-1">Descrição</label>
                    <textarea value={drillDescription} onChange={e => setDrillDescription(e.target.value)} rows={3} className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500 resize-none"></textarea>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button onClick={handleSaveDrill} className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black font-bold font-mono text-xs py-2 rounded-lg transition-all">
                      GUARDAR
                    </button>
                    {activeDrillId && (
                      <button onClick={() => handleDeleteDrill(activeDrillId)} className="bg-red-950 hover:bg-red-900 border border-red-900 text-red-200 font-bold font-mono text-xs px-3 py-2 rounded-lg transition-all">
                        <Trash2 size={14}/>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* RESTORED: Tools Form */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4 shadow-xl">
                <h2 className="text-xs font-bold font-mono text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
                  🔧 Ferramentas
                </h2>
                
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setToolMode('drag')} className={`py-2 text-xs font-mono font-bold rounded-lg border transition-all cursor-pointer ${toolMode === 'drag' ? 'bg-emerald-500 border-emerald-600 text-black' : 'bg-neutral-950 border-neutral-850 text-neutral-400 hover:text-neutral-200'}`}>
                    🖐️ Mover Fichas
                  </button>
                  <button onClick={() => setToolMode('draw')} className={`py-2 text-xs font-mono font-bold rounded-lg border transition-all cursor-pointer ${toolMode === 'draw' ? 'bg-emerald-500 border-emerald-600 text-black' : 'bg-neutral-950 border-neutral-850 text-neutral-400 hover:text-neutral-200'}`}>
                    ✏️ Desenhar
                  </button>
                </div>

                {toolMode === 'draw' && (
                  <div className="space-y-3">
                    <span className="text-[10px] font-mono text-neutral-500 uppercase block">Cor do Pincel</span>
                    <div className="flex gap-2">
                      {['#34d399', '#3b82f6', '#f59e0b', '#ef4444', '#ffffff'].map((color) => (
                        <button
                          key={color}
                          onClick={() => setDrawColor(color)}
                          style={{ backgroundColor: color }}
                          className={`w-6 h-6 rounded-full border-2 transition-all cursor-pointer ${drawColor === color ? 'border-white scale-110' : 'border-transparent'}`}
                        ></button>
                      ))}
                    </div>
                    <button onClick={clearCanvas} className="w-full bg-neutral-950 hover:bg-neutral-850 text-red-400 border border-neutral-850 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer">
                      Limpar Desenho
                    </button>
                  </div>
                )}

                <div className="space-y-2 pt-2 border-t border-neutral-800/60">
                  <button onClick={handleAddCone} className="w-full bg-neutral-950 hover:bg-neutral-850 text-neutral-300 border border-neutral-850 py-2 rounded-lg text-xs font-mono transition-all cursor-pointer">
                    + Adicionar Cone ⚠️
                  </button>
                </div>
              </div>
            </div>

            {/* RESTORED: Center Canvas Board & Footer */}
            <div className="lg:col-span-2 space-y-4" onPointerMove={handlePointerMove} onPointerUp={handlePointerUp}>
              {/* NEW: Timeline Header from Print */}
              <div className="bg-[#1e2330] py-3 px-5 rounded-xl border border-neutral-800 shadow-xl flex items-center gap-4 overflow-x-auto custom-scrollbar">
                <span className="text-white text-sm font-bold whitespace-nowrap">Fotogramas:</span>
                
                <div className="flex items-center gap-2">
                  <button onClick={addFrame} className="bg-[#2a303c] border border-neutral-700 hover:border-neutral-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors flex flex-col items-center justify-center leading-tight h-12 min-w-[90px] shrink-0">
                    <span className="text-sm">+</span>
                    <span>Fotograma</span>
                  </button>
                  <button onClick={() => removeFrame(activeFrameIndex)} className="bg-[#2a303c] border border-neutral-700 hover:border-neutral-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors h-10 shrink-0">
                    Remover
                  </button>
                </div>

                <div className="w-px h-8 bg-neutral-700/50 shrink-0 mx-1"></div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-neutral-400 text-sm">Duração</span>
                  <input type="text" defaultValue="1,5" className="bg-[#141824] border border-neutral-700 rounded-lg px-2 py-2 text-sm text-white w-14 text-center focus:outline-none focus:border-blue-500 h-10" />
                </div>

                <div className="w-px h-8 bg-neutral-700/50 shrink-0 mx-1"></div>

                <button onClick={() => setIsPlaying(!isPlaying)} className="bg-[#1dae4c] hover:bg-green-500 text-white text-sm font-bold px-6 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 h-10 shrink-0">
                  {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />} Reproduzir
                </button>
              </div>

              <div className={`w-full aspect-[5/3] relative rounded-2xl border-2 border-neutral-800 overflow-hidden shadow-2xl select-none transition-all duration-300 ${courtType === 'futsal' ? 'bg-blue-950/40' : 'bg-emerald-950/20'}`}>
                {/* Visual court markings */}
                <div className="absolute inset-0 border-[3px] border-white/20 m-3 flex items-center justify-center pointer-events-none">
                  <div className="h-full w-[2px] bg-white/20 absolute left-1/2 -translate-x-1/2"></div>
                  <div className="w-1/5 aspect-square border-2 border-white/20 rounded-full absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"></div>
                  <div className={`h-1/2 w-[12%] border-t-2 border-r-2 border-b-2 border-white/20 absolute left-0 top-1/4 ${courtType === 'futsal' ? 'rounded-r-full' : ''}`}></div>
                  <div className={`h-1/2 w-[12%] border-t-2 border-l-2 border-b-2 border-white/20 absolute right-0 top-1/4 ${courtType === 'futsal' ? 'rounded-l-full' : ''}`}></div>
                </div>

                <canvas ref={canvasRef} onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing} className={`absolute inset-0 z-10 ${toolMode === 'draw' ? 'cursor-crosshair pointer-events-auto' : 'pointer-events-none'}`} />

                {currentFrame?.players.map((p) => (
                  <div key={p.id} onPointerDown={(e) => handlePointerDown('player', p.id, e)} style={{ left: `${p.x}%`, top: `${p.y}%` }} className={`absolute w-8 h-8 -ml-4 -mt-4 rounded-full border border-white/80 shadow-lg text-white font-mono text-[10px] font-black flex flex-col items-center justify-center cursor-grab active:cursor-grabbing select-none z-20 ${p.color}`}>
                    <span>{p.number}</span>
                    <span className="text-[6px] tracking-tighter opacity-80 uppercase block">{p.name}</span>
                  </div>
                ))}
                {currentFrame?.balls.map((b) => (
                  <div key={b.id} onPointerDown={(e) => handlePointerDown('ball', b.id, e)} style={{ left: `${b.x}%`, top: `${b.y}%` }} className="absolute w-4 h-4 -ml-2 -mt-2 rounded-full bg-white border border-black shadow-lg text-[8px] flex items-center justify-center cursor-grab active:cursor-grabbing select-none z-20">⚽</div>
                ))}
                {currentFrame?.cones.map((c) => (
                  <div key={c.id} onPointerDown={(e) => handlePointerDown('cone', c.id, e)} style={{ left: `${c.x}%`, top: `${c.y}%` }} className="absolute w-5 h-5 -ml-2.5 -mt-2.5 text-lg flex items-center justify-center cursor-grab active:cursor-grabbing select-none z-20" title="Cone">⚠️</div>
                ))}
              </div>

              {/* NEW: Horizontal Toolbar from Print */}
              <div className="bg-[#1e2330] py-3 px-4 flex justify-start rounded-xl border border-neutral-800 shadow-xl overflow-x-auto custom-scrollbar w-fit">
                
                {/* All Tools Container */}
                <div className="flex flex-col gap-3 shrink-0">
                  
                  {/* Row 1 (Longest) */}
                  <div className="flex items-center gap-2 sm:gap-3 text-white">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <button className="text-neutral-400 hover:text-white"><MousePointer size={18}/></button>
                      <button className="text-neutral-400 hover:text-white"><User size={18}/></button>
                      <button className="text-neutral-400 hover:text-white"><Users size={18}/></button>
                      <button className="text-neutral-400 hover:text-white"><Clock size={18}/></button>
                      <button className="text-orange-500 hover:text-orange-400"><Triangle size={18}/></button>
                      <button className="text-neutral-400 hover:text-white"><Square size={18}/></button>
                    </div>
                    
                    <div className="w-px h-5 bg-neutral-700/50 mx-1"></div>

                    <div className="flex items-center gap-1.5">
                      <button className="bg-blue-600 p-1.5 rounded hover:bg-blue-500 text-white"><ArrowUpRight size={16}/></button>
                      <button className="bg-blue-600 p-1.5 rounded hover:bg-blue-500 text-white"><Minus size={16}/></button>
                      <button className="text-neutral-400 hover:text-white p-1.5"><MoreHorizontal size={16}/></button>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 ml-1">
                      <div className="flex items-center gap-1 sm:gap-1.5">
                        <span className="text-[11px] sm:text-xs text-neutral-500 font-mono">S:</span>
                        <button className="bg-blue-600 p-1.5 rounded hover:bg-blue-500 text-white"><Minus size={16}/></button>
                        <button className="text-neutral-400 hover:text-white p-1.5"><ArrowLeft size={16}/></button>
                        <button className="text-neutral-400 hover:text-white p-1.5"><MoreHorizontal size={16} className="rotate-90"/></button>
                      </div>
                      
                      <div className="flex items-center gap-1 sm:gap-1.5">
                        <span className="text-[11px] sm:text-xs text-neutral-500 font-mono">E:</span>
                        <button className="text-neutral-400 hover:text-white p-1.5"><Minus size={16}/></button>
                        <button className="bg-blue-600 p-1.5 rounded hover:bg-blue-500 text-white"><ArrowRight size={16}/></button>
                        <button className="text-neutral-400 hover:text-white p-1.5"><MoreHorizontal size={16} className="rotate-90"/></button>
                      </div>
                    </div>

                    <div className="w-px h-5 bg-neutral-700/50 mx-1"></div>

                    <button className="text-neutral-400 hover:text-white"><Type size={18}/></button>
                  </div>

                  {/* Container for Rows 2/3 + Export Tools placed side by side */}
                  <div className="flex items-end justify-between w-full">
                    
                    {/* Rows 2 and 3 Stack */}
                    <div className="flex flex-col gap-3">
                      {/* Row 2 */}
                      <div className="flex items-center gap-3 sm:gap-4 mt-1">
                        <div className="w-px h-4 bg-neutral-700/50"></div>
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <span className="text-[11px] sm:text-xs text-neutral-400 font-mono">Campo</span>
                          <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-500 rounded border border-neutral-600 cursor-pointer"></div>
                        </div>
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <span className="text-[11px] sm:text-xs text-neutral-400 font-mono">Linhas</span>
                          <div className="w-5 h-5 sm:w-6 sm:h-6 bg-white rounded border border-neutral-600 cursor-pointer"></div>
                        </div>
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <span className="text-[11px] sm:text-xs text-neutral-400 font-mono">Cor</span>
                          <div className="w-5 h-5 sm:w-6 sm:h-6 bg-white rounded border border-neutral-600 cursor-pointer"></div>
                        </div>
                        <div className="flex items-center gap-1.5 sm:gap-2 sm:ml-2">
                          <span className="text-[11px] sm:text-xs text-neutral-400 font-mono">Etiqueta</span>
                          <input type="text" placeholder="Nº ou texto" className="bg-[#141824] border border-neutral-700 rounded-lg px-2 sm:px-3 py-1.5 text-xs text-white w-20 sm:w-24 focus:outline-none focus:border-blue-500 placeholder-neutral-600" />
                        </div>
                      </div>

                      {/* Row 3 */}
                      <div className="flex items-center gap-4 mt-1">
                        <button className="bg-[#141824] hover:bg-[#1e2330] text-white text-[11px] sm:text-xs font-bold px-3 sm:px-4 py-2 rounded border border-neutral-700 transition-colors">
                          Meio Campo
                        </button>
                        <div className="w-px h-4 bg-neutral-700/50"></div>
                        <button onClick={clearCanvas} className="text-[#ff5555] border border-red-900/50 bg-[#1e1414] hover:bg-[#2a1a1a] text-[11px] sm:text-xs font-bold px-3 sm:px-4 py-2 rounded transition-colors whitespace-nowrap">
                          Apagar Seleção
                        </button>
                      </div>
                    </div>

                    {/* Right Side: Export & Frames (Tucked under Row 1) */}
                    <div className="flex items-end gap-3 shrink-0 pb-0.5 ml-4">
                      <button className="bg-[#2a303c] hover:bg-[#343b49] border border-neutral-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors flex flex-col items-center justify-center leading-tight h-[52px] min-w-[80px] sm:min-w-[90px]">
                        <span>Exportar</span>
                        <span>Imagem</span>
                      </button>

                      <div className="flex items-center gap-2 h-[52px]">
                        {frames.map((_, idx) => (
                          <button 
                            key={idx} 
                            onClick={() => { setActiveFrameIndex(idx); setIsPlaying(false); }} 
                            className={`w-10 h-10 flex items-center justify-center text-sm font-bold rounded transition-all flex-shrink-0
                              ${activeFrameIndex === idx 
                                ? 'border-2 border-[#1dae4c] text-white bg-[#141824]' 
                                : 'border border-neutral-700 text-neutral-400 bg-[#141824] hover:text-white hover:border-neutral-500'}`}
                          >
                            {idx + 1}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>


            </div>

            {/* RESTORED: Right Column Library */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 flex flex-col justify-between h-[650px]">
                <div className="space-y-4 flex-grow overflow-hidden flex flex-col min-h-0">
                  <h2 className="text-xs font-bold font-mono text-neutral-400 uppercase tracking-widest border-b border-neutral-850 pb-2">
                    Minha Biblioteca
                  </h2>
                  <div className="space-y-2 overflow-y-auto custom-scrollbar flex-grow pr-1">
                    {drills.length === 0 ? (
                      <div className="text-center py-16 text-[10px] font-mono text-neutral-600">Nenhum exercício salvo.</div>
                    ) : (
                      drills.map((dr) => (
                        <button key={dr.id} onClick={() => handleLoadDrill(dr)} className={`w-full text-left bg-neutral-950 hover:bg-neutral-850 p-3 rounded-lg border text-xs font-mono transition-all flex flex-col gap-1 ${activeDrillId === dr.id ? 'border-emerald-500/50' : 'border-neutral-850'}`}>
                          <span className="font-bold text-white uppercase truncate">{dr.title}</span>
                          <div className="flex justify-between w-full text-[9px] text-neutral-500 mt-0.5">
                            <span className="truncate max-w-[60%]">🏷️ {dr.category || 'Sem cat'}</span>
                            <span>🎞️ {dr.frames?.length || 1} f</span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* --- TAB: CADERNO --- */}
        {activeTab === 'notebook' && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 h-[800px] overflow-y-auto custom-scrollbar relative shadow-xl">
            <div className="flex justify-between items-center mb-6 sticky top-0 bg-neutral-900/90 backdrop-blur z-10 py-2">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold font-mono text-emerald-400 flex items-center gap-2"><BookOpen size={18} /> Caderno Oficial</h2>
                <span className="bg-neutral-950 border border-neutral-800 text-neutral-400 text-xs px-2 py-1 rounded font-mono">{drills.length} salvos</span>
              </div>
              <button onClick={handleExportPDF} className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold font-mono px-4 py-2 rounded-lg text-xs flex items-center gap-2 transition-colors">
                <Download size={14} /> EXPORTAR PDF
              </button>
            </div>

            {drills.length === 0 ? (
              <div className="text-center py-20 text-neutral-500">
                <BookOpen size={48} className="mx-auto mb-4 opacity-20" />
                <p className="font-mono text-sm">O seu caderno está vazio.</p>
                <p className="text-xs font-mono mt-2">Vá à aba "Exercícios" e guarde algumas táticas para criar seu PDF.</p>
              </div>
            ) : (
              <div ref={notebookRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {drills.map((drill) => (
                  <div key={drill.id} className="bg-neutral-950 border border-neutral-800 rounded-xl overflow-hidden flex flex-col PDF-break-inside-avoid shadow-lg">
                    <div className="aspect-[5/3] bg-blue-950/40 relative border-b border-neutral-800">
                      <div className="absolute inset-0 border border-white/20 m-2 flex items-center justify-center pointer-events-none">
                        <div className="h-full w-[2px] bg-white/20 absolute left-1/2"></div>
                        <div className="w-1/5 aspect-square border border-white/20 rounded-full absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"></div>
                      </div>
                      {drill.frames && drill.frames[0]?.players.map(p => (
                        <div key={p.id} style={{ left: `${p.x}%`, top: `${p.y}%` }} className={`absolute w-3 h-3 -ml-1.5 -mt-1.5 rounded-full ${p.color} border border-white/50`}></div>
                      ))}
                    </div>
                    <div className="p-4 flex-grow flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-2 gap-2">
                          <h3 className="font-bold font-mono text-white text-sm leading-tight uppercase">{drill.title}</h3>
                          <span className="text-[9px] font-mono bg-neutral-900 border border-neutral-800 text-neutral-400 px-2 py-0.5 rounded whitespace-nowrap">{drill.category || 'Geral'}</span>
                        </div>
                        <p className="text-[10px] font-mono text-neutral-500 line-clamp-3">{drill.description || 'Nenhuma nota tática inserida.'}</p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-neutral-850 flex justify-between items-center">
                        <span className="text-[10px] font-mono text-neutral-600 bg-neutral-900 px-2 py-0.5 rounded">Nível: {drill.level}</span>
                        <span className="text-[10px] font-mono text-neutral-600">{drill.courtType === 'futsal' ? 'Quadra' : 'Campo'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
