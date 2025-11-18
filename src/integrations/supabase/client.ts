import { createClient } from '@supabase/supabase-js';
import type { Database } from './types/index';

const SUPABASE_URL = "https://llfolnjkriysvbnbgvxr.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxsZm9sbmprcml5c3ZibmJndnhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0NzQ5MTAsImV4cCI6MjA3OTA1MDkxMH0.rwPrQYriBJu8Au82iWgPWOHrBiHV2OOFvoPuVDP3mUY";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});
