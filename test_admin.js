import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://lgymaqwtraoxwmdszzic.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxneW1hcXd0cmFveHdtZHN6emljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3MzQ4MDgsImV4cCI6MjA5NTMxMDgwOH0.dFXvforvfAGfsoBooBUw4H_Kmh1uTOtIwa4oVGTbfQg');

async function test() {
  const email = 'admin@sirius.com';
  console.log('Promoting:', email);
  const { data, error } = await supabase.rpc('promote_to_admin', { user_email: email });
  console.log('RPC Result:', data, error);
  
  const { data: profile } = await supabase.from('users').select('*').eq('email', email);
  console.log('Profile Check:', profile);
}

test();
