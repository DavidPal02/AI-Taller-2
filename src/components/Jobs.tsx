
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Car, X, FileText, Printer, DollarSign, Wallet, Edit3, Trash2, User, FileDown, ToggleLeft, ToggleRight, Clock, Users, Wrench, ChevronLeft, ChevronRight, AlertTriangle, Gauge, TrendingUp } from 'lucide-react';
import { dbService } from '../services/dbService';
import { Job, JobStatus, Vehicle, Client, JobItem, Expense, Mechanic, WorkshopSettings } from '../types';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType } from 'docx';
import saveAs from 'file-saver';
import { JobDetailModal } from './JobDetailModal';

interface JobBoardProps {
  onNotify: (msg: string) => void;
  pendingJobId?: string | null;
  onClearPendingJob?: () => void;
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

export const Jobs: React.FC<JobBoardProps> = ({ onNotify, pendingJobId, onClearPendingJob }) => {
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

  // Custom Delete Modal State
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Budget Preview State
  const [showBudgetPreview, setShowBudgetPreview] = useState(false);
  const [applyVat, setApplyVat] = useState(false);

  // Optimize lookups
  const vehicleMap = React.useMemo(() => {
    return vehicles.reduce((acc, v) => ({ ...acc, [v.id]: { desc: `${v.make} ${v.model} (${v.plate})` } }), {} as Record<string, { desc: string }>);
  }, [vehicles]);

  const jobsByStatus = React.useMemo(() => {
    const groups: Record<string, Job[]> = {};
    Object.values(JobStatus).forEach(s => groups[s] = []);
    jobs.forEach(j => {
      if (!j.isArchived && groups[j.status]) {
        groups[j.status].push(j);
      }
    });
    return groups;
  }, [jobs]);

  // History / Archiving State
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => { loadData(); }, []);

  // Effect to handle navigation from other components (e.g. Vehicles)
  useEffect(() => {
    if (pendingJobId && jobs.length > 0) {
      const jobToOpen = jobs.find(j => j.id === pendingJobId);
      if (jobToOpen) {
        openEditModal(jobToOpen);
        // If the job is archived, we should probably switch to history view to avoid confusion, 
        // or just showing the modal is enough. Let's switch view if needed.
        if (jobToOpen.isArchived) {
          setShowHistory(true);
        } else {
          setShowHistory(false);
        }
      }
      if (onClearPendingJob) onClearPendingJob();
    }
  }, [pendingJobId, jobs]);

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

  const updateJobStatus = async (job: Job, newStatus: JobStatus) => {
    const updated = { ...job, status: newStatus };
    await dbService.saveJob(updated);
    setJobs(jobs.map(j => j.id === job.id ? updated : j));
  };

  const toggleArchiveJob = async (job: Job) => {
    const newArchivedStatus = !job.isArchived;
    const updated = { ...job, isArchived: newArchivedStatus };
    await dbService.saveJob(updated);
    setJobs(jobs.map(j => j.id === job.id ? updated : j));
    if (editingJob) setEditingJob(null);
  };

  const handleNewJob = () => {
    const newJob: Partial<Job> = {
      description: '', status: JobStatus.PENDING, total: 0, items: [], laborHours: 0,
      laborPricePerHour: 40, entryDate: new Date().toISOString(), mileage: 0, isPaid: false
    };
    setEditingJob(newJob);
  };

  const openEditModal = (job: Job) => {
    setEditingJob(job);
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

  const handleShowBudgetPreview = (job: Partial<Job>) => {
    // Current budget preview logic uses jobForm, but now it will use the job passed from modal
    // We can update editingJob or just pass it to openInvoice if needed
    // For now, let's just make it work with the existing showBudgetPreview logic
    // but we need the client info which isn't in editingJob if it's new
    setEditingJob(job);
    setShowBudgetPreview(true);
  };

  const handleSaveJob = async (updatedJob: Job, newExpenses: Expense[]) => {
    if (!updatedJob.description || !updatedJob.vehicleId) { onNotify("Datos incompletos"); return; }
    const jobId = updatedJob.id || crypto.randomUUID();
    const finalJob = { ...updatedJob, id: jobId };
    await dbService.saveJob(finalJob);

    // Save new expenses
    for (const exp of newExpenses) {
      if (!expenses.find(e => e.id === exp.id)) {
        await dbService.addExpense({ ...exp, jobId });
      }
    }

    setEditingJob(null);
    loadData();
  };

  const requestDeleteJob = (id: string | undefined) => {
    if (!id) return;
    setConfirmDeleteId(id);
  };

  const confirmDeleteJob = async () => {
    if (confirmDeleteId) {
      await dbService.deleteJob(confirmDeleteId);
      onNotify("Trabajo eliminado");
      setEditingJob(null); // Close edit modal if open
      setConfirmDeleteId(null);
      loadData();
    }
  };

  const getVehicleInfo = (id: string) => {
    const v = vehicles.find(v => v.id === id);
    return v ? `${v.make} ${v.model} (${v.plate})` : 'Desconocido';
  };

  const printBudget = () => {
    const element = document.getElementById('budget-preview-content');
    if (!element) return;

    const opt = {
      margin: [10, 10],
      filename: `Presupuesto_${editingJob?.id?.slice(0, 8) || 'Borrador'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // Create a clone for printing to modify styles without affecting UI
    const clone = element.cloneNode(true) as HTMLElement;
    clone.style.padding = '40px';
    clone.style.background = 'white';
    clone.style.color = 'black';
    clone.style.width = '100%';
    clone.style.maxWidth = '800px';
    clone.style.height = 'auto';
    clone.style.overflow = 'visible';

    // Temporary container
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.appendChild(clone);
    document.body.appendChild(container);

    window.html2pdf().set(opt).from(clone).save().then(() => {
      document.body.removeChild(container);
    });
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
          <div className="flex gap-3">
            <div className="hidden md:flex bg-slate-900/50 p-1 rounded-xl border border-slate-800">
              <button onClick={() => setShowHistory(false)} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${!showHistory ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>
                ACTIVOS
              </button>
              <button onClick={() => setShowHistory(true)} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${showHistory ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>
                HISTORIAL
              </button>
            </div>
            <button onClick={handleNewJob} className="hidden md:flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl shadow-xl shadow-blue-900/20 font-black transition-all hover:scale-105 active:scale-95">
              <Plus className="w-5 h-5" /> <span>NUEVO TRABAJO</span>
            </button>
          </div>
        </div>

        {/* Mobile Tabs */}
        <div className="md:hidden mt-6 flex bg-slate-900/50 p-1 rounded-xl border border-slate-800">
          <button onClick={() => setShowHistory(false)} className={`flex-1 py-3 rounded-lg text-xs font-bold transition-all ${!showHistory ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'}`}>
            ACTIVOS
          </button>
          <button onClick={() => setShowHistory(true)} className={`flex-1 py-3 rounded-lg text-xs font-bold transition-all ${showHistory ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'}`}>
            HISTORIAL
          </button>
        </div>
      </header>

      {/* Kanban Board - Scroll horizontal optimizado (Solo Activos) */}
      {!showHistory ? (
        <div className="flex-1 overflow-x-auto overflow-y-hidden px-4 md:px-8 pb-32">
          <div className="flex gap-4 md:gap-8 h-full min-w-full md:min-w-[1200px]">
            {columns.map((status) => {
              const statusJobs = jobsByStatus[status] || [];
              return (
                <div key={status} className="flex-1 min-w-[85vw] md:min-w-[350px] flex flex-col bg-slate-900/40 border border-slate-800/50 rounded-[2.5rem] p-4 md:p-6">
                  <div className="flex items-center justify-between mb-6 px-4">
                    <h3 className="font-black text-xs uppercase tracking-[0.2em] text-slate-500">{status}</h3>
                    <span className="text-[10px] font-black bg-slate-800 px-3 py-1 rounded-full text-slate-300 border border-slate-700">
                      {statusJobs.length}
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-1">
                    {statusJobs.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center opacity-20 py-10">
                        <Wrench className="w-12 h-12 mb-4" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Sin tareas</span>
                      </div>
                    ) : (
                      statusJobs.map((job) => (
                        <div
                          key={job.id}
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
                            <Car className="w-4 h-4 text-blue-500" /> <span className="truncate">{vehicleMap[job.vehicleId]?.desc || 'Desconocido'}</span>
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
                                <button onClick={(e) => { e.stopPropagation(); updateJobStatus(job, columns[columns.indexOf(status) + 1]); }} className="p-2 bg-blue-600/10 text-blue-500 hover:bg-blue-600 hover:text-white rounded-xl active:scale-95 transition-all">
                                  <ChevronRight className="w-4 h-4" />
                                </button>
                              )}
                              {/* Botón de Archivar solo si está entregado */}
                              {status === JobStatus.DELIVERED && (
                                <button onClick={(e) => { e.stopPropagation(); toggleArchiveJob(job); }} className="p-2 ml-1 bg-slate-700/50 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl active:scale-95 transition-all" title="Archivar Trabajo">
                                  <FileDown className="w-4 h-4" />
                                </button>
                              )}
                              <button onClick={(e) => { e.stopPropagation(); requestDeleteJob(job.id); }} className="p-2 hover:bg-red-500/10 text-slate-500 hover:text-red-400 rounded-xl active:scale-95 transition-all">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* VISTA HISTORIAL: Lista de trabajos archivados */
        <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-32">
          <div className="max-w-7xl mx-auto space-y-4">
            {jobs.filter(j => j.isArchived).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 opacity-50">
                <FileDown className="w-20 h-20 mb-6 text-slate-600" />
                <h3 className="text-xl font-black text-white uppercase">Historial Vacío</h3>
                <p className="text-slate-500">No hay trabajos archivados en este momento.</p>
              </div>
            ) : (
              jobs.filter(j => j.isArchived).map(job => (
                <div key={job.id} onClick={() => openEditModal(job)} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 cursor-pointer hover:bg-slate-800 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-slate-500 font-black text-xs">
                      #{job.id.slice(0, 4)}
                    </div>
                    <div>
                      <h4 className="font-black text-white uppercase text-sm mb-1">{job.description}</h4>
                      <div className="flex items-center gap-3 text-xs text-slate-500 font-bold">
                        <span className="flex items-center gap-1"><Car className="w-3 h-3" /> {vehicleMap[job.vehicleId]?.desc || 'Desconocido'}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(job.entryDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 self-end md:self-auto">
                    <div className="text-right">
                      <span className="block text-2xl font-black text-slate-700 group-hover:text-slate-500 transition-colors">{job.total.toLocaleString()}€</span>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); toggleArchiveJob(job); }} className="p-3 bg-blue-600/10 hover:bg-blue-600 text-blue-500 hover:text-white rounded-xl transition-all font-bold text-xs flex items-center gap-2">
                      <ToggleLeft className="w-4 h-4" /> RECTAURAR
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

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

      {/* Modales */}
      <AnimatePresence>
        {editingJob && !showBudgetPreview && (
          <JobDetailModal
            job={editingJob}
            vehicles={vehicles}
            mechanics={mechanics}
            clients={clients}
            initialExpenses={expenses.filter(e => e.jobId === editingJob.id)}
            onClose={() => setEditingJob(null)}
            onSave={handleSaveJob}
            onDelete={requestDeleteJob}
            onArchiveToggle={toggleArchiveJob}
            onShowBudget={handleShowBudgetPreview}
          />
        )}

        {/* Budget Preview Modal */}
        {
          showBudgetPreview && editingJob && (
            <div className="fixed inset-0 z-[220] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white text-slate-900 w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col h-[85vh] md:h-auto md:max-h-[90vh] mb-20 md:mb-0"
              >
                <div className="p-6 bg-slate-50 border-b border-slate-200 flex justify-between items-center sticky top-0 z-10">
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Presupuesto Estimado</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Vista Previa Cliente</p>
                  </div>
                  <button onClick={() => setShowBudgetPreview(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X className="w-6 h-6 text-slate-500" /></button>
                </div>

                <div id="budget-preview-content" className="flex-1 overflow-y-auto p-8 font-mono">
                  {/* Header Presupuesto */}
                  <div className="flex justify-between items-start mb-8 border-b-2 border-slate-900 pb-6">
                    <div>
                      <h1 className="text-xl font-bold uppercase mb-1">{settings?.name || 'TALLER MECÁNICO'}</h1>
                      <div className="text-xs text-slate-500 space-y-0.5">
                        <p>{settings?.address || 'Dirección no configurada'}</p>
                        <p>{settings?.phone} | {settings?.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="block text-4xl font-black text-slate-200">PRE</span>
                      <span className="text-xs font-bold text-slate-400">FECHA: {new Date().toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Datos Cliente y Vehículo */}
                  <div className="grid grid-cols-2 gap-8 mb-8 bg-slate-50 p-6 rounded-xl border border-slate-100">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">CLIENTE</label>
                      <p className="font-bold text-sm uppercase">{clients.find(c => c.id === editingJob.clientId)?.name || 'Cliente Desconocido'}</p>
                      <p className="text-xs text-slate-500">{clients.find(c => c.id === editingJob.clientId)?.phone}</p>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">VEHÍCULO</label>
                      {(() => {
                        const v = vehicles.find(v => v.id === editingJob.vehicleId);
                        return v ? (
                          <>
                            <p className="font-bold text-sm uppercase">{v.make} {v.model}</p>
                            <p className="text-xs text-slate-500 bg-slate-200 inline-block px-1 rounded">{v.plate}</p>
                          </>
                        ) : <p className="text-xs text-red-500">No asignado</p>
                      })()}
                    </div>
                  </div>

                  {/* Tabla de Conceptos */}
                  <div className="mb-8">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-900 text-left">
                          <th className="py-2 w-full font-black uppercase text-xs">Concepto / Descripción</th>
                          <th className="py-2 px-4 text-center font-black uppercase text-xs">Cant.</th>
                          <th className="py-2 text-right font-black uppercase text-xs">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {/* Mano de Obra */}
                        {(editingJob.laborHours || 0) > 0 && (
                          <tr>
                            <td className="py-3">
                              <p className="font-bold">Mano de Obra Especializada</p>
                              <p className="text-xs text-slate-500">Servicio técnico y reparaciones</p>
                            </td>
                            <td className="py-3 text-center">{editingJob.laborHours}h</td>
                            <td className="py-3 text-right font-bold">{((editingJob.laborHours || 0) * (editingJob.laborPricePerHour || 0)).toFixed(2)}€</td>
                          </tr>
                        )}

                        {/* Materiales */}
                        {editingJob.items?.map((item, idx) => (
                          <tr key={idx}>
                            <td className="py-3">
                              <p className="font-bold">{item.description}</p>
                            </td>
                            <td className="py-3 text-center">x{item.quantity}</td>
                            <td className="py-3 text-right font-bold">{(item.quantity * item.unitPrice).toFixed(2)}€</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Totales */}
                  <div className="flex flex-col items-end pt-6 border-t-2 border-slate-900 space-y-2">
                    <div className="flex justify-between w-48 text-sm">
                      <span className="text-slate-500 font-medium">Subtotal</span>
                      <span className="font-bold">{editingJob.total?.toFixed(2)}€</span>
                    </div>
                    <div className="flex justify-between w-48 text-sm items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 font-medium">IVA (21%)</span>
                        <button
                          onClick={() => setApplyVat(!applyVat)}
                          className={`w-8 h-4 rounded-full flex items-center px-0.5 transition-colors ${applyVat ? 'bg-blue-600 justify-end' : 'bg-slate-300 justify-start'}`}
                        >
                          <div className="w-3 h-3 bg-white rounded-full shadow-sm" />
                        </button>
                      </div>
                      <span className={`font-bold ${applyVat ? 'text-slate-900' : 'text-slate-300'}`}>
                        {applyVat ? ((editingJob.total || 0) * 0.21).toFixed(2) : '0.00'}€
                      </span>
                    </div>
                    <div className="flex justify-between w-48 text-xl border-t border-slate-200 pt-2 mt-2">
                      <span className="font-black">TOTAL</span>
                      <span className="font-black text-blue-600">
                        {applyVat ? ((editingJob.total || 0) * 1.21).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : editingJob.total?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€
                      </span>
                    </div>
                  </div>

                  {/* Warning Note */}
                  <div className="mt-12 bg-amber-50 rounded-xl p-4 border border-amber-100 flex gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                    <p className="text-xs text-amber-800 leading-relaxed">
                      Este documento es una estimación presupuestaria y tiene una validez de 15 días. No representa una factura final válida. Los costes pueden variar ante imprevistos mecánicos.
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-white border-t border-slate-200 flex justify-end">
                  <button onClick={printBudget} className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors">
                    <Printer className="w-5 h-5" /> Imprimir / PDF
                  </button>
                </div>
              </motion.div>
            </div>
          )
        }

        {/* Delete Confirmation Modal */}
        {
          confirmDeleteId && (
            <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
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
                  <h3 className="text-lg font-black text-white mb-2">¿Eliminar Trabajo?</h3>
                  <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                    Esta acción es irreversible y eliminará todos los registros asociados.
                  </p>
                  <div className="flex w-full gap-3">
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="flex-1 py-3 bg-slate-800 text-slate-300 rounded-xl font-bold hover:bg-slate-700 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={confirmDeleteJob}
                      className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-500 shadow-lg shadow-red-900/20 active:scale-95 transition-all"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )
        }
      </AnimatePresence >
    </div >
  );
};
