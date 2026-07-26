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

  const [clock, setClock] = useState(Date.now());

  useEffect(() => {
    setSession(defaultSessionState);

    const connection = connectPatientSession(sessionId, (nextState) => {
      setSession(nextState);
    });

    const requestHandle = window.setTimeout(() => {
      void connection.requestLatest();
    }, 200);

    return () => {
      window.clearTimeout(requestHandle);
      connection.unsubscribe();
    };
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

  const preferredLanguageDisplay = formData.preferredLanguage === "Other" && formData.preferredLanguageOther
    ? `Other (${formData.preferredLanguageOther})`
    : formData.preferredLanguage;

  const nationalityDisplay = formData.nationality === "Other" && formData.nationalityOther
    ? `Other (${formData.nationalityOther})`
    : formData.nationality;

  return (
    <PageShell
      activeView="staff"
      eyebrow="Staff monitoring"
      title="Live patient intake view"
      description="Monitor form progress in real time, spot missing information, and see when the patient has submitted the intake."
      sessionId={sessionId}
    >
      <div className="grid gap-6 xl:grid-cols-[22rem_1fr]">
        <aside className="h-fit rounded-2xl border border-white/80 bg-white/80 p-5 shadow-soft backdrop-blur-sm xl:sticky xl:top-8">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-ink/40">Current status</p>
              <div className="mt-2">
                <StatusBadge status={derivedStatus} />
              </div>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-clinic/10">
              <Radio className="text-clinic" size={18} aria-hidden="true" />
            </div>
          </div>

          <dl className="mt-5 grid gap-3 text-sm">
            <div className="rounded-xl border border-line/60 bg-mist/60 p-3">
              <dt className="text-xs font-bold uppercase tracking-widest text-ink/40">Last activity</dt>
              <dd className="mt-1.5 text-sm font-medium text-ink/80">{formatTimestamp(session.lastUpdatedAt)}</dd>
            </div>
            <div className="rounded-xl border border-line/60 bg-mist/60 p-3">
              <dt className="text-xs font-bold uppercase tracking-widest text-ink/40">Form validation</dt>
              <dd className="mt-1.5 flex items-center gap-2 text-sm font-medium text-ink/80">
                {session.validation.isValid ? (
                  <>
                    <CheckCircle2 size={15} className="text-emerald-600" aria-hidden="true" />
                    Ready to submit
                  </>
                ) : (
                  <>
                    <AlertCircle size={15} className="text-coral" aria-hidden="true" />
                    {invalidCount || "No"} issue{invalidCount === 1 ? "" : "s"}
                  </>
                )}
              </dd>
            </div>
          </dl>
        </aside>

        <section className="rounded-2xl border border-white/80 bg-white/80 p-5 shadow-soft backdrop-blur-sm">
          <div className="flex flex-col gap-2 border-b border-line/50 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-bold text-ink">Patient details</h2>
              <p className="mt-0.5 text-sm text-ink/55">
                {hasData ? `Showing ${statusLabel(derivedStatus).toLowerCase()} data from the patient form.` : "Waiting for patient activity."}
              </p>
            </div>
          </div>

          {!hasData ? (
            <div className="mt-6 rounded-2xl border border-dashed border-line bg-mist/50 p-10 text-center">
              <p className="text-base font-semibold text-ink">No patient activity yet</p>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-ink/50">
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
              <StaffField label="Preferred language" value={preferredLanguageDisplay} />
              <StaffField label="Nationality" value={nationalityDisplay} />
              <StaffField label="Religion" value={formData.religion} />
              <StaffField label="Emergency contact name" value={formData.emergencyContactName} />
              <StaffField label="Emergency contact relationship" value={formData.emergencyContactRelationship} />
              <StaffField label="Address" value={formData.address} wide />
            </dl>
          )}

          {invalidCount > 0 ? (
            <div className="mt-5 rounded-xl border border-coral/20 bg-gradient-to-br from-coral/5 to-transparent p-4">
              <p className="text-sm font-semibold text-coral">Current validation issues</p>
              <ul className="mt-2 grid gap-1 text-sm leading-6 text-ink/65">
                {Object.entries(session.validation.errors).map(([field, message]) => (
                  <li key={field}>⚠ {message}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      </div>
    </PageShell>
  );
}
