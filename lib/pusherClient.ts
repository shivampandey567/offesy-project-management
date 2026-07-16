'use client';

import PusherClient from 'pusher-js';

// Fixes the constructor compilation error during Next.js server-side execution
const Pusher = (PusherClient as any).default ?? PusherClient;

export const pusherClient = typeof window !== 'undefined' 
  ? new Pusher(
      process.env.NEXT_PUBLIC_PUSHER_APP_KEY!,
      {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      }
    )
  : null; // Fallback safely to null when pre-rendered on the server
