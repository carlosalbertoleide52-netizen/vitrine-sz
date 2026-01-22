
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ypgujlnanmrvpktjffed.supabase.co';
const supabaseAnonKey = 'sb_publishable_EpRk8QKQGjboNlKzYGsXTg_Ev5u3Jdj'; 

// Custom storage handler to prevent "SecurityError: The operation is insecure"
// This happens in some browsers (like Safari) when storage is blocked or in private mode.
const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      return window.localStorage.getItem(key);
    } catch (e) {
      console.warn("Storage access denied:", e);
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      window.localStorage.setItem(key, value);
    } catch (e) {
      console.warn("Storage write denied:", e);
    }
  },
  removeItem: (key: string): void => {
    try {
      window.localStorage.removeItem(key);
    } catch (e) {
      console.warn("Storage removal denied:", e);
    }
  }
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: safeStorage, // Use our protected storage wrapper
    detectSessionInUrl: true
  }
});
