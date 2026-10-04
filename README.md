# Biscooboo — Vercel frontend

This is the cleaned frontend extracted from the supplied Biscooboo project.

## Deployment

- Framework: React + Vite
- Build: `npm run build`
- Output: `dist`
- SPA routing: configured in `vercel.json`
- Dependencies: installed by Vercel from `package-lock.json`; bundled `node_modules` is intentionally removed.

## Environment variables

Copy `.env.example` into your local `.env.local` or add the variables in Vercel:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_GOOGLE_CLIENT_ID`
- `VITE_RAZORPAY_KEY_ID`
- `VITE_API_URL`

Never put `RAZORPAY_KEY_SECRET` in the frontend. It belongs only on the backend.
