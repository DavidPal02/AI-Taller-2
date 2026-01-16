import React, { useEffect, useState } from 'react';
import { dbService } from '../services/dbService';
import { WorkshopSettings } from '../types';
import { Save, Store, MapPin, Phone, Mail, Globe } from 'lucide-react';
import { motion } from 'framer-motion';

export const Settings: React.FC = () => {
  const [settings, setSettings] = useState<WorkshopSettings>({
    name: '',
    address: '',
    phone: '',
    email: '',
    website: ''
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const data = await dbService.getSettings();
    setSettings(data);
  };

  const handleSave = async () => {
    await dbService.saveSettings(settings);
    alert('Configuración guardada correctamente.');
  };

  return (
    <div className="p-8 h-full overflow-hidden flex flex-col">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white">Configuración del Taller</h2>
          <p className="text-slate-400 mt-1">Personaliza los datos que aparecerán en las facturas y documentos.</p>
        </div>
        <button 
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors shadow-lg shadow-blue-900/20 font-bold"
        >
          <Save className="w-5 h-5" />
          <span>Guardar Cambios</span>
        </button>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl bg-slate-800/50 border border-slate-700 p-8 rounded-2xl shadow-xl"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Name */}
            <div className="col-span-2">
                <label className="block text-slate-400 text-sm font-medium mb-2 flex items-center gap-2">
                    <Store className="w-4 h-4 text-blue-400" /> Nombre del Taller
                </label>
                <input 
                    type="text" 
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white text-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={settings.name}
                    onChange={(e) => setSettings({...settings, name: e.target.value})}
                    placeholder="Ej. Taller Peter"
                />
            </div>

            {/* Address */}
            <div className="col-span-2">
                <label className="block text-slate-400 text-sm font-medium mb-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-red-400" /> Dirección Completa
                </label>
                <input 
                    type="text" 
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    value={settings.address}
                    onChange={(e) => setSettings({...settings, address: e.target.value})}
                    placeholder="Calle, Número, Ciudad, CP"
                />
            </div>

            {/* Phone */}
            <div>
                <label className="block text-slate-400 text-sm font-medium mb-2 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-green-400" /> Teléfono
                </label>
                <input 
                    type="text" 
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    value={settings.phone}
                    onChange={(e) => setSettings({...settings, phone: e.target.value})}
                    placeholder="+34 ..."
                />
            </div>

            {/* Email */}
            <div>
                <label className="block text-slate-400 text-sm font-medium mb-2 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-yellow-400" /> Correo Electrónico
                </label>
                <input 
                    type="email" 
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    value={settings.email}
                    onChange={(e) => setSettings({...settings, email: e.target.value})}
                />
            </div>

             {/* Website */}
             <div className="col-span-2">
                <label className="block text-slate-400 text-sm font-medium mb-2 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-purple-400" /> Sitio Web (Opcional)
                </label>
                <input 
                    type="text" 
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    value={settings.website}
                    onChange={(e) => setSettings({...settings, website: e.target.value})}
                />
            </div>
        </div>
      </motion.div>
    </div>
  );
};
