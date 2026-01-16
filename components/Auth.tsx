import React, { useState } from 'react';
// Fix: Import AnimatePresence from framer-motion
import { motion, AnimatePresence } from 'framer-motion';
import { authService } from '../services/dbService';
import { User } from '../types';
import { Wrench, ArrowRight, Lock, Mail, User as UserIcon, Loader2 } from 'lucide-react';

interface AuthProps {
  onLogin: (user: User) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isRegistering) {
        if (!formData.name || !formData.email || !formData.password) {
            throw new Error("Todos los campos son obligatorios");
        }
        const user = await authService.register(formData.name, formData.email, formData.password);
        onLogin(user);
      } else {
        if (!formData.email || !formData.password) {
            throw new Error("Credenciales incompletas");
        }
        const user = await authService.login(formData.email, formData.password);
        if (user) {
          onLogin(user);
        } else {
          setError('Credenciales incorrectas');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-blue-500/10 blur-[120px] rounded-full" />
        <div className="absolute top-1/2 right-0 w-2/3 h-2/3 bg-purple-500/10 blur-[120px] rounded-full" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 p-8 rounded-3xl shadow-2xl relative z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 mb-4 transform rotate-3">
            <Wrench className="text-white w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Taller Peter</h1>
          <p className="text-slate-400 text-center">Gestión profesional de talleres SaaS</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <AnimatePresence mode="wait">
            {isRegistering && (
              <motion.div
                key="name-input"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="relative">
                  <UserIcon className="absolute left-3 top-3.5 text-slate-500 w-5 h-5" />
                  <input 
                    type="text" 
                    placeholder="Nombre Completo"
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-600"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative">
            <Mail className="absolute left-3 top-3.5 text-slate-500 w-5 h-5" />
            <input 
              type="email" 
              placeholder="Correo Electrónico"
              className="w-full bg-slate-800/50 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-600"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-3.5 text-slate-500 w-5 h-5" />
            <input 
              type="password" 
              placeholder="Contraseña"
              className="w-full bg-slate-800/50 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-600"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
          </div>

          {error && (
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center"
            >
                {error}
            </motion.div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-900/40 transition-all active:scale-95 flex items-center justify-center gap-2 mt-4"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                    {isRegistering ? 'Crear Cuenta' : 'Iniciar Sesión'}
                    <ArrowRight className="w-5 h-5" />
                </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
            <p className="text-slate-500 text-sm">
                {isRegistering ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}
                <button 
                    onClick={() => {
                        setIsRegistering(!isRegistering);
                        setError(null);
                        setFormData({ name: '', email: '', password: '' });
                    }} 
                    className="ml-2 text-blue-400 hover:text-blue-300 font-medium transition-colors"
                >
                    {isRegistering ? 'Inicia Sesión' : 'Regístrate Gratis'}
                </button>
            </p>
        </div>
      </motion.div>
    </div>
  );
};