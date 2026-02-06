import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Users, Clock, Gauge, FileText, Wrench, Trash2, Wallet, TrendingUp, FileDown, Plus } from 'lucide-react';
import { Job, JobStatus, Vehicle, Client, Mechanic, JobItem, Expense } from '../types';

interface JobDetailModalProps {
    job: Partial<Job>;
    vehicles: Vehicle[];
    mechanics: Mechanic[];
    clients: Client[];
    initialExpenses: Expense[];
    onClose: () => void;
    onSave: (updatedJob: Job, newExpenses: Expense[]) => Promise<void>;
    onDelete: (id: string) => void;
    onArchiveToggle: (job: Job) => void;
    onShowBudget: (job: Partial<Job>) => void;
}

export const JobDetailModal: React.FC<JobDetailModalProps> = ({
    job,
    vehicles,
    mechanics,
    clients,
    initialExpenses,
    onClose,
    onSave,
    onDelete,
    onArchiveToggle,
    onShowBudget
}) => {
    const [jobForm, setJobForm] = useState<Partial<Job>>(JSON.parse(JSON.stringify(job)));
    const [jobExpenses, setJobExpenses] = useState<Expense[]>(initialExpenses);
    const [newItem, setNewItem] = useState<{ description: string, quantity: number | '', unitPrice: number | '' }>({ description: '', quantity: 1, unitPrice: '' });
    const [newExpense, setNewExpense] = useState<{ description: string, amount: number | '' }>({ description: '', amount: '' });

    const recalculateTotal = (items: JobItem[], laborHours: number, laborRate: number) => {
        const itemsTotal = items.reduce((acc, curr) => acc + (curr.quantity * curr.unitPrice), 0);
        setJobForm(prev => ({ ...prev, items, laborHours, laborPricePerHour: laborRate, total: itemsTotal + (laborHours * laborRate) }));
    };

    const handleAddItem = () => {
        if (!newItem.description) return;
        const item: JobItem = {
            id: crypto.randomUUID(),
            description: newItem.description,
            quantity: Number(newItem.quantity) || 1,
            unitPrice: Number(newItem.unitPrice) || 0
        };
        const updatedItems = [...(jobForm.items || []), item];
        recalculateTotal(updatedItems, jobForm.laborHours || 0, jobForm.laborPricePerHour || 0);
        setNewItem({ description: '', quantity: 1, unitPrice: '' });
    };

    const removeItem = (itemId: string) => {
        const updatedItems = (jobForm.items || []).filter(i => i.id !== itemId);
        recalculateTotal(updatedItems, jobForm.laborHours || 0, jobForm.laborPricePerHour || 0);
    };

    const handleAddJobExpense = () => {
        if (!newExpense.description || (newExpense.amount === '' && newExpense.amount !== 0)) return;
        const amount = Number(newExpense.amount) || 0;
        const exp: Expense = {
            description: newExpense.description,
            amount,
            id: crypto.randomUUID(),
            jobId: job.id,
            date: new Date().toISOString(),
            category: 'Piezas'
        } as Expense;
        setJobExpenses([...jobExpenses, exp]);
        setNewExpense({ description: '', amount: '' });
    };

    const handleVehicleChange = (vehicleId: string) => {
        const v = vehicles.find(v => v.id === vehicleId);
        setJobForm(prev => ({ ...prev, vehicleId, clientId: v?.clientId || '' }));
    };

    return (
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
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{jobForm.id ? `#${jobForm.id.slice(0, 8).toUpperCase()}` : 'NUEVO REGISTRO'}</span>
                    </div>
                    <button onClick={onClose} className="p-3 bg-slate-800 rounded-full text-white active:scale-90 transition-transform"><X className="w-6 h-6" /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 pb-40">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block">Vehículo del Cliente</label>
                                <select className="w-full bg-slate-800/50 border-2 border-slate-800 rounded-2xl p-4 text-white font-bold outline-none focus:border-blue-500" value={jobForm.vehicleId || ''} onChange={(e) => handleVehicleChange(e.target.value)}>
                                    <option value="">Elegir coche...</option>
                                    {vehicles.map(v => (<option key={v.id} value={v.id}>{v.plate} - {v.make} {v.model}</option>))}
                                </select>
                            </div>

                            {jobForm.id && (
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block flex items-center gap-2">
                                        <Users className="w-3 h-3" /> Mecánico Asignado
                                    </label>
                                    <select
                                        className="w-full bg-slate-800/50 border-2 border-slate-800 rounded-2xl p-4 text-white font-bold outline-none focus:border-blue-500"
                                        value={jobForm.mechanicId || ''}
                                        onChange={(e) => setJobForm({ ...jobForm, mechanicId: e.target.value })}
                                    >
                                        <option value="">Sin asignar...</option>
                                        {mechanics.map(m => (<option key={m.id} value={m.id}>{m.name} - {m.specialty}</option>))}
                                    </select>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block flex items-center gap-2">
                                        <Clock className="w-3 h-3" /> Fecha de Entrada
                                    </label>
                                    <input
                                        type="datetime-local"
                                        className="w-full bg-slate-800/50 border-2 border-slate-800 rounded-2xl p-4 text-white font-bold outline-none focus:border-blue-500"
                                        value={jobForm.entryDate ? new Date(jobForm.entryDate).toISOString().slice(0, 16) : ''}
                                        onChange={(e) => setJobForm({ ...jobForm, entryDate: new Date(e.target.value).toISOString() })}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block flex items-center gap-2">
                                        <Gauge className="w-3 h-3" /> Kilometraje
                                    </label>
                                    <input
                                        type="number"
                                        className="w-full bg-slate-800/50 border-2 border-slate-800 rounded-2xl p-4 text-white font-bold outline-none focus:border-blue-500"
                                        value={jobForm.mileage || ''}
                                        onChange={(e) => setJobForm({ ...jobForm, mileage: Number(e.target.value) })}
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block">Descripción del Problema</label>
                                <textarea
                                    className="w-full bg-slate-800/50 border-2 border-slate-800 rounded-2xl p-4 text-white font-bold outline-none focus:border-blue-500 min-h-[100px] resize-none"
                                    value={jobForm.description}
                                    onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                                    placeholder="Ej: Cambio de frenos traseros y revisión de niveles..."
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block flex items-center gap-2">
                                    <FileText className="w-3 h-3 text-amber-500" /> Notas Internas / Hallazgos
                                </label>
                                <textarea
                                    className="w-full bg-slate-800/50 border-2 border-slate-800 rounded-2xl p-4 text-slate-300 font-medium outline-none focus:border-amber-500 min-h-[120px] resize-none text-sm"
                                    value={jobForm.notes || ''}
                                    onChange={(e) => setJobForm({ ...jobForm, notes: e.target.value })}
                                    placeholder="Apunta aquí detalles técnicos, piezas a pedir o fallos encontrados durante la reparación..."
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block">Horas Estimadas</label>
                                    <input
                                        type="number"
                                        className="w-full bg-slate-800/50 border-2 border-slate-800 rounded-2xl p-4 text-white font-bold outline-none focus:border-blue-500 placeholder:text-slate-600"
                                        placeholder="0.00"
                                        value={jobForm.laborHours || ''}
                                        onChange={(e) => recalculateTotal(jobForm.items || [], e.target.value === '' ? 0 : Number(e.target.value), jobForm.laborPricePerHour || 0)}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block">€/Hora Taller</label>
                                    <input
                                        type="number"
                                        className="w-full bg-slate-800/50 border-2 border-slate-800 rounded-2xl p-4 text-white font-bold outline-none focus:border-blue-500 placeholder:text-slate-600"
                                        placeholder="40"
                                        value={jobForm.laborPricePerHour || ''}
                                        onChange={(e) => recalculateTotal(jobForm.items || [], jobForm.laborHours || 0, e.target.value === '' ? 0 : Number(e.target.value))}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-800/30 rounded-2xl p-4 border border-slate-800">
                            <label className="text-[10px] font-black text-slate-500 uppercase mb-3 flex items-center gap-2">
                                <Wrench className="w-3 h-3" /> Materiales y Repuestos (Cliente)
                            </label>
                            <div className="space-y-2 mb-3">
                                {jobForm.items?.map(item => (
                                    <div key={item.id} className="flex gap-3 items-center bg-slate-900 p-3 rounded-xl border border-slate-800">
                                        <div className="flex-1 text-sm text-white font-medium">{item.description}</div>
                                        <div className="text-xs text-slate-400 font-mono bg-slate-800 px-2 py-1 rounded">x{item.quantity}</div>
                                        <div className="min-w-[80px] text-sm text-blue-400 font-bold text-right font-mono">{item.unitPrice.toFixed(2)}€</div>
                                        <button onClick={() => removeItem(item.id)} className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded transition-colors"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                ))}
                                {(!jobForm.items || jobForm.items.length === 0) && <p className="text-xs text-slate-600 italic text-center py-2">No hay materiales añadidos</p>}
                            </div>
                            <div className="flex gap-2 items-start bg-slate-900/50 p-2 rounded-xl border border-dashed border-slate-700">
                                <input className="flex-1 bg-transparent border-b border-slate-700 py-2 text-sm text-white outline-none focus:border-blue-500 placeholder:text-slate-600" placeholder="Descripción pieza..." value={newItem.description} onChange={e => setNewItem({ ...newItem, description: e.target.value })} />
                                <input type="number" className="w-16 bg-transparent border-b border-slate-700 py-2 text-sm text-white outline-none focus:border-blue-500 text-center placeholder:text-slate-600" placeholder="Unds." value={newItem.quantity} onChange={e => setNewItem({ ...newItem, quantity: e.target.value === '' ? '' : Number(e.target.value) })} />
                                <input type="number" className="w-20 bg-transparent border-b border-slate-700 py-2 text-sm text-white outline-none focus:border-blue-500 text-right placeholder:text-slate-600" placeholder="Precio €" value={newItem.unitPrice} onChange={e => setNewItem({ ...newItem, unitPrice: e.target.value === '' ? '' : Number(e.target.value) })} />
                                <button onClick={handleAddItem} className="mt-1 bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-lg shadow-lg shadow-blue-900/20 active:scale-95 transition-all"><Plus className="w-4 h-4" /></button>
                            </div>
                        </div>

                        <div className="bg-red-900/5 rounded-2xl p-4 border border-red-900/10">
                            <label className="text-[10px] font-black text-red-400/70 uppercase mb-3 flex items-center gap-2">
                                <Wallet className="w-3 h-3" /> Gastos Internos (Costo Real)
                            </label>
                            <div className="space-y-2 mb-3">
                                {jobExpenses.map(exp => (
                                    <div key={exp.id} className="flex gap-3 items-center bg-slate-900/50 p-3 rounded-xl border border-red-900/10">
                                        <div className="flex-1 text-sm text-slate-300 font-medium">{exp.description}</div>
                                        <div className="min-w-[80px] text-sm text-red-400 font-bold text-right font-mono">-{exp.amount.toFixed(2)}€</div>
                                    </div>
                                ))}
                                {jobExpenses.length === 0 && <p className="text-xs text-slate-600 italic text-center py-2">Sin gastos internos registrados</p>}
                            </div>
                            <div className="flex gap-2 items-start bg-slate-900/50 p-2 rounded-xl border border-dashed border-red-900/20">
                                <input className="flex-1 bg-transparent border-b border-slate-700 py-2 text-sm text-white outline-none focus:border-red-500 placeholder:text-slate-600" placeholder="Gasto interno (ej: envío, proveedor...)" value={newExpense.description} onChange={e => setNewExpense({ ...newExpense, description: e.target.value })} />
                                <input type="number" className="w-24 bg-transparent border-b border-slate-700 py-2 text-sm text-white outline-none focus:border-red-500 text-right placeholder:text-slate-600" placeholder="Coste €" value={newExpense.amount} onChange={e => setNewExpense({ ...newExpense, amount: e.target.value === '' ? '' : Number(e.target.value) })} />
                                <button onClick={handleAddJobExpense} className="mt-1 bg-slate-700 hover:bg-slate-600 text-white p-2 rounded-lg active:scale-95 transition-all"><Plus className="w-4 h-4" /></button>
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
                                <span className="text-white">{(jobForm.items?.reduce((a, b) => a + (b.quantity * b.unitPrice), 0) || 0).toFixed(2)} €</span>
                            </div>
                            <div className="h-px bg-slate-800 my-4" />
                            <div className="flex justify-between items-center">
                                <span className="text-lg font-black text-white italic">TOTAL</span>
                                <span className="text-2xl font-black text-blue-500">{jobForm.total?.toLocaleString()} €</span>
                            </div>

                            <div className="mt-4 pt-4 border-t border-slate-800/50">
                                <div className="flex justify-between items-center bg-emerald-900/10 p-3 rounded-xl border border-emerald-500/10">
                                    <span className="text-xs font-black text-emerald-500 uppercase flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4" /> Beneficio Neto Estimado
                                    </span>
                                    <span className="text-lg font-black text-emerald-400">
                                        {((jobForm.total || 0) - jobExpenses.reduce((sum, e) => sum + e.amount, 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                                    </span>
                                </div>
                                <p className="text-[10px] text-slate-600 mt-1 text-right">
                                    *Total - Gastos Internos
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <button onClick={() => onShowBudget(jobForm)} className="py-4 bg-slate-800 text-blue-400 border border-slate-700 hover:bg-slate-700 rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all">
                            <FileText className="w-5 h-5" /> PREVISUALIZAR
                        </button>
                        {jobForm.status === JobStatus.DELIVERED && (
                            <button onClick={() => onArchiveToggle(jobForm as Job)} className={`py-4 border text-slate-300 rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all ${jobForm.isArchived ? 'bg-blue-600/20 border-blue-500/50 hover:bg-blue-600 hover:border-transparent text-blue-100' : 'bg-slate-800 border-slate-700 hover:bg-slate-700'}`}>
                                <FileDown className="w-5 h-5" /> {jobForm.isArchived ? 'RECUPERAR' : 'ARCHIVAR'}
                            </button>
                        )}
                        <button onClick={() => onSave(jobForm as Job, jobExpenses)} className="py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black tracking-tight shadow-lg shadow-blue-900/40 active:scale-95 transition-all">
                            GUARDAR
                        </button>
                    </div>
                    {jobForm.id && (
                        <button onClick={() => onDelete(jobForm.id!)} className="w-full py-4 bg-red-600/10 border-2 border-red-500/20 text-red-500 rounded-3xl font-black text-sm tracking-widest active:scale-95 transition-all uppercase">
                            Eliminar Trabajo
                        </button>
                    )}
                </div>
            </motion.div>
        </div>
    );
};
