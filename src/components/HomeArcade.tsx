"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FaPowerOff } from "react-icons/fa";
import { toast } from "react-toastify";

import Game1 from "@/components/Game1";
import PoopSurvivorsGame from "@/components/PoopSurvivorsGame";
import { clearAuthCookie } from "@/lib/auth";

type SelectedGame = "game-eek" | "poop-survivors" | null;

const selectorShellClasses =
  "animate-panel-enter relative mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-[min(96vw,82rem)] flex-col items-center justify-center gap-8 overflow-hidden bg-gray-900 p-4 md:m-12 md:p-8";
const gameShellClasses =
  "animate-panel-enter relative mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-[min(96vw,82rem)] flex-col gap-8 overflow-hidden bg-gray-900 p-4 md:m-12 md:p-8";

export default function HomeArcade() {
  const router = useRouter();
  const [selectedGame, setSelectedGame] = useState<SelectedGame>(null);

  const handleLogout = () => {
    document.cookie = clearAuthCookie();
    toast.info("Logout berhasil.", {
      position: "top-right",
    });
    router.replace("/auth/login");
    router.refresh();
  };

  return (
    <section className="w-full">
      <button
        type="button"
        onClick={handleLogout}
        className="animate-soft-float mb-3 flex items-center justify-center rounded-full bg-red-500 p-3 text-white shadow-[0_14px_30px_rgba(239,68,68,0.28)] transition duration-300 hover:scale-105 hover:bg-red-600"
        aria-label="Logout"
        title="Logout"
      >
        <FaPowerOff size={24} />
      </button>

      {selectedGame === "game-eek" ? (
        <div className={gameShellClasses}>
          <Game1 onBack={() => setSelectedGame(null)} />
        </div>
      ) : selectedGame === "poop-survivors" ? (
        <div className={gameShellClasses}>
          <PoopSurvivorsGame onBack={() => setSelectedGame(null)} />
        </div>
      ) : (
        <div className={selectorShellClasses}>
          <div className="animate-ambient-drift absolute top-[-4rem] left-[-6rem] h-44 w-44 rounded-full bg-[#ffae0030] blur-3xl" />
          <div className="animate-ambient-drift absolute right-[-5rem] bottom-[-3rem] h-52 w-52 rounded-full bg-[#00d95f26] blur-3xl [animation-delay:-3s]" />

          <h2 className="animate-title-glow relative z-10 text-center text-4xl font-bold text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
            Choose Your Game
          </h2>

          <div className="relative z-10 flex flex-col gap-4 md:flex-row">
            <button
              type="button"
              onClick={() => setSelectedGame("game-eek")}
              className="group relative overflow-hidden rounded-xl border-2 border-yellow-400 bg-gradient-to-b from-orange-700 to-amber-500 p-4 text-lg font-semibold text-white shadow-[0_14px_34px_rgba(245,158,11,0.25)] transition-all duration-300 hover:-translate-y-1 hover:scale-[1.03]"
            >
              <span className="animate-sheen absolute inset-y-0 left-[-30%] w-1/3 bg-white/25 blur-md" />
              <span className="relative z-10">Game EEK {"\u{1F4A9}"}</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedGame("poop-survivors")}
              className="group relative overflow-hidden rounded-xl border-2 border-green-400 bg-gradient-to-b from-green-700 to-green-500 p-4 text-lg font-semibold text-white shadow-[0_14px_34px_rgba(34,197,94,0.22)] transition-all duration-300 hover:-translate-y-1 hover:scale-[1.03]"
            >
              <span className="animate-sheen absolute inset-y-0 left-[-30%] w-1/3 bg-white/20 blur-md [animation-delay:-1.2s]" />
              <span className="relative z-10">Poop Survivors {"\u{1F9FB}"}</span>
            </button>
          </div>

          <p className="relative z-10 text-center italic text-white/95">
            Pick one to start playing and reduce lag!
          </p>
        </div>
      )}
    </section>
  );
}
