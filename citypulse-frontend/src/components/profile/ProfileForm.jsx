import { useState, useRef } from 'react';
import { User, Camera, Lock, Mail, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// Backend's URL constant (Production o Local environment)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Form component for updating user profile information.
 * Handles avatar preview, data submission, and account deletion requests.
 */
export default function ProfileForm() {
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const [formData, setFormData] = useState({
    name: user?.name || '',
    username: user?.username || '',
    email: user?.email || '',
    password: '',
  });
  
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || null);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleEditToggle = async () => {
    if (!isEditing) {
      setIsEditing(true);
      setSuccessMsg('');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: user.id,
          name: formData.name,
          username: formData.username,
          email: formData.email,
          password: formData.password,
          avatar: avatarPreview
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Update failed');

      updateUser(data.user);
      setSuccessMsg('¡Datos actualizados con éxito!');
      setIsEditing(false);
      setFormData({ ...formData, password: '' });

    } catch (error) {
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setFormData({
      name: user?.name || '',
      username: user?.username || '',
      email: user?.email || '',
      password: '',
    });
    setAvatarPreview(user?.avatar || null);
    setSuccessMsg('');
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('¿Estás seguro de que quieres eliminar tu cuenta? Te enviaremos un correo para confirmar el borrado.')) {
      try {
        const response = await fetch(`${API_URL}/api/auth/request-delete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user.email }),
        });
        
        if (response.ok) {
          alert('Revisa tu bandeja de entrada. Te hemos enviado un enlace para confirmar la eliminación de tu cuenta.');
        } else {
          const data = await response.json();
          alert(data.error || 'Deletion request failed.');
        }
      } catch (error) {
        alert('Connection error during deletion request.');
        console.error(error);
      }
    }
  };

  return (
    <div className="max-w-2xl animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Información Personal</h2>
        {isEditing && <span className="bg-blue-100 text-citypulse-blue text-xs font-bold px-3 py-1 rounded-full animate-pulse">Modo Edición</span>}
      </div>

      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-600 p-3 rounded-lg flex items-center gap-2 text-sm font-medium animate-fade-in mb-6">
          <CheckCircle2 size={18} className="flex-shrink-0" /> {successMsg}
        </div>
      )}
      
      <div className="flex items-center gap-6 mb-8">
        <div className="relative">
          <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} className="hidden" />
          
          <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg bg-blue-50 flex items-center justify-center text-citypulse-blue overflow-hidden">
            {avatarPreview ? (
              <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User size={40} strokeWidth={2.5} />
            )}
          </div>
          {isEditing && (
            <button 
              onClick={() => fileInputRef.current.click()} 
              className="absolute bottom-0 right-0 p-2 bg-citypulse-blue text-white rounded-full shadow hover:bg-blue-700 transition-colors"
            >
              <Camera size={16} />
            </button>
          )}
        </div>
        <div>
          <h3 className="font-bold text-lg text-gray-900">Foto de perfil</h3>
          <p className="text-sm text-gray-500">
            {isEditing ? "Haz clic en la cámara para subir tu foto." : "Tu avatar actual."}
          </p>
        </div>
      </div>

      <form className="space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><User className="h-5 w-5 text-gray-400" /></div>
              <input 
                type="text" name="name"
                value={formData.name} onChange={handleInputChange} readOnly={!isEditing}
                className={`block w-full pl-10 pr-3 py-2 rounded-lg outline-none transition-all ${isEditing ? 'border border-gray-300 focus:ring-2 focus:ring-citypulse-blue bg-white' : 'border border-transparent bg-gray-50 text-gray-800 cursor-default'}`} 
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de usuario</label>
            <input 
              type="text" name="username"
              value={formData.username} onChange={handleInputChange} readOnly={!isEditing}
              placeholder="@usuario"
              className={`block w-full px-3 py-2 rounded-lg outline-none transition-all ${isEditing ? 'border border-gray-300 focus:ring-2 focus:ring-citypulse-blue bg-white' : 'border border-transparent bg-gray-50 text-gray-800 cursor-default'}`} 
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Mail className="h-5 w-5 text-gray-400" /></div>
            <input 
              type="email" name="email"
              value={formData.email} onChange={handleInputChange} readOnly={!isEditing}
              className={`block w-full pl-10 pr-3 py-2 rounded-lg outline-none transition-all ${isEditing ? 'border border-gray-300 focus:ring-2 focus:ring-citypulse-blue bg-white' : 'border border-transparent bg-gray-50 text-gray-800 cursor-default'}`} 
            />
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Seguridad</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{isEditing ? "Nueva contraseña (deja en blanco para no cambiar)" : "Contraseña"}</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Lock className="h-5 w-5 text-gray-400" /></div>
              <input 
                type="password" name="password"
                value={isEditing ? formData.password : '********'} onChange={handleInputChange} readOnly={!isEditing}
                placeholder={isEditing ? "Escribe la nueva contraseña" : ""}
                className={`block w-full pl-10 pr-3 py-2 rounded-lg outline-none transition-all ${isEditing ? 'border border-gray-300 focus:ring-2 focus:ring-citypulse-blue bg-white' : 'border border-transparent bg-gray-50 text-gray-800 cursor-default'}`} 
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 gap-3">
          {isEditing && (
            <button 
              type="button" onClick={cancelEdit} disabled={isLoading}
              className="py-2 px-6 rounded-lg text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all"
            >
              Cancelar
            </button>
          )}
          <button 
            type="button" onClick={handleEditToggle} disabled={isLoading}
            className={`py-2 px-6 rounded-lg text-sm font-bold text-white shadow-md transition-all active:scale-95 ${
              isEditing ? 'bg-green-600 hover:bg-green-700' : 'bg-citypulse-blue hover:bg-blue-700' 
            }`}
          >
            {isLoading ? 'Guardando...' : (isEditing ? 'Guardar cambios' : 'Modificar datos')}
          </button>
        </div>
      </form>

      <div className="pt-8 border-t border-gray-200 mt-8">
        <h3 className="text-lg font-bold text-red-600 mb-2">¡Precaución!</h3>
        <p className="text-sm text-gray-500 mb-4">
          Una vez elimines tu cuenta, tus datos personales se borrarán y no habrá vuelta atrás.
        </p>
        <button 
          type="button" 
          onClick={handleDeleteAccount} 
          className="py-2 px-4 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 font-bold transition-colors"
        >
          Eliminar cuenta permanentemente
        </button>
      </div>
    </div>
  );
}