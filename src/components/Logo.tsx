export function Logo({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-label="BloomAI">
      <path d="M24 26c-6-4-12-2-14 4 6 3 12 1 14-4z" fill="#FF8AA0" />
      <path d="M24 26c6-4 12-2 14 4-6 3-12 1-14-4z" fill="#FF6B81" />
      <path d="M24 26c-3-6-1-12 5-14 3 6 1 12-5 14z" fill="#FFB0BD" />
      <path d="M24 26c3-6 1-12-5-14-3 6-1 12 5 14z" fill="#F9B36B" />
      <circle cx="24" cy="26" r="4" fill="#E6435F" />
      <path d="M24 30v12" stroke="#4FA98E" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M24 38c3 0 5-2 5-5-3 0-5 2-5 5z" fill="#4FA98E" />
    </svg>
  );
}

export function Wordmark({ size = 30 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2">
      <Logo size={size} />
      <span className="text-xl font-extrabold tracking-tight text-plum">
        Bloom<span className="text-coral-deep">AI</span>
      </span>
    </div>
  );
}
