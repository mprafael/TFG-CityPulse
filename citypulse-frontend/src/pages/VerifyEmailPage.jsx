import { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

// Backend's URL constant (Production o Local environment)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Email Verification Handler Component.
 * Processes the token from the URL parameters to activate a newly registered account.
 */
export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  // Interaction state: 'loading' | 'success' | 'error'
  const [status, setStatus] = useState('loading');
  
  // Guard reference to prevent duplicate API calls in React StrictMode
  const hasAttempted = useRef(false);

  useEffect(() => {
    const verify = async () => {
      try {
        const res = await fetch(`${API_URL}/api/auth/verify-email?token=${token}`);
        if (res.ok) setStatus('success');
        else setStatus('error');
      } catch { 
        setStatus('error'); 
      }
    };

    if (token && !hasAttempted.current) {
      hasAttempted.current = true;
      verify();
    }
  }, [token]);

  return (
    <div className="min-h-[calc(100vh-76px)] flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white p-10 rounded-2xl shadow-xl text-center">
        {status === 'loading' && <Loader2 className="w-16 h-16 text-citypulse-blue animate-spin mx-auto" />}
        {status === 'success' && (
          <>
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4 animate-fade-in" />
            <h2 className="text-2xl font-bold mb-2 text-gray-900">¡Cuenta Activada!</h2>
            <p className="text-gray-500 mb-6">Tu dirección de correo ha sido confirmada. Ya puedes iniciar sesión en CityPulse.</p>
            <Link to="/login" className="inline-block bg-citypulse-blue hover:bg-blue-700 transition-colors text-white px-8 py-3 rounded-lg font-bold shadow-md active:scale-95">
              Ir al Login
            </Link>
          </>
        )}
        {status === 'error' && (
          <>
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4 animate-fade-in" />
            <h2 className="text-2xl font-bold mb-2 text-gray-900">Error de verificación</h2>
            <p className="text-gray-500 mb-6">El enlace es inválido, ha caducado, o la cuenta ya estaba activada previamente.</p>
            <Link to="/login" className="text-citypulse-blue font-bold hover:underline">
              Volver al inicio de sesión
            </Link>
          </>
        )}
      </div>
    </div>
  );
}