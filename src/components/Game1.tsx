"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  FaArrowLeft,
  FaBolt,
  FaFlask,
  FaLeaf,
  FaMagic,
  FaMoon,
  FaStar,
} from "react-icons/fa";
import { toast } from "react-toastify";

type FloatingSpark = {
  id: number;
  tone: "crit" | "gold" | "normal";
  value: string;
  x: number;
  y: number;
};

type GoldenIngredient = {
  id: number;
  reward: number;
  x: number;
  y: number;
};

type PotionOrder = {
  id: number;
  name: string;
  reputationReward: number;
  reward: number;
  startBrewed: number;
  target: number;
};

type Game1Props = {
  onBack: () => void;
};

const BEST_ESSENCE_KEY = "ugd5-alchemy-best-essence";
const BEST_RANK_KEY = "ugd5-alchemy-best-rank";

const ADJECTIVES = [
  "Moonlit",
  "Solar",
  "Glimmer",
  "Astral",
  "Verdant",
  "Stardust",
  "Radiant",
  "Velvet",
];

const POTION_NAMES = [
  "Serum",
  "Essence",
  "Elixir",
  "Draft",
  "Tonic",
  "Catalyst",
  "Infusion",
  "Brew",
];

const LAB_RANKS = [
  "Initiate Brewer",
  "Rune Mixer",
  "Moon Archivist",
  "Star Alchemist",
  "Grand Catalyst",
  "Arcane Curator",
  "Celestial Master",
];

function formatNumber(value: number) {
  return new Intl.NumberFormat("id-ID").format(Math.floor(value));
}

function getReputationProgress(totalReputation: number) {
  let level = 1;
  let remaining = totalReputation;
  let requirement = 140;

  while (remaining >= requirement) {
    remaining -= requirement;
    level += 1;
    requirement = Math.round(requirement * 1.22);
  }

  return {
    current: remaining,
    currentRank:
      LAB_RANKS[Math.min(level - 1, LAB_RANKS.length - 1)] ??
      LAB_RANKS[LAB_RANKS.length - 1],
    level,
    progress: Math.min((remaining / requirement) * 100, 100),
    requirement,
  };
}

function createPotionOrder(
  orderId: number,
  reputationLevel: number,
  startBrewed: number,
): PotionOrder {
  const adjective = ADJECTIVES[(orderId + reputationLevel) % ADJECTIVES.length];
  const potionName = POTION_NAMES[(orderId * 2 + reputationLevel) % POTION_NAMES.length];
  const target = Math.round(90 + orderId * 38 + reputationLevel * 32);
  const reward = Math.round(target * 0.34 + reputationLevel * 18);
  const reputationReward = Math.round(18 + reputationLevel * 8 + orderId * 1.4);

  return {
    id: orderId,
    name: `${adjective} ${potionName}`,
    reputationReward,
    reward,
    startBrewed,
    target,
  };
}

export default function Game1({ onBack }: Game1Props) {
  const [essence, setEssence] = useState(0);
  const [totalBrewed, setTotalBrewed] = useState(0);
  const [totalReputation, setTotalReputation] = useState(0);
  const [stirPower, setStirPower] = useState(1);
  const [autoBrew, setAutoBrew] = useState(1);
  const [catalystLevel, setCatalystLevel] = useState(0);
  const [goldenBloomLevel, setGoldenBloomLevel] = useState(0);
  const [stirCost, setStirCost] = useState(16);
  const [apprenticeCost, setApprenticeCost] = useState(28);
  const [catalystCost, setCatalystCost] = useState(52);
  const [goldenBloomCost, setGoldenBloomCost] = useState(96);
  const [completedOrders, setCompletedOrders] = useState(0);
  const [activeOrder, setActiveOrder] = useState<PotionOrder>(() =>
    createPotionOrder(1, 1, 0),
  );
  const [floatingSparks, setFloatingSparks] = useState<FloatingSpark[]>([]);
  const [goldenIngredient, setGoldenIngredient] = useState<GoldenIngredient | null>(
    null,
  );
  const [bestEssence, setBestEssence] = useState(0);
  const [bestRank, setBestRank] = useState(1);
  const sparkTimeoutsRef = useRef<number[]>([]);
  const goldenIngredientTimeoutRef = useRef<number | null>(null);
  const previousReputationLevelRef = useRef(1);

  const reputationInfo = useMemo(
    () => getReputationProgress(totalReputation),
    [totalReputation],
  );
  const brewMultiplier = useMemo(
    () => 1 + catalystLevel * 0.4,
    [catalystLevel],
  );
  const critChance = useMemo(
    () => 0.1 + catalystLevel * 0.035 + goldenBloomLevel * 0.025,
    [catalystLevel, goldenBloomLevel],
  );
  const critMultiplier = useMemo(
    () => 2.1 + catalystLevel * 0.18,
    [catalystLevel],
  );
  const manualBrew = useMemo(
    () => Math.round(stirPower * brewMultiplier),
    [brewMultiplier, stirPower],
  );
  const passiveBrew = useMemo(
    () => Math.round(autoBrew * brewMultiplier),
    [autoBrew, brewMultiplier],
  );
  const orderProgressValue = useMemo(
    () => Math.max(totalBrewed - activeOrder.startBrewed, 0),
    [activeOrder.startBrewed, totalBrewed],
  );
  const orderProgress = useMemo(
    () => Math.min((orderProgressValue / activeOrder.target) * 100, 100),
    [activeOrder.target, orderProgressValue],
  );
  const canClaimOrder = orderProgressValue >= activeOrder.target;

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storedBestEssence = window.localStorage.getItem(BEST_ESSENCE_KEY);
    const storedBestRank = window.localStorage.getItem(BEST_RANK_KEY);

    if (storedBestEssence) {
      setBestEssence(Number(storedBestEssence));
    }

    if (storedBestRank) {
      setBestRank(Number(storedBestRank));
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(BEST_ESSENCE_KEY, String(bestEssence));
  }, [bestEssence]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(BEST_RANK_KEY, String(bestRank));
  }, [bestRank]);

  useEffect(() => {
    if (reputationInfo.level <= previousReputationLevelRef.current) {
      return;
    }

    toast.success(`Lab Rank naik ke Lv.${reputationInfo.level}!`, {
      position: "top-right",
      progressClassName: "toast-progress-success",
      style: {
        background: "#111111",
        color: "#ffffff",
      },
    });
    previousReputationLevelRef.current = reputationInfo.level;
  }, [reputationInfo.level]);

  useEffect(() => {
    if (reputationInfo.level > bestRank) {
      setBestRank(reputationInfo.level);
    }
  }, [bestRank, reputationInfo.level]);

  useEffect(() => {
    const idleTimer = window.setInterval(() => {
      const idleValue = Math.max(passiveBrew, 1);
      const id = Date.now() + Math.random();

      setEssence((previousEssence) => {
        const updatedEssence = previousEssence + idleValue;

        setBestEssence((previousBestEssence) =>
          Math.max(previousBestEssence, updatedEssence),
        );

        return updatedEssence;
      });
      setTotalBrewed((previousBrewed) => previousBrewed + idleValue);
      setTotalReputation(
        (previousReputation) =>
          previousReputation + Math.max(1, Math.round(idleValue * 0.35)),
      );
      setFloatingSparks((previousSparks) => [
        ...previousSparks,
        {
          id,
          tone: "normal",
          value: `+${formatNumber(idleValue)}`,
          x: 50 + (Math.random() * 34 - 17),
          y: 68 + Math.random() * 12,
        },
      ]);

      const timeout = window.setTimeout(() => {
        setFloatingSparks((previousSparks) =>
          previousSparks.filter((spark) => spark.id !== id),
        );
      }, 1150);

      sparkTimeoutsRef.current.push(timeout);
    }, 1000);

    return () => window.clearInterval(idleTimer);
  }, [passiveBrew]);

  useEffect(() => {
    const spawnTimer = window.setInterval(() => {
      if (goldenIngredient) {
        return;
      }

      const reward = Math.round(
        70 +
          reputationInfo.level * 26 +
          stirPower * 6 +
          goldenBloomLevel * 34 +
          Math.random() * 48,
      );

      const ingredient = {
        id: Date.now(),
        reward,
        x: 14 + Math.random() * 72,
        y: 8 + Math.random() * 54,
      };

      setGoldenIngredient(ingredient);

      if (goldenIngredientTimeoutRef.current) {
        window.clearTimeout(goldenIngredientTimeoutRef.current);
      }

      goldenIngredientTimeoutRef.current = window.setTimeout(() => {
        setGoldenIngredient((currentIngredient) =>
          currentIngredient?.id === ingredient.id ? null : currentIngredient,
        );
      }, Math.max(5600 - goldenBloomLevel * 320, 3600));
    }, Math.max(11000 - goldenBloomLevel * 1200, 6500));

    return () => {
      window.clearInterval(spawnTimer);

      if (goldenIngredientTimeoutRef.current) {
        window.clearTimeout(goldenIngredientTimeoutRef.current);
      }
    };
  }, [goldenBloomLevel, goldenIngredient, reputationInfo.level, stirPower]);

  useEffect(() => {
    return () => {
      sparkTimeoutsRef.current.forEach((timeout) => window.clearTimeout(timeout));
      sparkTimeoutsRef.current = [];
    };
  }, []);

  const showSuccessToast = (message: string) => {
    toast.success(message, {
      position: "top-right",
      progressClassName: "toast-progress-success",
      style: {
        background: "#111111",
        color: "#ffffff",
      },
    });
  };

  const showErrorToast = (message: string) => {
    toast.error(message, {
      position: "top-right",
      progressClassName: "toast-progress-error",
      style: {
        background: "#111111",
        color: "#ffffff",
      },
    });
  };

  const addSpark = (
    value: string,
    tone: FloatingSpark["tone"],
    x = 50 + (Math.random() * 34 - 17),
    y = 68 + Math.random() * 12,
  ) => {
    const id = Date.now() + Math.random();

    setFloatingSparks((previousSparks) => [
      ...previousSparks,
      {
        id,
        tone,
        value,
        x,
        y,
      },
    ]);

    const timeout = window.setTimeout(() => {
      setFloatingSparks((previousSparks) =>
        previousSparks.filter((spark) => spark.id !== id),
      );
    }, 1150);

    sparkTimeoutsRef.current.push(timeout);
  };

  const grantEssence = (
    amount: number,
    options?: {
      floatPrefix?: string;
      reputationBoost?: number;
      tone?: FloatingSpark["tone"];
      trackBrewed?: boolean;
    },
  ) => {
    const nextAmount = Math.max(1, Math.round(amount));

    setEssence((previousEssence) => {
      const updatedEssence = previousEssence + nextAmount;

      setBestEssence((previousBestEssence) =>
        Math.max(previousBestEssence, updatedEssence),
      );

      return updatedEssence;
    });

    if (options?.trackBrewed !== false) {
      setTotalBrewed((previousBrewed) => previousBrewed + nextAmount);
    }

    setTotalReputation(
      (previousReputation) =>
        previousReputation +
        (options?.reputationBoost ?? Math.max(1, Math.round(nextAmount * 0.45))),
    );

    addSpark(
      `${options?.floatPrefix ?? "+"}${formatNumber(nextAmount)}`,
      options?.tone ?? "normal",
    );
  };

  const handleTap = () => {
    const didCrit = Math.random() < critChance;
    const brewedAmount = didCrit
      ? manualBrew * critMultiplier
      : manualBrew;

    grantEssence(brewedAmount, {
      floatPrefix: didCrit ? "CRIT +" : "+",
      reputationBoost: Math.max(2, Math.round(brewedAmount * 0.5)),
      tone: didCrit ? "crit" : "normal",
      trackBrewed: true,
    });
  };

  const handleCollectGoldenIngredient = () => {
    if (!goldenIngredient) {
      return;
    }

    const bonusReward = Math.round(goldenIngredient.reward * brewMultiplier);

    grantEssence(bonusReward, {
      floatPrefix: "GOLD +",
      reputationBoost: Math.round(bonusReward * 0.75),
      tone: "gold",
      trackBrewed: true,
    });
    setGoldenIngredient(null);
    showSuccessToast("Golden ingredient berhasil dipanen!");
  };

  const claimOrder = () => {
    if (!canClaimOrder) {
      showErrorToast("Potion order belum selesai.");
      return;
    }

    const nextReputationLevel = getReputationProgress(
      totalReputation + activeOrder.reputationReward,
    ).level;
    const nextOrder = createPotionOrder(
      activeOrder.id + 1,
      nextReputationLevel,
      totalBrewed,
    );

    setEssence((previousEssence) => {
      const updatedEssence = previousEssence + activeOrder.reward;

      setBestEssence((previousBestEssence) =>
        Math.max(previousBestEssence, updatedEssence),
      );

      return updatedEssence;
    });
    setTotalReputation(
      (previousReputation) => previousReputation + activeOrder.reputationReward,
    );
    setCompletedOrders((previousCompletedOrders) => previousCompletedOrders + 1);
    setActiveOrder(nextOrder);
    addSpark(
      `Order +${formatNumber(activeOrder.reward)}`,
      "gold",
      78,
      26,
    );
    showSuccessToast(`${activeOrder.name} berhasil dikirim!`);
  };

  const purchaseUpgrade = (
    cost: number,
    onPurchase: () => void,
    errorMessage: string,
  ) => {
    if (essence < cost) {
      showErrorToast(errorMessage);
      return;
    }

    setEssence((previousEssence) => previousEssence - cost);
    onPurchase();
  };

  return (
    <section className="animate-panel-enter relative w-full max-w-none overflow-hidden rounded-[2rem] border border-violet-200/10 bg-[linear-gradient(145deg,_rgba(17,8,30,0.96),_rgba(25,14,43,0.96)_42%,_rgba(7,18,26,0.94))] p-4 shadow-[0_32px_80px_rgba(6,8,18,0.48)] md:p-6">
      <div className="animate-ambient-drift absolute left-[-3rem] top-[-3rem] h-48 w-48 rounded-full bg-[#a855f71a] blur-3xl" />
      <div className="animate-ambient-drift absolute bottom-[-4rem] right-[-3rem] h-56 w-56 rounded-full bg-[#34d39918] blur-3xl [animation-delay:-3s]" />
      <div className="alchemy-mist absolute inset-0 opacity-70" />

      <div className="relative z-10 grid gap-6 xl:grid-cols-[1.2fr_0.9fr]">
        <div className="overflow-hidden rounded-[1.9rem] border border-violet-200/12 bg-[linear-gradient(180deg,_rgba(26,12,43,0.94),_rgba(8,17,29,0.95))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/8 pb-5">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.38em] text-violet-200/80">
                Cozy Crafting Clicker
              </p>
              <h2 className="animate-title-glow text-3xl font-black tracking-tight text-white sm:text-5xl">
                Mystic Alchemy Lab
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300 md:text-base">
                Aduk essence, naikkan reputasi laboratorium, dan selesaikan
                potion order untuk membuka tier sihir yang lebih langka.
              </p>
            </div>

            <div className="rounded-[1.4rem] border border-emerald-300/20 bg-emerald-300/8 px-4 py-3 text-right shadow-[0_16px_32px_rgba(52,211,153,0.08)]">
              <p className="text-xs uppercase tracking-[0.28em] text-emerald-100/70">
                Best Record
              </p>
              <p className="mt-2 text-xl font-black text-white">
                {formatNumber(bestEssence)} Essence
              </p>
              <p className="mt-1 text-sm text-emerald-100/80">
                Highest Rank Lv.{bestRank}
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[1.3rem] border border-violet-300/12 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-300/75">
                Essence
              </p>
              <p className="mt-2 text-2xl font-black text-white">
                {formatNumber(essence)}
              </p>
            </div>
            <div className="rounded-[1.3rem] border border-violet-300/12 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-300/75">
                Reputation
              </p>
              <p className="mt-2 text-2xl font-black text-white">
                Lv.{reputationInfo.level}
              </p>
              <p className="mt-1 text-xs text-violet-100/80">
                {reputationInfo.currentRank}
              </p>
            </div>
            <div className="rounded-[1.3rem] border border-violet-300/12 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-300/75">
                Brew Power
              </p>
              <p className="mt-2 text-2xl font-black text-white">
                +{formatNumber(manualBrew)}
              </p>
            </div>
            <div className="rounded-[1.3rem] border border-violet-300/12 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-300/75">
                Auto Brew
              </p>
              <p className="mt-2 text-2xl font-black text-white">
                +{formatNumber(passiveBrew)}/s
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-[1.7rem] border border-violet-200/12 bg-[linear-gradient(180deg,_rgba(53,22,84,0.42),_rgba(10,18,33,0.42))] p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-violet-100/75">
                    Active Order
                  </p>
                  <h3 className="mt-1 text-2xl font-black text-white">
                    {activeOrder.name}
                  </h3>
                </div>
                <div className="rounded-[1.2rem] border border-amber-300/20 bg-amber-300/8 px-3 py-2 text-right text-sm text-amber-100">
                  Reward {formatNumber(activeOrder.reward)}
                </div>
              </div>

              <div className="h-4 overflow-hidden rounded-full bg-[#160f22] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]">
                <div
                  className="alchemy-progress h-full rounded-full bg-[linear-gradient(90deg,_#a855f7,_#34d399,_#fde047)]"
                  style={{ width: `${orderProgress}%` }}
                />
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-200">
                <span>
                  Progress {formatNumber(orderProgressValue)} /{" "}
                  {formatNumber(activeOrder.target)}
                </span>
                <span>+{activeOrder.reputationReward} reputation</span>
              </div>

              <button
                type="button"
                onClick={claimOrder}
                disabled={!canClaimOrder}
                className={`mt-4 w-full rounded-[1.15rem] border px-4 py-3 text-sm font-semibold transition ${
                  canClaimOrder
                    ? "border-emerald-300/40 bg-emerald-400/15 text-white hover:-translate-y-0.5 hover:bg-emerald-400/22"
                    : "cursor-not-allowed border-white/8 bg-white/5 text-slate-400"
                }`}
              >
                {canClaimOrder ? "Kirim Potion Order" : "Order Belum Selesai"}
              </button>
            </div>

            <div className="rounded-[1.7rem] border border-violet-200/12 bg-[linear-gradient(180deg,_rgba(17,19,35,0.86),_rgba(12,10,23,0.82))] p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-300/75">
                    Lab Reputation
                  </p>
                  <h3 className="mt-1 text-xl font-black text-white">
                    {reputationInfo.currentRank}
                  </h3>
                </div>
                <span className="rounded-full bg-violet-400/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-violet-100">
                  Lv.{reputationInfo.level}
                </span>
              </div>

              <div className="mt-4 h-3 overflow-hidden rounded-full bg-black/40">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,_#34d399,_#a855f7)] transition-all duration-500"
                  style={{ width: `${reputationInfo.progress}%` }}
                />
              </div>
              <p className="mt-3 text-sm text-slate-300">
                {formatNumber(reputationInfo.current)} /{" "}
                {formatNumber(reputationInfo.requirement)} ke rank berikutnya.
              </p>

              <div className="mt-5 grid gap-3 text-sm text-slate-200 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/6 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                    Catalyst
                  </p>
                  <p className="mt-2 text-lg font-bold text-white">
                    x{brewMultiplier.toFixed(1)}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/6 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                    Crit Chance
                  </p>
                  <p className="mt-2 text-lg font-bold text-white">
                    {(critChance * 100).toFixed(0)}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative mt-6 overflow-hidden rounded-[1.9rem] border border-violet-200/12 bg-[linear-gradient(180deg,_rgba(51,24,82,0.7),_rgba(11,27,37,0.92))] px-5 pb-8 pt-6 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
            <div className="pointer-events-none absolute inset-x-4 top-4 flex justify-between opacity-80">
              <span className="alchemy-bubble h-4 w-4 rounded-full bg-emerald-200/70" />
              <span className="alchemy-bubble h-3 w-3 rounded-full bg-violet-200/80 [animation-delay:-0.8s]" />
              <span className="alchemy-bubble h-5 w-5 rounded-full bg-amber-200/80 [animation-delay:-1.2s]" />
              <span className="alchemy-bubble h-4 w-4 rounded-full bg-cyan-200/80 [animation-delay:-1.7s]" />
            </div>

            <p className="mb-4 text-xs uppercase tracking-[0.34em] text-violet-100/75">
              Tap To Brew Essence
            </p>

            <div className="relative mx-auto max-w-3xl">
              <button
                type="button"
                onClick={handleTap}
                className="alchemy-cauldron group relative mx-auto flex h-64 w-full items-center justify-center overflow-hidden rounded-[999px] border border-violet-200/18 bg-[linear-gradient(180deg,_rgba(117,72,173,0.4),_rgba(19,45,57,0.75))] shadow-[0_24px_60px_rgba(29,10,44,0.45)] transition duration-300 hover:scale-[1.01] md:h-72"
                aria-label="Brew essence"
              >
                <span className="animate-sheen absolute inset-y-0 left-[-18%] w-1/4 bg-white/10 blur-xl" />
                <span className="alchemy-core absolute left-1/2 top-[42%] h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-300/18 blur-2xl" />
                <span className="absolute left-1/2 top-[44%] -translate-x-1/2 -translate-y-1/2 text-7xl drop-shadow-[0_10px_20px_rgba(255,255,255,0.18)] md:text-8xl">
                  ⚗️
                </span>
                <div className="pointer-events-none absolute bottom-8 left-1/2 flex -translate-x-1/2 items-center gap-3 text-xs uppercase tracking-[0.3em] text-violet-100/80">
                  <span>Brew</span>
                  <span className="rounded-full border border-white/10 bg-black/15 px-3 py-1">
                    +{formatNumber(manualBrew)}
                  </span>
                </div>
              </button>

              {goldenIngredient ? (
                <button
                  type="button"
                  onClick={handleCollectGoldenIngredient}
                  className="golden-ingredient absolute z-20 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-amber-200/70 bg-[radial-gradient(circle_at_top,_rgba(253,224,71,0.9),_rgba(249,115,22,0.9))] text-2xl shadow-[0_0_26px_rgba(250,204,21,0.55)]"
                  style={{
                    left: `${goldenIngredient.x}%`,
                    top: `${goldenIngredient.y}%`,
                  }}
                  aria-label="Collect golden ingredient"
                  title={`Collect +${formatNumber(goldenIngredient.reward)}`}
                >
                  ✦
                </button>
              ) : null}

              {floatingSparks.map((spark) => (
                <span
                  key={spark.id}
                  className={`animate-float-point pointer-events-none absolute left-0 top-0 rounded-full px-3 py-1 text-sm font-bold shadow-[0_8px_18px_rgba(0,0,0,0.3)] ${
                    spark.tone === "gold"
                      ? "bg-amber-300/18 text-amber-100"
                      : spark.tone === "crit"
                        ? "bg-violet-300/18 text-violet-100"
                        : "bg-emerald-300/18 text-emerald-100"
                  }`}
                  style={{
                    left: `${spark.x}%`,
                    top: `${spark.y}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  {spark.value}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-[1.9rem] border border-violet-200/10 bg-[linear-gradient(180deg,_rgba(9,14,25,0.94),_rgba(11,8,22,0.98))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] md:p-6">
          <div className="flex items-center justify-between gap-3 border-b border-white/8 pb-5">
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-slate-400">
                Upgrade Shelf
              </p>
              <h3 className="mt-2 text-2xl font-black text-white">
                Brewing Upgrades
              </h3>
            </div>
            <span className="rounded-full bg-violet-400/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-violet-100">
              {completedOrders} Orders
            </span>
          </div>

          <div className="mt-5 grid gap-4">
            <button
              type="button"
              onClick={() =>
                purchaseUpgrade(
                  stirCost,
                  () => {
                    setStirPower((previousPower) => previousPower + 1);
                    setStirCost((previousCost) => Math.floor(previousCost * 1.58));
                    showSuccessToast("Stir Focus meningkat!");
                  },
                  "Essence belum cukup untuk Stir Focus.",
                )
              }
              className="group relative overflow-hidden rounded-[1.5rem] border border-violet-300/15 bg-white/6 p-4 text-left transition duration-300 hover:-translate-y-1 hover:bg-white/8"
            >
              <span className="animate-sheen absolute inset-y-0 left-[-22%] w-1/4 bg-white/8 blur-xl" />
              <div className="relative z-10 flex items-start gap-4">
                <span className="rounded-2xl bg-violet-400/10 p-3 text-violet-200">
                  <FaFlask />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="text-lg font-bold text-white">
                      Stir Focus
                    </h4>
                    <span className="text-sm font-semibold text-violet-100">
                      {formatNumber(stirCost)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    Perbesar kekuatan tiap adukan supaya brew manual makin
                    berdampak.
                  </p>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() =>
                purchaseUpgrade(
                  apprenticeCost,
                  () => {
                    setAutoBrew((previousAutoBrew) => previousAutoBrew + 1);
                    setApprenticeCost((previousCost) =>
                      Math.floor(previousCost * 1.82),
                    );
                    showSuccessToast("Apprentice Brew bertambah!");
                  },
                  "Essence belum cukup untuk Apprentice Brew.",
                )
              }
              className="group relative overflow-hidden rounded-[1.5rem] border border-emerald-300/15 bg-white/6 p-4 text-left transition duration-300 hover:-translate-y-1 hover:bg-white/8"
            >
              <span className="animate-sheen absolute inset-y-0 left-[-22%] w-1/4 bg-white/8 blur-xl [animation-delay:-1.1s]" />
              <div className="relative z-10 flex items-start gap-4">
                <span className="rounded-2xl bg-emerald-400/10 p-3 text-emerald-200">
                  <FaLeaf />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="text-lg font-bold text-white">
                      Apprentice Brew
                    </h4>
                    <span className="text-sm font-semibold text-emerald-100">
                      {formatNumber(apprenticeCost)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    Tambah alchemist apprentice untuk auto-brew essence tiap
                    detik.
                  </p>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() =>
                purchaseUpgrade(
                  catalystCost,
                  () => {
                    setCatalystLevel((previousCatalystLevel) => previousCatalystLevel + 1);
                    setCatalystCost((previousCost) =>
                      Math.floor(previousCost * 1.9),
                    );
                    showSuccessToast("Catalyst Prism aktif!");
                  },
                  "Essence belum cukup untuk Catalyst Prism.",
                )
              }
              className="group relative overflow-hidden rounded-[1.5rem] border border-amber-300/15 bg-white/6 p-4 text-left transition duration-300 hover:-translate-y-1 hover:bg-white/8"
            >
              <span className="animate-sheen absolute inset-y-0 left-[-22%] w-1/4 bg-white/8 blur-xl [animation-delay:-2s]" />
              <div className="relative z-10 flex items-start gap-4">
                <span className="rounded-2xl bg-amber-400/10 p-3 text-amber-200">
                  <FaMagic />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="text-lg font-bold text-white">
                      Catalyst Prism
                    </h4>
                    <span className="text-sm font-semibold text-amber-100">
                      {formatNumber(catalystCost)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    Naikkan multiplier brew sekaligus memperbesar peluang crit
                    brew.
                  </p>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() =>
                purchaseUpgrade(
                  goldenBloomCost,
                  () => {
                    setGoldenBloomLevel(
                      (previousGoldenBloomLevel) => previousGoldenBloomLevel + 1,
                    );
                    setGoldenBloomCost((previousCost) =>
                      Math.floor(previousCost * 2.08),
                    );
                    showSuccessToast("Golden Bloom membanjiri lab!");
                  },
                  "Essence belum cukup untuk Golden Bloom.",
                )
              }
              className="group relative overflow-hidden rounded-[1.5rem] border border-cyan-300/15 bg-white/6 p-4 text-left transition duration-300 hover:-translate-y-1 hover:bg-white/8"
            >
              <span className="animate-sheen absolute inset-y-0 left-[-22%] w-1/4 bg-white/8 blur-xl [animation-delay:-2.8s]" />
              <div className="relative z-10 flex items-start gap-4">
                <span className="rounded-2xl bg-cyan-400/10 p-3 text-cyan-200">
                  <FaMoon />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="text-lg font-bold text-white">
                      Golden Bloom
                    </h4>
                    <span className="text-sm font-semibold text-cyan-100">
                      {formatNumber(goldenBloomCost)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    Percepat spawn golden ingredient dan perbesar bonus reward
                    langka.
                  </p>
                </div>
              </div>
            </button>
          </div>

          <div className="mt-5 rounded-[1.6rem] border border-white/8 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
              Lab Notes
            </p>
            <div className="mt-4 grid gap-3 text-sm text-slate-200">
              <div className="flex items-center justify-between gap-3 rounded-2xl bg-black/15 px-4 py-3">
                <span className="flex items-center gap-2">
                  <FaBolt className="text-amber-300" />
                  Crit Brew
                </span>
                <span>{(critChance * 100).toFixed(0)}%</span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-2xl bg-black/15 px-4 py-3">
                <span className="flex items-center gap-2">
                  <FaStar className="text-violet-300" />
                  Catalyst Multiplier
                </span>
                <span>x{brewMultiplier.toFixed(1)}</span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-2xl bg-black/15 px-4 py-3">
                <span className="flex items-center gap-2">
                  <FaMoon className="text-cyan-300" />
                  Golden Bloom Level
                </span>
                <span>{goldenBloomLevel}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onBack}
            className="mt-6 w-full rounded-[1.35rem] border border-white/10 bg-[#1b2435] px-5 py-4 font-semibold text-white transition duration-300 hover:-translate-y-1 hover:bg-[#232f45]"
          >
            <FaArrowLeft className="mr-2 inline-block align-[-0.15em]" />
            Back to Game Selection
          </button>
        </div>
      </div>
    </section>
  );
}
