"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  FaArrowLeft,
  FaLevelUpAlt,
  FaPlusCircle,
  FaRocket,
  FaStar,
} from "react-icons/fa";
import { toast } from "react-toastify";

type FloatingPoint = {
  id: number;
  offset: number;
  value: string;
};

type Game1Props = {
  onBack: () => void;
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("id-ID").format(value);
}

export default function Game1({ onBack }: Game1Props) {
  const [score, setScore] = useState(0);
  const [manualClickBoost, setManualClickBoost] = useState(0);
  const [idlePoint, setIdlePoint] = useState(1);
  const [clickUpgradeCost, setClickUpgradeCost] = useState(10);
  const [autoClickCost, setAutoClickCost] = useState(20);
  const [doublePointUnlocked, setDoublePointUnlocked] = useState(false);
  const [fivePointUnlocked, setFivePointUnlocked] = useState(false);
  const [floatingPoints, setFloatingPoints] = useState<FloatingPoint[]>([]);
  const previousLevelRef = useRef(1);

  const { level, levelTarget } = useMemo(() => {
    let nextLevel = 1;
    let nextTarget = 100;

    while (score >= nextTarget) {
      nextLevel += 1;
      nextTarget *= 2;
    }

    return {
      level: nextLevel,
      levelTarget: nextTarget,
    };
  }, [score]);

  const bonusMultiplier = useMemo(() => {
    let nextMultiplier = 1;

    if (doublePointUnlocked) {
      nextMultiplier *= 2;
    }

    if (fivePointUnlocked) {
      nextMultiplier *= 5;
    }

    return nextMultiplier;
  }, [doublePointUnlocked, fivePointUnlocked]);

  const tapPoint = useMemo(
    () => (1 + manualClickBoost + (level - 1)) * bonusMultiplier,
    [bonusMultiplier, level, manualClickBoost],
  );

  const effectiveIdlePoint = useMemo(
    () => idlePoint * bonusMultiplier,
    [bonusMultiplier, idlePoint],
  );

  const levelProgress = useMemo(
    () => Math.min((score / levelTarget) * 100, 100),
    [levelTarget, score],
  );

  useEffect(() => {
    const idleTimer = window.setInterval(() => {
      setScore((previousScore) => previousScore + effectiveIdlePoint);

      const id = Date.now() + Math.random();
      setFloatingPoints((previousPoints) => [
        ...previousPoints,
        {
          id,
          offset: 18 + Math.random() * 64,
          value: `+${effectiveIdlePoint}`,
        },
      ]);

      window.setTimeout(() => {
        setFloatingPoints((previousPoints) =>
          previousPoints.filter((point) => point.id !== id),
        );
      }, 1100);
    }, 1000);

    return () => window.clearInterval(idleTimer);
  }, [effectiveIdlePoint]);

  useEffect(() => {
    if (level <= previousLevelRef.current) {
      return;
    }

    toast.success(`Level ${level} tercapai!`, {
      position: "top-right",
      progressClassName: "toast-progress-success",
      style: {
        background: "#111111",
        color: "#ffffff",
      },
    });
    previousLevelRef.current = level;
  }, [level]);

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

  const addFloatingPoint = (value: number) => {
    const id = Date.now() + Math.random();

    setFloatingPoints((previousPoints) => [
      ...previousPoints,
      {
        id,
        offset: Math.random() * 72 - 36,
        value: `+${value}`,
      },
    ]);

    window.setTimeout(() => {
      setFloatingPoints((previousPoints) =>
        previousPoints.filter((point) => point.id !== id),
      );
    }, 1200);
  };

  const handleTap = () => {
    setScore((previousScore) => previousScore + tapPoint);
    addFloatingPoint(tapPoint);
  };

  const handleClickUpgrade = () => {
    if (score < clickUpgradeCost) {
      showErrorToast("Skor tidak cukup untuk upgrade klik.");
      return;
    }

    setScore((previousScore) => previousScore - clickUpgradeCost);
    setManualClickBoost((previousBoost) => previousBoost + 1);
    setClickUpgradeCost((previousCost) => Math.floor(previousCost * 1.5));
    showSuccessToast("Upgrade klik berhasil!");
  };

  const handleAutoClickUpgrade = () => {
    if (score < autoClickCost) {
      showErrorToast("Skor tidak cukup untuk auto klik.");
      return;
    }

    setScore((previousScore) => previousScore - autoClickCost);
    setIdlePoint((previousIdlePoint) => previousIdlePoint + 1);
    setAutoClickCost((previousCost) => Math.floor(previousCost * 2.5));
    showSuccessToast("Auto klik berhasil ditingkatkan!");
  };

  const handleDoublePointUpgrade = () => {
    if (level < 2 || doublePointUnlocked) {
      return;
    }

    if (score < 50) {
      showErrorToast("Skor tidak cukup untuk double poin.");
      return;
    }

    setScore((previousScore) => previousScore - 50);
    setDoublePointUnlocked(true);
    showSuccessToast("Double poin berhasil dibuka!");
  };

  const handleFivePointUpgrade = () => {
    if (level < 5 || fivePointUnlocked) {
      return;
    }

    if (score < 100) {
      showErrorToast("Skor tidak cukup untuk x5 poin.");
      return;
    }

    setScore((previousScore) => previousScore - 100);
    setFivePointUnlocked(true);
    showSuccessToast("x5 poin berhasil dibuka!");
  };

  return (
    <section className="animate-panel-enter relative mx-auto w-full max-w-[min(100%,70rem)] overflow-hidden rounded-[2rem] bg-gradient-to-b from-[#d53d00] via-[#e45a00] to-[#ff9900] p-4 shadow-[0_20px_45px_rgba(15,23,42,0.28)] md:p-5">
      <div className="animate-ambient-drift absolute top-[-4rem] left-[-4rem] h-44 w-44 rounded-full bg-[#fff1aa24] blur-3xl" />
      <div className="animate-ambient-drift absolute right-[-3rem] bottom-[-4rem] h-56 w-56 rounded-full bg-[#ffcf4022] blur-3xl [animation-delay:-2.3s]" />

      <div className="relative rounded-[1.8rem] border-[3px] border-[#121826] bg-[#d24a00] px-4 py-6 text-center shadow-inner md:px-6 md:py-8">
        <h2 className="animate-title-glow text-3xl font-extrabold tracking-tight text-[#ffe81f] drop-shadow-[0_2px_0_rgba(0,0,0,0.35)] sm:text-5xl">
          Game EEK {"\u{1F4A9}"}
        </h2>
        <p className="mt-4 text-lg font-semibold italic text-[#fff4e4] md:text-2xl">
          Sentuh untuk Eek {"\u{1F4A9}"} sebanyak mungkin!
        </p>

        <div className="mx-auto mt-6 h-[3px] w-full max-w-[560px] bg-[#ffd21f]" />

        <div className="animate-soft-float mx-auto mt-8 max-w-[560px] rounded-3xl border-[3px] border-[#ffd21f] bg-[#d26a00] px-4 py-6 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] md:px-6 md:py-8">
          <p className="text-2xl font-extrabold text-[#fff2dc] sm:text-[2.2rem]">
            Skor: <span className="text-[#ffe81f]">{formatNumber(score)}</span>
            <span className="ml-3 md:ml-4">Level: {level}</span>
          </p>
          <div className="mt-6 h-4 overflow-hidden rounded-full bg-[#23313e]">
            <div
              className="animate-progress-pulse h-full rounded-full bg-[#ffd21f] transition-all duration-500"
              style={{ width: `${levelProgress}%` }}
            />
          </div>
        </div>

        <div className="mx-auto mt-3 flex max-w-[560px] items-center justify-center gap-4 text-sm font-semibold text-[#fff4e4] md:text-lg">
          <span>Tap: +{tapPoint}</span>
          <span>Idle: +{effectiveIdlePoint}/detik</span>
        </div>

        <div className="relative mx-auto mt-6 max-w-[560px]">
          <button
            type="button"
            onClick={handleTap}
            className="animate-breathe group relative flex h-36 w-full items-center justify-center overflow-hidden rounded-[999px] border-[4px] border-[#ffd21f] bg-[#f28b00] text-7xl transition duration-300 hover:scale-[1.02]"
            aria-label="Sentuh eek"
          >
            <span className="animate-sheen absolute inset-y-0 left-[-25%] w-1/3 bg-white/20 blur-md" />
            <span className="animate-icon-hover relative z-10">{"\u{1F4A9}"}</span>
          </button>

          {floatingPoints.map((point) => (
            <span
              key={point.id}
              className="animate-float-point pointer-events-none absolute bottom-2 left-1/2 text-3xl font-bold text-[#ffd21f] drop-shadow-[0_2px_4px_rgba(0,0,0,0.45)]"
              style={{
                transform: `translateX(calc(-50% + ${point.offset}px))`,
              }}
            >
              {point.value}
            </span>
          ))}
        </div>

        <div className="mx-auto mt-8 grid max-w-[560px] gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={handleClickUpgrade}
            className="group relative overflow-hidden rounded-2xl border-[3px] border-[#ffd21f] bg-[#d57b00] px-4 py-4 text-left font-bold text-white shadow-[0_14px_24px_rgba(130,74,0,0.18)] transition duration-300 hover:-translate-y-1 hover:bg-[#c76f00]"
          >
            <span className="animate-sheen absolute inset-y-0 left-[-30%] w-1/3 bg-white/15 blur-md" />
            <span className="relative z-10">
              <FaPlusCircle className="mr-3 inline-block align-[-0.15em]" />
              Upgrade Klik ({"\u{1F4A9}"} {formatNumber(clickUpgradeCost)})
            </span>
          </button>
          <button
            type="button"
            onClick={handleAutoClickUpgrade}
            className="group relative overflow-hidden rounded-2xl border-[3px] border-[#ffd21f] bg-[#d57b00] px-4 py-4 text-left font-bold text-white shadow-[0_14px_24px_rgba(130,74,0,0.18)] transition duration-300 hover:-translate-y-1 hover:bg-[#c76f00]"
          >
            <span className="animate-sheen absolute inset-y-0 left-[-30%] w-1/3 bg-white/15 blur-md [animation-delay:-1s]" />
            <span className="relative z-10">
              <FaRocket className="mr-3 inline-block align-[-0.15em]" />
              Auto Klik ({"\u{1F4A9}"} {formatNumber(autoClickCost)})
            </span>
          </button>
          <button
            type="button"
            onClick={handleDoublePointUpgrade}
            disabled={level < 2 || doublePointUnlocked}
            className={`group relative overflow-hidden rounded-2xl border-[3px] px-4 py-4 text-left font-bold transition duration-300 ${
              level >= 2 && !doublePointUnlocked
                ? "border-[#ffd21f] bg-[#d57b00] text-white shadow-[0_14px_24px_rgba(130,74,0,0.18)] hover:-translate-y-1 hover:bg-[#c76f00]"
                : "cursor-not-allowed border-[#d5a15a] bg-[#c18b40] text-[#f8d6a6]"
            }`}
          >
            {level >= 2 && !doublePointUnlocked ? (
              <span className="animate-sheen absolute inset-y-0 left-[-30%] w-1/3 bg-white/15 blur-md [animation-delay:-2s]" />
            ) : null}
            <span className="relative z-10">
              <FaStar className="mr-3 inline-block align-[-0.15em]" />
              Double Poin ({"\u{1F4A9}"} 50)
            </span>
          </button>
          <button
            type="button"
            onClick={handleFivePointUpgrade}
            disabled={level < 5 || fivePointUnlocked}
            className={`group relative overflow-hidden rounded-2xl border-[3px] px-4 py-4 text-left font-bold transition duration-300 ${
              level >= 5 && !fivePointUnlocked
                ? "border-[#ffd21f] bg-[#d57b00] text-white shadow-[0_14px_24px_rgba(130,74,0,0.18)] hover:-translate-y-1 hover:bg-[#c76f00]"
                : "cursor-not-allowed border-[#d5a15a] bg-[#c18b40] text-[#f8d6a6]"
            }`}
          >
            {level >= 5 && !fivePointUnlocked ? (
              <span className="animate-sheen absolute inset-y-0 left-[-30%] w-1/3 bg-white/15 blur-md [animation-delay:-0.6s]" />
            ) : null}
            <span className="relative z-10">
              <FaLevelUpAlt className="mr-3 inline-block align-[-0.15em]" />
              x5 Poin ({"\u{1F4A9}"} 100)
            </span>
          </button>
        </div>

        <button
          type="button"
          onClick={onBack}
          className="mx-auto mt-6 block rounded-2xl bg-[#384256] px-6 py-4 font-semibold text-white shadow-[0_12px_24px_rgba(15,23,42,0.18)] transition duration-300 hover:-translate-y-1 hover:bg-[#2d3647]"
        >
          <FaArrowLeft className="mr-2 inline-block align-[-0.15em]" />
          Back to Game Selection
        </button>
      </div>
    </section>
  );
}
