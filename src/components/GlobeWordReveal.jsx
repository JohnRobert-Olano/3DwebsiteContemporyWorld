// Monumental cinematic title that reads as if it sits BEHIND the Earth. The
// Cesium globe is one opaque canvas, so we can't truly place this behind it;
// instead the layer is masked with a radial hole over the centered globe disc
// (see .globe-word-reveal in index.css), so the globe shows through and only the
// title's outer edges peek around it. Purely decorative motion - `active` drives
// the reveal, `reducedMotion` collapses it to a static fade.
//
// When `outline` is true the same text is rendered as stroke-only (transparent
// fill), intended for placement in a higher-z layer above the globe canvas so
// the parts of the word that the Earth covers still peek through as an outline —
// the same technique used in the OLANO / Spider-Man reference.
export default function GlobeWordReveal({ text, active, reducedMotion, outline }) {
  const isHistorical = text === 'Historical Epochs';
  const isModern = text === 'Modern World';
  const isGlobalization = text === 'Globalization';
  const className = [
    'globe-word-reveal',
    active ? 'is-active' : '',
    reducedMotion ? 'is-reduced' : '',
    isHistorical ? 'globe-word-reveal--historical' : '',
    isModern ? 'globe-word-reveal--modern' : '',
    isGlobalization ? 'globe-word-reveal--globalization' : '',
    outline ? 'globe-word-reveal--outline' : '',
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
