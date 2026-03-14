/* global process */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl      = process.env.VITE_SUPABASE_URL      || process.env.SUPABASE_URL;
const serviceRoleKey   = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('[supabaseAdmin] Variáveis VITE_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausentes.');
}

// Singleton — instanciado uma vez por cold-start do serverless
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession:  false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});
