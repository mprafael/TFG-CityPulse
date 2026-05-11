import { useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom'; 
import { Mail, Lock, User, ArrowRight, Eye, EyeOff, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext'; 

export default function LoginPage() {
  const location = useLocation(); 
  const navigate = useNavigate(); 
  const { login } = useAuth(); 
  
  // En lugar de isLogin, usamos un estado que puede ser: 'login', 'register', 'forgot', 'email-sent'
  const [authMode, setAuthMode] = useState(location.state?.isRegister ? 'register' : 'login');
  
  const [identifier, setIdentifier] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // NUEVO: Estado para el "Recordarme"
  const [rememberMe, setRememberMe] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    if (authMode === 'register') {
      try {
        const response = await fetch('http://localhost:3000/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Error al registrar el usuario');

        // En lugar de hacer login automático, le mostramos la pantalla de correo enviado
        setAuthMode('email-sent');
        setSuccessMsg('Hemos enviado un correo de confirmación para activar tu cuenta.');

      } catch (err) {
        setErrorMsg(err.message);
      } finally {
        setIsLoading(false);
      }

    } else if (authMode === 'login') {
      try {
        const response = await fetch('http://localhost:3000/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier, password }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Error al iniciar sesión');

        setSuccessMsg('¡Sesión iniciada con éxito! Redirigiendo...');
        
        // Pasamos el rememberMe al contexto (lo modificaremos en el próximo paso)
        login(data.user, rememberMe); 

        setTimeout(() => navigate('/profile'), 1000);

      } catch (err) {
        setErrorMsg(err.message);
      } finally {
        setIsLoading(false);
      }

    } else if (authMode === 'forgot') {
      // --- LÓGICA DE RECUPERAR CONTRASEÑA (¡AHORA SÍ CONECTADA!) ---
      try {
        const response = await fetch('http://localhost:3000/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }), // Le enviamos el correo a nuestro backend
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Error al solicitar el cambio');
        }
        
        setAuthMode('email-sent');
        setSuccessMsg('Te hemos enviado las instrucciones para recuperar tu contraseña.');
        
      } catch (err) {
        setErrorMsg('Error al solicitar el cambio de contraseña.');
        console.log(err);
      } finally {
        setIsLoading(false);
      }
    }
  };

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
        
        {/* CABECERA DINÁMICA */}
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

        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg flex items-center gap-2 text-sm font-medium animate-fade-in mt-4">
            <AlertCircle size={18} className="flex-shrink-0" /> {errorMsg}
          </div>
        )}

        {/* --- PANTALLA DE CORREO ENVIADO (Sirve para registro y contraseña) --- */}
        {authMode === 'email-sent' ? (
          <div className="text-center space-y-6 py-4 animate-fade-in">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto text-citypulse-blue">
              <Mail size={40} />
            </div>
            <p className="text-gray-700 font-medium">{successMsg}</p>
            <p className="text-sm text-gray-500">
              Si no lo ves en unos minutos, revisa tu carpeta de Spam.
            </p>
            <button onClick={() => changeMode('login')} className="text-citypulse-blue font-bold hover:underline">
              Volver a Iniciar Sesión
            </button>
          </div>
        ) : (

        /* --- FORMULARIO PRINCIPAL --- */
        <form className="mt-8 space-y-6 animate-fade-in" onSubmit={handleSubmit}>
          <div className="space-y-4">
            
            {authMode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-citypulse-blue" placeholder="John Doe" />
                </div>
              </div>
            )}

            {(authMode === 'login' || authMode === 'register' || authMode === 'forgot') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {authMode === 'login' ? 'Correo o Nombre de usuario' : 'Correo electrónico'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    {authMode === 'login' && !identifier.includes('@') && identifier.length > 0 ? <User className="h-5 w-5 text-gray-400" /> : <Mail className="h-5 w-5 text-gray-400" />}
                  </div>
                  <input
                    type={authMode === 'login' ? "text" : "email"}
                    required
                    value={authMode === 'login' ? identifier : email}
                    onChange={(e) => authMode === 'login' ? setIdentifier(e.target.value) : setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-citypulse-blue"
                    placeholder={authMode === 'login' ? "tu@email.com o @usuario" : "tu@email.com"}
                  />
                </div>
              </div>
            )}

            {(authMode === 'login' || authMode === 'register') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
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
            )}

          </div>

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

        {/* --- SECCIÓN DE GOOGLE (Oculta si estamos recuperando contraseña o enviando email) --- */}
        {(authMode === 'login' || authMode === 'register') && (
          <>
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">O continuar con</span>
                </div>
              </div>

              <div className="mt-6">
                <button type="button" className="w-full flex justify-center items-center gap-3 py-3 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 transition-all active:scale-95">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  {authMode === 'login' ? 'Iniciar sesión con Google' : 'Registrarse con Google'}
                </button>
              </div>
            </div>

            <div className="text-center mt-6 pt-4">
              <p className="text-sm text-gray-600">
                {authMode === 'login' ? '¿Aún no tienes cuenta?' : '¿Ya tienes una cuenta?'}
                <button type="button" onClick={() => changeMode(authMode === 'login' ? 'register' : 'login')} className="ml-2 font-bold text-citypulse-blue hover:text-blue-700 hover:underline">
                  {authMode === 'login' ? 'Regístrate aquí' : 'Inicia sesión'}
                </button>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}