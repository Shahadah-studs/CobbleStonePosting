import { supabase, checkSessionGuard } from './client';
import { cleanContentFilter } from './profanity';

let currentProfile: any = null;
let currentLimit = 4; 

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
    const rawText = contentInput.value.trim();
    
    if (!rawText) return;
    const safeText = cleanContentFilter(rawText);

    await supabase.from('posts').insert({ user_id: currentProfile.id, content: safeText });
    contentInput.value = '';
    currentLimit = 4; 
    loadFeed();
  });
}

function generateAvatarHTML(username: string, avatarUrl?: string, customSize?: string) {
  const sizeStyle = customSize ? `style="width:${customSize};height:${customSize};min-width:${customSize};min-height:${customSize};"` : '';
  if (avatarUrl && avatarUrl.trim() !== '') {
    return `
      <div class="mc-avatar-frame" ${sizeStyle}>
        <img src="${avatarUrl}" class="mc-avatar-img" alt="${username}">
      </div>
    `;
  }

  const fallbackColors = ['#3f3f3f', '#7a2222', '#1b5a7a', '#2c6d2c']; 
  const charCodeSum = username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const selectedBgColor = fallbackColors[charCodeSum % fallbackColors.length];
  const firstLetter = username.charAt(0).toUpperCase();

  return `
    <div class="mc-avatar-frame" ${sizeStyle} style="background-color: ${selectedBgColor};">
      <span class="mc-avatar-char">${firstLetter}</span>
    </div>
  `;
}

function linkPreviewEngine(text: string): string {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const matches = text.match(urlRegex);
  
  if (!matches) return '';

  const firstUrl = matches[0];
  let displayTitle = "🔗 EXTERNAL LINK";
  let themeColor = "#55ffff";

  if (firstUrl.includes('youtube.com') || firstUrl.includes('youtu.be')) {
    displayTitle = "📺 YOUTUBE VIDEO";
    themeColor = "#ff5555";
  } else if (firstUrl.includes('imgur.com')) {
    displayTitle = "IMGUR IMAGE";
    themeColor = "#55ff55";
  } else if (firstUrl.includes('namemc.com')) {
    displayTitle = "NAMEMC PLAYER PROFILE";
    themeColor = "#ffaa00";
  }

  return `
    <div class="mc-link-preview" style="border-left: 3px solid ${themeColor};">
      <a href="${firstUrl}" target="_blank" class="mc-link-preview-title" style="color: ${themeColor} !important;">${displayTitle}</a>
      <span class="mc-link-preview-url">${firstUrl}</span>
    </div>
  `;
}

function renderHeaderBadge() {
  const container = document.getElementById('user-badge-container')!;
  const crown = currentProfile.role === 'owner' ? '<span class="owner-crown text-amber-400 font-bold ml-1">👑</span>' : '';
  const avatarMark = generateAvatarHTML(currentProfile.username, currentProfile.avatar_url);
  
  container.className = "flex items-center gap-2";
  container.innerHTML = `
    <div onclick="window.viewPlayerProfile('${currentProfile.id}')" style="cursor:pointer;" class="flex items-center gap-2">
      ${avatarMark}
      <span class="text-xs font-bold text-gray-100 flex items-center">${currentProfile.username} ${crown}</span>
    </div>
  `;
}

async function loadFeed() {
  const container = document.getElementById('feed-container')!;
  
  const { data: posts, error: postError } = await supabase
    .from('posts')
    .select('*, profiles(*), reactions(*)')
    .order('created_at', { ascending: false })
    .range(0, currentLimit - 1);

  const { count: totalCount } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true });

  if (postError || !posts) return;

  let feedHTML = posts.map(post => {
    const isBanned = post.profiles?.is_banned;
    const nameString = isBanned ? `[BANNED] ${post.profiles?.username}` : `${post.profiles?.username}`;
    const crown = post.profiles?.role === 'owner' && !isBanned ? '👑' : '';
    const avatarLayout = generateAvatarHTML(post.profiles?.username || 'User', post.profiles?.avatar_url);
    const previewLayout = linkPreviewEngine(post.content);

    return `
      <div class="mc-card border-l-4 ${isBanned ? 'border-l-red-600' : 'border-l-amber-500'}">
        <div class="flex justify-between items-start mb-3">
          <div class="flex items-center gap-3">
            ${avatarLayout}
            <span onclick="window.viewPlayerProfile('${post.user_id}')" class="font-bold mc-username-clickable flex items-center gap-1.5 ${isBanned ? 'text-red-500 line-through font-mono text-sm' : 'text-gray-100'}">
              ${nameString} <span class="owner-crown">${crown}</span>
            </span>
          </div>
          <button onclick="window.reportPost('${post.id}')" class="btn-danger !p-1.5 !text-[8px]">⚐</button>
        </div>
        <div class="mb-4 pl-[54px]">
          <p class="text-gray-300 font-medium text-sm whitespace-pre-wrap m-0">${post.content}</p>
          ${previewLayout}
        </div>
        <div class="flex gap-2 border-t border-gray-800 pt-3 mt-3 ml-[54px]">
          ${['🔥', '👍', '💀', '🤯', '🥀'].map(emoji => {
            const count = post.reactions?.filter((r: any) => r.emoji === emoji).length || 0;
            return `<button onclick="window.reactPost('${post.id}', '${emoji}')" class="bg-gray-900 border border-gray-700 px-3 py-1 text-xs text-gray-200 transition flex items-center gap-2">${emoji} <span>${count}</span></button>`;
          }).join('')}
        </div>
      </div>
    `;
  }).join('');

  if (totalCount && currentLimit < totalCount) {
    feedHTML += `
      <div class="flex justify-center mt-6 mb-8">
        <button id="load-more-btn" onclick="window.triggerLoadMore()" class="btn-primary" style="font-size: 0.75rem; padding: 1rem 2rem;">LOAD MORE POSTS</button>
      </div>
    `;
  }

  container.innerHTML = feedHTML;
}

// Pop-up profile view card display window generator
(window as any).viewPlayerProfile = async (userId: string) => {
  const { data: profile, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
  if (error || !profile) return;

  const oldModal = document.getElementById('mc-profile-modal');
  if (oldModal) oldModal.remove();

  const avatarHtml = generateAvatarHTML(profile.username, profile.avatar_url, "48px");
  const rankLabel = profile.role === 'owner' ? '👑 OWNER' : profile.role === 'admin' ? '🛡️ MODERATOR' : '🗡️ PLAYER';

  const modal = document.createElement('div');
  modal.id = 'mc-profile-modal';
  modal.className = 'mc-modal-overlay';
  modal.innerHTML = `
    <div class="mc-modal-card">
      <div class="mc-modal-avatar">${avatarHtml}</div>
      <h2 style="font-size:0.85rem; margin-bottom:1rem;" class="${profile.is_banned ? 'text-red-500 line-through' : 'text-gray-100'}">${profile.username}</h2>
      <p style="font-family:'Press Start 2P', monospace; font-size:0.55rem; color:#aaaaaa; margin:0 0 1.5rem 0;">RANK: ${rankLabel}</p>
      <button onclick="document.getElementById('mc-profile-modal').remove()" class="btn-primary w-full" style="font-size:0.55rem;">CLOSE VIEW</button>
    </div>
  `;
  document.body.appendChild(modal);
};

(window as any).triggerLoadMore = () => {
  currentLimit += 4; // Steps down by adding 4 extra rows per button click
  loadFeed();
};

(window as any).reactPost = async (postId: string, emoji: string) => {
  await supabase.from('reactions').upsert({ post_id: postId, user_id: currentProfile.id, emoji });
  loadFeed();
};

(window as any).reportPost = async (postId: string) => {
  const reason = prompt("Enter an actual reason for flagging this content:");
  if (!reason) return;
  await supabase.from('reports').insert({ post_id: postId, reporter_id: currentProfile.id, reason });
  alert("Report sent to admin panel.");
};

run();
