type SectionProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
};

export function Section({ title, description, children }: SectionProps) {
  return (
    <section className="rounded-2xl border border-white/80 bg-white/80 shadow-soft backdrop-blur-sm overflow-hidden">
      <div className="border-b border-line/60 px-5 py-4">
        <h2 className="text-sm font-bold uppercase tracking-widest text-clinic/70">{title}</h2>
        {description ? <p className="mt-1 text-sm leading-5 text-ink/55">{description}</p> : null}
      </div>
      <div className="grid gap-5 p-5 md:grid-cols-2">{children}</div>
    </section>
  );
}
