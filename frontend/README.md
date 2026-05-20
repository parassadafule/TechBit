# TechBit Frontend

React + Vite frontend for TechBit, including feed, search, trends, AI chat, learning path, profile, and notifications.

## 🚀 Features

- Auth-aware routing with protected app pages.
- Session-based login flow via backend OAuth endpoints.
- Feed with filter/sort controls and post creation modal.
- Post detail view with threaded comments.
- Search page with keyword and semantic toggles.
- AI chat page with citation rendering and fallback state handling.
- Learning path page with regenerate and complete-step actions.
- Trends page with source filters and manual refresh.
<!-- Bookmarks removed -->
- Notifications page with live socket updates and read/delete actions.

## Tech Stack

- React 19
- Vite 7
- React Router 7
- TanStack Query 5
- Tailwind CSS 4
- Axios
- Socket.IO client
- react-markdown + react-syntax-highlighter
- Lucide React

## Setup

1. Install dependencies:

```powershell
cd frontend
npm install
```

2. Create environment file:

```powershell
copy .env.example .env
```

3. Update values in `frontend/.env` as needed:

```env
VITE_API_URL=http://localhost:8000/api
VITE_SOCKET_URL=http://localhost:8000
```

The frontend expects cookie-based auth and will call the backend API at `VITE_API_URL`.

4. Start dev server:

```powershell
npm run dev
```

## Available Scripts

- `npm run dev`: start Vite dev server
- `npm run build`: create production build
- `npm run lint`: run ESLint
- `npm run preview`: preview production build locally

To run the dev server with the backend running on port 8000:

```powershell
cd frontend
npm run dev
```

## App Routes

- /login
- /
- /post/:postId
- /search
<!-- /bookmarks removed -->
- /profile and /profile/:userId
- /ai-chat
- /learning
- /trends
- /notifications

## Folder Overview

- src/api: API wrappers grouped by domain
- src/components: reusable UI + feature components
- src/contexts: auth and socket providers
- src/layouts: authenticated shell layout
- src/lib: axios and socket clients
- src/pages: route-level views
- src/utils: formatting and helper utilities

## Backend Contract Notes

- Frontend expects cookie-based auth (withCredentials enabled in Axios).
- Unauthorized API responses redirect to /login.
- Trends UI expects merged multi-source trend payloads.
- AI pages can display fallback responses when local AI services are unavailable.

## Troubleshooting

### Dev server fails to start

- Run npm install again and check package-lock consistency.
- Run npm run lint to identify syntax issues.

### Login loop or unauthorized calls

- Confirm backend is running and CORS/session settings match frontend URL.
- Confirm VITE_API_URL points to the correct backend port.

### Empty trends or stale notifications

- Trigger trend refresh from the Trends page.
- Verify backend socket server and API endpoints are reachable.

## License

MIT
