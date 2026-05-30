import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://lgymaqwtraoxwmdszzic.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxneW1hcXd0cmFveHdtZHN6emljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3MzQ4MDgsImV4cCI6MjA5NTMxMDgwOH0.dFXvforvfAGfsoBooBUw4H_Kmh1uTOtIwa4oVGTbfQg');

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
