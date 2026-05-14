import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

import ProfileSidebar from '../components/profile/ProfileSidebar';
import ProfileForm from '../components/profile/ProfileForm';
import SavedRoutesList from '../components/profile/SavedRoutesList';

/**
 * Main Profile View Component.
 * Acts as a container for routing settings and account management.
 */
export default function ProfilePage() {
  const { isAuth, logout } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('account');

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Render unauthorized state
  if (!isAuth) {
    return (
      <div className="min-h-[calc(100vh-76px)] flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg border border-gray-100 text-center">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-citypulse-blue" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Inicia sesión</h2>
          <p className="text-gray-500 mb-6">Necesitas acceder a tu cuenta para ver tus rutas guardadas y modificar tus datos.</p>
          <Link to="/login" className="w-full inline-flex justify-center items-center py-3 px-4 rounded-lg shadow text-sm font-bold text-white bg-citypulse-blue hover:bg-blue-700 transition-colors">
            Ir a Iniciar Sesión
          </Link>
        </div>
      </div>
    );
  }

  // Render authorized state layout
  return (
    <div className="min-h-[calc(100vh-76px)] bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-8">Mi Perfil</h1>

        <div className="flex flex-col md:flex-row gap-8 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden min-h-[600px]">
          
          <ProfileSidebar 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            handleLogout={handleLogout} 
          />

          <main className="flex-1 p-8">
            {activeTab === 'account' && <ProfileForm />}
            {activeTab === 'routes' && <SavedRoutesList />}
          </main>
          
        </div>
      </div>
    </div>
  );
}