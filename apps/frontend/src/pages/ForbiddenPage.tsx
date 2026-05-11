import { Link } from 'react-router-dom';

export function ForbiddenPage() {
  return (
    <section className="mx-auto mt-16 max-w-xl rounded-lg border border-line bg-white p-6 text-center shadow-sm">
      <p className="text-sm font-medium text-action">Access restricted</p>
      <h1 className="mt-2 text-2xl font-semibold text-ink">This area requires a different role.</h1>
      <p className="mt-3 text-steel">ArchTrack has kept you signed in, but your current permissions do not include this page.</p>
      <Link className="mt-6 inline-flex rounded-md bg-action px-4 py-2 font-semibold text-white hover:bg-teal-800" to="/">
        Back to workspace
      </Link>
    </section>
  );
}
