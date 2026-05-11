import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Map, User, LogIn, Home as HomeIcon, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function ActivityIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
    </svg>
  );
}

export default function Navbar() {
  const { isAuth, user, logout } = useAuth();
  const navigate = useNavigate();
  
  // Estados para el desplegable
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Efecto para cerrar el desplegable si hacemos clic fuera de él
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    setIsDropdownOpen(false);
    logout();
    navigate('/');
  };

  return (
    <nav className="sticky top-0 bg-white shadow-sm border-b p-4 flex justify-between items-center z-50">
      <Link to="/" className="text-2xl font-bold text-citypulse-blue flex items-center gap-2">
        <ActivityIcon /> CityPulse
      </Link>
      
      <div className="flex items-center gap-6">
        <Link to="/" className="flex items-center gap-1 text-gray-600 hover:text-citypulse-blue font-medium transition">
          <HomeIcon size={18}/> Inicio
        </Link>
        <Link to="/map" className="flex items-center gap-1 text-gray-600 hover:text-citypulse-blue font-medium transition">
          <Map size={18}/> Mapa
        </Link>
        
        {isAuth ? (
          <div className="relative" ref={dropdownRef}>
            {/* BOTÓN DEL AVATAR */}
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 focus:outline-none"
            >
              <div className={`w-10 h-10 rounded-full bg-blue-50 border-2 flex items-center justify-center text-citypulse-blue transition-all shadow-sm overflow-hidden ${isDropdownOpen ? 'border-citypulse-blue ring-2 ring-blue-100' : 'border-transparent hover:border-citypulse-blue'}`}>
                {user?.avatar ? (
                  <img src={user.avatar} alt="Perfil" className="w-full h-full object-cover" />
                ) : (
                  <User size={20} strokeWidth={2.5} />
                )}
              </div>
            </button>

            {/* MENÚ DESPLEGABLE */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 animate-fade-in z-50">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm text-gray-500">Conectado como</p>
                  <p className="text-sm font-bold text-gray-900 truncate">{user?.username || user?.name}</p>
                </div>
                
                <div className="py-1">
                  <Link 
                    to="/profile" 
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-citypulse-blue transition-colors"
                  >
                    <Settings size={16} /> Ajustes del Perfil
                  </Link>
                </div>
                
                <div className="border-t border-gray-100 py-1">
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
                  >
                    <LogOut size={16} /> Cerrar Sesión
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Link to="/login" className="flex items-center gap-1 bg-citypulse-blue text-white px-5 py-2 rounded-lg hover:bg-blue-700 font-medium transition shadow-sm">
            <LogIn size={18}/> Entrar
          </Link>
        )}
      </div>
    </nav>
  );
}