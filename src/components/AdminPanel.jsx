import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

const AdminPanel = ({ onClose }) => {
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    pregunta: '',
    respuesta: '',
    imagen_url: '',
    categoria: '',
    subcategoria: '',
    cat_portada_url: '',
    sub_portada_url: '' // Nuevo campo
  });

  useEffect(() => {
    fetchLevels();
  }, []);

  const fetchLevels = async () => {
    const { data } = await supabase
      .from('levels')
      .select('*')
      .order('id', { ascending: true });
    if (data) setLevels(data);
  };

  const generateCoupon = async (amount) => {
    setLoading(true);
    const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase();
    const newCode = `PACK-${amount}-${randomStr}`;

    const { error } = await supabase
      .from('coupons')
      .insert([{ 
        code: newCode, 
        amount: amount, 
        is_used: false 
      }]);

    if (error) {
      alert("Error al crear el código: " + error.message);
    } else {
      await navigator.clipboard.writeText(newCode);
      alert(`✅ CÓDIGO GENERADO: ${newCode}\n\nSe ha copiado al portapapeles.`);
    }
    setLoading(false);
  };

  const generateGrid = (word) => {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let result = word.toUpperCase().trim().split("");
    while (result.length < 12) {
      result.push(alphabet[Math.floor(Math.random() * alphabet.length)]);
    }
    return result.sort(() => Math.random() - 0.5).join("");
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const levelData = {
      pregunta: form.pregunta,
      respuesta: form.respuesta.toUpperCase().trim(),
      imagen_url: form.imagen_url,
      categoria: form.categoria.trim() || 'General',
      subcategoria: form.subcategoria.trim() || 'Varios',
      cat_portada_url: form.cat_portada_url.trim(),
      sub_portada_url: form.sub_portada_url.trim(), // Guardamos la foto de subcategoría
      letras_grid: generateGrid(form.respuesta)
    };

    if (editingId) {
      await supabase.from('levels').update(levelData).eq('id', editingId);
      setEditingId(null);
    } else {
      await supabase.from('levels').insert([levelData]);
    }

    setForm({ 
        pregunta: '', respuesta: '', imagen_url: '', 
        categoria: '', subcategoria: '', 
        cat_portada_url: '', sub_portada_url: '' 
    });
    fetchLevels();
    setLoading(false);
  };

  // Dentro de AdminPanel.js, busca handleEdit y asegúrate de que esté así:
const handleEdit = (lvl) => {
  setEditingId(lvl.id);
  setForm({
    pregunta: lvl.pregunta || '',
    respuesta: lvl.respuesta || '',
    imagen_url: lvl.imagen_url || '',
    categoria: lvl.categoria || '',
    subcategoria: lvl.subcategoria || '',
    cat_portada_url: lvl.cat_portada_url || '',
    sub_portada_url: lvl.sub_portada_url || '' // Asegurar que se cargue al editar
  });
};

  const handleDelete = async (id) => {
    if (window.confirm("¿Seguro que quieres eliminar este nivel?")) {
      await supabase.from('levels').delete().eq('id', id);
      fetchLevels();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm z-[100] p-4 overflow-y-auto">
      <div className="max-w-md mx-auto bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-2xl text-white">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-black italic tracking-tighter uppercase">ADMIN<span className="text-indigo-500">QUIZ</span></h2>
          <button onClick={onClose} className="text-red-400 font-bold text-xs uppercase tracking-widest">Cerrar</button>
        </div>

        {/* GENERADOR DE MONEDAS */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-amber-500/30 mb-8">
          <h3 className="text-amber-500 font-black text-[10px] uppercase tracking-widest mb-3 text-center">GENERADOR DE MONEDAS</h3>
          <div className="grid grid-cols-3 gap-2">
            {[100, 500, 1200].map(amt => (
                <button key={amt} disabled={loading} onClick={() => generateCoupon(amt)} 
                    className="bg-slate-800 hover:bg-slate-700 border border-slate-700 p-2 rounded-xl flex flex-col items-center transition-all active:scale-95">
                    <span className={`text-xs font-black ${amt === 1200 ? 'text-indigo-400' : amt === 500 ? 'text-amber-500' : ''}`}>{amt}</span>
                    <span className="text-[8px] text-slate-400 uppercase">Monedas</span>
                </button>
            ))}
          </div>
        </div>

        {/* FORMULARIO */}
        <form onSubmit={handleSave} className="flex flex-col gap-3 mb-10">
          <h3 className="text-slate-500 font-bold text-[10px] uppercase tracking-widest mb-1">{editingId ? 'Editando nivel' : 'Crear nuevo nivel'}</h3>
          
          <div className="grid grid-cols-2 gap-2">
            <input className="bg-slate-800 p-3 rounded-xl border border-slate-700 outline-none focus:border-indigo-500 text-sm" placeholder="Categoría" value={form.categoria} onChange={e => setForm({...form, categoria: e.target.value})} required />
            <input className="bg-slate-800 p-3 rounded-xl border border-slate-700 outline-none focus:border-indigo-500 text-sm" placeholder="Subcategoría" value={form.subcategoria} onChange={e => setForm({...form, subcategoria: e.target.value})} required />
          </div>

          <div className="space-y-2">
            <input className="bg-slate-800 p-3 rounded-xl border border-indigo-500/30 w-full outline-none focus:border-indigo-500 text-[11px] text-indigo-200" placeholder="URL Portada Categoría" value={form.cat_portada_url} onChange={e => setForm({...form, cat_portada_url: e.target.value})} />
            <input className="bg-slate-800 p-3 rounded-xl border border-indigo-500/30 w-full outline-none focus:border-indigo-500 text-[11px] text-indigo-200" placeholder="URL Portada Subcategoría (Serie)" value={form.sub_portada_url} onChange={e => setForm({...form, sub_portada_url: e.target.value})} />
          </div>

          <input className="bg-slate-800 p-3 rounded-xl border border-slate-700 outline-none focus:border-indigo-500 text-sm" placeholder="Pregunta o Pista" value={form.pregunta} onChange={e => setForm({...form, pregunta: e.target.value})} required />
          <input className="bg-slate-800 p-3 rounded-xl border border-slate-700 outline-none focus:border-indigo-500 text-sm font-mono uppercase" placeholder="Respuesta" value={form.respuesta} onChange={e => setForm({...form, respuesta: e.target.value})} required />
          <input className="bg-slate-800 p-3 rounded-xl border border-slate-700 outline-none focus:border-indigo-500 text-sm" placeholder="URL Imagen Personaje" value={form.imagen_url} onChange={e => setForm({...form, imagen_url: e.target.value})} required />
          
          <button disabled={loading} className="bg-indigo-600 hover:bg-indigo-500 p-4 rounded-xl font-black shadow-lg active:scale-95 transition-all mt-2 uppercase text-sm">
            {loading ? 'Procesando...' : editingId ? 'Guardar Cambios' : 'Añadir Nivel'}
          </button>
          
          {editingId && (
            <button type="button" onClick={() => {setEditingId(null); setForm({pregunta:'', respuesta:'', imagen_url:'', categoria:'', subcategoria:'', cat_portada_url: '', sub_portada_url: ''})}} className="text-slate-500 text-[10px] uppercase font-bold text-center mt-1">Cancelar Edición</button>
          )}
        </form>

        {/* LISTADO */}
        <div className="space-y-3">
          <h3 className="text-slate-500 font-bold text-[10px] uppercase tracking-widest px-1">Niveles Existentes ({levels.length})</h3>
          <div className="grid gap-3">
            {levels.map((lvl) => (
              <div key={lvl.id} className="flex items-center justify-between bg-slate-800/50 p-3 rounded-2xl border border-slate-700/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-700 overflow-hidden shrink-0">
                    <img src={lvl.imagen_url} className="w-full h-full object-cover" alt="" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black text-white truncate">{lvl.respuesta}</p>
                    <div className="flex gap-1 overflow-x-hidden">
                       <span className="text-[6px] bg-indigo-500/20 text-indigo-400 px-1 py-0.5 rounded uppercase font-bold whitespace-nowrap">{lvl.categoria}</span>
                       <span className="text-[6px] bg-slate-700 text-slate-300 px-1 py-0.5 rounded uppercase font-bold whitespace-nowrap">{lvl.subcategoria}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => handleEdit(lvl)} className="bg-slate-700 p-1.5 rounded-lg text-[9px] font-black hover:bg-indigo-600 transition-colors">EDIT</button>
                  <button onClick={() => handleDelete(lvl.id)} className="bg-slate-800 p-1.5 rounded-lg text-[9px] font-black text-red-400 hover:bg-red-500 hover:text-white transition-colors">ELIM</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;