
import { createClient } from '@supabase/supabase-js';

// Replace these with your actual Supabase project URL and anon key
export const supabaseUrl = 'https://tididuxwrgbpjyuvolep.supabase.co';
export const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpZGlkdXh3cmdiwGp5dXZvbGVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODMzMDM0MzUsImV4cCI6MTk5ODg3OTQzNX0.UklZ9zNq6fj4YjytOh36Az9J2LAa9vSVAXIeO6aSXvA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
