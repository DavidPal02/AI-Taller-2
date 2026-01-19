
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { authService } from '../services/dbService';
import { User } from '../types';
import { Wrench, ArrowRight, Lock, Mail, User as UserIcon, Loader2, ShieldCheck, Keyboard } from 'lucide-react';

interface AuthProps {
  onLogin: (user: User) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // MFA States
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [tempUser, setTempUser] = useState<User | null>(null);

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
        const user = await authService.register(formData.name, formData.email, formData.password);
        onLogin(user);
      } else {
        const result = await authService.login(formData.email, formData.password);
        if (result.mfaRequired) {
          setTempUser(result.user);
          setMfaRequired(true);
        } else {
          onLogin(result.user);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error de autenticación');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyMFA = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await authService.loginVerifyMFA(mfaCode);
      if (tempUser) onLogin(tempUser);
    } catch (err: any) {
      setError("Código de verificación incorrecto");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-blue-500/5 blur-[120px] rounded-full" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl relative z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg mb-4">
            {mfaRequired ? <ShieldCheck className="text-white w-8 h-8" /> : <Wrench className="text-white w-8 h-8" />}
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Taller Peter</h1>
          <p className="text-slate-400 text-center">
            {mfaRequired ? 'Verificación de Identidad' : 'Gestión profesional de talleres'}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {!mfaRequired ? (
            <motion.form key="login-form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onSubmit={handleSubmit} className="space-y-4">
              {isRegistering && (
                <div className="relative">
                  <UserIcon className="absolute left-3 top-3.5 text-slate-500 w-5 h-5" />
                  <input type="text" placeholder="Nombre Completo" className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white outline-none" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                </div>
              )}
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 text-slate-500 w-5 h-5" />
                <input type="email" placeholder="Email" className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white outline-none" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 text-slate-500 w-5 h-5" />
                <input type="password" placeholder="Contraseña" className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white outline-none" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
              </div>

              {error && <div className="text-red-400 text-sm text-center py-2">{error}</div>}

              <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : isRegistering ? 'Crear Cuenta' : 'Iniciar Sesión'}
              </button>

              <div className="mt-6 text-center">
                <button type="button" onClick={() => setIsRegistering(!isRegistering)} className="text-blue-400 text-sm hover:underline">
                  {isRegistering ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate gratis'}
                </button>
              </div>
            </motion.form>
          ) : (
            <motion.form key="mfa-form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} onSubmit={handleVerifyMFA} className="space-y-6">
              <div className="text-center">
                <p className="text-sm text-slate-400 mb-6">Introduce el código de 6 dígitos generado por tu aplicación de autenticación.</p>
                <div className="relative">
                   <Keyboard className="absolute left-3 top-3.5 text-slate-500 w-5 h-5" />
                   <input 
                    type="text" 
                    maxLength={6} 
                    placeholder="000 000" 
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-4 text-white text-2xl tracking-[0.5em] font-mono text-center outline-none focus:ring-2 focus:ring-blue-500" 
                    value={mfaCode} 
                    onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                    autoFocus
                  />
                </div>
              </div>

              {error && <div className="text-red-400 text-sm text-center">{error}</div>}

              <button type="submit" disabled={loading || mfaCode.length < 6} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verificar y Entrar'}
              </button>

              <button type="button" onClick={() => setMfaRequired(false)} className="w-full text-slate-500 text-sm hover:text-white">Volver al inicio de sesión</button>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
