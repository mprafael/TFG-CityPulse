import { useState, useEffect } from 'react';
import Map, { Marker, Popup, Source, Layer } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Bus, TrainFront, CarFront, Navigation, Filter, Target, X, ChevronDown, ChevronUp, MapPin, Route, Bookmark, Plus, Save, List, Trash2, User, Star } from 'lucide-react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const socket = io('http://localhost:3000');

export default function MapPage() {
  const { user, isAuth } = useAuth(); 
  
  const [viewState, setViewState] = useState({
    longitude: -4.4214, latitude: 36.7213, zoom: 14
  });

  const [vehicles, setVehicles] = useState([]);
  const [activeFilters, setActiveFilters] = useState({ bus: false, metro: false, vtc: false, taxi: false });
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuTab, setMenuTab] = useState('filters');

  const [userLocation, setUserLocation] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  // NUEVO ESTADO: Saber si el usuario está haciendo zoom o arrastrando
  const [isMapInteracting, setIsMapInteracting] = useState(false);

  const [isRoutingMode, setIsRoutingMode] = useState(false);
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [routeData, setRouteData] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [routeName, setRouteName] = useState('');
  
  const [savedRoutes, setSavedRoutes] = useState([]); 
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    socket.on('vehiclesUpdate', (data) => {
      setVehicles(data);
      if (selectedVehicle) {
        const updated = data.find(v => v.id === selectedVehicle.id);
        if (updated) setSelectedVehicle(updated);
      }
    });
    return () => socket.off('vehiclesUpdate');
  }, [selectedVehicle]);

  useEffect(() => {
    const fetchSavedRoutes = async () => {
      if (!isAuth || !user?.id) return;
      try {
        const res = await fetch(`http://localhost:3000/api/routes/${user.id}`);
        if (res.ok) {
          const data = await res.json();
          setSavedRoutes(data);
        }
      } catch (error) {
        console.error("Error fetching routes:", error);
      }
    };
    fetchSavedRoutes();
  }, [isAuth, user?.id]);

  const handleMyLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { longitude, latitude } = position.coords;
        setUserLocation({ lng: longitude, lat: latitude });
        setViewState({ ...viewState, longitude, latitude, zoom: 16, transitionDuration: 2000 });
        socket.emit('spawnNearMe', { lat: latitude, lng: longitude });
      });
    }
  };

  const toggleFilter = (type) => setActiveFilters(prev => ({ ...prev, [type]: !prev[type] }));
  const filteredVehicles = vehicles.filter(vehicle => activeFilters[vehicle.type]);

  const renderIcon = (type) => {
    if (type === 'bus') return <Bus size={16} />;
    if (type === 'metro') return <TrainFront size={16} />;
    if (type === 'vtc' || type === 'taxi') return <CarFront size={16} />;
    return <div className="w-4 h-4 rounded-full bg-red-500" />;
  };

  const getMarkerColor = (type) => {
    if (type === 'bus') return 'bg-blue-500 text-white';
    if (type === 'metro') return 'bg-emerald-500 text-white';
    if (type === 'vtc') return 'bg-slate-900 text-white';
    if (type === 'taxi') return 'bg-yellow-400 text-black';
    return 'bg-gray-500 text-white';
  };

  const handleMapClick = async (e) => {
    if (!isRoutingMode) return;
    if (e.originalEvent.target.closest('.mapboxgl-marker')) return;

    const { lng, lat } = e.lngLat;

    if (!origin || (origin && destination)) {
      setOrigin({ lng, lat });
      setDestination(null);
      setRouteData(null);
      setRouteInfo(null);
    } else if (!destination) {
      setDestination({ lng, lat });
      fetchRoute({ lng, lat }, origin); 
    }
  };

  const fetchRoute = async (end, start) => {
    try {
      const query = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${start.lng},${start.lat};${end.lng},${end.lat}?geometries=geojson&overview=full&access_token=${MAPBOX_TOKEN}`
      );
      const json = await query.json();
      if (json.routes && json.routes.length > 0) {
        const data = json.routes[0];
        setRouteData(data.geometry);
        setRouteInfo({
          distance: (data.distance / 1000).toFixed(1),
          duration: Math.round(data.duration / 60)
        });
      }
    } catch (error) {
      console.error("Error calculando la ruta:", error);
    }
  };

  const handleSaveRoute = async () => {
    if (!routeName.trim()) return alert("Por favor, ponle un nombre a tu ruta.");
    setIsSaving(true);
    try {
      const res = await fetch('http://localhost:3000/api/routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: routeName,
          originLat: origin.lat, originLng: origin.lng,
          destLat: destination.lat, destLng: destination.lng,
          distance: routeInfo.distance, duration: routeInfo.duration,
          userId: user.id
        })
      });
      if (res.ok) {
        const newRoute = await res.json();
        setSavedRoutes([newRoute, ...savedRoutes]); 
        setMenuTab('saved'); 
        clearRoute();
      }
    } catch (error) {
      alert("Error al guardar la ruta");
      console.log(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRoute = async (routeId) => {
    if(!window.confirm("¿Borrar esta ruta?")) return;
    try {
      const res = await fetch(`http://localhost:3000/api/routes/${routeId}`, { method: 'DELETE' });
      if (res.ok) {
        setSavedRoutes(savedRoutes.filter(r => r.id !== routeId));
        clearRoute(); 
      }
    } catch (error) {
      alert("Error al borrar");
      console.log(error);
    }
  };

  const handlePreviewRoute = (route) => {
    setIsRoutingMode(true);
    const start = { lng: route.originLng, lat: route.originLat };
    const end = { lng: route.destLng, lat: route.destLat };
    setOrigin(start);
    setDestination(end);
    fetchRoute(end, start);
    setViewState({ ...viewState, longitude: start.lng, latitude: start.lat, zoom: 13, transitionDuration: 1500 });
  };

  const clearRoute = () => {
    setOrigin(null); setDestination(null); setRouteData(null);
    setRouteInfo(null); setRouteName(''); setIsRoutingMode(false);
  };

  return (
    <div className="relative w-full h-[calc(100vh-76px)] bg-gray-100 overflow-hidden">
      
      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        onClick={handleMapClick}
        // Eventos clave para desactivar la animación CSS cuando hacemos zoom
        onMoveStart={() => setIsMapInteracting(true)}
        onMoveEnd={() => setIsMapInteracting(false)}
        mapStyle="mapbox://styles/mapbox/light-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
        style={{ width: '100%', height: '100%' }}
        cursor={isRoutingMode ? 'crosshair' : 'grab'}
      >
        {routeData && (
          <Source id="route" type="geojson" data={routeData}>
            <Layer id="route-line" type="line" layout={{ 'line-join': 'round', 'line-cap': 'round' }} paint={{ 'line-color': '#3b82f6', 'line-width': 5, 'line-opacity': 0.8 }} />
          </Source>
        )}

        {origin && <Marker longitude={origin.lng} latitude={origin.lat} anchor="bottom"><div className="text-blue-600 animate-bounce"><MapPin size={36} fill="white" /></div></Marker>}
        {destination && <Marker longitude={destination.lng} latitude={destination.lat} anchor="bottom"><div className="text-red-500 animate-bounce"><MapPin size={36} fill="white" /></div></Marker>}

        {filteredVehicles.map((vehicle) => (
          <Marker 
            key={vehicle.id} 
            longitude={vehicle.lng} 
            latitude={vehicle.lat} 
            anchor="center"
            // 👇 SOLUCIÓN AL ZOOM 👇 
            // Si el usuario toca el mapa, quitamos la transición para evitar que "bailen" los iconos.
            style={{ transition: isMapInteracting ? 'none' : 'transform 2s linear' }}
          >
            <div 
              onClick={(e) => { e.stopPropagation(); setSelectedVehicle(vehicle); }} 
              className={`flex items-center justify-center p-2 rounded-full shadow-lg border-2 border-white cursor-pointer hover:scale-125 transition-transform duration-300 ${getMarkerColor(vehicle.type)}`}
            >
              {renderIcon(vehicle.type)}
            </div>
          </Marker>
        ))}

        {userLocation && (
          <Marker longitude={userLocation.lng} latitude={userLocation.lat} anchor="center">
            <div className="relative flex items-center justify-center">
              <div className="absolute w-10 h-10 bg-blue-500 rounded-full animate-ping opacity-25"></div>
              <div className="relative bg-blue-600 text-white p-2 rounded-full shadow-2xl border-2 border-white"><Navigation size={20} fill="currentColor" /></div>
            </div>
          </Marker>
        )}

        {selectedVehicle && (
          <Popup longitude={selectedVehicle.lng} latitude={selectedVehicle.lat} anchor="bottom" onClose={() => setSelectedVehicle(null)} closeOnClick={true} closeButton={false} offset={15} className="z-50">
            <div className="relative p-1 min-w-[200px]">
              
              {/* Botón de cerrar */}
              <button onClick={(e) => { e.stopPropagation(); setSelectedVehicle(null); }} className="absolute top-1 right-1 p-1 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors z-10"><X size={16} strokeWidth={2.5} /></button>
              
              {/* Cabecera genérica con el tipo de vehículo */}
              <div className="flex items-center gap-2 mb-3 border-b border-gray-100 pb-2 pr-6">
                <div className={`p-1.5 rounded-md shadow-sm ${getMarkerColor(selectedVehicle.type)}`}>{renderIcon(selectedVehicle.type)}</div>
                <div>
                  <span className="font-extrabold text-gray-900 block leading-tight">{selectedVehicle.label}</span>
                  <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">{selectedVehicle.type}</span>
                </div>
              </div>

              {/* CONTENIDO DINÁMICO POR TIPO DE VEHÍCULO */}
              
              {/* 1. DISEÑO AUTOBÚS Y METRO */}
              {(selectedVehicle.type === 'bus' || selectedVehicle.type === 'metro') && (
                <div className="px-1 pb-1">
                  <p className="text-xs text-gray-500 font-semibold mb-0.5">Dirección / Destino</p>
                  <p className="text-sm font-bold text-gray-800 bg-gray-50 p-2 rounded-md border border-gray-100">
                    {selectedVehicle.metadata?.destination || 'Ruta Circular'}
                  </p>
                </div>
              )}

              {/* 2. DISEÑO TAXI */}
              {selectedVehicle.type === 'taxi' && (
                <div className="px-1 pb-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-800">
                      <User size={14} className="text-gray-400" /> {selectedVehicle.metadata?.driver}
                    </div>
                    {/* Badge de Ocupado/Libre */}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${selectedVehicle.metadata?.occupied ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'}`}>
                      {selectedVehicle.metadata?.occupied ? 'OCUPADO' : 'LIBRE'}
                    </span>
                  </div>
                  <div className="bg-gray-50 p-1.5 rounded-md border border-gray-100 text-center">
                    <span className="text-xs font-mono font-bold tracking-widest text-gray-600">{selectedVehicle.metadata?.license}</span>
                  </div>
                </div>
              )}

              {/* 3. DISEÑO VTC (Uber/Cabify) */}
              {selectedVehicle.type === 'vtc' && (
                <div className="px-1 pb-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-800">
                      <User size={14} className="text-gray-400" /> {selectedVehicle.metadata?.driver}
                    </div>
                    <div className="flex items-center gap-0.5 bg-yellow-50 px-1.5 py-0.5 rounded border border-yellow-100">
                      <Star size={12} className="text-yellow-500 fill-yellow-500" />
                      <span className="text-xs font-bold text-yellow-700">{selectedVehicle.metadata?.rating}</span>
                    </div>
                  </div>
                  
                  <div className="bg-slate-50 p-2 rounded-md border border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-800 leading-tight">{selectedVehicle.metadata?.carModel}</p>
                      <p className="text-[10px] text-slate-500">{selectedVehicle.metadata?.carColor}</p>
                    </div>
                    <div className="bg-white px-1.5 py-1 rounded shadow-sm border border-gray-200">
                      <span className="text-[10px] font-mono font-bold tracking-widest text-gray-800">{selectedVehicle.metadata?.license}</span>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </Popup>
        )}
      </Map>

      <button onClick={handleMyLocation} className="absolute bottom-10 right-6 bg-white p-3 rounded-full shadow-2xl border border-gray-100 text-citypulse-blue hover:bg-gray-50 transition-all z-20 active:scale-95" title="Mi ubicación"><Target size={24} /></button>

      {/* --- PANEL DE CONTROL --- */}
      <div className="absolute top-6 left-6 z-10 w-80 flex flex-col gap-3">
        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="bg-white p-4 rounded-xl shadow-xl border border-gray-100 flex items-center justify-between w-full hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-3">
            <Route size={20} className="text-citypulse-blue" />
            <h3 className="text-lg font-extrabold text-gray-900">Panel de Control</h3>
          </div>
          {isMenuOpen ? <ChevronUp size={20} className="text-gray-400"/> : <ChevronDown size={20} className="text-gray-400"/>}
        </button>

        {isMenuOpen && (
          <div className="bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden animate-fade-in origin-top">
            <div className="flex border-b border-gray-100 bg-gray-50">
              <button onClick={() => setMenuTab('filters')} className={`flex-1 py-3 text-xs font-bold flex flex-col items-center gap-1 transition-colors ${menuTab === 'filters' ? 'text-citypulse-blue border-b-2 border-citypulse-blue bg-white' : 'text-gray-400 hover:text-gray-600'}`}><Filter size={16} /> Filtros</button>
              <button onClick={() => setMenuTab('create')} className={`flex-1 py-3 text-xs font-bold flex flex-col items-center gap-1 transition-colors ${menuTab === 'create' ? 'text-citypulse-blue border-b-2 border-citypulse-blue bg-white' : 'text-gray-400 hover:text-gray-600'}`}><Plus size={16} /> Crear Ruta</button>
              <button onClick={() => setMenuTab('saved')} className={`flex-1 py-3 text-xs font-bold flex flex-col items-center gap-1 transition-colors ${menuTab === 'saved' ? 'text-citypulse-blue border-b-2 border-citypulse-blue bg-white' : 'text-gray-400 hover:text-gray-600'}`}><Bookmark size={16} /> Mis Rutas</button>
            </div>

            <div className="p-4 max-h-[400px] overflow-y-auto">
              {menuTab === 'filters' && (
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-bold text-gray-700">Vehículos en vivo</span>
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-100"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> LIVE</span>
                  </div>
                  <button onClick={() => toggleFilter('bus')} className={`flex items-center justify-between w-full p-3 rounded-lg border-2 transition-all font-semibold ${activeFilters.bus ? 'border-blue-500 bg-blue-50 text-blue-800' : 'border-gray-200 bg-white text-gray-400'}`}><span className="flex items-center gap-2"><Bus size={18}/> Autobuses EMT</span>{activeFilters.bus && <div className="w-3 h-3 rounded-full bg-blue-500"></div>}</button>
                  <button onClick={() => toggleFilter('metro')} className={`flex items-center justify-between w-full p-3 rounded-lg border-2 transition-all font-semibold ${activeFilters.metro ? 'border-emerald-500 bg-emerald-50 text-emerald-800' : 'border-gray-200 bg-white text-gray-400 hover:border-emerald-200'}`}><span className="flex items-center gap-2"><TrainFront size={18}/> Metro de Málaga</span>{activeFilters.metro && <div className="w-3 h-3 rounded-full bg-emerald-500"></div>}</button>
                  <button onClick={() => toggleFilter('vtc')} className={`flex items-center justify-between w-full p-3 rounded-lg border-2 transition-all font-semibold ${activeFilters.vtc ? 'border-slate-800 bg-slate-100 text-slate-900' : 'border-gray-200 bg-white text-gray-400'}`}><span className="flex items-center gap-2"><CarFront size={18}/> VTC</span>{activeFilters.vtc && <div className="w-3 h-3 rounded-full bg-slate-800"></div>}</button>
                  <button onClick={() => toggleFilter('taxi')} className={`flex items-center justify-between w-full p-3 rounded-lg border-2 transition-all font-semibold ${activeFilters.taxi ? 'border-yellow-400 bg-yellow-50 text-yellow-800' : 'border-gray-200 bg-white text-gray-400'}`}><span className="flex items-center gap-2"><CarFront size={18} fill="currentColor"/> Taxis</span>{activeFilters.taxi && <div className="w-3 h-3 rounded-full bg-yellow-400"></div>}</button>
                </div>
              )}

              {menuTab === 'create' && (
                <div className="flex flex-col gap-4">
                  {!isRoutingMode && !routeData ? (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-500 mb-4">Calcula trayectos y guárdalos en tu perfil.</p>
                      <button onClick={() => setIsRoutingMode(true)} className="w-full bg-citypulse-blue text-white font-bold py-3 rounded-lg shadow flex items-center justify-center gap-2 hover:bg-blue-700 transition-all active:scale-95"><Plus size={18} /> Iniciar nueva ruta</button>
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
                            <button 
                              onClick={() => handlePreviewRoute(route)}
                              className="flex-1 bg-blue-50 text-citypulse-blue font-bold py-1.5 rounded text-xs hover:bg-blue-100 transition-colors"
                            >
                              Ver en mapa
                            </button>
                            <button 
                              onClick={() => handleDeleteRoute(route.id)}
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                              title="Borrar ruta"
                            >
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
    </div>
  );
}