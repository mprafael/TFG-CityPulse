import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom'; 
import { Mail, ArrowRight, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext'; 

// Extracted UI Components
import AuthInputs from '../components/auth/AuthInputs';
import OAuthProviders from '../components/auth/OAuthProviders';

// Backend's URL constant (Production o Local environment)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Authentication Page.
 * Handles Login, Registration, Password Recovery and Success feedback views.
 */
export default function LoginPage() {
  const location = useLocation(); 
  const navigate = useNavigate(); 
  const { login } = useAuth(); 
  
  // View State: 'login', 'register', 'forgot', 'email-sent'
  const [authMode, setAuthMode] = useState(location.state?.isRegister ? 'register' : 'login');
  
  // Form Data State
  const [identifier, setIdentifier] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // UI Interaction State
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Feedback State
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  /**
   * Orchestrates form submissions based on the active authentication mode.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (authMode === 'register') {
        const response = await fetch(`${API_URL}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Registration failed');

        setAuthMode('email-sent');
        setSuccessMsg('Hemos enviado un correo de confirmación para activar tu cuenta.');

      } else if (authMode === 'login') {
        const response = await fetch(`${API_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier, password }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Login failed');

        setSuccessMsg('¡Sesión iniciada con éxito! Redirigiendo...');
        login(data.user, rememberMe); 
        setTimeout(() => navigate('/profile'), 1000);

      } else if (authMode === 'forgot') {
        const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }), 
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Password recovery request failed');
        
        setAuthMode('email-sent');
        setSuccessMsg('Te hemos enviado las instrucciones para recuperar tu contraseña.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Resets form states when switching between authentication views.
   */
  const changeMode = (mode) => {
    setAuthMode(mode);
    setErrorMsg('');
    setSuccessMsg('');
    setShowPassword(false);
  };

  return (
    <div className="min-h-[calc(100vh-76px)] flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-64 bg-citypulse-blue z-0 transform -skew-y-6 origin-top-left"></div>

      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-2xl border border-gray-100 z-10 relative">
        
        {/* Dynamic Header */}
        <div className="text-center">
          {authMode === 'forgot' && (
            <button onClick={() => changeMode('login')} className="absolute top-8 left-8 text-gray-400 hover:text-citypulse-blue transition-colors">
              <ArrowLeft size={24} />
            </button>
          )}
          
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            {authMode === 'login' && 'Bienvenido de nuevo'}
            {authMode === 'register' && 'Crea tu cuenta'}
            {authMode === 'forgot' && 'Recuperar contraseña'}
            {authMode === 'email-sent' && 'Revisa tu bandeja'}
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            {authMode === 'login' && 'Accede a CityPulse para ver tus rutas'}
            {authMode === 'register' && 'Únete a CityPulse y mejora tu movilidad'}
            {authMode === 'forgot' && 'Te enviaremos un enlace seguro para crear una nueva.'}
          </p>
        </div>

        {/* Error Feedback */}
        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg flex items-center gap-2 text-sm font-medium animate-fade-in mt-4">
            <AlertCircle size={18} className="flex-shrink-0" /> {errorMsg}
          </div>
        )}

        {/* Email Sent Success Screen */}
        {authMode === 'email-sent' ? (
          <div className="text-center space-y-6 py-4 animate-fade-in">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto text-citypulse-blue">
              <Mail size={40} />
            </div>
            <p className="text-gray-700 font-medium">{successMsg}</p>
            <p className="text-sm text-gray-500">Si no lo ves en unos minutos, revisa tu carpeta de Spam.</p>
            <button onClick={() => changeMode('login')} className="text-citypulse-blue font-bold hover:underline">
              Volver a Iniciar Sesión
            </button>
          </div>
        ) : (

        /* Main Forms */
        <form className="mt-8 space-y-6 animate-fade-in" onSubmit={handleSubmit}>
          
          <AuthInputs 
            authMode={authMode} 
            name={name} setName={setName} 
            email={email} setEmail={setEmail} 
            identifier={identifier} setIdentifier={setIdentifier} 
            password={password} setPassword={setPassword} 
            showPassword={showPassword} setShowPassword={setShowPassword} 
          />

          {/* Login Specific Controls */}
          {authMode === 'login' && (
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me" type="checkbox"
                  checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-citypulse-blue focus:ring-citypulse-blue border-gray-300 rounded cursor-pointer"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 cursor-pointer">Recordarme</label>
              </div>

              <div className="text-sm">
                <button type="button" onClick={() => changeMode('forgot')} className="font-medium text-citypulse-blue hover:text-blue-700 hover:underline">
                  ¿Olvidaste la contraseña?
                </button>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit" disabled={isLoading}
            className={`w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-bold text-white transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-citypulse-blue active:scale-95 ${isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-citypulse-blue hover:bg-blue-700'}`}
          >
            {isLoading ? 'Procesando...' : (
              authMode === 'login' ? 'Iniciar Sesión' : 
              authMode === 'register' ? 'Crear Cuenta' : 'Enviar Instrucciones'
            )}
            {!isLoading && <ArrowRight size={18} />}
          </button>
        </form>
        )}

        <OAuthProviders authMode={authMode} />

        {/* View Toggles */}
        {(authMode === 'login' || authMode === 'register') && (
          <div className="text-center mt-6 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-600">
              {authMode === 'login' ? '¿Aún no tienes cuenta?' : '¿Ya tienes una cuenta?'}
              <button type="button" onClick={() => changeMode(authMode === 'login' ? 'register' : 'login')} className="ml-2 font-bold text-citypulse-blue hover:text-blue-700 hover:underline">
                {authMode === 'login' ? 'Regístrate aquí' : 'Inicia sesión'}
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}