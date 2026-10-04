import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel.');
}

export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseKey || 'placeholder-anon-key');

export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export const initializeGoogleSignIn = (onSuccess) => {
  if (window.google && GOOGLE_CLIENT_ID) {
    window.google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: onSuccess });
  }
};

export const renderGoogleButton = (elementId) => {
  if (window.google && GOOGLE_CLIENT_ID) {
    const element = document.getElementById(elementId);
    if (element) {
      window.google.accounts.id.renderButton(element, { theme: 'outline', size: 'large', width: '100%' });
    }
  }
};
