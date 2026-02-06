
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { Clients } from './components/Clients';
import { Jobs } from './components/Jobs';
import { Finance } from './components/Finance';
import { Vehicles, getItvStatus } from './components/Vehicles';
import { Mechanics } from './components/Mechanics';
import { Settings } from './components/Settings';
import { Auth } from './components/Auth';
import { VerifySuccess } from './components/VerifySuccess';
import { motion, AnimatePresence } from 'framer-motion';
import { authService, dbService } from './services/dbService';
import { User } from './types';
import { AlertTriangle, X, CheckCircle, PartyPopper, Sparkles, Bell } from 'lucide-react';

const Toast = ({ message, onClose, type = 'info' }: { message: string, onClose: () => void, type?: 'info' | 'warning' | 'success' | 'welcome' }) => (
  <motion.div
    initial={{ opacity: 0, y: 50, x: '-50%' }}
    animate={{ opacity: 1, y: 0, x: '-50%' }}
    exit={{ opacity: 0, y: 20, scale: 0.95, x: '-50%' }}
    className={`fixed bottom-24 md:bottom-10 left-1/2 px-6 py-4 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border z-[300] flex items-center gap-4 w-max max-w-[90vw] backdrop-blur-2xl ${type === 'warning' ? 'bg-amber-900/90 border-amber-500/50 text-amber-100' :
      type === 'success' ? 'bg-emerald-900/90 border-emerald-500/50 text-emerald-100' :
        type === 'welcome' ? 'bg-gradient-to-r from-emerald-600 to-teal-600 border-emerald-400/50 text-white shadow-emerald-500/20' :
          'bg-slate-800/90 border-slate-700 text-white'
      }`}
  >
    <div className="flex-shrink-0">
      {type === 'warning' && <AlertTriangle className="w-6 h-6 text-amber-400" />}
      {type === 'success' && <CheckCircle className="w-6 h-6 text-emerald-400" />}
      {type === 'welcome' && (
        <div className="relative">
          <PartyPopper className="w-8 h-8 text-white animate-bounce" />
          <Sparkles className="absolute -top-2 -right-2 w-4 h-4 text-yellow-300 animate-pulse" />
        </div>
      )}
    </div>
    <div className="flex flex-col pr-2">
      <span className="text-sm font-black uppercase tracking-tight">
        {type === 'warning' ? 'Aviso de Seguridad' :
          type === 'welcome' ? '¡CUENTA ACTIVADA!' :
            'Notificación del Sistema'}
      </span>
      <span className="text-xs font-medium opacity-90 leading-tight">{message}</span>
    </div>
    <button onClick={onClose} className="ml-2 p-2 hover:bg-white/10 rounded-xl transition-colors">
      <X className="w-4 h-4" />
    </button>
  </motion.div>
);

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState('dashboard');
  const [notification, setNotification] = useState<{ msg: string, type: 'info' | 'warning' | 'success' | 'welcome' } | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [targetJobId, setTargetJobId] = useState<string | null>(null);

  useEffect(() => {
    const initApp = async () => {
      // Check for custom verification route
      if (window.location.pathname === '/verify-success') {
        setIsVerifying(true);
        setIsLoading(false);
        return;
      }

      await checkAuth();
      handleEmailVerificationDetection();
    };
    initApp();
  }, []);

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        console.log('Permiso de notificaciones concedido');
      }
    }
  };

  const sendPushNotification = (title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      navigator.serviceWorker.ready.then(registration => {
        // Casting the notification options to any to fix the TypeScript error regarding the 'vibrate' property.
        // The 'vibrate' property is valid for service worker notifications but not always defined in standard NotificationOptions.
        registration.showNotification(title, {
          body: body,
          icon: 'https://cdn-icons-png.flaticon.com/512/1048/1048339.png',
          vibrate: [200, 100, 200],
          badge: 'https://cdn-icons-png.flaticon.com/512/1048/1048339.png',
        } as any);
      });
    }
  };

  const checkAuth = async () => {
    try {
      const user = await authService.getCurrentUser();
      if (user) {
        setCurrentUser(user);
        scanVehicleAlerts();
        requestNotificationPermission();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailVerificationDetection = () => {
    const hash = window.location.hash;
    const searchParams = new URLSearchParams(window.location.search);
    if (hash.includes('type=signup') || searchParams.get('verified') === 'true' || hash.includes('access_token')) {
      setTimeout(() => {
        showNotification("Felicidades has verificado tu correo con éxito. Bienvenido al SaaS", "welcome");
      }, 1000);
      window.history.replaceState(null, '', window.location.pathname);
    }
  };

  const scanVehicleAlerts = async () => {
    const [vehicles, settings] = await Promise.all([
      dbService.getVehicles(),
      dbService.getSettings()
    ]);

    const thresholds = settings.itvNotificationThresholds || [1, 3, 7, 14];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    vehicles.forEach(v => {
      const itv = getItvStatus(v);
      if (!itv.date) return;

      const expiryDate = new Date(itv.date);
      expiryDate.setHours(0, 0, 0, 0);

      const diffTime = expiryDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // 1. Critical Alert (Expired)
      if (diffDays < 0) {
        showNotification(`¡URGENTE! La ITV del vehículo ${v.plate} esta CADUCADA.`, 'warning');
        sendPushNotification("¡ITV CADUCADA!", `El coche ${v.plate} (${v.make}) tiene la ITV vencida.`);
        return;
      }

      // 2. Scheduled Preventive Alerts
      if (thresholds.includes(diffDays)) {
        const timeLabel = diffDays >= 7
          ? `${diffDays / 7} ${diffDays === 7 ? 'semana' : 'semanas'}`
          : `${diffDays} ${diffDays === 1 ? 'día' : 'días'}`;

        showNotification(`Recordatorio: La ITV del vehículo ${v.plate} caduca en ${timeLabel}.`, 'info');
        sendPushNotification("Aviso Preventivo de ITV", `La ITV del coche ${v.plate} vencerá en ${timeLabel}.`);
      }
    });
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setCurrentView('dashboard');
    scanVehicleAlerts();
    requestNotificationPermission();
  };

  const handleLogout = async () => {
    await authService.logout();
    setCurrentUser(null);
  };

  const showNotification = (msg: string, type: any = 'info') => {
    setNotification({ msg, type });
    const duration = type === 'welcome' ? 10000 : 6000;
    setTimeout(() => setNotification(null), duration);
  };

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard />;
      case 'clients': return <Clients />;
      case 'jobs': return <Jobs onNotify={(m) => showNotification(m, 'success')} pendingJobId={targetJobId} onClearPendingJob={() => setTargetJobId(null)} />;
      case 'finance': return <Finance />;
      case 'vehicles': return <Vehicles onNotify={(m) => showNotification(m, 'success')} onNavigateToJob={(id) => { setTargetJobId(id); setCurrentView('jobs'); }} />;
      case 'mechanics': return <Mechanics />;
      case 'settings': return <Settings onNotify={(m, t) => showNotification(m, t)} onTestPush={() => sendPushNotification("Prueba de Notificación", "Esto es una notificación Push de prueba desde tu SaaS de Taller.")} />;
      default: return <Dashboard />;
    }
  };

  if (isLoading) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
      <motion.div
        animate={{
          rotate: 360,
          scale: [1, 1.1, 1],
        }}
        transition={{
          rotate: { repeat: Infinity, duration: 1, ease: "linear" },
          scale: { repeat: Infinity, duration: 2, ease: "easeInOut" }
        }}
        className="w-16 h-16 border-t-4 border-l-4 border-blue-600 rounded-full mb-6 shadow-[0_0_20px_rgba(37,99,235,0.3)]"
      />
      <p className="text-slate-400 font-bold tracking-widest text-xs uppercase animate-pulse">Taller Peter Manager Cloud</p>
    </div>
  );

  if (isVerifying) return <VerifySuccess onNavigateHome={() => { setIsVerifying(false); window.location.href = '/'; }} />;

  if (!currentUser) return <Auth onLogin={handleLogin} />;

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-500/30 overflow-hidden">
      <Sidebar currentView={currentView} setView={setCurrentView} onLogout={handleLogout} />
      <main className="flex-1 ml-0 md:ml-64 h-screen relative bg-slate-950 overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentView}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="h-full w-full overflow-hidden"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {notification && (
          <Toast
            message={notification.msg}
            type={notification.type}
            onClose={() => setNotification(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
