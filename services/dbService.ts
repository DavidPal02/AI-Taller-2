
import { supabase } from './supabaseClient';
import { Client, Vehicle, Job, JobStatus, Expense, Mechanic, ExpenseCategory, WorkshopSettings, User } from '../types';

// --- AUTH SERVICE (Supabase Auth) ---
export const authService = {
  login: async (email: string, password: string): Promise<User | null> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (data.user) {
      return {
        id: data.user.id,
        name: data.user.user_metadata?.name || '',
        email: data.user.email || '',
        companyName: data.user.user_metadata?.company_name
      };
    }
    return null;
  },

  register: async (name: string, email: string, password: string): Promise<User> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          company_name: `${name}'s Workshop`
        }
      }
    });

    if (error) throw error;
    if (!data.user) throw new Error("Error al crear usuario");

    // Seed initial data for new user (Categories, etc.) via DB trigger or manual insert
    // Here we could perform initial inserts if needed
    
    return {
      id: data.user.id,
      name: name,
      email: email,
      companyName: `${name}'s Workshop`
    };
  },

  logout: async () => {
    await supabase.auth.signOut();
  },

  getCurrentUser: async (): Promise<User | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return null;
    
    return {
      id: session.user.id,
      name: session.user.user_metadata?.name || '',
      email: session.user.email || '',
      companyName: session.user.user_metadata?.company_name
    };
  }
};

// --- DATA SERVICE (Supabase Database) ---
export const dbService = {
  // Clients
  getClients: async (): Promise<Client[]> => {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('name');
    if (error) throw error;
    return data || [];
  },
  addClient: async (client: Client): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('clients')
      .insert([{ ...client, user_id: user?.id }]);
    if (error) throw error;
  },

  // Mechanics
  getMechanics: async (): Promise<Mechanic[]> => {
    const { data, error } = await supabase
      .from('mechanics')
      .select('*');
    if (error) throw error;
    return data || [];
  },
  addMechanic: async (mechanic: Mechanic): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('mechanics')
      .insert([{ ...mechanic, user_id: user?.id }]);
    if (error) throw error;
  },
  updateMechanic: async (mechanic: Mechanic): Promise<void> => {
    const { error } = await supabase
      .from('mechanics')
      .update({ name: mechanic.name, specialty: mechanic.specialty })
      .eq('id', mechanic.id);
    if (error) throw error;
  },
  deleteMechanic: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('mechanics')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // Vehicles
  getVehicles: async (): Promise<Vehicle[]> => {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*');
    if (error) throw error;
    return data || [];
  },
  addVehicle: async (vehicle: Vehicle): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('vehicles')
      .insert([{ ...vehicle, user_id: user?.id }]);
    if (error) throw error;
  },
  updateVehicle: async (vehicle: Vehicle): Promise<void> => {
    const { error } = await supabase
      .from('vehicles')
      .update({ 
          make: vehicle.make, 
          model: vehicle.model, 
          plate: vehicle.plate, 
          year: vehicle.year,
          engine: vehicle.engine,
          current_mileage: vehicle.currentMileage
      })
      .eq('id', vehicle.id);
    if (error) throw error;
  },

  // Jobs
  getJobs: async (): Promise<Job[]> => {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .order('entry_date', { ascending: false });
    if (error) throw error;
    
    // Map SnakeCase from DB to CamelCase for App
    return (data || []).map(j => ({
        ...j,
        laborPricePerHour: j.labor_price_per_hour,
        laborHours: j.labor_hours,
        entryDate: j.entry_date,
        isPaid: j.is_paid,
        vehicleId: j.vehicle_id,
        clientId: j.client_id,
        mechanicId: j.mechanic_id
    }));
  },
  saveJob: async (job: Job): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Convert CamelCase to SnakeCase for DB
    const dbJob = {
        id: job.id,
        user_id: user?.id,
        vehicle_id: job.vehicleId,
        client_id: job.clientId,
        mechanic_id: job.mechanicId,
        description: job.description,
        status: job.status,
        items: job.items,
        labor_hours: job.laborHours,
        labor_price_per_hour: job.laborPricePerHour,
        entry_date: job.entryDate,
        mileage: job.mileage,
        total: job.total,
        is_paid: job.isPaid
    };

    const { error } = await supabase
      .from('jobs')
      .upsert(dbJob);
    if (error) throw error;

    // Side effect: update mileage in vehicles table
    if (job.mileage > 0) {
        const { data: v } = await supabase.from('vehicles').select('current_mileage').eq('id', job.vehicleId).single();
        if (v && job.mileage > (v.current_mileage || 0)) {
            await supabase.from('vehicles').update({ current_mileage: job.mileage }).eq('id', job.vehicleId);
        }
    }
  },

  // Expenses
  getExpenses: async (): Promise<Expense[]> => {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .order('date', { ascending: false });
    if (error) throw error;
    return (data || []).map(e => ({ ...e, jobId: e.job_id }));
  },
  addExpense: async (expense: Expense): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('expenses')
      .insert([{ 
          ...expense, 
          user_id: user?.id,
          job_id: expense.jobId 
      }]);
    if (error) throw error;
  },
  deleteExpense: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // Fix: Added missing method getExpenseCategories
  getExpenseCategories: async (): Promise<ExpenseCategory[]> => {
    const { data, error } = await supabase
      .from('expense_categories')
      .select('*')
      .order('name');
    if (error) throw error;
    return data || [];
  },

  // Fix: Added missing method addExpenseCategory
  addExpenseCategory: async (category: ExpenseCategory): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('expense_categories')
      .insert([{ ...category, user_id: user?.id }]);
    if (error) throw error;
  },

  // Fix: Added missing method deleteExpenseCategory
  deleteExpenseCategory: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('expense_categories')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // Settings (Stored in profiles table)
  getSettings: async (): Promise<WorkshopSettings> => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user?.id)
      .single();
      
    if (error && error.code !== 'PGRST116') throw error;
    
    return {
      name: data?.workshop_name || 'Mi Taller',
      address: data?.address || '',
      phone: data?.phone || '',
      email: data?.email || user?.email || '',
      website: data?.website || ''
    };
  },
  saveSettings: async (settings: WorkshopSettings): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('profiles')
      .upsert({
          id: user?.id,
          workshop_name: settings.name,
          address: settings.address,
          phone: settings.phone,
          email: settings.email,
          website: settings.website
      });
    if (error) throw error;
  },

  getDashboardStats: async () => {
    const jobs = await dbService.getJobs();
    const clients = await dbService.getClients();
    const expenses = await dbService.getExpenses();
    const mechanics = await dbService.getMechanics();
    
    const deliveredJobs = jobs.filter(j => j.status === JobStatus.DELIVERED);
    const totalRevenue = deliveredJobs.reduce((acc, curr) => acc + curr.total, 0);

    const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);
    const netProfit = totalRevenue - totalExpenses;

    const activeJobs = jobs.filter(j => j.status !== JobStatus.DELIVERED && j.status !== JobStatus.COMPLETED).length;
    const completedJobs = jobs.filter(j => j.status === JobStatus.COMPLETED || j.status === JobStatus.DELIVERED).length;

    const mechanicLoad = mechanics.map(m => {
        const count = jobs.filter(j => j.mechanicId === m.id && j.status !== JobStatus.DELIVERED).length;
        return { name: m.name, jobs: count };
    });

    return {
      totalRevenue,
      totalExpenses,
      netProfit,
      activeJobs,
      completedJobs,
      totalClients: clients.length,
      mechanicLoad
    };
  }
};
