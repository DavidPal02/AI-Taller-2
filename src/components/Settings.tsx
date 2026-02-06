
import React, { useEffect, useState } from 'react';
import { dbService, authService } from '../services/dbService';
import { WorkshopSettings } from '../types';
import { Save, Store, Download, Upload, Database, ShieldCheck, QrCode, Loader2, Check, Bell, AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SettingsProps {
  onTestPush?: () => void;
  onNotify?: (msg: string, type?: 'success' | 'warning' | 'info') => void;
}

export const Settings: React.FC<SettingsProps> = ({ onTestPush, onNotify }) => {
  const [settings, setSettings] = useState<WorkshopSettings>({
    name: '', address: '', phone: '', email: '', website: ''
  });

  // MFA Enrollment States
  const [mfaEnrollData, setMfaEnrollData] = useState<any>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(false);

  // Custom Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: () => void;
  }>({ isOpen: false, title: '', message: '', action: () => { } });

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    const data = await dbService.getSettings();
    setSettings(data);
  };

  const notify = (msg: string, type: 'success' | 'warning' | 'info' = 'info') => {
    if (onNotify) onNotify(msg, type);
  };

  const handleSave = async () => {
    await dbService.saveSettings(settings);
    notify('Configuración guardada correctamente.', 'success');
  };

  const handleStartMFAEnroll = async () => {
    setLoading(true);
    try {
      const data = await authService.enrollMFA();
      setMfaEnrollData(data);
      setIsEnrolling(true);
    } catch (err) {
      notify("Error al iniciar el proceso de Doble Factor", 'warning');
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
      notify("Doble factor activado correctamente", 'success');
    } catch (err) {
      notify("Código incorrecto. Inténtalo de nuevo.", 'warning');
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
    notify('Backup exportado correctamente', 'success');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        setConfirmModal({
          isOpen: true,
          title: '¿Restaurar Copia de Seguridad?',
          message: 'Esta acción sobrescribirá todos los datos actuales del taller con los del archivo seleccionado. NO se puede deshacer.',
          action: async () => {
            await dbService.importBackup(data);
            notify('Datos restaurados. Recargando...', 'success');
            setTimeout(() => window.location.reload(), 1500);
          }
        });
      } catch (err) {
        notify('Error al leer el archivo de backup.', 'warning');
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
        <button onClick={handleSave} className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors font-bold shadow-lg shadow-blue-900/20 active:scale-95">
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
                <input type="text" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white outline-none focus:ring-1 focus:ring-blue-500 transition-all font-bold" value={settings.name} onChange={(e) => setSettings({ ...settings, name: e.target.value })} placeholder="Ej: Taller Mecánico Peter" />
              </div>
              <div className="col-span-2">
                <label className="block text-slate-400 text-xs font-bold uppercase mb-2">Dirección</label>
                <input type="text" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white outline-none focus:ring-1 focus:ring-blue-500" value={settings.address} onChange={(e) => setSettings({ ...settings, address: e.target.value })} placeholder="Calle Principal, 123" />
              </div>
              <div className="col-span-1">
                <label className="block text-slate-400 text-xs font-bold uppercase mb-2">Teléfono</label>
                <input type="text" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white outline-none focus:ring-1 focus:ring-blue-500" value={settings.phone} onChange={(e) => setSettings({ ...settings, phone: e.target.value })} placeholder="+34 600 000 000" />
              </div>
              <div className="col-span-1">
                <label className="block text-slate-400 text-xs font-bold uppercase mb-2">Email</label>
                <input type="email" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white outline-none focus:ring-1 focus:ring-blue-500" value={settings.email} onChange={(e) => setSettings({ ...settings, email: e.target.value })} placeholder="contacto@taller.com" />
              </div>
            </div>
          </div>

          {/* Gestión de Alertas ITV */}
          <div className="bg-slate-800/50 border border-slate-700 p-8 rounded-2xl shadow-xl">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-400" /> Alertas Preventivas de ITV
            </h3>
            <p className="text-slate-400 text-sm mb-6">Configura con cuánta antelación quieres recibir avisos de ITV para los vehículos de tus clientes.</p>

            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                {(settings.itvNotificationThresholds || [1, 3, 7, 14, 30]).sort((a, b) => b - a).map((days) => (
                  <div key={days} className="bg-slate-900 border border-slate-700 pl-4 pr-2 py-2 rounded-xl flex items-center gap-3">
                    <span className="text-sm font-bold text-white">
                      {days >= 7 ? `${days / 7} ${days === 7 ? 'semana' : 'semanas'}` : `${days} ${days === 1 ? 'día' : 'días'}`} antes
                    </span>
                    <button
                      onClick={() => setSettings({
                        ...settings,
                        itvNotificationThresholds: settings.itvNotificationThresholds?.filter(d => d !== days)
                      })}
                      className="p-1.5 hover:bg-red-500/10 text-slate-500 hover:text-red-400 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <select
                  className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-white outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                  onChange={(e) => {
                    const days = parseInt(e.target.value);
                    if (days && !settings.itvNotificationThresholds?.includes(days)) {
                      setSettings({
                        ...settings,
                        itvNotificationThresholds: [...(settings.itvNotificationThresholds || []), days]
                      });
                    }
                    e.target.value = "";
                  }}
                >
                  <option value="">Añadir aviso...</option>
                  <option value="1">1 día antes</option>
                  <option value="3">3 días antes</option>
                  <option value="7">1 semana antes</option>
                  <option value="14">2 semanas antes</option>
                  <option value="21">3 semanas antes</option>
                  <option value="30">1 mes antes</option>
                </select>
              </div>
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
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-slate-900 border border-slate-700 text-white rounded-xl hover:bg-slate-800 transition-all font-bold active:scale-95"
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
                    <button onClick={handleStartMFAEnroll} disabled={loading} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-lg transition-all flex items-center gap-2 shadow-lg shadow-blue-900/20 active:scale-95">
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />} Configurar 2FA
                    </button>
                  ) : (
                    <button className="px-4 py-2 bg-red-500/10 text-red-400 text-sm font-bold rounded-lg border border-red-500/20 hover:bg-red-500 hover:text-white transition-all active:scale-95">
                      Desactivar
                    </button>
                  )}
                </motion.div>
              ) : (
                <motion.div key="mfa-enroll" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-6">
                  <div className="flex flex-col md:flex-row gap-8 items-center bg-white p-6 rounded-2xl">
                    <div className="bg-white p-2 rounded-lg mix-blend-multiply" dangerouslySetInnerHTML={{ __html: mfaEnrollData?.totp?.qr_code }} />
                    <div className="flex-1 text-slate-900">
                      <h4 className="font-bold text-lg mb-2">Escanea el código QR</h4>
                      <p className="text-sm opacity-80 mb-4">Usa Google Authenticator o Authy para escanear el código. Luego introduce el código de 6 dígitos que aparezca.</p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="000000"
                          className="bg-slate-100 border border-slate-200 rounded-lg p-3 text-xl tracking-[0.3em] font-mono text-center w-full focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                        />
                        <button onClick={handleVerifyMFA} disabled={verificationCode.length < 6 || loading} className="bg-blue-600 text-white px-6 rounded-lg font-bold hover:bg-blue-700 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50 disabled:scale-100">
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
          <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-2xl sticky top-8">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-400" /> Backup Local
            </h3>
            <div className="space-y-3">
              <button onClick={handleExport} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-all border border-slate-600 font-bold active:scale-95">
                <Download className="w-5 h-5" /> Exportar JSON
              </button>
              <div className="relative group">
                <input type="file" accept=".json" onChange={handleImport} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                <div className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 border border-slate-700 text-blue-400 rounded-xl group-hover:bg-slate-800 transition-colors font-bold">
                  <Upload className="w-5 h-5" /> Importar Backup
                </div>
              </div>
            </div>
            <p className="text-[10px] text-slate-500 mt-4 text-center leading-relaxed">
              La importación sobrescribirá los datos actuales. Asegúrate de tener una copia de seguridad reciente.
            </p>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmModal.isOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-red-500/30 w-full max-w-md rounded-2xl p-6 shadow-2xl relative"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-red-500/10 rounded-full shrink-0">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white mb-2">{confirmModal.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{confirmModal.message}</p>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                  className="px-4 py-2 text-slate-400 hover:text-white font-bold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    confirmModal.action();
                    setConfirmModal({ ...confirmModal, isOpen: false });
                  }}
                  className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold shadow-lg shadow-red-900/20 active:scale-95 transition-all"
                >
                  Confirmar Restauración
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
