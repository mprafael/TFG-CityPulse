import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Trash2, Users, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Backend's URL constant (Production o Local environment)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Administrator Dashboard Component.
 * Provides a global overview of registered users and allows forceful account deletion.
 * Route is strictly protected and requires administrative privileges.
 */
export default function AdminPanel() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);

  /**
   * Route Protection Guard.
   * Redirects unauthorized users attempting to access the URL directly.
   */
  useEffect(() => {
    if (!isAdmin) navigate('/');
  }, [isAdmin, navigate]);

  /**
   * Fetches the global list of users from the protected admin endpoint.
   * Injects the administrator's email into the headers for backend authorization.
   */
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch(`${API_URL}/api/admin/users`, {
          headers: { 'x-admin-email': user.email }
        });
        if (res.ok) {
          const data = await res.json();
          setUsersList(data);
        }
      } catch (error) {
        console.error("[AdminPanel] Error fetching users topology:", error);
      } finally {
        setLoading(false);
      }
    };
    
    if (isAdmin) fetchUsers();
  }, [isAdmin, user?.email]);

  /**
   * Dispatches a forceful deletion request for a specific user account.
   * * @param {string} id - The unique identifier of the user to be deleted.
   * @param {string} name - The display name of the user for the confirmation dialog.
   */
  const handleDeleteUser = async (id, name) => {
    if(!window.confirm(`⚠️ ADVERTENCIA: Vas a borrar toda la cuenta de ${name}. ¿Continuar?`)) return;
    
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-email': user.email }
      });
      
      if (res.ok) {
        // Update local state to reflect deletion without requiring a full refetch
        setUsersList(usersList.filter(u => u.id !== id));
      } else {
        alert("Error al eliminar el usuario");
      }
    } catch (error) {
      console.error("[AdminPanel] Connection error during deletion:", error);
      alert("Error de conexión");
    }
  };

  // Prevent layout flash before redirect takes effect for unauthorized users
  if (!isAdmin) return null;

  return (
    <div className="min-h-[calc(100vh-76px)] bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Section */}
        <div className="flex items-center gap-3 mb-8">
          <ShieldAlert className="w-10 h-10 text-purple-600" />
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">Panel de Administración</h1>
            <p className="text-gray-500">Gestión global de usuarios registrados en CityPulse.</p>
          </div>
        </div>

        {/* Data Table Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2 font-bold text-gray-700">
            <Users size={18} /> Base de Datos de Usuarios ({usersList.length})
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50/50 text-gray-500 uppercase">
                <tr>
                  <th className="px-6 py-4 font-semibold">Nombre / Email</th>
                  <th className="px-6 py-4 font-semibold">Fecha de Registro</th>
                  <th className="px-6 py-4 font-semibold text-center">Estado</th>
                  <th className="px-6 py-4 font-semibold text-center">Rutas Guardadas</th>
                  <th className="px-6 py-4 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-400">Cargando base de datos...</td></tr>
                ) : usersList.length === 0 ? (
                  <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-400">No hay usuarios registrados.</td></tr>
                ) : (
                  usersList.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900">{u.name}</div>
                        <div className="text-xs text-gray-500">{u.email}</div>
                      </td>
                      <td className="px-6 py-4">{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-center">
                        {u.isActive 
                          ? <span className="bg-green-50 text-green-700 px-2 py-1 rounded-md font-bold text-xs">Activo</span>
                          : <span className="bg-orange-50 text-orange-700 px-2 py-1 rounded-md font-bold text-xs flex items-center justify-center gap-1"><AlertCircle size={12}/> Pendiente</span>
                        }
                      </td>
                      <td className="px-6 py-4 text-center font-mono font-bold">{u._count.routes}</td>
                      <td className="px-6 py-4 text-right">
                        {/* Hide delete button for the primary administrator account */}
                        {u.email !== 'contacto.citypulse@gmail.com' && (
                          <button 
                            onClick={() => handleDeleteUser(u.id, u.name)}
                            className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                            title="Forzar eliminación"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        
      </div>
    </div>
  );
}