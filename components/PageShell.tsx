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
    <main className="min-h-screen px-4 py-5 pb-10 sm:px-6 lg:px-8">
      {/* Top accent bar */}
      <div className="fixed inset-x-0 top-0 h-1 bg-gradient-to-r from-clinic via-teal-400 to-emerald-500 z-50" />

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 pt-1">
        <header className="flex flex-col gap-4 rounded-2xl border border-white/80 bg-white/75 px-4 py-4 shadow-soft backdrop-blur-md sm:px-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-clinic to-emerald-600 text-white shadow-md sm:h-12 sm:w-12">
              <HeartPulse size={22} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-widest text-clinic/80">{eyebrow}</p>
              <h1 className="mt-0.5 truncate text-lg font-bold tracking-tight text-ink sm:text-xl md:text-2xl">{title}</h1>
              <p className="mt-0.5 text-xs leading-5 text-ink/55 sm:text-sm">{description}</p>
            </div>
          </div>

          <nav className="flex w-full items-center gap-1.5 rounded-xl border border-line bg-mist p-1 md:w-auto">
            <Link className={navClass(activeView === "patient")} href={patientHref}>
              <ClipboardList size={15} aria-hidden="true" />
              Patient
            </Link>
            <Link className={navClass(activeView === "staff")} href={staffHref}>
              <Activity size={15} aria-hidden="true" />
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
    "inline-flex flex-1 justify-center items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 md:flex-none md:px-4",
    active
      ? "bg-clinic text-white shadow-sm"
      : "text-ink/60 hover:bg-white hover:text-ink hover:shadow-sm"
  ].join(" ");
}
