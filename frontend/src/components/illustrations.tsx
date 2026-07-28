/**
 * Brand illustrations for StellarKraal empty states.
 *
 * Each SVG:
 * - Uses CSS custom properties (design tokens) so colours flip in dark mode.
 * - Has role="img" and aria-label for screen-reader accessibility.
 * - Contains a livestock motif consistent with the StellarKraal brand.
 * - Is optimised: no unnecessary attributes or vendor-specific markup.
 *
 * Closes #780
 */

/** Empty loans list illustration — document with a coin motif */
export function EmptyLoansIllustration() {
  return (
    <svg
      width="80"
      height="80"
      viewBox="0 0 80 80"
      fill="none"
      role="img"
      aria-label="No loans yet"
    >
      {/* Document body */}
      <rect
        x="12"
        y="8"
        width="44"
        height="54"
        rx="5"
        fill="var(--token-surface)"
        stroke="var(--token-primary)"
        strokeWidth="2"
      />
      {/* Document lines */}
      <line
        x1="21"
        y1="24"
        x2="47"
        y2="24"
        stroke="var(--token-primary)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="21"
        y1="32"
        x2="47"
        y2="32"
        stroke="var(--token-primary)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="21"
        y1="40"
        x2="38"
        y2="40"
        stroke="var(--token-primary)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Coin / currency badge */}
      <circle
        cx="58"
        cy="56"
        r="14"
        fill="var(--token-accent)"
        opacity="0.15"
      />
      <circle
        cx="58"
        cy="56"
        r="14"
        stroke="var(--token-accent)"
        strokeWidth="2"
        fill="none"
      />
      <text
        x="58"
        y="61"
        textAnchor="middle"
        fontSize="14"
        fontWeight="700"
        fill="var(--token-secondary)"
        aria-hidden="true"
      >
        ₊
      </text>
      {/* Cow ear silhouette — brand nod */}
      <path
        d="M14 12 Q10 8 14 5 Q18 8 14 12Z"
        fill="var(--token-primary)"
        opacity="0.4"
      />
    </svg>
  );
}

/** Empty collateral list illustration — prominent cow silhouette */
export function EmptyCollateralIllustration() {
  return (
    <svg
      width="80"
      height="80"
      viewBox="0 0 80 80"
      fill="none"
      role="img"
      aria-label="No collateral registered"
    >
      {/* Body */}
      <ellipse
        cx="40"
        cy="50"
        rx="22"
        ry="13"
        fill="var(--token-surface)"
        stroke="var(--token-primary)"
        strokeWidth="2"
      />
      {/* Head */}
      <ellipse
        cx="40"
        cy="28"
        rx="11"
        ry="9"
        fill="var(--token-surface)"
        stroke="var(--token-primary)"
        strokeWidth="2"
      />
      {/* Left ear */}
      <path
        d="M29 25 Q24 18 28 16 Q31 20 29 25Z"
        fill="var(--token-primary)"
        opacity="0.6"
      />
      {/* Right ear */}
      <path
        d="M51 25 Q56 18 52 16 Q49 20 51 25Z"
        fill="var(--token-primary)"
        opacity="0.6"
      />
      {/* Eyes */}
      <circle cx="36" cy="27" r="1.5" fill="var(--token-primary)" />
      <circle cx="44" cy="27" r="1.5" fill="var(--token-primary)" />
      {/* Nostrils */}
      <ellipse cx="37.5" cy="33" rx="1.5" ry="1" fill="var(--token-primary)" opacity="0.5" />
      <ellipse cx="42.5" cy="33" rx="1.5" ry="1" fill="var(--token-primary)" opacity="0.5" />
      {/* Legs */}
      <line
        x1="28"
        y1="62"
        x2="26"
        y2="73"
        stroke="var(--token-primary)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <line
        x1="35"
        y1="63"
        x2="34"
        y2="73"
        stroke="var(--token-primary)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <line
        x1="45"
        y1="63"
        x2="46"
        y2="73"
        stroke="var(--token-primary)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <line
        x1="52"
        y1="62"
        x2="54"
        y2="73"
        stroke="var(--token-primary)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Tail */}
      <path
        d="M62 48 Q68 44 65 52"
        stroke="var(--token-primary)"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      {/* Brand tag on ear — finance motif */}
      <circle cx="24" cy="17" r="3.5" fill="var(--token-accent)" opacity="0.8" />
      <text
        x="24"
        y="19.5"
        textAnchor="middle"
        fontSize="4"
        fontWeight="700"
        fill="var(--token-surface)"
        aria-hidden="true"
      >
        $
      </text>
    </svg>
  );
}

/** Empty transaction history illustration — ledger with arrows */
export function EmptyTransactionsIllustration() {
  return (
    <svg
      width="80"
      height="80"
      viewBox="0 0 80 80"
      fill="none"
      role="img"
      aria-label="No transactions yet"
    >
      {/* Ledger / receipt */}
      <rect
        x="16"
        y="12"
        width="48"
        height="56"
        rx="6"
        fill="var(--token-surface)"
        stroke="var(--token-primary)"
        strokeWidth="2"
      />
      {/* Header bar */}
      <rect
        x="16"
        y="12"
        width="48"
        height="12"
        rx="6"
        fill="var(--token-primary)"
        opacity="0.15"
      />
      {/* Row 1 — credit (arrow right) */}
      <line
        x1="26"
        y1="36"
        x2="42"
        y2="36"
        stroke="var(--token-success)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M39 33 L43 36 L39 39"
        stroke="var(--token-success)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <line
        x1="47"
        y1="34"
        x2="56"
        y2="34"
        stroke="var(--token-primary)"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.4"
      />
      <line
        x1="47"
        y1="38"
        x2="54"
        y2="38"
        stroke="var(--token-primary)"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.4"
      />
      {/* Row 2 — debit (arrow left) */}
      <line
        x1="26"
        y1="50"
        x2="42"
        y2="50"
        stroke="var(--token-danger)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M29 47 L25 50 L29 53"
        stroke="var(--token-danger)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <line
        x1="47"
        y1="48"
        x2="56"
        y2="48"
        stroke="var(--token-primary)"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.4"
      />
      <line
        x1="47"
        y1="52"
        x2="52"
        y2="52"
        stroke="var(--token-primary)"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.4"
      />
      {/* Row 3 — dashed placeholder */}
      <line
        x1="26"
        y1="64"
        x2="56"
        y2="64"
        stroke="var(--token-border-strong)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray="4 3"
      />
      {/* Cow hoof stamp — brand motif */}
      <ellipse cx="62" cy="16" rx="5" ry="4" fill="var(--token-accent)" opacity="0.25" />
      <ellipse cx="62" cy="16" rx="5" ry="4" stroke="var(--token-accent)" strokeWidth="1.5" fill="none" />
    </svg>
  );
}
