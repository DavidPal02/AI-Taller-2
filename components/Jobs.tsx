
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Car, X, FileText, Printer, DollarSign, Wallet, Edit3, Trash2, User, FileDown, ToggleLeft, ToggleRight, Clock, Users, Wrench, ChevronLeft, ChevronRight } from 'lucide-react';
import { dbService } from '../services/dbService';
import { Job, JobStatus, Vehicle, Client, JobItem, Expense, Mechanic, WorkshopSettings } from '../types';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType } from 'docx';
import saveAs from 'file-saver';

interface JobBoardProps {
  onNotify: (msg: string) => void;
}

declare global {
  interface Window {
    html2pdf: any;
  }
}

const EditableField = ({ value, onChange, className, placeholder }: { value: string, onChange: (val: string) => void, className?: string, placeholder?: string }) => (
    <input 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        className={`bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-blue-300 outline-none rounded px-1 transition-all w-full ${className}`}
        placeholder={placeholder}
    />
);

export const Jobs: React.FC<JobBoardProps> = ({ onNotify }) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settings, setSettings] = useState<WorkshopSettings | null>(null);
  
  const [editingJob, setEditingJob] = useState<Partial<Job> | null>(null);
  const [showInvoice, setShowInvoice] = useState<Job | null>(null);
  const [includeTax, setIncludeTax] = useState(true);
  const [invoiceData, setInvoiceData] = useState<{
    clientName: string;
    clientAddress: string;
    clientPhone: string;
    invoiceNumber: string;
    date: string;
  } | null>(null);

  const [jobForm, setJobForm] = useState<Partial<Job>>({});
  const [newItem, setNewItem] = useState({ description: '', quantity: 1, unitPrice: 0 });
  const [jobExpenses, setJobExpenses] = useState<Expense[]>([]);
  const [newExpense, setNewExpense] = useState({ description: '', amount: 0 });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [js, vs, cs, es, ms, sets] = await Promise.all([
      dbService.getJobs(),
      dbService.getVehicles(),
      dbService.getClients(),
      dbService.getExpenses(),
      dbService.getMechanics(),
      dbService.getSettings()
    ]);
    setJobs(js);
    setVehicles(vs);
    setClients(cs);
    setExpenses(es);
    setMechanics(ms);
    setSettings(sets);
  };

  // Fix: Implemented handleVehicleChange to update vehicleId and associated clientId
  const handleVehicleChange = (vehicleId: string) => {
    const v = vehicles.find(v => v.id === vehicleId);
    setJobForm(prev => ({ ...prev, vehicleId, clientId: v?.clientId || '' }));
  };

  const updateJobStatus = async (job: Job, newStatus: JobStatus) => {
    const updated = { ...job, status: newStatus };
    await dbService.saveJob(updated);
    setJobs(jobs.map(j => j.id === job.id ? updated : j));
    onNotify(`Estado: ${newStatus}`);
  };

  const handleNewJob = () => {
    const newJob: Partial<Job> = {
      description: '', status: JobStatus.PENDING, total: 0, items: [], laborHours: 0,
      laborPricePerHour: 40, entryDate: new Date().toISOString(), mileage: 0, isPaid: false
    };
    setEditingJob(newJob);
    setJobForm(newJob);
    setJobExpenses([]);
  };

  const openEditModal = (job: Job) => {
    setEditingJob(job);
    setJobForm(JSON.parse(JSON.stringify(job)));
    setJobExpenses(expenses.filter(e => e.jobId === job.id));
  };

  const openInvoice = (job: Job) => {
      const client = clients.find(c => c.id === job.clientId);
      setInvoiceData({
          clientName: client?.name || '', clientAddress: client?.address || '',
          clientPhone: client?.phone || '', invoiceNumber: job.id.slice(0, 8).toUpperCase(),
          date: new Date().toLocaleDateString()
      });
      setShowInvoice(job);
  };

  const handleAddItem = () => {
    if (!newItem.description) return;
    const item: JobItem = { id: crypto.randomUUID(), ...newItem };
    const updatedItems = [...(jobForm.items || []), item];
    recalculateTotal(updatedItems, jobForm.laborHours || 0, jobForm.laborPricePerHour || 0);
    setNewItem({ description: '', quantity: 1, unitPrice: 0 });
  };

  const removeItem = (itemId: string) => {
    const updatedItems = (jobForm.items || []).filter(i => i.id !== itemId);
    recalculateTotal(updatedItems, jobForm.laborHours || 0, jobForm.laborPricePerHour || 0);
  };

  const recalculateTotal = (items: JobItem[], laborHours: number, laborRate: number) => {
      const itemsTotal = items.reduce((acc, curr) => acc + (curr.quantity * curr.unitPrice), 0);
      setJobForm(prev => ({ ...prev, items, laborHours, laborPricePerHour: laborRate, total: itemsTotal + (laborHours * laborRate) }));
  };

  const handleAddJobExpense = () => {
    if(!newExpense.description || newExpense.amount <= 0) return;
    const exp: Expense = { ...newExpense, id: crypto.randomUUID(), jobId: editingJob?.id, date: new Date().toISOString(), category: 'Piezas' } as Expense;
    setJobExpenses([...jobExpenses, exp]);
    setNewExpense({ description: '', amount: 0 });
  };

  const saveJobChanges = async () => {
    if (!jobForm.description || !jobForm.vehicleId) { onNotify("Datos incompletos"); return; }
    const jobId = jobForm.id || crypto.randomUUID();
    const updatedJob = { ...jobForm, id: jobId } as Job;
    await dbService.saveJob(updatedJob);
    for (const exp of jobExpenses) { if (!expenses.find(e => e.id === exp.id)) await dbService.addExpense({ ...exp, jobId }); }
    onNotify(jobForm.id ? "Actualizado" : "Creado");
    setEditingJob(null);
    loadData();
  };

  const getVehicleInfo = (id: string) => {
    const v = vehicles.find(v => v.id === id);
    return v ? `${v.make} ${v.model} (${v.plate})` : 'Desconocido';
  };

  const columns = Object.values(JobStatus);

  return (
    <div className="h-full flex flex-col bg-slate-950 relative overflow-hidden">
      {/* Header optimizado para iPhone (Safe Area Top + Espacio) */}
      <header className="pt-safe px-6 pb-6 md:p-8 shrink-0">
        <div className="mt-8 md:mt-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
            <div>
              <h2 className="text-3xl md:text-4xl font-black text-white tracking-tighter">Trabajos</h2>
              <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em] flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                  Control de Flujo Operativo
              </p>
            </div>
            {/* El botón Nuevo se oculta en móvil para usar el FAB */}
            <button onClick={handleNewJob} className="hidden md:flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl shadow-xl shadow-blue-900/20 font-black transition-all hover:scale-105 active:scale-95">
                <Plus className="w-5 h-5" /> <span>NUEVO TRABAJO</span>
            </button>
        </div>
      </header>

      {/* Kanban Board - Scroll horizontal optimizado */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden px-4 md:px-8 pb-32">
        <div className="flex gap-4 md:gap-8 h-full min-w-full md:min-w-[1200px]">
          {columns.map((status) => (
            <div key={status} className="flex-1 min-w-[85vw] md:min-w-[350px] flex flex-col bg-slate-900/40 border border-slate-800/50 rounded-[2.5rem] p-4 md:p-6">
              <div className="flex items-center justify-between mb-6 px-4">
                <h3 className="font-black text-xs uppercase tracking-[0.2em] text-slate-500">{status}</h3>
                <span className="text-[10px] font-black bg-slate-800 px-3 py-1 rounded-full text-slate-300 border border-slate-700">
                  {jobs.filter(j => j.status === status).length}
                </span>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-1">
                {jobs.filter(j => j.status === status).length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-20 py-10">
                        {/* Fix: Wrench icon is now available */}
                        <Wrench className="w-12 h-12 mb-4" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Sin tareas</span>
                    </div>
                ) : (
                    jobs.filter(j => j.status === status).map((job) => (
                      <motion.div
                        key={job.id}
                        layoutId={job.id}
                        onClick={() => openEditModal(job)}
                        className="bg-slate-800/40 hover:bg-slate-800 border border-slate-700/50 p-5 rounded-3xl cursor-pointer group shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <span className="text-[10px] font-black text-blue-500 bg-blue-500/10 px-2 py-1 rounded-lg">#{job.id.slice(0, 5).toUpperCase()}</span>
                          <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {new Date(job.entryDate).toLocaleDateString()}
                          </span>
                        </div>
                        <h4 className="font-black text-white mb-2 text-sm leading-tight group-hover:text-blue-400 transition-colors uppercase">{job.description}</h4>
                        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 mb-4 bg-slate-900/50 p-2 rounded-xl">
                          <Car className="w-4 h-4 text-blue-500" /> <span className="truncate">{getVehicleInfo(job.vehicleId)}</span>
                        </div>
                        
                        <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
                            <div className="text-sm font-black text-white">{job.total.toLocaleString()} €</div>
                            <div className="flex gap-1">
                                {status !== JobStatus.PENDING && (
                                    <button onClick={(e) => { e.stopPropagation(); updateJobStatus(job, columns[columns.indexOf(status) - 1]); }} className="p-2 hover:bg-slate-700 rounded-xl text-slate-500 active:scale-90 transition-all">
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                )}
                                {status !== JobStatus.DELIVERED && (
                                    <button onClick={(e) => { e.stopPropagation(); updateJobStatus(job, columns[columns.indexOf(status) + 1]); }} className="p-2 bg-blue-600/10 text-blue-500 hover:bg-blue-600 hover:text-white rounded-xl active:scale-90 transition-all">
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                      </motion.div>
                    ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAB - Botón de Acción Flotante para Móvil (Ergonomía iPhone) */}
      <div className="md:hidden fixed right-6 bottom-24 z-[150]">
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={handleNewJob}
            className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-[0_15px_30px_rgba(37,99,235,0.5)] animate-float"
          >
              <Plus className="w-8 h-8" />
          </motion.button>
      </div>

      {/* Modales - Se mantienen pero se ajustan los paddings inferiores */}
      <AnimatePresence>
        {editingJob && (
          <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="bg-slate-900 border-t md:border border-slate-700 w-full max-w-4xl rounded-t-[3rem] md:rounded-[2.5rem] shadow-2xl flex flex-col h-[92vh] md:max-h-[90vh] overflow-hidden"
            >
              <div className="p-6 md:p-8 flex justify-between items-center bg-slate-900 border-b border-slate-800 sticky top-0 z-10">
                <div>
                  <h3 className="text-xl font-black text-white">GESTIÓN DE TRABAJO</h3>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{jobForm.id ? `#${jobForm.id.slice(0,8).toUpperCase()}` : 'NUEVO REGISTRO'}</span>
                </div>
                <button onClick={() => setEditingJob(null)} className="p-3 bg-slate-800 rounded-full text-white active:scale-90 transition-transform"><X className="w-6 h-6" /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 pb-40">
                {/* Formulario simplificado para thumb-reach */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block">Vehículo del Cliente</label>
                            {/* Fix: handleVehicleChange is now defined */}
                            <select className="w-full bg-slate-800/50 border-2 border-slate-800 rounded-2xl p-4 text-white font-bold outline-none focus:border-blue-500" value={jobForm.vehicleId || ''} onChange={(e) => handleVehicleChange(e.target.value)}>
                                <option value="">Elegir coche...</option>
                                {vehicles.map(v => (<option key={v.id} value={v.id}>{v.plate} - {v.make} {v.model}</option>))}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block">Descripción del Problema</label>
                            <input className="w-full bg-slate-800/50 border-2 border-slate-800 rounded-2xl p-4 text-white font-bold outline-none focus:border-blue-500" value={jobForm.description} onChange={(e) => setJobForm({...jobForm, description: e.target.value})} placeholder="Ej: Cambio de frenos traseros" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block">Horas Estimadas</label>
                                <input type="number" className="w-full bg-slate-800/50 border-2 border-slate-800 rounded-2xl p-4 text-white font-bold outline-none" value={jobForm.laborHours} onChange={(e) => recalculateTotal(jobForm.items || [], Number(e.target.value), jobForm.laborPricePerHour || 0)} />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block">€/Hora Taller</label>
                                <input type="number" className="w-full bg-slate-800/50 border-2 border-slate-800 rounded-2xl p-4 text-white font-bold outline-none" value={jobForm.laborPricePerHour} onChange={(e) => recalculateTotal(jobForm.items || [], jobForm.laborHours || 0, Number(e.target.value))} />
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-slate-950/50 rounded-[2rem] p-6 border-2 border-slate-800/50">
                        <h4 className="font-black text-xs text-slate-500 uppercase tracking-widest mb-6">Desglose Económico</h4>
                        <div className="space-y-4 mb-8">
                            <div className="flex justify-between items-center text-slate-400 font-bold uppercase text-[10px]">
                                <span>Subtotal Mano de Obra</span>
                                <span className="text-white">{((jobForm.laborHours || 0) * (jobForm.laborPricePerHour || 0)).toFixed(2)} €</span>
                            </div>
                            <div className="flex justify-between items-center text-slate-400 font-bold uppercase text-[10px]">
                                <span>Total Repuestos</span>
                                <span className="text-white">{(jobForm.items?.reduce((a,b) => a + (b.quantity*b.unitPrice), 0) || 0).toFixed(2)} €</span>
                            </div>
                            <div className="h-px bg-slate-800 my-4" />
                            <div className="flex justify-between items-center">
                                <span className="text-lg font-black text-white italic">TOTAL</span>
                                <span className="text-2xl font-black text-blue-500">{jobForm.total?.toLocaleString()} €</span>
                            </div>
                        </div>
                        <button onClick={saveJobChanges} className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-3xl font-black text-lg tracking-tight shadow-xl shadow-blue-900/40 active:scale-95 transition-all">
                            GUARDAR CAMBIOS
                        </button>
                    </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
