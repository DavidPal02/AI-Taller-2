
import React, { useEffect, useState } from 'react';
import { dbService } from '../services/dbService';
import { Expense, ExpenseCategory } from '../types';
import { Plus, Trash2, Wallet, Calendar, Tag, AlertCircle, ChevronLeft, ChevronRight, Download, FileText, Printer, X, PieChart, Settings, Euro } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import saveAs from 'file-saver';

export const Expenses: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [viewDate, setViewDate] = useState(new Date()); 
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [showReport, setShowReport] = useState(false);

  const [newExpense, setNewExpense] = useState<Partial<Expense>>({
    description: '',
    amount: 0,
    category: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [newCategory, setNewCategory] = useState<{ name: string, defaultAmount: string }>({ name: '', defaultAmount: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [expData, catData] = await Promise.all([
        dbService.getExpenses(),
        dbService.getExpenseCategories()
    ]);
    setExpenses(expData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setCategories(catData);
    
    if(catData.length > 0 && !newExpense.category) {
        setNewExpense(prev => ({ ...prev, category: catData[0].name }));
    }
  };

  const handleAddExpense = async () => {
    if (!newExpense.description || !newExpense.amount || !newExpense.category) return;
    
    const expense: Expense = {
      id: crypto.randomUUID(),
      description: newExpense.description,
      amount: Number(newExpense.amount),
      date: newExpense.date || new Date().toISOString(),
      category: newExpense.category,
    };

    await dbService.addExpense(expense);
    setExpenses(prev => [...prev, expense].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setIsModalOpen(false);
    setNewExpense({ 
        description: '', 
        amount: 0, 
        category: categories[0]?.name || '', 
        date: new Date().toISOString().split('T')[0] 
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este gasto de forma permanente?')) {
      await dbService.deleteExpense(id);
      setExpenses(expenses.filter(e => e.id !== id));
    }
  };

  const handleAddCategory = async () => {
      if (!newCategory.name) return;
      const cat: ExpenseCategory = {
          id: crypto.randomUUID(),
          name: newCategory.name,
          defaultAmount: newCategory.defaultAmount ? Number(newCategory.defaultAmount) : undefined
      };
      await dbService.addExpenseCategory(cat);
      setCategories([...categories, cat]);
      setNewCategory({ name: '', defaultAmount: '' });
  };

  const handleDeleteCategory = async (id: string) => {
      if(confirm('¿Eliminar esta categoría?')) {
          await dbService.deleteExpenseCategory(id);
          setCategories(categories.filter(c => c.id !== id));
      }
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const catName = e.target.value;
      const cat = categories.find(c => c.name === catName);
      setNewExpense({
          ...newExpense,
          category: catName,
          amount: cat?.defaultAmount || newExpense.amount 
      });
  };

  const prevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const filteredExpenses = expenses.filter(e => {
    const eDate = new Date(e.date);
    return eDate.getMonth() === viewDate.getMonth() && eDate.getFullYear() === viewDate.getFullYear();
  });

  const totalExpenses = filteredExpenses.reduce((acc, curr) => acc + curr.amount, 0);

  const categoryBreakdown = filteredExpenses.reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
      return acc;
  }, {} as Record<string, number>);

  const handleExport = () => {
    const monthName = viewDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    let csvContent = "\uFEFF";
    csvContent += "Fecha,Descripción,Categoría,Monto,ID Trabajo\n";
    filteredExpenses.forEach(e => {
      const row = [
        new Date(e.date).toLocaleDateString('es-ES'),
        `"${e.description.replace(/"/g, '""')}"`,
        e.category,
        e.amount.toFixed(2).replace('.', ','),
        e.jobId ? `#${e.jobId.toUpperCase()}` : 'General'
      ].join(",");
      csvContent += row + "\n";
    });
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    saveAs(blob, `Gastos_${monthName.replace(' ', '_')}.csv`);
  };

  return (
    <div className="p-8 h-full overflow-hidden flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-white">Control de Gastos</h2>
          <p className="text-slate-400 mt-1">Registro de compras, piezas y servicios externos.</p>
        </div>
        <div className="flex items-center gap-3">
           <button 
             onClick={() => setIsCategoryModalOpen(true)}
             className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors border border-slate-700"
           >
             <Settings className="w-5 h-5" />
           </button>
           <button 
             onClick={() => setIsModalOpen(true)}
             className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl transition-colors shadow-lg shadow-red-900/20"
            >
            <Plus className="w-5 h-5" />
            <span>Nuevo Gasto</span>
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between bg-slate-800/50 border border-slate-700 p-4 rounded-2xl mb-6">
        <div className="flex items-center gap-4">
           <button onClick={prevMonth} className="p-2 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors">
              <ChevronLeft className="w-6 h-6" />
           </button>
           <div className="flex flex-col items-center min-w-[150px]">
              <span className="text-lg font-bold text-white capitalize">
                {viewDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
              </span>
              <span className="text-xs text-slate-500">
                {filteredExpenses.length} registros
              </span>
           </div>
           <button onClick={nextMonth} className="p-2 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors">
              <ChevronRight className="w-6 h-6" />
           </button>
        </div>

        <div className="flex items-center gap-6">
           <div className="text-right">
              <p className="text-xs text-slate-400 uppercase tracking-wider">Total del Mes</p>
              <p className="text-2xl font-bold text-white">{totalExpenses.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</p>
           </div>
           <div className="h-10 w-px bg-slate-700"></div>
           <div className="flex gap-2">
                <button 
                    onClick={() => setShowReport(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl transition-colors border border-slate-600"
                >
                    <FileText className="w-5 h-5" />
                    <span>Reporte</span>
                </button>
                <button 
                    onClick={handleExport}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl transition-colors border border-slate-600"
                >
                    <Download className="w-5 h-5" />
                    <span>CSV</span>
                </button>
           </div>
        </div>
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden flex-1 flex flex-col">
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-slate-700 bg-slate-900/50 text-slate-400 font-medium text-sm">
          <div className="col-span-4">Descripción</div>
          <div className="col-span-2">Categoría</div>
          <div className="col-span-2">Fecha</div>
          <div className="col-span-2">Asociado a</div>
          <div className="col-span-1 text-right">Monto</div>
          <div className="col-span-1 text-center">Acciones</div>
        </div>
        
        <div className="overflow-y-auto flex-1 custom-scrollbar">
          {filteredExpenses.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-20 text-slate-500 opacity-50">
               <Wallet className="w-16 h-16 mb-4" />
               <p>No hay gastos registrados en este mes</p>
             </div>
          ) : (
            filteredExpenses.map((expense) => (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                key={expense.id} 
                className="grid grid-cols-12 gap-4 p-4 border-b border-slate-700/50 items-center hover:bg-slate-800/50 transition-colors"
              >
                <div className="col-span-4 font-medium text-white truncate" title={expense.description}>{expense.description}</div>
                <div className="col-span-2">
                  <span className="px-2 py-1 rounded-full text-xs border bg-slate-500/10 text-slate-400 border-slate-500/20">
                    {expense.category}
                  </span>
                </div>
                <div className="col-span-2 text-slate-400 text-sm flex items-center gap-2">
                   <Calendar className="w-3 h-3" />
                   {new Date(expense.date).toLocaleDateString()}
                </div>
                <div className="col-span-2 text-slate-500 text-sm italic">
                  {expense.jobId ? `Trabajo #${expense.jobId.slice(0,8).toUpperCase()}` : 'General'}
                </div>
                <div className="col-span-1 text-right font-mono text-white">
                   {expense.amount.toFixed(2)} €
                </div>
                <div className="col-span-1 flex justify-center">
                  <button 
                    onClick={() => handleDelete(expense.id)}
                    className="p-2 hover:bg-red-500/20 text-slate-500 hover:text-red-400 rounded-lg transition-colors group"
                  >
                    <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
             <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.95 }}
               className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl p-6"
             >
                <h3 className="text-xl font-bold text-white mb-4">Registrar Gasto</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Descripción</label>
                    <input 
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white" 
                      value={newExpense.description}
                      onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                      placeholder="Ej. Filtro de aire"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Categoría</label>
                    <select 
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                      value={newExpense.category}
                      onChange={handleCategoryChange}
                    >
                      {categories.map(cat => (
                          <option key={cat.id} value={cat.name}>
                              {cat.name} {cat.defaultAmount ? `(Fijo: ${cat.defaultAmount} €)` : ''}
                          </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">Monto (€)</label>
                      <input 
                        type="number"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white" 
                        value={newExpense.amount}
                        onChange={(e) => setNewExpense({...newExpense, amount: Number(e.target.value)})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">Fecha</label>
                      <input 
                        type="date"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white" 
                        value={newExpense.date}
                        onChange={(e) => setNewExpense({...newExpense, date: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white px-4 py-2">Cancelar</button>
                  <button onClick={handleAddExpense} className="bg-red-600 hover:bg-red-500 text-white px-6 py-2 rounded-xl">Guardar</button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      <AnimatePresence>
          {isCategoryModalOpen && (
            <div className="fixed inset-0 z-[65] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
             <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.95 }}
               className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[80vh]"
             >
                 <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-white">Gestionar Categorías</h3>
                    <button onClick={() => setIsCategoryModalOpen(false)}><X className="text-slate-400 hover:text-white" /></button>
                 </div>
                 
                 <div className="p-6 overflow-y-auto flex-1 space-y-3">
                     {categories.map(cat => (
                         <div key={cat.id} className="flex items-center justify-between bg-slate-800 p-3 rounded-lg border border-slate-700">
                             <div>
                                 <span className="font-bold text-white block">{cat.name}</span>
                                 {cat.defaultAmount && <span className="text-xs text-green-400">Gasto Fijo: {cat.defaultAmount} €</span>}
                             </div>
                             <button onClick={() => handleDeleteCategory(cat.id)} className="text-slate-500 hover:text-red-400 p-2"><Trash2 className="w-4 h-4" /></button>
                         </div>
                     ))}
                 </div>

                 <div className="p-6 bg-slate-800/50 border-t border-slate-700">
                     <h4 className="text-sm font-bold text-slate-400 mb-3 uppercase">Añadir Nueva</h4>
                     <div className="grid grid-cols-2 gap-3 mb-3">
                         <input 
                            placeholder="Nombre" 
                            className="bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm"
                            value={newCategory.name}
                            onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                         />
                         <input 
                            type="number"
                            placeholder="Monto Fijo (€)" 
                            className="bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm"
                            value={newCategory.defaultAmount}
                            onChange={(e) => setNewCategory({...newCategory, defaultAmount: e.target.value})}
                         />
                     </div>
                     <button onClick={handleAddCategory} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg font-medium transition-colors">
                         Añadir Categoría
                     </button>
                 </div>
             </motion.div>
            </div>
          )}
      </AnimatePresence>

      <AnimatePresence>
         {showReport && (
            <div className="fixed inset-0 z-[70] bg-slate-900/90 flex justify-center overflow-y-auto p-8">
               <motion.div 
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 50 }}
                  className="w-full max-w-[210mm] bg-white min-h-[297mm] text-slate-900 p-12 shadow-2xl relative"
               >
                  <div className="absolute top-4 right-4 print:hidden flex gap-2">
                      <button onClick={() => window.print()} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
                          <Printer className="w-4 h-4" /> Imprimir
                      </button>
                      <button onClick={() => setShowReport(false)} className="bg-slate-200 text-slate-800 px-4 py-2 rounded-lg hover:bg-slate-300">
                          <X className="w-4 h-4" /> Cerrar
                      </button>
                  </div>

                  <div className="mb-10 border-b-2 border-slate-100 pb-6">
                      <h1 className="text-4xl font-bold text-slate-800">Reporte Mensual de Gastos</h1>
                      <div className="flex justify-between items-end mt-4">
                          <div>
                              <p className="text-xl text-slate-500 capitalize">{viewDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</p>
                              <p className="text-sm text-slate-400 mt-1">Generado el {new Date().toLocaleDateString()}</p>
                          </div>
                      </div>
                  </div>

                  <div className="mb-12">
                      <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
                          <PieChart className="w-5 h-5 text-blue-600" /> Resumen por Categoría
                      </h3>
                      <div className="grid grid-cols-4 gap-4">
                          {(Object.entries(categoryBreakdown) as [string, number][]).map(([category, amount]) => (
                              <div key={category} className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                                  <p className="text-xs font-bold text-slate-400 uppercase">{category}</p>
                                  <p className="text-xl font-bold text-slate-800">{amount.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</p>
                                  <p className="text-xs text-slate-500 mt-1">{(totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0).toFixed(1)}%</p>
                              </div>
                          ))}
                          <div className="bg-slate-800 p-4 rounded-lg text-white">
                                  <p className="text-xs font-bold text-slate-400 uppercase">Total General</p>
                                  <p className="text-2xl font-bold">{totalExpenses.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</p>
                          </div>
                      </div>
                  </div>

                  <div>
                      <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
                          <FileText className="w-5 h-5 text-blue-600" /> Detalle de Movimientos
                      </h3>
                      <table className="w-full text-sm text-left">
                          <thead>
                              <tr className="bg-slate-100 text-slate-600 uppercase text-xs tracking-wider">
                                  <th className="p-3 rounded-tl-lg">Fecha</th>
                                  <th className="p-3">Descripción</th>
                                  <th className="p-3">Categoría</th>
                                  <th className="p-3">Referencia</th>
                                  <th className="p-3 text-right rounded-tr-lg">Monto</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                              {filteredExpenses.map((expense) => (
                                  <tr key={expense.id} className="hover:bg-slate-50">
                                      <td className="p-3 text-slate-500">{new Date(expense.date).toLocaleDateString()}</td>
                                      <td className="p-3 font-medium text-slate-700">{expense.description}</td>
                                      <td className="p-3">
                                          <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs border border-slate-200">
                                              {expense.category}
                                          </span>
                                      </td>
                                      <td className="p-3 text-slate-400 italic">
                                          {expense.jobId ? `#${expense.jobId.slice(0,8).toUpperCase()}` : '-'}
                                      </td>
                                      <td className="p-3 text-right font-mono font-bold text-slate-800">
                                          {expense.amount.toFixed(2)} €
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
               </motion.div>
            </div>
         )}
      </AnimatePresence>
    </div>
  );
};
