# Notes App Clone

Full-stack notes app with a Vite + React frontend and a Bun + Express backend. Notes are stored as JSON in `notes/*.md` and served via the API.

## Prerequisites
- Bun v1.2+

## Install
```bash
bun install
```

## Run
Frontend dev server:
```bash
bun run dev
```

Backend API server:
```bash
bun server/app.js
```

The backend serves the built frontend from `dist/` in production.

## Build (static)
```bash
bun run build:static
```

## API
- `GET /api/notes` - list notes
- `GET /api/notes/:id` - fetch a note
- `POST /api/notes` - create a note
- `PUT /api/notes/:id` - update a note
- `DELETE /api/notes/:id` - delete a note
- `GET /api/notes/:id/logs` - git history for a note
- `GET /api/notes/:id/logs/:commit` - fetch note at a specific commit

## Data Model
Each note is stored as JSON in a `.md` file with the shape:
```json
{
  "id": "...",
  "title": "...",
  "content": "...",
  "createdAt": 1700000000000,
  "updatedAt": 1700000000000
}
```

## Config
- `VITE_API_BASE_URL` (optional) - override API base URL for the frontend.
