import { supabase, checkSessionGuard } from './client';
import { cleanContentFilter } from './profanity';

let currentProfile: any = null;
let currentLimit = 5;

const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY;

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

  const contentInput = document.getElementById('post-content') as HTMLInputElement;
  const fileInput = document.getElementById('post-file-input') as HTMLInputElement;
  const statusTxt = document.getElementById('upload-status')!;

  fileInput?.addEventListener('change', async () => {
    if (!fileInput.files || fileInput.files.length === 0) return;
    
    const file = fileInput.files[0];
    statusTxt.innerText = "[UPLOADING...]";
    statusTxt.style.color = "#ffff55";

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch(`https://imgbb.com{IMGBB_API_KEY}`, {
        method: 'POST',
        body: formData
      });
      const result = await response.json();

      if (result.success) {
        const uploadedUrl = result.data.url;
        contentInput.value = contentInput.value ? `${contentInput.value} ${uploadedUrl}` : uploadedUrl;
        statusTxt.innerText = "[UPLOAD SUCCESS!]";
        statusTxt.style.color = "#55ff55";
      } else {
        statusTxt.innerText = "[UPLOAD FAILED]";
        statusTxt.style.color = "#ff5555";
        alert("ImgBB Error: " + result.error.message);
      }
    } catch (err) {
      statusTxt.innerText = "[NETWORK ERROR]";
      statusTxt.style.color = "#ff5555";
      console.error(err);
    }
  });

  document.getElementById('post-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const rawText = contentInput.value.trim();
    if (!rawText) return;

    const safeText = cleanContentFilter(rawText);

    await supabase.from('posts').insert({ user_id: currentProfile.id, content: safeText });
    
    contentInput.value = '';
    fileInput.value = '';
    statusTxt.innerText = "[IMAGE: NONE]";
    statusTxt.style.color = "#aaaaaa";
    
    currentLimit = 5; 
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
  let isDirectImage = false;

  if (firstUrl.includes('youtube.com') || firstUrl.includes('youtu.be')) {
    displayTitle = "📺 YOUTUBE VIDEO";
    themeColor = "#ff5555";
  } else if (firstUrl.includes('imgur.com') || firstUrl.includes('ibb.co') || firstUrl.includes('imgBB') || firstUrl.includes('i.ibb.co')) {
    displayTitle = "IMGUR IMAGE";
    themeColor = "#55ff55";
    isDirectImage = true; 
  } else if (firstUrl.includes('namemc.com')) {
    displayTitle = "NAMEMC PLAYER PROFILE";
    themeColor = "#ffaa00";
  }

  return `
    <div class="mc-link-preview" style="border-left: 3px solid ${themeColor};">
      <a href="${firstUrl}" target="_blank" class="mc-link-preview-title" style="color: ${themeColor} !important;">${displayTitle}</a>
      ${isDirectImage ? `<div style="margin-top:0.5rem;"><img src="${firstUrl}" style="max-width:100%; max-height:250px; border:2px solid #141414; image-rendering:pixelated;" alt="Preview"></div>` : ''}
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
        <button id="load-more-btn" onclick="window.triggerLoadMore()" class="btn-primary" style="font-size: 0.75rem; padding: 1rem 2rem;"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-loader preview-icon"><path d="M12 2v4"/><path d="m16.2 7.8 2.9-2.9"/><path d="M18 12h4"/><path d="m16.2 16.2 2.9 2.9"/><path d="M12 18v4"/><path d="m4.9 19.1 2.9-2.9"/><path d="M2 12h4"/><path d="m4.9 4.9 2.9 2.9"/></svg></button>
      </div>
    `;
  }

  container.innerHTML = feedHTML;
}

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
      <h2 style="font-size:0.85rem; margin-bottom:1rem; font-family:'Press Start 2P', monospace;" class="${profile.is_banned ? 'text-red-500 line-through' : 'text-gray-100'}">${profile.username}</h2>
      <p style="font-family:'Press Start 2P', monospace; font-size:0.55rem; color:#aaaaaa; margin:0 0 1.5rem 0;">RANK: ${rankLabel}</p>
      <button onclick="document.getElementById('mc-profile-modal').remove()" class="btn-primary w-full" style="font-size:0.55rem;"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-square-x preview-icon"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg></button>
    </div>
  `;
  document.body.appendChild(modal);
};

(window as any).triggerLoadMore = () => {
  currentLimit += 5; 
  loadFeed();
};

(window as any).reactPost = async (postId: string, emoji: string) => {
  await supabase.from('reactions').upsert({ post_id: postId, user_id: currentProfile.id, emoji });
  loadFeed();
};

(window as any).reportPost = async (postId: string) => {
  const reason = prompt("Enter a comprehensive reason for flagging this content:");
  if (!reason) return;
  await supabase.from('reports').insert({ post_id: postId, reporter_id: currentProfile.id, reason });

  alert("Report sent to admin panel.");
};

run();
