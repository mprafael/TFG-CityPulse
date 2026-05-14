import { useState, useEffect } from 'react';
import Map, { Marker, Source, Layer } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Target, MapPin, Navigation, Bus, TrainFront, CarFront } from 'lucide-react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

// Extracted UI Components
import MapControlPanel from '../components/MapControlPanel';
import VehiclePopup from '../components/VehiclePopup';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const socket = io('http://localhost:3000');

/**
 * Main application map interface.
 * Orchestrates Mapbox rendering, WebSocket connections for live vehicle tracking,
 * and user routing capabilities.
 */
export default function MapPage() {
  const { user, isAuth } = useAuth(); 
  
  // Map Viewport State
  const [viewState, setViewState] = useState({
    longitude: -4.4214, latitude: 36.7213, zoom: 14
  });
  const [isMapInteracting, setIsMapInteracting] = useState(false);
  const [userLocation, setUserLocation] = useState(null);

  // Fleet Simulation State
  const [vehicles, setVehicles] = useState([]);
  const [activeFilters, setActiveFilters] = useState({ bus: false, metro: false, vtc: false, taxi: false });
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  // UI Control Panel State
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuTab, setMenuTab] = useState('filters');

  // Routing State
  const [isRoutingMode, setIsRoutingMode] = useState(false);
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [routeData, setRouteData] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [routeName, setRouteName] = useState('');
  
  // Database Interaction State
  const [savedRoutes, setSavedRoutes] = useState([]); 
  const [isSaving, setIsSaving] = useState(false);

  /**
   * Initialize WebSockets connection for live vehicle updates.
   */
  useEffect(() => {
    socket.on('vehiclesUpdate', (data) => {
      setVehicles(data);
      // Keep popup data synced if a vehicle is currently selected
      if (selectedVehicle) {
        const updated = data.find(v => v.id === selectedVehicle.id);
        if (updated) setSelectedVehicle(updated);
      }
    });
    return () => socket.off('vehiclesUpdate');
  }, [selectedVehicle]);

  /**
   * Fetch authenticated user's stored routes from backend.
   */
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
        console.error("[MapPage] Error fetching stored routes:", error);
      }
    };
    fetchSavedRoutes();
  }, [isAuth, user?.id]);

  /**
   * Obtains the device geolocation, centers the map, and requests
   * nearby vehicle spawns from the simulation engine.
   */
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

  // Marker UI Helpers
  const getMarkerColor = (type) => {
    if (type === 'bus') return 'bg-blue-500 text-white';
    if (type === 'metro') return 'bg-emerald-500 text-white';
    if (type === 'vtc') return 'bg-slate-900 text-white';
    if (type === 'taxi') return 'bg-yellow-400 text-black';
    return 'bg-gray-500 text-white';
  };

  const renderIcon = (type) => {
    if (type === 'bus') return <Bus size={16} />;
    if (type === 'metro') return <TrainFront size={16} />;
    if (type === 'vtc' || type === 'taxi') return <CarFront size={16} />;
  };

  /**
   * Captures map clicks to define routing origin and destination points.
   */
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

  /**
   * Computes driving directions using Mapbox Navigation API.
   */
  const fetchRoute = async (end, start) => {
    try {
      const query = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${start.lng},${start.lat};${end.lng},${end.lat}?geometries=geojson&overview=full&access_token=${MAPBOX_TOKEN}`
      );
      const json = await query.json();
      if (json.routes && json.routes.length > 0) {
        setRouteData(json.routes[0].geometry);
        setRouteInfo({
          distance: (json.routes[0].distance / 1000).toFixed(1),
          duration: Math.round(json.routes[0].duration / 60)
        });
      }
    } catch (error) {
      console.error("[MapPage] Directions calculation failed:", error);
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
      console.error("[MapPage] Route saving failed:", error);
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
      console.error("[MapPage] Route deletion failed:", error);
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
      
      {/* Map Rendering Layer 
        Handles base tiles, routing sources, interactive markers, and geolocation updates.
      */}
      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        onClick={handleMapClick}
        onMoveStart={() => setIsMapInteracting(true)}
        onMoveEnd={() => setIsMapInteracting(false)}
        mapStyle="mapbox://styles/mapbox/light-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
        style={{ width: '100%', height: '100%' }}
        cursor={isRoutingMode ? 'crosshair' : 'grab'}
      >
        {/* Calculated Path Layer */}
        {routeData && (
          <Source id="route" type="geojson" data={routeData}>
            <Layer id="route-line" type="line" layout={{ 'line-join': 'round', 'line-cap': 'round' }} paint={{ 'line-color': '#3b82f6', 'line-width': 5, 'line-opacity': 0.8 }} />
          </Source>
        )}

        {/* Origin / Destination Markers */}
        {origin && <Marker longitude={origin.lng} latitude={origin.lat} anchor="bottom"><div className="text-blue-600 animate-bounce"><MapPin size={36} fill="white" /></div></Marker>}
        {destination && <Marker longitude={destination.lng} latitude={destination.lat} anchor="bottom"><div className="text-red-500 animate-bounce"><MapPin size={36} fill="white" /></div></Marker>}

        {/* Active Fleet Markers */}
        {filteredVehicles.map((vehicle) => (
          <Marker 
            key={vehicle.id} 
            longitude={vehicle.lng} 
            latitude={vehicle.lat} 
            anchor="center"
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

        {/* User Geolocation Marker */}
        {userLocation && (
          <Marker longitude={userLocation.lng} latitude={userLocation.lat} anchor="center">
            <div className="relative flex items-center justify-center">
              <div className="absolute w-10 h-10 bg-blue-500 rounded-full animate-ping opacity-25"></div>
              <div className="relative bg-blue-600 text-white p-2 rounded-full shadow-2xl border-2 border-white">
                <Navigation size={20} fill="currentColor" />
              </div>
            </div>
          </Marker>
        )}

        {/* Vehicle Metadata Popup */}
        <VehiclePopup vehicle={selectedVehicle} onClose={() => setSelectedVehicle(null)} />
      </Map>

      {/* Geolocation Trigger */}
      <button 
        onClick={handleMyLocation} 
        className="absolute bottom-10 right-6 bg-white p-3 rounded-full shadow-2xl border border-gray-100 text-citypulse-blue hover:bg-gray-50 transition-all z-20 active:scale-95" 
        title="Mi ubicación"
      >
        <Target size={24} />
      </button>

      {/* Orchestrated UI Panel */}
      <MapControlPanel 
        isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen}
        menuTab={menuTab} setMenuTab={setMenuTab}
        activeFilters={activeFilters} toggleFilter={toggleFilter}
        isRoutingMode={isRoutingMode} setIsRoutingMode={setIsRoutingMode}
        routeData={routeData} routeInfo={routeInfo}
        origin={origin} destination={destination}
        routeName={routeName} setRouteName={setRouteName}
        handleSaveRoute={handleSaveRoute} isSaving={isSaving} clearRoute={clearRoute}
        isAuth={isAuth} savedRoutes={savedRoutes}
        handlePreviewRoute={handlePreviewRoute} handleDeleteRoute={handleDeleteRoute}
      />
    </div>
  );
}