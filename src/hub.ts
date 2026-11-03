import { supabase, checkSessionGuard } from './client';

let currentProfile: any = null;

async function run() {
  currentProfile = await checkSessionGuard();
  if (!currentProfile) return;

  renderHeaderBadge();
  loadFeed();

  if (currentProfile.role === 'owner' || currentProfile.role === 'admin') {
    document.getElementById('nav-admin-btn')?.classList.remove('hidden');
  }

  document.getElementById('logout-btn')?.addEventListener('click', async () => {
    await supabase.auth.signOut();
    window.location.href = '/login.html';
  });

  document.getElementById('post-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const contentInput = document.getElementById('post-content') as HTMLInputElement;
    if (!contentInput.value.trim()) return;

    await supabase.from('posts').insert({ user_id: currentProfile.id, content: contentInput.value });
    contentInput.value = '';
    loadFeed();
  });
}

function renderHeaderBadge() {
  const container = document.getElementById('user-badge-container')!;
  const crown = currentProfile.role === 'owner' ? '<span class="owner-crown text-amber-400 font-bold ml-1">👑 OWNER</span>' : '';
  container.innerHTML = `<span class="text-sm font-semibold text-gray-100 flex items-center">${currentProfile.username} ${crown}</span>`;
}

async function loadFeed() {
  const container = document.getElementById('feed-container')!;
  const { data: posts } = await supabase.from('posts').select('*, profiles(*), reactions(*)').order('created_at', { ascending: false });

  if (!posts) return;

  container.innerHTML = posts.map(post => {
    const isBanned = post.profiles?.is_banned;
    const nameString = isBanned ? `[BANNED] ${post.profiles?.username}` : `${post.profiles?.username}`;
    const crown = post.profiles?.role === 'owner' && !isBanned ? '👑' : '';

    return `
      <div class="glass-panel p-6 rounded-2xl relative border-l-4 ${isBanned ? 'border-l-red-600' : 'border-l-amber-500'}">
        <div class="flex justify-between items-center mb-3">
          <span class="font-bold flex items-center gap-1.5 ${isBanned ? 'text-red-500 line-through font-mono text-sm' : 'text-gray-100'}">
            ${nameString} <span class="owner-crown">${crown}</span>
          </span>
          <button onclick="window.reportPost('${post.id}')" class="text-xs bg-red-950/40 hover:bg-red-950 border border-red-900/60 px-2.5 py-1 rounded-md text-red-400 transition flex items-center gap-1 font-medium">⚠️ Flag</button>
        </div>
        <p class="text-gray-300 leading-relaxed mb-4 text-sm whitespace-pre-wrap">${post.content}</p>
        <div class="flex gap-2 border-t border-gray-800/60 pt-3">
          ${['🔥', '👍', '💀'].map(emoji => {
            const count = post.reactions?.filter((r: any) => r.emoji === emoji).length || 0;
            return `<button onclick="window.reactPost('${post.id}', '${emoji}')" class="bg-gray-800/50 hover:bg-gray-800 border border-gray-700/60 px-3 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-2">${emoji} <span>${count}</span></button>`;
          }).join('')}
        </div>
      </div>
    `;
  }).join('');
}

(window as any).reactPost = async (postId: string, emoji: string) => {
  await supabase.from('reactions').upsert({ post_id: postId, user_id: currentProfile.id, emoji });
  loadFeed();
};

(window as any).reportPost = async (postId: string) => {
  const reason = prompt("Enter a comprehensive reason for flagging this content:");
  if (!reason) return;
  await supabase.from('reports').insert({ post_id: postId, reporter_id: currentProfile.id, reason });
  alert("Report transmitted to admin panel.");
};

run();

