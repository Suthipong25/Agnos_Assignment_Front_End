type SectionProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
};

export function Section({ title, description, children }: SectionProps) {
  return (
    <section className="rounded-lg border border-line bg-white p-4 shadow-soft">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-ink">{title}</h2>
        {description ? <p className="mt-1 text-sm leading-6 text-ink/65">{description}</p> : null}
      </div>
      <div className="grid gap-4 md:grid-cols-2">{children}</div>
    </section>
  );
}
