import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://lgymaqwtraoxwmdszzic.supabase.co';
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxneW1hcXd0cmFveHdtZHN6emljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3MzQ4MDgsImV4cCI6MjA5NTMxMDgwOH0.dFXvforvfAGfsoBooBUw4H_Kmh1uTOtIwa4oVGTbfQg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
