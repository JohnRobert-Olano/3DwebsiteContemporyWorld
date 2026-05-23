import { Fragment, useMemo } from 'react';

// Splits a string into [{ type: 'word' | 'space', value }] tokens. Whitespace
// runs are kept as separate tokens so we can render them as plain text (no
// span wrapper), preserving normal text layout while only the word tokens
// receive an animated inline-block span.
function tokenize(text) {
  if (!text) return [];
  const parts = String(text).split(/(\s+)/);
  return parts
    .filter((part) => part.length > 0)
    .map((part) => ({
      type: /^\s+$/.test(part) ? 'space' : 'word',
      value: part,
    }));
}

// Renders `text` as a sequence of word spans separated by ordinary
// whitespace. Each word span has `className` (default 'split-word') so a
// parent GSAP timeline can stagger them with a single selector.
//
// Accessibility: the visible text is wrapped in `aria-hidden="true"` and the
// outer tag receives `aria-label` (defaults to the original text) so screen
// readers read the original sentence naturally without per-word pauses.
export default function SplitWords({
  text,
  as: Tag = 'span',
  className,
  wordClassName = 'split-word',
  wordProps,
  ariaLabel,
  style,
}) {
  const tokens = useMemo(() => tokenize(text), [text]);
  return (
    <Tag className={className} style={style} aria-label={ariaLabel ?? text}>
      <span aria-hidden="true">
        {tokens.map((token, i) => (
          token.type === 'space' ? (
            <Fragment key={i}>{token.value}</Fragment>
          ) : (
            <span
              key={i}
              className={wordClassName}
              {...(typeof wordProps === 'function' ? wordProps(token, i) : wordProps)}
              style={{ display: 'inline-block', willChange: 'transform, opacity' }}
            >
              {token.value}
            </span>
          )
        ))}
      </span>
    </Tag>
  );
}
