import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, Plus, Trash2, Save, Download, 
  Settings, BookOpen, PenTool, Image as ImageIcon,
  Search, Filter
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
  const [drillTitle, setDrillTitle] = useState('Exercício 1');
  const [drillCategory, setDrillCategory] = useState('');
  const [drillLevel, setDrillLevel] = useState('Sem nível');
  const [drillDescription, setDrillDescription] = useState('');
  const [courtType, setCourtType] = useState('futsal'); 
  
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
  const [drawColor, setDrawColor] = useState('#ffffff');
  const [toolMode, setToolMode] = useState('drag'); // drag, draw

  // Animation Playback
  useEffect(() => {
    if (isPlaying) {
      playbackInterval.current = setInterval(() => {
        setActiveFrameIndex((prev) => (prev >= frames.length - 1 ? 0 : prev + 1));
      }, 1500); 
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
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
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
  }, [activeTab, toolMode]);

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
    if(canvasRef.current) clearCanvas();
  };

  const handleSaveDrill = () => {
    if (!drillTitle.trim()) return alert("Dê um nome ao exercício.");
    
    // Capture thumbnail
    let thumbnail = null;
    if (canvasRef.current) {
       // We can't easily capture the whole DOM cleanly here without html2canvas, 
       // but we'll store the drill object safely.
    }

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
    alert('Guardado com sucesso!');
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
  const [drillSearch, setDrillSearch] = useState('');

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
    <div className="p-0 md:p-6 lg:p-8 w-full max-w-7xl mx-auto min-h-screen flex flex-col">
      
      {/* Header & Tabs */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-t-2xl p-6 pb-0">
        <div className="mb-6">
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
             Quadro Tático
          </h1>
          <p className="text-neutral-400 text-sm mt-1 max-w-3xl">
            Quadro tático gratuito para futsal. Desenha exercícios num campo interativo com atletas, adversários, bolas, cones. Cria animações, e organiza a tua biblioteca de exercícios por categoria e nível de dificuldade.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-6 border-b border-neutral-800">
          {[
            { id: 'config', label: 'Configurações' },
            { id: 'exercises', label: 'Exercícios' },
            { id: 'notebook', label: 'Caderno' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 font-semibold text-sm transition-all border-b-2 relative top-[1px] ${
                activeTab === tab.id 
                ? 'text-emerald-400 border-emerald-500' 
                : 'text-neutral-400 border-transparent hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-neutral-900/50 border-x border-b border-neutral-800 rounded-b-2xl flex-grow flex flex-col overflow-hidden">
        
        {/* --- TAB: CONFIGURAÇÕES --- */}
        {activeTab === 'config' && (
          <div className="p-6">
            <div className="flex gap-4 mb-8">
              <form onSubmit={handleAddCategory} className="flex-shrink-0">
                <button type="submit" className="bg-emerald-500 hover:bg-emerald-400 text-black px-4 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 transition-colors">
                  <Plus size={16} /> Nova Categoria
                </button>
              </form>
              <div className="relative flex-grow max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={16} />
                <input 
                  type="text" 
                  placeholder="Pesquisar categoria..." 
                  value={catSearch}
                  onChange={(e) => setCatSearch(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {categories.filter(c => c.name.toLowerCase().includes(catSearch.toLowerCase())).map(cat => (
                <div key={cat.id} className="bg-neutral-800/50 hover:bg-neutral-800 border border-neutral-700/50 rounded-xl p-4 flex items-center gap-3 group transition-all">
                  <div className={`w-10 h-10 rounded-lg ${cat.color} flex items-center justify-center font-bold text-lg text-white shadow-lg`}>
                    {cat.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-semibold text-white flex-grow truncate">{cat.name}</span>
                  <button onClick={() => handleDeleteCategory(cat.id)} className="opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-red-400 transition-all">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {categories.length === 0 && <div className="text-neutral-500 text-sm col-span-full">Nenhuma categoria criada.</div>}
            </div>
          </div>
        )}

        {/* --- TAB: EXERCÍCIOS --- */}
        {activeTab === 'exercises' && (
          <div className="flex flex-col lg:flex-row flex-grow h-[800px]">
            
            {/* Sidebar Drills List */}
            <div className="w-full lg:w-64 border-b lg:border-b-0 lg:border-r border-neutral-800 bg-neutral-950 flex flex-col flex-shrink-0">
              <div className="p-4 border-b border-neutral-800 space-y-4">
                <button 
                  onClick={handleNewDrill}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Plus size={16} /> Novo Exercício
                </button>
                <div className="flex justify-between items-center text-xs font-semibold text-neutral-400">
                  <span>Exercícios</span>
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-500">{drills.length} exercícios</span>
                    <Filter size={14} className="cursor-pointer hover:text-white" />
                  </div>
                </div>
              </div>
              <div className="flex-grow overflow-y-auto p-2 space-y-1 custom-scrollbar">
                {drills.length === 0 ? (
                  <div className="text-center p-4 text-xs text-neutral-600">Sem exercícios.</div>
                ) : (
                  drills.map(d => (
                    <button
                      key={d.id}
                      onClick={() => handleLoadDrill(d)}
                      className={`w-full text-left p-3 rounded-lg text-sm font-medium flex items-center gap-3 transition-colors ${
                        activeDrillId === d.id ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-neutral-400 hover:bg-neutral-900 hover:text-white border border-transparent'
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full ${activeDrillId === d.id ? 'bg-blue-500' : 'bg-neutral-700'}`}></div>
                      <span className="truncate">{d.title}</span>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Main Editor Area */}
            <div className="flex-grow flex flex-col bg-neutral-900 relative">
              
              {/* Top Form */}
              <div className="p-4 border-b border-neutral-800 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-neutral-400">Nome do exercício</label>
                  <input type="text" value={drillTitle} onChange={e => setDrillTitle(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded text-sm text-white px-3 py-2 focus:border-emerald-500 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-neutral-400">Categoria</label>
                  <select value={drillCategory} onChange={e => setDrillCategory(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded text-sm text-white px-3 py-2 focus:border-emerald-500 outline-none">
                    <option value="">Sem categoria</option>
                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-neutral-400">Nível</label>
                  <select value={drillLevel} onChange={e => setDrillLevel(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded text-sm text-white px-3 py-2 focus:border-emerald-500 outline-none">
                    <option value="Sem nível">Sem nível</option>
                    <option value="Iniciante">Iniciante</option>
                    <option value="Intermediário">Intermediário</option>
                    <option value="Avançado">Avançado</option>
                    <option value="Profissional">Profissional</option>
                  </select>
                </div>
                <div className="col-span-full space-y-1">
                  <label className="text-xs text-neutral-400">Descrição</label>
                  <textarea value={drillDescription} onChange={e => setDrillDescription(e.target.value)} placeholder="Descrição do exercício..." rows={2} className="w-full bg-neutral-950 border border-neutral-800 rounded text-sm text-white px-3 py-2 focus:border-emerald-500 outline-none resize-none"></textarea>
                </div>
                
                {/* Save/Delete Buttons */}
                <div className="col-span-full flex gap-3 pt-2">
                  <button onClick={handleSaveDrill} className="bg-emerald-500 hover:bg-emerald-400 text-black px-5 py-1.5 rounded text-sm font-bold transition-colors">Guardar</button>
                  {activeDrillId && (
                    <button onClick={() => handleDeleteDrill(activeDrillId)} className="bg-red-900/40 hover:bg-red-900/80 border border-red-800/50 text-red-200 px-5 py-1.5 rounded text-sm font-bold transition-colors">Eliminar</button>
                  )}
                </div>
              </div>

              {/* Toolbar */}
              <div className="p-3 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between gap-4 overflow-x-auto">
                <div className="flex items-center gap-1 bg-neutral-900 rounded p-1">
                  <button onClick={() => setToolMode('drag')} className={`p-1.5 rounded ${toolMode === 'drag' ? 'bg-blue-600 text-white' : 'text-neutral-400 hover:text-white'}`}><Play size={14} className="rotate-90" /></button>
                  <button onClick={() => setToolMode('draw')} className={`p-1.5 rounded ${toolMode === 'draw' ? 'bg-blue-600 text-white' : 'text-neutral-400 hover:text-white'}`}><PenTool size={14} /></button>
                </div>
                <div className="flex items-center gap-2 text-xs text-neutral-400">
                  <span>Meio Campo</span>
                  <div className="w-px h-4 bg-neutral-700 mx-2"></div>
                  <span>Cor</span>
                  <div className="flex gap-1">
                    {['#ffffff', '#ef4444', '#f59e0b', '#34d399'].map(c => (
                      <button key={c} onClick={() => setDrawColor(c)} style={{backgroundColor: c}} className={`w-4 h-4 rounded-sm border ${drawColor === c ? 'border-blue-500' : 'border-transparent'}`}></button>
                    ))}
                  </div>
                  <button onClick={clearCanvas} className="ml-2 bg-red-900/30 text-red-400 px-2 py-1 rounded border border-red-900/50 hover:bg-red-900/50">Apagar Seleção</button>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={handleAddCone} className="text-xs bg-neutral-800 text-neutral-300 px-2 py-1 rounded hover:bg-neutral-700">+ Cone</button>
                </div>
              </div>

              {/* Court Canvas Area */}
              <div className="flex-grow p-4 flex items-center justify-center relative overflow-hidden" onPointerMove={handlePointerMove} onPointerUp={handlePointerUp}>
                <div className="w-full max-w-[800px] aspect-[5/3] relative rounded border-2 border-white/10 overflow-hidden select-none bg-blue-600 shadow-2xl">
                  {/* Futsal Markings */}
                  <div className="absolute inset-0 border-[3px] border-white/80 m-3 flex items-center justify-center pointer-events-none">
                    <div className="h-full w-[2px] bg-white/80 absolute left-1/2 -translate-x-1/2"></div>
                    <div className="w-1/5 aspect-square border-2 border-white/80 rounded-full absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"></div>
                    <div className="w-[1%] aspect-square bg-white/80 rounded-full absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"></div>
                    {/* Penalty Areas */}
                    <div className="h-1/2 w-[16%] border-t-2 border-r-2 border-b-2 border-white/80 absolute left-0 top-1/4 rounded-r-full flex items-center justify-end"><div className="w-[4%] aspect-square bg-white/80 rounded-full mr-[15%]"></div></div>
                    <div className="h-1/2 w-[16%] border-t-2 border-l-2 border-b-2 border-white/80 absolute right-0 top-1/4 rounded-l-full flex items-center justify-start"><div className="w-[4%] aspect-square bg-white/80 rounded-full ml-[15%]"></div></div>
                  </div>

                  {/* Drawing overlay */}
                  <canvas ref={canvasRef} onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing} className={`absolute inset-0 z-10 ${toolMode === 'draw' ? 'cursor-crosshair pointer-events-auto' : 'pointer-events-none'}`} />

                  {/* Elements */}
                  {currentFrame?.players.map((p) => (
                    <div key={p.id} onPointerDown={(e) => handlePointerDown('player', p.id, e)} style={{ left: `${p.x}%`, top: `${p.y}%` }} className={`absolute w-7 h-7 -ml-3.5 -mt-3.5 rounded-full border-2 border-white shadow-lg text-white font-mono text-[10px] font-bold flex flex-col items-center justify-center cursor-grab active:cursor-grabbing select-none z-20 ${p.color}`}>
                      <span>{p.number}</span>
                    </div>
                  ))}
                  {currentFrame?.balls.map((b) => (
                    <div key={b.id} onPointerDown={(e) => handlePointerDown('ball', b.id, e)} style={{ left: `${b.x}%`, top: `${b.y}%` }} className="absolute w-4 h-4 -ml-2 -mt-2 rounded-full bg-white border border-black shadow-lg text-[8px] flex items-center justify-center cursor-grab active:cursor-grabbing select-none z-20">⚽</div>
                  ))}
                  {currentFrame?.cones.map((c) => (
                    <div key={c.id} onPointerDown={(e) => handlePointerDown('cone', c.id, e)} style={{ left: `${c.x}%`, top: `${c.y}%` }} className="absolute w-5 h-5 -ml-2.5 -mt-2.5 text-lg flex items-center justify-center cursor-grab active:cursor-grabbing select-none z-20" title="Cone">⚠️</div>
                  ))}
                </div>
              </div>

              {/* Bottom Timeline */}
              <div className="bg-neutral-950 p-4 border-t border-neutral-800 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-neutral-400">Fotogramas:</span>
                  <button onClick={addFrame} className="bg-neutral-800 hover:bg-neutral-700 text-white px-3 py-1.5 rounded text-xs transition-colors">+ Fotograma</button>
                  {frames.length > 1 && <button onClick={() => removeFrame(activeFrameIndex)} className="bg-neutral-800 hover:bg-neutral-700 text-white px-3 py-1.5 rounded text-xs transition-colors">Remover</button>}
                  
                  <div className="w-px h-4 bg-neutral-800 mx-2"></div>
                  
                  <span className="text-xs text-neutral-400">Duração (s)</span>
                  <input type="text" defaultValue="1,5" className="w-12 bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-xs text-white text-center" />
                  
                  <button onClick={() => setIsPlaying(!isPlaying)} className={`flex items-center gap-1.5 px-4 py-1.5 rounded text-xs font-bold transition-colors ml-4 ${isPlaying ? 'bg-amber-500 text-black' : 'bg-emerald-500 text-black'}`}>
                    {isPlaying ? <Pause size={12}/> : <Play size={12}/>} {isPlaying ? 'Pausar' : 'Reproduzir'}
                  </button>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="flex gap-1 overflow-x-auto max-w-[200px] pr-2">
                    {frames.map((_, idx) => (
                      <button key={idx} onClick={() => { setActiveFrameIndex(idx); setIsPlaying(false); }} className={`w-8 h-8 rounded border flex items-center justify-center text-xs font-bold transition-all ${activeFrameIndex === idx ? 'border-emerald-500 text-emerald-400' : 'border-neutral-800 text-neutral-500 hover:text-white'}`}>{idx + 1}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- TAB: CADERNO --- */}
        {activeTab === 'notebook' && (
          <div className="p-6 h-[800px] overflow-y-auto custom-scrollbar relative">
            <div className="flex justify-between items-center mb-6 sticky top-0 bg-neutral-900/90 backdrop-blur z-10 py-2">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-white flex items-center gap-2"><BookOpen size={18} className="text-emerald-400" /> Caderno de Exercícios</h2>
                <span className="bg-neutral-800 text-neutral-300 text-xs px-2 py-1 rounded font-mono">{drills.length} salvos</span>
              </div>
              <button onClick={handleExportPDF} className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors">
                <Download size={16} /> Baixar PDF
              </button>
            </div>

            {drills.length === 0 ? (
              <div className="text-center py-20 text-neutral-500">
                <BookOpen size={48} className="mx-auto mb-4 opacity-20" />
                <p>O seu caderno está vazio.</p>
                <p className="text-sm mt-2">Vá à aba "Exercícios" e salve algumas táticas para elas aparecerem aqui.</p>
              </div>
            ) : (
              <div ref={notebookRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-neutral-900 p-4 rounded-xl">
                {/* We render the drills here. To make them print nicely, we ensure a clean card layout */}
                {drills.map((drill, index) => (
                  <div key={drill.id} className="bg-neutral-950 border border-neutral-800 rounded-xl overflow-hidden flex flex-col PDF-break-inside-avoid">
                    {/* Simulated Mini-Pitch Thumbnail */}
                    <div className="aspect-[5/3] bg-blue-600 relative border-b border-neutral-800">
                      <div className="absolute inset-0 border border-white/50 m-2 flex items-center justify-center">
                        <div className="h-full w-px bg-white/50 absolute left-1/2"></div>
                        <div className="w-1/5 aspect-square border border-white/50 rounded-full absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"></div>
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center opacity-30 text-white/50 text-xs font-mono font-bold">
                        [Vista de Miniatura]
                      </div>
                      {/* Render just the first frame dots roughly */}
                      {drill.frames && drill.frames[0]?.players.map(p => (
                        <div key={p.id} style={{ left: `${p.x}%`, top: `${p.y}%` }} className={`absolute w-3 h-3 -ml-1.5 -mt-1.5 rounded-full ${p.color} border border-white`}></div>
                      ))}
                    </div>
                    <div className="p-4 flex-grow flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-bold text-white text-base leading-tight">{drill.title}</h3>
                          <span className="text-[10px] bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded ml-2 whitespace-nowrap">{drill.category || 'Sem categoria'}</span>
                        </div>
                        <p className="text-xs text-neutral-500 line-clamp-2">{drill.description || 'Sem descrição detalhada.'}</p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-neutral-800 flex justify-between items-center">
                        <button 
                          onClick={() => handleLoadDrill(drill)} 
                          className="text-emerald-500 hover:text-emerald-400 text-xs font-bold transition-colors"
                        >
                          Editar →
                        </button>
                        <span className="text-[10px] text-neutral-600">{drill.level}</span>
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
