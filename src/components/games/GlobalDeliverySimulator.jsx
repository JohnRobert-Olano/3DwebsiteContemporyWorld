import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { DELIVERY_COUNTRIES, DELIVERY_EVENTS } from '../../lib/games/constants';
import { chooseByRandom, createSeededRandom, hashStringToSeed } from '../../lib/games/helpers';
import { routeControlPoint } from '../../lib/games/route';
import FlatWorldMap from './FlatWorldMap';

// three.js plane is heavy - lazy so it only ships when this cover is opened.
const DeliveryPlane = lazy(() => import('./DeliveryPlane'));
const DELIVERY_TRAVEL_MS = 1800;

function getCountry(id) {
  return DELIVERY_COUNTRIES.find((country) => country.id === id) ?? DELIVERY_COUNTRIES[0];
}

export default function GlobalDeliverySimulator({ reducedMotion }) {
  const randomRef = useRef(createSeededRandom(hashStringToSeed('global-delivery-simulator')));
  const timerRef = useRef(null);
  const [fromId, setFromId] = useState('usa');
  const [toId, setToId] = useState('philippines');
  const [successfulShipments, setSuccessfulShipments] = useState(0);
  const [phase, setPhase] = useState('idle');
  const [result, setResult] = useState(null);
  const [routeKey, setRouteKey] = useState(0);

  const from = useMemo(() => getCountry(fromId), [fromId]);
  const to = useMemo(() => getCountry(toId), [toId]);
  const sameCountry = fromId === toId;
  const isShipping = phase === 'shipping';
  const showRoute = isShipping || phase === 'result';

  // Quadratic flight arc in the map's viewBox units (0..360 x, 0..180 y). Shared
  // control point so the plane (DeliveryPlane) traces the identical curve.
  const routePath = useMemo(() => {
    const cp = routeControlPoint(from, to);
    const fmt = (x, y) => `${(x * 3.6).toFixed(2)} ${(y * 1.8).toFixed(2)}`;
    return `M ${fmt(from.x, from.y)} Q ${fmt(cp.x, cp.y)} ${fmt(to.x, to.y)}`;
  }, [from, to]);

  const routeLabel = showRoute
    ? `Shipping route from ${from.name} to ${to.name}`
    : `World map. Route set from ${from.name} to ${to.name}.`;

  useEffect(() => {
    return () => window.clearTimeout(timerRef.current);
  }, []);

  const finishShipment = (event) => {
    setResult(event);
    setPhase('result');
    if (event.successful) {
      setSuccessfulShipments((current) => current + 1);
    }
  };

  const resetSimulator = () => {
    window.clearTimeout(timerRef.current);
    setFromId('usa');
    setToId('philippines');
    setSuccessfulShipments(0);
    setPhase('idle');
    setResult(null);
    setRouteKey(0);
  };

  const startShipment = () => {
    if (sameCountry || isShipping) return;
    window.clearTimeout(timerRef.current);
    const event = chooseByRandom(DELIVERY_EVENTS, randomRef.current());
    setResult(null);
    setPhase('shipping');
    setRouteKey((current) => current + 1);

    if (reducedMotion) {
      finishShipment(event);
      return;
    }

    timerRef.current = window.setTimeout(() => finishShipment(event), DELIVERY_TRAVEL_MS);
  };

  return (
    <div className="gds-ops gds-fit">
      <header className="gds-ops-card gds-fit-header">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="gds-eyebrow">GLOBAL DELIVERY SIMULATOR</p>
            <h4 className="mt-2 max-w-xl text-lg font-semibold leading-tight tracking-tight text-[#dbe8ff] sm:text-xl">
              Ship products between countries and overcome global disruptions.
            </h4>
          </div>
          <div className="flex flex-wrap items-stretch gap-3">
            <div className="gds-ops-metric">
              <span className="gds-ops-metric__label">Successful Shipments</span>
              <span className="gds-ops-metric__value">
                <span className="gds-counter-dot" aria-hidden="true" />
                {successfulShipments}
              </span>
            </div>
            <button
              type="button"
              onClick={resetSimulator}
              aria-label="Reset delivery simulator"
              className="gds-ops-btn gds-ops-btn--soft px-5"
            >
              Reset
            </button>
          </div>
        </div>
      </header>

      <section className="gds-ops-card gds-fit-controls">
        <div className="grid gap-3 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
          <label className="grid gap-2">
            <span className="gds-field-label">From Country</span>
            <select
              value={fromId}
              onChange={(event) => setFromId(event.target.value)}
              disabled={isShipping}
              className="gds-ops-select"
            >
              {DELIVERY_COUNTRIES.map((country) => (
                <option key={country.id} value={country.id}>{country.name}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-2">
            <span className="gds-field-label">To Country</span>
            <select
              value={toId}
              onChange={(event) => setToId(event.target.value)}
              disabled={isShipping}
              className="gds-ops-select"
            >
              {DELIVERY_COUNTRIES.map((country) => (
                <option key={country.id} value={country.id}>{country.name}</option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={startShipment}
            disabled={sameCountry || isShipping}
            className="gds-ops-btn gds-ops-btn--primary min-h-[48px] px-7"
          >
            {isShipping ? 'SHIPPING...' : 'START SHIPPING'}
          </button>
        </div>
        {sameCountry && (
          <p className="mt-3 text-xs font-semibold text-[#ffb020]">
            Choose two different countries to begin a shipment.
          </p>
        )}
      </section>

      <section className="gds-ops-card gds-fit-map-card overflow-hidden">
        <div className="gds-ops-map gds-fit-map relative overflow-hidden rounded-[16px]">
          <FlatWorldMap theme="ops" className="absolute inset-0 h-full w-full" ariaLabel={routeLabel}>
            {showRoute && (
              <g key={`route-${routeKey}`}>
                <path className="gds-route-path gds-route-path--glow" d={routePath} fill="none" vectorEffect="non-scaling-stroke" />
                <path className="gds-route-path" d={routePath} fill="none" vectorEffect="non-scaling-stroke" />
              </g>
            )}
            {DELIVERY_COUNTRIES.map((country) => {
              const selected = country.id === fromId || country.id === toId;
              return (
                <circle
                  key={country.id}
                  cx={`${country.x}%`}
                  cy={`${country.y}%`}
                  r={selected ? 3 : 1.7}
                  fill={selected ? '#ffb020' : '#bfe6ff'}
                  stroke="rgba(6,18,31,0.7)"
                  strokeWidth="0.6"
                  vectorEffect="non-scaling-stroke"
                />
              );
            })}
          </FlatWorldMap>
          <span className="delivery-label" style={{ left: `${from.x}%`, top: `${from.y}%` }}>
            {from.name}
          </span>
          <span className="delivery-label" style={{ left: `${to.x}%`, top: `${to.y}%` }}>
            {to.name}
          </span>
          {showRoute && (
            <Suspense
              fallback={
                <span
                  className="gds-plane-fallback"
                  style={{ left: `${from.x}%`, top: `${from.y}%` }}
                  aria-hidden="true"
                />
              }
            >
              <DeliveryPlane
                from={from}
                to={to}
                phase={phase}
                routeKey={routeKey}
                reducedMotion={reducedMotion}
                travelMs={DELIVERY_TRAVEL_MS}
              />
            </Suspense>
          )}
        </div>
      </section>

      <section className="gds-ops-card gds-fit-result" aria-live="polite">
        <p className="gds-eyebrow">Shipment result</p>
        <div
          key={result ? `${routeKey}-${result.result}-${result.message}` : 'shipment-empty'}
          className="gds-ops-inset gds-result-card-content mt-2 flex items-start gap-3 p-3"
        >
          {result ? (
            <>
              <span
                className={`gds-result-dot ${result.successful ? 'is-success' : 'is-fail'}`}
                aria-hidden="true"
              />
              <div>
                <p className="font-mono text-sm font-bold uppercase tracking-[0.16em] text-[#e6f3ff]">
                  {result.result}
                </p>
                <p className="mt-1 text-sm text-[#94b8d6]">{result.message}</p>
              </div>
            </>
          ) : (
            <p className="text-sm text-[#94b8d6]">
              Select a route and start shipping to generate a global event.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}