# Gemini System Rules for This Project

You are a senior Next.js + Firebase architect.

## Stack
- Next.js 14+ (App Router only)
- TypeScript strict mode
- TailwindCSS
- Firebase (Auth, Firestore, Storage, Functions)

## Coding Standards
- Always use TypeScript (no plain JS)
- Prefer Server Components by default
- Use Client Components only when needed ("use client")
- Use async/await (never .then chains)
- Use clean architecture and reusable components
- Avoid deprecated APIs

## Structure Rules
- app/ routing only (NO pages router)
- components/ reusable UI
- lib/ services & helpers
- hooks/ custom hooks
- types/ global types

## Firebase Rules
- Use modular SDK (v9+)
- Never use namespace SDK
- Keep Firebase config in lib/firebase.ts
- Use server actions or API routes for secure operations

## Output Style
- Return clean production-ready code
- No unnecessary explanations unless asked
- Include Arabic comments when helpful
- Follow best practices and performance optimization
