
import { createClient } from '@supabase/supabase-js';
import { Client, Vehicle, Job, JobStatus, Expense, Mechanic, ExpenseCategory, WorkshopSettings, User, KPIData } from '../types';

const SUPABASE_URL = 'https://gudlfuxjfmtqodrncigy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd1ZGxmdXhqZm10cW9kcm5jaWd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4MjIyNjksImV4cCI6MjA4NDM5ODI2OX0.E-hVczzl2cFweCAoT6ZkM0JckybmBsd0DMAxXoGFSuM';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const getUserId = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id;
};

export const authService = {
  login: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    const { data: mfaData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    const mfaRequired = mfaData?.nextLevel === 'aal2' && mfaData?.currentLevel !== 'aal2';
    return { user: { id: data.user.id, name: data.user.user_metadata.name || 'Usuario', email: data.user.email! }, mfaRequired };
  },
  enrollMFA: async () => {
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' });
    if (error) throw error;
    return data;
  },
  verifyAndEnableMFA: async (factorId: string, code: string) => {
    const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
    if (challengeError) throw challengeError;
    const { data, error } = await supabase.auth.mfa.verify({ factorId, challengeId: challengeData.id, code });
    if (error) throw error;
    return data;
  },
  loginVerifyMFA: async (code: string) => {
    const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
    if (factorsError) throw factorsError;
    const totpFactor = factors.totp[0];
    if (!totpFactor) throw new Error("No se encontró factor de autenticación");
    const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: totpFactor.id });
    if (challengeError) throw challengeError;
    const { data, error } = await supabase.auth.mfa.verify({ factorId: totpFactor.id, challengeId: challengeData.id, code });
    if (error) throw error;
    return data;
  },
  register: async (name: string, email: string, password: string): Promise<User> => {
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name } } });
    if (error) throw error;
    return { id: data.user!.id, name, email };
  },
  logout: async () => { await supabase.auth.signOut(); },
  getCurrentUser: async (): Promise<User | null> => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return null;
    return { id: data.user.id, name: data.user.user_metadata.name || 'Usuario', email: data.user.email! };
  }
};

export const dbService = {
  getClients: async (): Promise<Client[]> => {
    const { data, error } = await supabase.from('clients').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data.map(c => ({ id: c.id, name: c.name, phone: c.phone, email: c.email, address: c.address, createdAt: c.created_at }));
  },
  addClient: async (client: Client) => {
    const userId = await getUserId();
    if (!userId) throw new Error("Usuario no autenticado");
    const { error } = await supabase.from('clients').insert([{ id: client.id, user_id: userId, name: client.name, phone: client.phone, email: client.email, address: client.address }]);
    if (error) throw error;
  },
  updateClient: async (client: Client) => {
    const { error } = await supabase.from('clients').update({ name: client.name, phone: client.phone, email: client.email, address: client.address }).eq('id', client.id);
    if (error) throw error;
  },
  deleteClient: async (id: string) => {
    const { error } = await supabase.from('clients').delete().eq('id', id);
    if (error) throw error;
  },
  getVehicles: async (): Promise<Vehicle[]> => {
    const { data, error } = await supabase.from('vehicles').select('*');
    if (error) throw error;
    return data.map(v => ({ id: v.id, clientId: v.client_id, make: v.make, model: v.model, plate: v.plate, year: v.year, currentMileage: v.current_mileage, lastItvDate: v.last_itv_date, isArchived: v.is_archived }));
  },
  addVehicle: async (v: Vehicle) => {
    const userId = await getUserId();
    if (!userId) throw new Error("Usuario no autenticado");
    const { error } = await supabase.from('vehicles').insert([{ id: v.id, user_id: userId, client_id: v.clientId, make: v.make, model: v.model, plate: v.plate, year: v.year, current_mileage: v.currentMileage, last_itv_date: v.lastItvDate, is_archived: v.isArchived || false }]);
    if (error) throw error;
  },
  updateVehicle: async (v: Vehicle) => {
    const { error } = await supabase.from('vehicles').update({ make: v.make, model: v.model, plate: v.plate, year: v.year, current_mileage: v.currentMileage, last_itv_date: v.lastItvDate, is_archived: v.isArchived }).eq('id', v.id);
    if (error) throw error;
  },
  deleteVehicle: async (id: string) => {
    const { error } = await supabase.from('vehicles').delete().eq('id', id);
    if (error) throw error;
  },
  getJobs: async (): Promise<Job[]> => {
    const { data, error } = await supabase.from('jobs').select('*');
    if (error) throw error;
    return data.map(j => ({ id: j.id, vehicleId: j.vehicle_id, clientId: j.client_id, mechanicId: j.mechanic_id, description: j.description, status: j.status as JobStatus, items: j.items || [], laborHours: j.labor_hours, laborPricePerHour: j.labor_price_per_hour, entryDate: j.entry_date, mileage: j.mileage, total: j.total, isPaid: j.is_paid, isArchived: j.is_archived }));
  },
  saveJob: async (j: Job) => {
    const userId = await getUserId();
    if (!userId) throw new Error("Usuario no autenticado");
    const payload = { user_id: userId, vehicle_id: j.vehicleId, client_id: j.clientId, mechanic_id: j.mechanicId, description: j.description, status: j.status, items: j.items, labor_hours: j.laborHours, labor_price_per_hour: j.laborPricePerHour, entry_date: j.entryDate, mileage: j.mileage, total: j.total, is_paid: j.isPaid, is_archived: j.isArchived ?? false };
    const { error } = await supabase.from('jobs').upsert([{ id: j.id, ...payload }]);
    if (error) throw error;
  },
  deleteJob: async (id: string) => {
    const { error } = await supabase.from('jobs').delete().eq('id', id);
    if (error) throw error;
  },
  getExpenses: async (): Promise<Expense[]> => {
    const { data, error } = await supabase.from('expenses').select('*');
    if (error) throw error;
    return data.map(e => ({ id: e.id, jobId: e.job_id, description: e.description, amount: e.amount, date: e.date, category: e.category }));
  },
  addExpense: async (e: Expense) => {
    const userId = await getUserId();
    if (!userId) throw new Error("Usuario no autenticado");
    const { error } = await supabase.from('expenses').insert([{ id: e.id, user_id: userId, job_id: e.jobId, description: e.description, amount: e.amount, date: e.date, category: e.category }]);
    if (error) throw error;
  },
  deleteExpense: async (id: string) => { await supabase.from('expenses').delete().eq('id', id); },
  getMechanics: async (): Promise<Mechanic[]> => {
    const { data, error } = await supabase.from('mechanics').select('*');
    if (error) throw error;
    return data.map(m => ({ id: m.id, name: m.name, specialty: m.specialty }));
  },
  addMechanic: async (m: Mechanic) => {
    const userId = await getUserId();
    if (!userId) throw new Error("Usuario no autenticado");
    const { error } = await supabase.from('mechanics').insert([{ id: m.id, user_id: userId, name: m.name, specialty: m.specialty }]);
    if (error) throw error;
  },
  updateMechanic: async (m: Mechanic) => {
    const { error } = await supabase.from('mechanics').update({ name: m.name, specialty: m.specialty }).eq('id', m.id);
    if (error) throw error;
  },
  deleteMechanic: async (id: string) => { await supabase.from('mechanics').delete().eq('id', id); },
  getExpenseCategories: async (): Promise<ExpenseCategory[]> => {
    const { data, error } = await supabase.from('expense_categories').select('*');
    if (error || !data || data.length === 0) return [{ id: crypto.randomUUID(), name: 'Piezas' }, { id: crypto.randomUUID(), name: 'Alquiler' }];
    return data;
  },
  addExpenseCategory: async (c: ExpenseCategory) => {
    const userId = await getUserId();
    if (!userId) throw new Error("Usuario no autenticado");
    await supabase.from('expense_categories').insert([{ ...c, user_id: userId }]);
  },
  deleteExpenseCategory: async (id: string) => { await supabase.from('expense_categories').delete().eq('id', id); },
  getSettings: async (): Promise<WorkshopSettings> => {
    const { data, error } = await supabase.from('workshop_settings').select('*').single();
    if (error || !data) return { name: "Taller Peter", address: "", phone: "", email: "", website: "" };
    return data;
  },
  saveSettings: async (s: WorkshopSettings) => {
    const userId = await getUserId();
    if (!userId) throw new Error("Usuario no autenticado");
    const { error } = await supabase.from('workshop_settings').upsert([{ user_id: userId, ...s }]);
    if (error) throw error;
  },
  getDashboardStats: async (): Promise<KPIData> => {
    const [jobs, clients, expenses, mechanics] = await Promise.all([dbService.getJobs(), dbService.getClients(), dbService.getExpenses(), dbService.getMechanics()]);
    const delivered = jobs.filter(j => j.status === JobStatus.DELIVERED);
    const revenue = delivered.reduce((a, b) => a + (Number(b.total) || 0), 0);
    const totalExp = expenses.reduce((a, b) => a + (Number(b.amount) || 0), 0);
    const active = jobs.filter(j => j.status !== JobStatus.DELIVERED && j.status !== JobStatus.COMPLETED).length;
    return {
      totalRevenue: revenue, totalExpenses: totalExp, netProfit: revenue - totalExp, activeJobs: active, completedJobs: jobs.length - active, totalClients: clients.length,
      mechanicLoad: mechanics.map(m => ({ name: m.name, jobs: jobs.filter(j => j.mechanicId === m.id && j.status !== JobStatus.DELIVERED).length }))
    };
  },
  exportBackup: async () => { return { clients: await dbService.getClients(), vehicles: await dbService.getVehicles(), jobs: await dbService.getJobs(), expenses: await dbService.getExpenses(), settings: await dbService.getSettings() }; },
  importBackup: async (data: any) => { console.warn("La importación masiva debe hacerse vía SQL en Supabase."); }
};
