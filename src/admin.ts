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
    <div class="flex justify-between items-center bg-gray-950/40 border border-gray-800/80 p-3.5 rounded-xl">
      <span class="text-sm font-medium ${u.is_banned ? 'text-red-500 line-through font-mono' : ''}">${u.username} ${u.role === 'owner' ? '👑' : ''}</span>
      ${u.role !== 'owner' ? `<button onclick="window.toggleBan('${u.id}', ${u.is_banned})" class="btn-danger text-xs px-3 py-1.5 font-bold uppercase tracking-wider">${u.is_banned ? 'UNBAN' : 'LOGOUT & BAN'}</button>` : ''}
    </div>
  `).join('');

  document.getElementById('admin-reports-list')!.innerHTML = (reports || []).map(r => `
    <div class="bg-gray-800/40 border border-gray-700/50 p-4 rounded-xl text-xs space-y-2">
      <p class="text-red-400 font-bold uppercase tracking-wide text-[10px]">Interception Reason: ${r.reason}</p>
      <p class="text-gray-300 italic font-mono bg-gray-900/40 p-2 rounded border border-gray-800/50">"${r.posts?.content || '[Post Deleted]'}"</p>
    </div>
  `).join('');
}

(window as any).toggleBan = async (uid: string, status: boolean) => {
  await supabase.from('profiles').update({ is_banned: !status }).eq('id', uid);
  loadAdminData();
};

run();

