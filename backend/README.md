# TechBit Backend

Express + MongoDB backend that powers authentication, feeds, trends, AI endpoints, search, learning paths, and notifications.

## Features

- Session-based OAuth authentication with Google and GitHub.
- Post lifecycle: create, URL import, update, delete, like, share.
- Feed ranking pipeline with relevance and trend boosts.
- Comments and notifications with Socket.IO event support.
- Search APIs for text, tag filtering, and related content retrieval.
- AI endpoints for summarize, multimodal summarize, query, recommendations, and developer briefing.
- Learning path generation/regeneration and step completion tracking.
- Trend ingestion and scoring from GitHub, Stack Overflow, Reddit, Dev.to, and Hacker News.
- Scheduled jobs for trend refresh and learning path maintenance.

## Tech Stack

- Node.js, Express, Mongoose
- Passport (Google/GitHub OAuth)
- LangChain + Ollama integration
- Axios + Cheerio for external content fetching
- Socket.IO
- node-cron
- Helmet, express-rate-limit, express-validator

## Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Ollama running locally for full AI behavior (fallbacks exist when unavailable)

## Setup

1. Install dependencies:

```powershell
cd backend
npm install
```

2. Create environment file:

```powershell
copy .env.example .env
```

3. Set required variables in `backend/.env`:

- `MONGODB_URI`
- `SESSION_SECRET`
- OAuth keys: `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_CALLBACK_URL`
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` / `GITHUB_CALLBACK_URL`
- `FRONTEND_URL`

Optional but recommended:

- `OLLAMA_BASE_URL`
- `OLLAMA_CHAT_MODEL`
- `OLLAMA_EMBEDDING_MODEL`
- `STACKEXCHANGE_KEY`
- `TREND_FETCH_INTERVAL`
- `LEARNING_PATH_REGEN_INTERVAL`

4. Seed development data (optional):

```powershell
npm run seed
```

5. Run tests (project includes Jest + Supertest):

```powershell
npm test
```

## Run

Development:

```powershell
npm run dev
```

Production-like:

```powershell
npm start
```

Default port in current server implementation: 8000 when `PORT` is unset.

## API Surface

Base API path: /api (examples below assume `VITE_API_URL` or direct calls point to this path)

### Health

- GET /api/health

### Auth

- GET /api/auth/google
- GET /api/auth/google/callback
- GET /api/auth/github
- GET /api/auth/github/callback
- POST /api/auth/logout
- GET /api/auth/me
- GET /api/auth/status

### Users

- GET /api/users/profile/:id?
- PUT /api/users/profile
- GET /api/users/activity
- POST /api/users/activity
- GET /api/users/suggested
<!-- Bookmarks endpoints removed -->

### Posts

- POST /api/posts/upload
- POST /api/posts
- GET /api/posts/feed
- GET /api/posts/:id
- PUT /api/posts/:id
- DELETE /api/posts/:id
- POST /api/posts/:id/like
- POST /api/posts/:id/share

### Feed (ranked)

- GET /api/feed

### Search

- GET /api/search
- GET /api/search/tags
- GET /api/search/related/:id

### Comments

- GET /api/comments/:postId
- POST /api/comments/:postId
- PUT /api/comments/:id
- DELETE /api/comments/:id

### AI

- POST /api/ai/summarize
- POST /api/ai/summarize-multimodal
- POST /api/ai/query
- GET /api/ai/recommendations
- GET /api/ai/briefing

### Learning Path

- GET /api/learning-path
- POST /api/learning-path/regenerate
- POST /api/learning-path/:pathId/complete/:step

### Trends

- GET /api/trends
- GET /api/trends/refresh

### Notifications

- GET /api/notifications
- PUT /api/notifications/:id/read
- PUT /api/notifications/read-all
- DELETE /api/notifications/:id

## Directory Overview

- src/config: DB and Passport setup
- src/controllers: Request handlers
- src/middleware: Auth, validation, error handling, rate limiting
- src/models: Mongoose schemas
- src/routes: API route bindings
- src/services: Core business logic
- src/jobs: Scheduled jobs
- src/socket: Socket server and emit helpers
- src/scripts: Seed script
- src/utils: Logging and embedding utilities

## Cron Jobs

- Trend refresh: interval from `TREND_FETCH_INTERVAL` (default every 30 minutes)
- Learning path maintenance: interval from `LEARNING_PATH_REGEN_INTERVAL` (default daily)

## Logs

Winston outputs to:

- `logs/error.log`
- `logs/combined.log`

## Troubleshooting

### Backend fails on startup

- Verify MongoDB connection string and availability.
- Verify required OAuth env vars are set.
- Check logs/error.log for stack traces.

### AI responses fallback or fail

- Ensure Ollama is reachable at OLLAMA_BASE_URL.
- Ensure configured chat and embedding models are installed.

### Trend refresh returns partial data

- External APIs can rate-limit or throttle requests.
- Add STACKEXCHANGE_KEY to improve Stack Overflow quota.

## License

MIT
