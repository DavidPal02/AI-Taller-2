
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { Clients } from './components/Clients';
import { Jobs } from './components/Jobs';
import { Expenses } from './components/Expenses';
import { Vehicles } from './components/Vehicles';
import { Mechanics } from './components/Mechanics';
import { Settings } from './components/Settings';
import { Auth } from './components/Auth';
import { motion, AnimatePresence } from 'framer-motion';
import { authService } from './services/dbService';
import { supabase } from './services/supabaseClient';
import { User } from './types';
import { AlertTriangle, ServerCrash } from 'lucide-react';

// Simple Toast Component for Notifications
const Toast = ({ message, onClose }: { message: string, onClose: () => void }) => (
  <motion.div
    initial={{ opacity: 0, y: 50, x: '-50%' }}
    animate={{ opacity: 1, y: 0, x: '-50%' }}
    exit={{ opacity: 0, y: 20, x: '-50%' }}
    className="fixed bottom-20 md:bottom-8 left-1/2 bg-slate-800 text-white px-6 py-3 rounded-full shadow-2xl border border-slate-700 z-[100] flex items-center gap-3 w-max max-w-[90vw]"
  >
    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
    <span className="truncate">{message}</span>
  </motion.div>
);

const ConfigErrorView = () => (
  <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-center">
    <div className="max-w-md bg-slate-900 border border-red-500/30 p-8 rounded-3xl shadow-2xl">
      <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
        <AlertTriangle className="text-red-500 w-8 h-8" />
      </div>
      <h2 className="text-2xl font-bold text-white mb-4">Configuración Requerida</h2>
      <p className="text-slate-400 mb-6 leading-relaxed">
        No se han detectado las variables de entorno de Supabase (<code className="text-blue-400">VITE_SUPABASE_URL</code> y <code className="text-blue-400">VITE_SUPABASE_ANON_KEY</code>).
      </p>
      <p className="text-slate-500 text-sm">
        Para que el SaaS funcione correctamente, debes configurar tu proyecto de Supabase y añadir las claves en el panel de control de tu hosting (Vercel, Netlify, etc.).
      </p>
    </div>
  </div >
);

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState('dashboard');
  const [notification, setNotification] = useState<string | null>(null);

  // Check if Supabase is properly configured
  const isConfigured = !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);

  useEffect(() => {
    if (!isConfigured) {
      setIsLoading(false);
      return;
    }

    // Check initial session
    const checkAuth = async () => {
      try {
        const user = await authService.getCurrentUser();
        setCurrentUser(user);
      } catch (err) {
        console.error("Error checking auth status:", err);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setCurrentUser({
          id: session.user.id,
          name: session.user.user_metadata?.name || '',
          email: session.user.email || '',
          companyName: session.user.user_metadata?.company_name
        });
      } else {
        setCurrentUser(null);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [isConfigured]);

  const handleLogout = async () => {
    await authService.logout();
    setCurrentUser(null);
  };

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'clients':
        return <Clients />;
      case 'jobs':
        return <Jobs onNotify={showNotification} />;
      case 'expenses':
        return <Expenses />;
      case 'vehicles':
        return <Vehicles />;
      case 'mechanics':
        return <Mechanics />;
      case 'settings':
        return <Settings />;
      default:
        return (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <h2 className="text-2xl font-bold text-slate-400 mb-2">En Construcción</h2>
            <p>El módulo {currentView} estará disponible pronto.</p>
          </div>
        );
    }
  };

  if (!isConfigured) {
    return <ConfigErrorView />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="animate-pulse tracking-widest text-sm uppercase">Taller Peter Manager</div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Auth onLogin={() => { }} />; // Session handled by listener
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-500/30">
      <Sidebar currentView={currentView} setView={setCurrentView} onLogout={handleLogout} />

      <main className="flex-1 ml-0 md:ml-64 h-screen relative overflow-hidden bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black pb-16 md:pb-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full w-full"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {notification && <Toast message={notification} onClose={() => setNotification(null)} />}
      </AnimatePresence>
    </div>
  );
};

export default App;
