
import React, { useEffect, useState } from 'react';
import { dbService, authService } from '../services/dbService';
import { WorkshopSettings } from '../types';
import { Save, Store, Download, Upload, Database, AlertTriangle, ShieldCheck, QrCode, Trash2, Loader2, Check, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SettingsProps {
  onTestPush?: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ onTestPush }) => {
  const [settings, setSettings] = useState<WorkshopSettings>({
    name: '', address: '', phone: '', email: '', website: ''
  });
  
  // MFA Enrollment States
  const [mfaEnrollData, setMfaEnrollData] = useState<any>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    const data = await dbService.getSettings();
    setSettings(data);
  };

  const handleSave = async () => {
    await dbService.saveSettings(settings);
    alert('Configuración guardada correctamente.');
  };

  const handleStartMFAEnroll = async () => {
    setLoading(true);
    try {
      const data = await authService.enrollMFA();
      setMfaEnrollData(data);
      setIsEnrolling(true);
    } catch (err) {
      alert("Error al iniciar el proceso de Doble Factor");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyMFA = async () => {
    setLoading(true);
    try {
      await authService.verifyAndEnableMFA(mfaEnrollData.id, verificationCode);
      setIsEnrolled(true);
      setIsEnrolling(false);
      setMfaEnrollData(null);
      alert("Doble factor activado correctamente");
    } catch (err) {
      alert("Código incorrecto. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    const data = await dbService.exportBackup();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `taller_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (confirm('¿Restaurar copia de seguridad? Esto sobrescribirá los datos locales.')) {
          await dbService.importBackup(data);
          alert('Datos restaurados. Recargando...');
          window.location.reload();
        }
      } catch (err) {
        alert('Error al importar archivo.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-8 h-full overflow-y-auto custom-scrollbar flex flex-col pb-32">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white">Ajustes</h2>
          <p className="text-slate-400 mt-1">Configuración del taller y seguridad avanzada.</p>
        </div>
        <button onClick={handleSave} className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors font-bold">
          <Save className="w-5 h-5" />
          <span>Guardar Cambios</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Datos del taller */}
          <div className="bg-slate-800/50 border border-slate-700 p-8 rounded-2xl shadow-xl">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <Store className="w-5 h-5 text-blue-400" /> Perfil del Taller
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-2">
                    <label className="block text-slate-400 text-xs font-bold uppercase mb-2">Nombre Comercial</label>
                    <input type="text" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white outline-none focus:ring-1 focus:ring-blue-500" value={settings.name} onChange={(e) => setSettings({...settings, name: e.target.value})} />
                </div>
                <div className="col-span-2">
                    <label className="block text-slate-400 text-xs font-bold uppercase mb-2">Dirección</label>
                    <input type="text" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white outline-none" value={settings.address} onChange={(e) => setSettings({...settings, address: e.target.value})} />
                </div>
                <input type="text" placeholder="Teléfono" className="bg-slate-900 border border-slate-700 rounded-xl p-3 text-white outline-none" value={settings.phone} onChange={(e) => setSettings({...settings, phone: e.target.value})} />
                <input type="email" placeholder="Email" className="bg-slate-900 border border-slate-700 rounded-xl p-3 text-white outline-none" value={settings.email} onChange={(e) => setSettings({...settings, email: e.target.value})} />
            </div>
          </div>

          {/* Notificaciones Push de Sistema */}
          <div className="bg-slate-800/50 border border-slate-700 p-8 rounded-2xl shadow-xl overflow-hidden">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-400" /> Notificaciones del Sistema
            </h3>
            <p className="text-slate-400 text-sm mb-6">Permite que el taller te envíe alertas al móvil o escritorio incluso cuando la aplicación está cerrada.</p>
            
            <div className="flex flex-col md:flex-row gap-4">
                <button 
                    onClick={onTestPush}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-slate-900 border border-slate-700 text-white rounded-xl hover:bg-slate-800 transition-all font-bold"
                >
                    <Bell className="w-5 h-5 text-blue-400" />
                    Probar Notificación Push
                </button>
            </div>
            <p className="text-[10px] text-slate-500 mt-4 uppercase font-bold tracking-widest text-center">Debes aceptar los permisos del navegador para que funcione.</p>
          </div>

          {/* Seguridad / 2FA */}
          <div className="bg-slate-800/50 border border-slate-700 p-8 rounded-2xl shadow-xl overflow-hidden">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" /> Seguridad de la Cuenta (2FA)
            </h3>
            <p className="text-slate-400 text-sm mb-6">Añade una capa extra de seguridad requiriendo un código de tu móvil al entrar.</p>

            <AnimatePresence mode="wait">
              {!isEnrolling ? (
                <motion.div key="mfa-status" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between p-4 bg-slate-900 rounded-xl border border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${isEnrolled ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-600'}`} />
                    <span className="text-white font-medium">{isEnrolled ? 'Autenticación en dos pasos activada' : 'Autenticación en dos pasos desactivada'}</span>
                  </div>
                  {!isEnrolled ? (
                    <button onClick={handleStartMFAEnroll} disabled={loading} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-lg transition-all flex items-center gap-2">
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />} Configurar 2FA
                    </button>
                  ) : (
                    <button className="px-4 py-2 bg-red-500/10 text-red-400 text-sm font-bold rounded-lg border border-red-500/20 hover:bg-red-500 hover:text-white transition-all">
                      Desactivar
                    </button>
                  )}
                </motion.div>
              ) : (
                <motion.div key="mfa-enroll" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-6">
                  <div className="flex flex-col md:flex-row gap-8 items-center bg-white p-6 rounded-2xl">
                    <div className="bg-white p-2 rounded-lg" dangerouslySetInnerHTML={{ __html: mfaEnrollData?.totp?.qr_code }} />
                    <div className="flex-1 text-slate-900">
                      <h4 className="font-bold text-lg mb-2">Escanea el código QR</h4>
                      <p className="text-sm opacity-80 mb-4">Usa Google Authenticator o Authy para escanear el código. Luego introduce el código de 6 dígitos que aparezca.</p>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          maxLength={6} 
                          placeholder="000000" 
                          className="bg-slate-100 border border-slate-200 rounded-lg p-3 text-xl tracking-[0.3em] font-mono text-center w-full focus:ring-2 focus:ring-blue-500 outline-none"
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                        />
                        <button onClick={handleVerifyMFA} disabled={verificationCode.length < 6 || loading} className="bg-blue-600 text-white px-6 rounded-lg font-bold hover:bg-blue-700 transition-all flex items-center gap-2">
                           {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />} Verificar
                        </button>
                      </div>
                      <button onClick={() => setIsEnrolling(false)} className="mt-4 text-xs text-slate-500 hover:underline">Cancelar proceso</button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-2xl">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-400" /> Backup Local
            </h3>
            <div className="space-y-3">
                <button onClick={handleExport} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-all border border-slate-600">
                    <Download className="w-5 h-5" /> Exportar JSON
                </button>
                <div className="relative">
                    <input type="file" accept=".json" onChange={handleImport} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    <div className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 border border-slate-700 text-blue-400 rounded-xl">
                        <Upload className="w-5 h-5" /> Importar Backup
                    </div>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
