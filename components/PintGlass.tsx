"use client";

interface PintGlassProps {
  total: number;
  goal: number;
  size?: "sm" | "lg";
}

export default function PintGlass({ total, goal, size = "lg" }: PintGlassProps) {
  const pct = Math.max(0, Math.min(1, goal > 0 ? total / goal : 0));
  const isLarge = size === "lg";
  const width = isLarge ? 180 : 64;
  const height = isLarge ? 260 : 92;

  // Glass interior box, in the same coordinate space as the SVG viewBox below.
  const glassTop = 22;
  const glassBottom = 232;
  const glassLeft = 30;
  const glassRight = 150;
  const interiorHeight = glassBottom - glassTop;
  const fillHeight = interiorHeight * pct;
  const fillTop = glassBottom - fillHeight;

  return (
    <div className="flex flex-col items-center gap-2">
      <svg
        width={width}
        height={height}
        viewBox="0 0 180 260"
        className="drop-shadow-xl"
        role="img"
        aria-label={`${total} of ${goal} beers`}
      >
        <defs>
          <clipPath id={`glass-clip-${size}`}>
            <path d="M38 20 L142 20 L132 236 Q90 250 48 236 Z" />
          </clipPath>
          <linearGradient id={`fill-gradient-${size}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffd873" />
            <stop offset="100%" stopColor="#c98a1b" />
          </linearGradient>
        </defs>

        {/* glass body outline */}
        <path
          d="M38 20 L142 20 L132 236 Q90 250 48 236 Z"
          fill="rgba(255,255,255,0.06)"
          stroke="rgba(255,255,255,0.55)"
          strokeWidth={4}
        />

        {/* beer fill, clipped to glass shape */}
        <g clipPath={`url(#glass-clip-${size})`}>
          <rect
            x={glassLeft - 5}
            y={Math.max(glassTop, fillTop)}
            width={glassRight - glassLeft + 10}
            height={Math.max(0, glassBottom - Math.max(glassTop, fillTop))}
            fill={`url(#fill-gradient-${size})`}
          />
          {pct > 0.02 && (
            <rect
              x={glassLeft - 5}
              y={Math.max(glassTop, fillTop) - 3}
              width={glassRight - glassLeft + 10}
              height={6}
              fill="#fff8e7"
              opacity={0.9}
            />
          )}
        </g>

        {/* handle */}
        <path
          d="M142 60 Q172 65 168 110 Q165 145 138 150"
          fill="none"
          stroke="rgba(255,255,255,0.55)"
          strokeWidth={5}
        />
      </svg>
      {size === "lg" && (
        <div className="text-center">
          <div className="text-4xl font-black text-white leading-none">
            {total}
            <span className="text-white/50 text-2xl"> / {goal}</span>
          </div>
          <div className="text-gold font-bold text-sm tracking-wide mt-1">
            {Math.round(pct * 100)}% TO LIBERTY
          </div>
        </div>
      )}
      {size === "sm" && (
        <div className="text-xs font-bold text-white/80">
          {total}/{goal}
        </div>
      )}
    </div>
  );
}
