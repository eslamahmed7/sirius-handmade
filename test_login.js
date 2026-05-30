import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://timkacyrogdwoztbabtu.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpbWthY3lyb2dkd296dGJhYnR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxNDY2MDIsImV4cCI6MjA5NTcyMjYwMn0.ipAdCSd6VltkQJ8fZM9WcBT_y_Pfm_HzzQwF6MIxRxc');

async function test() {
  const email = 'admin@sirius.com';
  const password = '12345678';
  
  console.log('Signing in...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
  console.log('Auth:', authError ? authError.message : 'Success', authData?.user?.id);
  
  if (authData?.user) {
    console.log('Fetching profile...');
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .maybeSingle();
      
    console.log('Profile:', profile);
    console.log('Profile Error:', profileError);
  }
}

test();
