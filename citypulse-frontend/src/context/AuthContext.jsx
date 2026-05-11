import { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Al cargar la app, comprobamos si hay sesión en alguna de las dos memorias
  useEffect(() => {
    // Busca primero en la permanente (localStorage), y si no hay nada, en la temporal (sessionStorage)
    const savedUser = localStorage.getItem('citypulse_user') || sessionStorage.getItem('citypulse_user');
    
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  // 2. Modificamos el login para que reciba 'rememberMe' (por defecto falso)
  const login = (userData, rememberMe = false) => {
    setUser(userData);
    
    if (rememberMe) {
      // Guardamos para siempre y borramos la temporal por si acaso
      localStorage.setItem('citypulse_user', JSON.stringify(userData));
      sessionStorage.removeItem('citypulse_user'); 
    } else {
      // Guardamos en la temporal y ¡BORRAMOS la permanente! (Súper importante)
      sessionStorage.setItem('citypulse_user', JSON.stringify(userData));
      localStorage.removeItem('citypulse_user'); 
    }
  };

  // 3. Al salir, limpiamos todo para no dejar rastros
  const logout = () => {
    setUser(null);
    localStorage.removeItem('citypulse_user');
    sessionStorage.removeItem('citypulse_user');
  };

  // 4. Función para actualizar los datos desde el Perfil
  const updateUser = (newData) => {
    const updatedUser = { ...user, ...newData };
    setUser(updatedUser);
    
    // Comprobamos dónde estaba guardado el usuario para actualizar esa memoria concreta
    if (localStorage.getItem('citypulse_user')) {
      localStorage.setItem('citypulse_user', JSON.stringify(updatedUser));
    } else if (sessionStorage.getItem('citypulse_user')) {
      sessionStorage.setItem('citypulse_user', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, isAuth: !!user, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);