/**
 * Urne SVG icons for use in ImageResponse (next/og).
 *
 * Two viewBox variants exist:
 * - "small" (22×24): used by apple-icon and favicon
 * - "large" (32×32): used by opengraph-image and vote-proof
 *
 * These return plain JSX elements compatible with ImageResponse limitations
 * (no client components, limited CSS subset).
 */

interface UrneSvgProps {
  height: number;
  width: number;
}

/** viewBox 0 0 22 24 — compact urne used for app icons */
export function UrneIconSvg({ width, height }: UrneSvgProps) {
  return (
    <svg
      aria-label="Urne de vote"
      fill="none"
      height={height}
      role="img"
      viewBox="0 0 22 24"
      width={width}
    >
      {/* Bulletin (tilted rectangle coming from top) */}
      <rect
        fill="#ffffff"
        height="10"
        opacity="0.85"
        rx="0"
        transform="rotate(8, 11, 5)"
        width="6"
        x="8"
        y="0"
      />
      {/* Urne body */}
      <rect fill="#ffffff" height="14" rx="0" width="18" x="2" y="8" />
      {/* Fente */}
      <rect fill="#000091" height="2" rx="0" width="8" x="7" y="8" />
      {/* Shadow line */}
      <rect
        fill="#ffffff"
        height="2"
        opacity="0.5"
        rx="0"
        width="18"
        x="2"
        y="22"
      />
    </svg>
  );
}

/** viewBox 0 0 32 32 — larger urne used for OG images and vote proofs */
export function UrneOgSvg({ width, height }: UrneSvgProps) {
  return (
    <svg
      aria-label="Urne de vote"
      fill="none"
      height={height}
      role="img"
      viewBox="0 0 32 32"
      width={width}
    >
      <rect
        fill="#ffffff"
        height="12"
        opacity="0.85"
        transform="rotate(8, 16, 8)"
        width="8"
        x="12"
        y="2"
      />
      <rect fill="#ffffff" height="16" width="22" x="5" y="11" />
      <rect fill="#000091" height="3" width="10" x="11" y="11" />
      <rect fill="#ffffff" height="2" opacity="0.5" width="22" x="5" y="27" />
    </svg>
  );
}
