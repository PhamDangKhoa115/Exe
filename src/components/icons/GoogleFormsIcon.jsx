export default function GoogleFormsIcon({ size = 24, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M6 2.5H14.5L19 7V21.5H6C4.9 21.5 4 20.6 4 19.5V4.5C4 3.4 4.9 2.5 6 2.5Z"
        fill="currentColor"
      />

      <path d="M14.5 2.5V7H19" fill="rgba(255,255,255,0.32)" />

      <circle cx="8" cy="10" r="1.15" fill="white" />
      <rect x="11" y="9" width="5.5" height="2" rx="1" fill="white" />

      <circle cx="8" cy="14.5" r="1.15" fill="white" />
      <rect x="11" y="13.5" width="5.5" height="2" rx="1" fill="white" />

      <circle cx="8" cy="19" r="1.15" fill="white" />
      <rect x="11" y="18" width="4.5" height="2" rx="1" fill="white" />
    </svg>
  );
}
