
import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Activity, CheckCircle, Wallet, TrendingUp, Plus, User, Car, Wrench, ChevronRight, ChevronLeft, X, Euro, Gauge } from 'lucide-react';
import { dbService } from '../services/dbService';
import { KPIData, JobStatus, Client, Vehicle, Job } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

const StatCard = ({ title, value, icon: Icon, color, delay }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    className="bg-slate-800/50 backdrop-blur-md border border-slate-700 p-5 md:p-6 rounded-2xl relative overflow-hidden group hover:border-slate-600 transition-all shadow-lg"
  >
    <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 group-hover:opacity-20 transition-opacity ${color}`} />
    <div className="flex justify-between items-start relative z-10">
      <div>
        <p className="text-slate-400 text-[10px] md:text-xs font-black uppercase tracking-widest">{title}</p>
        <h3 className="text-2xl md:text-3xl font-black text-white mt-1">{value}</h3>
      </div>
      <div className={`p-3 rounded-xl ${color} bg-opacity-20 text-white shadow-inner`}>
        <Icon className="w-5 h-5 md:w-6 md:h-6" />
      </div>
    </div>
  </motion.div>
);

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<KPIData | null>(null);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  
  const [step, setStep] = useState(1);
  const [wizardData, setWizardData] = useState({
      clientName: '', clientPhone: '', clientEmail: '',
      make: '', model: '', plate: '', engine: '', year: new Date().getFullYear(),
      jobDescription: '', mileage: ''
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
        const data = await dbService.getDashboardStats();
        setStats(data);
    } catch (e) {
        console.error("Error cargando stats:", e);
    }
  };

  const handleWizardSubmit = async () => {
      try {
          const clientId = crypto.randomUUID();
          const newClient: Client = {
              id: clientId,
              name: wizardData.clientName,
              phone: wizardData.clientPhone,
              email: wizardData.clientEmail,
              address: '',
              createdAt: new Date().toISOString()
          };
          await dbService.addClient(newClient);

          const vehicleId = crypto.randomUUID();
          const newVehicle: Vehicle = {
              id: vehicleId,
              clientId: clientId,
              make: wizardData.make,
              model: wizardData.model,
              plate: wizardData.plate.toUpperCase(),
              year: wizardData.year,
              engine: wizardData.engine,
              currentMileage: Number(wizardData.mileage) || 0
          };
          await dbService.addVehicle(newVehicle);

          const jobId = crypto.randomUUID();
          const newJob: Job = {
              id: jobId,
              vehicleId: vehicleId,
              clientId: clientId,
              description: wizardData.jobDescription,
              status: JobStatus.PENDING,
              items: [],
              laborHours: 0,
              laborPricePerHour: 40,
              entryDate: new Date().toISOString(),
              mileage: Number(wizardData.mileage) || 0,
              total: 0,
              isPaid: false
          };
          await dbService.saveJob(newJob);

          setIsWizardOpen(false);
          setStep(1);
          setWizardData({
              clientName: '', clientPhone: '', clientEmail: '',
              make: '', model: '', plate: '', engine: '', year: new Date().getFullYear(),
              jobDescription: '', mileage: ''
          });
          loadStats();
          alert('Recepción completada exitosamente.');
      } catch (e) {
          alert('Error al procesar la recepción: ' + (e as any).message);
      }
  };

  const chartData = [
    { name: 'Lun', revenue: 400 },
    { name: 'Mar', revenue: 300 },
    { name: 'Mie', revenue: 600 },
    { name: 'Jue', revenue: 450 },
    { name: 'Vie', revenue: 800 },
    { name: 'Sab', revenue: 550 },
  ];

  if (!stats) return <div className="p-8 text-white flex items-center justify-center h-full"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="view-wrapper bg-slate-950">
      <div className="scroll-container pt-safe px-6 md:px-10">
        <header className="mb-8 mt-4">
          <h2 className="text-3xl md:text-4xl font-black text-white tracking-tighter uppercase italic">Panel Principal</h2>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-1">SaaS de Gestión Cloud v2.5</p>
          
          <button 
                onClick={() => setIsWizardOpen(true)}
                className="mt-6 w-full md:w-auto bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl shadow-2xl shadow-blue-900/40 flex items-center justify-center gap-3 font-black text-sm tracking-tight transition-all active:scale-95"
            >
                <Plus className="w-6 h-6" />
                RECEPCIÓN RÁPIDA
            </button>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-10">
          <StatCard title="Ingresos" value={`${stats.totalRevenue.toLocaleString('es-ES')} €`} icon={Euro} color="bg-blue-500" delay={0} />
          <StatCard title="Gastos" value={`${stats.totalExpenses.toLocaleString('es-ES')} €`} icon={Wallet} color="bg-red-500" delay={0.1} />
          <StatCard title="Beneficio" value={`${stats.netProfit.toLocaleString('es-ES')} €`} icon={TrendingUp} color="bg-emerald-500" delay={0.2} />
          <StatCard title="En Taller" value={stats.activeJobs} icon={Activity} color="bg-orange-500" delay={0.3} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-10">
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-2xl"
          >
            <h3 className="text-lg font-black text-white mb-6 uppercase tracking-widest flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-500" /> Tendencia
            </h3>
            <div className="h-[250px] md:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" axisLine={false} tickLine={false} />
                  <YAxis stroke="#64748b" axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '16px', color: '#fff' }}
                    itemStyle={{ color: '#60a5fa' }}
                    formatter={(value: number) => [`${value} €`, 'Ingresos']}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-2xl"
          >
            <h3 className="text-lg font-black text-white mb-6 uppercase tracking-widest flex items-center gap-2">
                <Wrench className="w-4 h-4 text-emerald-500" /> Carga Equipo
            </h3>
            <div className="h-[250px] md:h-[300px]">
              {stats.mechanicLoad.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.mechanicLoad}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="name" stroke="#64748b" />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '16px', color: '#fff' }} />
                      <Bar dataKey="jobs" fill="#10b981" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
              ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-50">
                      <Activity className="w-12 h-12 mb-2" />
                      <span className="text-[10px] font-black uppercase">Sin datos</span>
                  </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
          {isWizardOpen && (
              <div className="fixed inset-0 z-[1000] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/90 backdrop-blur-xl">
                  <motion.div 
                    initial={{ opacity: 0, y: 300 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 300 }}
                    className="bg-slate-900 border-t md:border border-slate-800 w-full max-w-2xl rounded-t-[3rem] md:rounded-[3rem] shadow-2xl overflow-hidden flex flex-col h-[94vh] md:h-auto"
                  >
                      <div className="p-8 flex justify-between items-center border-b border-slate-800">
                          <div>
                              <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Nueva Recepción</h3>
                              <p className="text-blue-500 font-black text-[10px] uppercase tracking-widest mt-1">Paso {step} de 3</p>
                          </div>
                          <button onClick={() => setIsWizardOpen(false)} className="bg-slate-800 p-4 rounded-full text-slate-400 hover:text-white transition-colors"><X className="w-6 h-6" /></button>
                      </div>

                      <div className="p-8 md:p-10 flex-1 overflow-y-auto custom-scrollbar">
                          {step === 1 && (
                              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                  <div className="flex items-center gap-3 mb-4">
                                      <User className="text-blue-500 w-6 h-6" />
                                      <h4 className="text-xl font-bold text-white">Datos del Cliente</h4>
                                  </div>
                                  <input 
                                    className="w-full bg-slate-800/50 border-2 border-slate-800 rounded-2xl p-4 text-white font-bold focus:border-blue-500 outline-none transition-all" 
                                    placeholder="Nombre Completo"
                                    value={wizardData.clientName}
                                    onChange={e => setWizardData({...wizardData, clientName: e.target.value})}
                                    autoFocus
                                  />
                                  <input 
                                    className="w-full bg-slate-800/50 border-2 border-slate-800 rounded-2xl p-4 text-white font-bold focus:border-blue-500 outline-none" 
                                    placeholder="Teléfono móvil"
                                    type="tel"
                                    value={wizardData.clientPhone}
                                    onChange={e => setWizardData({...wizardData, clientPhone: e.target.value})}
                                  />
                                  <input 
                                    className="w-full bg-slate-800/50 border-2 border-slate-800 rounded-2xl p-4 text-white font-bold focus:border-blue-500 outline-none" 
                                    placeholder="Correo electrónico"
                                    type="email"
                                    value={wizardData.clientEmail}
                                    onChange={e => setWizardData({...wizardData, clientEmail: e.target.value})}
                                  />
                              </div>
                          )}

                          {step === 2 && (
                              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                  <div className="flex items-center gap-3 mb-4">
                                      <Car className="text-emerald-500 w-6 h-6" />
                                      <h4 className="text-xl font-bold text-white">Datos del Vehículo</h4>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                      <input className="bg-slate-800/50 border-2 border-slate-800 rounded-2xl p-4 text-white font-bold" placeholder="Marca" value={wizardData.make} onChange={e => setWizardData({...wizardData, make: e.target.value})} />
                                      <input className="bg-slate-800/50 border-2 border-slate-800 rounded-2xl p-4 text-white font-bold" placeholder="Modelo" value={wizardData.model} onChange={e => setWizardData({...wizardData, model: e.target.value})} />
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                      <input className="bg-slate-800/50 border-2 border-slate-800 rounded-2xl p-4 text-white font-bold uppercase" placeholder="Matrícula" value={wizardData.plate} onChange={e => setWizardData({...wizardData, plate: e.target.value.toUpperCase()})} />
                                      <input className="bg-slate-800/50 border-2 border-slate-800 rounded-2xl p-4 text-white font-bold" type="number" placeholder="Año" value={wizardData.year} onChange={e => setWizardData({...wizardData, year: Number(e.target.value)})} />
                                  </div>
                                  <div className="relative">
                                      <Gauge className="absolute left-4 top-4 text-slate-500 w-6 h-6" />
                                      <input 
                                        className="w-full bg-slate-800/50 border-2 border-slate-800 rounded-2xl pl-14 pr-4 py-4 text-white font-bold" 
                                        type="number" 
                                        placeholder="Kilometraje" 
                                        value={wizardData.mileage} 
                                        onChange={e => setWizardData({...wizardData, mileage: e.target.value})} 
                                      />
                                  </div>
                              </div>
                          )}

                          {step === 3 && (
                              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                  <div className="flex items-center gap-3 mb-4">
                                      <Wrench className="text-orange-500 w-6 h-6" />
                                      <h4 className="text-xl font-bold text-white">Orden de Trabajo</h4>
                                  </div>
                                  <textarea 
                                    className="w-full bg-slate-800/50 border-2 border-slate-800 rounded-3xl p-6 text-white font-bold h-48 resize-none focus:border-orange-500 outline-none" 
                                    placeholder="¿Qué le ocurre al vehículo?"
                                    value={wizardData.jobDescription}
                                    onChange={e => setWizardData({...wizardData, jobDescription: e.target.value})}
                                  />
                              </div>
                          )}
                      </div>

                      <div className="p-8 border-t border-slate-800 bg-slate-900 flex justify-between pb-[env(safe-area-inset-bottom)]">
                          <button 
                            disabled={step === 1}
                            onClick={() => setStep(s => s - 1)}
                            className="px-6 py-4 rounded-2xl text-slate-500 font-black uppercase tracking-widest text-xs hover:bg-slate-800 disabled:opacity-0 transition-all"
                          >
                             Anterior
                          </button>
                          
                          {step < 3 ? (
                              <button 
                                onClick={() => setStep(s => s + 1)}
                                disabled={(step === 1 && !wizardData.clientName) || (step === 2 && !wizardData.plate)}
                                className="px-10 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-900/40 active:scale-95 disabled:opacity-50"
                              >
                                Siguiente
                              </button>
                          ) : (
                              <button 
                                onClick={handleWizardSubmit}
                                disabled={!wizardData.jobDescription}
                                className="px-10 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-emerald-900/40 active:scale-95 disabled:opacity-50"
                              >
                                FINALIZAR
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
