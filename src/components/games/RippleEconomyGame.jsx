import { useRef, useState } from 'react';
import {
  INITIAL_GLOBAL_STABILITY,
  INITIAL_RIPPLE_REGIONS,
  RIPPLE_CONNECTIONS,
  RIPPLE_EVENTS,
} from '../../lib/games/constants';
import { clamp, formatPercent } from '../../lib/games/helpers';
import FlatWorldMap from './FlatWorldMap';

const REGION_TAG_OFFSETS = {
  usa: { x: -4, y: -7 },
  eu: { x: 2, y: -9 },
  china: { x: 5, y: -11 },
  southAmerica: { x: -1, y: 11 },
  india: { x: -13, y: 16 },
  southeastAsia: { x: 10, y: 14 },
};

function cloneInitialRegions() {
  return Object.fromEntries(
    Object.entries(INITIAL_RIPPLE_REGIONS).map(([key, region]) => [key, { ...region }]),
  );
}

function getStabilityColor(value) {
  if (value >= 75) return '#22a865';
  if (value >= 50) return '#d8952f';
  return '#d85d51';
}

function formatSignedDelta(value) {
  if (value > 0) return `+${value}`;
  return String(value);
}

function formatMagnitude(value) {
  return String(Math.abs(value));
}

function StabilityBar({ value, variant = 'region' }) {
  const safeValue = clamp(value, 0, 100);

  return (
    <div className={`ripple-stability-meter ripple-stability-meter--${variant}`} aria-hidden="true">
      <div
        className="ripple-stability-meter__fill"
        style={{
          width: `${safeValue}%`,
          background: variant === 'global' ? undefined : getStabilityColor(safeValue),
        }}
      />
    </div>
  );
}

function RegionTag({ region, regionKey }) {
  const offset = REGION_TAG_OFFSETS[regionKey] ?? { x: 0, y: 0 };

  return (
    <div
      className="ripple-region-tag"
      style={{
        left: `${clamp(region.x + offset.x, 12, 88)}%`,
        top: `${clamp(region.y + offset.y, 13, 87)}%`,
      }}
    >
      <span className="sr-only">{`${region.label} stability ${formatPercent(region.stability)}`}</span>
      <div className="flex items-center justify-between gap-2" aria-hidden="true">
        <span className="truncate font-mono text-[9px] uppercase tracking-[0.14em] text-[#164267]">
          {region.label}
        </span>
        <span className="font-mono text-[11px] font-semibold text-[#0f2e4c]">{formatPercent(region.stability)}</span>
      </div>
      <div className="mt-1" aria-hidden="true">
        <StabilityBar value={region.stability} />
      </div>
    </div>
  );
}

function RegionListCard({ region }) {
  return (
    <div className="ripple-clay-inset min-w-0 p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#164267]">
          {region.label}
        </span>
        <span className="font-mono text-xs font-semibold text-[#0f2e4c]">{formatPercent(region.stability)}</span>
      </div>
      <div className="mt-2">
        <StabilityBar value={region.stability} />
      </div>
    </div>
  );
}

export default function RippleEconomyGame() {
  const rippleCounterRef = useRef(0);
  const [regions, setRegions] = useState(() => cloneInitialRegions());
  const [globalStability, setGlobalStability] = useState(INITIAL_GLOBAL_STABILITY);
  const [lastResult, setLastResult] = useState(null);
  const [ripple, setRipple] = useState(null);

  const resetEconomy = () => {
    setRegions(cloneInitialRegions());
    setGlobalStability(INITIAL_GLOBAL_STABILITY);
    setLastResult(null);
    setRipple(null);
  };

  const triggerEvent = (event) => {
    const previousGlobal = globalStability;
    const nextGlobal = clamp(previousGlobal + event.globalDelta, 0, 100);
    const nextRegions = Object.fromEntries(
      Object.entries(regions).map(([key, region]) => {
        const delta = event.deltas[key] ?? 0;
        return [key, { ...region, stability: clamp(region.stability + delta, 0, 100) }];
      }),
    );
    const changes = Object.entries(regions).map(([key, region]) => ({
      key,
      label: region.label,
      delta: nextRegions[key].stability - region.stability,
      targetDelta: event.deltas[key] ?? 0,
      previous: region.stability,
      next: nextRegions[key].stability,
    }));

    rippleCounterRef.current += 1;
    setRegions(nextRegions);
    setGlobalStability(nextGlobal);
    setLastResult({
      id: `${event.id}-${rippleCounterRef.current}`,
      label: event.label,
      effect: event.effect,
      originLabel: event.originLabel,
      changes,
      previousGlobal,
      nextGlobal,
      netGlobalChange: nextGlobal - previousGlobal,
    });
    setRipple({
      ...event.origin,
      id: `${event.id}-${rippleCounterRef.current}`,
      tone: event.tone,
    });
  };

  const globalDirection = lastResult?.netGlobalChange >= 0 ? 'increased' : 'decreased';

  return (
    <div className="ripple-economy-dashboard ripple-fit">
      <header className="ripple-clay-panel ripple-fit-header">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <h4 className="ripple-economy-title">RIPPLE ECONOMY</h4>
            <p className="mt-1 text-xl font-semibold tracking-normal text-[#0f2e4c] sm:text-2xl">
              Observe Global Economic Ripples.
            </p>
          </div>
          <button type="button" onClick={resetEconomy} className="ripple-event-button ripple-event-button--neutral">
            Reset Economy
          </button>
        </div>

        <div className="mt-3">
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-[#2f658e]">
              Global Economic Stability
            </span>
            <span className="font-mono text-base font-semibold text-[#0f2e4c]">{formatPercent(globalStability)}</span>
          </div>
          <div
            role="meter"
            aria-label={`Global Economic Stability ${formatPercent(globalStability)}`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={globalStability}
          >
            <StabilityBar value={globalStability} variant="global" />
          </div>
        </div>
      </header>

      <div className="ripple-fit-main">
        <section className="ripple-clay-panel ripple-fit-controls">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-[#2f658e]">
            Event Controls
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-2">
            {RIPPLE_EVENTS.map((event) => (
              <button
                key={event.id}
                type="button"
                onClick={() => triggerEvent(event)}
                className={`ripple-event-button ripple-event-button--${event.tone}`}
              >
                {event.label}
              </button>
            ))}
          </div>
        </section>

        <section
          className="ripple-clay-panel ripple-fit-map-panel overflow-hidden"
          aria-label="Economic regions map"
        >
          <div className="ripple-map ripple-fit-map relative overflow-hidden rounded-[18px]">
            <FlatWorldMap className="absolute inset-0 h-full w-full" theme="bright" ariaLabel="Flat world map with six regional economic hubs">
              {RIPPLE_CONNECTIONS.map(([fromKey, toKey]) => {
                const from = regions[fromKey];
                const to = regions[toKey];
                return (
                  <line
                    key={`${fromKey}-${toKey}`}
                    x1={`${from.x}%`}
                    y1={`${from.y}%`}
                    x2={`${to.x}%`}
                    y2={`${to.y}%`}
                    stroke="rgba(20, 78, 120, 0.42)"
                    strokeWidth="1.4"
                    strokeDasharray="4 4"
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                  />
                );
              })}
              {Object.entries(regions).map(([key, region]) => (
                <circle
                  key={`hub-${key}`}
                  cx={`${region.x}%`}
                  cy={`${region.y}%`}
                  r="3.2"
                  fill="#ffffff"
                  stroke="#165d8f"
                  strokeWidth="0.9"
                  vectorEffect="non-scaling-stroke"
                />
              ))}
            </FlatWorldMap>

            {ripple && (
              <div
                key={ripple.id}
                className={`ripple-economy-ripple ripple-economy-ripple--${ripple.tone}`}
                style={{ left: `${ripple.x}%`, top: `${ripple.y}%` }}
                aria-hidden="true"
              >
                <span />
                <span />
                <span />
              </div>
            )}

            {Object.entries(regions).map(([key, region]) => (
              <RegionTag key={key} regionKey={key} region={region} />
            ))}
          </div>
        </section>

        <section className="ripple-clay-panel ripple-fit-results" aria-live="polite">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-[#2f658e]">
            Event Results
          </p>
          {lastResult ? (
            <div key={lastResult.id} className="ripple-result-card ripple-fit-result-card mt-3">
              <p className="font-mono text-sm font-semibold uppercase tracking-[0.14em] text-[#0f2e4c]">
                EVENT: {lastResult.label}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-[#315a78]">
                Origin: {lastResult.originLabel}
              </p>
              <ul className="mt-3 grid gap-1.5 text-sm text-[#244c68]">
                {lastResult.changes.map((change) => (
                  <li key={change.key} className="flex items-start justify-between gap-3 border-t border-[#96c2df]/50 pt-2">
                    <span>{change.label} stability changed by {formatSignedDelta(change.delta)}</span>
                    <span className="font-mono font-semibold text-[#0f2e4c]">
                      {formatPercent(change.previous)} to {formatPercent(change.next)}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 grid gap-1.5 rounded-[14px] bg-[#d9effb] p-2.5 font-mono text-[11px] uppercase tracking-[0.12em] text-[#315a78] shadow-[inset_0_2px_6px_rgba(70,130,170,0.22)]">
                <div className="flex justify-between gap-3">
                  <span>Previous Global</span>
                  <span className="font-semibold text-[#0f2e4c]">{formatPercent(lastResult.previousGlobal)}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span>New Global</span>
                  <span className="font-semibold text-[#0f2e4c]">{formatPercent(lastResult.nextGlobal)}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span>Net Global Change</span>
                  <span className="font-semibold text-[#0f2e4c]">{formatSignedDelta(lastResult.netGlobalChange)}</span>
                </div>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-[#244c68]">
                Global Stability {globalDirection} by {formatMagnitude(lastResult.netGlobalChange)}.
              </p>
              <p className="mt-2 text-sm leading-relaxed text-[#244c68]">
                <span className="font-semibold text-[#0f2e4c]">Effect:</span> {lastResult.effect}
              </p>
            </div>
          ) : (
            <div className="ripple-clay-inset mt-3 p-3">
              <p className="text-base leading-relaxed text-[#315a78]">
                Trigger an event to send a policy or shock ripple across the map.
              </p>
            </div>
          )}
        </section>

        <section className="ripple-fit-region-list" aria-label="Region stability list">
          {Object.entries(regions).map(([key, region]) => (
            <RegionListCard key={key} region={region} />
          ))}
        </section>
      </div>
    </div>
  );
}
