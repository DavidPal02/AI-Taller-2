import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Car, X, FileText, Printer, DollarSign, Wallet, Edit3, Trash2, User, FileDown, ToggleLeft, ToggleRight, Clock, Users } from 'lucide-react';
import { dbService } from '../services/dbService';
import { Job, JobStatus, Vehicle, Client, JobItem, Expense, Mechanic, WorkshopSettings } from '../types';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType } from 'docx';
import saveAs from 'file-saver';

interface JobBoardProps {
  onNotify: (msg: string) => void;
}

// Extend window interface for html2pdf
declare global {
  interface Window {
    html2pdf: any;
  }
}

// Editable Field Component for Invoice
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
  
  // Modals
  const [editingJob, setEditingJob] = useState<Partial<Job> | null>(null);
  
  // Invoice State
  const [showInvoice, setShowInvoice] = useState<Job | null>(null);
  const [includeTax, setIncludeTax] = useState(true);
  // State for editable invoice data
  const [invoiceData, setInvoiceData] = useState<{
    clientName: string;
    clientAddress: string;
    clientPhone: string;
    invoiceNumber: string;
    date: string;
  } | null>(null);

  // Edit Job State
  const [jobForm, setJobForm] = useState<Partial<Job>>({});
  const [newItem, setNewItem] = useState({ description: '', quantity: 1, unitPrice: 0 });
  
  // Job Expenses State
  const [jobExpenses, setJobExpenses] = useState<Expense[]>([]);
  const [newExpense, setNewExpense] = useState({ description: '', amount: 0 });

  useEffect(() => {
    loadData();
  }, []);

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
    onNotify(`Estado actualizado a: ${newStatus}`);
  };

  const handleNewJob = () => {
    const newJob: Partial<Job> = {
      id: undefined, 
      description: '',
      status: JobStatus.PENDING,
      total: 0,
      items: [],
      laborHours: 0,
      laborPricePerHour: 40,
      entryDate: new Date().toISOString(),
      mileage: 0,
      isPaid: false
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
          clientName: client?.name || '',
          clientAddress: client?.address || '',
          clientPhone: client?.phone || '',
          invoiceNumber: job.id.toUpperCase(),
          date: new Date().toLocaleDateString()
      });
      setShowInvoice(job);
  };

  const handleAddItem = () => {
    if (!newItem.description) return;
    const item: JobItem = {
      id: Math.random().toString(36).substr(2, 9),
      description: newItem.description,
      quantity: newItem.quantity,
      unitPrice: newItem.unitPrice
    };
    const currentItems = jobForm.items || [];
    const updatedItems = [...currentItems, item];
    recalculateTotal(updatedItems, jobForm.laborHours || 0, jobForm.laborPricePerHour || 0);
    setNewItem({ description: '', quantity: 1, unitPrice: 0 });
  };

  const removeItem = (itemId: string) => {
    const updatedItems = (jobForm.items || []).filter(i => i.id !== itemId);
    recalculateTotal(updatedItems, jobForm.laborHours || 0, jobForm.laborPricePerHour || 0);
  };

  const recalculateTotal = (items: JobItem[], laborHours: number, laborRate: number) => {
      const itemsTotal = items.reduce((acc, curr) => acc + (curr.quantity * curr.unitPrice), 0);
      const laborTotal = laborHours * laborRate;
      setJobForm(prev => ({ ...prev, items, laborHours, laborPricePerHour: laborRate, total: itemsTotal + laborTotal }));
  };

  const handleAddJobExpense = () => {
    if(!newExpense.description || newExpense.amount <= 0) return;
    const exp: Expense = {
      id: Math.random().toString(36).substr(2, 9),
      jobId: editingJob?.id,
      description: newExpense.description,
      amount: newExpense.amount,
      date: new Date().toISOString(),
      category: 'Piezas'
    };
    setJobExpenses([...jobExpenses, exp]);
    setNewExpense({ description: '', amount: 0 });
  };

  const handleVehicleChange = (vehicleId: string) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (vehicle) {
      setJobForm({
        ...jobForm, 
        vehicleId: vehicle.id, 
        clientId: vehicle.clientId,
        mileage: vehicle.currentMileage || 0
      });
    }
  };

  const saveJobChanges = async () => {
    if (!jobForm.description || !jobForm.vehicleId) {
        onNotify("Debes seleccionar un vehículo y descripción");
        return;
    }
    
    const jobId = jobForm.id || Math.random().toString(36).substr(2, 9);
    const updatedJob = { ...jobForm, id: jobId } as Job;
    await dbService.saveJob(updatedJob);
    
    for (const exp of jobExpenses) {
       const linkedExp = { ...exp, jobId: jobId };
       const exists = expenses.find(e => e.id === exp.id);
       if (!exists) {
         await dbService.addExpense(linkedExp);
       }
    }

    onNotify(jobForm.id ? "Trabajo actualizado" : "Nuevo trabajo creado");
    setEditingJob(null);
    loadData();
  };

  const getVehicleInfo = (id: string) => {
    const v = vehicles.find(v => v.id === id);
    return v ? `${v.make} ${v.model} (${v.plate})` : 'Desconocido';
  };
  const getVehicle = (id: string) => vehicles.find(v => v.id === id);

  const handleDownloadDocx = async () => {
    if (!showInvoice || !invoiceData || !settings) return;
    
    const vehicle = getVehicle(showInvoice.vehicleId);
    const subtotal = showInvoice.total;
    const taxAmount = includeTax ? subtotal * 0.21 : 0;
    const finalTotal = subtotal + taxAmount;

    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            text: settings.name,
            heading: "Heading1",
            alignment: AlignmentType.LEFT,
          }),
          new Paragraph({ text: settings.address }),
          new Paragraph({ text: `Tel: ${settings.phone} | ${settings.email}` }),
          new Paragraph({ text: "" }),
          new Paragraph({
             children: [
               new TextRun({ text: "PRESUPUESTO", bold: true, size: 28 }),
             ],
             alignment: AlignmentType.RIGHT,
          }),
          new Paragraph({
             children: [new TextRun({ text: `#${invoiceData.invoiceNumber}`, font: "Courier New" })],
             alignment: AlignmentType.RIGHT,
          }),
          new Paragraph({
             text: `Fecha: ${invoiceData.date}`,
             alignment: AlignmentType.RIGHT,
          }),
          new Paragraph({ text: "" }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
               top: { style: BorderStyle.NONE },
               bottom: { style: BorderStyle.NONE },
               left: { style: BorderStyle.NONE },
               right: { style: BorderStyle.NONE },
               insideVertical: { style: BorderStyle.NONE },
               insideHorizontal: { style: BorderStyle.NONE },
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({ children: [new TextRun({ text: "Facturar a:", bold: true })] }),
                      new Paragraph({ text: invoiceData.clientName }),
                      new Paragraph({ text: invoiceData.clientAddress }),
                      new Paragraph({ text: invoiceData.clientPhone }),
                    ],
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({ children: [new TextRun({ text: "Vehículo:", bold: true })] }),
                      new Paragraph({ text: `${vehicle?.make} ${vehicle?.model}` }),
                      new Paragraph({ text: `Matrícula: ${vehicle?.plate}` }),
                      new Paragraph({ text: `Motor: ${vehicle?.engine || 'N/A'}` }),
                      new Paragraph({ text: `Km: ${showInvoice.mileage || 'N/A'}` }),
                    ],
                  }),
                ],
              }),
            ],
          }),
          new Paragraph({ text: "" }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Descripción", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Cant/Hrs", bold: true })], alignment: AlignmentType.CENTER })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Precio Unit.", bold: true })], alignment: AlignmentType.RIGHT })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Total", bold: true })], alignment: AlignmentType.RIGHT })] }),
                ],
              }),
              ...(showInvoice.laborHours > 0 ? [new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph("Mano de Obra")] }),
                    new TableCell({ children: [new Paragraph({ text: showInvoice.laborHours.toString(), alignment: AlignmentType.CENTER })] }),
                    new TableCell({ children: [new Paragraph({ text: `${showInvoice.laborPricePerHour.toFixed(2)} €`, alignment: AlignmentType.RIGHT })] }),
                    new TableCell({ children: [new Paragraph({ text: `${(showInvoice.laborHours * showInvoice.laborPricePerHour).toFixed(2)} €`, alignment: AlignmentType.RIGHT })] }),
                  ]
              })] : []),
              ...showInvoice.items.map(item => 
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph(item.description)] }),
                    new TableCell({ children: [new Paragraph({ text: item.quantity.toString(), alignment: AlignmentType.CENTER })] }),
                    new TableCell({ children: [new Paragraph({ text: `${item.unitPrice.toFixed(2)} €`, alignment: AlignmentType.RIGHT })] }),
                    new TableCell({ children: [new Paragraph({ text: `${(item.quantity * item.unitPrice).toFixed(2)} €`, alignment: AlignmentType.RIGHT })] }),
                  ],
                })
              ),
            ],
          }),
          new Paragraph({ text: "" }),
          new Paragraph({
             text: `Subtotal: ${subtotal.toFixed(2)} €`,
             alignment: AlignmentType.RIGHT,
          }),
          new Paragraph({
             text: `IVA (21%): ${taxAmount.toFixed(2)} €`,
             alignment: AlignmentType.RIGHT,
          }),
          new Paragraph({
             children: [new TextRun({ text: `TOTAL: ${finalTotal.toFixed(2)} €`, bold: true, size: 28 })],
             alignment: AlignmentType.RIGHT,
          }),
        ],
      }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `Presupuesto_${invoiceData.invoiceNumber}.docx`);
  };

  const handleDownloadPdf = () => {
    if (window.html2pdf) {
      const element = document.getElementById('invoice-content');
      const opt = {
        margin: [5, 5],
        filename: `Presupuesto_${invoiceData?.invoiceNumber || 'draft'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      window.html2pdf().set(opt).from(element).save();
    } else {
      window.print();
    }
  };

  const columns = Object.values(JobStatus);

  return (
    <div className="p-4 md:p-8 h-full overflow-hidden flex flex-col pb-24 md:pb-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-white">Trabajos</h2>
          <p className="text-slate-400 mt-1 text-sm md:text-base">Control de flujo.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button onClick={handleNewJob} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-900/20 text-sm md:text-base">
            <Plus className="w-5 h-5" /> <span>Nuevo</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-4 md:gap-6 h-full min-w-full md:min-w-[1000px] pb-4 px-1 snap-x snap-mandatory">
          {columns.map((status) => (
            <div key={status} className="flex-1 min-w-[85vw] md:min-w-[300px] flex flex-col bg-slate-800/30 border border-slate-700/50 rounded-2xl p-3 md:p-4 snap-center">
              <div className="flex items-center justify-between mb-4 px-2">
                <h3 className="font-bold text-slate-200">{status}</h3>
                <span className="text-xs bg-slate-700 px-2 py-1 rounded-full text-slate-300">
                  {jobs.filter(j => j.status === status).length}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar">
                {jobs.filter(j => j.status === status).map((job) => (
                  <motion.div
                    key={job.id}
                    layoutId={job.id}
                    className="bg-slate-700/50 hover:bg-slate-700 border border-slate-600 p-4 rounded-xl cursor-pointer group shadow-sm hover:shadow-md transition-all relative overflow-hidden"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-mono text-blue-400">{job.id.toUpperCase()}</span>
                      <span className="text-xs text-slate-400">{new Date(job.entryDate).toLocaleDateString()}</span>
                    </div>
                    <h4 className="font-bold text-white mb-1 truncate">{job.description}</h4>
                    <div className="flex items-center gap-2 text-sm text-slate-300 mb-3">
                      <Car className="w-3 h-3" /> <span className="truncate">{getVehicleInfo(job.vehicleId)}</span>
                    </div>
                    <div className="mb-3">
                        <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded flex items-center gap-1 w-fit">
                            <Users className="w-3 h-3" /> {mechanics.find(m => m.id === job.mechanicId)?.name || 'Sin Asignar'}
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-4">
                       <button onClick={(e) => { e.stopPropagation(); openEditModal(job); }} className="flex items-center justify-center gap-1 bg-slate-600 hover:bg-slate-500 py-1.5 rounded text-xs text-white">
                          <Edit3 className="w-3 h-3" /> Editar
                       </button>
                       <button onClick={(e) => { e.stopPropagation(); openInvoice(job); }} className="flex items-center justify-center gap-1 bg-slate-600 hover:bg-slate-500 py-1.5 rounded text-xs text-white">
                          <FileText className="w-3 h-3" /> Presupuesto
                       </button>
                    </div>

                    <div className="flex gap-2 pt-3 mt-3 border-t border-slate-600/50">
                      {status !== JobStatus.PENDING && (
                         <button onClick={(e) => { e.stopPropagation(); updateJobStatus(job, columns[columns.indexOf(status) - 1]); }} className="p-1 hover:bg-slate-600 rounded text-slate-300">{'<'}</button>
                      )}
                      <div className="flex-1 text-center text-xs text-slate-500 pt-1 font-mono">{job.total} €</div>
                      {status !== JobStatus.DELIVERED && (
                        <button onClick={(e) => { e.stopPropagation(); updateJobStatus(job, columns[columns.indexOf(status) + 1]); }} className="p-1 hover:bg-slate-600 rounded text-green-400">{'>'}</button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {editingJob && (
          <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/70 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="bg-slate-900 border-t md:border border-slate-700 w-full max-w-4xl rounded-t-2xl md:rounded-2xl shadow-2xl flex flex-col h-[90vh] md:max-h-[90vh]"
            >
              <div className="p-4 md:p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900 sticky top-0 z-10 rounded-t-2xl">
                <h3 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-blue-400" />
                  {jobForm.id ? `#${jobForm.id.slice(0,6).toUpperCase()}` : 'Nuevo Trabajo'}
                </h3>
                <button onClick={() => setEditingJob(null)} className="text-slate-400 hover:text-white bg-slate-800 p-2 rounded-full"><X className="w-5 h-5" /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 pb-32 md:pb-6">
                 <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="col-span-1 md:col-span-2">
                            <label className="block text-sm text-slate-400 mb-1">Vehículo</label>
                            <select className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white" value={jobForm.vehicleId || ''} onChange={(e) => handleVehicleChange(e.target.value)}>
                                <option value="">Seleccionar Vehículo...</option>
                                {vehicles.map(v => (<option key={v.id} value={v.id}>{v.plate} - {v.make} {v.model}</option>))}
                            </select>
                        </div>
                        <div className="col-span-1">
                            <label className="block text-sm text-slate-400 mb-1">Mecánico</label>
                            <select className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white" value={jobForm.mechanicId || ''} onChange={(e) => setJobForm({...jobForm, mechanicId: e.target.value})}>
                                <option value="">Sin Asignar</option>
                                {mechanics.map(m => (<option key={m.id} value={m.id}>{m.name}</option>))}
                            </select>
                        </div>
                        <div className="col-span-1">
                            <label className="block text-sm text-slate-400 mb-1">Km</label>
                            <input 
                              type="number"
                              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white" 
                              value={jobForm.mileage} 
                              onChange={(e) => setJobForm({...jobForm, mileage: Number(e.target.value)})} 
                            />
                        </div>
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">Descripción</label>
                      <input className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white" value={jobForm.description} onChange={(e) => setJobForm({...jobForm, description: e.target.value})} />
                    </div>
                    
                    <div className="bg-blue-900/10 border border-blue-500/20 p-4 rounded-xl">
                        <h4 className="font-bold text-blue-400 mb-3 flex items-center gap-2"><Clock className="w-4 h-4" /> Mano de Obra</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">Horas</label>
                                <input type="number" className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" 
                                    value={jobForm.laborHours} 
                                    onChange={(e) => recalculateTotal(jobForm.items || [], Number(e.target.value), jobForm.laborPricePerHour || 0)} 
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">€ / Hora</label>
                                <input type="number" className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" 
                                    value={jobForm.laborPricePerHour} 
                                    onChange={(e) => recalculateTotal(jobForm.items || [], jobForm.laborHours || 0, Number(e.target.value))} 
                                />
                            </div>
                        </div>
                        <div className="mt-2 text-right text-sm text-blue-300 font-bold">
                            Subtotal: {((jobForm.laborHours || 0) * (jobForm.laborPricePerHour || 0)).toFixed(2)} €
                        </div>
                    </div>

                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                      <h4 className="font-bold text-white mb-3 flex items-center gap-2"><DollarSign className="w-4 h-4 text-green-400" /> Repuestos / Items</h4>
                      <div className="space-y-2 mb-4">
                        {jobForm.items?.map((item) => (
                           <div key={item.id} className="flex items-center justify-between bg-slate-900/50 p-2 rounded border border-slate-700/50">
                              <span className="text-sm text-slate-200">{item.description} (x{item.quantity})</span>
                              <div className="flex items-center gap-3">
                                <span className="text-green-400 font-mono text-sm">{item.quantity * item.unitPrice} €</span>
                                <button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-300"><Trash2 className="w-3 h-3" /></button>
                              </div>
                           </div>
                        ))}
                      </div>
                      <div className="grid grid-cols-6 gap-2 items-end">
                         <input placeholder="Item" className="col-span-3 bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white" value={newItem.description} onChange={e => setNewItem({...newItem, description: e.target.value})} />
                         <input type="number" placeholder="#" className="col-span-1 bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white" value={newItem.quantity} onChange={e => setNewItem({...newItem, quantity: Number(e.target.value)})} />
                         <input type="number" placeholder="€" className="col-span-1 bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white" value={newItem.unitPrice} onChange={e => setNewItem({...newItem, unitPrice: Number(e.target.value)})} />
                         <button onClick={handleAddItem} className="col-span-1 bg-blue-600 hover:bg-blue-500 text-white p-2 rounded flex justify-center"><Plus className="w-4 h-4" /></button>
                      </div>
                    </div>
                 </div>

                 <div className="space-y-6">
                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                       <h4 className="font-bold text-white mb-3 flex items-center gap-2"><Wallet className="w-4 h-4 text-red-400" /> Gastos (Piezas)</h4>
                       <div className="space-y-2 mb-4">
                         {jobExpenses.map((exp, idx) => (
                           <div key={idx} className="flex items-center justify-between bg-slate-900/50 p-2 rounded border border-slate-700/50">
                              <span className="text-sm text-slate-200">{exp.description}</span>
                              <span className="text-red-400 font-mono text-sm">-{exp.amount} €</span>
                           </div>
                         ))}
                       </div>
                       <div className="grid grid-cols-6 gap-2 items-end">
                         <input placeholder="Gasto" className="col-span-4 bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white" value={newExpense.description} onChange={e => setNewExpense({...newExpense, description: e.target.value})} />
                         <input type="number" className="col-span-1 bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white" value={newExpense.amount} onChange={e => setNewExpense({...newExpense, amount: Number(e.target.value)})} />
                         <button onClick={handleAddJobExpense} className="col-span-1 bg-red-600 hover:bg-red-500 text-white p-2 rounded flex justify-center"><Plus className="w-4 h-4" /></button>
                       </div>
                    </div>
                    
                    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                       <div className="flex justify-between items-center mb-4">
                          <span className="text-slate-400">Total:</span>
                          <span className="text-2xl font-bold text-white">{jobForm.total?.toFixed(2)} €</span>
                       </div>
                       <div className="flex justify-between items-center mb-6">
                          <span className="text-slate-300 font-medium">Beneficio:</span>
                          <span className="text-xl font-bold text-emerald-400">{((jobForm.total || 0) - jobExpenses.reduce((a, b) => a + b.amount, 0)).toFixed(2)} €</span>
                       </div>
                       <div className="flex items-center gap-3">
                          <button onClick={() => setJobForm({...jobForm, isPaid: !jobForm.isPaid})} className={`flex-1 py-3 px-4 rounded-lg font-bold transition-all ${jobForm.isPaid ? 'bg-green-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
                             {jobForm.isPaid ? 'PAGADO' : 'PENDIENTE'}
                          </button>
                       </div>
                    </div>
                 </div>
              </div>
              <div className="p-4 md:p-6 border-t border-slate-800 flex justify-end gap-3 bg-slate-900 fixed bottom-0 w-full md:relative md:w-auto">
                 <button onClick={() => setEditingJob(null)} className="px-4 py-2 text-slate-300 hover:text-white">Cancelar</button>
                 <button onClick={saveJobChanges} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg">Guardar</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
         {showInvoice && invoiceData && settings && (
           <div className="fixed inset-0 z-[70] bg-slate-900/90 flex justify-center overflow-y-auto p-0 md:p-8">
              <div 
                id="invoice-content"
                className="w-full md:max-w-[210mm] bg-white min-h-[100vh] md:min-h-[297mm] text-slate-900 p-4 md:p-12 shadow-2xl relative group print:p-0 print:shadow-none print:w-full overflow-x-hidden"
              >
                  <div className="md:absolute top-4 right-4 print:hidden flex flex-wrap gap-2 mb-6 justify-end" data-html2canvas-ignore="true">
                     <button onClick={() => setIncludeTax(!includeTax)} className={`px-3 py-2 rounded-lg flex items-center gap-2 border ${includeTax ? 'bg-green-100 text-green-700 border-green-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                        {includeTax ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />} <span className="text-sm font-medium">IVA</span>
                     </button>
                     <button onClick={handleDownloadDocx} className="bg-slate-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-600"><FileDown className="w-4 h-4" /> Word</button>
                     <button 
                        onClick={handleDownloadPdf} 
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
                        title="Descargar como archivo PDF"
                     >
                         <Printer className="w-4 h-4" /> 
                         <span>PDF</span>
                     </button>
                     <button onClick={() => setShowInvoice(null)} className="bg-slate-200 text-slate-800 px-4 py-2 rounded-lg hover:bg-slate-300">Cerrar</button>
                  </div>
                  
                  <div className="flex flex-col md:flex-row justify-between items-start mb-8 md:mb-12 border-b-2 border-slate-100 pb-8 gap-4">
                     <div>
                        <h1 className="text-2xl md:text-4xl font-bold text-slate-800 mb-2">{settings.name}</h1>
                        <p className="text-slate-500 text-sm md:text-base">{settings.address}</p>
                        <p className="text-slate-500 text-sm md:text-base">Tel: {settings.phone} | {settings.email}</p>
                     </div>
                     <div className="text-left md:text-right w-full md:w-1/3">
                        <h2 className="text-xl md:text-2xl font-bold text-slate-400 uppercase tracking-widest mb-1">Presupuesto</h2>
                        <div className="flex items-center justify-start md:justify-end gap-1 font-mono text-xl text-slate-800">
                            #<EditableField value={invoiceData.invoiceNumber} onChange={(v) => setInvoiceData({...invoiceData, invoiceNumber: v})} className="text-left md:text-right w-24" />
                        </div>
                        <div className="flex items-center justify-start md:justify-end gap-1 text-sm text-slate-500 mt-2">
                            Fecha: <EditableField value={invoiceData.date} onChange={(v) => setInvoiceData({...invoiceData, date: v})} className="text-left md:text-right w-24" />
                        </div>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 mb-8 md:mb-12">
                     <div>
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Facturar a</h3>
                        <div className="text-slate-800 space-y-1">
                           <EditableField value={invoiceData.clientName} onChange={(v) => setInvoiceData({...invoiceData, clientName: v})} className="font-bold text-lg" placeholder="Nombre Cliente" />
                           <EditableField value={invoiceData.clientAddress} onChange={(v) => setInvoiceData({...invoiceData, clientAddress: v})} placeholder="Dirección" />
                           <EditableField value={invoiceData.clientPhone} onChange={(v) => setInvoiceData({...invoiceData, clientPhone: v})} placeholder="Teléfono" />
                        </div>
                     </div>
                     <div>
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Vehículo</h3>
                        <div className="text-slate-800">
                           <p className="font-bold text-lg">{getVehicle(showInvoice.vehicleId)?.make} {getVehicle(showInvoice.vehicleId)?.model}</p>
                           <p>Matrícula: {getVehicle(showInvoice.vehicleId)?.plate}</p>
                           <p>Motor: {getVehicle(showInvoice.vehicleId)?.engine || 'N/A'}</p>
                           <p>Km: {showInvoice.mileage || 'N/A'}</p>
                        </div>
                     </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full mb-12 min-w-[500px]">
                        <thead>
                            <tr className="border-b-2 border-slate-800 text-left">
                            <th className="py-3 font-bold text-slate-800">Descripción</th>
                            <th className="py-3 font-bold text-slate-800 text-center w-24">Cant.</th>
                            <th className="py-3 font-bold text-slate-800 text-right w-32">Precio Unit.</th>
                            <th className="py-3 font-bold text-slate-800 text-right w-32">Total</th>
                            </tr>
                        </thead>
                        <tbody className="text-slate-600">
                            {showInvoice.laborHours > 0 && (
                                <tr className="border-b border-slate-100 bg-slate-50">
                                    <td className="py-4 font-medium">Mano de Obra</td>
                                    <td className="py-4 text-center">{showInvoice.laborHours}h</td>
                                    <td className="py-4 text-right">{showInvoice.laborPricePerHour.toFixed(2)} €</td>
                                    <td className="py-4 text-right font-bold text-slate-800">{(showInvoice.laborHours * showInvoice.laborPricePerHour).toFixed(2)} €</td>
                                </tr>
                            )}
                            {showInvoice.items.map((item) => (
                            <tr key={item.id} className="border-b border-slate-100">
                                <td className="py-4">{item.description}</td>
                                <td className="py-4 text-center">{item.quantity}</td>
                                <td className="py-4 text-right">{item.unitPrice.toFixed(2)} €</td>
                                <td className="py-4 text-right font-bold text-slate-800">{(item.quantity * item.unitPrice).toFixed(2)} €</td>
                            </tr>
                            ))}
                        </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end mb-12">
                     <div className="w-64 space-y-3">
                        <div className="flex justify-between text-slate-500">
                           <span>Subtotal:</span>
                           <span>{showInvoice.total.toFixed(2)} €</span>
                        </div>
                        <div className={`flex justify-between transition-colors ${includeTax ? 'text-slate-600' : 'text-slate-300 line-through'}`}>
                           <span>IVA (21%):</span>
                           <span>{(showInvoice.total * 0.21).toFixed(2)} €</span>
                        </div>
                        <div className="flex justify-between text-xl font-bold text-slate-900 border-t-2 border-slate-900 pt-3">
                           <span>Total:</span>
                           <span>{(includeTax ? showInvoice.total * 1.21 : showInvoice.total).toFixed(2)} €</span>
                        </div>
                     </div>
                  </div>
              </div>
           </div>
         )}
      </AnimatePresence>
    </div>
  );
};