# MineSocial

MineSocial is a full social-style web app for posting, reacting, user profiles, and admin moderation. The project is built with Vite, TypeScript, and Supabase, and is designed as a clean, dark-themed social hub with a Minecraft-inspired interface.

Repository: https://github.com/Shahadah-studs/MineSocial

Created and developed by: Shahadah-studs

This project was built by Shahadah-studs alone, from the frontend design to the interaction logic and app structure.

## Repository Information

- Repository name: Shahadah-studs/MineSocial
- Repository ID: 1443068365
- Primary project purpose: Social media-style web application
- Project type: Frontend app with Supabase backend integration
- Deployment/config style: Vite app with static HTML pages and TypeScript modules

## Language Composition

The repository language breakdown is:

- HTML
- TypeScript
- CSS 
- JavaScript

## Project Overview

MineSocial includes:

- User sign up and login flow
- Session guard checks for protected pages
- Post creation and feed display
- Emoji reactions on posts
- Reporting posts to admins
- Profile editing with username and avatar URL
- Admin panel for banning/unbanning users
- Admin panel for reviewing reported posts
- Role-based access for owner/admin users
- Banned-user lockout logic

## Features

### Authentication
- Login and sign-up screen located in `login.html`
- Sign-up stores the username in Supabase user metadata
- Login checks if a user is banned before allowing access
- Banned users are signed out and redirected to the login screen with an error message

### Social Feed
- Main feed is in `index.html`
- `src/hub.ts` handles:
  - loading the feed
  - posting content
  - reacting to posts
  - reporting posts
  - showing the current user badge and admin navigation
- Feed posts are ordered by newest first
- User avatars are displayed, or a generated fallback avatar is used when no avatar URL is provided

### Profile
- Profile editing screen is in `profile.html`
- `src/profile.ts` lets users update:
  - username
  - avatar image URL
- After saving, the user is redirected back to the main feed

### Admin Panel
- Admin panel is in `admin.html`
- `src/admin.ts` loads:
  - user list
  - reported posts list
  - ban/unban actions for users
- Owners and admins can access the moderator panel
- Only owner/admin roles are allowed to use admin functions

### Security / Access Control
- `src/client.ts` contains the shared Supabase client setup
- It checks session validity with `checkSessionGuard()`
- It redirects unauthenticated users to the login page
- It also listens for profile bans and signs the user out immediately if they become banned

## Tech Stack

- Vite
- TypeScript
- HTML
- CSS
- Supabase JavaScript client

## Dependencies

The project uses:

- `@supabase/supabase-js` for authentication and database access

Development dependencies:

- `typescript`
- `vite`

## Project Structure

```text
MineSocial/
├── admin.html
├── index.html
├── login.html
├── profile.html
├── package.json
├── tsconfig.json
├── vercel.json
├── vite.config.js
├── src/
│   ├── admin.ts
│   ├── client.ts
│   ├── hub.ts
│   ├── login.ts
│   ├── profanity.ts
│   ├── profile.css
│   ├── profile.ts
│   ├── style.css
│   └── ...
├── svg/
└── README.md
```

## Main Files

### `index.html`
Main social feed page where users post and view content.

### `login.html`
Authentication gate page with login/signup toggling.

### `profile.html`
User profile settings page.

### `admin.html`
Admin moderation dashboard for managing users and reports.

### `src/client.ts`
Supabase setup and session protection logic.

### `src/hub.ts`
Core social feed logic: posting, reactions, reporting, user state.

### `src/login.ts`
Authentication logic and banned-user handling.

### `src/profile.ts`
Profile update logic.

### `src/admin.ts`
Admin moderation logic.

### `src/style.css`
Main visual styling for the app.

### `src/profile.css`
Styling for the profile page.

### `src/profanity.ts`
Contains profanity-related logic or filtering support.

## Setup Instructions

1. Clone the repository:

```bash
git clone https://github.com/Shahadah-studs/MineSocial.git
cd MineSocial
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the project root with your Supabase credentials:

```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

These values are read in `src/client.ts`:

```ts
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
```

4. Start the project:

```bash
npm run dev
```

5. Build for production:

```bash
npm run build
```

6. Preview production build:

```bash
npm run preview
```

## Package Scripts

From `package.json`:

```json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview"
}
```

## Package Information

```json
{
  "name": "cobblestone-posting",
  "private": true,
  "version": "1.0.0",
  "type": "module"
}
```

## Configuration Files

### `vite.config.js`
Used to configure the Vite development server and build behavior.

### `tsconfig.json`
TypeScript compiler configuration.

### `vercel.json`
Deployment configuration for Vercel hosting.

## Notes

- This app uses client-side routing only through static HTML pages.
- Access control is enforced through Supabase session checks and database profile data.
- The interface uses a Minecraft-inspired visual style with dark panels, pixel fonts, and custom UI blocks.
- The project is intentionally built as a lightweight social platform using serverless-style Supabase APIs rather than a full backend service.

## Credits

Developed and designed by Shahadah-studs.

This site was made by Shahadah-studs alone.

## License

No explicit license file was included in the repo at the time of writing. Please check the repository for licensing details before public reuse or distribution.

---

MineSocial is a personal social media project built by Shahadah-studs, created from scratch as a standalone web app experience.
