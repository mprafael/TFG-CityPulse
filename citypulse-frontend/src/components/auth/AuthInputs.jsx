import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';

/**
 * Reusable input fields for authentication forms.
 */
export default function AuthInputs({ 
  authMode, name, setName, email, setEmail, 
  identifier, setIdentifier, password, setPassword, 
  showPassword, setShowPassword 
}) {
  return (
    <div className="space-y-4">
      {/* Registration specific: Name */}
      {authMode === 'register' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-gray-400" />
            </div>
            <input 
              type="text" required 
              value={name} onChange={(e) => setName(e.target.value)} 
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-citypulse-blue" 
              placeholder="John Doe" 
            />
          </div>
        </div>
      )}

      {/* Email / Identifier (Used in all forms) */}
      {(authMode === 'login' || authMode === 'register' || authMode === 'forgot') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {authMode === 'login' ? 'Correo o Nombre de usuario' : 'Correo electrónico'}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {authMode === 'login' && !identifier.includes('@') && identifier.length > 0 
                ? <User className="h-5 w-5 text-gray-400" /> 
                : <Mail className="h-5 w-5 text-gray-400" />}
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

      {/* Password (Used in Login and Register) */}
      {(authMode === 'login' || authMode === 'register') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input 
              type={showPassword ? "text" : "password"} 
              required 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-citypulse-blue" 
              placeholder="••••••••" 
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)} 
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-citypulse-blue focus:outline-none"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}