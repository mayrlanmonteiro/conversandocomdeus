/* global process */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Configuração interna faltando: VITE_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configurados na Vercel.');
}

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { 
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  },
});
