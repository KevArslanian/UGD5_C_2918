export default function NotFound() {
  return (
    <main className="fixed inset-0 flex items-center justify-center bg-black px-6 text-white">
      <div className="flex items-center gap-4 text-center sm:text-left">
        <span className="border-r border-white/25 pr-4 text-4xl font-semibold sm:text-5xl">
          404
        </span>
        <p className="text-sm text-white/85 sm:text-base">
          This page could not be found.
        </p>
      </div>
    </main>
  );
}
