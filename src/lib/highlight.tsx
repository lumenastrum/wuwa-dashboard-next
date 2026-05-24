import { Fragment, type CSSProperties, type ReactNode } from "react";

// Numbers + their attached unit: +12%, 24.3%, 32%, 8s, 1.1M, 2,000, 3x.
// Requires a leading digit, so bare "%" or words never match.
const STAT_RE = /[+\-]?\d[\d,]*(?:\.\d+)?(?:%|s|ms|M|m|k|K|x|×)?/g;

/**
 * Wraps numeric/stat tokens in a styled span so percentages and values pop out
 * of prose. Each theme passes its own accent style (color/weight/font).
 */
export function highlightStats(text: string, style: CSSProperties): ReactNode {
  if (!text) return text;
  const nodes: ReactNode[] = [];
  let last = 0;
  let key = 0;
  let m: RegExpExecArray | null;
  STAT_RE.lastIndex = 0;
  while ((m = STAT_RE.exec(text)) !== null) {
    if (m.index > last) nodes.push(<Fragment key={key++}>{text.slice(last, m.index)}</Fragment>);
    nodes.push(
      <span key={key++} style={style}>
        {m[0]}
      </span>,
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) nodes.push(<Fragment key={key++}>{text.slice(last)}</Fragment>);
  return nodes;
}
