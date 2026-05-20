# TechBit

TechBit is a full-stack developer platform for sharing technical posts, discovering trends, and using AI-assisted summarization, search, and learning paths.

## Current Implementation

- Backend API with Express, MongoDB, Passport OAuth, and Socket.IO.
- Frontend app with React, Vite, TanStack Query, and React Router.
- Post workflows: manual post creation, URL-based post generation, likes, shares, comments.
- AI workflows: summarization, multimodal summarization, retrieval-augmented generation (RAG) query responses, recommendations and developer briefing endpoints.
- Personalized learning paths with regenerate and step completion flows.
- Trend ingestion from GitHub, Stack Overflow, Reddit, Dev.to, and Hacker News.

## Repository Structure

- backend: API server, business services, MongoDB models, cron jobs, socket handlers.
- frontend: React application, pages, shared UI components, API client, auth/socket contexts.

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Ollama (recommended for full AI features)

### 1. Install Dependencies

Install dependencies for both services:

```powershell
cd backend
npm install
cd ../frontend
npm install
```

### 2. Configure Environment

- Copy `backend/.env.example` to `backend/.env` and `frontend/.env.example` to `frontend/.env`.

Important env values:

- Backend: `MONGODB_URI`, `SESSION_SECRET`, OAuth keys, `OLLAMA_BASE_URL`, `FRONTEND_URL`.
- Frontend: `VITE_API_URL`, `VITE_SOCKET_URL`.

### 3. Run Locally

Backend (dev with auto-reload):

```powershell
cd backend
npm run dev
```

Backend production-like:

```powershell
npm start
```

Frontend (Vite dev server):

```powershell
cd frontend
npm run dev
```

## Ports and URLs

- Backend default port: 8000 when `PORT` is unset.
- Frontend Vite default port: 5173.
- Ensure `VITE_API_URL` in the frontend points to the backend API (e.g. `http://localhost:8000/api`).

## Key Product Areas

- Authentication: Google and GitHub OAuth with session cookies.
- Feed: ranked posts with type and tag filtering.
- Search: text and semantic retrieval paths.
- AI Chat: retrieval-backed responses with citations/fallback handling.
- Trends: source-specific and all-source trend views.
- Learning Path: adaptive roadmap generation based on profile and activity.
- Notifications: read, mark all read, delete.

## Additional Docs

- Backend details: [backend/README.md](backend/README.md#L1)
- Frontend details: [frontend/README.md](frontend/README.md#L1)

## License

MIT
