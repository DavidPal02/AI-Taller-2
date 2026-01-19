
import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Activity, CheckCircle, Wallet, TrendingUp, Plus, User, Car, Wrench, ChevronRight, ChevronLeft, X, Euro, Gauge, Sparkles } from 'lucide-react';
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
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [wizardData, setWizardData] = useState({
      clientName: '', clientPhone: '', clientEmail: '',
      make: '', model: '', plate: '', year: new Date().getFullYear(),
      jobDescription: '', mileage: ''
  });

  useEffect(() => { loadStats(); }, []);

  const loadStats = async () => {
    try {
        const data = await dbService.getDashboardStats();
        setStats(data);
    } catch (e) { console.error("Error cargando stats:", e); }
  };

  const handleWizardSubmit = async () => {
      try {
          const clientId = crypto.randomUUID();
          await dbService.addClient({ id: clientId, name: wizardData.clientName, phone: wizardData.clientPhone, email: wizardData.clientEmail, address: '', createdAt: new Date().toISOString() });

          const vehicleId = crypto.randomUUID();
          await dbService.addVehicle({ id: vehicleId, clientId, make: wizardData.make, model: wizardData.model, plate: wizardData.plate.toUpperCase(), year: wizardData.year, currentMileage: Number(wizardData.mileage) || 0 });

          await dbService.saveJob({ id: crypto.randomUUID(), vehicleId, clientId, description: wizardData.jobDescription, status: JobStatus.PENDING, items: [], laborHours: 0, laborPricePerHour: 40, entryDate: new Date().toISOString(), mileage: Number(wizardData.mileage) || 0, total: 0, isPaid: false });

          setIsWizardOpen(false);
          setStep(1);
          setWizardData({ clientName: '', clientPhone: '', clientEmail: '', make: '', model: '', plate: '', year: new Date().getFullYear(), jobDescription: '', mileage: '' });
          loadStats();
      } catch (e) { alert('Error al procesar: ' + (e as any).message); }
  };

  const chartData = [ { name: 'Lun', r: 400 }, { name: 'Mar', r: 300 }, { name: 'Mie', r: 600 }, { name: 'Jue', r: 450 }, { name: 'Vie', r: 800 }, { name: 'Sab', r: 550 } ];

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
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
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
                                  <input className="w-full bg-slate-800/50 border-2 border-slate-800 rounded-3xl p-5 text-white font-bold outline-none focus:border-blue-500 transition-all" placeholder="Nombre completo" value={wizardData.clientName} onChange={e => setWizardData({...wizardData, clientName: e.target.value})} />
                                  <input className="w-full bg-slate-800/50 border-2 border-slate-800 rounded-3xl p-5 text-white font-bold outline-none" placeholder="Teléfono" value={wizardData.clientPhone} onChange={e => setWizardData({...wizardData, clientPhone: e.target.value})} />
                              </div>
                          )}
                          {step === 2 && (
                              <div className="space-y-6">
                                  <div className="flex items-center gap-3 mb-4"><Car className="text-emerald-500 w-7 h-7" /><h4 className="text-2xl font-black text-white uppercase italic tracking-tighter">Vehículo</h4></div>
                                  <div className="grid grid-cols-2 gap-4">
                                      <input className="bg-slate-800/50 border-2 border-slate-800 rounded-3xl p-5 text-white font-bold outline-none" placeholder="Marca" value={wizardData.make} onChange={e => setWizardData({...wizardData, make: e.target.value})} />
                                      <input className="bg-slate-800/50 border-2 border-slate-800 rounded-3xl p-5 text-white font-bold outline-none" placeholder="Modelo" value={wizardData.model} onChange={e => setWizardData({...wizardData, model: e.target.value})} />
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                      <input className="bg-slate-800/50 border-2 border-slate-800 rounded-3xl p-5 text-white font-bold outline-none uppercase" placeholder="Matrícula" value={wizardData.plate} onChange={e => setWizardData({...wizardData, plate: e.target.value.toUpperCase()})} />
                                      <input className="bg-slate-800/50 border-2 border-slate-800 rounded-3xl p-5 text-white font-bold outline-none" type="number" placeholder="Km actuales" value={wizardData.mileage} onChange={e => setWizardData({...wizardData, mileage: e.target.value})} />
                                  </div>
                              </div>
                          )}
                          {step === 3 && (
                              <div className="space-y-6">
                                  <div className="flex items-center gap-3 mb-4"><Wrench className="text-orange-500 w-7 h-7" /><h4 className="text-2xl font-black text-white uppercase italic tracking-tighter">Trabajo</h4></div>
                                  <textarea className="w-full bg-slate-800/50 border-2 border-slate-800 rounded-[2.5rem] p-8 text-white font-bold h-48 resize-none outline-none focus:border-orange-500" placeholder="¿Qué necesita el cliente?" value={wizardData.jobDescription} onChange={e => setWizardData({...wizardData, jobDescription: e.target.value})} />
                              </div>
                          )}
                      </div>
                      <div className="p-10 border-t border-slate-800 bg-slate-900 flex justify-between">
                          <button disabled={step === 1} onClick={() => setStep(s => s - 1)} className="px-8 py-4 rounded-3xl text-slate-500 font-black uppercase tracking-widest text-xs hover:bg-slate-800 disabled:opacity-0">Anterior</button>
                          {step < 3 ? (
                              <button onClick={() => setStep(s => s + 1)} disabled={(step === 1 && !wizardData.clientName) || (step === 2 && !wizardData.plate)} className="px-12 py-5 bg-blue-600 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-2xl active:scale-95">Siguiente</button>
                          ) : (
                              <button onClick={handleWizardSubmit} disabled={!wizardData.jobDescription} className="px-12 py-5 bg-emerald-600 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-2xl active:scale-95">Finalizar</button>
                          )}
                      </div>
                  </motion.div>
              </div>
          )}
      </AnimatePresence>
    </div>
  );
};
