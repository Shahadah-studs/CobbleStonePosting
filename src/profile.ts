import { supabase, checkSessionGuard } from './client';

let currentProfile: any = null;

async function run() {
  currentProfile = await checkSessionGuard();
  if (!currentProfile) return;

  const usernameInput = document.getElementById('profile-username') as HTMLInputElement;
  const avatarInput = document.getElementById('profile-avatar') as HTMLInputElement;

  usernameInput.value = currentProfile.username;
  avatarInput.value = currentProfile.avatar_url || '';

  document.getElementById('profile-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    await supabase.from('profiles').update({
      username: usernameInput.value,
      avatar_url: avatarInput.value,
      updated_at: new Date().toISOString()
    }).eq('id', currentProfile.id);

    alert("Profile saved successfully!");
    window.location.href = '/index.html';
  });
}

run();
