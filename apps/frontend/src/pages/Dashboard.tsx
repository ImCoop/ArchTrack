const summary = [
  { label: 'Active projects', value: '18' },
  { label: 'Due this week', value: '7' },
  { label: 'Open quotes', value: '$42k' },
  { label: 'Unread alerts', value: '5' },
];

export function Dashboard() {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summary.map((item) => (
          <article key={item.label} className="rounded-lg border border-line bg-white p-5 shadow-sm">
            <p className="text-sm text-steel">{item.label}</p>
            <p className="mt-2 text-3xl font-semibold text-ink">{item.value}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-lg border border-line bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-ink">Production Snapshot</h2>
          <div className="mt-5 space-y-4">
            {['Shop drawings package', 'Permit revision set', 'As-built field updates'].map((name, index) => (
              <div key={name} className="flex items-center justify-between gap-4 border-b border-line pb-4 last:border-b-0 last:pb-0">
                <div>
                  <p className="font-medium text-ink">{name}</p>
                  <p className="text-sm text-steel">Project workflow {index + 1}</p>
                </div>
                <span className="rounded-md bg-field px-3 py-1 text-sm text-steel">In progress</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-line bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-ink">Today</h2>
          <div className="mt-5 space-y-3 text-sm text-steel">
            <p>2 project reviews scheduled</p>
            <p>3 tasks awaiting assignment</p>
            <p>1 file revision pending approval</p>
          </div>
        </div>
      </section>
    </div>
  );
}
