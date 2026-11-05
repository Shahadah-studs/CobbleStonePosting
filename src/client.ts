import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function checkSessionGuard() {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user) {
    if (!window.location.pathname.includes('login.html')) {
      window.location.href = '/login.html';
    }
    return null;
  }

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
  
  if (profile?.is_banned) {
    await supabase.auth.signOut();
    window.location.href = '/login.html?error=banned';
    return null;
  }

  // Socket Pipeline: Pulls status from DB. Kicks out immediately if status changes to banned.
  supabase.channel(`guard-${session.user.id}`)
    .on('postgres_changes', { event: 'UPDATE', table: 'profiles', filter: `id=eq.${session.user.id}` }, async (payload: any) => {
      if (payload.new.is_banned) {
        await supabase.auth.signOut();
        window.location.href = '/login.html?error=banned';
      }
    }).subscribe();

  return profile;
}
