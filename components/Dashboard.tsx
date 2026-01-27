
import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Activity, CheckCircle, Wallet, TrendingUp, Plus, User, Car, Wrench, ChevronRight, ChevronLeft, X, Euro, Gauge, Sparkles, Search } from 'lucide-react';
import { dbService } from '../services/dbService';
import { KPIData, JobStatus, Client, Vehicle, Job } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

const StatCard = ({ title, value, icon: Icon, color, delay }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 p-5 rounded-[2rem] relative overflow-hidden group hover:border-blue-500/30 transition-all shadow-xl"
  >
    <div className={`absolute -right-8 -top-8 w-28 h-28 rounded-full opacity-[0.03] group-hover:opacity-[0.08] transition-opacity ${color}`} />
    <div className="flex justify-between items-center relative z-10">
      <div>
        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">{title}</p>
        <h3 className="text-2xl font-black text-white">{value}</h3>
      </div>
      <div className={`p-3.5 rounded-2xl ${color} bg-opacity-10 text-white`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  </motion.div>
);

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<KPIData | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [wizardData, setWizardData] = useState({
    clientId: null as string | null,
    clientName: '', clientPhone: '', clientEmail: '',
    vehicleId: null as string | null,
    make: '', model: '', plate: '', year: new Date().getFullYear(),
    jobDescription: '', mileage: ''
  });

  // Autocomplete State
  const [clientSearch, setClientSearch] = useState('');
  const [showClientSuggestions, setShowClientSuggestions] = useState(false);
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [showVehicleSuggestions, setShowVehicleSuggestions] = useState(false);


  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [statsData, clientsData, vehiclesData] = await Promise.all([
        dbService.getDashboardStats(),
        dbService.getClients(),
        dbService.getVehicles()
      ]);
      setStats(statsData);
      setClients(clientsData);
      setVehicles(vehiclesData);
    } catch (e) { console.error("Error cargando dashboard:", e); }
  };

  const handleWizardSubmit = async () => {
    try {
      let clientId = wizardData.clientId;
      if (!clientId) {
        clientId = crypto.randomUUID();
        await dbService.addClient({ id: clientId, name: wizardData.clientName, phone: wizardData.clientPhone, email: wizardData.clientEmail, address: '', createdAt: new Date().toISOString() });
      }

      let vehicleId = wizardData.vehicleId;
      const currentMileage = Number(wizardData.mileage) || 0;

      if (!vehicleId) {
        vehicleId = crypto.randomUUID();
        await dbService.addVehicle({ id: vehicleId, clientId, make: wizardData.make, model: wizardData.model, plate: wizardData.plate.toUpperCase(), year: wizardData.year, currentMileage });
      } else {
        // Update mileage if vehicle exists
        const existingV = vehicles.find(v => v.id === vehicleId);
        if (existingV) await dbService.updateVehicle({ ...existingV, currentMileage });
      }

      await dbService.saveJob({ id: crypto.randomUUID(), vehicleId, clientId, description: wizardData.jobDescription, status: JobStatus.PENDING, items: [], laborHours: 0, laborPricePerHour: 40, entryDate: new Date().toISOString(), mileage: currentMileage, total: 0, isPaid: false });

      setIsWizardOpen(false);
      setStep(1);
      setWizardData({ clientId: null, clientName: '', clientPhone: '', clientEmail: '', vehicleId: null, make: '', model: '', plate: '', year: new Date().getFullYear(), jobDescription: '', mileage: '' });
      setClientSearch('');
      setVehicleSearch('');
      loadData();
    } catch (e) { alert('Error al procesar: ' + (e as any).message); }
  };

  const selectClient = (client: Client) => {
    setWizardData(prev => ({ ...prev, clientId: client.id, clientName: client.name, clientPhone: client.phone, clientEmail: client.email || '' }));
    setClientSearch(client.name);
    setShowClientSuggestions(false);
  };

  const selectVehicle = (vehicle: Vehicle) => {
    const owner = clients.find(c => c.id === vehicle.clientId);
    setWizardData(prev => ({
      ...prev,
      vehicleId: vehicle.id,
      make: vehicle.make,
      model: vehicle.model,
      plate: vehicle.plate,
      year: vehicle.year,
      mileage: vehicle.currentMileage.toString(),
      clientId: owner ? owner.id : prev.clientId,
      clientName: owner ? owner.name : prev.clientName,
      clientPhone: owner ? owner.phone : prev.clientPhone,
      clientEmail: owner ? (owner.email || '') : prev.clientEmail
    }));
    setVehicleSearch(vehicle.plate);
    if (owner) setClientSearch(owner.name);
    setShowVehicleSuggestions(false);
  };

  const chartData = [{ name: 'Lun', r: 400 }, { name: 'Mar', r: 300 }, { name: 'Mie', r: 600 }, { name: 'Jue', r: 450 }, { name: 'Vie', r: 800 }, { name: 'Sab', r: 550 }];

  if (!stats) return <div className="h-full flex items-center justify-center bg-slate-950"><div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin shadow-2xl shadow-blue-500/50"></div></div>;

  return (
    <div className="view-wrapper bg-slate-950">
      <div className="scroll-container px-6">
        <header className="pt-safe mb-10 text-center md:text-left">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter italic uppercase leading-tight">Panel Principal</h2>
            <div className="flex items-center justify-center md:justify-start gap-2 mt-2">
              <Sparkles className="w-3 h-3 text-blue-500" />
              <p className="text-slate-500 font-black uppercase text-[10px] tracking-[0.3em]">Gestión Inteligente de Taller</p>
            </div>
          </motion.div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsWizardOpen(true)}
            className="mt-8 w-full md:w-auto bg-gradient-to-r from-blue-600 to-blue-700 text-white px-10 py-5 rounded-[2.5rem] shadow-2xl shadow-blue-900/40 flex items-center justify-center gap-4 font-black text-sm tracking-tight transition-all"
          >
            <Plus className="w-6 h-6" />
            <span>RECEPCIÓN RÁPIDA</span>
          </motion.button>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-10">
          <StatCard title="Ingresos" value={`${stats.totalRevenue.toLocaleString()} €`} icon={Euro} color="bg-blue-500" delay={0.1} />
          <StatCard title="Gastos" value={`${stats.totalExpenses.toLocaleString()} €`} icon={Wallet} color="bg-red-500" delay={0.2} />
          <StatCard title="Beneficio" value={`${stats.netProfit.toLocaleString()} €`} icon={TrendingUp} color="bg-emerald-500" delay={0.3} />
          <StatCard title="En Taller" value={stats.activeJobs} icon={Activity} color="bg-orange-500" delay={0.4} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">
          <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl">
            <h3 className="text-xs font-black text-slate-500 mb-8 uppercase tracking-[0.2em] flex items-center gap-3">
              <TrendingUp className="w-4 h-4 text-blue-500" /> Rendimiento Semanal
            </h3>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorR" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} opacity={0.5} />
                  <XAxis dataKey="name" stroke="#475569" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '20px', fontSize: '12px' }} />
                  <Area type="monotone" dataKey="r" stroke="#3b82f6" strokeWidth={4} fill="url(#colorR)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl">
            <h3 className="text-xs font-black text-slate-500 mb-8 uppercase tracking-[0.2em] flex items-center gap-3">
              <Wrench className="w-4 h-4 text-emerald-500" /> Carga Mecánica
            </h3>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.mechanicLoad}>
                  <XAxis dataKey="name" stroke="#475569" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '20px' }} />
                  <Bar dataKey="jobs" fill="#10b981" radius={[10, 10, 10, 10]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isWizardOpen && (
          <div className="fixed inset-0 z-[1000] flex items-end md:items-center justify-center bg-black/95 backdrop-blur-2xl">
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="bg-slate-900 border-t md:border border-slate-800 w-full max-w-xl rounded-t-[3.5rem] md:rounded-[3.5rem] overflow-hidden flex flex-col h-[92vh] md:h-auto pb-safe">
              <div className="p-10 flex justify-between items-center border-b border-slate-800">
                <div>
                  <h3 className="text-3xl font-black text-white tracking-tighter uppercase italic">Recepción</h3>
                  <p className="text-blue-500 font-black text-[10px] uppercase tracking-widest mt-1">Paso {step} de 3</p>
                </div>
                <button onClick={() => setIsWizardOpen(false)} className="bg-slate-800 p-5 rounded-full text-slate-400 active:scale-90 transition-all"><X className="w-6 h-6" /></button>
              </div>
              <div className="p-10 flex-1 overflow-y-auto">
                {step === 1 && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-4"><User className="text-blue-500 w-7 h-7" /><h4 className="text-2xl font-black text-white uppercase italic tracking-tighter">Cliente</h4></div>
                    <div className="relative">
                      <input
                        className="w-full bg-slate-800/50 border-2 border-slate-800 rounded-3xl p-5 text-white font-bold outline-none focus:border-blue-500 transition-all pl-12"
                        placeholder="Buscar Cliente (Nombre/Tlf)..."
                        value={clientSearch}
                        onChange={e => { setClientSearch(e.target.value); setWizardData({ ...wizardData, clientId: null, clientName: e.target.value }); setShowClientSuggestions(true); }}
                        onFocus={() => setShowClientSuggestions(true)}
                      />
                      <Search className="absolute left-5 top-6 w-5 h-5 text-slate-500" />
                      {showClientSuggestions && clientSearch.length > 0 && !wizardData.clientId && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl z-50 max-h-48 overflow-y-auto">
                          {clients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase()) || c.phone.includes(clientSearch)).length > 0 ? (
                            clients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase()) || c.phone.includes(clientSearch)).map(c => (
                              <div key={c.id} onClick={() => selectClient(c)} className="p-4 hover:bg-slate-800 cursor-pointer border-b border-slate-800/50 last:border-0">
                                <p className="font-bold text-white">{c.name}</p>
                                <p className="text-xs text-slate-500">{c.phone}</p>
                              </div>
                            ))
                          ) : (
                            <div className="p-4 text-xs text-slate-500 italic">No encontrado. Se creará uno nuevo.</div>
                          )}
                        </div>
                      )}
                    </div>
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4">
                      {wizardData.clientId ? (
                        <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-2xl flex justify-between items-center">
                          <div>
                            <p className="text-xs text-blue-400 font-black uppercase">Cliente Existente</p>
                            <p className="font-bold text-white">{wizardData.clientName}</p>
                          </div>
                          <button onClick={() => { setWizardData({ ...wizardData, clientId: null, clientName: '', clientPhone: '' }); setClientSearch(''); }} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
                        </div>
                      ) : (
                        <>
                          <input className="w-full bg-slate-800/50 border-2 border-slate-800 rounded-3xl p-5 text-white font-bold outline-none" placeholder="Teléfono" value={wizardData.clientPhone} onChange={e => setWizardData({ ...wizardData, clientPhone: e.target.value })} />
                          <input className="w-full bg-slate-800/50 border-2 border-slate-800 rounded-3xl p-5 text-white font-bold outline-none" placeholder="Email (Opcional)" value={wizardData.clientEmail} onChange={e => setWizardData({ ...wizardData, clientEmail: e.target.value })} />
                        </>
                      )}
                    </motion.div>
                  </div>
                )}
                {step === 2 && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-4"><Car className="text-emerald-500 w-7 h-7" /><h4 className="text-2xl font-black text-white uppercase italic tracking-tighter">Vehículo</h4></div>
                    <div className="relative mb-4">
                      {wizardData.vehicleId ? (
                        <div className="bg-emerald-900/20 border border-emerald-500/30 p-4 rounded-2xl flex justify-between items-center">
                          <div>
                            <p className="text-xs text-emerald-400 font-black uppercase">Vehículo Registrado</p>
                            <p className="font-bold text-white">{wizardData.plate} - {wizardData.make} {wizardData.model}</p>
                          </div>
                          <button onClick={() => { setWizardData({ ...wizardData, vehicleId: null, make: '', model: '', plate: '', mileage: '' }); setVehicleSearch(''); }} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
                        </div>
                      ) : (
                        <>
                          <input
                            className="w-full bg-slate-800/50 border-2 border-slate-800 rounded-3xl p-5 text-white font-bold outline-none focus:border-emerald-500 transition-all pl-12 uppercase"
                            placeholder="Buscar Matrícula..."
                            value={vehicleSearch}
                            onChange={e => { setVehicleSearch(e.target.value.toUpperCase()); setWizardData({ ...wizardData, vehicleId: null, plate: e.target.value.toUpperCase() }); setShowVehicleSuggestions(true); }}
                            onFocus={() => setShowVehicleSuggestions(true)}
                          />
                          <Search className="absolute left-5 top-6 w-5 h-5 text-slate-500" />
                          {showVehicleSuggestions && vehicleSearch.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl z-50 max-h-48 overflow-y-auto">
                              {vehicles.filter(v =>
                                v.plate.includes(vehicleSearch)
                              ).length > 0 ? (
                                vehicles.filter(v =>
                                  v.plate.includes(vehicleSearch)
                                ).map(v => (
                                  <div key={v.id} onClick={() => selectVehicle(v)} className="p-4 hover:bg-slate-800 cursor-pointer border-b border-slate-800/50 last:border-0">
                                    <p className="font-bold text-white">{v.plate}</p>
                                    <p className="text-xs text-slate-500">{v.make} {v.model}</p>
                                  </div>
                                ))
                              ) : (
                                <div className="p-4 text-xs text-blue-400 font-bold italic hover:bg-slate-800 cursor-pointer flex justify-between items-center" onClick={() => setShowVehicleSuggestions(false)}>
                                  <span>Matrícula no registrada. Crear nuevo vehículo...</span>
                                  <ChevronRight className="w-4 h-4" />
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {!wizardData.vehicleId && (
                      <div className="grid grid-cols-2 gap-4">
                        <input className="bg-slate-800/50 border-2 border-slate-800 rounded-3xl p-5 text-white font-bold outline-none" placeholder="Marca" value={wizardData.make} onChange={e => setWizardData({ ...wizardData, make: e.target.value })} />
                        <input className="bg-slate-800/50 border-2 border-slate-800 rounded-3xl p-5 text-white font-bold outline-none" placeholder="Modelo" value={wizardData.model} onChange={e => setWizardData({ ...wizardData, model: e.target.value })} />
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <input className={`bg-slate-800/50 border-2 border-slate-800 rounded-3xl p-5 text-white font-bold outline-none ${wizardData.vehicleId ? 'opacity-50 cursor-not-allowed' : ''}`} type="number" placeholder="Año" value={wizardData.year} readOnly={!!wizardData.vehicleId} onChange={e => setWizardData({ ...wizardData, year: Number(e.target.value) })} />
                      <input className="bg-slate-800/50 border-2 border-slate-800 rounded-3xl p-5 text-white font-bold outline-none" type="number" placeholder="Km actuales" value={wizardData.mileage} onChange={e => setWizardData({ ...wizardData, mileage: e.target.value })} />
                    </div>
                  </div>
                )}
                {step === 3 && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-4"><Wrench className="text-orange-500 w-7 h-7" /><h4 className="text-2xl font-black text-white uppercase italic tracking-tighter">Trabajo</h4></div>
                    <textarea className="w-full bg-slate-800/50 border-2 border-slate-800 rounded-[2.5rem] p-8 text-white font-bold h-48 resize-none outline-none focus:border-orange-500" placeholder="¿Qué necesita el cliente?" value={wizardData.jobDescription} onChange={e => setWizardData({ ...wizardData, jobDescription: e.target.value })} />
                  </div>
                )}
              </div>
              <div className="p-10 border-t border-slate-800 bg-slate-900 flex justify-between">
                <button disabled={step === 1} onClick={() => setStep(s => s - 1)} className="px-8 py-4 rounded-3xl text-slate-500 font-black uppercase tracking-widest text-xs hover:bg-slate-800 disabled:opacity-0">Anterior</button>
                {step < 3 ? (
                  <button
                    onClick={() => setStep(s => s + 1)}
                    disabled={
                      (step === 1 && !wizardData.clientName) ||
                      (step === 2 && (!wizardData.plate || (!wizardData.vehicleId && (!wizardData.make || !wizardData.model))))
                    }
                    className="px-12 py-5 bg-blue-600 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-2xl active:scale-95 transition-all"
                  >
                    Siguiente
                  </button>
                ) : (
                  <button
                    onClick={handleWizardSubmit}
                    disabled={!wizardData.jobDescription}
                    className="px-12 py-5 bg-emerald-600 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-2xl active:scale-95 transition-all"
                  >
                    Finalizar
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
