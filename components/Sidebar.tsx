import React from 'react';
import { LayoutDashboard, Users, Car, Wrench, Settings, LogOut, Wallet, HardHat } from 'lucide-react';
import { motion } from 'framer-motion';

interface SidebarProps {
  currentView: string;
  setView: (view: string) => void;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, onLogout }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Inicio', icon: LayoutDashboard },
    { id: 'jobs', label: 'Trabajos', icon: Wrench },
    { id: 'vehicles', label: 'Coches', icon: Car },
    { id: 'clients', label: 'Clientes', icon: Users },
    { id: 'mechanics', label: 'Equipo', icon: HardHat },
    { id: 'expenses', label: 'Gastos', icon: Wallet },
    { id: 'settings', label: 'Ajustes', icon: Settings },
  ];

  return (
    <>
      {/* Desktop Sidebar (Hidden on mobile) */}
      <aside className="hidden md:flex w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex-col h-screen fixed left-0 top-0 shadow-2xl z-50">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800/50">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Wrench className="text-white w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Taller Peter
          </h1>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive 
                    ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20 shadow-lg' 
                    : 'hover:bg-slate-800 hover:text-white'
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-white'}`} />
                <span className="font-medium">{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800/50">
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Salir</span>
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation (Hidden on desktop) */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 z-50 pb-safe-area">
        <div className="flex justify-around items-center h-16 px-2">
          {menuItems.slice(0, 5).map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
                  isActive ? 'text-blue-400' : 'text-slate-500'
                }`}
              >
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className={`p-1.5 rounded-xl ${isActive ? 'bg-blue-500/10' : ''}`}
                >
                  <item.icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
                </motion.div>
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          })}
           {/* Mobile Menu More */}
           <button
                onClick={() => setView('settings')}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
                  currentView === 'settings' ? 'text-blue-400' : 'text-slate-500'
                }`}
              >
                <motion.div whileTap={{ scale: 0.9 }}>
                  <Settings className="w-6 h-6" />
                </motion.div>
                <span className="text-[10px] font-medium">Ajustes</span>
            </button>
        </div>
        
        {/* Mobile Logout (Often hidden in settings in real apps, but adding here if settings is active for completeness or just rely on desktop/settings view) */}
      </nav>
    </>
  );
};