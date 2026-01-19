
import React, { useState } from 'react';
import { LayoutDashboard, Users, Car, Wrench, Settings, LogOut, Wallet, HardHat, MoreHorizontal, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SidebarProps {
  currentView: string;
  setView: (view: string) => void;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Inicio', icon: LayoutDashboard },
    { id: 'jobs', label: 'Trabajos', icon: Wrench },
    { id: 'expenses', label: 'Gastos', icon: Wallet },
    { id: 'vehicles', label: 'Coches', icon: Car },
    { id: 'clients', label: 'Clientes', icon: Users },
    { id: 'mechanics', label: 'Equipo', icon: HardHat },
    { id: 'settings', label: 'Ajustes', icon: Settings },
  ];

  const mobilePrimaryItems = menuItems.slice(0, 4); 

  const handleMobileNav = (id: string) => {
    setView(id);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Desktop Sidebar - Se mantiene igual para escritorio */}
      <aside className="hidden md:flex w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex-col h-screen fixed left-0 top-0 shadow-2xl z-[100] overflow-hidden">
        <div className="p-8 flex items-center gap-3 border-b border-slate-800/50">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Wrench className="text-white w-6 h-6" />
          </div>
          <h1 className="text-xl font-black bg-gradient-to-br from-white to-slate-400 bg-clip-text text-transparent tracking-tight">
            Taller Peter
          </h1>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button key={item.id} onClick={() => setView(item.id)} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 relative group overflow-hidden ${isActive ? 'text-blue-400 font-bold' : 'text-slate-500 hover:text-white hover:bg-slate-800/40'}`}>
                {isActive && <motion.div layoutId="desktopActiveTabBG" className="absolute inset-0 bg-blue-600/10 border border-blue-600/20 rounded-2xl" transition={{ type: "spring", bounce: 0.15, duration: 0.5 }} />}
                <item.icon className={`w-5 h-5 relative z-10 transition-colors ${isActive ? 'text-blue-400' : 'group-hover:text-white'}`} />
                <span className="relative z-10 text-sm tracking-wide">{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="p-6 border-t border-slate-800/50">
          <button onClick={onLogout} className="w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all group">
            <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-bold text-sm">Salir</span>
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation - Optimizada para Safe Area e iPhone 17+ */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-slate-900/80 backdrop-blur-3xl border-t border-white/5 z-[200] pb-[env(safe-area-inset-bottom)] shadow-[0_-15px_50px_rgba(0,0,0,0.8)]">
        <div className="flex justify-around items-center h-20 px-4 relative">
          {mobilePrimaryItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleMobileNav(item.id)}
                className={`flex flex-col items-center justify-center w-16 h-full transition-all duration-500 relative ${
                  isActive ? 'text-blue-500' : 'text-slate-500'
                }`}
              >
                <item.icon className={`w-6 h-6 mb-1.5 transition-transform duration-300 ${isActive ? 'scale-110 drop-shadow-[0_0_12px_rgba(59,130,246,0.6)]' : ''}`} />
                <span className="text-[9px] font-black uppercase tracking-[0.1em]">{item.label}</span>
                {isActive && (
                  <motion.div 
                    layoutId="mobileActiveInd"
                    className="absolute top-0 w-8 h-1 bg-blue-500 rounded-b-full shadow-[0_5px_15px_rgba(59,130,246,0.4)]"
                    transition={{ type: "spring", bounce: 0.3 }}
                  />
                )}
              </button>
            );
          })}
          
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex flex-col items-center justify-center w-16 h-full text-slate-500 active:text-white transition-colors"
          >
            <MoreHorizontal className="w-6 h-6 mb-1.5" />
            <span className="text-[9px] font-black uppercase tracking-[0.1em]">Más</span>
          </button>
        </div>
      </nav>

      {/* Side Drawer - Mismo estilo mejorado */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="md:hidden fixed inset-0 bg-slate-950/95 backdrop-blur-3xl z-[300] flex flex-col p-8 pt-[env(safe-area-inset-top)]">
            <div className="flex justify-between items-center mb-16 mt-8">
              <div className="flex items-center gap-4">
                 <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/40">
                    <Wrench className="text-white w-8 h-8" />
                 </div>
                 <h2 className="text-4xl font-black text-white tracking-tighter italic">PETER</h2>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-5 bg-slate-800 rounded-full text-white active:scale-90 transition-transform"><X className="w-8 h-8" /></button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {menuItems.slice(4).map((item) => (
                <button key={item.id} onClick={() => handleMobileNav(item.id)} className={`flex flex-col items-start gap-4 p-6 rounded-[2rem] border-2 transition-all active:scale-95 ${currentView === item.id ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
                    <div className={`p-3 rounded-xl ${currentView === item.id ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}><item.icon className="w-6 h-6" /></div>
                    <span className="font-black uppercase text-[10px] tracking-widest">{item.label}</span>
                </button>
              ))}
            </div>
            <div className="mt-auto pb-[env(safe-area-inset-bottom)] space-y-6">
               <button onClick={onLogout} className="w-full flex items-center justify-center gap-3 p-6 bg-red-500/10 border-2 border-red-500/20 text-red-400 rounded-[2rem] font-black uppercase tracking-widest active:scale-95 transition-all">
                 <LogOut className="w-6 h-6" /> Salir
               </button>
               <p className="text-center text-[9px] text-slate-700 font-black uppercase tracking-[0.5em]">Premium Cloud Management v2.1</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
