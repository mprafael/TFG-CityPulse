import { User, Map, LogOut } from 'lucide-react';

/**
 * Sidebar navigation for the User Profile.
 */
export default function ProfileSidebar({ activeTab, setActiveTab, handleLogout }) {
  return (
    <aside className="w-full md:w-72 bg-gray-50 p-6 border-r border-gray-200 flex-shrink-0">
      <nav className="space-y-2">
        <button 
          onClick={() => setActiveTab('account')} 
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === 'account' ? 'bg-blue-100 text-citypulse-blue' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          <User size={20} /> Datos de la cuenta
        </button>
        <button 
          onClick={() => setActiveTab('routes')} 
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === 'routes' ? 'bg-blue-100 text-citypulse-blue' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          <Map size={20} /> Rutas almacenadas
        </button>
        <div className="h-px bg-gray-200 my-4"></div>
        <button 
          onClick={handleLogout} 
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut size={20} /> Cerrar sesión
        </button>
      </nav>
    </aside>
  );
}