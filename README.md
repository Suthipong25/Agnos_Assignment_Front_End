# Agnos Patient Intake Realtime Application

A responsive Next.js web application designed for real-time patient intake monitoring. As patients fill out their registration form, medical staff can observe field-level entries, validation status, and user activity in real time on a live dashboard.

---

## 🌟 Key Features

- **Realtime Form Mirroring**: Field changes, focus events, and validation status are broadcast instantly to the staff dashboard.
- **Comprehensive Patient Intake Form**:
  - **Personal Details**: Title, First Name, Middle Name, Last Name, Gender, Date of Birth.
  - **Contact & Address**: Phone number, Email address, Line 1, Line 2, City, State/Province, Postal code.
  - **Emergency Contact**: Name, Relationship, Phone number (with validation prohibiting duplicate patient phone number).
  - **Medical Information**: Known allergies, Current medications, Past medical conditions.
- **Client-side Validation**: Immediate feedback on required fields, email formatting, phone number rules, and emergency contact consistency.
- **Staff Status Tracking**:
  - `No Activity`: Session initialized with no patient interaction yet.
  - `In Progress`: Active typing or field editing detected.
  - `Idle`: Automatically triggered when no activity occurs for 15+ seconds.
  - `Submitted`: Form submitted successfully with timestamp record.
- **Hybrid Realtime Engine**:
  - **Supabase Realtime Broadcast**: Primary WebSocket channel (`patient-intake:{sessionId}`) for cross-device/network synchronization.
  - **Browser `BroadcastChannel` Fallback**: Local tab-to-tab sync if Supabase environment variables are unconfigured.
- **Responsive & Modern UI**: Built with TailwindCSS and Lucide React icons, optimized for mobile, tablet, and desktop views.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **UI & Styling**: [React 19](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/), [Lucide React](https://lucide.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Realtime Engine**: [@supabase/supabase-js](https://supabase.com/docs/guides/realtime) (Broadcast Channel)

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18.x or higher)
- npm or yarn

### 1. Installation

Clone the repository and install dependencies:

```bash
npm install
```

*(On Windows PowerShell if standard npm is restricted by execution policy, use `npm.cmd install`)*

### 2. Environment Configuration

Create a `.env.local` file by copying `.env.example`:

```bash
cp .env.example .env.local
```

Configure your Supabase credentials in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key
```

### 3. Run Development Server

Start the Next.js development server:

```bash
npm run dev
```

The application will start on `http://localhost:3000`.

---

## 📱 Usage & Session Testing

To test real-time synchronization between the Patient view and Staff view:

1. **Patient View**: Open [http://localhost:3000/patient?sessionId=demo](http://localhost:3000/patient?sessionId=demo) in one window/device.
2. **Staff View**: Open [http://localhost:3000/staff?sessionId=demo](http://localhost:3000/staff?sessionId=demo) in another window/device.

> **Note**: Both pages must share the exact same `sessionId` query parameter (e.g., `?sessionId=demo`) to sync on the same broadcast channel.

---

## 📁 Project Structure

```text
Agnos_Assignment_front_end/
├── app/
│   ├── patient/       # Patient form page & interactive container
│   ├── staff/         # Staff real-time dashboard page & container
│   ├── globals.css    # Global Tailwind & base styling
│   ├── layout.tsx     # Root layout wrapper
│   └── page.tsx       # Root landing / redirect page
├── components/        # UI Components
│   ├── Field.tsx      # Patient input field with validation state
│   ├── PageShell.tsx  # Shared responsive header and page layout
│   ├── Section.tsx    # Form section wrapper
│   ├── StaffField.tsx # Staff data viewer field
│   └── StatusBadge.tsx# Status indicator badge (In Progress / Idle / Submitted)
├── lib/               # Utility functions & business logic
│   ├── patient.ts     # Data structures, default states & validation rules
│   ├── realtime.ts    # Supabase Broadcast & local BroadcastChannel manager
│   └── time.ts       # Date/time formatting helpers
├── docs/              # Planning & architecture documents
├── .env.example       # Example environment variables
└── README.md          # Project documentation
```

---

## 🔄 Realtime Protocol Flow

1. **Channel Subscription**: When either page mounts, it joins channel `patient-intake:{sessionId}` via Supabase Realtime (and initializes local `BroadcastChannel` fallback).
2. **State Updates**: As the patient fills in fields, an updated `PatientSessionState` object is emitted.
3. **Staff Dashboard Sync**: Staff receivers listen for `session-update` events and instantly reflect changes on screen.
4. **Idle State Detection**: If no state updates arrive for 15 seconds while a session is active, the staff UI switches the session state indicator to `Idle`.
5. **Form Submission**: Submitting the form marks the state as `submitted` with a completion timestamp, preventing further edits.

---

## 📜 Available Scripts

- `npm run dev` — Launch development server
- `npm run build` — Build production bundle
- `npm run start` — Run production build locally
- `npm run lint` — Run ESLint check
