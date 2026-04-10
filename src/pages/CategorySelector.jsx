import React from 'react';

const CategorySelector = ({ levels, categoriesData, onSelectCat }) => {
  // Nota: Ahora usamos 'categoriesData' que viene de la nueva tabla de Supabase
  // para mostrar las portadas personalizadas.

  return (
    <div className="p-4 space-y-8 animate-in fade-in duration-500 max-w-md mx-auto">
      <div className="space-y-4">
        <h2 className="text-xl font-black text-indigo-400 uppercase tracking-widest px-2">
          Categorías Disponibles
        </h2>
        
        <div className="grid grid-cols-1 gap-6">
          {categoriesData.map((cat) => {
            // Contamos cuántos niveles totales tiene esta categoría
            const totalLevels = levels.filter(l => l.categoria === cat.nombre).length;

            return (
              <button
                key={cat.id}
                onClick={() => onSelectCat(cat.nombre)}
                className="relative group h-44 w-full rounded-[2.5rem] overflow-hidden border-2 border-slate-800 hover:border-indigo-500 transition-all active:scale-95 shadow-2xl"
              >
                {/* Capa de gradiente para legibilidad del texto */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent z-10" />
                
                {/* Imagen personalizada desde la columna imagen_url */}
                {cat.imagen_url ? (
                  <img 
                    src={cat.imagen_url} 
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                    alt={cat.nombre}
                  />
                ) : (
                  <div className="absolute inset-0 bg-slate-900" />
                )}

                {/* Información de la Categoría */}
                <div className="absolute bottom-6 left-8 z-20 text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-[2px] bg-indigo-500"></div>
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">
                      {totalLevels} Niveles totales
                    </span>
                  </div>
                  <h3 className="text-3xl font-black uppercase italic tracking-tighter leading-none text-white">
                    {cat.nombre}
                  </h3>
                </div>

                {/* Efecto de brillo al pasar el mouse */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-20 bg-gradient-to-tr from-white to-transparent transition-opacity duration-500" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CategorySelector;