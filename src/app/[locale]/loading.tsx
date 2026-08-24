export default function Loading() {
  return (
    <div className="container-shell py-12" aria-busy="true" aria-label="Loading">
      <div className="h-4 w-32 animate-pulse rounded bg-line" />
      <div className="mt-5 h-12 max-w-2xl animate-pulse rounded-xl bg-line" />
      <div className="mt-4 h-5 max-w-xl animate-pulse rounded bg-line" />
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-72 animate-pulse rounded-2xl border bg-white/60" />
        ))}
      </div>
    </div>
  );
}
