import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wmzafpkrmyhxbvymdjgu.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtemFmcGtybXloeGJ2eW1kamd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NDQxNjAsImV4cCI6MjA4NTAyMDE2MH0.RUlK8QD8OOTF0NLkr7EnhH_p9CRI5E7j7o1TQpNEa1w';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
