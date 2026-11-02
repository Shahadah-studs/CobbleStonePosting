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
  const crown = currentProfile.role === 'owner' ? '👑 OWNER CROWN' : '';
  container.innerHTML = `<span class="font-bold text-amber-500">${currentProfile.username} ${crown}</span>`;
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
      <div class="bg-gray-900 border border-gray-800 p-5 rounded-xl">
        <div class="flex justify-between items-center mb-2">
          <span class="font-bold ${isBanned ? 'text-red-500 line-through' : 'text-gray-100'}">${nameString} ${crown}</span>
          <button onclick="window.reportPost('${post.id}')" class="text-xs text-red-400 hover:underline">⚠️ Report</button>
        </div>
        <p class="text-gray-300 mb-4">${post.content}</p>
        <div class="flex gap-2">
          ${['🔥', '👍', '💀'].map(emoji => {
            const count = post.reactions?.filter((r: any) => r.emoji === emoji).length || 0;
            return `<button onclick="window.reactPost('${post.id}', '${emoji}')" class="bg-gray-800 px-3 py-1 rounded-lg text-sm">${emoji} ${count}</button>`;
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
  const reason = prompt("Enter report reason:");
  if (!reason) return;
  await supabase.from('reports').insert({ post_id: postId, reporter_id: currentProfile.id, reason });
  alert("Report transmitted to admin panel.");
};

run();
