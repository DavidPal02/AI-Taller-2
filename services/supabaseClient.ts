
import { createClient } from '@supabase/supabase-js';

// Las variables de entorno deben configurarse en el panel de control del hosting (Vercel/Netlify/etc)
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "ERROR DE CONFIGURACIÓN: Faltan SUPABASE_URL o SUPABASE_ANON_KEY.\n" +
    "Por favor, configura estas variables en tu entorno de despliegue."
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder'
);
