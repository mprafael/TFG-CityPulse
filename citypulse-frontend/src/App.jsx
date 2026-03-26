import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import MapPage from './pages/MapPage';
import Login from './pages/Login';
import Profile from './pages/Profile';
import { Map, User, LogIn, Home as HomeIcon } from 'lucide-react';

function App() {
  return (
    <Router>
      <div className="flex flex-col h-screen overflow-hidden bg-gray-50">
        {/* Barra de Navegación Superior */}
        <nav className="bg-white shadow-sm border-b p-4 flex justify-between items-center z-10 relative">
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
            <Link to="/profile" className="flex items-center gap-1 text-gray-600 hover:text-citypulse-blue font-medium transition">
              <User size={18}/> Perfil
            </Link>
            <Link to="/login" className="flex items-center gap-1 bg-citypulse-blue text-white px-5 py-2 rounded-lg hover:bg-blue-700 font-medium transition shadow-sm">
              <LogIn size={18}/> Entrar
            </Link>
          </div>
        </nav>

        {/* Contenido de las páginas */}
        <main className="flex-1 relative overflow-auto">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

// Icono del logo minimalista
function ActivityIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
    </svg>
  )
}

export default App;