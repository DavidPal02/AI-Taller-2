
import React, { useEffect, useState } from 'react';
import { dbService } from '../services/dbService';
import { Mechanic } from '../types';
import { Users, Plus, Trash2, Wrench, Edit3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Mechanics: React.FC = () => {
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newMechanic, setNewMechanic] = useState({ name: '', specialty: '' });

  useEffect(() => {
    loadMechanics();
  }, []);

  const loadMechanics = async () => {
    const data = await dbService.getMechanics();
    setMechanics(data);
  };

  const openNewModal = () => {
    setEditingId(null);
    setNewMechanic({ name: '', specialty: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (mech: Mechanic) => {
    setEditingId(mech.id);
    setNewMechanic({ name: mech.name, specialty: mech.specialty });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!newMechanic.name) return;
    
    if (editingId) {
        const updated: Mechanic = {
            id: editingId,
            name: newMechanic.name,
            specialty: newMechanic.specialty || 'General'
        };
        await dbService.updateMechanic(updated);
        setMechanics(mechanics.map(m => m.id === editingId ? updated : m));
    } else {
        const m: Mechanic = {
            id: crypto.randomUUID(),
            name: newMechanic.name,
            specialty: newMechanic.specialty || 'General'
        };
        await dbService.addMechanic(m);
        setMechanics([...mechanics, m]);
    }

    setIsModalOpen(false);
    setNewMechanic({ name: '', specialty: '' });
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Eliminar mecánico? Esto no borrará sus trabajos históricos.')) {
        await dbService.deleteMechanic(id);
        setMechanics(mechanics.filter(m => m.id !== id));
    }
  };

  return (
    <div className="p-8 h-full overflow-hidden flex flex-col">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white">Equipo de Mecánicos</h2>
          <p className="text-slate-400 mt-1">Gestión del personal técnico.</p>
        </div>
        <button 
          onClick={openNewModal}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors shadow-lg shadow-blue-900/20"
        >
          <Plus className="w-5 h-5" />
          <span>Nuevo Mecánico</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mechanics.map((mech) => (
          <motion.div
            key={mech.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-800/50 border border-slate-700 p-6 rounded-2xl flex items-center justify-between group hover:border-blue-500/50 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center text-slate-300">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">{mech.name}</h3>
                <div className="flex items-center gap-1 text-sm text-slate-400">
                  <Wrench className="w-3 h-3" />
                  <span>{mech.specialty}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
                <button onClick={() => openEditModal(mech)} className="p-2 text-slate-500 hover:text-blue-400 hover:bg-slate-700 rounded-lg transition-colors">
                    <Edit3 className="w-5 h-5" />
                </button>
                <button onClick={() => handleDelete(mech.id)} className="p-2 text-slate-500 hover:text-red-400 hover:bg-slate-700 rounded-lg transition-colors">
                    <Trash2 className="w-5 h-5" />
                </button>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {isModalOpen && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl p-6"
                >
                    <h3 className="text-xl font-bold text-white mb-4">
                        {editingId ? 'Editar Mecánico' : 'Nuevo Mecánico'}
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Nombre Completo</label>
                            <input 
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                                value={newMechanic.name}
                                onChange={(e) => setNewMechanic({...newMechanic, name: e.target.value})}
                                placeholder="Ej. Roberto Gómez"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Especialidad</label>
                            <input 
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                                value={newMechanic.specialty}
                                onChange={(e) => setNewMechanic({...newMechanic, specialty: e.target.value})}
                                placeholder="Ej. Inyección, Frenos..."
                            />
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                        <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white px-4 py-2">Cancelar</button>
                        <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl">Guardar</button>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>
    </div>
  );
};
