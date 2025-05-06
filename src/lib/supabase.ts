
import { createClient } from '@supabase/supabase-js';

// Note: In a real app, these would be environment variables
// Use environment variables in production
export const supabaseUrl = 'https://your-supabase-url.supabase.co';
export const supabaseAnonKey = 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
