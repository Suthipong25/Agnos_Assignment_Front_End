import { formatFieldValue } from "@/lib/patient";

type StaffFieldProps = {
  label: string;
  value?: string | null;
  wide?: boolean;
  showEmpty?: boolean;
};

export function StaffField({ label, value, wide, showEmpty = true }: StaffFieldProps) {
  const hasValue = Boolean(value?.trim());

  if (!hasValue && !showEmpty) {
    return null;
  }

  return (
    <div className={wide ? "md:col-span-2" : undefined}>
      <dt className="text-xs font-semibold uppercase tracking-wide text-ink/50">{label}</dt>
      <dd className="mt-1 rounded-md border border-line bg-mist px-3 py-2 text-sm leading-6 text-ink">
        {formatFieldValue(value)}
      </dd>
    </div>
  );
}

