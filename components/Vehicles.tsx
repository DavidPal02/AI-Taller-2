import React, { useEffect, useState } from 'react';
import { dbService } from '../services/dbService';
import { Vehicle, Job, Client, Mechanic } from '../types';
import { Car, Plus, Search, Wrench, History, User, FileText, X, Settings2, Gauge, Clock, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Vehicles: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [isNewVehicleModalOpen, setIsNewVehicleModalOpen] = useState(false);
  const [newVehicle, setNewVehicle] = useState<Partial<Vehicle>>({ make: '', model: '', year: new Date().getFullYear(), plate: '', engine: '', currentMileage: 0 });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [vs, js, cs, ms] = await Promise.all([
      dbService.getVehicles(),
      dbService.getJobs(),
      dbService.getClients(),
      dbService.getMechanics()
    ]);
    setVehicles(vs);
    setJobs(js);
    setClients(cs);
    setMechanics(ms);
  };

  const getClientName = (clientId: string) => {
    return clients.find(c => c.id === clientId)?.name || 'Sin propietario';
  };
  
  const getMechanicName = (mechId?: string) => {
      return mechanics.find(m => m.id === mechId)?.name || 'N/A';
  };

  const filteredVehicles = vehicles.filter(v => 
    v.plate.toLowerCase().includes(searchTerm.toLowerCase()) || 
    v.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.make.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateVehicle = async () => {
    if (!newVehicle.plate || !newVehicle.make || !newVehicle.clientId) return;
    
    const v: Vehicle = {
      id: Math.random().toString(36).substr(2, 9),
      make: newVehicle.make!,
      model: newVehicle.model!,
      plate: newVehicle.plate!,
      year: newVehicle.year || 2020,
      clientId: newVehicle.clientId!,
      engine: newVehicle.engine,
      currentMileage: newVehicle.currentMileage || 0
    };

    await dbService.addVehicle(v);
    setVehicles([...vehicles, v]);
    setIsNewVehicleModalOpen(false);
    setNewVehicle({ make: '', model: '', year: new Date().getFullYear(), plate: '', engine: '', currentMileage: 0 });
  };

  const getVehicleHistory = (vehicleId: string) => {
    return jobs.filter(j => j.vehicleId === vehicleId).sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime());
  };

  const calculateTotalSpent = (vehicleId: string) => {
    const history = getVehicleHistory(vehicleId);
    return history.reduce((acc, curr) => acc + curr.total, 0);
  };

  const toggleJobExpansion = (jobId: string) => {
      setExpandedJobId(expandedJobId === jobId ? null : jobId);
  };

  return (
    <div className="p-4 md:p-8 h-full overflow-hidden flex flex-col pb-24 md:pb-8">
      <div className="flex justify-between items-center mb-6 md:mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-white">Inventario</h2>
          <p className="text-slate-400 mt-1 text-sm md:text-base">Flota de vehículos registrados.</p>
        </div>
        <button 
          onClick={() => setIsNewVehicleModalOpen(true)}
          className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors shadow-lg shadow-blue-900/20 text-sm md:text-base"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden md:inline">Nuevo Vehículo</span>
          <span className="md:hidden">Nuevo</span>
        </button>
      </div>

      <div className="mb-6 relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
        <input 
          type="text" 
          placeholder="Buscar matrícula, marca..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 text-white pl-12 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 overflow-y-auto pb-4 custom-scrollbar">
        {filteredVehicles.map((vehicle) => (
          <motion.div
            key={vehicle.id}
            layoutId={vehicle.id}
            onClick={() => setSelectedVehicle(vehicle)}
            className="bg-slate-800/50 hover:bg-slate-800 border border-slate-700 p-5 md:p-6 rounded-2xl group cursor-pointer transition-all hover:border-blue-500/50 hover:shadow-xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <Car className="w-24 h-24 text-blue-500" />
            </div>
            
            <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 border border-blue-500/20">
                        <Car className="w-5 h-5 md:w-6 md:h-6" />
                    </div>
                    <span className="bg-slate-900 border border-slate-700 px-2 py-1 rounded text-xs font-mono text-slate-300">
                        {vehicle.year}
                    </span>
                </div>
                
                <h3 className="text-lg md:text-xl font-bold text-white mb-1">{vehicle.make} {vehicle.model}</h3>
                <p className="text-sm text-slate-400 mb-2">{vehicle.engine || 'Motor no especificado'}</p>
                <div className="flex justify-between items-end mb-4">
                    <p className="text-xl md:text-2xl font-mono text-blue-400 font-bold tracking-wider">{vehicle.plate}</p>
                    {vehicle.currentMileage && (
                        <div className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-900/30 px-2 py-1 rounded border border-emerald-500/30">
                            <Gauge className="w-3 h-3" /> {vehicle.currentMileage.toLocaleString()}
                        </div>
                    )}
                </div>
                
                <div className="border-t border-slate-700 pt-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                        <User className="w-4 h-4" />
                        <span className="truncate">{getClientName(vehicle.clientId)}</span>
                    </div>
                </div>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selectedVehicle && (
            <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center md:p-4 bg-black/80 backdrop-blur-sm">
                <motion.div 
                  layoutId={selectedVehicle.id}
                  className="bg-slate-900 border-t md:border border-slate-700 w-full max-w-5xl md:rounded-2xl shadow-2xl flex flex-col h-[95vh] md:h-[85vh] overflow-hidden"
                >
                    <div className="p-6 md:p-8 bg-gradient-to-b md:bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700 flex flex-col md:flex-row justify-between items-start gap-6 overflow-y-auto max-h-[40vh]">
                        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6 w-full">
                            <div className="w-16 h-16 md:w-20 md:h-20 bg-blue-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-900/50 shrink-0">
                                <Car className="w-8 h-8 md:w-10 md:h-10 text-white" />
                            </div>
                            <div className="w-full">
                                <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight">{selectedVehicle.make} {selectedVehicle.model}</h2>
                                <p className="text-slate-400 text-sm mt-1 flex items-center gap-1"><Settings2 className="w-3 h-3" /> Motor: {selectedVehicle.engine || 'N/A'}</p>
                                
                                <div className="flex flex-wrap items-center gap-2 md:gap-3 mt-3">
                                    <span className="bg-slate-800 px-3 py-1 rounded-lg border border-slate-600 font-mono text-blue-400 font-bold">{selectedVehicle.plate}</span>
                                    <span className="text-slate-400 text-sm border-l border-slate-700 pl-3">Año {selectedVehicle.year}</span>
                                </div>
                                <div className="mt-2 text-slate-300 flex items-center gap-2 text-sm">
                                    <User className="w-4 h-4 text-slate-500" /> {getClientName(selectedVehicle.clientId)}
                                </div>
                            </div>
                        </div>

                        <div className="absolute top-4 right-4 md:static">
                            <button onClick={() => setSelectedVehicle(null)} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4 w-full md:w-auto md:flex md:gap-8 pt-2 md:pt-0 border-t md:border-0 border-slate-800">
                            <div className="bg-slate-800/50 p-3 rounded-xl md:bg-transparent md:p-0 text-left md:text-right">
                                <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Inversión Total</p>
                                <p className="text-lg md:text-xl font-bold text-emerald-400">{calculateTotalSpent(selectedVehicle.id).toLocaleString('es-ES')} €</p>
                            </div>
                            <div className="bg-slate-800/50 p-3 rounded-xl md:bg-transparent md:p-0 text-left md:text-right">
                                <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Kilometraje</p>
                                <p className="text-lg md:text-xl font-bold text-blue-400">{selectedVehicle.currentMileage ? selectedVehicle.currentMileage.toLocaleString() : '-'} Km</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-950/50 pb-24 md:pb-8">
                        <h3 className="text-lg md:text-xl font-bold text-white mb-6 flex items-center gap-2 sticky top-0 bg-slate-950/95 py-2 z-10 backdrop-blur-sm">
                            <History className="w-5 h-5 text-blue-400" /> Historial de Reparaciones
                        </h3>

                        <div className="space-y-4 md:space-y-8 relative">
                            <div className="absolute left-[19px] md:left-[27px] top-4 bottom-4 w-0.5 bg-slate-800 z-0" />

                            {getVehicleHistory(selectedVehicle.id).length === 0 ? (
                                <p className="text-slate-500 pl-12">No hay registros de trabajos para este vehículo.</p>
                            ) : (
                                getVehicleHistory(selectedVehicle.id).map((job, index) => {
                                    const isExpanded = expandedJobId === job.id;

                                    return (
                                        <motion.div 
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            key={job.id} 
                                            className="relative pl-10 md:pl-16 z-10"
                                        >
                                            <div className="absolute left-2.5 md:left-[21px] top-6 w-3 h-3 bg-blue-500 rounded-full ring-4 ring-slate-950 z-20" />

                                            <motion.div 
                                                layout
                                                onClick={() => toggleJobExpansion(job.id)}
                                                className={`bg-slate-900 border ${isExpanded ? 'border-blue-500/30 bg-slate-800/50' : 'border-slate-800'} rounded-xl overflow-hidden hover:border-slate-600 transition-colors shadow-lg cursor-pointer group`}
                                            >
                                                <div className="p-4 md:p-5">
                                                    <div className="flex justify-between items-start gap-4">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">{job.status}</span>
                                                                <span className="text-xs text-slate-500">{new Date(job.entryDate).toLocaleDateString()}</span>
                                                            </div>
                                                            <h4 className="text-base md:text-lg font-bold text-white leading-tight">{job.description}</h4>
                                                        </div>
                                                        <div className="text-right shrink-0">
                                                            <div className="text-emerald-400 font-bold font-mono text-lg">{job.total} €</div>
                                                            <motion.div 
                                                                animate={{ rotate: isExpanded ? 180 : 0 }}
                                                                className="flex justify-end mt-2 text-slate-500"
                                                            >
                                                                <ChevronDown className="w-5 h-5" />
                                                            </motion.div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <AnimatePresence>
                                                    {isExpanded && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: 'auto', opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            className="border-t border-slate-700/50 bg-slate-950/30"
                                                        >
                                                            <div className="p-4 md:p-5 space-y-4">
                                                                <div className="flex flex-wrap gap-4 text-sm text-slate-400 bg-slate-900 p-3 rounded-lg border border-slate-800">
                                                                    <div className="flex items-center gap-2">
                                                                         <Wrench className="w-4 h-4 text-blue-400" />
                                                                         <span>Mecánico: {getMechanicName(job.mechanicId)}</span>
                                                                    </div>
                                                                    {job.mileage > 0 && (
                                                                        <div className="flex items-center gap-2">
                                                                            <Gauge className="w-4 h-4 text-purple-400" />
                                                                            <span>Km al entrar: {job.mileage.toLocaleString()}</span>
                                                                        </div>
                                                                    )}
                                                                    <div className="flex items-center gap-2">
                                                                         <FileText className="w-4 h-4 text-slate-500" />
                                                                         <span>ID: #{job.id.toUpperCase()}</span>
                                                                    </div>
                                                                </div>

                                                                <div className="overflow-x-auto">
                                                                    <table className="w-full text-sm">
                                                                        <thead>
                                                                            <tr className="text-slate-500 border-b border-slate-800">
                                                                                <th className="text-left py-2 font-medium">Concepto</th>
                                                                                <th className="text-center py-2 font-medium w-16">Cant.</th>
                                                                                <th className="text-right py-2 font-medium w-24">Precio</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody className="text-slate-300">
                                                                            {job.laborHours > 0 && (
                                                                                <tr className="border-b border-slate-800/50">
                                                                                    <td className="py-2 text-blue-300">Mano de Obra ({job.laborHours}h)</td>
                                                                                    <td className="py-2 text-center text-slate-500">-</td>
                                                                                    <td className="py-2 text-right">{(job.laborHours * job.laborPricePerHour).toFixed(2)} €</td>
                                                                                </tr>
                                                                            )}
                                                                            {job.items.map(item => (
                                                                                <tr key={item.id} className="border-b border-slate-800/50 last:border-0">
                                                                                    <td className="py-2">{item.description}</td>
                                                                                    <td className="py-2 text-center text-slate-500">{item.quantity}</td>
                                                                                    <td className="py-2 text-right">{(item.unitPrice * item.quantity).toFixed(2)} €</td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </motion.div>
                                        </motion.div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isNewVehicleModalOpen && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl p-6"
                >
                    <h3 className="text-xl font-bold text-white mb-4">Registrar Nuevo Vehículo</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Propietario</label>
                            <select 
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                                value={newVehicle.clientId || ''}
                                onChange={(e) => setNewVehicle({...newVehicle, clientId: e.target.value})}
                            >
                                <option value="">Seleccionar Cliente...</option>
                                {clients.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Marca</label>
                                <input 
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                                    value={newVehicle.make}
                                    onChange={(e) => setNewVehicle({...newVehicle, make: e.target.value})}
                                    placeholder="Toyota"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Modelo</label>
                                <input 
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                                    value={newVehicle.model}
                                    onChange={(e) => setNewVehicle({...newVehicle, model: e.target.value})}
                                    placeholder="Corolla"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Matrícula</label>
                                <input 
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white uppercase font-mono"
                                    value={newVehicle.plate}
                                    onChange={(e) => setNewVehicle({...newVehicle, plate: e.target.value.toUpperCase()})}
                                    placeholder="ABC-123"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Año</label>
                                <input 
                                    type="number"
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                                    value={newVehicle.year}
                                    onChange={(e) => setNewVehicle({...newVehicle, year: Number(e.target.value)})}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Motorización</label>
                                <input 
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                                    value={newVehicle.engine || ''}
                                    onChange={(e) => setNewVehicle({...newVehicle, engine: e.target.value})}
                                    placeholder="Ej. 1.6 TDCi"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Kilometraje Actual</label>
                                <input 
                                    type="number"
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                                    value={newVehicle.currentMileage || ''}
                                    onChange={(e) => setNewVehicle({...newVehicle, currentMileage: Number(e.target.value)})}
                                    placeholder="Km"
                                />
                            </div>
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                        <button onClick={() => setIsNewVehicleModalOpen(false)} className="text-slate-400 hover:text-white px-4 py-2">Cancelar</button>
                        <button onClick={handleCreateVehicle} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl">Guardar Vehículo</button>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>
    </div>
  );
};