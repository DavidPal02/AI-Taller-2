
import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Euro, Wallet, TrendingUp, Calendar, FileText, Download,
    ChevronLeft, ChevronRight, Calculator, PieChart, Users,
    Activity, ArrowUpRight, ArrowDownRight, Printer, X, Search,
    Car, Wrench
} from 'lucide-react';
import { dbService } from '../services/dbService';
import { Job, Expense, Client, Vehicle, JobStatus } from '../types';
import { Expenses } from './Expenses';

declare global {
    interface Window {
        html2pdf: any;
    }
}

type FinanceTab = 'reports' | 'expenses';

export const Finance: React.FC = () => {
    const [activeTab, setActiveTab] = useState<FinanceTab>('reports');
    const [jobs, setJobs] = useState<Job[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewYear, setViewYear] = useState(new Date().getFullYear());
    const [selectedMonthReport, setSelectedMonthReport] = useState<{ month: number, year: number } | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [jobsData, expensesData, clientsData, vehiclesData] = await Promise.all([
                dbService.getJobs(),
                dbService.getExpenses(),
                dbService.getClients(),
                dbService.getVehicles()
            ]);
            setJobs(jobsData);
            setExpenses(expensesData);
            setClients(clientsData);
            setVehicles(vehiclesData);
        } finally {
            setLoading(false);
        }
    };

    const monthlyStats = useMemo(() => {
        const stats = Array.from({ length: 12 }, (_, i) => ({
            month: i,
            year: viewYear,
            carsIn: 0,
            jobsList: [] as { clientName: string, description: string, total: number, vehicleLabel: string }[],
            revenue: 0,
            expenses: 0,
            balance: 0,
            newClientsCount: 0,
            growth: 0
        }));

        jobs.forEach(job => {
            const date = new Date(job.entryDate);
            if (date.getFullYear() === viewYear) {
                const month = date.getMonth();
                const client = clients.find(c => c.id === job.clientId);
                const vehicle = vehicles.find(v => v.id === job.vehicleId);

                const vehicleLabel = vehicle ? `${vehicle.plate} - ${vehicle.make} ${vehicle.model}` : 'Desconocido';

                stats[month].carsIn++;
                stats[month].revenue += Number(job.total) || 0;
                stats[month].jobsList.push({
                    clientName: client?.name || 'Cliente Desconocido',
                    description: job.description,
                    total: Number(job.total) || 0,
                    vehicleLabel
                });
            }
        });

        expenses.forEach(exp => {
            const date = new Date(exp.date);
            if (date.getFullYear() === viewYear) {
                const month = date.getMonth();
                stats[month].expenses += Number(exp.amount) || 0;
            }
        });

        // Calculate new clients count per month
        clients.forEach(client => {
            if (client.createdAt) {
                const date = new Date(client.createdAt);
                if (date.getFullYear() === viewYear) {
                    const month = date.getMonth();
                    stats[month].newClientsCount++;
                }
            }
        });

        stats.forEach((s, i) => {
            s.balance = s.revenue - s.expenses;

            // Calculate growth compared to previous month
            let prevMonthCount = 0;
            if (i > 0) {
                prevMonthCount = stats[i - 1].newClientsCount;
            } else {
                // For January, compare with December of previous year
                prevMonthCount = clients.filter(c => {
                    const d = new Date(c.createdAt);
                    return d.getFullYear() === viewYear - 1 && d.getMonth() === 11;
                }).length;
            }

            if (prevMonthCount > 0) {
                s.growth = ((s.newClientsCount - prevMonthCount) / prevMonthCount) * 100;
            } else if (s.newClientsCount > 0) {
                s.growth = 100; // First month with clients shows 100% growth
            }
        });

        return stats;
    }, [jobs, expenses, clients, vehicles, viewYear]);

    const handlePrintMonth = (month: number, year: number) => {
        setSelectedMonthReport({ month, year });
    };

    const generatePDF = () => {
        const element = document.getElementById('monthly-report-pdf');
        if (!element || !window.html2pdf) return;

        const monthName = new Date(selectedMonthReport!.year, selectedMonthReport!.month).toLocaleDateString('es-ES', { month: 'long' });

        const opt = {
            margin: [10, 10],
            filename: `Informe_${monthName}_${selectedMonthReport!.year}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        window.html2pdf().set(opt).from(element).save();
    };

    return (
        <div className="p-8 h-full overflow-hidden flex flex-col bg-slate-950">
            {/* Header / Tabs */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase">Gestión Económica</h2>
                    <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em] flex items-center gap-2 mt-1">
                        <Activity className="w-3 h-3 text-emerald-500" /> Control Centralizado de Finanzas
                    </p>
                </div>

                <div className="bg-slate-900/50 p-1.5 rounded-2xl border border-slate-800 flex gap-1">
                    <button
                        onClick={() => setActiveTab('reports')}
                        className={`px-6 py-2.5 rounded-xl text-sm font-black tracking-tight transition-all flex items-center gap-2 ${activeTab === 'reports' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
                            }`}
                    >
                        <PieChart className="w-4 h-4" /> INFORMES
                    </button>
                    <button
                        onClick={() => setActiveTab('expenses')}
                        className={`px-6 py-2.5 rounded-xl text-sm font-black tracking-tight transition-all flex items-center gap-2 ${activeTab === 'expenses' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
                            }`}
                    >
                        <Wallet className="w-4 h-4" /> GASTOS
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-hidden relative">
                <AnimatePresence mode="wait">
                    {activeTab === 'reports' ? (
                        <motion.div
                            key="reports"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="h-full flex flex-col"
                        >
                            {/* Year Selector */}
                            <div className="flex items-center justify-center gap-8 mb-8">
                                <button onClick={() => setViewYear(viewYear - 1)} className="p-3 bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 hover:text-white transition-all"><ChevronLeft /></button>
                                <h3 className="text-5xl font-black text-white tracking-tight">{viewYear}</h3>
                                <button onClick={() => setViewYear(viewYear + 1)} className="p-3 bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 hover:text-white transition-all"><ChevronRight /></button>
                            </div>

                            {/* Monthly Grid */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-10">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {monthlyStats
                                        .filter(stat => {
                                            const now = new Date();
                                            const currentYear = now.getFullYear();
                                            const currentMonth = now.getMonth();

                                            if (viewYear < currentYear) return true;
                                            if (viewYear === currentYear) return stat.month <= currentMonth;
                                            return false;
                                        })
                                        .map((stat, idx) => (
                                            <motion.div
                                                key={idx}
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: idx * 0.05 }}
                                                className="bg-slate-900/40 border border-slate-800 rounded-[2rem] p-6 hover:border-blue-500/30 transition-all group flex flex-col h-full"
                                            >
                                                <div className="flex justify-between items-start mb-6">
                                                    <div>
                                                        <h4 className="text-xl font-black text-white uppercase italic">
                                                            {new Date(viewYear, idx).toLocaleDateString('es-ES', { month: 'long' })}
                                                        </h4>
                                                        <div className="flex items-center gap-2 text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">
                                                            <Car className="w-3 h-3" /> {stat.carsIn} Coches
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => handlePrintMonth(idx, viewYear)}
                                                        className="p-3 bg-blue-600/10 text-blue-500 rounded-2xl hover:bg-blue-600 hover:text-white transition-all"
                                                    >
                                                        <Printer className="w-4 h-4" />
                                                    </button>
                                                </div>

                                                <div className="flex-1 space-y-4 mb-6">
                                                    <div className="bg-slate-800/30 rounded-2xl p-4 border border-slate-800/50">
                                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Trabajos Recientes</p>
                                                        <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
                                                            {stat.jobsList.length > 0 ? stat.jobsList.slice(0, 5).map((job, jidx) => (
                                                                <div key={jidx} className="flex justify-between text-xs">
                                                                    <span className="text-slate-300 truncate w-2/3">{job.clientName}</span>
                                                                    <span className="font-mono text-emerald-400 font-bold">{job.total}€</span>
                                                                </div>
                                                            )) : (
                                                                <p className="text-[10px] text-slate-600 italic">No hay registros</p>
                                                            )}
                                                            {stat.jobsList.length > 5 && <p className="text-[9px] text-blue-500 text-center font-black">+{stat.jobsList.length - 5} MÁS</p>}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="pt-4 border-t border-slate-800">
                                                    <div className="flex justify-between items-end">
                                                        <div>
                                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Balance Neto</p>
                                                            <p className={`text-2xl font-black ${stat.balance >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                                                {stat.balance.toLocaleString()} €
                                                            </p>
                                                        </div>
                                                        <div className={`p-2 rounded-xl bg-opacity-10 ${stat.balance >= 0 ? 'bg-emerald-500 text-emerald-500' : 'bg-red-500 text-red-500'}`}>
                                                            {stat.balance >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="expenses"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="h-full"
                        >
                            <Expenses />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Monthly Report Modal / PDF Template */}
            <AnimatePresence>
                {selectedMonthReport && (
                    <div className="fixed inset-0 z-[1000] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-slate-900 border border-slate-800 w-full max-w-5xl h-[90vh] rounded-[2.5rem] flex flex-col shadow-2xl overflow-hidden"
                        >
                            <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                                <div>
                                    <h3 className="text-2xl font-black text-white italic uppercase tracking-tight">
                                        PREVISUALIZACIÓN DE INFORME
                                    </h3>
                                    <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">
                                        Auditoría Mensual - {new Date(selectedMonthReport.year, selectedMonthReport.month).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                                    </p>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={generatePDF}
                                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-2xl font-black text-sm tracking-tight flex items-center gap-3 transition-all"
                                    >
                                        <Download className="w-5 h-5" /> DESCARGAR PDF
                                    </button>
                                    <button
                                        onClick={() => setSelectedMonthReport(null)}
                                        className="bg-slate-800 hover:bg-slate-700 text-white p-4 rounded-2xl transition-all"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-12 bg-white text-slate-900" id="monthly-report-pdf">
                                {/* PDF Content Structure */}
                                <div className="max-w-4xl mx-auto">
                                    <div className="flex justify-between items-start mb-12 border-b-4 border-slate-950 pb-8">
                                        <div>
                                            <h1 className="text-5xl font-black italic tracking-tighter">PETER TALLER</h1>
                                            <p className="text-sm font-black uppercase tracking-widest text-slate-500">Premium Garage Management</p>
                                        </div>
                                        <div className="text-right">
                                            <h2 className="text-2xl font-black uppercase tracking-tight">INFORME ECONÓMICO</h2>
                                            <p className="text-slate-500 font-bold">{new Date(selectedMonthReport.year, selectedMonthReport.month).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</p>
                                        </div>
                                    </div>

                                    {/* Monthly KPIs */}
                                    <div className="grid grid-cols-3 gap-6 mb-8">
                                        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Total Ingresos</p>
                                            <p className="text-3xl font-black">
                                                {monthlyStats[selectedMonthReport.month].revenue.toLocaleString()} €
                                            </p>
                                        </div>
                                        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Total Gastos</p>
                                            <p className="text-3xl font-black text-red-600">
                                                {monthlyStats[selectedMonthReport.month].expenses.toLocaleString()} €
                                            </p>
                                        </div>
                                        <div className="bg-slate-900 p-6 rounded-3xl shadow-xl shadow-slate-900/20 text-white">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Beneficio Neto</p>
                                            <p className="text-3xl font-black">
                                                {monthlyStats[selectedMonthReport.month].balance.toLocaleString()} €
                                            </p>
                                        </div>
                                    </div>

                                    {/* Customer Analytics */}
                                    <div className="bg-blue-50/50 border border-blue-100 rounded-3xl p-8 mb-12 flex justify-between items-center">
                                        <div>
                                            <h3 className="text-sm font-black uppercase tracking-widest text-blue-900 mb-1">Analítica de Captación</h3>
                                            <p className="text-xs text-blue-700 font-bold uppercase">Rendimiento de Crecimiento de Cartera</p>
                                        </div>
                                        <div className="flex gap-12">
                                            <div className="text-center">
                                                <p className="text-[9px] font-black text-blue-400 uppercase tracking-[0.2em] mb-1">Clientes Nuevos</p>
                                                <p className="text-2xl font-black text-blue-900">{monthlyStats[selectedMonthReport.month].newClientsCount}</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-[9px] font-black text-blue-400 uppercase tracking-[0.2em] mb-1">Crecimiento</p>
                                                <p className={`text-2xl font-black ${monthlyStats[selectedMonthReport.month].growth >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                    {monthlyStats[selectedMonthReport.month].growth >= 0 ? '+' : ''}
                                                    {monthlyStats[selectedMonthReport.month].growth.toFixed(1)}%
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Detailed Jobs Table */}
                                    <div className="mb-12">
                                        <h3 className="text-lg font-black uppercase tracking-tighter mb-6 flex items-center gap-3">
                                            <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
                                            Detalle Operativo (Trabajos Realizados)
                                        </h3>
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b-2 border-slate-900 text-left">
                                                    <th className="py-4 px-2 font-black uppercase tracking-widest text-[10px]">Cliente</th>
                                                    <th className="py-4 px-2 font-black uppercase tracking-widest text-[10px]">Vehículo</th>
                                                    <th className="py-4 px-2 font-black uppercase tracking-widest text-[10px]">Descripción del Servicio</th>
                                                    <th className="py-4 px-2 font-black uppercase tracking-widest text-[10px] text-right">Importe</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {monthlyStats[selectedMonthReport.month].jobsList.map((job, idx) => (
                                                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                                        <td className="py-4 px-2 font-bold">{job.clientName}</td>
                                                        <td className="py-4 px-2 font-medium text-slate-600 text-xs italic">{job.vehicleLabel}</td>
                                                        <td className="py-4 px-2 text-slate-500">{job.description}</td>
                                                        <td className="py-4 px-2 font-black text-right">{job.total.toLocaleString()} €</td>
                                                    </tr>
                                                ))}
                                                {monthlyStats[selectedMonthReport.month].jobsList.length === 0 && (
                                                    <tr>
                                                        <td colSpan={3} className="py-10 text-center text-slate-400 font-bold uppercase text-xs tracking-[0.2em]">Sin actividad registrada</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                            <tfoot>
                                                <tr className="bg-slate-900 text-white">
                                                    <td colSpan={2} className="py-4 px-4 font-black text-[10px] uppercase">SUBTOTAL INGRESOS</td>
                                                    <td className="py-4 px-4 font-black text-right text-lg">
                                                        {monthlyStats[selectedMonthReport.month].revenue.toLocaleString()} €
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>

                                    {/* Detailed Expenses Table */}
                                    <div className="mb-12">
                                        <h3 className="text-lg font-black uppercase tracking-tighter mb-6 flex items-center gap-3">
                                            <div className="w-1.5 h-6 bg-red-600 rounded-full" />
                                            Detalle de Gastos Mensuales
                                        </h3>
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b-2 border-slate-900 text-left">
                                                    <th className="py-4 px-2 font-black uppercase tracking-widest text-[10px]">Fecha</th>
                                                    <th className="py-4 px-2 font-black uppercase tracking-widest text-[10px]">Descripción</th>
                                                    <th className="py-4 px-2 font-black uppercase tracking-widest text-[10px] text-right">Importe</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {expenses.filter(e => {
                                                    const d = new Date(e.date);
                                                    return d.getMonth() === selectedMonthReport.month && d.getFullYear() === selectedMonthReport.year;
                                                }).map((exp, idx) => (
                                                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                                        <td className="py-4 px-2 text-slate-500">{new Date(exp.date).toLocaleDateString()}</td>
                                                        <td className="py-4 px-2 font-bold">{exp.description}</td>
                                                        <td className="py-4 px-2 font-black text-right text-red-600">{Number(exp.amount).toLocaleString()} €</td>
                                                    </tr>
                                                ))}
                                                {expenses.filter(e => {
                                                    const d = new Date(e.date);
                                                    return d.getMonth() === selectedMonthReport.month && d.getFullYear() === selectedMonthReport.year;
                                                }).length === 0 && (
                                                        <tr>
                                                            <td colSpan={3} className="py-10 text-center text-slate-400 font-bold uppercase text-xs tracking-[0.2em]">Sin gastos registrados</td>
                                                        </tr>
                                                    )}
                                            </tbody>
                                            <tfoot>
                                                <tr className="bg-slate-900 text-white">
                                                    <td colSpan={2} className="py-4 px-4 font-black text-[10px] uppercase">SUBTOTAL GASTOS</td>
                                                    <td className="py-4 px-4 font-black text-right text-lg">
                                                        {monthlyStats[selectedMonthReport.month].expenses.toLocaleString()} €
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>

                                    {/* Footer Audit */}
                                    <div className="mt-20 pt-8 border-t border-slate-200 text-center">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em]">Taller Peter System Automative Audit • {new Date().toLocaleDateString()}</p>
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
