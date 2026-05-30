import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://lgymaqwtraoxwmdszzic.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxneW1hcXd0cmFveHdtZHN6emljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3MzQ4MDgsImV4cCI6MjA5NTMxMDgwOH0.dFXvforvfAGfsoBooBUw4H_Kmh1uTOtIwa4oVGTbfQg');

async function check() {
  const { data, error } = await supabase.from('users').select('*').limit(5);
  console.log('Error:', error);
  console.log('Users:', data);
}

check();
