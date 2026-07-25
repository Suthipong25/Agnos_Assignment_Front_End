import { CheckCircle2, CircleDashed, Clock3, Wifi } from "lucide-react";
import { type PatientStatus, statusLabel } from "@/lib/patient";

export function StatusBadge({ status }: { status: PatientStatus }) {
  const styleByStatus: Record<PatientStatus, string> = {
    no_activity: "border-line bg-white text-ink/60",
    in_progress: "border-clinic/30 bg-clinic/10 text-clinic",
    idle: "border-wheat bg-wheat/80 text-ink",
    submitted: "border-emerald-200 bg-emerald-50 text-emerald-700"
  };

  const Icon = {
    no_activity: CircleDashed,
    in_progress: Wifi,
    idle: Clock3,
    submitted: CheckCircle2
  }[status];

  return (
    <span className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-semibold ${styleByStatus[status]}`}>
      <Icon size={16} aria-hidden="true" />
      {statusLabel(status)}
    </span>
  );
}
