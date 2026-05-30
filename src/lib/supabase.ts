import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://timkacyrogdwoztbabtu.supabase.co';
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpbWthY3lyb2dkd296dGJhYnR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxNDY2MDIsImV4cCI6MjA5NTcyMjYwMn0.ipAdCSd6VltkQJ8fZM9WcBT_y_Pfm_HzzQwF6MIxRxc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
