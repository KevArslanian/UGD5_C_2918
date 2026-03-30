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
    <main className="flex min-h-screen w-full flex-col items-center justify-center px-4">
      <h1 className="mb-3 text-center text-2xl font-bold text-white md:text-4xl">
        Selamat Datang!
      </h1>
      <HomeArcade />
    </main>
  );
}
