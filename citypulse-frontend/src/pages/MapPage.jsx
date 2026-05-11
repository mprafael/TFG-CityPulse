import { useState, useEffect } from 'react';
import Map, { Marker, Popup } from 'react-map-gl/mapbox'; // OPCIÓN A: Añadimos Popup
import 'mapbox-gl/dist/mapbox-gl.css';
import { Bus, TrainFront, CarFront, Navigation, Filter, Target, X } from 'lucide-react'; // OPCIÓN B: Añadimos Target para el icono
import { io } from 'socket.io-client';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const socket = io('http://localhost:3000');

export default function MapPage() {
  const [viewState, setViewState] = useState({
    longitude: -4.4214,
    latitude: 36.7213,
    zoom: 14
  });

  const [vehicles, setVehicles] = useState([]);
  const [activeFilters, setActiveFilters] = useState({ bus: true, metro: true, vtc: true, taxi: true });

  const [userLocation, setUserLocation] = useState(null);
  
  // OPCIÓN A: Estado para el vehículo seleccionado (el que mostrará el popup)
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  useEffect(() => {
    socket.on('vehiclesUpdate', (data) => {
      setVehicles(data);
      
      // Si el vehículo que tenemos seleccionado se mueve, actualizamos sus datos en el popup
      if (selectedVehicle) {
        const updated = data.find(v => v.id === selectedVehicle.id);
        if (updated) setSelectedVehicle(updated);
      }
    });
    return () => socket.off('vehiclesUpdate');
  }, [selectedVehicle]);

  // MODIFICACIÓN: Función de ubicación actualizada
const handleMyLocation = () => {
  if ("geolocation" in navigator) {
    // Activamos el modo de alta precisión para que sea más exacto
    navigator.geolocation.getCurrentPosition((position) => {
      const { longitude, latitude } = position.coords;
      
      // 1. Guardamos la ubicación para dibujar el marcador
      setUserLocation({ lng: longitude, lat: latitude });

      // 2. Volamos con la cámara hacia allá
      setViewState({
        ...viewState,
        longitude: longitude,
        latitude: latitude,
        zoom: 16,
        transitionDuration: 2000
      });
    }, (error) => {
      console.error("Error:", error);
      alert("Asegúrate de dar permisos de ubicación en tu navegador.");
    });
  }
};

  const toggleFilter = (type) => {
    setActiveFilters(prev => ({ ...prev, [type]: !prev[type] }));
  };

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

  return (
    <div className="relative w-full h-[calc(100vh-76px)] bg-gray-100 overflow-hidden">
      
      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapStyle="mapbox://styles/mapbox/light-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
        style={{ width: '100%', height: '100%' }}
      >
        {filteredVehicles.map((vehicle) => (
          <Marker
            key={vehicle.id}
            longitude={vehicle.lng}
            latitude={vehicle.lat}
            anchor="center"
          >
            <div 
              // Al hacer clic, guardamos este vehículo como el seleccionado
              onClick={(e) => {
                e.stopPropagation();
                setSelectedVehicle(vehicle);
              }}
              className={`flex items-center justify-center p-2 rounded-full shadow-lg border-2 border-white cursor-pointer hover:scale-125 transition-all duration-1000 ease-linear ${getMarkerColor(vehicle.type)}`}
            >
              {renderIcon(vehicle.type)}
            </div>
          </Marker>
        ))}

        {/* 2. NUEVO: MARCADOR DE POSICIÓN DEL USUARIO */}
        {userLocation && (
          <Marker 
            longitude={userLocation.lng} 
            latitude={userLocation.lat} 
            anchor="center"
          >
            <div className="relative flex items-center justify-center">
              {/* Efecto de onda/pulso detrás del icono */}
              <div className="absolute w-10 h-10 bg-blue-500 rounded-full animate-ping opacity-25"></div>
              
              {/* El icono de Navigation que querías usar */}
              <div className="relative bg-blue-600 text-white p-2 rounded-full shadow-2xl border-2 border-white">
                <Navigation size={20} fill="currentColor" />
              </div>
            </div>
          </Marker>
        )}

        {/* Renderizado del Popup si hay un vehículo seleccionado */}
        {selectedVehicle && (
          <Popup
            longitude={selectedVehicle.lng}
            latitude={selectedVehicle.lat}
            anchor="bottom"
            onClose={() => setSelectedVehicle(null)}
            closeOnClick={true}   /* 1. CAMBIO: true para que se cierre al hacer clic en el mapa */
            closeButton={false}   /* 2. CAMBIO: Ocultamos la 'X' fea por defecto de Mapbox */
            offset={15}
            className="z-50"
          >
            {/* Contenedor principal con relative para poder posicionar nuestra propia 'X' */}
            <div className="relative p-2 min-w-[150px]">
              
              {/* 3. NUESTRO PROPIO BOTÓN DE CERRAR CON TAILWIND */}
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedVehicle(null);
                }}
                className="absolute top-0 right-0 p-1 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={16} strokeWidth={2.5} />
              </button>

              {/* Añadimos un poco de padding a la derecha (pr-5) para que el texto no pise la X */}
              <div className="flex items-center gap-2 mb-2 pr-5">
                <div className={`p-1.5 rounded-md ${getMarkerColor(selectedVehicle.type)}`}>
                  {renderIcon(selectedVehicle.type)}
                </div>
                <span className="font-bold text-gray-800 uppercase text-xs">{selectedVehicle.type}</span>
              </div>
              
              <h4 className="text-sm font-bold text-gray-900">{selectedVehicle.label}</h4>
              <p className="text-[10px] text-gray-400 mt-1">ID: {selectedVehicle.id}</p>
              
              <div className="mt-3 pt-2 border-t border-gray-100">
                <button className="text-xs text-citypulse-blue font-bold hover:underline">
                  Ver detalles →
                </button>
              </div>
            </div>
          </Popup>
        )}
      </Map>

      {/* Botón de Mi Ubicación (OPCIÓN B) */}
      <button 
        onClick={handleMyLocation}
        className="absolute bottom-10 right-6 bg-white p-3 rounded-full shadow-2xl border border-gray-100 text-citypulse-blue hover:bg-gray-50 transition-all z-20 active:scale-95"
        title="Mi ubicación"
      >
        <Target size={24} />
      </button>

      {/* Panel de Filtros (Ya lo teníamos) */}
      <div className="absolute top-6 left-6 bg-white p-5 rounded-xl shadow-xl border border-gray-100 z-10 w-80">
        <div className="flex items-center justify-between mb-4 border-b pb-3">
          <h3 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
            <Filter size={20} className="text-citypulse-blue" />
            Filtros del Mapa
          </h3>
          <span className="flex items-center gap-1.5 text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-100">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            LIVE
          </span>
        </div>
        
        <div className="flex flex-col gap-3">
          <button onClick={() => toggleFilter('bus')} className={`flex items-center justify-between w-full p-3 rounded-lg border-2 transition-all font-semibold ${activeFilters.bus ? 'border-blue-500 bg-blue-50 text-blue-800' : 'border-gray-200 bg-white text-gray-400'}`}>
            <span className="flex items-center gap-2"><Bus size={18}/> Autobuses EMT</span>
            {activeFilters.bus && <div className="w-3 h-3 rounded-full bg-blue-500"></div>}
          </button>

          <button 
            onClick={() => toggleFilter('metro')} 
            className={`flex items-center justify-between w-full p-3 rounded-lg border-2 transition-all font-semibold ${activeFilters.metro ? 'border-emerald-500 bg-emerald-50 text-emerald-800' : 'border-gray-200 bg-white text-gray-400 hover:border-emerald-200'}`}>
            <span className="flex items-center gap-2"><TrainFront size={18}/> Metro de Málaga</span>
            {activeFilters.metro && <div className="w-3 h-3 rounded-full bg-emerald-500"></div>}
          </button>

          <button onClick={() => toggleFilter('vtc')} className={`flex items-center justify-between w-full p-3 rounded-lg border-2 transition-all font-semibold ${activeFilters.vtc ? 'border-slate-800 bg-slate-100 text-slate-900' : 'border-gray-200 bg-white text-gray-400'}`}>
            <span className="flex items-center gap-2"><CarFront size={18}/> VTC</span>
            {activeFilters.vtc && <div className="w-3 h-3 rounded-full bg-slate-800"></div>}
          </button>

          <button onClick={() => toggleFilter('taxi')} className={`flex items-center justify-between w-full p-3 rounded-lg border-2 transition-all font-semibold ${activeFilters.taxi ? 'border-yellow-400 bg-yellow-50 text-yellow-800' : 'border-gray-200 bg-white text-gray-400'}`}>
            <span className="flex items-center gap-2"><CarFront size={18} fill="currentColor"/> Taxis</span>
            {activeFilters.taxi && <div className="w-3 h-3 rounded-full bg-yellow-400"></div>}
          </button>
        </div>
      </div>
    </div>
  );
}