
import React, { useEffect, useState } from 'react';
import { dbService } from '../services/dbService';
import { Vehicle, Client, Job } from '../types';
import { Plus, Search, Calendar, AlertTriangle, Gauge, X, History, Clock, TrendingUp } from 'lucide-react';
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

interface VehiclesProps {
  onNotify?: (msg: string) => void;
}

export const Vehicles: React.FC<VehiclesProps> = ({ onNotify }) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);
  const [newVehicle, setNewVehicle] = useState<Partial<Vehicle>>({ make: '', model: '', plate: '', year: new Date().getFullYear(), lastItvDate: '', currentMileage: 0 });

  // Custom Delete Modal State
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean, vehicleId: string | null }>({ isOpen: false, vehicleId: null });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [vs, cs, js] = await Promise.all([dbService.getVehicles(), dbService.getClients(), dbService.getJobs()]);
    setVehicles(vs);
    setClients(cs);
    setJobs(js);
  };

  const handleAdd = async () => {
    if (!newVehicle.plate || !newVehicle.clientId) return;

    if (isEditMode && editingVehicleId) {
      const v: Vehicle = {
        id: editingVehicleId,
        clientId: newVehicle.clientId!,
        make: newVehicle.make || '',
        model: newVehicle.model || '',
        plate: newVehicle.plate.toUpperCase(),
        year: newVehicle.year || 2020,
        currentMileage: newVehicle.currentMileage || 0,
        lastItvDate: newVehicle.lastItvDate
      };
      await dbService.updateVehicle(v);
      setVehicles(vehicles.map(item => item.id === editingVehicleId ? v : item));
      if (onNotify) onNotify('Vehículo actualizado correctamente');
    } else {
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
      if (onNotify) onNotify('Vehículo añadido a la flota');
    }

    setIsModalOpen(false);
    setIsEditMode(false);
    setEditingVehicleId(null);
    setNewVehicle({ make: '', model: '', plate: '', year: new Date().getFullYear(), lastItvDate: '', currentMileage: 0 });
  };

  const RequestDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteModal({ isOpen: true, vehicleId: id });
  };

  const confirmDelete = async () => {
    if (deleteModal.vehicleId) {
      await dbService.deleteVehicle(deleteModal.vehicleId);
      setVehicles(vehicles.filter(v => v.id !== deleteModal.vehicleId));
      if (onNotify) onNotify('Vehículo eliminado permanentemente');
      setDeleteModal({ isOpen: false, vehicleId: null });
    }
  };

  const openEditModal = (v: Vehicle) => {
    setNewVehicle({
      clientId: v.clientId,
      make: v.make,
      model: v.model,
      plate: v.plate,
      year: v.year,
      currentMileage: v.currentMileage,
      lastItvDate: v.lastItvDate
    });
    setEditingVehicleId(v.id);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  return (
    <div className="p-8 h-full overflow-hidden flex flex-col">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white">Flota de Vehículos</h2>
          <p className="text-slate-400 mt-1">Seguimiento de mantenimientos e ITV.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl flex items-center gap-2 shadow-lg transition-transform active:scale-95 font-bold">
          <Plus className="w-5 h-5" /> Nuevo Coche
        </button>
      </div>

      <div className="mb-6 relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-12 pr-4 py-3 text-white outline-none focus:ring-2 focus:ring-blue-500 font-medium"
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
              className="bg-slate-800/50 border border-slate-700 p-6 rounded-2xl group cursor-pointer hover:border-blue-500/50 transition-all relative overflow-hidden active:scale-[0.98]"
              onClick={() => openEditModal(v)}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="bg-slate-900 border border-slate-700 px-3 py-1 rounded-md font-mono text-blue-400 text-sm font-bold shadow-inner">{v.plate}</div>
                <div className="flex gap-2">
                  <div className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${itv.bg} ${itv.color} flex items-center gap-1`}>
                    <Calendar className="w-3 h-3" /> {itv.label}
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                    <button onClick={(e) => RequestDelete(v.id, e)} className="p-1.5 hover:bg-red-500/20 rounded text-slate-400 hover:text-red-400 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                  </div>
                </div>
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-blue-400 truncate transition-colors">{v.make} {v.model}</h3>
              <p className="text-sm text-slate-500 font-medium">{clients.find(c => c.id === v.clientId)?.name || 'Sin dueño'}</p>

              <div className="mt-6 flex items-center justify-between text-xs text-slate-400 border-t border-slate-700 pt-3">
                <div className="flex items-center gap-1 text-slate-300 font-medium"><Gauge className="w-3 h-3 text-slate-500" /> {v.currentMileage?.toLocaleString()} km</div>
                {itv.date && <div className="font-mono bg-slate-800/50 px-2 py-0.5 rounded">{itv.date.toLocaleDateString()}</div>}
              </div>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white tracking-tight">{isEditMode ? 'Editar Vehículo' : 'Nuevo Vehículo'}</h3>
                <button onClick={() => { setIsModalOpen(false); setIsEditMode(false); }} className="text-slate-400 hover:text-white p-2 hover:bg-slate-800 rounded-full transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <select className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl text-white outline-none focus:ring-1 focus:ring-blue-500 font-medium" onChange={e => setNewVehicle({ ...newVehicle, clientId: e.target.value })} value={newVehicle.clientId || ''}>
                  <option value="">Seleccionar Cliente...</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <div className="grid grid-cols-2 gap-4">
                  <input placeholder="Marca" className="bg-slate-800 border border-slate-700 p-3 rounded-xl text-white outline-none focus:ring-1 focus:ring-blue-500" value={newVehicle.make} onChange={e => setNewVehicle({ ...newVehicle, make: e.target.value })} />
                  <input placeholder="Modelo" className="bg-slate-800 border border-slate-700 p-3 rounded-xl text-white outline-none focus:ring-1 focus:ring-blue-500" value={newVehicle.model} onChange={e => setNewVehicle({ ...newVehicle, model: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input placeholder="Matrícula" className="bg-slate-800 border border-slate-700 p-3 rounded-xl text-white outline-none uppercase font-mono tracking-wider focus:ring-1 focus:ring-blue-500" value={newVehicle.plate} onChange={e => setNewVehicle({ ...newVehicle, plate: e.target.value.toUpperCase() })} />
                  <input type="number" placeholder="Año" className="bg-slate-800 border border-slate-700 p-3 rounded-xl text-white outline-none focus:ring-1 focus:ring-blue-500" value={newVehicle.year} onChange={e => setNewVehicle({ ...newVehicle, year: parseInt(e.target.value) })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-2 uppercase font-black tracking-widest">Kilometraje</label>
                    <input type="number" className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl text-white outline-none focus:ring-1 focus:ring-blue-500" value={newVehicle.currentMileage || ''} onChange={e => setNewVehicle({ ...newVehicle, currentMileage: parseInt(e.target.value) })} />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-2 uppercase font-black tracking-widest">Última ITV</label>
                    <input type="date" className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl text-white outline-none focus:ring-1 focus:ring-blue-500" value={newVehicle.lastItvDate} onChange={e => setNewVehicle({ ...newVehicle, lastItvDate: e.target.value })} />
                  </div>
                </div>

                {/* Preview de Estado ITV */}
                <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Estado Calculado</h4>
                  {(() => {
                    const preview = getItvStatus({ ...newVehicle, id: 'preview' } as Vehicle);
                    return (
                      <div className="flex justify-between items-center">
                        <span className={`text-sm font-bold ${preview.color} flex items-center gap-2`}>
                          <Calendar className="w-4 h-4" /> {preview.label}
                        </span>
                        {preview.date && <span className="text-xs font-mono text-slate-400">{preview.date.toLocaleDateString()}</span>}
                      </div>
                    )
                  })()}
                </div>

                {/* Historial de Reparaciones (Solo en Edición) */}
                {isEditMode && editingVehicleId && (
                  <div className="mt-6 border-t border-slate-800 pt-6">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <History className="w-3 h-3" /> Historial de Taller
                    </h4>
                    <div className="space-y-3 max-h-40 overflow-y-auto custom-scrollbar pr-1">
                      {jobs.filter(j => j.vehicleId === editingVehicleId).length === 0 ? (
                        <p className="text-xs text-slate-600 italic">Sin historial disponible.</p>
                      ) : (
                        jobs.filter(j => j.vehicleId === editingVehicleId)
                          .sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime())
                          .map((job, idx, arr) => {
                            const prevJob = arr[idx + 1];
                            let diffKm = 0;
                            let diffMonths = 0;

                            if (prevJob) {
                              diffKm = (job.mileage || 0) - (prevJob.mileage || 0);
                              const d1 = new Date(job.entryDate);
                              const d2 = new Date(prevJob.entryDate);
                              diffMonths = (d1.getFullYear() - d2.getFullYear()) * 12 + (d1.getMonth() - d2.getMonth());
                            }

                            return (
                              <div key={job.id} className="bg-slate-950/30 rounded-lg p-3 border border-slate-800/50">
                                <div className="flex justify-between items-start mb-1">
                                  <span className="text-xs font-bold text-white uppercase truncate max-w-[150px]">{job.description}</span>
                                  <span className="text-[10px] text-slate-500 font-mono">{new Date(job.entryDate).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                  <span className="bg-slate-800 px-1.5 rounded flex items-center gap-1"><Gauge className="w-3 h-3" /> {job.mileage?.toLocaleString() || 0} km</span>
                                  {prevJob && (
                                    <span className={`px-1.5 rounded flex items-center gap-1 ${diffKm >= 0 ? 'text-emerald-400/80 bg-emerald-900/10' : 'text-red-400/80 bg-red-900/10'}`}>
                                      <TrendingUp className="w-3 h-3" /> {diffKm > 0 ? '+' : ''}{diffKm} km
                                    </span>
                                  )}
                                  {prevJob && diffMonths > 0 && (
                                    <span className="text-blue-400/80 bg-blue-900/10 px-1.5 rounded flex items-center gap-1">
                                      <Clock className="w-3 h-3" /> {diffMonths} meses
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-8 flex justify-end gap-3">
                <button onClick={() => { setIsModalOpen(false); setIsEditMode(false); }} className="text-slate-400 px-4 py-2 hover:text-white font-bold transition-colors">Cancelar</button>
                <button onClick={handleAdd} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-2 rounded-xl font-bold transition-colors shadow-lg shadow-blue-900/20 active:scale-95">{isEditMode ? 'Guardar Cambios' : 'Guardar'}</button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteModal.isOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-red-500/30 w-full max-w-sm rounded-2xl p-6 shadow-2xl"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-lg font-black text-white mb-2">¿Eliminar Vehículo?</h3>
                <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                  Esta acción eliminará el vehículo y su historial asociado. No se puede deshacer.
                </p>
                <div className="flex w-full gap-3">
                  <button
                    onClick={() => setDeleteModal({ isOpen: false, vehicleId: null })}
                    className="flex-1 py-3 bg-slate-800 text-slate-300 rounded-xl font-bold hover:bg-slate-700 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-500 shadow-lg shadow-red-900/20 active:scale-95 transition-all"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
