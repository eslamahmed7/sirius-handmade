import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://timkacyrogdwoztbabtu.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpbWthY3lyb2dkd296dGJhYnR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxNDY2MDIsImV4cCI6MjA5NTcyMjYwMn0.ipAdCSd6VltkQJ8fZM9WcBT_y_Pfm_HzzQwF6MIxRxc');

async function check() {
  const { data, error } = await supabase.from('users').select('*').limit(5);
  console.log('Error:', error);
  console.log('Users:', data);
}

check();
