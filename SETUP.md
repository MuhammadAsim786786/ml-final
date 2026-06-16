# DermaScan — Setup

AI-assisted skin disease classification dashboard (Next.js 16 + Supabase).
The UI classifies an uploaded image across the **7 disease classes** from the
project dataset.

## 1. Install

```bash
npm install
```

## 2. Create a Supabase project

1. Go to <https://supabase.com> → New project.
2. In **SQL Editor**, paste and run [`supabase/schema.sql`](supabase/schema.sql).
   This creates the `profiles` and `predictions` tables (with row-level security),
   the private `scans` storage bucket, and the signup trigger.
3. In **Authentication → Providers → Email**, turn **off "Confirm email"** so new
   users can sign in immediately (demo-friendly). Leave it on if you prefer the
   email-confirmation flow.

## 3. Configure environment

```bash
cp .env.local.example .env.local
```

Fill in from **Project Settings → API**:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `INFERENCE_API_URL` — *optional*. Leave blank to use the built-in **mock**
  classifier (great for demos). Set it to your hosted PyTorch endpoint to use the
  real model — no UI changes needed.

## 4. Run

```bash
npm run dev
```

Open <http://localhost:3000>. You'll land on the login screen → sign up → you're
taken to the dashboard.

## Connecting the real model later

The integration point is `src/lib/inference/predict.js`. When `INFERENCE_API_URL`
is set, the app POSTs the image as multipart `file` and expects JSON like:

```json
{ "scores": { "eczema": 0.81, "psoriasis": 0.09, "ringworm": 0.04, "...": 0.0 } }
```

(or `{ "predictions": [{ "id": "eczema", "score": 0.81 }, ...] }`). Class ids match
`src/lib/constants/diseases.js`.

## Structure

- `src/app/(auth)` — login / signup (entry point)
- `src/app/(app)` — protected dashboard, detect, history, profile
- `src/app/api/predict` — stateless classification endpoint
- `src/components` — `ui/` (shadcn), plus `auth/ detect/ dashboard/ history/ profile/ layout/ theme/`
- `src/lib` — `supabase/ actions/ data/ inference/ constants/`
- `src/proxy.js` — route protection (Next.js 16 renamed Middleware → Proxy)
