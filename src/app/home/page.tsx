import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import HomeArcade from "@/components/HomeArcade";
import { AUTH_COOKIE_NAME, AUTH_COOKIE_VALUE } from "@/lib/auth";

export default async function HomePage() {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (authCookie !== AUTH_COOKIE_VALUE) {
    redirect("/auth/not-authorized");
  }

  return (
    <main className="flex min-h-screen w-full flex-col items-stretch px-2 py-4 md:px-4 md:py-6">
      <h1 className="mb-2 text-center text-3xl font-black tracking-tight text-white md:text-5xl">
        Selamat Datang!
      </h1>
      <p className="mb-4 max-w-2xl text-center text-sm text-white/80 md:mb-6 md:text-base">
        Bonus arcade UGD dengan dua dunia yang benar-benar berbeda: alchemy lab
        yang cozy dan neon squadron yang agresif.
      </p>
      <HomeArcade />
    </main>
  );
}
