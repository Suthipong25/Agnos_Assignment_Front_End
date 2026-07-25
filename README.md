# Agnos Patient Intake Realtime App

A responsive Next.js patient intake system for the Agnos front-end assignment. Patients complete a registration form while staff monitor the same session in real time.

## Features

- Patient form with required and optional intake fields.
- Client-side validation for required fields, phone numbers, email, and emergency contact consistency.
- Staff dashboard that mirrors patient input immediately.
- Realtime status for no activity, typing/in progress, idle, and submitted states.
- Responsive layouts for mobile, tablet, and desktop.
- Supabase Realtime Broadcast support with a local `BroadcastChannel` fallback for same-browser local testing.

## Tech Stack

- Next.js App Router
- TypeScript
- TailwindCSS
- Supabase Realtime Broadcast
- Lucide React icons

## Setup

Install dependencies:

```bash
npm.cmd install
```

Create an environment file:

```bash
copy .env.example .env.local
```

Add Supabase project values to `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Run locally:

```bash
npm.cmd run dev
```

Open:

- Patient form: `http://localhost:3000/patient?sessionId=demo`
- Staff view: `http://localhost:3000/staff?sessionId=demo`

Use the same `sessionId` in both URLs to sync the session.

## Scripts

```bash
npm.cmd run dev
npm.cmd run lint
npm.cmd run build
npm.cmd run start
```

On Windows PowerShell, `npm` may be blocked by execution policy. Use `npm.cmd` as shown above.

## Deployment

Deploy the project to Vercel, Netlify, or another Next.js-compatible frontend host. Configure these environment variables in the hosting dashboard:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

No database table is required for the first version because the app uses Supabase Realtime Broadcast channels instead of persistent storage.

## Project Structure

```text
app/
  patient/          Patient form route and client container
  staff/            Staff dashboard route and client container
components/         Reusable form, layout, status, and display components
lib/                Shared patient types, validation, realtime, and time utilities
docs/               Planning and architecture documentation
```

## Realtime Flow

1. The patient page reads `sessionId` from the URL.
2. The patient page validates local form state and publishes a `PatientSessionState` payload to `patient-intake:{sessionId}`.
3. Supabase Broadcast delivers the payload to subscribed staff views.
4. The staff view renders the latest payload and derives idle state when updates stop for more than 15 seconds.
5. On submit, the patient page publishes a final `submitted` state with `submittedAt`.

For local testing without Supabase credentials, both pages also use `BroadcastChannel` when opened in the same browser profile.
