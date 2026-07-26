import { CheckCircle2, CircleDashed, Clock3 } from "lucide-react";
import { type PatientStatus, statusLabel } from "@/lib/patient";

export function StatusBadge({ status }: { status: PatientStatus }) {
  const styleByStatus: Record<PatientStatus, string> = {
    no_activity: "border-line/60 bg-white/60 text-ink/50",
    in_progress: "border-clinic/30 bg-clinic/10 text-clinic",
    idle: "border-amber-200 bg-amber-50 text-amber-700",
    submitted: "border-emerald-200 bg-emerald-50 text-emerald-700"
  };

  if (status === "in_progress") {
    return (
      <span className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-semibold ${styleByStatus[status]}`}>
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full rounded-full bg-clinic opacity-60 animate-ping" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-clinic" />
        </span>
        {statusLabel(status)}
      </span>
    );
  }

  const Icon = {
    no_activity: CircleDashed,
    in_progress: CircleDashed,
    idle: Clock3,
    submitted: CheckCircle2
  }[status];

  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-semibold ${styleByStatus[status]}`}>
      <Icon size={14} aria-hidden="true" />
      {statusLabel(status)}
    </span>
  );
}
