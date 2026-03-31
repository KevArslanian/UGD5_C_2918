"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  FaArrowLeft,
  FaBolt,
  FaHeart,
  FaRocket,
  FaShieldAlt,
  FaStar,
} from "react-icons/fa";
import { toast } from "react-toastify";

type EnemyKind = "boss" | "drone" | "tank" | "zigzag";
type EffectKind =
  | "boss-burst"
  | "burst"
  | "hit"
  | "muzzle"
  | "pickup"
  | "warning";
type PickupKind = "charge" | "heal" | "score";
type ProjectileSource = "enemy" | "player";
type SkillKey = "booster" | "damage" | "rapid" | "repair" | "shield" | "spread";
type GamePhase = "gameover" | "idle" | "running";

type Enemy = {
  damage: number;
  drift: number;
  health: number;
  id: number;
  kind: EnemyKind;
  maxHealth: number;
  phase: number;
  speed: number;
  x: number;
  y: number;
};

type Projectile = {
  damage: number;
  id: number;
  size: "enemy" | "player";
  source: ProjectileSource;
  vx: number;
  vy: number;
  x: number;
  y: number;
};

type Pickup = {
  id: number;
  kind: PickupKind;
  value: number;
  x: number;
  y: number;
};

type CombatEffect = {
  id: number;
  kind: EffectKind;
  x: number;
  y: number;
};

type PlayerPosition = {
  x: number;
  y: number;
};

type SkillLevels = Record<SkillKey, number>;

type StageProgress = {
  defeated: number;
  isBoss: boolean;
  spawned: number;
  total: number;
};

type RunSummary = {
  kills: number;
  score: number;
  stage: number;
};

type PoopSurvivorsGameProps = {
  onBack: () => void;
};

const XP_PER_LEVEL = 70;
const MAX_SKILL_LEVEL = 5;
const BEST_SCORE_KEY = "ugd5-neon-best-score";
const BEST_STAGE_KEY = "ugd5-neon-best-stage";
const DEFAULT_PLAYER_POSITION = { x: 50, y: 84 };
const DEFAULT_SKILL_LEVELS: SkillLevels = {
  booster: 0,
  damage: 0,
  rapid: 0,
  repair: 0,
  shield: 0,
  spread: 0,
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("id-ID").format(Math.floor(value));
}

function getStoredNumber(key: string, fallback: number) {
  if (typeof window === "undefined") {
    return fallback;
  }

  const value = window.localStorage.getItem(key);
  return value ? Number(value) : fallback;
}

function distanceBetween(
  first: { x: number; y: number },
  second: { x: number; y: number },
) {
  return Math.hypot(first.x - second.x, first.y - second.y);
}

function getStageProgress(stage: number): StageProgress {
  if (stage % 5 === 0) {
    return {
      defeated: 0,
      isBoss: true,
      spawned: 0,
      total: 1,
    };
  }

  return {
    defeated: 0,
    isBoss: false,
    spawned: 0,
    total: Math.min(12, 4 + stage),
  };
}

function createEnemy(stage: number, id: number, kind: EnemyKind): Enemy {
  if (kind === "boss") {
    const bossHealth = 280 + stage * 46;

    return {
      damage: 24,
      drift: 1.6 + stage * 0.03,
      health: bossHealth,
      id,
      kind,
      maxHealth: bossHealth,
      phase: Math.random() * Math.PI * 2,
      speed: 0.55,
      x: 50,
      y: -12,
    };
  }

  if (kind === "tank") {
    const tankHealth = 36 + stage * 10;

    return {
      damage: 16,
      drift: 0.8 + Math.random() * 0.5,
      health: tankHealth,
      id,
      kind,
      maxHealth: tankHealth,
      phase: Math.random() * Math.PI * 2,
      speed: 0.36 + stage * 0.014,
      x: 20 + Math.random() * 60,
      y: -10,
    };
  }

  if (kind === "zigzag") {
    const zigzagHealth = 20 + stage * 6;

    return {
      damage: 10,
      drift: 1.15 + Math.random() * 0.45,
      health: zigzagHealth,
      id,
      kind,
      maxHealth: zigzagHealth,
      phase: Math.random() * Math.PI * 2,
      speed: 0.56 + stage * 0.015,
      x: 20 + Math.random() * 60,
      y: -8,
    };
  }

  const droneHealth = 16 + stage * 5;

  return {
    damage: 10,
    drift: 1.1 + Math.random() * 0.6,
    health: droneHealth,
    id,
    kind,
    maxHealth: droneHealth,
    phase: Math.random() * Math.PI * 2,
    speed: 0.82 + stage * 0.022,
    x: 18 + Math.random() * 64,
    y: -7,
  };
}

function getEnemyKind(stage: number, spawned: number): EnemyKind {
  if (stage < 3) {
    return spawned % 3 === 0 ? "zigzag" : "drone";
  }

  if (stage < 6) {
    const roll = Math.random();
    return roll > 0.7 ? "tank" : roll > 0.35 ? "zigzag" : "drone";
  }

  const roll = Math.random();
  return roll > 0.72 ? "tank" : roll > 0.34 ? "zigzag" : "drone";
}

function getLaneOffsets(count: number) {
  if (count >= 5) {
    return [-8, -4, 0, 4, 8];
  }

  if (count === 4) {
    return [-6, -2, 2, 6];
  }

  if (count === 3) {
    return [-4.5, 0, 4.5];
  }

  if (count === 2) {
    return [-2.6, 2.6];
  }

  return [0];
}

export default function PoopSurvivorsGame({
  onBack,
}: PoopSurvivorsGameProps) {
  const [phase, setPhase] = useState<GamePhase>("idle");
  const [clock, setClock] = useState(0);
  const [health, setHealth] = useState(110);
  const [totalXp, setTotalXp] = useState(0);
  const [runScore, setRunScore] = useState(0);
  const [killCount, setKillCount] = useState(0);
  const [bestScore, setBestScore] = useState(() => getStoredNumber(BEST_SCORE_KEY, 0));
  const [bestStage, setBestStage] = useState(() => getStoredNumber(BEST_STAGE_KEY, 1));
  const [bossRewardPoints, setBossRewardPoints] = useState(0);
  const [stage, setStage] = useState(1);
  const [stageProgress, setStageProgress] = useState<StageProgress>(
    getStageProgress(1),
  );
  const [stageWarning, setStageWarning] = useState(false);
  const [summary, setSummary] = useState<RunSummary | null>(null);
  const [skillLevels, setSkillLevels] = useState<SkillLevels>(DEFAULT_SKILL_LEVELS);
  const [playerPosition, setPlayerPosition] = useState<PlayerPosition>(
    DEFAULT_PLAYER_POSITION,
  );
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [effects, setEffects] = useState<CombatEffect[]>([]);
  const [overdriveActiveUntil, setOverdriveActiveUntil] = useState(0);
  const [overdriveCooldownUntil, setOverdriveCooldownUntil] = useState(0);

  const previousLevelRef = useRef(1);
  const enemyIdRef = useRef(0);
  const projectileIdRef = useRef(0);
  const pickupIdRef = useRef(0);
  const effectIdRef = useRef(0);
  const playerPositionRef = useRef<PlayerPosition>(DEFAULT_PLAYER_POSITION);
  const enemiesRef = useRef<Enemy[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);
  const pickupsRef = useRef<Pickup[]>([]);
  const runScoreRef = useRef(0);
  const killCountRef = useRef(0);
  const stageRef = useRef(1);
  const stageProgressRef = useRef<StageProgress>(getStageProgress(1));
  const stageStartAtRef = useRef(0);
  const pressedKeysRef = useRef<Set<string>>(new Set());
  const phaseRef = useRef<GamePhase>("idle");

  const level = useMemo(() => Math.floor(totalXp / XP_PER_LEVEL) + 1, [totalXp]);
  const xpProgress = useMemo(() => totalXp % XP_PER_LEVEL, [totalXp]);
  const spentSkillPoints = useMemo(
    () => Object.values(skillLevels).reduce((total, value) => total + value, 0),
    [skillLevels],
  );
  const skillPoints = useMemo(
    () => Math.max(level - 1 + bossRewardPoints - spentSkillPoints, 0),
    [bossRewardPoints, level, spentSkillPoints],
  );
  const overdriveActive = useMemo(
    () => clock < overdriveActiveUntil,
    [clock, overdriveActiveUntil],
  );
  const overdriveReady = useMemo(
    () => clock >= overdriveCooldownUntil && !overdriveActive,
    [clock, overdriveActive, overdriveCooldownUntil],
  );
  const maxHealth = useMemo(
    () => 110 + skillLevels.shield * 22,
    [skillLevels.shield],
  );
  const movementSpeed = useMemo(
    () => 1.45 + skillLevels.booster * 0.28 + (overdriveActive ? 0.3 : 0),
    [overdriveActive, skillLevels.booster],
  );
  const projectileDamage = useMemo(
    () => 12 + skillLevels.damage * 5 + Math.floor(level / 2) * 2 + (overdriveActive ? 8 : 0),
    [level, overdriveActive, skillLevels.damage],
  );
  const fireRate = useMemo(
    () => Math.max(90, 280 - skillLevels.rapid * 24 - (overdriveActive ? 90 : 0)),
    [overdriveActive, skillLevels.rapid],
  );
  const laneCount = useMemo(() => {
    const baseLaneCount = 1 + skillLevels.spread + (level >= 4 ? 1 : 0);
    return Math.min(5, baseLaneCount + (overdriveActive ? 1 : 0));
  }, [level, overdriveActive, skillLevels.spread]);
  const laneOffsets = useMemo(() => getLaneOffsets(laneCount), [laneCount]);
  const regenAmount = useMemo(
    () => skillLevels.repair,
    [skillLevels.repair],
  );
  const bossEnemy = useMemo(
    () => enemies.find((enemy) => enemy.kind === "boss") ?? null,
    [enemies],
  );
  const cooldownRemaining = useMemo(
    () => Math.max(overdriveCooldownUntil - clock, 0),
    [clock, overdriveCooldownUntil],
  );
  const bossStageLabel = useMemo(() => Math.ceil(stage / 5) * 5, [stage]);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    playerPositionRef.current = playerPosition;
  }, [playerPosition]);

  useEffect(() => {
    enemiesRef.current = enemies;
  }, [enemies]);

  useEffect(() => {
    projectilesRef.current = projectiles;
  }, [projectiles]);

  useEffect(() => {
    pickupsRef.current = pickups;
  }, [pickups]);

  useEffect(() => {
    runScoreRef.current = runScore;
  }, [runScore]);

  useEffect(() => {
    killCountRef.current = killCount;
  }, [killCount]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(BEST_SCORE_KEY, String(bestScore));
  }, [bestScore]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(BEST_STAGE_KEY, String(bestStage));
  }, [bestStage]);

  useEffect(() => {
    if (level <= previousLevelRef.current) {
      return;
    }

    toast.success(`Neon Squadron Lv.${level}! +1 SP`, {
      position: "top-right",
      progressClassName: "toast-progress-success",
      style: {
        background: "#111111",
        color: "#ffffff",
      },
    });
    previousLevelRef.current = level;
  }, [level]);

  useEffect(() => {
    if (phase !== "running") {
      return;
    }

    const clockTimer = window.setInterval(() => {
      setClock(Date.now());
    }, 120);

    return () => window.clearInterval(clockTimer);
  }, [phase]);

  useEffect(() => {
    if (phase !== "running" || regenAmount === 0) {
      return;
    }

    const regenTimer = window.setInterval(() => {
      setHealth((previousHealth) => Math.min(maxHealth, previousHealth + regenAmount));
    }, 1400);

    return () => window.clearInterval(regenTimer);
  }, [maxHealth, phase, regenAmount]);

  useEffect(() => {
    if (phase !== "running") {
      return;
    }

    const pressedKeys = pressedKeysRef.current;

    const handleKeyDown = (event: KeyboardEvent) => {
      pressedKeys.add(event.key.toLowerCase());
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      pressedKeys.delete(event.key.toLowerCase());
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      pressedKeys.clear();
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== "running") {
      return;
    }

    const movementTimer = window.setInterval(() => {
      setPlayerPosition((previousPosition) => {
        const pressedKeys = pressedKeysRef.current;
        let nextX = previousPosition.x;
        let nextY = previousPosition.y;

        if (pressedKeys.has("w") || pressedKeys.has("arrowup")) {
          nextY -= movementSpeed;
        }
        if (pressedKeys.has("s") || pressedKeys.has("arrowdown")) {
          nextY += movementSpeed;
        }
        if (pressedKeys.has("a") || pressedKeys.has("arrowleft")) {
          nextX -= movementSpeed;
        }
        if (pressedKeys.has("d") || pressedKeys.has("arrowright")) {
          nextX += movementSpeed;
        }

        return {
          x: clamp(nextX, 18, 82),
          y: clamp(nextY, 14, 90),
        };
      });
    }, 24);

    return () => window.clearInterval(movementTimer);
  }, [movementSpeed, phase]);

  const showInfoToast = useCallback((message: string) => {
    toast.info(message, {
      position: "top-right",
      progressClassName: "toast-progress-success",
      style: {
        background: "#111111",
        color: "#ffffff",
      },
    });
  }, []);

  const showErrorToast = useCallback((message: string) => {
    toast.error(message, {
      position: "top-right",
      progressClassName: "toast-progress-error",
      style: {
        background: "#111111",
        color: "#ffffff",
      },
    });
  }, []);

  const emitEffect = useCallback((x: number, y: number, kind: EffectKind) => {
    effectIdRef.current += 1;
    const id = effectIdRef.current;

    setEffects((previousEffects) => [...previousEffects, { id, kind, x, y }]);
    window.setTimeout(() => {
      setEffects((previousEffects) =>
        previousEffects.filter((effect) => effect.id !== id),
      );
    }, kind === "boss-burst" ? 760 : kind === "warning" ? 900 : 360);
  }, []);

  const applyBestRecord = useCallback((score: number, reachedStage: number) => {
    setBestScore((previousBestScore) => Math.max(previousBestScore, score));
    setBestStage((previousBestStage) => Math.max(previousBestStage, reachedStage));
  }, []);

  const finishRun = useCallback((finalHealth: number) => {
    if (phaseRef.current !== "running" || finalHealth > 0) {
      return;
    }

    phaseRef.current = "gameover";
    setPhase("gameover");
    setStageWarning(false);
    setSummary({
      kills: killCountRef.current,
      score: runScoreRef.current,
      stage: stageRef.current,
    });
    setEnemies([]);
    setProjectiles([]);
    setPickups([]);
    setEffects([]);
    enemiesRef.current = [];
    projectilesRef.current = [];
    pickupsRef.current = [];
    pressedKeysRef.current.clear();
    applyBestRecord(runScoreRef.current, stageRef.current);
    toast.error("Squadron tumbang! Run berakhir.", {
      position: "top-right",
      progressClassName: "toast-progress-error",
      style: {
        background: "#111111",
        color: "#ffffff",
      },
    });
  }, [applyBestRecord]);

  const prepareStage = useCallback((nextStage: number) => {
    const nextProgress = getStageProgress(nextStage);
    stageRef.current = nextStage;
    stageProgressRef.current = nextProgress;
    stageStartAtRef.current = Date.now();
    setStage(nextStage);
    setStageProgress(nextProgress);
    setStageWarning(nextProgress.isBoss);

    if (nextStage % 5 === 0) {
      toast.warn(`Boss Stage ${nextStage} incoming!`, {
        position: "top-right",
        progressClassName: "toast-progress-error",
        style: {
          background: "#111111",
          color: "#ffffff",
        },
      });
      emitEffect(50, 22, "warning");
    } else if (nextStage > 1) {
      showInfoToast(`Stage ${nextStage} dimulai.`);
    }
  }, [emitEffect, showInfoToast]);

  const reduceOverdriveCooldown = useCallback((amount: number) => {
    setOverdriveCooldownUntil((previousCooldownUntil) =>
      Math.max(Date.now() + 1200, previousCooldownUntil - amount),
    );
  }, []);

  const activateOverdrive = () => {
    if (!overdriveReady || phase !== "running") {
      showErrorToast("Overdrive belum siap.");
      return;
    }

    const now = Date.now();
    setOverdriveActiveUntil(now + 4500);
    setOverdriveCooldownUntil(now + 18000);
    showInfoToast("Overdrive online! Fire rate meningkat drastis.");
  };

  const purchaseSkill = (skillKey: SkillKey) => {
    if (phase !== "running") {
      showInfoToast("Mulai run dulu sebelum upgrade squadron.");
      return;
    }

    if (skillPoints <= 0) {
      showErrorToast("Skill point belum cukup.");
      return;
    }

    if (skillLevels[skillKey] >= MAX_SKILL_LEVEL) {
      showInfoToast("Skill ini sudah mentok.");
      return;
    }

    setSkillLevels((previousSkills) => ({
      ...previousSkills,
      [skillKey]: previousSkills[skillKey] + 1,
    }));

    if (skillKey === "shield") {
      setHealth((previousHealth) => Math.min(previousHealth + 20, maxHealth + 22));
    }

    showInfoToast("Skill squadron meningkat.");
  };

  const startRun = () => {
    previousLevelRef.current = 1;
    enemyIdRef.current = 0;
    projectileIdRef.current = 0;
    pickupIdRef.current = 0;
    effectIdRef.current = 0;
    pressedKeysRef.current.clear();
    stageRef.current = 1;
    stageProgressRef.current = getStageProgress(1);
    stageStartAtRef.current = Date.now();
    setClock(Date.now());
    setHealth(110);
    setTotalXp(0);
    setRunScore(0);
    setKillCount(0);
    setBossRewardPoints(0);
    setStage(1);
    setStageProgress(getStageProgress(1));
    setStageWarning(false);
    setSummary(null);
    setSkillLevels(DEFAULT_SKILL_LEVELS);
    setPlayerPosition(DEFAULT_PLAYER_POSITION);
    setEnemies([]);
    setProjectiles([]);
    setPickups([]);
    setEffects([]);
    enemiesRef.current = [];
    projectilesRef.current = [];
    pickupsRef.current = [];
    setOverdriveActiveUntil(0);
    setOverdriveCooldownUntil(0);
    setPhase("running");
    phaseRef.current = "running";
    prepareStage(1);
    showInfoToast("Neon squadron diluncurkan.");
  };

  useEffect(() => {
    if (phase !== "running") {
      return;
    }

    const spawnTimer = window.setInterval(() => {
      const currentProgress = stageProgressRef.current;
      const activeEnemyCount = enemiesRef.current.length;

      if (currentProgress.isBoss) {
        const activeBoss = enemiesRef.current.some((enemy) => enemy.kind === "boss");

        if (currentProgress.defeated >= currentProgress.total || activeBoss) {
          return;
        }

        if (Date.now() - stageStartAtRef.current < 1500) {
          setStageWarning(true);
          return;
        }

        enemyIdRef.current += 1;
        const boss = createEnemy(stageRef.current, enemyIdRef.current, "boss");

        stageProgressRef.current = {
          ...currentProgress,
          spawned: currentProgress.spawned + 1,
        };
        setStageProgress(stageProgressRef.current);
        setStageWarning(false);
        setEnemies((previousEnemies) => [...previousEnemies, boss]);
        return;
      }

      if (currentProgress.defeated >= currentProgress.total) {
        return;
      }

      if (currentProgress.defeated + activeEnemyCount >= currentProgress.total) {
        return;
      }

      if (activeEnemyCount >= Math.min(3 + Math.floor(stageRef.current / 2), 6)) {
        return;
      }

      enemyIdRef.current += 1;
      const enemy = createEnemy(
        stageRef.current,
        enemyIdRef.current,
        getEnemyKind(stageRef.current, currentProgress.spawned),
      );

      stageProgressRef.current = {
        ...currentProgress,
        spawned: currentProgress.spawned + 1,
      };
      setStageProgress(stageProgressRef.current);
      setEnemies((previousEnemies) => [...previousEnemies, enemy]);
    }, 640);

    return () => window.clearInterval(spawnTimer);
  }, [phase]);

  useEffect(() => {
    if (phase !== "running") {
      return;
    }

    const fireTimer = window.setInterval(() => {
      const player = playerPositionRef.current;
      const nextShots = laneOffsets.map((offset) => {
        projectileIdRef.current += 1;

        return {
          damage: projectileDamage,
          id: projectileIdRef.current,
          size: "player" as const,
          source: "player" as const,
          vx: offset * 0.02,
          vy: -3.7,
          x: clamp(player.x + offset, 7, 93),
          y: player.y - 7,
        };
      });

      setProjectiles((previousProjectiles) => [...previousProjectiles, ...nextShots]);
      emitEffect(player.x, player.y - 8, "muzzle");
    }, fireRate);

    return () => window.clearInterval(fireTimer);
  }, [emitEffect, fireRate, laneOffsets, phase, projectileDamage]);

  useEffect(() => {
    if (phase !== "running") {
      return;
    }

    const battleLoop = window.setInterval(() => {
      const player = playerPositionRef.current;
      const now = Date.now();
      const spawnedEnemyShots: Projectile[] = [];
      const movedProjectiles = projectilesRef.current
        .map((projectile) => ({
          ...projectile,
          x: projectile.x + projectile.vx,
          y: projectile.y + projectile.vy,
        }))
        .filter(
          (projectile) =>
            projectile.y > -12 &&
            projectile.y < 110 &&
            projectile.x > -6 &&
            projectile.x < 106,
        );

      const movedEnemies = enemiesRef.current
        .map((enemy) => {
          if (enemy.kind === "boss") {
            const nextY =
              enemy.y < 18 ? enemy.y + enemy.speed : 18 + Math.sin(now / 520) * 2;
            const nextX = clamp(
              50 + Math.sin(now / 640 + enemy.phase) * 28,
              22,
              78,
            );

            if (Math.random() < 0.026) {
              [-2.8, 0, 2.8].forEach((vx) => {
                projectileIdRef.current += 1;
                spawnedEnemyShots.push({
                  damage: 12 + stageRef.current,
                  id: projectileIdRef.current,
                  size: "enemy",
                  source: "enemy",
                  vx,
                  vy: 2.4,
                  x: nextX,
                  y: nextY + 7,
                });
              });
            }

            return { ...enemy, x: nextX, y: nextY };
          }

          const nextY = enemy.y + enemy.speed;
          let nextX = enemy.x;

          if (enemy.kind === "zigzag") {
            nextX = clamp(
              enemy.x + Math.sin(now / 180 + enemy.phase) * enemy.drift,
              18,
              82,
            );

            if (Math.random() < 0.006) {
              projectileIdRef.current += 1;
                spawnedEnemyShots.push({
                  damage: 9 + stageRef.current,
                  id: projectileIdRef.current,
                  size: "enemy",
                  source: "enemy",
                  vx: Math.sin(now / 180 + enemy.phase) * 0.9,
                  vy: 1.7,
                  x: nextX,
                  y: nextY + 3,
                });
            }
          } else if (enemy.kind === "tank") {
            nextX = clamp(
              enemy.x + Math.cos(now / 360 + enemy.phase) * enemy.drift,
              20,
              80,
            );

            if (Math.random() < 0.009) {
              [-1.2, 1.2].forEach((vx) => {
                projectileIdRef.current += 1;
                spawnedEnemyShots.push({
                  damage: 11 + stageRef.current,
                  id: projectileIdRef.current,
                  size: "enemy",
                  source: "enemy",
                  vx,
                  vy: 1.55,
                  x: nextX,
                  y: nextY + 4,
                });
              });
            }
          } else {
            nextX = clamp(
              enemy.x + Math.sin(now / 260 + enemy.phase) * enemy.drift,
              16,
              84,
            );
          }

          return { ...enemy, x: nextX, y: nextY };
        })
        .filter((enemy) => enemy.y < 112);

      const movedPickups = pickupsRef.current
        .map((pickup) => ({
          ...pickup,
          y: pickup.y + 0.8,
        }))
        .filter((pickup) => pickup.y < 110);

      const survivingProjectiles: Projectile[] = [];
      let survivingEnemies = movedEnemies.map((enemy) => ({ ...enemy }));
      let gainedXp = 0;
      let gainedScore = 0;
      let gainedKills = 0;
      let bossPoints = 0;

      for (const projectile of movedProjectiles) {
        if (projectile.source === "player") {
          let didHit = false;

          survivingEnemies = survivingEnemies.flatMap((enemy) => {
            if (didHit) {
              return [enemy];
            }

            const hitRadius = enemy.kind === "boss" ? 10.4 : enemy.kind === "tank" ? 6.8 : 5.5;

            if (distanceBetween(projectile, enemy) < hitRadius) {
              didHit = true;
              const nextHealth = enemy.health - projectile.damage;
              emitEffect(enemy.x, enemy.y, nextHealth <= 0 ? "burst" : "hit");

              if (nextHealth <= 0) {
                const nextProgress = {
                  ...stageProgressRef.current,
                  defeated: stageProgressRef.current.defeated + 1,
                };
                stageProgressRef.current = nextProgress;
                setStageProgress(nextProgress);
                gainedKills += 1;

                if (enemy.kind === "boss") {
                  gainedXp += 160;
                  gainedScore += 480;
                  bossPoints += 2;
                  emitEffect(enemy.x, enemy.y, "boss-burst");
                  toast.success(`Boss Stage ${stageRef.current} clear! +2 SP`, {
                    position: "top-right",
                    progressClassName: "toast-progress-success",
                    style: {
                      background: "#111111",
                      color: "#ffffff",
                    },
                  });
                  return [];
                }

                gainedXp += enemy.kind === "tank" ? 28 : enemy.kind === "zigzag" ? 22 : 18;
                gainedScore += enemy.kind === "tank" ? 110 : enemy.kind === "zigzag" ? 85 : 65;

                if (Math.random() < 0.2) {
                  pickupIdRef.current += 1;
                  const kinds: PickupKind[] = ["heal", "score", "charge"];
                  const pickupKind = kinds[Math.floor(Math.random() * kinds.length)];
                  movedPickups.push({
                    id: pickupIdRef.current,
                    kind: pickupKind,
                    value:
                      pickupKind === "heal"
                        ? 16
                        : pickupKind === "charge"
                          ? 2800
                          : 140,
                    x: enemy.x,
                    y: enemy.y,
                  });
                }

                return [];
              }

              return [{ ...enemy, health: nextHealth }];
            }

            return [enemy];
          });

          if (!didHit) {
            survivingProjectiles.push(projectile);
          }
        } else if (distanceBetween(projectile, player) < 6.5) {
          emitEffect(player.x, player.y - 3, "hit");
          setHealth((previousHealth) => {
            const nextHealth = Math.max(previousHealth - projectile.damage, 0);
            if (nextHealth === 0) {
              window.setTimeout(() => finishRun(0), 0);
            }
            return nextHealth;
          });
        } else {
          survivingProjectiles.push(projectile);
        }
      }

      survivingEnemies = survivingEnemies.filter((enemy) => {
        const collisionRadius = enemy.kind === "boss" ? 12 : enemy.kind === "tank" ? 8 : 6.6;
        const touchedPlayer = distanceBetween(enemy, player) < collisionRadius;
        const escaped = enemy.kind !== "boss" && enemy.y > 102;

        if (touchedPlayer || escaped) {
          setHealth((previousHealth) => {
            const nextHealth = Math.max(previousHealth - (touchedPlayer ? enemy.damage : 8), 0);
            if (nextHealth === 0) {
              window.setTimeout(() => finishRun(0), 0);
            }
            return nextHealth;
          });
          emitEffect(enemy.x, enemy.y, enemy.kind === "boss" ? "boss-burst" : "burst");
          return false;
        }

        return true;
      });

      const survivingPickups = movedPickups.filter((pickup) => {
        if (distanceBetween(pickup, player) < 7) {
          emitEffect(pickup.x, pickup.y, "pickup");

          if (pickup.kind === "heal") {
            setHealth((previousHealth) => Math.min(maxHealth, previousHealth + pickup.value));
          } else if (pickup.kind === "score") {
            gainedScore += pickup.value;
          } else {
            reduceOverdriveCooldown(pickup.value);
          }

          return false;
        }

        return true;
      });

      if (gainedXp > 0) {
        setTotalXp((previousXp) => previousXp + gainedXp);
      }
      if (gainedScore > 0) {
        setRunScore((previousScore) => previousScore + gainedScore);
      }
      if (gainedKills > 0) {
        setKillCount((previousKills) => previousKills + gainedKills);
      }
      if (bossPoints > 0) {
        setBossRewardPoints((previousPoints) => previousPoints + bossPoints);
      }

      const currentProgress = stageProgressRef.current;
      if (
        currentProgress.defeated >= currentProgress.total &&
        survivingEnemies.length === 0
      ) {
        const clearedStage = stageRef.current;
        setRunScore((previousScore) => previousScore + clearedStage * 90);
        applyBestRecord(runScoreRef.current + clearedStage * 90, clearedStage + 1);
        prepareStage(clearedStage + 1);
      }

      setEnemies(survivingEnemies);
      setProjectiles([...survivingProjectiles, ...spawnedEnemyShots]);
      setPickups(survivingPickups);
      enemiesRef.current = survivingEnemies;
      projectilesRef.current = [...survivingProjectiles, ...spawnedEnemyShots];
      pickupsRef.current = survivingPickups;
    }, 33);

    return () => window.clearInterval(battleLoop);
  }, [applyBestRecord, emitEffect, finishRun, maxHealth, phase, prepareStage, reduceOverdriveCooldown]);

  const skillCards: Array<{
    description: string;
    icon: ReactNode;
    keyName: SkillKey;
    title: string;
    value: string;
  }> = [
    {
      description: "Energy pulse makin sakit buat drone, tank, dan boss.",
      icon: <FaBolt />,
      keyName: "damage",
      title: "Pulse Damage",
      value: "+5 damage",
    },
    {
      description: "Naikkan cadence tembakan biar arena lebih padat laser.",
      icon: <FaStar />,
      keyName: "rapid",
      title: "Rapid Core",
      value: "-24ms fire rate",
    },
    {
      description: "Tambah lane tembakan untuk coverage kiri-kanan lebih lebar.",
      icon: <FaRocket />,
      keyName: "spread",
      title: "Split Barrel",
      value: "+1 lane",
    },
    {
      description: "Tambah hull shield dan recover HP saat dibeli.",
      icon: <FaShieldAlt />,
      keyName: "shield",
      title: "Prism Shield",
      value: "+22 HP",
    },
    {
      description: "Booster lebih cepat dan manuver makin lincah.",
      icon: <FaRocket />,
      keyName: "booster",
      title: "Turbo Thruster",
      value: "+speed",
    },
    {
      description: "Repair nanites memulihkan HP perlahan selama run.",
      icon: <FaHeart />,
      keyName: "repair",
      title: "Repair Nano",
      value: "+regen",
    },
  ];

  return (
    <section className="animate-panel-enter relative w-full max-w-none overflow-hidden rounded-[2rem] border border-cyan-300/12 bg-[linear-gradient(145deg,_rgba(3,7,24,0.98),_rgba(9,17,36,0.98)_42%,_rgba(4,24,34,0.95))] p-4 text-white shadow-[0_34px_88px_rgba(1,10,28,0.56)] md:p-6">
      <div className="animate-ambient-drift absolute left-[-4rem] top-[-4rem] h-52 w-52 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="animate-ambient-drift absolute bottom-[-5rem] right-[-4rem] h-60 w-60 rounded-full bg-pink-500/10 blur-3xl [animation-delay:-3.4s]" />
      <div className="neon-haze absolute inset-0 opacity-90" />

      <div className="relative z-10">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/8 pb-5">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.42em] text-cyan-100/75">
              Arcade Shooter Bonus
            </p>
            <h2 className="animate-title-glow text-3xl font-black tracking-tight text-white sm:text-5xl">
              Neon Void Squadron
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300 md:text-base">
              Tembus wave cyber fleet, kumpulkan pickup, aktifkan overdrive,
              dan hadapi boss ber-phase untuk mengejar best stage.
            </p>
          </div>

          <div className="rounded-[1.4rem] border border-cyan-300/16 bg-cyan-300/8 px-4 py-3 text-right shadow-[0_16px_32px_rgba(34,211,238,0.08)]">
            <p className="text-xs uppercase tracking-[0.26em] text-cyan-100/70">
              Best Run
            </p>
            <p className="mt-2 text-xl font-black text-white">
              {formatNumber(bestScore)} Score
            </p>
            <p className="mt-1 text-sm text-cyan-100/75">Highest Stage {bestStage}</p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          <div className="rounded-[1.3rem] border border-white/8 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Health</p>
            <p className="mt-2 text-2xl font-black text-white">
              {health}/{maxHealth}
            </p>
          </div>
          <div className="rounded-[1.3rem] border border-white/8 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Stage</p>
            <p className="mt-2 text-2xl font-black text-white">{stage}</p>
          </div>
          <div className="rounded-[1.3rem] border border-white/8 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Score</p>
            <p className="mt-2 text-2xl font-black text-white">{formatNumber(runScore)}</p>
          </div>
          <div className="rounded-[1.3rem] border border-white/8 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Kills</p>
            <p className="mt-2 text-2xl font-black text-white">{killCount}</p>
          </div>
          <div className="rounded-[1.3rem] border border-white/8 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Pilot Level</p>
            <p className="mt-2 text-2xl font-black text-white">Lv.{level}</p>
          </div>
          <div className="rounded-[1.3rem] border border-white/8 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-400">SP</p>
            <p className="mt-2 text-2xl font-black text-white">{skillPoints}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.22fr_0.78fr]">
          <div className="rounded-[1.9rem] border border-cyan-300/12 bg-[linear-gradient(180deg,_rgba(7,12,32,0.94),_rgba(3,8,20,0.96))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
            <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
                  Pulse Damage
                </p>
                <p className="mt-2 text-lg font-bold text-white">{projectileDamage}</p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
                  Fire Rate
                </p>
                <p className="mt-2 text-lg font-bold text-white">{fireRate}ms</p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
                  Thruster
                </p>
                <p className="mt-2 text-lg font-bold text-white">
                  {movementSpeed.toFixed(1)}
                </p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
                  Next Boss
                </p>
                <p className="mt-2 text-lg font-bold text-white">
                  Stage {bossStageLabel}
                </p>
              </div>
            </div>

            <div className="mb-4 rounded-2xl border border-white/8 bg-white/5 p-4">
              <div className="mb-2 flex items-center justify-between text-sm text-slate-200">
                <span>XP Progress</span>
                <span>
                  {xpProgress}/{XP_PER_LEVEL}
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-black/35">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,_#22d3ee,_#8b5cf6,_#f472b6)] transition-all duration-300"
                  style={{ width: `${(xpProgress / XP_PER_LEVEL) * 100}%` }}
                />
              </div>
            </div>

            <div className="relative mx-auto aspect-[5/4] w-full max-w-[46rem] overflow-hidden rounded-[1.7rem] border border-cyan-300/18 bg-[#060b1b]">
              <div className="neon-space absolute inset-0" />
              <div className="neon-grid absolute inset-0 opacity-55" />
              <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#020611] to-transparent" />

              {stageWarning ? (
                <div className="neon-warning absolute inset-4 z-20 flex items-center justify-center rounded-[1.3rem] border border-pink-400/45 bg-pink-500/12 text-center text-lg font-black uppercase tracking-[0.38em] text-pink-100 backdrop-blur-sm md:text-2xl">
                  Boss Warning
                </div>
              ) : null}

              {bossEnemy ? (
                <div className="absolute inset-x-4 top-3 z-20 rounded-xl border border-pink-400/20 bg-black/35 px-3 py-2 backdrop-blur-sm">
                  <div className="mb-1 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.24em] text-pink-100">
                    <span>Boss Core</span>
                    <span>Stage {stage}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-900/85">
                    <div
                      className="h-full rounded-full bg-[linear-gradient(90deg,_#fb7185,_#f472b6,_#facc15)] transition-all duration-300"
                      style={{ width: `${(bossEnemy.health / bossEnemy.maxHealth) * 100}%` }}
                    />
                  </div>
                </div>
              ) : null}

              <div className="absolute inset-x-4 top-4 z-10 flex items-center justify-between text-xs uppercase tracking-[0.24em] text-slate-300/80">
                <span>
                  Stage progress {stageProgress.defeated}/{stageProgress.total}
                </span>
                <span>{stageProgress.isBoss ? "Boss Encounter" : "Wave Assault"}</span>
              </div>

              <div
                className="absolute z-20"
                style={{
                  left: `${playerPosition.x}%`,
                  top: `${playerPosition.y}%`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                <div className="relative flex h-16 w-12 items-center justify-center">
                  <span className="neon-ship absolute inset-0" />
                  <span className="neon-cockpit absolute left-1/2 top-[28%] h-4 w-4 -translate-x-1/2 rounded-full bg-cyan-100/90 shadow-[0_0_16px_rgba(165,243,252,0.9)]" />
                  <div className="pointer-events-none absolute left-1/2 top-[78%] h-12 w-12 -translate-x-1/2">
                    {Array.from({ length: 3 + skillLevels.booster }).map((_, index) => (
                      <span
                        key={`thruster-${index}`}
                        className="neon-thruster absolute"
                        style={{
                          animationDelay: `${index * 0.08}s`,
                          left: `${50 + (index - (2 + skillLevels.booster) / 2) * 12}%`,
                          top: `${10 + index * 2}px`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {projectiles.map((projectile) => (
                <span
                  key={projectile.id}
                  className={`absolute left-0 top-0 block rounded-full ${
                    projectile.source === "player"
                      ? "neon-projectile-player"
                      : "neon-projectile-enemy"
                  }`}
                  style={{
                    left: `${projectile.x}%`,
                    top: `${projectile.y}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                />
              ))}

              {pickups.map((pickup) => (
                <div
                  key={pickup.id}
                  className="absolute left-0 top-0"
                  style={{
                    left: `${pickup.x}%`,
                    top: `${pickup.y}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  <span
                    className={`neon-pickup flex h-8 w-8 items-center justify-center rounded-full text-xs font-black ${
                      pickup.kind === "heal"
                        ? "bg-emerald-400/18 text-emerald-100"
                        : pickup.kind === "charge"
                          ? "bg-pink-400/18 text-pink-100"
                          : "bg-amber-400/18 text-amber-100"
                    }`}
                  >
                    {pickup.kind === "heal" ? "HP" : pickup.kind === "charge" ? "OD" : "SC"}
                  </span>
                </div>
              ))}

              {enemies.map((enemy) => (
                <div
                  key={enemy.id}
                  className="absolute left-0 top-0"
                  style={{
                    left: `${enemy.x}%`,
                    top: `${enemy.y}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  <div
                    className={`relative ${
                      enemy.kind === "boss"
                        ? "h-24 w-20"
                        : enemy.kind === "tank"
                          ? "h-14 w-12"
                          : "h-12 w-10"
                    }`}
                  >
                    <span
                      className={`absolute inset-0 ${
                        enemy.kind === "boss"
                          ? "enemy-boss"
                          : enemy.kind === "tank"
                            ? "enemy-tank"
                            : enemy.kind === "zigzag"
                              ? "enemy-zigzag"
                              : "enemy-drone"
                      }`}
                    />
                    <div className="absolute inset-x-0 -top-4 h-1.5 overflow-hidden rounded-full bg-slate-900/80">
                      <div
                        className={`h-full rounded-full ${
                          enemy.kind === "boss"
                            ? "bg-[linear-gradient(90deg,_#fb7185,_#f472b6,_#facc15)]"
                            : "bg-[linear-gradient(90deg,_#22d3ee,_#8b5cf6)]"
                        }`}
                        style={{ width: `${(enemy.health / enemy.maxHealth) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}

              {effects.map((effect) => (
                <span
                  key={effect.id}
                  className={`absolute left-0 top-0 block ${
                    effect.kind === "warning"
                      ? "combat-effect-warning"
                      : effect.kind === "boss-burst"
                        ? "combat-effect-boss"
                        : effect.kind === "pickup"
                          ? "combat-effect-pickup"
                          : effect.kind === "muzzle"
                            ? "combat-effect-muzzle"
                            : effect.kind === "burst"
                              ? "combat-effect-burst"
                              : "combat-effect-hit"
                  }`}
                  style={{
                    left: `${effect.x}%`,
                    top: `${effect.y}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                />
              ))}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-300">
              <span className="rounded-full border border-white/8 bg-white/5 px-3 py-2">
                Controls: `WASD` / arrows
              </span>
              <span className="rounded-full border border-white/8 bg-white/5 px-3 py-2">
                Overdrive: timed burst mode
              </span>
            </div>
          </div>

          <div className="rounded-[1.9rem] border border-cyan-300/10 bg-[linear-gradient(180deg,_rgba(8,13,28,0.96),_rgba(10,7,20,0.98))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <div className="rounded-[1.6rem] border border-white/8 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
                Overdrive System
              </p>
              <div className="mt-4 h-3 overflow-hidden rounded-full bg-black/35">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,_#22d3ee,_#8b5cf6,_#f472b6)] transition-all duration-300"
                  style={{
                    width: `${
                      overdriveActive
                        ? 100
                        : overdriveReady
                          ? 100
                          : Math.max(100 - (cooldownRemaining / 18000) * 100, 0)
                    }%`,
                  }}
                />
              </div>
              <div className="mt-3 flex items-center justify-between gap-3 text-sm text-slate-300">
                <span>
                  {overdriveActive
                    ? "Overdrive aktif"
                    : overdriveReady
                      ? "Overdrive siap"
                      : `Cooldown ${Math.ceil(cooldownRemaining / 1000)}s`}
                </span>
                <span>Lane {laneCount}</span>
              </div>

              <button
                type="button"
                onClick={activateOverdrive}
                disabled={!overdriveReady || phase !== "running"}
                className={`mt-4 w-full rounded-[1.2rem] border px-4 py-3 text-sm font-semibold transition ${
                  overdriveReady && phase === "running"
                    ? "border-pink-400/40 bg-pink-500/12 text-white hover:-translate-y-0.5 hover:bg-pink-500/18"
                    : "cursor-not-allowed border-white/8 bg-white/5 text-slate-400"
                }`}
              >
                {overdriveActive ? "Overdrive Running" : "Trigger Overdrive"}
              </button>
            </div>

            <div className="mt-5 grid gap-3">
              {skillCards.map((skill) => (
                <button
                  key={skill.keyName}
                  type="button"
                  onClick={() => purchaseSkill(skill.keyName)}
                  disabled={phase !== "running" || skillPoints <= 0 || skillLevels[skill.keyName] >= MAX_SKILL_LEVEL}
                  className={`group relative overflow-hidden rounded-[1.45rem] border p-4 text-left transition duration-300 ${
                    phase === "running" &&
                    skillPoints > 0 &&
                    skillLevels[skill.keyName] < MAX_SKILL_LEVEL
                      ? "border-cyan-300/18 bg-white/6 hover:-translate-y-1 hover:bg-white/8"
                      : "cursor-not-allowed border-white/8 bg-white/4 text-slate-500"
                  }`}
                >
                  {phase === "running" &&
                  skillPoints > 0 &&
                  skillLevels[skill.keyName] < MAX_SKILL_LEVEL ? (
                    <span className="animate-sheen absolute inset-y-0 left-[-20%] w-1/4 bg-white/8 blur-xl" />
                  ) : null}
                  <div className="relative z-10 flex items-start gap-4">
                    <span className="rounded-2xl bg-cyan-400/10 p-3 text-cyan-200">
                      {skill.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <h4 className="text-base font-bold text-white">
                          {skill.title}
                        </h4>
                        <span className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-100/80">
                          Lv.{skillLevels[skill.keyName]}/{MAX_SKILL_LEVEL}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-300">
                        {skill.description}
                      </p>
                      <p className="mt-3 text-xs uppercase tracking-[0.24em] text-slate-400">
                        {skill.value}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={startRun}
                className="rounded-[1.25rem] border border-cyan-300/18 bg-cyan-400/10 px-4 py-4 font-semibold text-white transition duration-300 hover:-translate-y-1 hover:bg-cyan-400/16"
              >
                {phase === "running" ? "Restart Run" : "Start Squadron"}
              </button>
              <button
                type="button"
                onClick={onBack}
                className="rounded-[1.25rem] border border-white/10 bg-white/6 px-4 py-4 font-semibold text-white transition duration-300 hover:-translate-y-1 hover:bg-white/10"
              >
                <FaArrowLeft className="mr-2 inline-block align-[-0.15em]" />
                Back to Game Selection
              </button>
            </div>

            {summary ? (
              <div className="mt-5 rounded-[1.6rem] border border-pink-400/18 bg-pink-500/8 p-5">
                <p className="text-xs uppercase tracking-[0.28em] text-pink-100/80">
                  Last Run Summary
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-black/15 p-4 text-center">
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
                      Stage
                    </p>
                    <p className="mt-2 text-xl font-black text-white">
                      {summary.stage}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-black/15 p-4 text-center">
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
                      Kills
                    </p>
                    <p className="mt-2 text-xl font-black text-white">
                      {summary.kills}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-black/15 p-4 text-center">
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
                      Score
                    </p>
                    <p className="mt-2 text-xl font-black text-white">
                      {formatNumber(summary.score)}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
