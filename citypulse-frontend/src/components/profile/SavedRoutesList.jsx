import { useState, useEffect } from 'react';
import { Map, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// Constante para la URL del backend (Producción o Local)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Component to display and manage user's stored routes.
 * Handles fetching from API and deletion of individual routes.
 */
export default function SavedRoutesList() {
  const { user } = useAuth();
  const [savedRoutes, setSavedRoutes] = useState([]);
  const [isLoadingRoutes, setIsLoadingRoutes] = useState(false);

  useEffect(() => {
    if (user?.id) {
      const fetchRoutes = async () => {
        setIsLoadingRoutes(true);
        try {
          const res = await fetch(`${API_URL}/api/routes/${user.id}`);
          if (res.ok) {
            const data = await res.json();
            setSavedRoutes(data);
          }
        } catch (error) {
          console.error("Error fetching profile routes:", error);
        } finally {
          setIsLoadingRoutes(false);
        }
      };
      fetchRoutes();
    }
  }, [user?.id]);

  const handleDeleteRoute = async (routeId) => {
    if(!window.confirm("¿Estás seguro de borrar esta ruta definitivamente?")) return;
    try {
      const res = await fetch(`${API_URL}/api/routes/${routeId}`, { method: 'DELETE' });
      if (res.ok) {
        setSavedRoutes(savedRoutes.filter(r => r.id !== routeId));
      }
    } catch (error) {
      alert("Error deleting route");
      console.error(error);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Map className="text-citypulse-blue" /> Mis Rutas Guardadas
        </h2>
      </div>

      {isLoadingRoutes ? (
        <div className="text-center py-12 text-gray-400">Cargando tus rutas...</div>
      ) : savedRoutes.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-citypulse-blue">
            <Map size={32} />
          </div>
          <p className="text-gray-500 max-w-sm mx-auto">Aún no has guardado ninguna ruta. ¡Ve al mapa interactivo y empieza a explorar la ciudad!</p>
          <Link to="/map" className="mt-6 inline-flex items-center gap-2 text-citypulse-blue font-bold hover:underline">Ir al Mapa →</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {savedRoutes.map(route => (
            <div key={route.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow relative group">
              <h4 className="font-bold text-gray-900 mb-1 pr-8">{route.name}</h4>
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                <span className="bg-blue-50 text-blue-700 py-0.5 px-2 rounded-md font-semibold">{route.distance} km</span>
                <span className="bg-emerald-50 text-emerald-700 py-0.5 px-2 rounded-md font-semibold">{route.duration} min</span>
              </div>
              <p className="text-xs text-gray-400">Guardada el: {new Date(route.createdAt).toLocaleDateString()}</p>
              
              <button 
                onClick={() => handleDeleteRoute(route.id)}
                className="absolute top-4 right-4 text-gray-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                title="Eliminar ruta"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}