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
          <button onclick="window.reportPost('${post.id}')" class="btn-danger !p-1.5 !text-[8px]"><svg viewBox="0 0 24 24" version="1.1" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <style type="text/css"> .st0{display:none;} .st1{display:inline;} .st2{opacity:0.2;fill:none;stroke:#000000;stroke-width:5.000000e-02;stroke-miterlimit:10;} </style> <g class="st0" id="grid_system"></g> <g id="_icons"> <path d="M17.7,4.7c-1.4-0.7-3-0.7-4.4,0c-0.8,0.4-1.8,0.4-2.6,0l-0.4-0.2C9.3,4,8.1,3.9,6.9,4.1L6.2,4.3C5,4.6,4.2,5.6,4,6.9 C4,6.9,4,7,4,7v0.2v6.4V19c0,0.6,0.4,1,1,1s1-0.4,1-1v-4.6L7.4,14c0.7-0.2,1.4-0.1,2,0.2l0.5,0.2c0.7,0.3,1.4,0.5,2.2,0.5 c0.8,0,1.5-0.2,2.3-0.5c0.8-0.4,1.8-0.4,2.6,0h0c0.7,0.3,1.5,0.3,2.1-0.1c0.7-0.4,1.1-1.1,1.1-1.9v-4C20,6.9,19.1,5.5,17.7,4.7z M18,12.5c0,0.1-0.1,0.1-0.1,0.2c-0.1,0-0.1,0-0.2,0c-1.4-0.7-3-0.7-4.4,0c-0.8,0.4-1.8,0.4-2.6,0l-0.5-0.2 c-0.7-0.3-1.4-0.5-2.2-0.5c-0.4,0-0.8,0-1.2,0.1L6,12.3V7.2c0-0.4,0.3-0.8,0.7-0.9l0.7-0.2c0.7-0.2,1.4-0.1,2,0.2l0.4,0.2 c1.4,0.7,3,0.7,4.4,0c0.8-0.4,1.8-0.4,2.6,0c0.8,0.4,1.2,1.2,1.2,2V12.5z"></path> </g> </g></svg></button>
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
