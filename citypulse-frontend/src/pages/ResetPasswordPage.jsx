import { useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Lock, ArrowRight, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';

// Constante para la URL del backend (Producción o Local)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Password Reset Component.
 * Validates the security token and dispatches the new password payload.
 */
export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Extract security token from URL parameters
  const token = searchParams.get('token');

  // Form State
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // UI Feedback State
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  /**
   * Handles the submission of the new password.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    // Client-side validation
    if (!token) {
      setErrorMsg('Enlace no válido. Vuelve a solicitar el cambio de contraseña.');
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Las contraseñas no coinciden. Compruébalo y vuelve a intentarlo.');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
      setIsLoading(false);
      return;
    }

    // Dispatch reset request to backend
    try {
      const response = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al restablecer la contraseña');
      }

      // Handle success and initialize redirect
      setSuccessMsg('¡Contraseña actualizada con éxito! Redirigiendo al inicio de sesión...');
      
      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Guard clause for missing tokens
  if (!token) {
    return (
      <div className="min-h-[calc(100vh-76px)] flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="max-w-md w-full bg-white p-10 rounded-2xl shadow-xl text-center border border-red-100">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Enlace no válido</h2>
          <p className="text-gray-500 mb-6">Falta el código de seguridad. Por favor, vuelve a solicitar el cambio de contraseña desde la página de inicio de sesión.</p>
          <Link to="/login" className="text-citypulse-blue font-bold hover:underline">Volver a Iniciar Sesión</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-76px)] flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-64 bg-citypulse-blue z-0 transform -skew-y-6 origin-top-left"></div>

      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-2xl border border-gray-100 z-10 relative">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Nueva Contraseña</h2>
          <p className="mt-2 text-sm text-gray-500">
            Escribe tu nueva contraseña segura.
          </p>
        </div>

        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg flex items-center gap-2 text-sm font-medium animate-fade-in mt-4">
            <AlertCircle size={18} className="flex-shrink-0" /> {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="bg-green-50 border border-green-200 text-green-600 p-3 rounded-lg flex items-center gap-2 text-sm font-medium animate-fade-in mt-4">
            <CheckCircle2 size={18} className="flex-shrink-0" /> {successMsg}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            
            {/* New Password Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nueva Contraseña</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-citypulse-blue" placeholder="••••••••" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-citypulse-blue focus:outline-none">
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Contraseña</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input type={showPassword ? "text" : "password"} required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-citypulse-blue" placeholder="••••••••" />
              </div>
            </div>

          </div>

          <button
            type="submit" disabled={isLoading}
            className={`w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-bold text-white transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-citypulse-blue active:scale-95 ${isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-citypulse-blue hover:bg-blue-700'}`}
          >
            {isLoading ? 'Guardando...' : 'Guardar Contraseña'}
            {!isLoading && <ArrowRight size={18} />}
          </button>
        </form>
      </div>
    </div>
  );
}