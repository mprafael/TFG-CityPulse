import { Bus, TrainFront, CarFront, Filter, ChevronDown, ChevronUp, Route, Bookmark, Plus, Save, List, Trash2 } from 'lucide-react';

/**
 * Main control panel component for map interactions.
 * Handles fleet filtering, route creation, and saved routes visualization.
 */
export default function MapControlPanel({
  isMenuOpen, setIsMenuOpen, menuTab, setMenuTab,
  activeFilters, toggleFilter, isRoutingMode, setIsRoutingMode,
  routeData, routeInfo, origin, destination,
  routeName, setRouteName, handleSaveRoute, isSaving, clearRoute,
  isAuth, savedRoutes, handlePreviewRoute, handleDeleteRoute
}) {
  
  // Local UI helper
  const renderIcon = (type) => {
    if (type === 'bus') return <Bus size={18} />;
    if (type === 'metro') return <TrainFront size={18} />;
    if (type === 'vtc' || type === 'taxi') return <CarFront size={18} />;
  };

  return (
    <div className="absolute top-6 left-6 z-10 w-80 flex flex-col gap-3">
      
      {/* Panel Header Toggle */}
      <button 
        onClick={() => setIsMenuOpen(!isMenuOpen)} 
        className="bg-white p-4 rounded-xl shadow-xl border border-gray-100 flex items-center justify-between w-full hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Route size={20} className="text-citypulse-blue" />
          <h3 className="text-lg font-extrabold text-gray-900">Panel de Control</h3>
        </div>
        {isMenuOpen ? <ChevronUp size={20} className="text-gray-400"/> : <ChevronDown size={20} className="text-gray-400"/>}
      </button>

      {/* Main Panel Content */}
      {isMenuOpen && (
        <div className="bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden animate-fade-in origin-top">
          
          {/* Navigation Tabs */}
          <div className="flex border-b border-gray-100 bg-gray-50">
            <button onClick={() => setMenuTab('filters')} className={`flex-1 py-3 text-xs font-bold flex flex-col items-center gap-1 transition-colors ${menuTab === 'filters' ? 'text-citypulse-blue border-b-2 border-citypulse-blue bg-white' : 'text-gray-400 hover:text-gray-600'}`}>
              <Filter size={16} /> Filtros
            </button>
            <button onClick={() => setMenuTab('create')} className={`flex-1 py-3 text-xs font-bold flex flex-col items-center gap-1 transition-colors ${menuTab === 'create' ? 'text-citypulse-blue border-b-2 border-citypulse-blue bg-white' : 'text-gray-400 hover:text-gray-600'}`}>
              <Plus size={16} /> Crear Ruta
            </button>
            <button onClick={() => setMenuTab('saved')} className={`flex-1 py-3 text-xs font-bold flex flex-col items-center gap-1 transition-colors ${menuTab === 'saved' ? 'text-citypulse-blue border-b-2 border-citypulse-blue bg-white' : 'text-gray-400 hover:text-gray-600'}`}>
              <Bookmark size={16} /> Mis Rutas
            </button>
          </div>

          <div className="p-4 max-h-[400px] overflow-y-auto">
            
            {/* --- TAB 1: FLEET FILTERS --- */}
            {menuTab === 'filters' && (
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-bold text-gray-700">Vehículos en vivo</span>
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-100">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> LIVE
                  </span>
                </div>
                <button onClick={() => toggleFilter('bus')} className={`flex items-center justify-between w-full p-3 rounded-lg border-2 transition-all font-semibold ${activeFilters.bus ? 'border-blue-500 bg-blue-50 text-blue-800' : 'border-gray-200 bg-white text-gray-400'}`}>
                  <span className="flex items-center gap-2">{renderIcon('bus')} Autobuses EMT</span>{activeFilters.bus && <div className="w-3 h-3 rounded-full bg-blue-500"></div>}
                </button>
                <button onClick={() => toggleFilter('metro')} className={`flex items-center justify-between w-full p-3 rounded-lg border-2 transition-all font-semibold ${activeFilters.metro ? 'border-emerald-500 bg-emerald-50 text-emerald-800' : 'border-gray-200 bg-white text-gray-400 hover:border-emerald-200'}`}>
                  <span className="flex items-center gap-2">{renderIcon('metro')} Metro Málaga</span>{activeFilters.metro && <div className="w-3 h-3 rounded-full bg-emerald-500"></div>}
                </button>
                <button onClick={() => toggleFilter('vtc')} className={`flex items-center justify-between w-full p-3 rounded-lg border-2 transition-all font-semibold ${activeFilters.vtc ? 'border-slate-800 bg-slate-100 text-slate-900' : 'border-gray-200 bg-white text-gray-400'}`}>
                  <span className="flex items-center gap-2">{renderIcon('vtc')} VTC</span>{activeFilters.vtc && <div className="w-3 h-3 rounded-full bg-slate-800"></div>}
                </button>
                <button onClick={() => toggleFilter('taxi')} className={`flex items-center justify-between w-full p-3 rounded-lg border-2 transition-all font-semibold ${activeFilters.taxi ? 'border-yellow-400 bg-yellow-50 text-yellow-800' : 'border-gray-200 bg-white text-gray-400'}`}>
                  <span className="flex items-center gap-2">{renderIcon('taxi')} Taxis</span>{activeFilters.taxi && <div className="w-3 h-3 rounded-full bg-yellow-400"></div>}
                </button>
              </div>
            )}

            {/* --- TAB 2: ROUTE CREATION --- */}
            {menuTab === 'create' && (
              <div className="flex flex-col gap-4">
                {!isRoutingMode && !routeData ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500 mb-4">Calcula trayectos y guárdalos en tu perfil.</p>
                    <button onClick={() => setIsRoutingMode(true)} className="w-full bg-citypulse-blue text-white font-bold py-3 rounded-lg shadow flex items-center justify-center gap-2 hover:bg-blue-700 transition-all active:scale-95">
                      <Plus size={18} /> Iniciar nueva ruta
                    </button>
                  </div>
                ) : (
                  <div className="animate-fade-in">
                    {!destination ? (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                        <p className="text-sm font-bold text-citypulse-blue mb-1">Modo Dibujo Activo</p>
                        <p className="text-xs text-gray-600">Haz clic en el mapa para marcar el {origin ? 'Destino (Punto B)' : 'Origen (Punto A)'}</p>
                        <button onClick={clearRoute} className="mt-3 text-xs text-red-500 font-bold hover:underline">Cancelar</button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-sm">
                          <div className="flex justify-between mb-1"><span className="text-gray-500">Distancia:</span> <span className="font-bold text-gray-900">{routeInfo?.distance} km</span></div>
                          <div className="flex justify-between"><span className="text-gray-500">Tiempo estimado:</span> <span className="font-bold text-gray-900">{routeInfo?.duration} min</span></div>
                        </div>
                        
                        {isAuth ? (
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-700">Nombre de la ruta</label>
                            <input type="text" placeholder="Ej: Casa al trabajo" value={routeName} onChange={(e) => setRouteName(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none focus:border-citypulse-blue"/>
                            <div className="flex gap-2 pt-2">
                              <button onClick={clearRoute} className="flex-1 py-2 text-sm font-bold text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200">Limpiar</button>
                              <button onClick={handleSaveRoute} disabled={isSaving} className="flex-1 py-2 text-sm font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 flex items-center justify-center gap-1">
                                <Save size={16} /> {isSaving ? '...' : 'Guardar'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg text-center">
                            <p className="text-xs text-orange-700 mb-2">Inicia sesión para guardar esta ruta en tu perfil.</p>
                            <button onClick={clearRoute} className="w-full py-1.5 text-xs font-bold text-gray-500 bg-white border border-gray-200 rounded-md hover:bg-gray-50">Limpiar mapa</button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* --- TAB 3: SAVED ROUTES --- */}
            {menuTab === 'saved' && (
              <div>
                {!isAuth ? (
                  <div className="text-center py-6">
                    <Bookmark size={32} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-sm text-gray-500">Inicia sesión para acceder a tus rutas guardadas.</p>
                  </div>
                ) : savedRoutes.length === 0 ? (
                  <div className="text-center py-6">
                    <List size={32} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-sm text-gray-500">Aún no tienes rutas guardadas.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {savedRoutes.map((route) => (
                      <div key={route.id} className="bg-white border border-gray-200 rounded-lg p-3 hover:border-citypulse-blue transition-colors group">
                        <h4 className="font-bold text-gray-900 text-sm mb-1">{route.name}</h4>
                        <div className="flex justify-between text-xs text-gray-500 mb-3">
                          <span>{route.distance} km</span>
                          <span>{route.duration} min</span>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handlePreviewRoute(route)} className="flex-1 bg-blue-50 text-citypulse-blue font-bold py-1.5 rounded text-xs hover:bg-blue-100 transition-colors">
                            Ver en mapa
                          </button>
                          <button onClick={() => handleDeleteRoute(route.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors" title="Borrar ruta">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}