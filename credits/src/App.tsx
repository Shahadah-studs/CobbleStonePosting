export default function App() {
  const creditsList = [
    {
      name: "Shahadah Studios Elite",
      role: "Lead developing studio of the site",
      description: "Designed, built, and coded the entire interactive MineSocial stucture!",
      color: "#fbbf24" // Gold
    },
    {
      name: "Supabase Postgres",
      role: "Backend Database & Real-Time Socket Layer",
      description: "Powers secure Row Level Security (RLS) policies, accounts authentication, and instant admin actions safety.",
      color: "#55ff55" // Emerald Green
    },
    {
      name: "imgBB Storage API",
      role: "Serverless Media Asset Uploading",
      description: "Hosts free player-uploaded binary image data screenshots.",
      color: "#55ffff" // Diamond Blue
    },
    {
      name: "Lucide icons",
      role: "Vector Graphics Interface Assets",
      description: "Supplies clean, responsive icon tokens used to build interactive layout(s) & navigation icons.",
      color: "#ff55ff" // Purpur Pink
    }
  ];

  return `
    <div class="mc-panel w-full shadow-2xl">
      <div class="flex justify-between items-center mb-6 border-b border-gray-100/10 pb-4">
        <div>
          <h1 class="text-2xl font-black text-amber-500 tracking-tight m-0">CREDITS</h1>
          <p style="font-family:'Press Start 2P', monospace; font-size:0.55rem; color:#aaaaaa; margin:4px 0 0 0;">Credits to the items and developers</p>
        </div>
        <a href="../index.html" class="btn-primary" style="font-size:0.65rem;"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-chevron-right preview-icon"><circle cx="12" cy="12" r="10"/><path d="m10 8 4 4-4 4"/></svg></a>
      </div>

      <div class="max-w-4xl mx-auto xp-divider"></div>

      <div class="space-y-4" style="margin-top: 1.5rem;">
        ${creditsList.map(item => `
          <div class="mc-card" style="border-left: 4px solid ${item.color}; padding: 1.25rem; margin-bottom: 1rem;">
            <div class="flex justify-between items-center mb-1">
              <h2 style="font-size: 0.85rem; color: ${item.color}; margin: 0;">${item.name}</h2>
              <span style="font-family:'Press Start 2P', monospace; font-size: 0.5rem; color: #888888;">${item.role}</span>
            </div>
            <p class="text-gray-300 font-medium text-sm m-0 style='margin-top:0.5rem;'">${item.description}</p>
          </div>
        `).join('')}
      </div>

      <div class="max-w-4xl mx-auto xp-divider" style="margin-top: 1.5rem;"></div>
      <p style="font-family:'Press Start 2P', monospace; font-size:0.45rem; color:#555555; text-align:center; margin:1rem 0 0 0;">MINESOCIAL ECOSYSTEM • CORE VERSION 1.0.0 APPROVED</p>
    </div>
  `;
}
