import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Home from './pages/Home';
import MapPage from './pages/MapPage';
import Login from './pages/Login';
import ResetPasswordPage from './pages/ResetPasswordPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import Profile from './pages/Profile';
import Footer from './components/Footer';
import Navbar from './components/Navbar';
import ConfirmDeletePage from './pages/ConfirmDeletePage';
import TermsPage from './pages/TermsPage';

/**
 * Main Application Component.
 * Initializes authentication context and defines the global routing structure.
 */
function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="flex flex-col min-h-screen bg-gray-50">
          
          <Navbar />

          <main className="flex-1 relative flex flex-col">
            <div className="flex-1">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/map" element={<MapPage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/verify-email" element={<VerifyEmailPage />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/confirm-delete" element={<ConfirmDeletePage />} />
                <Route path="/terminos" element={<TermsPage />} />
              </Routes>
            </div>
            
            <Footer />
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;