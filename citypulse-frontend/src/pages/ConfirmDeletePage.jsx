import { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ConfirmDeletePage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('loading');
  const hasAttempted = useRef(false);
  const { logout } = useAuth(); // Para cerrar su sesión actual

  useEffect(() => {
    const confirmDelete = async () => {
      try {
        const res = await fetch(`http://localhost:3000/api/auth/confirm-delete?token=${token}`);
        if (res.ok) {
          setStatus('success');
          logout(); // Cerramos su sesión automáticamente
        } else {
          setStatus('error');
        }
      } catch { setStatus('error'); }
    };

    if (token && !hasAttempted.current) {
      hasAttempted.current = true;
      confirmDelete();
    }
  }, [token, logout]);

  return (
    <div className="min-h-[calc(100vh-76px)] flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white p-10 rounded-2xl shadow-xl text-center">
        {status === 'loading' && <Loader2 className="w-16 h-16 text-red-500 animate-spin mx-auto" />}
        {status === 'success' && (
          <>
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Cuenta eliminada</h2>
            <p className="text-gray-500 mb-6">Tus datos personales han sido borrados de CityPulse. Sentimos verte marchar.</p>
            <Link to="/" className="text-citypulse-blue font-bold">Volver al inicio</Link>
          </>
        )}
        {status === 'error' && (
          <>
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Error</h2>
            <p className="text-gray-500 mb-6">El enlace es inválido o ya ha caducado.</p>
            <Link to="/" className="text-citypulse-blue font-bold">Volver al inicio</Link>
          </>
        )}
      </div>
    </div>
  );
}