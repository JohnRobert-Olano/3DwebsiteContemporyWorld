// Monumental cinematic title that reads as if it sits BEHIND the Earth. The
// Cesium globe is one opaque canvas, so we can't truly place this behind it;
// instead the layer is masked with a radial hole over the centered globe disc
// (see .globe-word-reveal in index.css), so the globe shows through and only the
// title's outer edges peek around it. Purely decorative motion - `active` drives
// the reveal, `reducedMotion` collapses it to a static fade.
export default function GlobeWordReveal({ text, active, reducedMotion }) {
  const isHistorical = text === 'Historical Epochs';
  const className = [
    'globe-word-reveal',
    active ? 'is-active' : '',
    reducedMotion ? 'is-reduced' : '',
    isHistorical ? 'globe-word-reveal--historical' : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      className={className}
      role="img"
      aria-label={text}
    >
      <span className="globe-word-reveal__text" data-text={text} aria-hidden="true">
        {text}
      </span>
    </div>
  );
}
