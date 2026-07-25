import Link from "next/link";
import { Activity, ClipboardList, HeartPulse } from "lucide-react";

type PageShellProps = {
  title: string;
  eyebrow: string;
  description: string;
  sessionId: string;
  activeView: "patient" | "staff";
  children: React.ReactNode;
};

export function PageShell({ title, eyebrow, description, sessionId, activeView, children }: PageShellProps) {
  const patientHref = `/patient?sessionId=${encodeURIComponent(sessionId)}`;
  const staffHref = `/staff?sessionId=${encodeURIComponent(sessionId)}`;

  return (
    <main className="min-h-screen px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        <header className="flex flex-col gap-4 rounded-lg border border-white/70 bg-white/80 p-4 shadow-soft backdrop-blur md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-clinic text-white">
              <HeartPulse size={24} aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-clinic">{eyebrow}</p>
              <h1 className="mt-1 text-2xl font-semibold text-ink md:text-3xl">{title}</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-ink/70">{description}</p>
            </div>
          </div>

          <nav className="flex flex-wrap items-center gap-2">
            <Link className={navClass(activeView === "patient")} href={patientHref}>
              <ClipboardList size={16} aria-hidden="true" />
              Patient
            </Link>
            <Link className={navClass(activeView === "staff")} href={staffHref}>
              <Activity size={16} aria-hidden="true" />
              Staff
            </Link>
          </nav>
        </header>

        {children}
      </div>
    </main>
  );
}

function navClass(active: boolean) {
  return [
    "inline-flex h-10 items-center gap-2 rounded-md border px-3 text-sm font-medium transition",
    active
      ? "border-clinic bg-clinic text-white"
      : "border-line bg-white text-ink hover:border-clinic hover:text-clinic"
  ].join(" ");
}
