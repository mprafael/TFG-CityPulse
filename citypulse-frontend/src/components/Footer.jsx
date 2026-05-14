import { Link, useLocation } from 'react-router-dom';
import { Code, Activity } from 'lucide-react';

/**
 * Global Footer Component.
 * Contains navigation links, brand information, and legal disclaimers.
 * Remains hidden on the map view to maximize application viewport area.
 */
export default function Footer() {
  const location = useLocation();

  if (location.pathname === '/map') {
    return null;
  }

  return (
    <footer className="bg-gray-900 text-gray-400 py-12 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Brand & Description */}
        <div className="flex flex-col">
          <Link to="/" className="flex items-center gap-2 text-white text-xl font-bold mb-4">
            <Activity className="text-blue-500" />
            CityPulse
          </Link>
          <p className="text-sm leading-relaxed mb-4 text-gray-400">
            Plataforma centralizada de movilidad urbana en tiempo real. Encuentra tu transporte más rápido y mejora tu planificación diaria.
          </p>
        </div>

        {/* Quick Links */}
        <div className="flex flex-col">
          <h3 className="text-white font-semibold mb-4">Enlaces Rápidos</h3>
          <ul className="space-y-2 text-sm">
            <li><Link to="/" className="hover:text-white transition-colors">Inicio</Link></li>
            <li><Link to="/map" className="hover:text-white transition-colors">Mapa Interactivo</Link></li>
            <li><Link to="/profile" className="hover:text-white transition-colors">Mi Perfil</Link></li>
            <li><Link to="/login" className="hover:text-white transition-colors">Acceder</Link></li>
          </ul>
        </div>

        {/* Project Context & Contact */}
        <div className="flex flex-col">
          <h3 className="text-white font-semibold mb-4">Sobre el Proyecto</h3>
          <ul className="space-y-2 text-sm">
            <li>Proyecto Final (2º DAW)</li>
            <li>IES Portada Alta</li>
            <li>Curso 2025/2026</li>
            <li className="pt-2">
              <a 
                href="https://github.com/mprafael" 
                target="_blank" 
                rel="noreferrer" 
                className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <Code size={18} /> Perfil de GitHub
              </a>
            </li>
          </ul>
        </div>

      </div>

      {/* Copyright & Legal Bar */}
      <div className="max-w-7xl mx-auto px-6 mt-12 pt-8 border-t border-gray-800 text-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-center md:text-left">
          © {new Date().getFullYear()} Rafael Macías Peláez. Todos los derechos reservados.
        </p>
        <div className="flex items-center gap-4 text-center">
          <Link to="/terminos" className="hover:text-white transition-colors">
            Términos y Condiciones
          </Link>
          <span className="hidden md:inline text-gray-600">•</span>
          <p>Málaga, España</p>
        </div>
      </div>
    </footer>
  );
}