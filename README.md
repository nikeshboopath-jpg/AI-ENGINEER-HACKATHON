# AG — Angry Genius

A focused study assistant built with Next.js, TypeScript, Tailwind CSS, Framer Motion, and Convex-ready architecture. This demo is kept minimal while still providing a polished landing page and dashboard experience.

## Features

- Dark futuristic UI with red glowing accents
- Full frontend and backend integration with API routes
- Uploads, exam predictions, tutor chat, flashcards, and quiz generation
- OpenAI-backed responses with fallback mock data when no key is configured
- Simple local data store for uploaded documents and generated content

## Pages included

- `/` — Landing page
- `/dashboard` — Dashboard overview
- `/uploads` — Document upload center
- `/exam-predictor` — Topic prediction view
- `/tutor` — Angry Professor chat interface
- `/flashcards` — Generated study cards
- `/quiz` — Auto-generated practice quiz
- `/settings` — App preferences

## Run locally

1. Install dependencies:

```bash
npm install
```

2. Copy environment file:

```bash
cp .env.example .env.local
```

3. Add your API keys in `.env.local`.

4. Start the dev server:

```bash
npm run dev
```

5. Open the app at `http://localhost:3000`.

## Notes

- This repository keeps only the necessary UI and page structure.
- Empty API folders and Convex mocks were removed for simplicity.
- Extend the dashboard with your own upload and AI integrations as needed.
