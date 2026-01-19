
import React, { useEffect, useState } from 'react';
import { dbService } from '../services/dbService';
import { Vehicle, Job, Client, Mechanic } from '../types';
import { Car, Plus, Search, Calendar, AlertCircle, Gauge, History, X, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const getItvStatus = (vehicle: Vehicle) => {
    if (!vehicle.lastItvDate && vehicle.year) {
        const firstItv = new Date(vehicle.year + 4, 0, 1);
        const today = new Date();
        if (today < firstItv) return { status: 'exempt', label: 'Exento hasta ' + firstItv.getFullYear(), color: 'text-blue-400', bg: 'bg-blue-400/10' };
    }

    if (!vehicle.lastItvDate) return { status: 'pending', label: 'Sin Datos', color: 'text-slate-500', bg: 'bg-slate-500/10' };
    
    const last = new Date(vehicle.lastItvDate);
    const age = new Date().getFullYear() - (vehicle.year || 2000);
    let nextDate = new Date(last);

    if (age >= 4 && age < 10) nextDate.setFullYear(last.getFullYear() + 2);
    else if (age >= 10) nextDate.setFullYear(last.getFullYear() + 1);
    else return { status: 'exempt', label: 'Exento (Coche Nuevo)', color: 'text-blue-400', bg: 'bg-blue-400/10' };

    const today = new Date();
    const diffTime = nextDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { status: 'expired', label: 'CADUCADA', color: 'text-red-500', bg: 'bg-red-500/10', date: nextDate };
    if (diffDays <= 15) return { status: 'warning', label: 'Caduca en ' + diffDays + ' días', color: 'text-amber-500', bg: 'bg-amber-500/10', date: nextDate };
    return { status: 'ok', label: 'Vigente', color: 'text-emerald-500', bg: 'bg-emerald-500/10', date: nextDate };
};

export const Vehicles: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newVehicle, setNewVehicle] = useState<Partial<Vehicle>>({ make: '', model: '', plate: '', year: new Date().getFullYear(), lastItvDate: '' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [vs, cs] = await Promise.all([dbService.getVehicles(), dbService.getClients()]);
    setVehicles(vs);
    setClients(cs);
  };

  const handleAdd = async () => {
      if (!newVehicle.plate || !newVehicle.clientId) return;
      const v: Vehicle = {
          id: crypto.randomUUID(),
          clientId: newVehicle.clientId!,
          make: newVehicle.make || '',
          model: newVehicle.model || '',
          plate: newVehicle.plate.toUpperCase(),
          year: newVehicle.year || 2020,
          currentMileage: newVehicle.currentMileage || 0,
          lastItvDate: newVehicle.lastItvDate
      };
      await dbService.addVehicle(v);
      setVehicles([...vehicles, v]);
      setIsModalOpen(false);
  };

  return (
    <div className="p-8 h-full overflow-hidden flex flex-col">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white">Flota de Vehículos</h2>
          <p className="text-slate-400 mt-1">Seguimiento de mantenimientos e ITV.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl flex items-center gap-2 shadow-lg transition-transform active:scale-95">
          <Plus className="w-5 h-5" /> Nuevo Coche
        </button>
      </div>

      <div className="mb-6 relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
        <input 
          className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-12 pr-4 py-3 text-white outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Buscar matrícula, marca o modelo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 overflow-y-auto custom-scrollbar pb-8">
        {vehicles.filter(v => v.plate.includes(searchTerm.toUpperCase()) || v.make.toLowerCase().includes(searchTerm.toLowerCase())).map(v => {
            const itv = getItvStatus(v);
            return (
              <motion.div 
                key={v.id} 
                className="bg-slate-800/50 border border-slate-700 p-6 rounded-2xl group cursor-pointer hover:border-blue-500/50 transition-all relative overflow-hidden"
              >
                <div className="flex justify-between items-start mb-4">
                    <div className="bg-slate-900 border border-slate-700 px-3 py-1 rounded-md font-mono text-blue-400 text-sm font-bold">{v.plate}</div>
                    <div className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${itv.bg} ${itv.color} flex items-center gap-1`}>
                        <Calendar className="w-3 h-3" /> {itv.label}
                    </div>
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-blue-400 truncate">{v.make} {v.model}</h3>
                <p className="text-sm text-slate-500">{clients.find(c => c.id === v.clientId)?.name || 'Sin dueño'}</p>
                
                <div className="mt-6 flex items-center justify-between text-xs text-slate-400 border-t border-slate-700 pt-3">
                    <div className="flex items-center gap-1"><Gauge className="w-3 h-3" /> {v.currentMileage?.toLocaleString()} km</div>
                    {itv.date && <div className="font-mono">{itv.date.toLocaleDateString()}</div>}
                </div>
              </motion.div>
            );
        })}
      </div>

      <AnimatePresence>
        {isModalOpen && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
                <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl">
                    <h3 className="text-xl font-bold text-white mb-6">Nuevo Vehículo</h3>
                    <div className="space-y-4">
                        <select className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl text-white outline-none" onChange={e => setNewVehicle({...newVehicle, clientId: e.target.value})}>
                            <option value="">Seleccionar Cliente...</option>
                            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <div className="grid grid-cols-2 gap-4">
                            <input placeholder="Marca" className="bg-slate-800 border border-slate-700 p-3 rounded-xl text-white outline-none" value={newVehicle.make} onChange={e => setNewVehicle({...newVehicle, make: e.target.value})} />
                            <input placeholder="Modelo" className="bg-slate-800 border border-slate-700 p-3 rounded-xl text-white outline-none" value={newVehicle.model} onChange={e => setNewVehicle({...newVehicle, model: e.target.value})} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <input placeholder="Matrícula" className="bg-slate-800 border border-slate-700 p-3 rounded-xl text-white outline-none uppercase font-mono" value={newVehicle.plate} onChange={e => setNewVehicle({...newVehicle, plate: e.target.value.toUpperCase()})} />
                            <input type="number" placeholder="Año" className="bg-slate-800 border border-slate-700 p-3 rounded-xl text-white outline-none" value={newVehicle.year} onChange={e => setNewVehicle({...newVehicle, year: parseInt(e.target.value)})} />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-500 mb-2 uppercase font-bold tracking-wider">Última ITV</label>
                            <input type="date" className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl text-white outline-none" value={newVehicle.lastItvDate} onChange={e => setNewVehicle({...newVehicle, lastItvDate: e.target.value})} />
                        </div>
                    </div>
                    <div className="mt-8 flex justify-end gap-3">
                        <button onClick={() => setIsModalOpen(false)} className="text-slate-400 px-4 py-2 hover:text-white">Cancelar</button>
                        <button onClick={handleAdd} className="bg-blue-600 text-white px-8 py-2 rounded-xl font-bold">Guardar</button>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>
    </div>
  );
};
