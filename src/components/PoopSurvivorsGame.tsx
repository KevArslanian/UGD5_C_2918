"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FaArrowLeft, FaBolt, FaHeart, FaShieldAlt, FaStar } from "react-icons/fa";
import { toast } from "react-toastify";

type EnemyKind = "boss" | "normal";
type EffectKind = "boss-burst" | "burst" | "hit";
type SkillKey = "armor" | "booster" | "damage" | "rapid" | "regen" | "spread";

type Enemy = {
  drift: number;
  health: number;
  id: number;
  kind: EnemyKind;
  maxHealth: number;
  phase: number;
  speed: number;
  stage: number;
  x: number;
  y: number;
};

type PlayerPosition = {
  x: number;
  y: number;
};

type Projectile = {
  damage: number;
  id: number;
  speed: number;
  x: number;
  y: number;
};

type CombatEffect = {
  id: number;
  kind: EffectKind;
  x: number;
  y: number;
};

type SkillLevels = Record<SkillKey, number>;

type PoopSurvivorsGameProps = {
  onBack: () => void;
};

const XP_PER_LEVEL = 60;
const MAX_SKILL_LEVEL = 5;
const DEFAULT_PLAYER_POSITION = { x: 50, y: 82 };
const DEFAULT_SKILL_LEVELS: SkillLevels = {
  armor: 0,
  booster: 0,
  damage: 0,
  rapid: 0,
  regen: 0,
  spread: 0,
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function distanceBetween(
  first: { x: number; y: number },
  second: { x: number; y: number },
) {
  return Math.hypot(first.x - second.x, first.y - second.y);
}

function createEnemy(level: number, id: number, x?: number, y = -8): Enemy {
  const enemyHealth = 20 + level * 6;

  return {
    drift: (Math.random() - 0.5) * 1.4,
    health: enemyHealth,
    id,
    kind: "normal",
    maxHealth: enemyHealth,
    phase: Math.random() * Math.PI * 2,
    speed: 0.55 + level * 0.05,
    stage: level,
    x: x ?? 10 + Math.random() * 80,
    y,
  };
}

function createBoss(level: number, id: number): Enemy {
  const bossHealth = 230 + level * 34;

  return {
    drift: 1.45 + level * 0.04,
    health: bossHealth,
    id,
    kind: "boss",
    maxHealth: bossHealth,
    phase: Math.random() * Math.PI * 2,
    speed: 0.42 + level * 0.03,
    stage: level,
    x: 50,
    y: -14,
  };
}

function getFirePattern(count: number) {
  if (count >= 5) {
    return [-6, -3, 0, 3, 6];
  }

  if (count === 4) {
    return [-5, -1.7, 1.7, 5];
  }

  if (count === 3) {
    return [-3.5, 0, 3.5];
  }

  if (count === 2) {
    return [-2.4, 2.4];
  }

  return [0];
}

export default function PoopSurvivorsGame({
  onBack,
}: PoopSurvivorsGameProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [health, setHealth] = useState(100);
  const [totalXp, setTotalXp] = useState(0);
  const [killCount, setKillCount] = useState(0);
  const [bossRewardPoints, setBossRewardPoints] = useState(0);
  const [skillLevels, setSkillLevels] = useState<SkillLevels>(DEFAULT_SKILL_LEVELS);
  const [playerPosition, setPlayerPosition] = useState<PlayerPosition>(
    DEFAULT_PLAYER_POSITION,
  );
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const [effects, setEffects] = useState<CombatEffect[]>([]);

  const previousLevelRef = useRef(1);
  const bossSpawnedLevelRef = useRef(0);
  const enemyIdRef = useRef(0);
  const projectileIdRef = useRef(0);
  const effectIdRef = useRef(0);
  const gameOverRef = useRef(false);
  const playerPositionRef = useRef<PlayerPosition>(DEFAULT_PLAYER_POSITION);
  const enemiesRef = useRef<Enemy[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);
  const pressedKeysRef = useRef<Set<string>>(new Set());

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
  const maxHealth = useMemo(() => 100 + skillLevels.armor * 20, [skillLevels.armor]);
  const movementSpeed = useMemo(
    () => 1.9 + skillLevels.booster * 0.28,
    [skillLevels.booster],
  );
  const projectileDamage = useMemo(
    () => 12 + Math.floor(level / 2) * 2 + skillLevels.damage * 4,
    [level, skillLevels.damage],
  );
  const fireRate = useMemo(
    () => Math.max(90, 260 - (level - 1) * 10 - skillLevels.rapid * 20),
    [level, skillLevels.rapid],
  );
  const spawnRate = useMemo(
    () => Math.max(340, 900 - (level - 1) * 45),
    [level],
  );
  const regenAmount = useMemo(() => skillLevels.regen, [skillLevels.regen]);
  const laneCount = useMemo(() => {
    const baseLaneCount = level >= 7 ? 3 : level >= 3 ? 2 : 1;
    return Math.min(5, baseLaneCount + skillLevels.spread);
  }, [level, skillLevels.spread]);
  const firePattern = useMemo(() => getFirePattern(laneCount), [laneCount]);
  const bossEnemy = useMemo(
    () => enemies.find((enemy) => enemy.kind === "boss") ?? null,
    [enemies],
  );
  const nextBossStage = useMemo(() => {
    if (level < 5) {
      return 5;
    }

    return Math.ceil(level / 5) * 5;
  }, [level]);

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
    if (level <= previousLevelRef.current) {
      return;
    }

    toast.success(`\u{1F680} Toilet Squadron Level ${level}! +1 Skill Point`, {
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
    if (!isRunning || regenAmount === 0) {
      return;
    }

    const regenTimer = window.setInterval(() => {
      setHealth((previousHealth) => Math.min(maxHealth, previousHealth + regenAmount));
    }, 1500);

    return () => window.clearInterval(regenTimer);
  }, [isRunning, maxHealth, regenAmount]);

  useEffect(() => {
    if (!isRunning) {
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
  }, [isRunning]);

  useEffect(() => {
    if (!isRunning) {
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
          x: clamp(nextX, 8, 92),
          y: clamp(nextY, 52, 92),
        };
      });
    }, 24);

    return () => window.clearInterval(movementTimer);
  }, [isRunning, movementSpeed]);

  useEffect(() => {
    if (!isRunning) {
      return;
    }

    const spawnTimer = window.setInterval(() => {
      const activeBoss = enemiesRef.current.find((enemy) => enemy.kind === "boss");

      if (level % 5 === 0 && !activeBoss && bossSpawnedLevelRef.current < level) {
        enemyIdRef.current += 1;
        const boss = createBoss(level, enemyIdRef.current);

        setEnemies((previousEnemies) => [...previousEnemies, boss]);
        bossSpawnedLevelRef.current = level;
        toast.warn(`\u{1F525} Boss Stage ${level}! Giant Poop inbound!`, {
          position: "top-right",
          progressClassName: "toast-progress-error",
          style: {
            background: "#111111",
            color: "#ffffff",
          },
        });
        return;
      }

      if (activeBoss) {
        if (Math.random() > 0.55) {
          enemyIdRef.current += 1;
          setEnemies((previousEnemies) => [
            ...previousEnemies,
            createEnemy(
              level,
              enemyIdRef.current,
              clamp(activeBoss.x + (Math.random() - 0.5) * 24, 10, 90),
              activeBoss.y + 8,
            ),
          ]);
        }
        return;
      }

      enemyIdRef.current += 1;
      const spawnedEnemies = [createEnemy(level, enemyIdRef.current)];

      if (level >= 6 && Math.random() > 0.68) {
        enemyIdRef.current += 1;
        spawnedEnemies.push(createEnemy(level, enemyIdRef.current));
      }

      setEnemies((previousEnemies) => [...previousEnemies, ...spawnedEnemies]);
    }, spawnRate);

    return () => window.clearInterval(spawnTimer);
  }, [isRunning, level, spawnRate]);

  useEffect(() => {
    if (!isRunning) {
      return;
    }

    const fireTimer = window.setInterval(() => {
      const player = playerPositionRef.current;

      const shots = firePattern.map((offset) => {
        projectileIdRef.current += 1;

        return {
          damage: projectileDamage,
          id: projectileIdRef.current,
          speed: 3.4,
          x: clamp(player.x + offset, 6, 94),
          y: player.y - 8,
        };
      });

      setProjectiles((previousProjectiles) => [...previousProjectiles, ...shots]);
    }, fireRate);

    return () => window.clearInterval(fireTimer);
  }, [firePattern, fireRate, isRunning, projectileDamage]);

  useEffect(() => {
    if (!isRunning) {
      return;
    }

    const battleLoop = window.setInterval(() => {
      const player = playerPositionRef.current;
      const now = Date.now();

      const emitEffect = (x: number, y: number, kind: EffectKind) => {
        effectIdRef.current += 1;
        const id = effectIdRef.current;

        setEffects((previousEffects) => [...previousEffects, { id, kind, x, y }]);
        window.setTimeout(() => {
          setEffects((previousEffects) =>
            previousEffects.filter((effect) => effect.id !== id),
          );
        }, kind === "boss-burst" ? 780 : 420);
      };

      const movedProjectiles = projectilesRef.current
        .map((projectile) => ({
          ...projectile,
          y: projectile.y - projectile.speed,
        }))
        .filter((projectile) => projectile.y > -8);

      const movedEnemies = enemiesRef.current
        .map((enemy) => {
          if (enemy.kind === "boss") {
            const hoverY = enemy.y < 18 ? enemy.y + enemy.speed : 18 + Math.sin(now / 520) * 2;

            return {
              ...enemy,
              x: clamp(
                enemy.x + Math.sin(now / 320 + enemy.phase) * enemy.drift,
                12,
                88,
              ),
              y: hoverY,
            };
          }

          return {
            ...enemy,
            x: clamp(
              enemy.x + Math.sin(now / 260 + enemy.phase) * enemy.drift,
              6,
              94,
            ),
            y: enemy.y + enemy.speed,
          };
        })
        .filter((enemy) => enemy.y < 110);

      let gainedXp = 0;
      let gainedKills = 0;
      let gainedBossPoints = 0;
      const survivingProjectiles: Projectile[] = [];
      let survivingEnemies = movedEnemies.map((enemy) => ({ ...enemy }));

      for (const projectile of movedProjectiles) {
        let didHit = false;

        survivingEnemies = survivingEnemies.flatMap((enemy) => {
          if (didHit) {
            return [enemy];
          }

          const hitRadius = enemy.kind === "boss" ? 8.8 : 5.5;

          if (distanceBetween(projectile, enemy) < hitRadius) {
            didHit = true;
            const nextHealth = enemy.health - projectile.damage;
            emitEffect(enemy.x, enemy.y, nextHealth <= 0 ? "burst" : "hit");

            if (nextHealth <= 0) {
              if (enemy.kind === "boss") {
                gainedXp += 140;
                gainedKills += 1;
                gainedBossPoints += 2;
                emitEffect(enemy.x, enemy.y, "boss-burst");
                toast.success(
                  `\u{1F3C6} Boss Stage ${enemy.stage} clear! +2 Skill Points`,
                  {
                    position: "top-right",
                    progressClassName: "toast-progress-success",
                    style: {
                      background: "#111111",
                      color: "#ffffff",
                    },
                  },
                );
                return [];
              }

              gainedXp += 12;
              gainedKills += 1;
              return [];
            }

            return [
              {
                ...enemy,
                health: nextHealth,
              },
            ];
          }

          return [enemy];
        });

        if (!didHit) {
          survivingProjectiles.push(projectile);
        }
      }

      let damageTaken = 0;

      survivingEnemies = survivingEnemies.filter((enemy) => {
        const touchedPlayer = distanceBetween(enemy, player) < (enemy.kind === "boss" ? 10 : 7);
        const escapedBottom = enemy.kind === "normal" && enemy.y > 104;

        if (touchedPlayer || escapedBottom) {
          damageTaken += enemy.kind === "boss" ? 24 : touchedPlayer ? 14 : 8;
          return false;
        }

        return true;
      });

      projectilesRef.current = survivingProjectiles;
      enemiesRef.current = survivingEnemies;
      setProjectiles(survivingProjectiles);
      setEnemies(survivingEnemies);

      if (gainedXp > 0) {
        setTotalXp((previousXp) => previousXp + gainedXp);
      }

      if (gainedKills > 0) {
        setKillCount((previousKills) => previousKills + gainedKills);
      }

      if (gainedBossPoints > 0) {
        setBossRewardPoints((previousPoints) => previousPoints + gainedBossPoints);
      }

      if (damageTaken > 0) {
        setHealth((previousHealth) => {
          const nextHealth = Math.max(previousHealth - damageTaken, 0);

          if (nextHealth === 0 && !gameOverRef.current) {
            gameOverRef.current = true;
            setIsRunning(false);
            setEnemies([]);
            setProjectiles([]);
            enemiesRef.current = [];
            projectilesRef.current = [];
            pressedKeysRef.current.clear();
            toast.error("\u{1F480} Toilet Squadron down! Game Over!", {
              position: "top-right",
              progressClassName: "toast-progress-error",
              style: {
                background: "#111111",
                color: "#ffffff",
              },
            });
          }

          return nextHealth;
        });
      }
    }, 33);

    return () => window.clearInterval(battleLoop);
  }, [isRunning]);

  const showInfoToast = (message: string) => {
    toast.info(message, {
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

  const purchaseSkill = (skillKey: SkillKey) => {
    if (!isRunning) {
      showInfoToast("Mulai squadron dulu untuk membangun skill.");
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

    if (skillKey === "armor") {
      setHealth((previousHealth) => Math.min(previousHealth + 20, maxHealth + 20));
    }

    showInfoToast("Skill berhasil ditingkatkan.");
  };

  const startSurvival = () => {
    gameOverRef.current = false;
    pressedKeysRef.current.clear();
    previousLevelRef.current = 1;
    bossSpawnedLevelRef.current = 0;
    enemyIdRef.current = 0;
    projectileIdRef.current = 0;
    effectIdRef.current = 0;
    setSkillLevels(DEFAULT_SKILL_LEVELS);
    setBossRewardPoints(0);
    setHealth(100);
    setTotalXp(0);
    setKillCount(0);
    setEnemies([]);
    setProjectiles([]);
    setEffects([]);
    enemiesRef.current = [];
    projectilesRef.current = [];
    setPlayerPosition(DEFAULT_PLAYER_POSITION);
    setIsRunning(true);
    showInfoToast("\u{1F680} Toilet Squadron launched!");
  };

  const skillCards: Array<{
    description: string;
    icon: React.ReactNode;
    keyName: SkillKey;
    title: string;
    value: string;
  }> = [
    {
      description: "Peluru makin sakit untuk boss dan minion.",
      icon: <FaBolt />,
      keyName: "damage",
      title: "Damage Core",
      value: `+4 dmg / lv`,
    },
    {
      description: "Interval tembakan makin rapat dan agresif.",
      icon: <FaStar />,
      keyName: "rapid",
      title: "Rapid Flush",
      value: `-20ms / lv`,
    },
    {
      description: "Tambah laras tembak untuk coverage lebih lebar.",
      icon: <FaStar />,
      keyName: "spread",
      title: "Side Cannons",
      value: `+1 lane`,
    },
    {
      description: "Tangki HP lebih besar dan heal saat dibeli.",
      icon: <FaHeart />,
      keyName: "armor",
      title: "Armor Tank",
      value: `+20 HP`,
    },
    {
      description: "Booster lebih kencang dan manuver lebih lincah.",
      icon: <FaBolt />,
      keyName: "booster",
      title: "Hydro Booster",
      value: `+speed`,
    },
    {
      description: "Busa perbaikan mengisi HP perlahan saat battle.",
      icon: <FaShieldAlt />,
      keyName: "regen",
      title: "Repair Foam",
      value: `+regen`,
    },
  ];

  return (
    <section className="animate-panel-enter relative mx-auto w-full max-w-[min(100%,74rem)] overflow-hidden rounded-3xl border-2 bg-gradient-to-b from-green-700 to-green-500 p-4 text-center shadow-2xl backdrop-blur-sm md:p-8">
      <div className="animate-ambient-drift absolute top-[-3rem] right-[-3rem] h-40 w-40 rounded-full bg-[#b6ffd622] blur-3xl" />
      <div className="animate-ambient-drift absolute bottom-[-4rem] left-[-3rem] h-52 w-52 rounded-full bg-[#00ff7b1c] blur-3xl [animation-delay:-2.2s]" />

      <div className="relative mb-4 border-b-2 border-green-300 pb-4 md:mb-8 md:pb-6">
        <h2 className="animate-title-glow mb-2 text-3xl font-bold text-green-300 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] sm:text-4xl md:mb-4">
          Poop Survivors Squadron {"\u{1F6BD}"}
        </h2>
        <p className="text-sm italic text-green-100 md:text-lg">
          Toilet fighter, hydro booster, skill tree, dan boss stage dalam arena poop shooter.
        </p>
      </div>

      <div className="animate-soft-float relative mb-4 rounded-xl border-2 border-green-400 bg-green-800/30 p-4 shadow-inner md:mb-8 md:p-6">
        <div className="mb-4 grid grid-cols-2 gap-3 text-sm text-green-100 md:grid-cols-5 md:text-base">
          <p>
            Health: <span className="font-mono text-green-300">{health}</span>/
            {maxHealth}
          </p>
          <p>
            Level: <span className="font-mono text-green-300">{level}</span>
          </p>
          <p>
            XP: <span className="font-mono text-green-300">{xpProgress}</span>/
            {XP_PER_LEVEL}
          </p>
          <p>
            Kills: <span className="font-mono text-green-300">{killCount}</span>
          </p>
          <p>
            SP: <span className="font-mono text-green-300">{skillPoints}</span>
          </p>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-2 text-xs text-green-50/90 md:grid-cols-4 md:text-sm">
          <p>Damage: {projectileDamage}</p>
          <p>Fire rate: {fireRate}ms</p>
          <p>Booster speed: {movementSpeed.toFixed(1)}</p>
          <p>Next boss: Stage {nextBossStage}</p>
        </div>

        <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-green-300/80 bg-[#101a2d]">
          <div className="shooter-space absolute inset-0" />
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#081221]/85 to-transparent" />

          {bossEnemy ? (
            <div className="absolute inset-x-4 top-3 z-20 rounded-xl bg-black/35 px-3 py-2 backdrop-blur-sm">
              <div className="mb-1 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.22em] text-red-200">
                <span>Boss Stage {bossEnemy.stage}</span>
                <span>Giant Poop</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-800/90">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-red-500 via-orange-400 to-yellow-300 transition-all duration-300"
                  style={{ width: `${(bossEnemy.health / bossEnemy.maxHealth) * 100}%` }}
                />
              </div>
            </div>
          ) : null}

          <div
            className="absolute text-3xl"
            style={{
              left: `${playerPosition.x}%`,
              top: `${playerPosition.y}%`,
              transform: "translate(-50%, -50%)",
            }}
          >
            <div className="relative">
              <span className="animate-icon-hover relative z-10 inline-block drop-shadow-[0_4px_8px_rgba(255,255,255,0.18)]">
                {"\u{1F6BD}"}
              </span>
              <div className="pointer-events-none absolute left-1/2 top-[78%] -translate-x-1/2">
                <div className="relative h-10 w-12">
                  {Array.from({ length: 3 + skillLevels.booster }).map((_, index) => (
                    <span
                      key={`booster-${index}`}
                      className="booster-drop absolute rounded-full bg-gradient-to-b from-cyan-100 via-sky-300 to-blue-500"
                      style={{
                        animationDelay: `${index * 0.08}s`,
                        animationDuration: `${0.48 + index * 0.04}s`,
                        height: `${10 + (index % 2) * 4}px`,
                        left: `${50 + (index - (2 + skillLevels.booster) / 2) * 12}%`,
                        top: `${4 + index * 2}px`,
                        width: `${5 + (index % 2)}px`,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {projectiles.map((projectile) => (
            <div
              key={projectile.id}
              className="animate-projectile-glow absolute h-5 w-1.5 rounded-full bg-gradient-to-t from-cyan-300 via-white to-cyan-100"
              style={{
                boxShadow: "0 0 14px rgba(103, 232, 249, 0.85)",
                left: `${projectile.x}%`,
                top: `${projectile.y}%`,
                transform: "translate(-50%, -50%)",
              }}
            />
          ))}

          {enemies.map((enemy) => (
            <div
              key={enemy.id}
              className={`absolute ${enemy.kind === "boss" ? "text-5xl" : "text-2xl"}`}
              style={{
                left: `${enemy.x}%`,
                top: `${enemy.y}%`,
                transform: "translate(-50%, -50%)",
              }}
            >
              <span className="animate-enemy-bob inline-block">
                {enemy.kind === "boss" ? "\u{1F4A9}" : "\u{1F4A9}"}
              </span>
              <div
                className={`absolute left-1/2 -translate-x-1/2 rounded-full bg-slate-700/90 ${
                  enemy.kind === "boss" ? "top-[-2rem] h-2 w-24" : "top-[-1.5rem] h-1.5 w-12"
                }`}
              >
                <div
                  className={`h-full rounded-full transition-all duration-200 ${
                    enemy.kind === "boss"
                      ? "bg-gradient-to-r from-red-500 via-orange-400 to-yellow-300"
                      : "bg-red-500"
                  }`}
                  style={{ width: `${(enemy.health / enemy.maxHealth) * 100}%` }}
                />
              </div>
            </div>
          ))}

          {effects.map((effect) => (
            <span
              key={effect.id}
              className={`absolute left-0 top-0 rounded-full ${
                effect.kind === "hit"
                  ? "combat-effect-hit"
                  : effect.kind === "burst"
                    ? "combat-effect-burst"
                    : "combat-effect-boss"
              }`}
              style={{
                left: `${effect.x}%`,
                top: `${effect.y}%`,
                transform: "translate(-50%, -50%)",
              }}
            />
          ))}
        </div>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {skillCards.map((skill) => (
          <button
            key={skill.keyName}
            type="button"
            onClick={() => purchaseSkill(skill.keyName)}
            disabled={!isRunning || skillPoints <= 0 || skillLevels[skill.keyName] >= MAX_SKILL_LEVEL}
            className={`group relative overflow-hidden rounded-2xl border-2 p-4 text-left shadow-lg transition-all duration-300 ${
              isRunning && skillPoints > 0 && skillLevels[skill.keyName] < MAX_SKILL_LEVEL
                ? "border-green-300 bg-green-700/75 text-white hover:-translate-y-1 hover:border-green-200 hover:bg-green-600"
                : "cursor-not-allowed border-green-700/70 bg-green-900/40 text-green-100/65 opacity-80"
            }`}
          >
            {isRunning && skillPoints > 0 && skillLevels[skill.keyName] < MAX_SKILL_LEVEL ? (
              <span className="animate-sheen absolute inset-y-0 left-[-30%] w-1/3 bg-white/10 blur-md" />
            ) : null}
            <div className="relative z-10 flex items-center justify-between">
              <span className="flex items-center gap-2 text-base font-bold">
                <span className="text-green-200">{skill.icon}</span>
                {skill.title}
              </span>
              <span className="rounded-full bg-black/20 px-2 py-1 text-xs font-semibold">
                Lv.{skillLevels[skill.keyName]}/{MAX_SKILL_LEVEL}
              </span>
            </div>
            <p className="relative z-10 mt-2 text-sm text-green-50/90">
              {skill.description}
            </p>
            <div className="relative z-10 mt-3 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] text-green-200/90">
              <span>{skill.value}</span>
              <span>Cost 1 SP</span>
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
        <button
          type="button"
          onClick={startSurvival}
          disabled={isRunning}
          className={`group relative flex items-center justify-center gap-2 overflow-hidden rounded-xl border-2 border-green-400 p-3 text-sm font-semibold text-green-50 shadow-lg transition-all duration-300 active:scale-95 md:p-4 md:text-base ${
            isRunning
              ? "cursor-not-allowed bg-green-700/80 opacity-50"
              : "bg-green-700/80 hover:-translate-y-1 hover:scale-[1.02] hover:border-green-300 hover:bg-green-600 hover:shadow-xl"
          }`}
        >
          {!isRunning ? (
            <span className="animate-sheen absolute inset-y-0 left-[-30%] w-1/3 bg-white/15 blur-md" />
          ) : null}
          <FaStar className="relative z-10 text-lg text-green-300 md:text-xl" />
          <span className="relative z-10">
            {isRunning ? "Squadron Sedang Terbang" : "Start Squadron"}
          </span>
        </button>

        <button
          type="button"
          onClick={onBack}
          className="rounded-xl bg-gray-700 p-3 text-white shadow-[0_12px_24px_rgba(15,23,42,0.18)] transition-all duration-300 hover:-translate-y-1 hover:bg-gray-600 md:p-4"
        >
          <FaArrowLeft className="mr-2 inline-block align-[-0.15em]" />
          Back to Game Selection
        </button>
      </div>

      <div className="mt-4 text-sm text-green-100/90">
        Controls: `WASD` / arrow keys untuk bergerak. Kumpulkan XP, beli skill, dan bersiap untuk boss stage setiap level 5.
      </div>
    </section>
  );
}
