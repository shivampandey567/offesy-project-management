# Offesy

**Real-time, AI-powered project management platform**, live at [offesy.in](https://offesy.in)

[![Offesy](https://raw.githubusercontent.com/shivampandey567/YOUR-DEMO-REPO/main/Screenshots/offesy-screenshot-1.png)](https://www.linkedin.com/posts/shivam-pandey-b8078a358_buildinpublic-nextjs-typescript-ugcPost-7484473493233803264-3b2o/)

Screenshots and walkthrough: [Demo repo](https://github.com/shivampandey567/YOUR-DEMO-REPO)

## Features

- **Auth:** Clerk sign up/sign in, sessions, protected routes
- **Workspaces:** multiple workspaces, email invites, Admin and Member roles
- **Teams:** teams inside workspaces, member management
- **Projects and Issues:** status, priority, labels, progress tracking, sub-issues
- **Collaboration:** real-time comments, reactions, file and image attachments
- **Notifications:** real-time updates (Pusher) and email (Resend)
- **AI Assistant:** Gemini-powered project Q&A and summaries using RAG with embeddings

## Tech Stack

Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui, MongoDB Atlas + Mongoose, Clerk, Pusher, Resend, Vercel Blob, Gemini API, deployed on Vercel.

## Run locally

```bash
git clone https://github.com/shivampandey567/offesy.git
cd offesy
npm install
cp .env.example .env.local   # add your keys
npm run dev
```

Open http://localhost:3000

## Environment variables

MongoDB URI, Clerk keys, Pusher keys, Resend API key, Gemini API key, Vercel Blob token. See `.env.example`.
