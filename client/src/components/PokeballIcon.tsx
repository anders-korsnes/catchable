interface Props {
  size?: number;
  className?: string;
}

// SVG so it scales cleanly for the catch animation.
export function PokeballIcon({ size = 48, className }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden
      className={className}
    >
      <circle cx="32" cy="32" r="30" fill="#FFFFFF" stroke="#0F172A" strokeWidth="3" />
      <path
        d="M2 32a30 30 0 0160 0H40a8 8 0 10-16 0H2z"
        fill="#DC2626"
        stroke="#0F172A"
        strokeWidth="3"
      />
      <circle cx="32" cy="32" r="6" fill="#FFFFFF" stroke="#0F172A" strokeWidth="3" />
      <circle cx="32" cy="32" r="2.5" fill="#0F172A" />
    </svg>
  );
}
