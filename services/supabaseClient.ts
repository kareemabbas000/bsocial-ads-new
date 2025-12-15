import { createClient } from '@supabase/supabase-js';

// Configuration provided by user
const SUPABASE_URL = 'https://icgkbruoltgvchbqednf.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImljZ2ticnVvbHRndmNoYnFlZG5mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTcxOTQ3NSwiZXhwIjoyMDgxMjk1NDc1fQ.xeD3Rk6IOKsVEKBqr5JCyb2IIoC7LeJ3ErwqqSxpVxI';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Helper to log actions (simulate audit trail)
export const logAction = async (action: string, details: any) => {
  // In a real app, this would write to a 'logs' table
  console.log(`[Supabase Log] ${action}:`, details);
  // Example: await supabase.from('audit_logs').insert({ action, details });
};