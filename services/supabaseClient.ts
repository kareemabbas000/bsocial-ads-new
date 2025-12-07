import { createClient } from '@supabase/supabase-js';

// Configuration provided by user
const SUPABASE_URL = 'https://vslsjgfhwknxjhtxlhhk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzbHNqZ2Zod2tueGpodHhsaGhrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTA0MjYzNCwiZXhwIjoyMDgwNjE4NjM0fQ.y6R_to1sVo9_EK068X8Yc-q_8Tt4yMtVD9Avp_ALxtw';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Helper to log actions (simulate audit trail)
export const logAction = async (action: string, details: any) => {
  // In a real app, this would write to a 'logs' table
  console.log(`[Supabase Log] ${action}:`, details);
  // Example: await supabase.from('audit_logs').insert({ action, details });
};