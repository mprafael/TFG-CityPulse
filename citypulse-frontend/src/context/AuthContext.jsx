import { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

/**
 * Authentication Provider Component.
 * Manages global user state, session persistence, and authentication methods.
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  /**
   * Hydrate authentication state from storage on initial mount.
   */
  useEffect(() => {
    const savedUser = localStorage.getItem('citypulse_user') || sessionStorage.getItem('citypulse_user');
    
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  /**
   * Authenticates the user and persists the session.
   * @param {Object} userData - The authenticated user's payload.
   * @param {boolean} rememberMe - Determines if the session should persist across browser restarts.
   */
  const login = (userData, rememberMe = false) => {
    setUser(userData);
    
    if (rememberMe) {
      localStorage.setItem('citypulse_user', JSON.stringify(userData));
      sessionStorage.removeItem('citypulse_user'); 
    } else {
      sessionStorage.setItem('citypulse_user', JSON.stringify(userData));
      localStorage.removeItem('citypulse_user'); 
    }
  };

  /**
   * Clears the current user session and purges related storage data.
   */
  const logout = () => {
    setUser(null);
    localStorage.removeItem('citypulse_user');
    sessionStorage.removeItem('citypulse_user');
  };

  /**
   * Partially updates the current user's data in context and storage.
   * @param {Object} newData - The partial user object containing updated fields.
   */
  const updateUser = (newData) => {
    const updatedUser = { ...user, ...newData };
    setUser(updatedUser);
    
    if (localStorage.getItem('citypulse_user')) {
      localStorage.setItem('citypulse_user', JSON.stringify(updatedUser));
    } else if (sessionStorage.getItem('citypulse_user')) {
      sessionStorage.setItem('citypulse_user', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, login, logout, updateUser, 
      isAuth: !!user, 
      isAdmin: user?.email === 'contacto.citypulse@gmail.com',
      loading 
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);