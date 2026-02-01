// src/lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ipyolbshgrpuyxaybjkg.supabase.co';

// ✅ SAFE: Using the 'anon' public key.
// ❌ NEVER use the 'service_role' or 'sb_secret' key here.
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlweW9sYnNoZ3JwdXl4YXliamtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4MTcwNTEsImV4cCI6MjA4NTM5MzA1MX0.GrPi9mXI4gIostutqYrvLw1lNnI-jbiFLs4a_VJmNag';

export const supabase = createClient(supabaseUrl, supabaseKey);