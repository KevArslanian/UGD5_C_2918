"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  FaBolt,
  FaFlask,
  FaMagic,
  FaMeteor,
  FaPowerOff,
  FaRocket,
} from "react-icons/fa";
import { toast } from "react-toastify";

import Game1 from "@/components/Game1";
import PoopSurvivorsGame from "@/components/PoopSurvivorsGame";
import { clearAuthCookie } from "@/lib/auth";

type SelectedGame = "game-eek" | "poop-survivors" | null;

const selectorShellClasses =
  "animate-panel-enter relative flex min-h-[calc(100vh-9rem)] w-full flex-col overflow-hidden rounded-[2.2rem] border border-white/12 bg-[#080b19]/90 px-4 py-6 shadow-[0_32px_80px_rgba(4,10,28,0.42)] backdrop-blur-md sm:px-6 md:px-8 md:py-8";

function getGameShellClasses(selectedGame: Exclude<SelectedGame, null>) {
  if (selectedGame === "game-eek") {
    return "animate-panel-enter relative flex min-h-[calc(100vh-9rem)] w-full flex-col gap-6 overflow-hidden rounded-[2.2rem] border border-[#b084ff33] bg-[radial-gradient(circle_at_top,_rgba(160,105,255,0.22),_transparent_28%),linear-gradient(145deg,_#10081a,_#17152d_42%,_#0a111b)] px-4 py-6 shadow-[0_32px_80px_rgba(8,10,28,0.5)] sm:px-6 md:px-8 md:py-8";
  }

  return "animate-panel-enter relative flex min-h-[calc(100vh-9rem)] w-full flex-col gap-6 overflow-hidden rounded-[2.2rem] border border-cyan-400/20 bg-[radial-gradient(circle_at_top,_rgba(45,212,191,0.16),_transparent_24%),linear-gradient(145deg,_#040712,_#0b1126_42%,_#071624)] px-4 py-6 shadow-[0_32px_80px_rgba(2,12,36,0.55)] sm:px-6 md:px-8 md:py-8";
}

export default function HomeArcade() {
  const router = useRouter();
  const [selectedGame, setSelectedGame] = useState<SelectedGame>(null);

  const handleLogout = () => {
    document.cookie = clearAuthCookie();
    toast.info("Logout berhasil.", {
      position: "top-right",
      progressClassName: "toast-progress-success",
      style: {
        background: "#111111",
        color: "#ffffff",
      },
    });
    router.replace("/auth/login");
    router.refresh();
  };

  return (
    <section className="flex w-full flex-1 flex-col">
      <div className="mb-4 flex w-full items-center justify-end">
        <button
          type="button"
          onClick={handleLogout}
          className="animate-soft-float flex items-center justify-center rounded-full border border-white/10 bg-red-500 p-3 text-white shadow-[0_14px_30px_rgba(239,68,68,0.28)] transition duration-300 hover:scale-105 hover:bg-red-600"
          aria-label="Logout"
          title="Logout"
        >
          <FaPowerOff size={24} />
        </button>
      </div>

      {selectedGame === "game-eek" ? (
        <div className={getGameShellClasses("game-eek")}>
          <Game1 onBack={() => setSelectedGame(null)} />
        </div>
      ) : selectedGame === "poop-survivors" ? (
        <div className={getGameShellClasses("poop-survivors")}>
          <PoopSurvivorsGame onBack={() => setSelectedGame(null)} />
        </div>
      ) : (
        <div className={selectorShellClasses}>
          <div className="animate-ambient-drift absolute top-[-4rem] left-[-4rem] h-48 w-48 rounded-full bg-[#8b5cf622] blur-3xl" />
          <div className="animate-ambient-drift absolute right-[-5rem] top-1/3 h-56 w-56 rounded-full bg-[#22d3ee1c] blur-3xl [animation-delay:-3.4s]" />
          <div className="animate-ambient-drift absolute bottom-[-6rem] left-1/3 h-60 w-60 rounded-full bg-[#f59e0b1d] blur-3xl [animation-delay:-5s]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.06),_transparent_24%),linear-gradient(180deg,_rgba(255,255,255,0.04),_transparent_18%,_transparent_82%,_rgba(255,255,255,0.04))]" />

          <div className="relative z-10 flex w-full flex-1 flex-col justify-center">
            <div className="mx-auto mb-10 max-w-3xl text-center">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.42em] text-slate-300/80">
                Bonus +10 Arcade Edition
              </p>
              <h2 className="animate-title-glow text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
                Pilih Dunia Bonusmu
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                Dua game, dua identitas total. Satu world cozy penuh potion,
                satu lagi arena neon yang cepat, flashy, dan bikin ketagihan.
              </p>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <button
                type="button"
                onClick={() => setSelectedGame("game-eek")}
                className="group relative overflow-hidden rounded-[2rem] border border-[#d8c4ff26] bg-[linear-gradient(160deg,_rgba(28,12,46,0.96),_rgba(39,19,67,0.92)_44%,_rgba(10,22,33,0.95))] p-6 text-left shadow-[0_26px_60px_rgba(12,8,28,0.46)] transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_36px_76px_rgba(104,56,200,0.28)] sm:p-7"
              >
                <div className="animate-card-pan absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(167,139,250,0.18),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(45,212,191,0.12),_transparent_28%)] opacity-90" />
                <span className="animate-sheen absolute inset-y-0 left-[-20%] w-1/4 bg-white/10 blur-xl" />

                <div className="relative z-10 flex h-full flex-col gap-6">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full border border-violet-300/25 bg-violet-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-violet-100">
                      Cozy Clicker
                    </span>
                    <span className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-100">
                      Crafting Rush
                    </span>
                  </div>

                  <div>
                    <div className="mb-3 flex items-center gap-3 text-violet-200">
                      <span className="rounded-2xl bg-violet-400/10 p-3 text-xl">
                        <FaFlask />
                      </span>
                      <span className="rounded-2xl bg-emerald-400/10 p-3 text-xl text-emerald-200">
                        <FaMagic />
                      </span>
                    </div>
                    <h3 className="text-3xl font-black tracking-tight text-white sm:text-[2.35rem]">
                      Mystic Alchemy Lab
                    </h3>
                    <p className="mt-3 max-w-xl text-sm leading-7 text-slate-200 sm:text-base">
                      Bangun laboratorium sihir, aduk essence, penuhi potion
                      order, dan pecahkan best brew dengan golden ingredient
                      yang meledak penuh spark.
                    </p>
                  </div>

                  <div className="rounded-[1.6rem] border border-white/8 bg-black/20 p-5 backdrop-blur-sm">
                    <div className="mb-4 flex items-center justify-between text-xs uppercase tracking-[0.28em] text-violet-100/85">
                      <span>Preview Loop</span>
                      <span>Alchemy Grade S</span>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-[1.3fr_0.9fr]">
                      <div className="alchemy-preview relative min-h-[12rem] overflow-hidden rounded-[1.4rem] border border-violet-200/15 bg-[linear-gradient(180deg,_rgba(46,16,79,0.88),_rgba(13,34,46,0.9))]">
                        <div className="alchemy-preview-orb absolute left-8 top-6 h-14 w-14 rounded-full bg-emerald-300/30 blur-lg" />
                        <div className="alchemy-preview-orb absolute right-10 top-10 h-12 w-12 rounded-full bg-violet-300/30 blur-lg [animation-delay:-1.2s]" />
                        <div className="absolute inset-x-8 bottom-8 rounded-[999px] border border-[#d6b4ff66] bg-[linear-gradient(180deg,_rgba(139,92,246,0.5),_rgba(4,120,87,0.45))] px-6 py-7 shadow-[inset_0_0_24px_rgba(255,255,255,0.06)]">
                          <div className="mx-auto mb-3 flex w-fit gap-2">
                            <span className="alchemy-bubble h-4 w-4 rounded-full bg-emerald-200/70" />
                            <span className="alchemy-bubble h-3 w-3 rounded-full bg-violet-200/70 [animation-delay:-0.8s]" />
                            <span className="alchemy-bubble h-5 w-5 rounded-full bg-amber-200/70 [animation-delay:-1.4s]" />
                          </div>
                          <div className="text-center text-5xl">⚗️</div>
                        </div>
                      </div>

                      <div className="grid gap-3 text-sm text-slate-100/90">
                        <div className="rounded-2xl border border-white/8 bg-white/6 p-4">
                          <p className="text-xs uppercase tracking-[0.24em] text-slate-300">
                            Core Hook
                          </p>
                          <p className="mt-2 font-semibold">
                            Tap, auto-brew, objective order, dan catalyst
                            multiplier.
                          </p>
                        </div>
                        <div className="rounded-2xl border border-white/8 bg-white/6 p-4">
                          <p className="text-xs uppercase tracking-[0.24em] text-slate-300">
                            Wow Factor
                          </p>
                          <p className="mt-2 font-semibold">
                            Golden ingredient event dan bubbling cauldron yang
                            hidup.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto flex items-center justify-between gap-4 text-sm text-slate-200">
                    <div className="flex gap-3">
                      <span className="rounded-full bg-violet-300/10 px-3 py-2">
                        Essence
                      </span>
                      <span className="rounded-full bg-emerald-300/10 px-3 py-2">
                        Orders
                      </span>
                    </div>
                    <span className="text-base font-semibold text-violet-100">
                      Mainkan Lab
                    </span>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedGame("poop-survivors")}
                className="group relative overflow-hidden rounded-[2rem] border border-cyan-300/20 bg-[linear-gradient(155deg,_rgba(3,7,25,0.96),_rgba(7,20,44,0.94)_42%,_rgba(3,30,40,0.92))] p-6 text-left shadow-[0_26px_60px_rgba(3,12,34,0.56)] transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_36px_76px_rgba(34,211,238,0.22)] sm:p-7"
              >
                <div className="animate-card-pan absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.18),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(244,114,182,0.14),_transparent_30%)] opacity-95" />
                <span className="animate-sheen absolute inset-y-0 left-[-20%] w-1/4 bg-white/12 blur-xl [animation-delay:-1.4s]" />

                <div className="relative z-10 flex h-full flex-col gap-6">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100">
                      Arcade Shooter
                    </span>
                    <span className="rounded-full border border-pink-300/25 bg-pink-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-pink-100">
                      Boss Stage
                    </span>
                  </div>

                  <div>
                    <div className="mb-3 flex items-center gap-3 text-cyan-200">
                      <span className="rounded-2xl bg-cyan-300/10 p-3 text-xl">
                        <FaRocket />
                      </span>
                      <span className="rounded-2xl bg-pink-300/10 p-3 text-xl text-pink-200">
                        <FaMeteor />
                      </span>
                    </div>
                    <h3 className="text-3xl font-black tracking-tight text-white sm:text-[2.35rem]">
                      Neon Void Squadron
                    </h3>
                    <p className="mt-3 max-w-xl text-sm leading-7 text-slate-200 sm:text-base">
                      Terbang di arena cyber, sapu wave dengan energy burst,
                      aktifkan overdrive, kumpulkan core, dan habisi boss neon
                      ber-phase untuk best stage.
                    </p>
                  </div>

                  <div className="rounded-[1.6rem] border border-white/8 bg-black/20 p-5 backdrop-blur-sm">
                    <div className="mb-4 flex items-center justify-between text-xs uppercase tracking-[0.28em] text-cyan-100/85">
                      <span>Preview Loop</span>
                      <span>Neon Threat Rank</span>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-[1.3fr_0.9fr]">
                      <div className="neon-preview relative min-h-[12rem] overflow-hidden rounded-[1.4rem] border border-cyan-200/18 bg-[linear-gradient(180deg,_rgba(7,15,35,0.92),_rgba(5,9,20,0.94))]">
                        <div className="neon-grid absolute inset-0 opacity-80" />
                        <div className="absolute left-1/2 top-8 h-10 w-10 -translate-x-1/2 rounded-full bg-pink-500/25 blur-lg" />
                        <div className="absolute left-1/2 top-10 h-10 w-10 -translate-x-1/2 rounded-[1.1rem] border border-cyan-300/60 bg-[linear-gradient(180deg,_rgba(96,165,250,0.95),_rgba(14,165,233,0.5))] [clip-path:polygon(50%_0%,100%_62%,62%_100%,38%_100%,0%_62%)] shadow-[0_0_20px_rgba(34,211,238,0.3)]" />
                        <div className="absolute left-[28%] top-[48%] h-4 w-4 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(103,232,249,0.9)]" />
                        <div className="absolute left-[48%] top-[36%] h-5 w-5 rounded-full border border-pink-400/70 bg-pink-500/20 shadow-[0_0_18px_rgba(244,114,182,0.6)]" />
                        <div className="absolute right-[18%] top-[58%] h-6 w-6 rounded-[0.8rem] border border-violet-300/70 bg-violet-500/20 shadow-[0_0_18px_rgba(167,139,250,0.45)]" />
                      </div>

                      <div className="grid gap-3 text-sm text-slate-100/90">
                        <div className="rounded-2xl border border-white/8 bg-white/6 p-4">
                          <p className="text-xs uppercase tracking-[0.24em] text-slate-300">
                            Core Hook
                          </p>
                          <p className="mt-2 font-semibold">
                            Wave shooter, pickup, skill point, overdrive, boss
                            warning.
                          </p>
                        </div>
                        <div className="rounded-2xl border border-white/8 bg-white/6 p-4">
                          <p className="text-xs uppercase tracking-[0.24em] text-slate-300">
                            Wow Factor
                          </p>
                          <p className="mt-2 font-semibold">
                            Neon blast, muzzle flash, elite enemy pattern, dan
                            boss phase.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto flex items-center justify-between gap-4 text-sm text-slate-200">
                    <div className="flex gap-3">
                      <span className="rounded-full bg-cyan-300/10 px-3 py-2">
                        Waves
                      </span>
                      <span className="rounded-full bg-pink-300/10 px-3 py-2">
                        Overdrive
                      </span>
                    </div>
                    <span className="flex items-center gap-2 text-base font-semibold text-cyan-100">
                      <FaBolt />
                      Masuk Squadron
                    </span>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
