import { useEffect, useMemo, useRef, useState } from 'react';
import { clamp, createSeededRandom, hashStringToSeed } from '../../lib/games/helpers';

const MAP_WIDTH = 5600;
const MAP_HEIGHT = 3800;
const DEFAULT_VIEWPORT = { x: 460, y: 620 };
const GIG_TTL_MIN_MS = 2400;
const GIG_TTL_MAX_MS = 2800;
const GIG_EXPIRING_WINDOW_MS = 650;
const HR_FREEZE_MS = 3000;
const HR_BURNOUT_LIMIT = 3;
const HR_COLLISION_MOVE_THRESHOLD = 38;
const HR_COLLISION_BUFFER = 48;
const TELEPORT_MIN_DISTANCE = 1200;

function generateMarketTiles() {
  const random = createSeededRandom(hashStringToSeed('infinite-scroll-market'));
  const tiles = [];
  let id = 0;

  const addTile = (type, x, y, extra = {}) => {
    tiles.push({
      id: `${type}-${id}`,
      type,
      x: Math.round(clamp(x, 70, MAP_WIDTH - 90)),
      y: Math.round(clamp(y, 70, MAP_HEIGHT - 90)),
      ...extra,
    });
    id += 1;
  };

  // Gold senior roles dominate the broad view (the "illusion of abundance").
  const clusterAnchors = [
    { x: 620, y: 560 },
    { x: 960, y: 880 },
    { x: 1420, y: 520 },
    { x: 1980, y: 860 },
    { x: 2580, y: 540 },
    { x: 3280, y: 1040 },
    { x: 4040, y: 640 },
    { x: 4860, y: 1220 },
    { x: 880, y: 1760 },
    { x: 1760, y: 2240 },
    { x: 2840, y: 1980 },
    { x: 3920, y: 2520 },
  ];
  const clusters = [
    ...clusterAnchors,
    ...Array.from({ length: 16 }, () => ({
      x: 260 + random() * (MAP_WIDTH - 520),
      y: 220 + random() * (MAP_HEIGHT - 440),
    })),
  ];

  clusters.forEach((cluster) => {
    const count = 8 + Math.floor(random() * 7);
    for (let index = 0; index < count; index += 1) {
      addTile('senior', cluster.x + (random() - 0.5) * 340, cluster.y + (random() - 0.5) * 260);
    }
  });

  for (let index = 0; index < 260; index += 1) {
    addTile(
      'noise',
      120 + random() * (MAP_WIDTH - 240),
      120 + random() * (MAP_HEIGHT - 240),
      { variant: index % 5 },
    );
  }

  // Fresh grad roles are deliberately rare and far apart.
  const freshRoles = [
    { x: 540, y: 790 },
    { x: 1260, y: 430 },
    { x: 1860, y: 1250 },
    { x: 2640, y: 740 },
    { x: 3360, y: 1500 },
    { x: 4380, y: 860 },
    { x: 5020, y: 2180 },
    { x: 760, y: 2780 },
    { x: 2220, y: 2440 },
    { x: 3460, y: 3040 },
    { x: 4640, y: 3300 },
    { x: 1520, y: 1780 },
  ];

  freshRoles.forEach((role, index) => {
    const x = role.x + (random() - 0.5) * 140;
    const y = role.y + (random() - 0.5) * 140;
    addTile('fresh', x, y);
    addTile('hr', x + 64 + random() * 110, y - 60 + random() * 120);
    if (index % 3 === 0) {
      addTile('hr', x - 110 + random() * 80, y + 36 + random() * 120);
    }
  });

  for (let index = 0; index < 44; index += 1) {
    addTile(
      'freelance',
      160 + random() * (MAP_WIDTH - 320),
      160 + random() * (MAP_HEIGHT - 320),
      {
        ttl: GIG_TTL_MIN_MS + Math.round(random() * (GIG_TTL_MAX_MS - GIG_TTL_MIN_MS)),
      },
    );
  }

  [
    { x: 320, y: 340 },
    { x: 1540, y: 3200 },
    { x: 2860, y: 420 },
    { x: 3960, y: 1640 },
    { x: 5180, y: 520 },
    { x: 840, y: 3520 },
    { x: 3100, y: 3020 },
    { x: 5120, y: 3360 },
  ].forEach((pin) => addTile('onsite', pin.x + (random() - 0.5) * 120, pin.y + (random() - 0.5) * 120));

  for (let index = 0; index < 18; index += 1) {
    addTile(
      'hr',
      280 + random() * (MAP_WIDTH - 560),
      240 + random() * (MAP_HEIGHT - 480),
      {
        patrol: true,
        delay: `${(random() * -3.5).toFixed(2)}s`,
        distance: `${8 + Math.round(random() * 16)}px`,
      },
    );
  }

  return tiles;
}

function getTileLabel(tile) {
  if (tile.type === 'noise') return 'Job listing distraction';
  if (tile.type === 'fresh') return 'Fresh Grad Role';
  if (tile.type === 'senior') return 'Senior Role locked';
  if (tile.type === 'freelance') return 'Freelance Gig';
  if (tile.type === 'hr') return 'HR Gatekeeper';
  return 'Green Pin On-Site Role';
}

export default function InfiniteScrollGame({ reducedMotion }) {
  const randomRef = useRef(createSeededRandom(hashStringToSeed('infinite-scroll-clicks')));
  const surfaceRef = useRef(null);
  const dragRef = useRef(null);
  const gigTimersRef = useRef(new Map());
  const reviewTimerRef = useRef(null);
  const viewportRef = useRef(DEFAULT_VIEWPORT);
  const collisionCooldownRef = useRef(false);
  const tiles = useMemo(() => generateMarketTiles(), []);

  const [viewport, setViewport] = useState(DEFAULT_VIEWPORT);
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fatigueRemaining, setFatigueRemaining] = useState(100);
  const [penalties, setPenalties] = useState(0);
  const [status, setStatus] = useState('active');
  const [message, setMessage] = useState('Drag the market. Stop, inspect, and look for camouflaged beginner roles.');
  const [collectedIds, setCollectedIds] = useState(() => new Set());
  const [expiringGigIds, setExpiringGigIds] = useState(() => new Set());
  const [expiredGigIds, setExpiredGigIds] = useState(() => new Set());

  const fatigueSpent = 100 - fatigueRemaining;
  const isLocked = status === 'frozen' || status === 'burnout' || status === 'won';

  // Mirror viewport into a ref so fast pointer moves and collision checks read
  // the latest position without waiting for a React commit.
  useEffect(() => {
    viewportRef.current = viewport;
  }, [viewport]);

  const getSurfaceSize = () => {
    const rect = surfaceRef.current?.getBoundingClientRect();
    return { width: rect?.width ?? 760, height: rect?.height ?? 420 };
  };

  const clampViewport = (nextViewport) => {
    const size = getSurfaceSize();
    return {
      x: clamp(nextViewport.x, 0, MAP_WIDTH - size.width),
      y: clamp(nextViewport.y, 0, MAP_HEIGHT - size.height),
    };
  };

  const drainFatigue = (amount) => {
    setFatigueRemaining((current) => clamp(current - amount, 0, 100));
  };

  const restoreFatigue = (amount) => {
    setFatigueRemaining((current) => clamp(current + amount, 0, 100));
  };

  const addProgress = (amount, nextMessage, fatigueRecovery = 0) => {
    setProgress((current) => {
      const next = clamp(Number((current + amount).toFixed(2)), 0, 1);
      if (next >= 1) {
        setStatus('won');
        setMessage('Career Progress reached 1.0. You found a path through the market.');
      } else {
        setMessage(nextMessage);
      }
      return next;
    });
    if (fatigueRecovery > 0) restoreFatigue(fatigueRecovery);
  };

  const markCollected = (tileId) => {
    setCollectedIds((current) => {
      const next = new Set(current);
      next.add(tileId);
      return next;
    });
  };

  const clearGigTimer = (tileId) => {
    const timers = gigTimersRef.current.get(tileId);
    if (!timers) return;
    window.clearTimeout(timers.expiringTimer);
    window.clearTimeout(timers.expireTimer);
    gigTimersRef.current.delete(tileId);
  };

  const enterBurnout = (nextMessage = 'The market is unavailable until reset. Too much searching, too many gatekeepers, or too little progress led to burnout.') => {
    dragRef.current = null;
    collisionCooldownRef.current = false;
    setIsDragging(false);
    setStatus('burnout');
    setMessage(nextMessage);
  };

  const resetMarket = () => {
    gigTimersRef.current.forEach((timers) => {
      window.clearTimeout(timers.expiringTimer);
      window.clearTimeout(timers.expireTimer);
    });
    gigTimersRef.current.clear();
    window.clearTimeout(reviewTimerRef.current);
    reviewTimerRef.current = null;
    dragRef.current = null;
    collisionCooldownRef.current = false;
    viewportRef.current = DEFAULT_VIEWPORT;
    setViewport(DEFAULT_VIEWPORT);
    setIsDragging(false);
    setProgress(0);
    setFatigueRemaining(100);
    setPenalties(0);
    setStatus('active');
    setMessage('Drag the market. Stop, inspect, and look for camouflaged beginner roles.');
    setCollectedIds(new Set());
    setExpiringGigIds(new Set());
    setExpiredGigIds(new Set());
  };

  const freezeForReview = (nextPenaltyCount) => {
    window.clearTimeout(reviewTimerRef.current);
    setStatus('frozen');
    setMessage('Your resume is being reviewed...');
    reviewTimerRef.current = window.setTimeout(() => {
      if (nextPenaltyCount >= HR_BURNOUT_LIMIT) {
        enterBurnout('The market is unavailable until reset. Too many HR gatekeepers reviewed you into burnout.');
        return;
      }
      setStatus('active');
      setMessage('No reward. Your application is still pending somewhere.');
    }, HR_FREEZE_MS);
  };

  const hitGatekeeper = () => {
    const nextPenaltyCount = penalties + 1;
    setPenalties(nextPenaltyCount);
    freezeForReview(nextPenaltyCount);
  };

  const getDistantTeleport = () => {
    const size = getSurfaceSize();
    const current = viewportRef.current;
    let candidate = current;

    for (let attempt = 0; attempt < 16; attempt += 1) {
      candidate = clampViewport({
        x: randomRef.current() * (MAP_WIDTH - size.width),
        y: randomRef.current() * (MAP_HEIGHT - size.height),
      });
      const distance = Math.hypot(candidate.x - current.x, candidate.y - current.y);
      if (distance >= TELEPORT_MIN_DISTANCE) return candidate;
    }

    return candidate;
  };

  const handleTileClick = (tile) => {
    if (tile.type === 'noise') return;
    if (isLocked || collectedIds.has(tile.id) || expiredGigIds.has(tile.id)) return;

    if (tile.type === 'fresh') {
      markCollected(tile.id);
      if (randomRef.current() < 0.5) {
        setMessage(randomRef.current() < 0.5 ? 'Position Closed.' : 'Internal Hire.');
        return;
      }
      addProgress(0.1, 'Fresh Grad role landed. Career Progress +0.1.', 4);
      return;
    }

    if (tile.type === 'senior') {
      setMessage('Access Denied. Entry Level: Requires 5+ Years of Experience and 3 coding languages.');
      return;
    }

    if (tile.type === 'freelance') {
      markCollected(tile.id);
      clearGigTimer(tile.id);
      setExpiringGigIds((current) => {
        const next = new Set(current);
        next.delete(tile.id);
        return next;
      });
      const reward = randomRef.current() < 0.5 ? 0.01 : 0.5;
      addProgress(reward, `Freelance gig grabbed: +${reward.toFixed(2)}. Saturated BPO/VA work moved fast and paid unpredictably.`, 1);
      return;
    }

    if (tile.type === 'hr') {
      hitGatekeeper();
      return;
    }

    markCollected(tile.id);
    addProgress(0.3, 'On-site role secured. +0.3. RTO and the Metro Manila commute scramble your orientation.', 3);
    const teleport = getDistantTeleport();
    viewportRef.current = teleport;
    setViewport(teleport);
  };

  const panBy = (deltaX, deltaY, energyCost = 1.5) => {
    if (isLocked) return;
    setViewport((current) => clampViewport({ x: current.x + deltaX, y: current.y + deltaY }));
    drainFatigue(energyCost);
  };

  const handlePointerDown = (event) => {
    if (isLocked) return;
    event.stopPropagation();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    dragRef.current = { x: event.clientX, y: event.clientY };
    setIsDragging(true);
  };

  const handlePointerMove = (event) => {
    if (!dragRef.current || isLocked) return;
    event.stopPropagation();
    const deltaX = event.clientX - dragRef.current.x;
    const deltaY = event.clientY - dragRef.current.y;
    dragRef.current = { x: event.clientX, y: event.clientY };

    const next = clampViewport({ x: viewportRef.current.x - deltaX, y: viewportRef.current.y - deltaY });
    viewportRef.current = next;
    setViewport(next);
    drainFatigue(Math.min(2.8, (Math.abs(deltaX) + Math.abs(deltaY)) * 0.04));

    // Dragging aggressively into an HR Gatekeeper trips a review freeze.
    const speed = Math.abs(deltaX) + Math.abs(deltaY);
    if (speed > HR_COLLISION_MOVE_THRESHOLD && !collisionCooldownRef.current) {
      const size = getSurfaceSize();
      const hit = tiles.some(
        (tile) => tile.type === 'hr'
          && !collectedIds.has(tile.id)
          && tile.x >= next.x - HR_COLLISION_BUFFER
          && tile.x <= next.x + size.width + HR_COLLISION_BUFFER
          && tile.y >= next.y - HR_COLLISION_BUFFER
          && tile.y <= next.y + size.height + HR_COLLISION_BUFFER,
      );
      if (hit) {
        collisionCooldownRef.current = true;
        hitGatekeeper();
      }
    }
  };

  const handlePointerEnd = (event) => {
    event.stopPropagation();
    dragRef.current = null;
    collisionCooldownRef.current = false;
    setIsDragging(false);
  };

  const handleKeyDown = (event) => {
    const keyMap = {
      ArrowLeft: [-120, 0],
      ArrowRight: [120, 0],
      ArrowUp: [0, -120],
      ArrowDown: [0, 120],
      a: [-120, 0],
      d: [120, 0],
      w: [0, -120],
      s: [0, 120],
    };
    const movement = keyMap[event.key];
    if (!movement) return;
    event.preventDefault();
    panBy(movement[0], movement[1]);
  };

  useEffect(() => {
    if (status !== 'active') return undefined;
    const size = getSurfaceSize();
    tiles.forEach((tile) => {
      if (tile.type !== 'freelance' || collectedIds.has(tile.id) || expiredGigIds.has(tile.id)) return;
      if (gigTimersRef.current.has(tile.id)) return;

      const isVisible =
        tile.x >= viewport.x - 30 &&
        tile.x <= viewport.x + size.width + 30 &&
        tile.y >= viewport.y - 30 &&
        tile.y <= viewport.y + size.height + 30;

      if (isVisible) {
        const ttl = tile.ttl ?? GIG_TTL_MAX_MS;
        const expiringTimer = window.setTimeout(() => {
          setExpiringGigIds((current) => {
            const next = new Set(current);
            next.add(tile.id);
            return next;
          });
        }, Math.max(0, ttl - GIG_EXPIRING_WINDOW_MS));
        const expireTimer = window.setTimeout(() => {
          setExpiredGigIds((current) => {
            const next = new Set(current);
            next.add(tile.id);
            return next;
          });
          setExpiringGigIds((current) => {
            const next = new Set(current);
            next.delete(tile.id);
            return next;
          });
          gigTimersRef.current.delete(tile.id);
        }, ttl);
        gigTimersRef.current.set(tile.id, { expiringTimer, expireTimer });
      }
    });
    return undefined;
  }, [collectedIds, expiredGigIds, status, tiles, viewport]);

  useEffect(() => {
    if (fatigueRemaining > 0 || status !== 'active') return undefined;
    const burnoutTimer = window.setTimeout(() => enterBurnout(), 0);
    return () => window.clearTimeout(burnoutTimer);
  }, [fatigueRemaining, status]);

  useEffect(() => {
    const timers = gigTimersRef.current;
    return () => {
      timers.forEach((timer) => {
        window.clearTimeout(timer.expiringTimer);
        window.clearTimeout(timer.expireTimer);
      });
      timers.clear();
      window.clearTimeout(reviewTimerRef.current);
    };
  }, []);

  return (
    <div className="space-y-5">
      <header className="album-game-card p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/45">
              The Infinite Scroll
            </p>
            <h4 className="mt-2 text-2xl font-semibold tracking-normal text-white">
              Entry-level job market simulator.
            </h4>
          </div>
          <button type="button" onClick={resetMarket} className="album-game-button px-4 py-3">
            Reset Market
          </button>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div>
            <div className="mb-1 flex justify-between font-mono text-[10px] uppercase tracking-[0.16em] text-white/50">
              <span>Career Progress</span>
              <span>{progress.toFixed(2)} / 1.00</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-black/40">
              <div className="h-full rounded-full bg-[var(--game-accent)] transition-[width] duration-300" style={{ width: `${progress * 100}%` }} />
            </div>
          </div>
          <div>
            <div className="mb-1 flex justify-between font-mono text-[10px] uppercase tracking-[0.16em] text-white/40">
              <span>Fatigue / time spent</span>
              <span>{Math.round(fatigueSpent)}%</span>
            </div>
            <div className="mt-[3px] h-1 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-white/35 transition-[width] duration-300"
                style={{ width: `${fatigueSpent}%` }}
              />
            </div>
          </div>
          <div className="album-game-inset flex items-center px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-white/60">
            HR Gatekeepers: {penalties} / 3
          </div>
        </div>
      </header>

      <section className="album-game-card p-4">
        <div className="mb-3 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <p className="text-sm text-white/65" aria-live="polite">{message}</p>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/40">
            Drag, or use arrow keys / WASD to pan
          </p>
        </div>
        <div
          ref={surfaceRef}
          role="application"
          tabIndex={0}
          aria-label="Draggable job market grid. Use arrow keys or WASD to pan."
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
          onKeyDown={handleKeyDown}
          className={`job-market-surface relative h-[min(56dvh,520px)] min-h-[360px] overflow-hidden rounded-[6px] border border-white/10 outline-none ${isLocked ? 'job-market-surface--locked' : ''}`}
        >
          <div
            className={`job-market-grid absolute left-0 top-0 ${isDragging ? 'is-dragging' : ''}`}
            style={{
              width: MAP_WIDTH,
              height: MAP_HEIGHT,
              transform: `translate3d(${-viewport.x}px, ${-viewport.y}px, 0)`,
              transition: reducedMotion ? 'none' : 'transform 120ms linear',
              // Fatigue dims and desaturates the market toward burnout.
              filter: `brightness(${(0.58 + 0.42 * (fatigueRemaining / 100)).toFixed(3)}) saturate(${(0.45 + 0.55 * (fatigueRemaining / 100)).toFixed(3)})`,
            }}
          >
            {tiles.map((tile) => {
              const removed = collectedIds.has(tile.id) || expiredGigIds.has(tile.id);
              if (removed) return null;

              if (tile.type === 'noise') {
                return (
                  <span
                    key={tile.id}
                    className={`market-noise-tile market-noise-tile--${tile.variant}`}
                    style={{ left: tile.x, top: tile.y }}
                    aria-hidden="true"
                  />
                );
              }

              return (
                <button
                  key={tile.id}
                  type="button"
                  aria-label={getTileLabel(tile)}
                  title={tile.type === 'senior' ? 'Entry Level: Requires 5+ Years of Experience and 3 coding languages.' : getTileLabel(tile)}
                  onClick={(event) => {
                    event.stopPropagation();
                    handleTileClick(tile);
                  }}
                  onFocus={() => {
                    if (tile.type === 'senior') {
                      setMessage('Entry Level: Requires 5+ Years of Experience and 3 coding languages.');
                    }
                  }}
                  className={`market-tile market-tile--${tile.type} ${
                    tile.type === 'hr' && tile.patrol ? 'market-tile--patrol' : ''
                  } ${tile.type === 'freelance' && expiringGigIds.has(tile.id) ? 'market-tile--expiring' : ''}`}
                  style={{
                    left: tile.x,
                    top: tile.y,
                    '--patrol-delay': tile.delay,
                    '--patrol-distance': tile.distance,
                  }}
                >
                  <span className="market-tile__glyph" aria-hidden="true" />
                </button>
              );
            })}
          </div>
          <div
            className="job-market-fatigue-vignette"
            style={{ opacity: clamp((45 - fatigueRemaining) / 45, 0, 0.62) }}
            aria-hidden="true"
          />
          {status === 'frozen' && (
            <div className="absolute inset-0 grid place-items-center bg-black/55 backdrop-grayscale backdrop-blur-[2px]">
              <p className="rounded-[6px] border border-white/15 bg-black/70 px-4 py-3 font-mono text-xs uppercase tracking-[0.18em] text-white">
                Your resume is being reviewed...
              </p>
            </div>
          )}
          {(status === 'burnout' || status === 'won') && (
            <div className="absolute inset-0 grid place-items-center bg-black/70 p-5 backdrop-blur-sm">
              <div className="album-game-card max-w-sm p-5 text-center">
                <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/45">
                  {status === 'won' ? 'Placement secured' : 'Burnout state'}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-white/70">{message}</p>
                <button type="button" onClick={resetMarket} className="album-game-button mt-4 px-4 py-3">
                  Reset Market
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="mt-3 grid gap-2 text-[11px] text-white/45 sm:grid-cols-2 lg:grid-cols-5">
          <span>Fresh Grad Role: camouflaged envelope</span>
          <span>Senior Role: locked gold briefcase</span>
          <span>Freelance Gig: expiring blue monitor</span>
          <span>HR Gatekeeper: red profile penalty</span>
          <span>On-Site Role: green pin teleport</span>
        </div>
      </section>
    </div>
  );
}
