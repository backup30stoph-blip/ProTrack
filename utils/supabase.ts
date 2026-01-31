import { createClient } from "@supabase/supabase-js";

// Safe environment variable retrieval
const getEnv = (key: string) => {
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  // @ts-ignore - Support for Vite if used in future
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    // @ts-ignore
    return import.meta.env[key];
  }
  return null;
};

// Configuration with fallbacks based on your provided .env
// Prioritizing the sb_publishable key if that is what your project uses, 
// otherwise falling back to the standard JWT format if that fails.
const supabaseUrl = getEnv('REACT_APP_SUPABASE_URL') || 'https://ipyolbshgrpuyxaybjkg.supabase.co';
const supabaseKey = getEnv('REACT_APP_SUPABASE_PUBLISHABLE_DEFAULT_KEY') || getEnv('REACT_APP_SUPABASE_ANON_KEY') || 'sb_publishable_rnQOHW7kbCxTpxUOAo1THA_q557MjX0';

export const supabase = createClient(supabaseUrl, supabaseKey);

export const TABLE_NAME = 'production_entries';
export const MASTER_PROGRAM_TABLE = 'master_program';
