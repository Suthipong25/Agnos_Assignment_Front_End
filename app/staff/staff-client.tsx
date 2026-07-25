"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle2, Radio } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { StaffField } from "@/components/StaffField";
import { StatusBadge } from "@/components/StatusBadge";
import {
  defaultSessionState,
  getSessionId,
  statusLabel,
  type PatientSessionState,
  type PatientStatus
} from "@/lib/patient";
import { connectPatientSession } from "@/lib/realtime";
import { formatTimestamp, secondsSince } from "@/lib/time";

export function StaffClient() {
  const searchParams = useSearchParams();
  const sessionId = getSessionId(searchParams);
  const [session, setSession] = useState<PatientSessionState>(defaultSessionState);
  const [realtimeMode, setRealtimeMode] = useState<"supabase" | "local">("local");
  const [clock, setClock] = useState(Date.now());

  useEffect(() => {
    const connection = connectPatientSession(sessionId, (nextState) => {
      setSession(nextState);
    });
    setRealtimeMode(connection.mode);

    return () => connection.unsubscribe();
  }, [sessionId]);

  useEffect(() => {
    const handle = window.setInterval(() => setClock(Date.now()), 1000);
    return () => window.clearInterval(handle);
  }, []);

  const derivedStatus = useMemo<PatientStatus>(() => {
    void clock;

    if (session.status === "submitted") {
      return "submitted";
    }

    if (!session.lastUpdatedAt) {
      return "no_activity";
    }

    return secondsSince(session.lastUpdatedAt) > 15 ? "idle" : "in_progress";
  }, [clock, session.lastUpdatedAt, session.status]);

  const formData = session.formData;
  const hasData = Boolean(session.lastUpdatedAt);
  const invalidCount = Object.keys(session.validation.errors).length;

  return (
    <PageShell
      activeView="staff"
      eyebrow="Staff monitoring"
      title="Live patient intake view"
      description="Monitor form progress in real time, spot missing information, and see when the patient has submitted the intake."
      sessionId={sessionId}
    >
      <div className="grid gap-5 xl:grid-cols-[22rem_1fr]">
        <aside className="h-fit rounded-lg border border-line bg-white p-4 shadow-soft xl:sticky xl:top-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink/50">Current status</p>
              <div className="mt-2">
                <StatusBadge status={derivedStatus} />
              </div>
            </div>
            <Radio className="text-clinic" size={20} aria-hidden="true" />
          </div>

          <dl className="mt-5 grid gap-3 text-sm">
            <div className="rounded-md border border-line bg-mist p-3">
              <dt className="font-semibold text-ink">Session ID</dt>
              <dd className="mt-1 break-all text-ink/70">{sessionId}</dd>
            </div>
            <div className="rounded-md border border-line bg-mist p-3">
              <dt className="font-semibold text-ink">Realtime mode</dt>
              <dd className="mt-1 text-ink/70">{realtimeMode === "supabase" ? "Supabase Broadcast" : "Local fallback"}</dd>
            </div>
            <div className="rounded-md border border-line bg-mist p-3">
              <dt className="font-semibold text-ink">Last updated</dt>
              <dd className="mt-1 text-ink/70">{formatTimestamp(session.lastUpdatedAt)}</dd>
            </div>
            <div className="rounded-md border border-line bg-mist p-3">
              <dt className="font-semibold text-ink">Validation</dt>
              <dd className="mt-1 flex items-center gap-2 text-ink/70">
                {session.validation.isValid ? (
                  <>
                    <CheckCircle2 size={16} className="text-emerald-600" aria-hidden="true" />
                    Ready to submit
                  </>
                ) : (
                  <>
                    <AlertCircle size={16} className="text-coral" aria-hidden="true" />
                    {invalidCount || "No"} issue{invalidCount === 1 ? "" : "s"}
                  </>
                )}
              </dd>
            </div>
          </dl>
        </aside>

        <section className="rounded-lg border border-line bg-white p-4 shadow-soft">
          <div className="flex flex-col gap-2 border-b border-line pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-ink">Patient details</h2>
              <p className="mt-1 text-sm text-ink/65">
                {hasData ? `Showing ${statusLabel(derivedStatus).toLowerCase()} data from the patient form.` : "Waiting for patient activity."}
              </p>
            </div>
          </div>

          {!hasData ? (
            <div className="mt-6 rounded-lg border border-dashed border-line bg-mist p-8 text-center">
              <p className="text-base font-semibold text-ink">No patient activity yet</p>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-ink/65">
                Open the patient form with this same session ID and start typing. Updates will appear here immediately.
              </p>
            </div>
          ) : (
            <dl className="mt-5 grid gap-4 md:grid-cols-2">
              <StaffField label="First name" value={formData.firstName} />
              <StaffField label="Middle name" value={formData.middleName} />
              <StaffField label="Last name" value={formData.lastName} />
              <StaffField label="Date of birth" value={formData.dateOfBirth} />
              <StaffField label="Gender" value={formData.gender.replaceAll("_", " ")} />
              <StaffField label="Phone number" value={formData.phone} />
              <StaffField label="Email" value={formData.email} />
              <StaffField label="Preferred language" value={formData.preferredLanguage} />
              <StaffField label="Nationality" value={formData.nationality} />
              <StaffField label="Religion" value={formData.religion} />
              <StaffField label="Emergency contact name" value={formData.emergencyContactName} />
              <StaffField label="Emergency contact relationship" value={formData.emergencyContactRelationship} />
              <StaffField label="Address" value={formData.address} wide />
            </dl>
          )}

          {invalidCount > 0 ? (
            <div className="mt-5 rounded-md border border-coral/25 bg-coral/5 p-4">
              <p className="text-sm font-semibold text-coral">Current validation issues</p>
              <ul className="mt-2 grid gap-1 text-sm leading-6 text-ink/70">
                {Object.entries(session.validation.errors).map(([field, message]) => (
                  <li key={field}>{message}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      </div>
    </PageShell>
  );
}
