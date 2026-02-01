
import { createClient } from "@supabase/supabase-js";

// Credentials provided for your Supabase instance
const supabaseUrl = 'https://ipyolbshgrpuyxaybjkg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlweW9sYnNoZ3JwdXl4YXliamtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4MTcwNTEsImV4cCI6MjA4NTM5MzA1MX0.GrPi9mXI4gIostutqYrvLw1lNnI-jbiFLs4a_VJmNag';

export const supabase = createClient(supabaseUrl, supabaseKey);

export const TABLE_NAME = 'production_entries';
export const MASTER_PROGRAM_TABLE = 'master_program';
