"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Radio, Send } from "lucide-react";
import { TextArea, SelectField, TextField } from "@/components/Field";
import { PageShell } from "@/components/PageShell";
import { Section } from "@/components/Section";
import { StatusBadge } from "@/components/StatusBadge";
import {
  defaultSessionState,
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

  const connectionRef = useRef<ReturnType<typeof connectPatientSession> | null>(null);
  const latestSessionRef = useRef<PatientSessionState>(defaultSessionState);
  const validation = useMemo(() => validatePatientForm(formData), [formData]);
  const visibleErrors: ValidationErrors = {};

  const dobLimits = useMemo(() => {
    const today = new Date();
    const formatLocalYYYYMMDD = (d: Date) => {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    };
    const maxDate = formatLocalYYYYMMDD(today);
    const minDateObj = new Date(today);
    minDateObj.setFullYear(today.getFullYear() - 120);
    const minDate = formatLocalYYYYMMDD(minDateObj);
    return { minDate, maxDate };
  }, []);

  for (const key of Object.keys(validation.errors) as FieldName[]) {
    if (touched[key]) {
      visibleErrors[key] = validation.errors[key];
    }
  }

  useEffect(() => {
    const connection = connectPatientSession(sessionId, () => undefined, () => {
      const latestSession = latestSessionRef.current;
      if (latestSession.lastUpdatedAt) {
        void publishState(latestSession);
      }
    });
    connectionRef.current = connection;

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
    latestSessionRef.current = state;
    return connectionRef.current?.publish(state) ?? Promise.resolve();
  }

  function updateField(field: FieldName, value: string) {
    setSubmittedAt(null);
    setTouched((current) => ({ ...current, [field]: true }));
    setFormData((current) => {
      const next = { ...current, [field]: value };
      if (field === "preferredLanguage" && value !== "Other") {
        next.preferredLanguageOther = "";
      }
      if (field === "nationality" && value !== "Other") {
        next.nationalityOther = "";
      }
      return next;
    });
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
      <div className="grid gap-5 lg:grid-cols-[1fr_18rem]">
        <form className="order-2 flex flex-col gap-4 lg:order-1" onSubmit={handleSubmit} noValidate>
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
              min={dobLimits.minDate}
              max={dobLimits.maxDate}
              required
            />
            <div className="md:col-span-2">
              <span className="flex items-center gap-1 text-sm font-semibold text-ink/80">Gender <span className="text-coral" aria-hidden="true">*</span></span>
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {genderOptions.map((option, index) => (
                  <label
                    key={option.value}
                    className="flex min-h-11 items-center gap-2 rounded-md border border-line bg-white px-3 py-2 text-sm text-ink"
                  >
                    <input
                      id={index === 0 ? "gender" : undefined}
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
              {visibleErrors.gender ? <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-coral">⚠ {visibleErrors.gender}</p> : null}
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
            {formData.preferredLanguage === "Other" && (
              <TextField
                id="preferredLanguageOther"
                label="Specify preferred language"
                value={formData.preferredLanguageOther}
                error={visibleErrors.preferredLanguageOther}
                onChange={(event) => updateField("preferredLanguageOther", event.target.value)}
                required
              />
            )}
            <SelectField
              id="nationality"
              label="Nationality"
              value={formData.nationality}
              options={nationalityOptions}
              error={visibleErrors.nationality}
              onChange={(event) => updateField("nationality", event.target.value)}
              required
            />
            {formData.nationality === "Other" && (
              <TextField
                id="nationalityOther"
                label="Specify nationality"
                value={formData.nationalityOther}
                error={visibleErrors.nationalityOther}
                onChange={(event) => updateField("nationalityOther", event.target.value)}
                required
              />
            )}
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

          {!validation.isValid && (
            <div
              role="alert"
              className="rounded-2xl border border-coral/20 bg-gradient-to-br from-coral/5 to-transparent p-4"
            >
              <p className="text-sm font-semibold text-coral">Please fix these issues before submitting:</p>
              <ul className="mt-2 grid gap-1.5 text-sm text-ink/75">
                {Object.entries(validation.errors).map(([field, errorText]) => (
                  <li key={field}>
                    <button
                      type="button"
                      onClick={() => {
                        const el = document.getElementById(field);
                        if (el) {
                          el.focus();
                          el.scrollIntoView({ behavior: "smooth", block: "center" });
                        }
                      }}
                      className="text-left font-medium text-coral underline-offset-2 hover:underline focus:underline focus:outline-none"
                    >
                      ⚠ {errorText}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-col gap-3 rounded-2xl border border-white/80 bg-white/80 px-5 py-4 shadow-soft backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-ink/60">
              {validation.isValid ? "✓ Form is complete and ready to submit." : "Complete all required fields (marked *) to submit."}
            </p>
            <button
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-clinic to-emerald-600 px-6 text-sm font-bold text-white shadow-md transition-all duration-150 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 disabled:cursor-not-allowed disabled:from-ink/20 disabled:to-ink/20 disabled:shadow-none"
              type="submit"
              disabled={!validation.isValid}
            >
              <Send size={15} aria-hidden="true" />
              Submit intake
            </button>
          </div>
        </form>

        <aside className="order-1 lg:order-2 h-fit rounded-2xl border border-white/80 bg-white/80 p-4 shadow-soft backdrop-blur-sm lg:sticky lg:top-8">
          {/* Mobile: horizontal compact layout */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-clinic/10">
                <Radio className="text-clinic" size={16} aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-ink/40">Session</p>
                <p className="text-sm font-bold text-ink truncate max-w-[8rem] sm:max-w-none">{sessionId}</p>
              </div>
            </div>
            <StatusBadge status={currentStatus} />
          </div>

          <div className="mt-3 border-t border-line/40 pt-3">
            <p className="text-xs text-ink/40">Last update: {formatTimestamp(lastUpdatedAt)}</p>
          </div>

          {submittedAt ? (
            <div className="mt-3 rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-transparent p-3">
              <div className="flex items-center gap-2 text-emerald-700">
                <CheckCircle2 size={16} aria-hidden="true" />
                <span className="text-sm font-semibold">Submitted successfully</span>
              </div>
              <p className="mt-1 text-xs leading-5 text-emerald-600/80">Staff can now see the completed intake.</p>
            </div>
          ) : null}
        </aside>
      </div>
    </PageShell>
  );
}
