import React, { useState } from 'react';
import { supabase } from '../services/supabase';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Intenta registrarse; si ya existe, inicia sesión automáticamente
    const { error } = await supabase.auth.signUp({ email, password });
    
    if (error) {
      // Si el usuario ya existe, intentamos login normal
      const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
      if (loginError) alert(loginError.message);
    } else {
      alert("¡Cuenta creada! Revisa tu correo o entra directamente.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl">
        <h1 className="text-3xl font-black text-white text-center mb-2 italic">PIXEL QUEST</h1>
        <p className="text-slate-400 text-center mb-8 text-sm">Entra para guardar tus monedas</p>
        
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input 
            type="email" 
            placeholder="Tu email" 
            className="bg-slate-800 border border-slate-700 p-4 rounded-xl text-white outline-none focus:border-indigo-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input 
            type="password" 
            placeholder="Contraseña" 
            className="bg-slate-800 border border-slate-700 p-4 rounded-xl text-white outline-none focus:border-indigo-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button 
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold p-4 rounded-xl transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Cargando...' : '¡A JUGAR!'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Auth;