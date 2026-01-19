
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
    className="bg-slate-800/50 backdrop-blur-md border border-slate-700 p-5 md:p-6 rounded-2xl relative overflow-hidden group hover:border-slate-600 transition-all"
  >
    <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 group-hover:opacity-20 transition-opacity ${color}`} />
    <div className="flex justify-between items-start relative z-10">
      <div>
        <p className="text-slate-400 text-xs md:text-sm font-medium uppercase tracking-wider">{title}</p>
        <h3 className="text-2xl md:text-3xl font-bold text-white mt-1">{value}</h3>
      </div>
      <div className={`p-3 rounded-xl ${color} bg-opacity-10 text-white`}>
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

  if (!stats) return <div className="p-8 text-white flex items-center gap-3"><div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div> Cargando métricas...</div>;

  return (
    <div className="space-y-6 md:space-y-8 p-4 md:p-8 h-full overflow-y-auto pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-white">Panel Principal</h2>
          <p className="text-slate-400 mt-1 text-sm md:text-base">Visión general del rendimiento.</p>
        </div>
        <div className="w-full md:w-auto">
            <button 
                onClick={() => setIsWizardOpen(true)}
                className="w-full md:w-auto bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2 font-bold transition-all hover:scale-105 active:scale-95"
            >
                <Plus className="w-5 h-5" />
                Recepción Rápida
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard title="Ingresos" value={`${stats.totalRevenue.toLocaleString('es-ES')} €`} icon={Euro} color="bg-blue-500" delay={0} />
        <StatCard title="Gastos" value={`${stats.totalExpenses.toLocaleString('es-ES')} €`} icon={Wallet} color="bg-red-500" delay={0.1} />
        <StatCard title="Beneficio" value={`${stats.netProfit.toLocaleString('es-ES')} €`} icon={TrendingUp} color="bg-emerald-500" delay={0.2} />
        <StatCard title="En Taller" value={stats.activeJobs} icon={Activity} color="bg-orange-500" delay={0.3} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="lg:col-span-2 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-4 md:p-6 shadow-xl"
        >
          <h3 className="text-lg md:text-xl font-bold text-white mb-6">Tendencia de Ingresos</h3>
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
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff' }}
                  itemStyle={{ color: '#60a5fa' }}
                  formatter={(value: number) => [`${value} €`, 'Ingresos']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-4 md:p-6 shadow-xl"
        >
          <h3 className="text-lg md:text-xl font-bold text-white mb-6">Carga (Mecánicos)</h3>
          <div className="h-[250px] md:h-[300px]">
            {stats.mechanicLoad.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.mechanicLoad}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="name" stroke="#64748b" />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff' }} />
                    <Bar dataKey="jobs" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
            ) : (
                <div className="h-full flex items-center justify-center text-slate-500">
                    No hay trabajos activos asignados.
                </div>
            )}
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
          {isWizardOpen && (
              <div className="fixed inset-0 z-[70] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/80 backdrop-blur-sm">
                  <motion.div 
                    initial={{ opacity: 0, y: 100 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 100 }}
                    className="bg-slate-900 border-t md:border border-slate-700 w-full max-w-2xl rounded-t-2xl md:rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[90vh] md:h-auto"
                  >
                      <div className="bg-slate-800 p-6 flex justify-between items-center border-b border-slate-700">
                          <div>
                              <h3 className="text-xl font-bold text-white">Nueva Recepción</h3>
                              <p className="text-slate-400 text-sm">Paso {step} de 3</p>
                          </div>
                          <button onClick={() => setIsWizardOpen(false)} className="text-slate-400 hover:text-white bg-slate-700 rounded-full p-1"><X className="w-5 h-5" /></button>
                      </div>

                      <div className="w-full bg-slate-800 h-1">
                          <div className="bg-blue-500 h-full transition-all duration-300" style={{ width: `${(step/3)*100}%` }} />
                      </div>

                      <div className="p-6 md:p-8 min-h-[300px] overflow-y-auto">
                          {step === 1 && (
                              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                  <div className="flex items-center gap-3 mb-6">
                                      <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30"><User /></div>
                                      <h4 className="text-lg font-bold text-white">Datos del Cliente</h4>
                                  </div>
                                  <input 
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none" 
                                    placeholder="Nombre Completo"
                                    value={wizardData.clientName}
                                    onChange={e => setWizardData({...wizardData, clientName: e.target.value})}
                                    autoFocus
                                  />
                                  <input 
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none" 
                                    placeholder="Teléfono"
                                    type="tel"
                                    value={wizardData.clientPhone}
                                    onChange={e => setWizardData({...wizardData, clientPhone: e.target.value})}
                                  />
                                  <input 
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none" 
                                    placeholder="Email (Opcional)"
                                    type="email"
                                    value={wizardData.clientEmail}
                                    onChange={e => setWizardData({...wizardData, clientEmail: e.target.value})}
                                  />
                              </div>
                          )}

                          {step === 2 && (
                              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                  <div className="flex items-center gap-3 mb-6">
                                      <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30"><Car /></div>
                                      <h4 className="text-lg font-bold text-white">Datos del Vehículo</h4>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                      <input className="bg-slate-800 border border-slate-700 rounded-xl p-3 text-white" placeholder="Marca" value={wizardData.make} onChange={e => setWizardData({...wizardData, make: e.target.value})} autoFocus />
                                      <input className="bg-slate-800 border border-slate-700 rounded-xl p-3 text-white" placeholder="Modelo" value={wizardData.model} onChange={e => setWizardData({...wizardData, model: e.target.value})} />
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                      <input className="bg-slate-800 border border-slate-700 rounded-xl p-3 text-white uppercase" placeholder="Matrícula" value={wizardData.plate} onChange={e => setWizardData({...wizardData, plate: e.target.value.toUpperCase()})} />
                                      <input className="bg-slate-800 border border-slate-700 rounded-xl p-3 text-white" type="number" placeholder="Año" value={wizardData.year} onChange={e => setWizardData({...wizardData, year: Number(e.target.value)})} />
                                  </div>
                                  <input className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white" placeholder="Motorización" value={wizardData.engine} onChange={e => setWizardData({...wizardData, engine: e.target.value})} />
                                  <div className="relative">
                                      <Gauge className="absolute left-3 top-3.5 text-slate-500 w-5 h-5" />
                                      <input 
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-3 py-3 text-white" 
                                        type="number" 
                                        placeholder="Kilometraje Actual (Km)" 
                                        value={wizardData.mileage} 
                                        onChange={e => setWizardData({...wizardData, mileage: e.target.value})} 
                                      />
                                  </div>
                              </div>
                          )}

                          {step === 3 && (
                              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                  <div className="flex items-center gap-3 mb-6">
                                      <div className="w-10 h-10 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30"><Wrench /></div>
                                      <h4 className="text-lg font-bold text-white">Solicitud de Trabajo</h4>
                                  </div>
                                  <textarea 
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white h-32 resize-none focus:ring-2 focus:ring-purple-500 outline-none" 
                                    placeholder="Describe el problema o servicio a realizar..."
                                    value={wizardData.jobDescription}
                                    onChange={e => setWizardData({...wizardData, jobDescription: e.target.value})}
                                    autoFocus
                                  />
                              </div>
                          )}
                      </div>

                      <div className="p-6 border-t border-slate-800 flex justify-between pb-safe-area bg-slate-900">
                          <button 
                            disabled={step === 1}
                            onClick={() => setStep(s => s - 1)}
                            className="px-4 md:px-6 py-2 rounded-lg text-slate-400 hover:bg-slate-800 disabled:opacity-30 flex items-center gap-2"
                          >
                             <ChevronLeft className="w-4 h-4" /> <span className="hidden md:inline">Anterior</span>
                          </button>
                          
                          {step < 3 ? (
                              <button 
                                onClick={() => setStep(s => s + 1)}
                                disabled={(step === 1 && !wizardData.clientName) || (step === 2 && !wizardData.plate)}
                                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Siguiente <ChevronRight className="w-4 h-4" />
                              </button>
                          ) : (
                              <button 
                                onClick={handleWizardSubmit}
                                disabled={!wizardData.jobDescription}
                                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center gap-2 disabled:opacity-50"
                              >
                                <CheckCircle className="w-4 h-4" /> <span className="whitespace-nowrap">Finalizar</span>
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
