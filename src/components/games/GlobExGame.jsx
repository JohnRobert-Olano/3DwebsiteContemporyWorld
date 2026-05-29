import { useMemo, useState } from 'react';
import { TRADE_ITEMS, TRADE_NATIONALITIES, TRADE_NATIONALITY_POINTS } from '../../lib/games/constants';
import { clamp, formatUSD } from '../../lib/games/helpers';
import FlatWorldMap from './FlatWorldMap';

const DEFAULT_QUANTITY = 1000;
const TRADE_DIRECTIONS = [
  { id: '0-1', label: 'Trader 1 Sells to Trader 2', sellerIndex: 0, buyerIndex: 1 },
  { id: '1-0', label: 'Trader 2 Sells to Trader 1', sellerIndex: 1, buyerIndex: 0 },
];

function createInitialTraders() {
  return [
    { gender: 'boy', nationality: 'Japan', profit: 0, assets: 0 },
    { gender: 'girl', nationality: 'Philippines', profit: 0, assets: 0 },
  ];
}

function sanitizeQuantity(value) {
  return Math.max(1, Math.floor(Number(value) || 1));
}

function formatUnits(value) {
  return `${Number(value).toLocaleString('en-US')} Units`;
}

function Avatar({ gender }) {
  return (
    <div className={`gex-avatar gex-avatar--${gender}`} aria-hidden="true">
      <span className="gex-avatar__hair" />
      <span className="gex-avatar__head" />
      <span className="gex-avatar__neck" />
      <span className="gex-avatar__body" />
      <span className="gex-avatar__mark gex-avatar__mark--left" />
      <span className="gex-avatar__mark gex-avatar__mark--right" />
    </div>
  );
}

function TraderMeter({ label, value, width, tone, isActive }) {
  return (
    <div className={`gex-meter gex-meter--${tone} ${isActive ? 'gex-meter--active' : ''}`}>
      <div className="gex-meter__label">
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <div className="gex-meter__track" aria-hidden="true">
        <span className="gex-meter__fill" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function TraderPanel({ index, trader, maxProfit, maxAssets, activeMetric, onChange }) {
  const traderNumber = index + 1;
  const profitWidth = clamp((trader.profit / maxProfit) * 100, 0, 100);
  const assetsWidth = clamp((trader.assets / maxAssets) * 100, 0, 100);
  const genderLabelId = `gex-trader-${traderNumber}-gender-label`;
  const nationalityId = `gex-trader-${traderNumber}-nationality`;

  return (
    <section className="gex-panel gex-trader-panel" aria-labelledby={`gex-trader-${traderNumber}`}>
      <div className="gex-panel__kicker">Trader {traderNumber}</div>
      <h5 id={`gex-trader-${traderNumber}`} className="gex-panel__title">
        {trader.nationality} Profile
      </h5>

      <div className="mt-4 grid gap-3">
        <TraderMeter
          label={`Trader ${traderNumber} Profit`}
          value={formatUSD(trader.profit)}
          width={profitWidth}
          tone="profit"
          isActive={activeMetric?.traderIndex === index && activeMetric?.metric === 'profit'}
        />
        <TraderMeter
          label={`Trader ${traderNumber} Assets`}
          value={formatUnits(trader.assets)}
          width={assetsWidth}
          tone="assets"
          isActive={activeMetric?.traderIndex === index && activeMetric?.metric === 'assets'}
        />
      </div>

      <div className="gex-profile-card mt-4">
        <Avatar gender={trader.gender} />

        <div className="grid gap-4">
          <div>
            <p id={genderLabelId} className="gex-label">
              Avatar Type
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2" role="group" aria-labelledby={genderLabelId}>
              {['boy', 'girl'].map((gender) => (
                <button
                  key={gender}
                  type="button"
                  aria-pressed={trader.gender === gender}
                  onClick={() => onChange({ ...trader, gender })}
                  className={`gex-gender-toggle gex-gender-toggle--${gender} ${
                    trader.gender === gender ? 'gex-gender-toggle--active' : ''
                  }`}
                >
                  {gender === 'boy' ? 'Boy' : 'Girl'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-2">
            <label htmlFor={nationalityId} className="gex-label">
              Nationality
            </label>
            <select
              id={nationalityId}
              value={trader.nationality}
              onChange={(event) => onChange({ ...trader, nationality: event.target.value })}
              className="gex-select"
            >
              {TRADE_NATIONALITIES.map((nationality) => (
                <option key={nationality} value={nationality}>
                  {nationality}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </section>
  );
}

function TradeRouteMap({ seller, buyer, sellerPoint, buyerPoint }) {
  return (
    <div className="gex-route-map" aria-label={`Flat trade route from ${seller.nationality} to ${buyer.nationality}`}>
      <FlatWorldMap theme="bright" className="absolute inset-0 h-full w-full" ariaLabel="Flat world map showing selected trade route">
        <line
          x1={`${sellerPoint.x}%`}
          y1={`${sellerPoint.y}%`}
          x2={`${buyerPoint.x}%`}
          y2={`${buyerPoint.y}%`}
          stroke="#1f6dff"
          strokeWidth="1.6"
          strokeDasharray="4 3"
          vectorEffect="non-scaling-stroke"
        />
        <circle
          cx={`${sellerPoint.x}%`}
          cy={`${sellerPoint.y}%`}
          r="4"
          fill="#16a34a"
          stroke="#1f2937"
          strokeWidth="0.8"
          vectorEffect="non-scaling-stroke"
        />
        <circle
          cx={`${buyerPoint.x}%`}
          cy={`${buyerPoint.y}%`}
          r="4"
          fill="#2563eb"
          stroke="#1f2937"
          strokeWidth="0.8"
          vectorEffect="non-scaling-stroke"
        />
      </FlatWorldMap>
      <div className="gex-route-map__label">
        <span>Selected Route</span>
        <strong>
          {seller.nationality} to {buyer.nationality}
        </strong>
      </div>
    </div>
  );
}

function TradeLog({ entries }) {
  return (
    <section className="gex-panel gex-trade-log" aria-labelledby="gex-trade-log-title" aria-live="polite">
      <div className="gex-panel__kicker">Trade Log</div>
      <h5 id="gex-trade-log-title" className="gex-panel__title">
        Receipts
      </h5>
      <div className="mt-4 grid gap-2">
        {entries.length ? (
          entries.map((entry, index) => (
            <p key={entry.id} className={`gex-receipt ${index === 0 ? 'gex-receipt--latest' : ''}`}>
              {entry.text}
            </p>
          ))
        ) : (
          <p className="gex-receipt gex-receipt--empty">Execute a trade to print the first receipt.</p>
        )}
      </div>
    </section>
  );
}

export default function GlobExGame() {
  const [traders, setTraders] = useState(() => createInitialTraders());
  const [direction, setDirection] = useState(TRADE_DIRECTIONS[0].id);
  const [itemId, setItemId] = useState(TRADE_ITEMS[0].id);
  const [quantity, setQuantity] = useState(String(DEFAULT_QUANTITY));
  const [tradeLog, setTradeLog] = useState([]);
  const [lastTrade, setLastTrade] = useState(null);

  const item = TRADE_ITEMS.find((tradeItem) => tradeItem.id === itemId) ?? TRADE_ITEMS[0];
  const selectedDirection = TRADE_DIRECTIONS.find((tradeDirection) => tradeDirection.id === direction) ?? TRADE_DIRECTIONS[0];
  const { sellerIndex, buyerIndex } = selectedDirection;
  const seller = traders[sellerIndex];
  const buyer = traders[buyerIndex];
  const sellerPoint = TRADE_NATIONALITY_POINTS[seller.nationality];
  const buyerPoint = TRADE_NATIONALITY_POINTS[buyer.nationality];
  const safePreviewQuantity = sanitizeQuantity(quantity);
  const totalValue = safePreviewQuantity * item.price;
  const maxProfit = useMemo(() => Math.max(50000, ...traders.map((trader) => trader.profit)), [traders]);
  const maxAssets = useMemo(() => Math.max(5000, ...traders.map((trader) => trader.assets)), [traders]);
  const activeProfit = lastTrade ? { traderIndex: lastTrade.sellerIndex, metric: 'profit' } : null;
  const activeAssets = lastTrade ? { traderIndex: lastTrade.buyerIndex, metric: 'assets' } : null;

  const updateTrader = (index, nextTrader) => {
    setTraders((current) => current.map((trader, traderIndex) => (traderIndex === index ? nextTrader : trader)));
  };

  const executeTrade = () => {
    const safeQuantity = sanitizeQuantity(quantity);
    const value = safeQuantity * item.price;
    const receipt = `${seller.nationality} successfully traded ${safeQuantity.toLocaleString('en-US')} ${item.label} to ${
      buyer.nationality
    }. Value: ${formatUSD(value)}.`;
    const tradeId = `${Date.now()}-${sellerIndex}-${buyerIndex}-${item.id}-${safeQuantity}`;

    setQuantity(String(safeQuantity));
    setTraders((current) =>
      current.map((trader, index) => {
        if (index === sellerIndex) return { ...trader, profit: trader.profit + value };
        if (index === buyerIndex) return { ...trader, assets: trader.assets + safeQuantity };
        return trader;
      }),
    );
    setLastTrade({ id: tradeId, sellerIndex, buyerIndex });
    setTradeLog((current) => [{ id: tradeId, text: receipt }, ...current].slice(0, 5));
  };

  const resetExchange = () => {
    setTraders(createInitialTraders());
    setDirection(TRADE_DIRECTIONS[0].id);
    setItemId(TRADE_ITEMS[0].id);
    setQuantity(String(DEFAULT_QUANTITY));
    setTradeLog([]);
    setLastTrade(null);
  };

  return (
    <div className="gex-board">
      <header className="gex-header">
        <div>
          <p className="gex-header__pill">GLOBAL EXCHANGE</p>
          <h4>Peer-to-peer global trade desk.</h4>
        </div>
        <button type="button" onClick={resetExchange} className="gex-secondary-button">
          Reset Exchange
        </button>
      </header>

      <div className="gex-layout">
        <TraderPanel
          index={0}
          trader={traders[0]}
          maxProfit={maxProfit}
          maxAssets={maxAssets}
          activeMetric={activeProfit?.traderIndex === 0 ? activeProfit : activeAssets?.traderIndex === 0 ? activeAssets : null}
          onChange={(nextTrader) => updateTrader(0, nextTrader)}
        />

        <section className="gex-panel gex-trade-desk" aria-labelledby="gex-trade-desk-title">
          <div className="gex-panel__kicker">New Trade</div>
          <h5 id="gex-trade-desk-title" className="gex-panel__title">
            Trade Desk
          </h5>

          <div className="mt-4 grid gap-4">
            <TradeRouteMap seller={seller} buyer={buyer} sellerPoint={sellerPoint} buyerPoint={buyerPoint} />

            <div className="grid gap-2">
              <label htmlFor="gex-trade-direction" className="gex-label">
                Trade Direction
              </label>
              <select
                id="gex-trade-direction"
                value={direction}
                onChange={(event) => setDirection(event.target.value)}
                className="gex-select"
              >
                {TRADE_DIRECTIONS.map((tradeDirection) => (
                  <option key={tradeDirection.id} value={tradeDirection.id}>
                    {tradeDirection.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <label htmlFor="gex-trade-item" className="gex-label">
                Trade Item
              </label>
              <select
                id="gex-trade-item"
                value={itemId}
                onChange={(event) => setItemId(event.target.value)}
                className="gex-select"
              >
                {TRADE_ITEMS.map((tradeItem) => (
                  <option key={tradeItem.id} value={tradeItem.id}>
                    {tradeItem.label}, ${tradeItem.price}/unit
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <label htmlFor="gex-trade-quantity" className="gex-label">
                Quantity to Trade
              </label>
              <input
                id="gex-trade-quantity"
                type="number"
                min="1"
                inputMode="numeric"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                className="gex-input"
              />
            </div>

            <div className="gex-value-preview">
              <span>Current Trade Value</span>
              <strong>{formatUSD(totalValue)}</strong>
              <small>
                {safePreviewQuantity.toLocaleString('en-US')} x ${item.price}/unit
              </small>
            </div>

            <button type="button" onClick={executeTrade} className="gex-execute-button">
              EXECUTE TRADE
            </button>
          </div>
        </section>

        <TraderPanel
          index={1}
          trader={traders[1]}
          maxProfit={maxProfit}
          maxAssets={maxAssets}
          activeMetric={activeProfit?.traderIndex === 1 ? activeProfit : activeAssets?.traderIndex === 1 ? activeAssets : null}
          onChange={(nextTrader) => updateTrader(1, nextTrader)}
        />

        <TradeLog entries={tradeLog} />
      </div>
    </div>
  );
}
