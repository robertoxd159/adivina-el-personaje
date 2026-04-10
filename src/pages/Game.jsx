import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import AdminPanel from '../components/AdminPanel';

const Game = ({ session }) => {
  // 1. ESTADOS DE DATOS Y CARGA
  const [levels, setLevels] = useState([]);
  const [levelIndex, setLevelIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('categories'); 
  const [selectedCat, setSelectedCat] = useState(null);
  const [selectedSub, setSelectedSub] = useState(null);
  const [userProgreso, setUserProgreso] = useState(0); 

  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [coins, setCoins] = useState(0); 
  const [availableLetters, setAvailableLetters] = useState([]);
  const [selectedLetters, setSelectedLetters] = useState([]);
  const [status, setStatus] = useState('playing');
  
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [notification, setNotification] = useState(null);

  const user = session?.user;
  const isAdmin = user?.email === 'roberto91930@hotmail.com';

  const filteredLevels = levels.filter(l => l.subcategoria === selectedSub);
  const currentLevel = filteredLevels[levelIndex];

  // --- FUNCIÓN DE NOTIFICACIÓN ---
  const showNotify = (message, type = 'info', duration = 3000) => {
    setNotification(null); 
    setTimeout(() => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), duration);
    }, 10);
  };

  // --- CARGA INICIAL ---
  useEffect(() => {
    const initGame = async () => {
      setLoading(true);
      const { data: levelsData } = await supabase.from('levels').select('*').order('id', { ascending: true });
      if (levelsData) setLevels(levelsData);

      const { data: profile } = await supabase.from('profiles').select('monedas, nivel_actual').eq('id', user.id).single();

      if (profile) {
        setCoins(profile.monedas);
        setUserProgreso(profile.nivel_actual || 0);
      }
      setLoading(false);
    };
    if (user) initGame();
  }, [user]);

  // --- LÓGICA DE NEGOCIO ---
  const handleRedeemCoupon = async () => {
    const codeClean = couponInput.trim().toUpperCase();
    if (!codeClean) return;

    const { data: coupon, error } = await supabase.from('coupons').select('*').eq('code', codeClean).eq('is_used', false).single();

    if (error || !coupon) {
      showNotify("Código inválido o ya utilizado.", 'error');
      setCouponInput('');
      return;
    }

    await supabase.from('coupons').update({ is_used: true }).eq('id', coupon.id);
    const newTotal = coins + coupon.amount;
    setCoins(newTotal);
    await supabase.from('profiles').update({ monedas: newTotal }).eq('id', user.id);

    showNotify(`¡Recarga exitosa! +${coupon.amount} monedas.`, 'coins');
    setCouponInput('');
    setIsShopOpen(false);
  };

  const startAtLastLevel = (subName) => {
    const subLevels = levels.filter(l => l.subcategoria === subName);
    const lastPlayedIndex = subLevels.findIndex(l => l.id === userProgreso);
    setLevelIndex(lastPlayedIndex !== -1 ? lastPlayedIndex : 0);
    setSelectedSub(subName);
    setView('level_map'); 
  };

  const updateCloudData = async (newCoins, nextLevelId) => {
    const updates = { monedas: newCoins };
    if (nextLevelId) updates.nivel_actual = nextLevelId;
    await supabase.from('profiles').update(updates).eq('id', user.id);
  };

  // --- LÓGICA DE JUEGO ---
  useEffect(() => {
    if (filteredLevels.length > 0 && currentLevel) {
      const letters = (currentLevel.letras_grid || "").split("").map((l, i) => ({ id: i, char: l, used: false }));
      setAvailableLetters(letters);
      setSelectedLetters(Array(currentLevel.respuesta.length).fill(null));
      setStatus('playing');
    }
  }, [levelIndex, selectedSub]);

  useEffect(() => {
    if (filteredLevels.length === 0 || !currentLevel) return;
    const isFull = selectedLetters.every(letter => letter !== null);
    
    if (isFull) {
      const word = selectedLetters.map(l => l.char).join('');
      if (word === currentLevel.respuesta) {
        setStatus('success');
        const newTotal = coins + 10;
        setCoins(newTotal);

        setTimeout(() => {
          const nextIdx = levelIndex + 1;
          if (nextIdx < filteredLevels.length) {
            const nextLvlId = filteredLevels[nextIdx].id;
            const newProgreso = nextLvlId > userProgreso ? nextLvlId : userProgreso;
            setUserProgreso(newProgreso);
            updateCloudData(newTotal, newProgreso);
            setLevelIndex(nextIdx);
          } else {
            updateCloudData(newTotal, null);
            showNotify("¡Serie completada! 🏆", 'success');
            setView('subcategories');
          }
        }, 1500);
      } else {
        setStatus('error');
        setTimeout(() => setStatus('playing'), 1000);
      }
    }
  }, [selectedLetters]);

  const handleSelect = (l) => {
    if (status !== 'playing') return;
    const empty = selectedLetters.indexOf(null);
    if (empty !== -1 && !l.used) {
      const newSel = [...selectedLetters]; newSel[empty] = l; setSelectedLetters(newSel);
      setAvailableLetters(prev => prev.map(item => item.id === l.id ? { ...item, used: true } : item));
    }
  };

  const handleRemove = (i) => {
    if (status === 'success') return;
    const l = selectedLetters[i]; if (!l) return;
    const newSel = [...selectedLetters]; newSel[i] = null; setSelectedLetters(newSel);
    setAvailableLetters(prev => prev.map(item => item.id === l.id ? { ...item, used: false } : item));
  };

  const revealHint = () => {
    if (coins < 30 || status !== 'playing') return;
    const firstEmpty = selectedLetters.indexOf(null);
    if (firstEmpty === -1) return;
    const correctChar = currentLevel.respuesta[firstEmpty];
    const letterInGrid = availableLetters.find(l => l.char === correctChar && !l.used);
    if (letterInGrid) {
      const newTotal = coins - 30;
      setCoins(newTotal);
      updateCloudData(newTotal, null);
      handleSelect(letterInGrid);
    } else {
        showNotify("No quedan letras correctas disponibles.", 'error');
    }
  };

  const skipLevel = () => {
    if (coins < 80 || status !== 'playing') return;
    const newTotal = coins - 80;
    setCoins(newTotal);
    updateCloudData(newTotal, null);
    setStatus('success');
    setTimeout(() => { if (levelIndex < filteredLevels.length - 1) setLevelIndex(prev => prev + 1); }, 1000);
  };

  // --- COMPONENTES UI ---
  const renderNotification = () => {
    if (!notification) return null;
    const themes = {
        success: 'border-green-500 from-green-600/20 to-green-900/40 text-green-300',
        error: 'border-red-500 from-red-600/20 to-red-900/40 text-red-300',
        coins: 'border-amber-500 from-amber-600/20 to-amber-900/40 text-amber-300',
        info: 'border-indigo-500 from-indigo-600/20 to-indigo-900/40 text-indigo-300'
    };
    const icons = { success: '🏆', error: '⚠️', coins: '💰', info: '💡' };
    return (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[300] w-[90%] max-w-xs animate-in slide-in-from-top-10 duration-300">
            <div className={`flex items-center gap-3 p-4 rounded-full border-2 bg-gradient-to-br shadow-2xl backdrop-blur-sm ${themes[notification.type] || themes.info}`}>
                <span className="text-xl shrink-0">{icons[notification.type]}</span>
                <p className="text-[11px] font-black uppercase tracking-tight flex-1">{notification.message}</p>
                <button onClick={() => setNotification(null)} className="text-white/50 hover:text-white text-xs font-black shrink-0 ml-1">X</button>
            </div>
        </div>
    );
  };

  const renderShop = () => (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm z-[200] flex items-center justify-center p-6 animate-in fade-in duration-300">
        <div className="bg-slate-900 w-full max-w-xs rounded-[2.5rem] border-2 border-slate-800 p-6 shadow-2xl relative">
            <button onClick={() => setIsShopOpen(false)} className="absolute -top-3 -right-3 bg-red-500 hover:bg-red-600 text-white w-8 h-8 rounded-full font-black text-xs transition-colors">X</button>
            <div className="text-center mb-6">
                <h3 className="text-amber-500 font-black italic text-xl uppercase tracking-tighter">Tienda PIXEL <span className="text-indigo-500">QUEST</span></h3>
                <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Yape • Plin • PayPal</p>
            </div>
            <div className="grid gap-3 mb-6">
                {[{ coins: 100, price: "S/ 2.00" }, { coins: 500, price: "S/ 5.00" }, { coins: 1200, price: "S/ 10.00" }].map((pack) => (
                    <a key={pack.coins} href={`https://wa.me/51910243285?text=Compra%20${pack.coins}%20monedas`} target="_blank" rel="noreferrer" className="flex items-center justify-between bg-slate-800/50 border border-slate-700 p-4 rounded-2xl hover:border-green-500 active:scale-95 transition-all">
                        <div className="text-left">
                            <span className="block font-black text-lg leading-none text-white">{pack.coins}</span>
                            <span className="text-[8px] text-slate-500 font-bold uppercase">Monedas</span>
                        </div>
                        <div className="bg-green-600 px-3 py-1.5 rounded-lg text-[10px] font-black text-white">{pack.price}</div>
                    </a>
                ))}
            </div>
            <div className="flex gap-2">
                <input type="text" placeholder="PEGAR CÓDIGO AQUÍ" value={couponInput} onChange={(e) => setCouponInput(e.target.value)} className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-[10px] font-bold text-indigo-400 uppercase outline-none"/>
                <button onClick={handleRedeemCoupon} className="bg-indigo-600 px-4 py-2 rounded-xl text-[10px] font-black active:scale-95">OK</button>
            </div>
        </div>
    </div>
  );

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-indigo-500 font-bold tracking-widest animate-pulse">CARGANDO...</div>;

  // 1. VISTA CATEGORÍAS
  if (view === 'categories') {
    const categoryNames = [...new Set(levels.map(l => l.categoria))];
    return (
      /* Contenedor principal con scroll habilitado */
      <div className="h-screen bg-slate-950 overflow-y-auto custom-scroll">
        <div className="p-6 text-white max-w-md mx-auto pb-24">
          
          {renderNotification()}
          
          <header className="flex justify-between items-center mb-10">
            <button 
              onClick={() => supabase.auth.signOut()} 
              className="text-[10px] text-slate-600 font-black tracking-widest uppercase hover:text-red-500 transition-colors"
            >
              SALIR
            </button>
            
            <h1 className="text-2xl font-black italic tracking-tighter uppercase leading-none">
              PIXEL <span className="text-indigo-500">QUEST</span>
            </h1>

            <div className="flex gap-2 items-center">
              <button 
                onClick={() => setIsShopOpen(true)} 
                className="bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/50 flex items-center gap-1.5 active:scale-95 transition-all"
              >
                <span className="text-amber-500 font-black text-xs tabular-nums">{coins}</span>
                <span className="text-amber-500 text-[10px] font-bold">+</span>
              </button>
              {isAdmin && (
                <button 
                  onClick={() => setIsAdminOpen(true)} 
                  className="text-xs bg-slate-800 hover:bg-slate-700 p-2 rounded-lg transition-colors"
                >
                  ⚙️
                </button>
              )}
            </div>
          </header>

          <div className="grid gap-6">
            {categoryNames.map(cat => {
              const levelWithPortada = levels.find(l => l.categoria === cat && l.cat_portada_url);
              const bgImage = levelWithPortada ? levelWithPortada.cat_portada_url : levels.find(l => l.categoria === cat)?.imagen_url;
              
              return (
                <button 
                  key={cat} 
                  onClick={() => { setSelectedCat(cat); setView('subcategories'); }} 
                  className="group relative h-44 w-full rounded-[2.5rem] overflow-hidden border-2 border-slate-800 hover:border-indigo-500 active:scale-95 transition-all shadow-2xl shrink-0"
                >
                  {bgImage && (
                    <img 
                      src={bgImage} 
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                      alt={cat} 
                    />
                  )}
                  {/* Overlay gradiente para asegurar legibilidad del texto */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                  
                  <div className="absolute bottom-6 left-8 text-left">
                    <h3 className="text-3xl font-black uppercase italic tracking-tighter leading-none">
                      {cat || 'GENERAL'}
                    </h3>
                  </div>
                </button>
              );
            })}
          </div>

          {isShopOpen && renderShop()}
          {isAdminOpen && <AdminPanel onClose={() => setIsAdminOpen(false)} />}
        </div>
      </div>
    );
  }

  // 2. VISTA SUBCATEGORÍAS
  if (view === 'subcategories') {
    const subs = [...new Set(levels.filter(l => l.categoria === selectedCat).map(l => l.subcategoria))];
    return (
      <div className="min-h-screen bg-slate-950 p-6 text-white max-w-md mx-auto">
        {renderNotification()}
        <div className="flex justify-between items-center mb-6">
            <button onClick={() => setView('categories')} className="text-xs text-slate-500 hover:text-white font-black uppercase tracking-widest transition-colors">← Categorías</button>
            <div className="flex gap-2 items-center">
                <button onClick={() => setIsShopOpen(true)} className="bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/50 flex items-center gap-1.5 active:scale-95 transition-all">
                    <span className="text-amber-500 font-black text-xs tabular-nums">{coins}</span>
                </button>
            </div>
        </div>
        
        <h2 className="text-2xl font-black mb-6 text-indigo-500 uppercase tracking-tighter leading-none italic">{selectedCat}</h2>
        <div className="grid gap-6">
          {subs.map((sub, index) => {
            // BUSCAR LA IMAGEN DE PORTADA ESPECÍFICA EN CUALQUIER NIVEL DE ESTA SUB
            const levelWithSubPortada = levels.find(l => l.subcategoria === sub && l.sub_portada_url !== '' && l.sub_portada_url !== null);
            
            const firstLvl = levels.find(l => l.subcategoria === sub);
            const isLocked = index !== 0 && firstLvl?.id > userProgreso && userProgreso !== 0;
            
            // Si encontramos una portada específica la usamos, sino la imagen del primer nivel
            const subImage = levelWithSubPortada ? levelWithSubPortada.sub_portada_url : firstLvl?.imagen_url;

            return (
              <button key={sub} disabled={isLocked} onClick={() => startAtLastLevel(sub)}
                className={`group relative h-32 w-full rounded-[2rem] overflow-hidden border-2 transition-all shadow-xl ${
                    isLocked ? 'border-slate-900 opacity-40 grayscale' : 'border-slate-800 hover:border-indigo-400 active:scale-95'
                }`}>
                {subImage && <img src={subImage} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={sub} />}
                
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/60 to-transparent" />
                
                <div className="absolute inset-y-0 left-6 flex items-center justify-between right-6">
                  <span className="font-black uppercase italic tracking-tighter text-xl text-white">{sub}</span>
                  {isLocked ? <span className="text-xl">🔒</span> : <span className="bg-indigo-600 px-3 py-1 rounded-lg text-[10px] font-black italic">JUGAR</span>}
                </div>
              </button>
            );
          })}
        </div>
        {isShopOpen && renderShop()}
        {isAdminOpen && <AdminPanel onClose={() => setIsAdminOpen(false)} />}
      </div>
    );
  }

  // 3. VISTA MAPA DE NIVELES
  if (view === 'level_map') {
    return (
      /* 1. CAMBIO: h-screen y overflow-y-auto para poder bajar */
      <div className="h-screen bg-slate-950 overflow-y-auto custom-scroll">
        <div className="p-6 text-white max-w-md mx-auto pb-24 relative">
          
          {renderNotification()}
          
          <header className="flex justify-between items-center mb-10">
            <button 
              onClick={() => setView('subcategories')} 
              className="text-[10px] text-slate-500 hover:text-white font-black uppercase tracking-widest transition-colors"
            >
              ← Volver
            </button>
            
            <div className="text-center">
              <h1 className="text-xl font-black italic tracking-tighter uppercase leading-none">
                NIVELES
              </h1>
              <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-[0.2em]">
                {selectedSub}
              </span>
            </div>

            <button 
              onClick={() => setIsShopOpen(true)} 
              className="bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/50 flex items-center gap-1.5 active:scale-95 transition-all"
            >
              <span className="text-amber-500 font-black text-xs tabular-nums">{coins}</span>
              <span className="text-amber-500 text-[10px] font-bold">+</span>
            </button>
          </header>

          <div className="grid grid-cols-4 gap-4">
            {filteredLevels.map((lvl, idx) => {
              /* Mantenemos tu lógica de bloqueo original */
              const isLocked = lvl.id > userProgreso && idx !== 0;
              const isCurrent = idx === levelIndex;
              
              return (
                <button 
                  key={lvl.id} 
                  disabled={isLocked} 
                  onClick={() => { setLevelIndex(idx); setView('playing'); }}
                  className={`aspect-square rounded-2xl flex items-center justify-center font-black transition-all relative ${
                    isCurrent ? 'bg-indigo-600 text-white shadow-[0_5px_0_0_#3730a3] scale-105 z-10' :
                    isLocked ? 'bg-slate-900 text-slate-700 opacity-50 cursor-not-allowed border border-slate-800' : 
                    'bg-slate-800 text-indigo-300 shadow-[0_5px_0_0_#1e1b4b] active:translate-y-1 active:shadow-none'
                  }`}
                >
                  {isLocked ? '🔒' : idx + 1}
                  {isCurrent && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full animate-ping"></div>
                  )}
                </button>
              );
            })}
          </div>
          
          {isShopOpen && renderShop()}
        </div>
      </div>
    );
}

  // 4. VISTA DE JUEGO (PLAYING)
  return (
  /* h-screen y overflow-hidden evitan que aparezca el scroll de la página y se corten las letras */
  <div className="flex flex-col h-screen max-w-md mx-auto p-4 bg-slate-950 text-white relative overflow-hidden">
    {renderNotification()}
    
    <header className="flex justify-between items-center mb-3 shrink-0">
      <button onClick={() => setView('level_map')} className="text-[10px] text-slate-500 hover:text-white font-black uppercase tracking-widest transition-colors">← Mapa</button>
      <div className="bg-slate-800/50 px-4 py-1.5 rounded-full border border-slate-700 text-[10px] font-black uppercase text-indigo-400 truncate max-w-[150px] tracking-tight">
        {selectedSub} · NIVEL {levelIndex + 1}
      </div>
      <button onClick={() => setIsShopOpen(true)} className="bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/50 flex items-center gap-1.5 active:scale-95 transition-all">
        <span className="text-amber-500 font-black text-xs tabular-nums">{coins}</span>
        <span className="text-amber-500/60 text-xs font-bold">+</span>
      </button>
    </header>

    <h2 className="text-[10px] font-black text-slate-400 text-center mb-2 uppercase tracking-[0.2em] px-2 shrink-0">
      {currentLevel?.pregunta}
    </h2>

    {/* El contenedor de imagen ahora es flexible (flex-1) y no permite que la imagen empuje lo de abajo */}
    <div className={`relative flex-1 min-h-0 w-full rounded-[2.5rem] border-4 flex items-center justify-center mb-4 overflow-hidden transition-all shadow-2xl ${
      status === 'success' ? 'border-green-500 bg-green-500/10' : 
      status === 'error' ? 'border-red-500 bg-red-500/10' : 
      'border-slate-800 bg-slate-900/50'
    }`}>
      <img 
        src={currentLevel?.imagen_url} 
        /* object-contain hace que la imagen se adapte al hueco disponible sin salirse */
        className="w-full h-full object-contain bg-slate-900/20 animate-in fade-in duration-500" 
        alt="Quiz" 
      />
    </div>

    {/* Ayudas compactas */}
    <div className="flex gap-3 w-full mb-4 shrink-0">
      <button onClick={revealHint} disabled={coins < 30 || status !== 'playing'} className="flex-1 bg-slate-900 border border-slate-800 p-2 rounded-2xl flex flex-col items-center disabled:opacity-30 active:scale-95 transition-all group shadow-md">
        <span className="text-[9px] text-slate-500 group-hover:text-white uppercase font-black tracking-widest mb-1 transition-colors">Revelar</span>
        <span className="text-amber-500 font-bold text-xs">💰 30</span>
      </button>
      <button onClick={skipLevel} disabled={coins < 80 || status !== 'playing'} className="flex-1 bg-slate-900 border border-slate-800 p-2 rounded-2xl flex flex-col items-center disabled:opacity-30 active:scale-95 transition-all group shadow-md">
        <span className="text-[9px] text-slate-500 group-hover:text-white uppercase font-black tracking-widest mb-1 transition-colors">Saltar</span>
        <span className="text-amber-500 font-bold text-xs">💰 80</span>
      </button>
    </div>

    {/* Espacio de respuesta ajustable */}
    <div className="flex gap-1 mb-4 flex-wrap justify-center min-h-[40px] shrink-0">
      {selectedLetters.map((slot, i) => (
        <div key={i} onClick={() => handleRemove(i)} className={`w-8 h-10 flex items-center justify-center text-lg font-black rounded-t-lg border-b-4 transition-all cursor-pointer shadow-inner ${
          status === 'success' ? 'bg-green-600 border-green-800 animate-pulse' :
          status === 'error' ? 'bg-red-600 border-red-800' :
          slot ? 'bg-indigo-600 border-indigo-800 scale-105' : 'bg-slate-800 border-slate-700 text-transparent'
        }`}>
          {slot?.char}
        </div>
      ))}
    </div>

    {/* Teclado con tamaño controlado */}
    <div className="grid grid-cols-6 gap-1.5 mb-2 p-2 bg-slate-900 rounded-2xl border border-slate-800 shadow-inner shrink-0">
      {availableLetters.map((l) => (
        <button key={l.id} disabled={l.used || status === 'success'} onClick={() => handleSelect(l)}
          className={`aspect-square rounded-xl font-black text-lg transition-all shadow-md ${
            l.used ? 'bg-slate-900 text-slate-800 scale-95 opacity-50' : 'bg-white text-slate-900 active:scale-75 shadow-[0_3px_0_0_#cbd5e1]'
          }`}>
          {l.char}
        </button>
      ))}
    </div>

    {isShopOpen && renderShop()}
    {isAdminOpen && <AdminPanel onClose={() => setIsAdminOpen(false)} />}
  </div>
);
};

export default Game;