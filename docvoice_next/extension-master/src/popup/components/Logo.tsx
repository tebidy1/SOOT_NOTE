export default function Logo({ className = "", variant = "light" }: { className?: string, variant?: "light" | "dark" }) {
  const isDark = variant === "dark";
  const textColor = isDark ? "#0F172A" : "#FFFFFF";
  const notepadColor = isDark ? "#1E293B" : "#FFFFFF";
  const micBgColor = isDark ? "#06B6D4" : "#ffffff";
  const micRingColor = isDark ? "#0B1F3B" : "#06B6D4";
  const micColor = isDark ? "#ffffff" : "#0B1F3B";

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 450 120" className={className}>
      <g transform="translate(10, 10)">
        <rect x="0" y="22" width="55" height="70" rx="7" fill="none" stroke={notepadColor} strokeWidth="4.5" />
        <path d="M 17 22 V 17 C 17 15 19 13 21 13 H 34 C 36 13 38 15 38 17 V 22 Z" fill={notepadColor} />
        <circle cx="27.5" cy="11" r="4.5" fill={notepadColor} />
        <rect x="12" y="20" width="31" height="4.5" rx="2" fill={notepadColor} />
        <rect x="11" y="38" width="7" height="7" rx="1.5" fill="none" stroke={notepadColor} strokeWidth="2.5" />
        <line x1="26" y1="41.5" x2="44" y2="41.5" stroke={notepadColor} strokeWidth="3.5" strokeLinecap="round" />
        <rect x="11" y="55" width="7" height="7" rx="1.5" fill="none" stroke={notepadColor} strokeWidth="2.5" />
        <line x1="26" y1="58.5" x2="44" y2="58.5" stroke={notepadColor} strokeWidth="3.5" strokeLinecap="round" />
        <rect x="11" y="72" width="7" height="7" rx="1.5" fill="none" stroke={notepadColor} strokeWidth="2.5" />
        <line x1="26" y1="75.5" x2="44" y2="75.5" stroke={notepadColor} strokeWidth="3.5" strokeLinecap="round" />
        <circle cx="60" cy="25" r="22" fill={micBgColor} />
        <circle cx="60" cy="25" r="18" fill="none" stroke={micRingColor} strokeWidth="3.5" />
        <rect x="56.5" y="15" width="7" height="12" rx="3.5" fill={micColor} />
        <path d="M 53 23 V 24.5 A 7 7 0 0 0 67 24.5 V 23" fill="none" stroke={micColor} strokeWidth="2.5" strokeLinecap="round" />
        <line x1="60" y1="31.5" x2="60" y2="36" stroke={micColor} strokeWidth="2.5" strokeLinecap="round" />
        <line x1="56" y1="36" x2="64" y2="36" stroke={micColor} strokeWidth="2.5" strokeLinecap="round" />
      </g>
      <g transform="translate(110, 0)">
        <text x="0" y="58" fontFamily="sans-serif" fontSize="44" fontWeight="bold" fill={textColor}>SoutNote</text>
        <text x="0" y="104" fontFamily="sans-serif" fontSize="40" fontWeight="bold" fill={textColor}>صوت نوت</text>
      </g>
    </svg>
  )
}
