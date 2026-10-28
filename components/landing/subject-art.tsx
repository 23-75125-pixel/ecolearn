import type { ReactNode } from "react";

export type SubjectId = "mathematics" | "science" | "english" | "programming";

/**
 * One illustration per subject, drawn on the same 480x320 canvas with the same
 * line weight, the same zinc outlines and the single brand-green accent, so the
 * four read as one set. Everything is vector, so it stays sharp at any size.
 */
const LINE = "fill-none stroke-zinc-500 dark:stroke-zinc-400";
const THIN = "fill-none stroke-zinc-300 dark:stroke-zinc-700";
const PAPER = "fill-white stroke-zinc-500 dark:fill-zinc-950 dark:stroke-zinc-400";
const ACCENT = "fill-brand-500";
const ACCENT_LINE = "fill-none stroke-brand-600 dark:stroke-brand-400";
const ACCENT_SOFT = "fill-brand-500/15 stroke-brand-600 dark:stroke-brand-400";
const LABEL = "fill-zinc-500 dark:fill-zinc-400";
const STROKE = { strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } as const;

function Canvas({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <svg viewBox="0 0 480 320" role="img" aria-label={label} className="h-full w-full">
      <defs>
        <pattern id={`dots-${id}`} width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" className="fill-zinc-300 dark:fill-zinc-800" />
        </pattern>
      </defs>
      <rect width="480" height="320" fill={`url(#dots-${id})`} />
      {children}
    </svg>
  );
}

function Mathematics() {
  return (
    <Canvas id="math" label="A function graph beside a right triangle">
      <rect x="60" y="50" width="220" height="220" rx="8" className={PAPER} {...STROKE} />
      {[115, 170, 225].map((x) => (
        <line key={`v${x}`} x1={x} y1="58" x2={x} y2="262" className={THIN} strokeWidth="1" />
      ))}
      {[105, 160, 215].map((y) => (
        <line key={`h${y}`} x1="68" y1={y} x2="272" y2={y} className={THIN} strokeWidth="1" />
      ))}
      <line x1="68" y1="215" x2="272" y2="215" className={LINE} {...STROKE} />
      <line x1="115" y1="60" x2="115" y2="262" className={LINE} {...STROKE} />
      <path d="M135 80 Q195 300 255 80" className={ACCENT_LINE} strokeWidth="3" strokeLinecap="round" />
      <line x1="195" y1="190" x2="195" y2="215" className={ACCENT_LINE} strokeWidth="1.5" strokeDasharray="4 4" />
      <circle cx="195" cy="190" r="6" className={ACCENT} />
      <polygon points="330,240 440,240 330,130" className={ACCENT_SOFT} {...STROKE} />
      <path d="M330 222 H348 V240" className={LINE} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <text x="318" y="194" textAnchor="end" fontSize="15" fontStyle="italic" className={LABEL}>a</text>
      <text x="385" y="260" textAnchor="middle" fontSize="15" fontStyle="italic" className={LABEL}>b</text>
      <text x="398" y="178" fontSize="15" fontStyle="italic" className={LABEL}>c</text>
      <text x="385" y="288" textAnchor="middle" fontSize="16" fontWeight="500" className={LABEL}>
        a² + b² = c²
      </text>
    </Canvas>
  );
}

function Science() {
  return (
    <Canvas id="science" label="A laboratory flask beside an atom">
      <path
        d="M170 64 H200 V128 L252 226 Q262 250 238 252 H132 Q108 250 118 226 L170 128 Z"
        className={PAPER}
        {...STROKE}
      />
      <path
        d="M133 198 Q158 190 185 198 T237 198 L252 226 Q262 250 238 252 H132 Q108 250 118 226 Z"
        className="fill-brand-500/20 stroke-none"
      />
      <path d="M162 64 H208" className={LINE} {...STROKE} />
      <circle cx="176" cy="178" r="5" className={ACCENT_LINE} strokeWidth="2" />
      <circle cx="199" cy="162" r="4" className={ACCENT_LINE} strokeWidth="2" />
      <circle cx="189" cy="142" r="3" className={ACCENT_LINE} strokeWidth="2" />
      <ellipse cx="380" cy="150" rx="64" ry="22" className={LINE} {...STROKE} />
      <ellipse cx="380" cy="150" rx="64" ry="22" transform="rotate(60 380 150)" className={LINE} {...STROKE} />
      <ellipse cx="380" cy="150" rx="64" ry="22" transform="rotate(120 380 150)" className={LINE} {...STROKE} />
      <circle cx="380" cy="150" r="10" className={ACCENT} />
      <circle cx="444" cy="150" r="5" className="fill-white stroke-brand-600 dark:fill-zinc-950 dark:stroke-brand-400" strokeWidth="2" />
      <circle cx="412" cy="205.4" r="5" className="fill-white stroke-brand-600 dark:fill-zinc-950 dark:stroke-brand-400" strokeWidth="2" />
      <circle cx="348" cy="205.4" r="5" className="fill-white stroke-brand-600 dark:fill-zinc-950 dark:stroke-brand-400" strokeWidth="2" />
    </Canvas>
  );
}

function English() {
  return (
    <Canvas id="english" label="An open book with two speech bubbles">
      <path d="M240 128 Q190 108 120 120 V258 Q190 246 240 266 Z" className={PAPER} {...STROKE} />
      <path d="M240 128 Q290 108 360 120 V258 Q290 246 240 266 Z" className={PAPER} {...STROKE} />
      {[148, 166, 184, 202, 220].map((y, i) => (
        <g key={y}>
          <line x1="138" y1={y} x2={i === 4 ? 190 : 222} y2={y} className={THIN} strokeWidth="2" strokeLinecap="round" />
          <line x1="258" y1={y} x2={i === 4 ? 310 : 342} y2={y} className={THIN} strokeWidth="2" strokeLinecap="round" />
        </g>
      ))}
      <line x1="258" y1="184" x2="318" y2="184" className={ACCENT_LINE} strokeWidth="3" strokeLinecap="round" />
      <path d="M330 120 V158 L321 150 L312 158 V118" className={ACCENT} />
      <path d="M102 52 H190 Q200 52 200 62 V88 Q200 98 190 98 H150 L134 112 V98 H102 Q92 98 92 88 V62 Q92 52 102 52 Z" className={PAPER} {...STROKE} />
      <text x="146" y="86" textAnchor="middle" fontSize="26" fontWeight="600" className="fill-brand-600 dark:fill-brand-400">Aa</text>
      <path d="M300 62 H376 Q386 62 386 72 V92 Q386 102 376 102 H346 V116 L330 102 H300 Q290 102 290 92 V72 Q290 62 300 62 Z" className={PAPER} {...STROKE} />
      <line x1="304" y1="78" x2="372" y2="78" className={THIN} strokeWidth="2" strokeLinecap="round" />
      <line x1="304" y1="90" x2="350" y2="90" className={THIN} strokeWidth="2" strokeLinecap="round" />
    </Canvas>
  );
}

function Programming() {
  const bars: { x: number; y: number; w: number; accent?: boolean }[] = [
    { x: 112, y: 112, w: 60, accent: true },
    { x: 180, y: 112, w: 96 },
    { x: 132, y: 134, w: 112 },
    { x: 252, y: 134, w: 52, accent: true },
    { x: 132, y: 156, w: 84 },
    { x: 224, y: 156, w: 120 },
    { x: 112, y: 178, w: 40, accent: true },
    { x: 112, y: 200, w: 148 },
    { x: 132, y: 222, w: 72, accent: true },
    { x: 212, y: 222, w: 100 },
  ];
  return (
    <Canvas id="programming" label="A code editor window">
      <rect x="90" y="56" width="300" height="212" rx="10" className={PAPER} {...STROKE} />
      <line x1="90" y1="90" x2="390" y2="90" className={LINE} {...STROKE} />
      <circle cx="110" cy="73" r="4.5" className={ACCENT} />
      <circle cx="127" cy="73" r="4.5" className={THIN} strokeWidth="2" />
      <circle cx="144" cy="73" r="4.5" className={THIN} strokeWidth="2" />
      {bars.map((bar) => (
        <rect
          key={`${bar.x}-${bar.y}`}
          x={bar.x}
          y={bar.y}
          width={bar.w}
          height="9"
          rx="4.5"
          className={bar.accent ? "fill-brand-500/70" : "fill-zinc-300 dark:fill-zinc-700"}
        />
      ))}
      <rect x="112" y="240" width="10" height="16" rx="2" className={ACCENT} />
      <text x="430" y="150" textAnchor="middle" fontSize="30" fontWeight="600" className="fill-brand-600 font-mono dark:fill-brand-400">{"{ }"}</text>
      <text x="48" y="240" textAnchor="middle" fontSize="24" fontWeight="600" className={`${LABEL} font-mono`}>{"</>"}</text>
    </Canvas>
  );
}

export function SubjectArt({ id }: { id: SubjectId }) {
  switch (id) {
    case "mathematics":
      return <Mathematics />;
    case "science":
      return <Science />;
    case "english":
      return <English />;
    case "programming":
      return <Programming />;
  }
}
