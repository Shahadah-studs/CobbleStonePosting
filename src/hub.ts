import { supabase, checkSessionGuard } from './client';
import { cleanContentFilter } from './profanity';

let currentProfile: any = null;
let currentLimit = 5; // Loads 5 posts by default


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
    statusTxt.style.color = "#ffff55"; // Yellow while uploading

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch(`https://imgbb.com{IMGBB_API_KEY}`, {
        method: 'POST',
        body: formData
      });
      const result = await response.json();

      if (result.success) {
        // Automatically appends the uploaded image URL onto the text input container
        const uploadedUrl = result.data.url;
        contentInput.value = contentInput.value ? `${contentInput.value} ${uploadedUrl}` : uploadedUrl;
        
        statusTxt.innerText = "[UPLOAD SUCCESS!]";
        statusTxt.style.color = "#55ff55"; // Green success
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

  // SUBMIT FORM EVENT HANDLER
  document.getElementById('post-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const rawText = contentInput.value.trim();
    if (!rawText) return;

    const safeText = cleanContentFilter(rawText);

    await supabase.from('posts').insert({ user_id: currentProfile.id, content: safeText });
    
    // Reset fields and parameters
    contentInput.value = '';
    fileInput.value = '';
    statusTxt.innerText = "[IMAGE: NONE]";
    statusTxt.style.color = "#aaaaaa";
    
    currentLimit = 4; 
    loadFeed();
  });
}

function generateAvatarHTML(username: string, avatarUrl?: string) {
  if (avatarUrl && avatarUrl.trim() !== '') {
    return `<div class="mc-avatar-frame"><img src="${avatarUrl}" class="mc-avatar-img" alt="${username}"></div>`;
  }
  const fallbackColors = ['#3f3f3f', '#7a2222', '#1b5a7a', '#2c6d2c']; 
  const charCodeSum = username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const selectedBgColor = fallbackColors[charCodeSum % fallbackColors.length];
  const firstLetter = username.charAt(0).toUpperCase();

  return `<div class="mc-avatar-frame" style="background-color: ${selectedBgColor};"><span class="mc-avatar-char">${firstLetter}</span></div>`;
}

// LINK PREVIEW ENGINE: Modified to parse and show ImgBB links directly as Image tags
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
  } else if (firstUrl.includes('imgur.com') || firstUrl.includes('ibc.co') || firstUrl.includes('imgBB') || firstUrl.includes('i.ibb.co')) {
    displayTitle = "MINESOCIAL IMAGE";
    themeColor = "#55ff55";
    isDirectImage = true; // Signals the engine to output an actual live image preview pixel block
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
    ${avatarMark}
    <span class="text-xs font-bold text-gray-100 flex items-center">${currentProfile.username} ${crown}</span>
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
            <span class="font-bold flex items-center gap-1.5 ${isBanned ? 'text-red-500 line-through font-mono text-sm' : 'text-gray-100'}">
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

(window as any).triggerLoadMore = () => {
  currentLimit += 5; 
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
