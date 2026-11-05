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

 
  const warnCounts: { [key: string]: number } = {};
  (reports || []).forEach(r => {
    if (r.reason && r.reason.startsWith('[WARN]')) {
     
      const targetUserId = r.posts?.user_id;
      if (targetUserId) {
        warnCounts[targetUserId] = (warnCounts[targetUserId] || 0) + 1;
      }
    }
  });


  document.getElementById('admin-users-list')!.innerHTML = (profiles || []).map(u => {
    const currentWarns = warnCounts[u.id] || 0;
    const isBanned = u.is_banned;
    
    // Détermine le statut d'affichage
    let statusText = `[${currentWarns}/3 WARNS]`;
    if (isBanned) statusText = `[BANNED]`;

    return `
      <div class="flex justify-between items-center bg-gray-950/40 border border-gray-800/80 p-3.5 rounded-xl mb-2">
        <div class="flex flex-col">
          <span class="text-sm font-medium ${isBanned ? 'text-red-500 line-through font-mono' : 'text-gray-100'}">
            ${u.username} ${u.role === 'owner' ? '👑' : ''}
          </span>
          <span class="text-[10px] font-bold font-mono tracking-wider ${isBanned ? 'text-red-500' : currentWarns >= 2 ? 'text-amber-500' : 'text-gray-400'}">
            ${statusText}
          </span>
        </div>
        
        <div class="flex gap-2">
          ${u.role !== 'owner' && !isBanned ? `
            <button onclick="window.issueWarn('${u.id}', ${currentWarns})" class="btn-primary !bg-amber-600 !shadow-none !text-[9px] !p-2">WARN USER</button>
            <button onclick="window.toggleBan('${u.id}', ${isBanned})" class="btn-danger text-xs px-3 py-1.5 font-bold uppercase tracking-wider">STABLE BAN</button>
          ` : ''}
          ${isBanned && u.role !== 'owner' ? `
            <button onclick="window.toggleBan('${u.id}', ${isBanned})" class="btn-primary btn-unban text-xs px-3 py-1.5 font-bold uppercase tracking-wider">UNBAN</button>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');

  
  document.getElementById('admin-reports-list')!.innerHTML = (reports || []).map(r => {
    const isSystemWarn = r.reason && r.reason.startsWith('[WARN]');
    const displayReason = isSystemWarn ? r.reason.replace('[WARN] ', '') : r.reason;
    
    return `
      <div class="bg-gray-800/40 border ${isSystemWarn ? 'border-amber-700/50' : 'border-gray-700/50'} p-4 rounded-xl text-xs space-y-2 mb-2">
        <p class="${isSystemWarn ? 'text-amber-400' : 'text-red-400'} font-bold uppercase tracking-wide text-[10px]">
          ${isSystemWarn ? 'STAFF WARNING LOG' : ' USER FLAGS'}
        </p>
        <p class="text-gray-300 font-medium"><span class="text-gray-500">Reason:</span> ${displayReason}</p>
        <p class="text-gray-400 italic font-mono bg-gray-900/40 p-2 rounded border border-gray-800/50">"${r.posts?.content || '[Post Deleted]'}"</p>
      </div>
    `;
  }).join('');
}


(window as any).issueWarn = async (userId: string, currentWarns: number) => {
  const reason = prompt("Enter the reason for this official warning (e.g., Toxic behavior, Spam):");
  if (!reason || !reason.trim()) return;

  const { data: userPosts } = await supabase.from('posts').select('id').eq('user_id', userId).order('created_at', { ascending: false }).limit(1);
  
  if (!userPosts || userPosts.length === 0) {
    alert("This user hasn't posted anything yet, cannot attach a warning to their log history.");
    return;
  }

  const targetPostId = userPosts[0].id;
  const { data: { user: staffUser } } = await supabase.auth.getUser();

  if (!staffUser) return;

  await supabase.from('reports').insert({
    post_id: targetPostId,
    reporter_id: staffUser.id,
    reason: `[WARN] ${reason}`
  });
  const totalWarnsAfterClick = currentWarns + 1;
  if (totalWarnsAfterClick >= 3) {
    await supabase.from('profiles').update({ is_banned: true }).eq('id', userId);
    alert(`User reached ${totalWarnsAfterClick}/3 warnings. System automatically executed an INSTANT LOGOUT & STABLE BAN.`);
  } else {
    alert(`Warning recorded. User is now at ${totalWarnsAfterClick}/3 warnings.`);
  }

  loadAdminData();
};


(window as any).toggleBan = async (uid: string, status: boolean) => {
  await supabase.from('profiles').update({ is_banned: !status }).eq('id', uid);
  
  if (status === true) {
    const { data: userPosts } = await supabase.from('posts').select('id').eq('user_id', uid);
    if (userPosts && userPosts.length > 0) {
      const postIds = userPosts.map(p => p.id);
      await supabase.from('reports').delete().in('post_id', postIds).like('reason', '[WARN]%');
    }
    alert("User unbanned. System warning logs reset to 0/3.");
  }
  
  loadAdminData();
};

run();
