import { supabase } from './client';

const urlParams = new URLSearchParams(window.location.search);
const errorDiv = document.getElementById('auth-error')!;
if (urlParams.get('error') === 'banned') {
  errorDiv.innerText = "🔴 Oh no! You are BANNED. Logged out NOW.";
  errorDiv.classList.remove('hidden');
}

let isSignUpMode = false;
const form = document.getElementById('auth-form') as HTMLFormElement;
const toggleBtn = document.getElementById('auth-toggle-btn')!;
const usernameInput = document.getElementById('auth-username')!;

toggleBtn.addEventListener('click', () => {
  isSignUpMode = !isSignUpMode;
  usernameInput.classList.toggle('hidden', !isSignUpMode);
  document.getElementById('auth-submit-btn')!.innerText = isSignUpMode ? "Sign Up" : "Log In";
  document.getElementById('auth-subtitle')!.innerText = isSignUpMode ? "Create your ecosystem profile" : "Sign into your account";
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorDiv.classList.add('hidden');

  const email = (document.getElementById('auth-email') as HTMLInputElement).value;
  const password = (document.getElementById('auth-password') as HTMLInputElement).value;
  const username = (document.getElementById('auth-username') as HTMLInputElement).value;

  if (isSignUpMode) {
    const { error } = await supabase.auth.signUp({ email, password, options: { data: { username } } });
    if (error) return errorDiv.classList.remove('hidden'), errorDiv.innerText = error.message;
    alert("Sign-up complete! You can now log in.");
    location.reload();
  } else {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return errorDiv.classList.remove('hidden'), errorDiv.innerText = error.message;

    const { data: prof } = await supabase.from('profiles').select('is_banned').eq('id', data.user?.id).single();
    if (prof?.is_banned) {
      await supabase.auth.signOut();
      errorDiv.innerText = "🔴 Sign-up / Login failed: Account is BANNED.";
      errorDiv.classList.remove('hidden');
    } else {
      window.location.href = '/index.html';
    }
  }
});
