export function clamp(value, min, max) {
  return Math.min(Math.max(Number(value) || 0, min), max);
}

export function createSeededRandom(seed) {
  let state = Math.abs(Math.floor(seed)) % 2147483647;
  if (state === 0) state = 1;

  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

export function hashStringToSeed(value) {
  return String(value).split('').reduce((hash, char) => {
    return ((hash << 5) - hash + char.charCodeAt(0)) >>> 0;
  }, 2166136261);
}

export function formatPHP(value) {
  return `PHP ${Number(value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatUSD(value) {
  return `$${Number(value).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

export function formatPercent(value) {
  return `${Math.round(clamp(value, 0, 100))}%`;
}

export function chooseByRandom(items, randomValue) {
  if (!items.length) return undefined;
  const index = Math.min(items.length - 1, Math.floor(randomValue * items.length));
  return items[index];
}
