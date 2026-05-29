import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { DELIVERY_COUNTRIES, DELIVERY_EVENTS } from '../../lib/games/constants';
import { chooseByRandom, createSeededRandom, hashStringToSeed } from '../../lib/games/helpers';
import FlatWorldMap from './FlatWorldMap';

// Three.js plane is code-split so three/r3f only load when this game is opened.
const DeliveryPlane = lazy(() => import('./DeliveryPlane'));

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
    if (sameCountry || phase === 'shipping') return;
    window.clearTimeout(timerRef.current);
    const event = chooseByRandom(DELIVERY_EVENTS, randomRef.current());
    setResult(null);
    setPhase('shipping');
    setRouteKey((current) => current + 1);

    if (reducedMotion) {
      finishShipment(event);
      return;
    }

    timerRef.current = window.setTimeout(() => finishShipment(event), 1800);
  };

  return (
    <div className="gds-clay min-h-full space-y-4">
      <header className="gds-clay-card p-5">
        <p className="gds-eyebrow">GLOBAL DELIVERY SIMULATOR</p>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <h4 className="max-w-xl text-2xl font-semibold leading-tight tracking-tight text-[#0f2e4c]">
            Ship products between countries and overcome global disruptions.
          </h4>
          <div className="flex flex-wrap items-stretch gap-3">
            <div className="gds-clay-inset flex items-center gap-2 px-4 py-3 font-mono text-sm font-semibold">
              <span className="gds-counter-dot" aria-hidden="true" />
              Successful Shipments: {successfulShipments}
            </div>
            <button
              type="button"
              onClick={resetSimulator}
              aria-label="Reset delivery simulator"
              className="gds-clay-btn gds-clay-btn--soft px-5 py-3"
            >
              Reset
            </button>
          </div>
        </div>
      </header>

      <section className="gds-clay-card p-5">
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
          <label className="grid gap-2">
            <span className="gds-field-label">From Country</span>
            <select
              value={fromId}
              onChange={(event) => setFromId(event.target.value)}
              className="gds-clay-select"
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
              className="gds-clay-select"
            >
              {DELIVERY_COUNTRIES.map((country) => (
                <option key={country.id} value={country.id}>{country.name}</option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={startShipment}
            disabled={sameCountry || phase === 'shipping'}
            className="gds-clay-btn gds-clay-btn--primary min-h-[48px] px-7"
          >
            {phase === 'shipping' ? 'Shipping...' : 'Start Shipping'}
          </button>
        </div>
        {sameCountry && (
          <p className="mt-3 text-xs font-semibold text-[#c2410c]">
            Choose two different countries to begin a shipment.
          </p>
        )}
      </section>

      <section className="gds-clay-card overflow-hidden p-4">
        <div className="gds-clay-map delivery-map relative aspect-[2/1] overflow-hidden rounded-[16px]">
          <FlatWorldMap theme="bright" className="absolute inset-0 h-full w-full" ariaLabel="World map showing the shipping route">
            <line
              x1={`${from.x}%`}
              y1={`${from.y}%`}
              x2={`${to.x}%`}
              y2={`${to.y}%`}
              stroke="rgba(18,52,88,0.55)"
              strokeWidth="1.2"
              strokeDasharray="3 3"
              vectorEffect="non-scaling-stroke"
            />
            {DELIVERY_COUNTRIES.map((country) => {
              const selected = country.id === fromId || country.id === toId;
              return (
                <circle
                  key={country.id}
                  cx={`${country.x}%`}
                  cy={`${country.y}%`}
                  r={selected ? 3 : 1.8}
                  fill={selected ? '#ef5b43' : '#ffffff'}
                  stroke="rgba(18,52,88,0.5)"
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
          <Suspense fallback={null}>
            <DeliveryPlane
              from={from}
              to={to}
              phase={phase}
              routeKey={routeKey}
              reducedMotion={reducedMotion}
            />
          </Suspense>
        </div>
      </section>

      <section className="gds-clay-card p-5" aria-live="polite">
        <p className="gds-eyebrow">Shipment result</p>
        <div className="gds-clay-inset mt-3 flex items-start gap-3 p-4">
          {result ? (
            <>
              <span
                className={`gds-result-dot ${result.successful ? 'is-success' : 'is-fail'}`}
                aria-hidden="true"
              />
              <div>
                <p className="font-mono text-sm font-bold uppercase tracking-[0.16em] text-[#0f2e4c]">
                  {result.result}
                </p>
                <p className="mt-1 text-sm text-[#3f6b8e]">{result.message}</p>
              </div>
            </>
          ) : (
            <p className="text-sm text-[#3f6b8e]">
              Select a route and start shipping to generate a global event.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
