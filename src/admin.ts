import { supabase, checkSessionGuard } from './client';

async function run() {
  const profile = await checkSessionGuard();
  if (!profile || (profile.role !== 'owner' && profile.role !== 'admin')) {
    window.location.href = '/index.html';
    return;
  }
  loadAdminData();
}

async function loadAdminData() {
  const { data: profiles } = await supabase.from('profiles').select('*');
  const { data: reports } = await supabase.from('reports').select('*, posts(*)');

  document.getElementById('admin-users-list')!.innerHTML = (profiles || []).map(u => `
    <div class="flex justify-between items-center bg-gray-800 p-3 rounded-lg">
      <span class="${u.is_banned ? 'text-red-500 line-through' : ''}">${u.username} ${u.role === 'owner' ? '👑' : ''}</span>
      ${u.role !== 'owner' ? `<button onclick="window.toggleBan('${u.id}', ${u.is_banned})" class="text-xs font-bold p-1 px-2 rounded bg-red-600">${u.is_banned ? 'UNBAN' : 'LOGOUT & BAN NOW'}</button>` : ''}
    </div>
  `).join('');

  document.getElementById('admin-reports-list')!.innerHTML = (reports || []).map(r => `
    <div class="bg-gray-800 p-3 rounded-lg text-xs">
      <p class="text-red-400 font-bold">Reason: ${r.reason}</p>
      <p class="text-gray-400 italic">"${r.posts?.content || '[Post Deleted]'}"</p>
    </div>
  `).join('');
}

(window as any).toggleBan = async (uid: string, status: boolean) => {
  await supabase.from('profiles').update({ is_banned: !status }).eq('id', uid);
  loadAdminData();
};

run();
