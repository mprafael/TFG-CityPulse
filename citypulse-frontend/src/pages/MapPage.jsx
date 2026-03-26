import { useState, useEffect } from 'react';
import Map, { Marker } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Bus, CarFront, Navigation } from 'lucide-react';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

export default function MapPage() {
  const [viewState, setViewState] = useState({
    longitude: -4.4214,
    latitude: 36.7213,
    zoom: 14
  });

  // 1. Nuevo estado para guardar los vehículos que vienen del backend
  const [vehicles, setVehicles] = useState([]);

  // 2. useEffect para hacer la petición HTTP al backend nada más abrir el mapa
  useEffect(() => {
    // Llamamos a la ruta que acabamos de crear en tu Express
    fetch('http://localhost:3000/api/vehicles')
      .then(response => response.json())
      .then(data => {
        console.log("✅ Vehículos recibidos del servidor:", data);
        setVehicles(data); // Guardamos los datos en el estado de React
      })
      .catch(error => console.error("❌ Error conectando con el backend:", error));
  }, []); // El array vacío [] significa "ejecuta esto solo una vez al cargar la página"

  // Función para elegir el icono
  const renderIcon = (type) => {
    if (type === 'bus') return <Bus size={16} />;
    if (type === 'vtc') return <CarFront size={16} />;
    if (type === 'taxi') return <Navigation size={16} fill="currentColor" />;
    return <div className="w-4 h-4 rounded-full bg-red-500" />;
  };

  // NUEVO: Función para asignar los colores de Tailwind según el tipo de vehículo
  const getMarkerColor = (type) => {
    if (type === 'bus') return 'bg-blue-500 text-white';
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
        {vehicles.map((vehicle) => (
          <Marker
            key={vehicle.id}
            longitude={vehicle.lng}
            latitude={vehicle.lat}
            anchor="center"
          >
            {/* AQUÍ ESTÁ EL CAMBIO: Usamos getMarkerColor() en vez de vehicle.color */}
            <div className={`flex items-center justify-center p-2 rounded-full shadow-lg border-2 border-white cursor-pointer hover:scale-110 transition-transform ${getMarkerColor(vehicle.type)}`}>
              {renderIcon(vehicle.type)}
            </div>
          </Marker>
        ))}
      </Map>

      {/* Panel flotante actualizado */}
      <div className="absolute top-6 left-6 bg-white p-5 rounded-xl shadow-lg border border-gray-100 z-10 w-72">
        <h3 className="text-lg font-extrabold text-gray-900 mb-1">📍 CityPulse Live</h3>
        <p className="text-sm text-green-600 font-medium mb-4 flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          Conectado al servidor
        </p>
        
        <div className="flex flex-wrap gap-2">
          <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full flex items-center gap-1"><Bus size={12}/> EMT</span>
          <span className="px-3 py-1 bg-slate-200 text-slate-800 text-xs font-bold rounded-full flex items-center gap-1"><CarFront size={12}/> VTC</span>
          <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-full flex items-center gap-1"><Navigation size={12}/> Taxi</span>
        </div>
      </div>

    </div>
  );
}