import Link from "next/link";

export default function NotAuthorizedPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center">
      <section className="w-full max-w-md rounded-3xl bg-white/90 p-8 text-center shadow-[0_24px_60px_rgba(15,23,42,0.18)] backdrop-blur">
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-red-100 text-4xl text-red-500">
          x
        </div>
        <h1 className="text-3xl font-bold text-slate-900">Anda belum login</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          Silakan login terlebih dahulu untuk mengakses halaman game.
        </p>
        <Link
          href="/auth/login"
          className="mt-6 inline-flex rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
        >
          Kembali ke Login
        </Link>
      </section>
    </main>
  );
}
