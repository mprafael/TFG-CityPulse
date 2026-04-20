import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import MapPage from './pages/MapPage';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Footer from './components/Footer';
import { Map, User, LogIn, Home as HomeIcon } from 'lucide-react';

function App() {
  return (
    <Router>
      {/* CAMBIO 1: min-h-screen y quitamos overflow-hidden */}
      <div className="flex flex-col min-h-screen bg-gray-50">
        
        {/* CAMBIO 2: sticky top-0 y z-50 para que la barra se quede siempre arriba al hacer scroll */}
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
            <Link to="/profile" className="flex items-center gap-1 text-gray-600 hover:text-citypulse-blue font-medium transition">
              <User size={18}/> Perfil
            </Link>
            <Link to="/login" className="flex items-center gap-1 bg-citypulse-blue text-white px-5 py-2 rounded-lg hover:bg-blue-700 font-medium transition shadow-sm">
              <LogIn size={18}/> Entrar
            </Link>
          </div>
        </nav>

        {/* CAMBIO 3: Quitamos el overflow-auto, el scroll lo hace ahora la ventana entera */}
        <main className="flex-1 relative flex flex-col">
          <div className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/map" element={<MapPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/profile" element={<Profile />} />
            </Routes>
          </div>
          
          <Footer />
        </main>
      </div>
    </Router>
  );
}

function ActivityIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
    </svg>
  )
}

export default App;