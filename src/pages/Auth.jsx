import React, { useState } from 'react';
import { supabase } from '../services/supabase';
/* 1. Importamos los iconos */
import { Eye, EyeOff } from 'lucide-react';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  /* 2. Creamos el estado para mostrar/ocultar */
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await supabase.auth.signUp({ email, password });
    
    if (error) {
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

          {/* 3. El Input de contraseña con el Ojo */}
          <div className="relative">
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="Contraseña" 
              className="w-full bg-slate-800 border border-slate-700 p-4 rounded-xl text-white outline-none focus:border-indigo-500 pr-12"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-indigo-400 transition-colors"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

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