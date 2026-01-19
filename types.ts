
export enum JobStatus {
  PENDING = 'Pendiente',
  IN_PROGRESS = 'En Proceso',
  COMPLETED = 'Completado',
  DELIVERED = 'Entregado/Facturado'
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  companyName?: string;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  createdAt: string;
}

export interface Mechanic {
  id: string;
  name: string;
  specialty: string;
}

export interface Vehicle {
  id: string;
  clientId: string;
  make: string;
  model: string;
  plate: string;
  vin?: string;
  year: number;
  engine?: string;
  currentMileage?: number;
  lastItvDate?: string; // Nueva: Fecha de la última ITV realizada
}

export interface JobItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  defaultAmount?: number;
}

export interface Expense {
  id: string;
  jobId?: string;
  description: string;
  amount: number;
  date: string;
  category: string;
}

export interface Job {
  id: string;
  vehicleId: string;
  clientId: string;
  mechanicId?: string;
  description: string;
  status: JobStatus;
  items: JobItem[];
  laborHours: number;
  laborPricePerHour: number;
  entryDate: string;
  mileage: number;
  estimatedDelivery?: string;
  notes?: string;
  total: number;
  isPaid: boolean;
}

export interface KPIData {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  activeJobs: number;
  completedJobs: number;
  totalClients: number;
  mechanicLoad: { name: string; jobs: number }[];
}

export interface WorkshopSettings {
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
}
