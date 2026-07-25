"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Radio, Send } from "lucide-react";
import { TextArea, SelectField, TextField } from "@/components/Field";
import { PageShell } from "@/components/PageShell";
import { Section } from "@/components/Section";
import { StatusBadge } from "@/components/StatusBadge";
import {
  defaultPatientFormData,
  genderOptions,
  getSessionId,
  languageOptions,
  nationalityOptions,
  type Gender,
  type PatientFormData,
  type PatientSessionState,
  type ValidationErrors,
  validatePatientForm
} from "@/lib/patient";
import { connectPatientSession } from "@/lib/realtime";
import { formatTimestamp } from "@/lib/time";

type FieldName = keyof PatientFormData;

export function PatientClient() {
  const searchParams = useSearchParams();
  const sessionId = getSessionId(searchParams);
  const [formData, setFormData] = useState<PatientFormData>(defaultPatientFormData);
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({});
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const [realtimeMode, setRealtimeMode] = useState<"supabase" | "local">("local");
  const connectionRef = useRef<ReturnType<typeof connectPatientSession> | null>(null);
  const validation = useMemo(() => validatePatientForm(formData), [formData]);
  const visibleErrors: ValidationErrors = {};

  for (const key of Object.keys(validation.errors) as FieldName[]) {
    if (touched[key]) {
      visibleErrors[key] = validation.errors[key];
    }
  }

  useEffect(() => {
    const connection = connectPatientSession(sessionId, () => undefined);
    connectionRef.current = connection;
    setRealtimeMode(connection.mode);

    return () => {
      connection.unsubscribe();
      connectionRef.current = null;
    };
  }, [sessionId]);

  useEffect(() => {
    const nextUpdatedAt = new Date().toISOString();
    setLastUpdatedAt(nextUpdatedAt);

    const handle = window.setTimeout(() => {
      void publishState({
        formData,
        validation,
        status: submittedAt ? "submitted" : "in_progress",
        lastUpdatedAt: nextUpdatedAt,
        submittedAt
      });
    }, 260);

    return () => window.clearTimeout(handle);
  }, [formData, validation, submittedAt]);

  useEffect(() => {
    const handle = window.setInterval(() => {
      if (!submittedAt) {
        const heartbeatAt = new Date().toISOString();
        setLastUpdatedAt(heartbeatAt);
        void publishState({
          formData,
          validation,
          status: "in_progress",
          lastUpdatedAt: heartbeatAt,
          submittedAt: null
        });
      }
    }, 8000);

    return () => window.clearInterval(handle);
  }, [formData, submittedAt, validation]);

  function publishState(state: PatientSessionState) {
    return connectionRef.current?.publish(state) ?? Promise.resolve();
  }

  function updateField(field: FieldName, value: string) {
    setSubmittedAt(null);
    setTouched((current) => ({ ...current, [field]: true }));
    setFormData((current) => ({
      ...current,
      [field]: value
    }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const allTouched = Object.keys(formData).reduce<Partial<Record<FieldName, boolean>>>((acc, key) => {
      acc[key as FieldName] = true;
      return acc;
    }, {});
    setTouched(allTouched);

    if (!validation.isValid) {
      return;
    }

    const now = new Date().toISOString();
    setSubmittedAt(now);
    setLastUpdatedAt(now);
    void publishState({
      formData,
      validation,
      status: "submitted",
      lastUpdatedAt: now,
      submittedAt: now
    });
  }

  const currentStatus = submittedAt ? "submitted" : "in_progress";

  return (
    <PageShell
      activeView="patient"
      eyebrow="Patient intake"
      title="Patient registration"
      description="Complete your intake details once. The care team can follow progress live from the staff view for the same session."
      sessionId={sessionId}
    >
      <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
        <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
          <Section title="Personal details" description="Core identification information used by the clinic team.">
            <TextField
              id="firstName"
              label="First name"
              value={formData.firstName}
              error={visibleErrors.firstName}
              onChange={(event) => updateField("firstName", event.target.value)}
              autoComplete="given-name"
              required
            />
            <TextField
              id="middleName"
              label="Middle name"
              value={formData.middleName}
              onChange={(event) => updateField("middleName", event.target.value)}
              autoComplete="additional-name"
            />
            <TextField
              id="lastName"
              label="Last name"
              value={formData.lastName}
              error={visibleErrors.lastName}
              onChange={(event) => updateField("lastName", event.target.value)}
              autoComplete="family-name"
              required
            />
            <TextField
              id="dateOfBirth"
              label="Date of birth"
              type="date"
              value={formData.dateOfBirth}
              error={visibleErrors.dateOfBirth}
              onChange={(event) => updateField("dateOfBirth", event.target.value)}
              required
            />
            <div className="md:col-span-2">
              <span className="text-sm font-medium text-ink">Gender</span>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {genderOptions.map((option) => (
                  <label
                    key={option.value}
                    className="flex min-h-11 items-center gap-2 rounded-md border border-line bg-white px-3 py-2 text-sm text-ink"
                  >
                    <input
                      type="radio"
                      name="gender"
                      value={option.value}
                      checked={formData.gender === option.value}
                      onChange={(event) => updateField("gender", event.target.value as Gender)}
                      required
                    />
                    {option.label}
                  </label>
                ))}
              </div>
              {visibleErrors.gender ? <p className="mt-1.5 text-xs font-medium text-coral">{visibleErrors.gender}</p> : null}
            </div>
          </Section>

          <Section title="Contact and preferences" description="Where the staff can reach you and how you prefer to communicate.">
            <TextField
              id="phone"
              label="Phone number"
              value={formData.phone}
              error={visibleErrors.phone}
              hint="International and Thai-style numbers are accepted."
              onChange={(event) => updateField("phone", event.target.value)}
              autoComplete="tel"
              required
            />
            <TextField
              id="email"
              label="Email"
              type="email"
              value={formData.email}
              error={visibleErrors.email}
              onChange={(event) => updateField("email", event.target.value)}
              autoComplete="email"
            />
            <SelectField
              id="preferredLanguage"
              label="Preferred language"
              value={formData.preferredLanguage}
              options={languageOptions}
              error={visibleErrors.preferredLanguage}
              onChange={(event) => updateField("preferredLanguage", event.target.value)}
              required
            />
            <SelectField
              id="nationality"
              label="Nationality"
              value={formData.nationality}
              options={nationalityOptions}
              error={visibleErrors.nationality}
              onChange={(event) => updateField("nationality", event.target.value)}
              required
            />
            <div className="md:col-span-2">
              <TextArea
                id="address"
                label="Address"
                value={formData.address}
                error={visibleErrors.address}
                onChange={(event) => updateField("address", event.target.value)}
                autoComplete="street-address"
                required
              />
            </div>
          </Section>

          <Section title="Optional information" description="These details help the care team prepare, but they are not required.">
            <TextField
              id="emergencyContactName"
              label="Emergency contact name"
              value={formData.emergencyContactName}
              error={visibleErrors.emergencyContactName}
              onChange={(event) => updateField("emergencyContactName", event.target.value)}
            />
            <TextField
              id="emergencyContactRelationship"
              label="Emergency contact relationship"
              value={formData.emergencyContactRelationship}
              error={visibleErrors.emergencyContactRelationship}
              onChange={(event) => updateField("emergencyContactRelationship", event.target.value)}
            />
            <TextField
              id="religion"
              label="Religion"
              value={formData.religion}
              onChange={(event) => updateField("religion", event.target.value)}
            />
          </Section>

          <div className="flex flex-col gap-3 rounded-lg border border-line bg-white p-4 shadow-soft sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-ink/70">
              {validation.isValid ? "The form is ready to submit." : "Complete the required fields to submit."}
            </p>
            <button
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-clinic px-4 text-sm font-semibold text-white transition hover:bg-clinic/90 disabled:cursor-not-allowed disabled:bg-ink/25"
              type="submit"
              disabled={!validation.isValid}
            >
              <Send size={16} aria-hidden="true" />
              Submit intake
            </button>
          </div>
        </form>

        <aside className="h-fit rounded-lg border border-line bg-white p-4 shadow-soft lg:sticky lg:top-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink/50">Session</p>
              <p className="mt-1 break-all text-lg font-semibold text-ink">{sessionId}</p>
            </div>
            <Radio className="text-clinic" size={20} aria-hidden="true" />
          </div>
          <div className="mt-4 flex flex-col gap-3">
            <StatusBadge status={currentStatus} />
            <p className="text-sm leading-6 text-ink/70">
              Realtime mode: <span className="font-semibold text-ink">{realtimeMode === "supabase" ? "Supabase" : "Local fallback"}</span>
            </p>
            <p className="text-sm leading-6 text-ink/70">Last update: {formatTimestamp(lastUpdatedAt)}</p>
          </div>
          {submittedAt ? (
            <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm leading-6 text-emerald-800">
              <CheckCircle2 className="mb-2" size={18} aria-hidden="true" />
              Submitted successfully. Staff can now see the completed intake state.
            </div>
          ) : null}
        </aside>
      </div>
    </PageShell>
  );
}
