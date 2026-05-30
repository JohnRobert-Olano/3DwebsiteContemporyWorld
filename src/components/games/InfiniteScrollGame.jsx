import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { clamp, createSeededRandom, hashStringToSeed } from '../../lib/games/helpers';

const MAP_WIDTH = 5600;
const MAP_HEIGHT = 3800;
const DEFAULT_VIEWPORT = { x: 460, y: 620 };
const WIN_TARGET = 3;
const FRESH_REQUIREMENT = 1;
const FREELANCE_CYCLE_MS = 3000;
const HR_FREEZE_MS = 5000;
const HR_BURNOUT_LIMIT = 3;
const HR_COLLISION_MOVE_THRESHOLD = 38;
const HR_COLLISION_BUFFER = 48;
const TELEPORT_MIN_DISTANCE = 1200;
const REVIEW_SCROLL_MAX = 100;
const REVIEW_SCROLL_DRAIN_PER_HR_DRAG = 25;
const REVIEW_SCROLL_COLLISION_COOLDOWN_MS = 520;
const INTERACTIVE_TILE_SPACING = 124;
const TUTORIAL_STEPS = [
  {
    title: 'Welcome',
    iconType: null,
    marker: '01',
    copy: 'The Infinite Scroll is a job-market survival game. Reach 3.00 years of experience / Career Progress before the search burns you out.',
  },
  {
    title: 'How to move',
    iconType: null,
    marker: 'PAN',
    copy: 'Drag the job market map to search. Arrow keys and WASD also pan the grid. Every search spends fatigue and scroll time.',
  },
  {
    title: 'Invisible Fresh Grad roles',
    iconType: 'fresh',
    copy: 'Camouflaged envelope tiles are Fresh Grad roles. They are hard to see, but each successful click adds +0.20 years of experience.',
  },
  {
    title: 'Yellow Entry-Level roles',
    iconType: 'senior',
    copy: 'Yellow briefcases are Entry-Level roles. Below 1.00 years, the application is denied and the icon disappears. At 1.00+ years, they add +0.50 years.',
  },
  {
    title: 'Blue Freelancer gigs',
    iconType: 'freelance',
    copy: 'Blue monitor tiles appear and disappear every 3 seconds. You can click them below 1.00 years, and they award a random +0.30 to +0.50 years.',
  },
  {
    title: 'Red HR Gatekeepers',
    iconType: 'hr',
    copy: 'Red profile tiles are HR Gatekeepers. Clicking one shows “Your resume is being reviewed...” and locks the game for 5 seconds.',
  },
  {
    title: 'Green On-Site roles',
    iconType: 'onsite',
    copy: 'Green pins are On-Site roles. Clicking one adds +0.30 years, then teleports the map to simulate commute disorientation.',
  },
  {
    title: 'Win / burnout',
    iconType: null,
    marker: '3.00',
    copy: 'You win at 3.00 years of experience. Burnout happens when the search becomes too exhausting or gatekeeper penalties stack up.',
  },
];

function generateMarketTiles() {
  const random = createSeededRandom(hashStringToSeed('infinite-scroll-market'));
  const tiles = [];
  const placedInteractiveTiles = [];
  let id = 0;

  const addTile = (type, x, y, extra = {}) => {
    const tile = {
      id: `${type}-${id}`,
      type,
      x: Math.round(clamp(x, 70, MAP_WIDTH - 90)),
      y: Math.round(clamp(y, 70, MAP_HEIGHT - 90)),
      ...extra,
    };
    tiles.push(tile);
    id += 1;
    return tile;
  };

  const getNearestInteractiveDistance = (x, y) => {
    if (!placedInteractiveTiles.length) return Infinity;
    return Math.min(...placedInteractiveTiles.map((tile) => Math.hypot(tile.x - x, tile.y - y)));
  };

  const addSpacedTile = (type, targetX, targetY, extra = {}, options = {}) => {
    const {
      minDistance = INTERACTIVE_TILE_SPACING,
      attempts = 36,
      spreadX = 360,
      spreadY = 280,
    } = options;
    let bestCandidate = { x: targetX, y: targetY, distance: getNearestInteractiveDistance(targetX, targetY) };

    for (let attempt = 0; attempt < attempts; attempt += 1) {
      const x = attempt === 0 ? targetX : targetX + (random() - 0.5) * spreadX;
      const y = attempt === 0 ? targetY : targetY + (random() - 0.5) * spreadY;
      const candidate = {
        x: clamp(x, 70, MAP_WIDTH - 90),
        y: clamp(y, 70, MAP_HEIGHT - 90),
      };
      const distance = getNearestInteractiveDistance(candidate.x, candidate.y);

      if (distance > bestCandidate.distance) {
        bestCandidate = { ...candidate, distance };
      }

      if (distance >= minDistance) {
        const tile = addTile(type, candidate.x, candidate.y, extra);
        placedInteractiveTiles.push(tile);
        return tile;
      }
    }

    const tile = addTile(type, bestCandidate.x, bestCandidate.y, extra);
    placedInteractiveTiles.push(tile);
    return tile;
  };

  // All five job categories get the SAME number of tiles, scattered across the
  // map with even spacing so no single colour dominates the broad view. (Earlier
  // builds flooded the map with gold "Entry-Level" clusters; the five categories
  // are now balanced 1:1:1:1:1.)
  const PER_CATEGORY = 20;
  const jobCategories = ['fresh', 'senior', 'freelance', 'onsite', 'hr'];

  jobCategories.forEach((type) => {
    for (let index = 0; index < PER_CATEGORY; index += 1) {
      const extra = type === 'hr'
        ? {
            patrol: true,
            delay: `${(random() * -3.5).toFixed(2)}s`,
            distance: `${8 + Math.round(random() * 16)}px`,
          }
        : {};
      addSpacedTile(
        type,
        160 + random() * (MAP_WIDTH - 320),
        160 + random() * (MAP_HEIGHT - 320),
        extra,
        {
          minDistance: INTERACTIVE_TILE_SPACING,
          attempts: 48,
          spreadX: 520,
          spreadY: 420,
        },
      );
    }
  });

  // Background "job listing" noise — pure distraction, not one of the five
  // categories, so it does not affect the balance above.
  for (let index = 0; index < 180; index += 1) {
    addTile(
      'noise',
      120 + random() * (MAP_WIDTH - 240),
      120 + random() * (MAP_HEIGHT - 240),
      { variant: index % 5 },
    );
  }

  return tiles;
}

function getTileLabel(tile) {
  if (tile.type === 'noise') return 'Job listing distraction';
  if (tile.type === 'fresh') return 'Fresh Grad Role';
  if (tile.type === 'senior') return 'Entry-Level Role';
  if (tile.type === 'freelance') return 'Freelance Gig';
  if (tile.type === 'hr') return 'HR Gatekeeper';
  return 'Green Pin On-Site Role';
}

// Deadpan microcopy banks merged from the Claude Design handoff (data.jsx, brief
// section 10). The system speaks in confident corporate lines; the rare reward is
// undercut by a dry note. Picked from a dedicated seeded stream so message variety
// never perturbs gameplay outcomes.
const MICRO = {
  entryDenied: [
    'Entry-Level Role still requires 1.00 years of experience.',
    'Entry-Level, they said. 1.00 years of experience required, they meant.',
    'Come back with 1.00 years of experience for this entry-level role.',
    'This entry-level role is locked until you log 1.00 years of experience.',
  ],
  gradTick: [
    'Application received.',
    'Thank you for your interest.',
    'We will be in touch.',
    'Your application is important to us.',
    'One step closer. Allegedly.',
  ],
  freelanceWin: ['Gig landed.', 'They paid. This time.', 'Invoice sent. Cross your fingers.'],
  relocating: [
    'Relocating to a province you have never heard of.',
    'Return-to-office mandate in effect.',
    'New duty station assigned.',
    'Hope you like 4-hour commutes.',
  ],
};

function pickFrom(list, nextRandom) {
  return list[Math.floor(nextRandom() * list.length) % list.length];
}

export default function InfiniteScrollGame({ reducedMotion }) {
  const randomRef = useRef(createSeededRandom(hashStringToSeed('infinite-scroll-clicks')));
  const copyRandomRef = useRef(createSeededRandom(hashStringToSeed('infinite-scroll-copy')));
  const surfaceRef = useRef(null);
  const dragRef = useRef(null);
  const tutorialCardRef = useRef(null);
  const reviewTimerRef = useRef(null);
  const viewportRef = useRef(DEFAULT_VIEWPORT);
  const collisionCooldownRef = useRef(false);
  const collisionCooldownTimerRef = useRef(null);
  const reviewScrollRef = useRef(REVIEW_SCROLL_MAX);
  const popupTimerRef = useRef(null);
  const tiles = useMemo(() => generateMarketTiles(), []);

  const [viewport, setViewport] = useState(DEFAULT_VIEWPORT);
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fatigueRemaining, setFatigueRemaining] = useState(100);
  const [reviewScrollRemaining, setReviewScrollRemaining] = useState(REVIEW_SCROLL_MAX);
  const [penalties, setPenalties] = useState(0);
  const [status, setStatus] = useState('active');
  const [message, setMessage] = useState('Drag the market. Stop, inspect, and look for camouflaged beginner roles.');
  const [collectedIds, setCollectedIds] = useState(() => new Set());
  const [freelanceVisible, setFreelanceVisible] = useState(true);
  const [popup, setPopup] = useState(null);
  const [tutorialOpen, setTutorialOpen] = useState(true);
  const [tutorialStep, setTutorialStep] = useState(0);

  const fatigueSpent = 100 - fatigueRemaining;
  const currentTutorialStep = TUTORIAL_STEPS[tutorialStep];
  const isLocked = tutorialOpen || status === 'frozen' || status === 'burnout' || status === 'won';
  const pickCopy = (list) => pickFrom(list, copyRandomRef.current);

  // Cold bureaucratic coordinate readout (design onCoord), relative to map centre.
  const coordSign = (value) => `${value >= 0 ? '+' : '−'}${String(Math.abs(value)).padStart(4, '0')}`;
  const coordLabel = `X${coordSign(Math.round(viewport.x - MAP_WIDTH / 2))} · Y${coordSign(Math.round(viewport.y - MAP_HEIGHT / 2))}`;

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

  const setReviewScroll = (value) => {
    const next = clamp(value, 0, REVIEW_SCROLL_MAX);
    reviewScrollRef.current = next;
    setReviewScrollRemaining(next);
  };

  // Every scroll spends the review buffer. Returns true once it hits empty, which
  // is the cue to pull the player into an HR review.
  const drainReviewScrollBy = (amount) => {
    const next = clamp(reviewScrollRef.current - amount, 0, REVIEW_SCROLL_MAX);
    setReviewScroll(next);
    return next <= 0;
  };

  const releaseCollisionCooldown = useCallback(() => {
    window.clearTimeout(collisionCooldownTimerRef.current);
    collisionCooldownTimerRef.current = null;
    collisionCooldownRef.current = false;
  }, []);

  const startCollisionCooldown = () => {
    collisionCooldownRef.current = true;
    window.clearTimeout(collisionCooldownTimerRef.current);
    collisionCooldownTimerRef.current = window.setTimeout(() => {
      collisionCooldownRef.current = false;
      collisionCooldownTimerRef.current = null;
    }, REVIEW_SCROLL_COLLISION_COOLDOWN_MS);
  };

  const addProgress = (amount, nextMessage, fatigueRecovery = 0) => {
    setProgress((current) => {
      const next = clamp(Number((current + amount).toFixed(2)), 0, WIN_TARGET);
      if (next >= WIN_TARGET) {
        setStatus('won');
        setMessage('Congratulations. You reached 3.00 years of experience and finally broke through the job market.');
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

  // Transient centred popup for warnings (e.g. an entry-level denial), so the
  // notice lands in the player's eyeline instead of as small top-left status text.
  const showPopup = (text) => {
    setPopup(text);
    window.clearTimeout(popupTimerRef.current);
    popupTimerRef.current = window.setTimeout(() => setPopup(null), 2600);
  };

  const enterBurnout = useCallback((nextMessage = 'The market is unavailable until reset. Too much searching, too many gatekeepers, or too little progress led to burnout.') => {
    dragRef.current = null;
    releaseCollisionCooldown();
    setIsDragging(false);
    setStatus('burnout');
    setMessage(nextMessage);
  }, [releaseCollisionCooldown]);

  const resetMarket = () => {
    window.clearTimeout(reviewTimerRef.current);
    reviewTimerRef.current = null;
    dragRef.current = null;
    releaseCollisionCooldown();
    setReviewScroll(REVIEW_SCROLL_MAX);
    viewportRef.current = DEFAULT_VIEWPORT;
    setViewport(DEFAULT_VIEWPORT);
    setIsDragging(false);
    setProgress(0);
    setFatigueRemaining(100);
    setPenalties(0);
    setStatus('active');
    setMessage('Drag the market. Stop, inspect, and look for camouflaged beginner roles.');
    setCollectedIds(new Set());
    setFreelanceVisible(true);
    window.clearTimeout(popupTimerRef.current);
    setPopup(null);
  };

  const finishTutorial = () => {
    setTutorialOpen(false);
    setTutorialStep(0);
    setMessage('Drag the market. Stop, inspect, and look for camouflaged beginner roles.');
  };

  const replayTutorial = () => {
    dragRef.current = null;
    releaseCollisionCooldown();
    setIsDragging(false);
    setTutorialStep(0);
    setTutorialOpen(true);
    setPopup(null);
    setMessage('Tutorial paused the market. Start the job hunt when you are ready.');
  };

  const goToNextTutorialStep = () => {
    if (tutorialStep >= TUTORIAL_STEPS.length - 1) {
      finishTutorial();
      return;
    }
    setTutorialStep((step) => step + 1);
  };

  const goToPreviousTutorialStep = () => {
    setTutorialStep((step) => Math.max(0, step - 1));
  };

  const freezeForReview = (nextPenaltyCount) => {
    window.clearTimeout(reviewTimerRef.current);
    setReviewScroll(0);
    setStatus('frozen');
    setMessage('Your resume is being reviewed...');
    reviewTimerRef.current = window.setTimeout(() => {
      if (nextPenaltyCount >= HR_BURNOUT_LIMIT) {
        enterBurnout('The market is unavailable until reset. Too many HR gatekeepers reviewed you into burnout.');
        return;
      }
      setReviewScroll(REVIEW_SCROLL_MAX);
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
    if (isLocked || collectedIds.has(tile.id)) return;

    if (tile.type === 'fresh') {
      markCollected(tile.id);
      addProgress(0.2, `+0.20 years of experience. ${pickCopy(MICRO.gradTick)}`, 4);
      return;
    }

    if (tile.type === 'senior') {
      if (progress < FRESH_REQUIREMENT) {
        markCollected(tile.id);
        showPopup(pickCopy(MICRO.entryDenied));
        return;
      }
      markCollected(tile.id);
      addProgress(0.5, `+0.50 years of experience. ${pickCopy(MICRO.gradTick)}`, 2);
      return;
    }

    if (tile.type === 'freelance') {
      markCollected(tile.id);
      const reward = Number((0.3 + randomRef.current() * 0.2).toFixed(2));
      addProgress(reward, `+${reward.toFixed(2)} years of experience. ${pickCopy(MICRO.freelanceWin)}`, 1);
      return;
    }

    if (tile.type === 'hr') {
      hitGatekeeper();
      return;
    }

    markCollected(tile.id);
    addProgress(0.3, `+0.30 years of experience. ${pickCopy(MICRO.relocating)}`, 3);
    const teleport = getDistantTeleport();
    viewportRef.current = teleport;
    setViewport(teleport);
  };

  const panBy = (deltaX, deltaY, energyCost = 1.5) => {
    if (isLocked) return;
    setViewport((current) => clampViewport({ x: current.x + deltaX, y: current.y + deltaY }));
    drainFatigue(energyCost);
    if (drainReviewScrollBy(6)) {
      freezeForReview(penalties);
    }
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

    const scrolled = Math.abs(deltaX) + Math.abs(deltaY);
    drainFatigue(Math.min(2.8, scrolled * 0.04));

    // Every scroll spends the review buffer; scrolling past an HR Gatekeeper burns
    // it much faster. When the buffer empties, HR pulls you into a review.
    let reviewDrain = scrolled * 0.1;
    if (scrolled > HR_COLLISION_MOVE_THRESHOLD && !collisionCooldownRef.current) {
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
        startCollisionCooldown();
        reviewDrain += REVIEW_SCROLL_DRAIN_PER_HR_DRAG;
      }
    }
    if (drainReviewScrollBy(reviewDrain)) {
      freezeForReview(penalties);
    }
  };

  const handlePointerEnd = (event) => {
    event.stopPropagation();
    dragRef.current = null;
    releaseCollisionCooldown();
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

  // Freelance gigs blink on a steady cycle (visible 3s / hidden 3s, forever) until
  // claimed. A single shared interval drives every gig so the rhythm reads cleanly.
  useEffect(() => {
    const cycleTimer = window.setInterval(() => {
      setFreelanceVisible((visible) => !visible);
    }, FREELANCE_CYCLE_MS);
    return () => window.clearInterval(cycleTimer);
  }, []);

  useEffect(() => {
    if (fatigueRemaining > 0 || status !== 'active') return undefined;
    const burnoutTimer = window.setTimeout(() => enterBurnout(), 0);
    return () => window.clearTimeout(burnoutTimer);
  }, [enterBurnout, fatigueRemaining, status]);

  useEffect(() => {
    if (!tutorialOpen) return undefined;
    const focusTimer = window.setTimeout(() => {
      tutorialCardRef.current?.focus({ preventScroll: true });
    }, 0);
    return () => window.clearTimeout(focusTimer);
  }, [tutorialOpen, tutorialStep]);

  useEffect(() => {
    if (!tutorialOpen) return undefined;
    const stopTutorialEscape = (event) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation?.();
    };
    window.addEventListener('keydown', stopTutorialEscape, true);
    return () => window.removeEventListener('keydown', stopTutorialEscape, true);
  }, [tutorialOpen]);

  useEffect(() => () => {
    window.clearTimeout(reviewTimerRef.current);
    window.clearTimeout(collisionCooldownTimerRef.current);
    window.clearTimeout(popupTimerRef.current);
  }, []);

  return (
    <div className="album-game-fit infinite-scroll-fit">
      <header className="album-game-card album-game-panel-tight infinite-scroll-head">
        <div className="flex flex-col gap-2 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/45">
              The Infinite Scroll
            </p>
            <h4 className="mt-1 text-xl font-semibold tracking-normal text-white sm:text-2xl">
              Entry-level job market simulator.
            </h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {!tutorialOpen && status === 'active' && (
              <button type="button" onClick={replayTutorial} className="album-game-button min-h-10 px-4 py-2.5">
                Replay Tutorial
              </button>
            )}
            <button type="button" onClick={resetMarket} className="album-game-button min-h-10 px-4 py-2.5">
              Reset Market
            </button>
          </div>
        </div>
        <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <div className="mb-1 flex justify-between font-mono text-[10px] uppercase tracking-[0.16em] text-white/50">
              <span>Experience Progress</span>
              <span>{progress.toFixed(2)} / 3.00 years</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-black/40">
              <div className="h-full rounded-full bg-[var(--game-accent)] transition-[width] duration-300" style={{ width: `${clamp((progress / WIN_TARGET) * 100, 0, 100)}%` }} />
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
          <div>
            <div className="mb-1 flex justify-between gap-3 font-mono text-[10px] uppercase tracking-[0.16em] text-white/45">
              <span>Scroll before review</span>
              <span>{Math.round(reviewScrollRemaining)}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-black/40">
              <div
                className="h-full rounded-full bg-[#6bb7ff] transition-[width] duration-300"
                style={{ width: `${reviewScrollRemaining}%` }}
              />
            </div>
          </div>
          <div className="album-game-inset flex items-center px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-white/60">
            HR Gatekeepers: {penalties} / 3
          </div>
        </div>
      </header>

      <section className="album-game-card album-game-panel-tight infinite-scroll-map-panel">
        <div className="infinite-scroll-message flex flex-col gap-1.5 lg:flex-row lg:items-center lg:justify-between">
          <p className="text-sm text-white/65" aria-live="polite">{message}</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[10px] uppercase tracking-[0.18em] text-white/40">
            <span aria-hidden="true" className="tabular-nums text-white/30">{coordLabel}</span>
            <span>Drag, or use arrow keys / WASD to pan</span>
          </div>
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
          className={`job-market-surface infinite-scroll-surface relative overflow-hidden rounded-[6px] border border-white/10 outline-none ${isLocked ? 'job-market-surface--locked' : ''}`}
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
              if (collectedIds.has(tile.id)) return null;
              if (tile.type === 'freelance' && !freelanceVisible) return null;

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
                  title={tile.type === 'senior' ? 'Entry-Level Role: requires 1.00 years of experience.' : getTileLabel(tile)}
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={(event) => {
                    event.stopPropagation();
                    handleTileClick(tile);
                  }}
                  onFocus={() => {
                    if (tile.type === 'senior') {
                      setMessage('Entry-Level Role: requires 1.00 years of experience.');
                    }
                  }}
                  className={`market-tile market-tile--${tile.type} ${
                    tile.type === 'hr' && tile.patrol ? 'market-tile--patrol' : ''
                  }`}
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
          {popup && status !== 'frozen' && (
            <div className="infinite-scroll-popup" role="status" aria-live="assertive">
              {popup}
            </div>
          )}
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
          {tutorialOpen && (
            <div
              className="infinite-scroll-tutorial-overlay"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => event.stopPropagation()}
            >
              <article
                ref={tutorialCardRef}
                role="dialog"
                aria-labelledby="infinite-scroll-tutorial-title"
                aria-describedby="infinite-scroll-tutorial-copy"
                tabIndex={-1}
                className="infinite-scroll-tutorial-card"
                onKeyDown={(event) => {
                  if (event.key === 'Escape') {
                    event.preventDefault();
                    event.stopPropagation();
                    event.nativeEvent.stopImmediatePropagation?.();
                  }
                }}
              >
                <div className="infinite-scroll-tutorial-top">
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/45">
                    Step {tutorialStep + 1} of {TUTORIAL_STEPS.length}
                  </p>
                  <div className="infinite-scroll-tutorial-dots" aria-hidden="true">
                    {TUTORIAL_STEPS.map((step, index) => (
                      <span
                        // Titles are stable and unique in the fixed tutorial sequence.
                        key={step.title}
                        className={`infinite-scroll-tutorial-dot ${
                          index === tutorialStep ? 'infinite-scroll-tutorial-dot--active' : ''
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div className="infinite-scroll-tutorial-main">
                  <div className="infinite-scroll-tutorial-preview" aria-hidden="true">
                    {currentTutorialStep.iconType ? (
                      <span className={`market-tile market-tile--${currentTutorialStep.iconType} infinite-scroll-tutorial-icon`}>
                        <span className="market-tile__glyph" />
                      </span>
                    ) : (
                      <span className="infinite-scroll-tutorial-symbol">
                        {currentTutorialStep.marker}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h5 id="infinite-scroll-tutorial-title" className="text-lg font-semibold tracking-normal text-white">
                      {currentTutorialStep.title}
                    </h5>
                    <p id="infinite-scroll-tutorial-copy" className="mt-2 text-sm leading-relaxed text-white/68">
                      {currentTutorialStep.copy}
                    </p>
                  </div>
                </div>

                <div className="infinite-scroll-tutorial-actions">
                  <button
                    type="button"
                    onClick={goToPreviousTutorialStep}
                    disabled={tutorialStep === 0}
                    className="album-game-button min-h-11 px-4 py-2.5 disabled:cursor-not-allowed disabled:opacity-35"
                  >
                    Back
                  </button>
                  <button type="button" onClick={finishTutorial} className="album-game-button min-h-11 px-4 py-2.5">
                    Skip Tutorial
                  </button>
                  <button type="button" onClick={goToNextTutorialStep} className="album-game-button infinite-scroll-tutorial-primary min-h-11 px-4 py-2.5">
                    {tutorialStep === TUTORIAL_STEPS.length - 1 ? 'Start Job Hunt' : 'Next'}
                  </button>
                </div>
              </article>
            </div>
          )}
        </div>
        <div className="infinite-scroll-legend grid gap-1.5 text-[11px] text-white/45 sm:grid-cols-2 lg:grid-cols-5">
          <span>Fresh Grad Role: camouflaged envelope</span>
          <span>Entry-Level Role: gold briefcase (needs 1.00 yr)</span>
          <span>Freelance Gig: blinking blue monitor</span>
          <span>HR Gatekeeper: red profile penalty</span>
          <span>On-Site Role: green pin teleport</span>
        </div>
      </section>
    </div>
  );
}
