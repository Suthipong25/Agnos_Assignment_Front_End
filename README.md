# Agnos Patient Intake Realtime Application

A responsive Next.js application for real-time patient intake monitoring. Patients fill out an intake form while staff members watch field values, validation status, and activity state update live on a matching staff dashboard.

---

## Key Features

- **Realtime form mirroring**: Patient field changes and validation state are broadcast to the staff dashboard.
- **Patient intake form**:
  - Personal details: First name, middle name, last name, date of birth, gender.
  - Contact and preferences: Phone number, email, address, preferred language, nationality.
  - Optional information: Emergency contact name, emergency contact relationship, religion.
- **Client-side validation**:
  - Required fields: First name, last name, date of birth, gender, phone number, address, preferred language, nationality.
  - Optional email must be valid when provided.
  - Phone number must match supported local or international formats.
  - Emergency contact name and relationship must be completed together if either one is provided.
- **Staff status tracking**:
  - `No activity`: Staff has not received patient activity for the session.
  - `Typing / In progress`: Recent patient updates are being received.
  - `Idle`: No patient updates have arrived for more than 15 seconds.
  - `Submitted`: The patient submitted a valid intake form.
- **Realtime engine**:
  - Supabase Realtime Broadcast is used when `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are configured.
  - Browser `BroadcastChannel` is also used as a local tab-to-tab fallback for same-browser testing.
  - Staff can request the latest active patient state with a `state_request` message when the staff view opens after the patient view.
- **Responsive UI**: Built with Tailwind CSS and Lucide React for mobile and desktop layouts.

---

## Tech Stack

- **Framework**: Next.js 15 App Router
- **UI**: React 19
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **Realtime communication**: Supabase Realtime Broadcast and browser `BroadcastChannel`

---

## Getting Started

### Prerequisites

- Node.js v18 or newer
- npm

### 1. Install dependencies

```bash
npm install
```

On Windows PowerShell, if script execution blocks `npm`, use:

```bash
npm.cmd install
```

### 2. Configure environment variables

Copy `.env.example` to `.env.local` and add Supabase credentials if you want cross-device realtime sync:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Without Supabase credentials, same-browser tab-to-tab sync still works through `BroadcastChannel`.

### 3. Run the development server

```bash
npm run dev
```

The application starts at `http://localhost:3000`.

---

## Usage

Open both views with the same `sessionId` query parameter:

1. Patient view: [http://localhost:3000/patient?sessionId=demo](http://localhost:3000/patient?sessionId=demo)
2. Staff view: [http://localhost:3000/staff?sessionId=demo](http://localhost:3000/staff?sessionId=demo)

Both pages must share the exact same `sessionId` to sync on the same realtime channel.

---

## Project Structure

```text
Agnos_Assignment_front_end/
|-- app/
|   |-- patient/       # Patient form route and client container
|   |-- staff/         # Staff dashboard route and client container
|   |-- globals.css    # Global Tailwind and base styles
|   |-- layout.tsx     # Root layout
|   `-- page.tsx       # Home route
|-- components/        # Shared UI components
|   |-- Field.tsx      # Patient form controls
|   |-- PageShell.tsx  # Shared page layout and session navigation
|   |-- Section.tsx    # Form section wrapper
|   |-- StaffField.tsx # Read-only staff field display
|   `-- StatusBadge.tsx
|-- docs/
|   `-- DEVELOPMENT_PLAN.md
|-- lib/
|   |-- patient.ts     # Data types, defaults, validation, labels
|   |-- realtime.ts    # Supabase and BroadcastChannel protocol
|   `-- time.ts        # Timestamp formatting helpers
|-- .env.example
`-- README.md
```

---

## Realtime Protocol Flow

1. Both views connect to `patient-intake:{sessionId}`.
2. The patient view publishes a full `PatientSessionState` with the `patient_state` event after edits, heartbeat updates, and valid submission.
3. The staff view listens for `patient_state` and replaces its visible session state with the latest payload.
4. When the staff view opens, it sends `state_request`; an active patient view responds by republishing its latest state.
5. The staff view derives `Idle` locally when the latest update is more than 15 seconds old.

Patient intake data is not persisted to browser storage by the realtime layer. If no active patient view responds and no new update arrives, the staff view remains in the no-activity state.

---

## Available Scripts

- `npm run dev` - Launch development server
- `npm run build` - Build production bundle
- `npm run start` - Run production build locally
- `npm run lint` - Run ESLint
