# Development Planning Documentation

## Project Structure

- `app/patient`: patient-facing intake route. The server page provides a suspense boundary and `patient-client.tsx` owns form state, validation, heartbeat, and realtime publishing.
- `app/staff`: staff monitoring route. The client container subscribes to the session channel, derives activity status, and renders live patient details.
- `components`: shared presentational components for shell layout, sections, fields, status badges, and staff field display.
- `lib`: shared domain code, including `PatientFormData`, `PatientSessionState`, validation rules, Supabase and BroadcastChannel connection logic, and timestamp helpers.

## Design

The UI is mobile-first and clinically restrained. The patient form uses grouped sections so the user can scan personal details, contact preferences, and optional information without a long undifferentiated form. On desktop, fields use a two-column grid while preserving full-width space for address and status areas.

The staff view prioritizes scanning. A sticky status panel summarizes the session, realtime mode, last update, and validation state. Patient details sit in a responsive definition-list layout that stacks on narrow screens and expands to two columns on larger screens.

Color choices avoid a one-note palette: teal is used for clinical action and connection state, warm neutral surfaces separate content, and coral highlights validation issues.

## Component Architecture

- `PageShell`: shared page chrome with title, description, session-aware navigation, and brand signal.
- `Section`: repeated patient form grouping with title and explanatory copy.
- `TextField`, `TextArea`, `SelectField`: accessible form controls with consistent labels, focus states, hints, and errors.
- `StatusBadge`: maps session status to readable text, icon, and visual treatment.
- `StaffField`: read-only staff data display with consistent empty-state formatting.
- `patient-client.tsx`: patient state owner, validation coordinator, debounced publisher, heartbeat sender, latest-state responder, and submit handler.
- `staff-client.tsx`: subscriber, latest-state requester, realtime mode indicator, idle-state derivation, and live data renderer.

## Real-Time Synchronization Flow

The app uses a shared channel name, `patient-intake:{sessionId}`. The patient route publishes the full `PatientSessionState` with the `patient_state` event after field edits, heartbeat intervals, and final submission. The staff route subscribes to the same channel and replaces its current state with the latest `patient_state` payload.

Supabase Broadcast is the production realtime transport. A browser `BroadcastChannel` fallback is also enabled so reviewers can test the experience locally without setting up Supabase first. When Supabase credentials exist, messages are sent to both Supabase and the local fallback.

When a staff view opens after an active patient view, it sends a `state_request` event on the same channel. The patient view keeps the latest published session in memory and responds by republishing that state. Patient intake data is intentionally not written to `localStorage`, so stale or private patient data is not shown after the active patient view is gone.

## Validation and Status Rules

Required fields are first name, last name, date of birth, gender, phone, address, preferred language, and nationality. Email is optional but must be valid when present. Emergency contact name and relationship are optional as a pair; if one is provided, the other must also be provided.

The patient page sends `in_progress` while editing and `submitted` on a valid submit. The staff page displays `no_activity` before any message arrives, `typing / in progress` when recent updates are received, `idle` when no update has arrived for more than 15 seconds, and `submitted` once the patient submits.

## Acceptance Criteria

- Patient form renders correctly on mobile and desktop.
- Staff view renders correctly on mobile and desktop.
- Every patient field appears in the staff view.
- Typing in the patient form updates the staff view without refresh.
- Opening the staff view after an active patient view requests and displays the latest in-memory patient state.
- Invalid phone and email values show clear errors.
- Submit is disabled until the form is valid.
- Staff status changes through no activity, in progress, idle, and submitted.
- `npm.cmd run lint` and `npm.cmd run build` pass.
