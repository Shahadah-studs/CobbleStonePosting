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

function generateAvatarHTML(username: string, avatarUrl?: string) {
  if (avatarUrl && avatarUrl.trim() !== '') {
    return `
      <div class="mc-avatar-frame">
        <img src="${avatarUrl}" class="mc-avatar-img" alt="${username}">
      </div>
    `;
  }

  // Generate a distinct block color background matrix based on username strings
  const fallbackColors = ['#3f3f3f', '#7a2222', '#1b5a7a', '#2c6d2c']; 
  const charCodeSum = username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const selectedBgColor = fallbackColors[charCodeSum % fallbackColors.length];
  const firstLetter = username.charAt(0).toUpperCase();

  return `
    <div class="mc-avatar-frame" style="background-color: ${selectedBgColor};">
      <span class="mc-avatar-char">${firstLetter}</span>
    </div>
  `;
}

function renderHeaderBadge() {
  const container = document.getElementById('user-badge-container')!;
  const crown = currentProfile.role === 'owner' ? '<span class="owner-crown text-amber-400 font-bold ml-1">👑</span>' : '';
  const avatarMark = generateAvatarHTML(currentProfile.username, currentProfile.avatar_url);
  
  container.className = "flex items-center gap-2";
  container.innerHTML = `
    ${avatarMark}
    <span class="text-xs font-bold text-gray-100 flex items-center">${currentProfile.username} ${crown}</span>
  `;
}

async function loadFeed() {
  const container = document.getElementById('feed-container')!;
  const { data: posts } = await supabase.from('posts').select('*, profiles(*), reactions(*)').order('created_at', { ascending: false });

  if (!posts) return;

  // Loops and wraps EACH post inside its own independent box layout container block (.mc-card)
  container.innerHTML = posts.map(post => {
    const isBanned = post.profiles?.is_banned;
    const nameString = isBanned ? `[BANNED] ${post.profiles?.username}` : `${post.profiles?.username}`;
    const crown = post.profiles?.role === 'owner' && !isBanned ? '👑' : '';
    
    // Compute block pixel graphics fallback metadata
    const avatarLayout = generateAvatarHTML(post.profiles?.username || 'User', post.profiles?.avatar_url);

    return `
      <div class="mc-card border-l-4 ${isBanned ? 'border-l-red-600' : 'border-l-amber-500'}">
        <div class="flex justify-between items-start mb-3">
          <div class="flex items-center gap-3">
            ${avatarLayout}
            <span class="font-bold flex items-center gap-1.5 ${isBanned ? 'text-red-500 line-through font-mono text-sm' : 'text-gray-100'}">
              ${nameString} <span class="owner-crown">${crown}</span>
            </span>
          </div>
          <button onclick="window.reportPost('${post.id}')" class="btn-danger !p-1.5 !text-[8px]">⚐</button>
        </div>
        <div class="mb-4 pl-[54px]">
          <p class="text-gray-300 font-medium text-sm whitespace-pre-wrap m-0">${post.content}</p>
        </div>
        <div class="flex gap-2 border-t border-gray-800 pt-3 mt-3 ml-[54px]">
          ${['🔥', '👍', '💀', '🤯'].map(emoji => {
            const count = post.reactions?.filter((r: any) => r.emoji === emoji).length || 0;
            return `<button onclick="window.reactPost('${post.id}', '${emoji}')" class="bg-gray-900 border border-gray-700 px-3 py-1 text-xs text-gray-200 transition flex items-center gap-2">${emoji} <span>${count}</span></button>`;
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
  const reason = prompt("Enter a actual reason for flagging this content:");
  if (!reason) return;
  await supabase.from('reports').insert({ post_id: postId, reporter_id: currentProfile.id, reason });
  alert("Report transmitted to admin panel.");
};

run();
