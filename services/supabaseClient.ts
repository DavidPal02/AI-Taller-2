
import { createClient } from '@supabase/supabase-js';

// Las variables de entorno deben configurarse en el panel de control del hosting (Vercel/Netlify/etc)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "ERROR DE CONFIGURACIÓN: Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY.\n" +
    "Por favor, configura estas variables en tu entorno de despliegue."
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder'
);
