export function PlaceholderPage({ title }: { title: string }) {
  return (
    <section className="rounded-lg border border-line bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-xl font-semibold text-ink dark:text-white">{title}</h2>
      <p className="mt-2 text-steel dark:text-slate-400">This module is ready for the next implementation task.</p>
    </section>
  );
}
