/**
 * HeroBackdrop — layered, theme-consistent hero atmosphere.
 *
 * Layers (back to front):
 *  1. A warm temple-at-sunrise image (golden, theme-matched) positioned to the
 *     right, with the left side kept clean for the headline
 *  2. An ivory wash + soft argyle diamond lattice over the image so it blends
 *     into the page without a hard photographic edge
 *  3. Golden sparkles passed in as children
 *
 * All tints are GeekAI ink / gold / sand; no new hue is introduced.
 */

export function DiamondLattice() {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id="ga-argyle" width="80" height="80" patternUnits="userSpaceOnUse">
          <rect width="80" height="80" fill="rgba(11,31,58,0.006)" />
          <polygon points="40,0 80,40 40,80 0,40" fill="rgba(11,31,58,0.022)" />
          <polygon points="0,0 40,0 0,40" fill="rgba(201,162,39,0.018)" />
          <polygon points="80,0 40,0 80,40" fill="rgba(201,162,39,0.018)" />
          <polygon points="0,80 40,80 0,40" fill="rgba(201,162,39,0.018)" />
          <polygon points="80,80 40,80 80,40" fill="rgba(201,162,39,0.018)" />
          <path d="M40 0 L80 40 L40 80 L0 40 Z" fill="none" stroke="rgba(11,31,58,0.05)" strokeWidth="0.7" />
          <line x1="0" y1="0" x2="0" y2="80" stroke="rgba(11,31,58,0.085)" strokeWidth="1" />
          <line x1="80" y1="0" x2="80" y2="80" stroke="rgba(11,31,58,0.085)" strokeWidth="1" />
          <line x1="0" y1="0" x2="80" y2="0" stroke="rgba(11,31,58,0.04)" strokeWidth="0.7" />
          <line x1="0" y1="80" x2="80" y2="80" stroke="rgba(11,31,58,0.04)" strokeWidth="0.7" />
        </pattern>
        {/* Fade the photographic edges into the ivory page */}
        <linearGradient id="ga-image-fade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#F6F1E7" stopOpacity="0.96" />
          <stop offset="22%" stopColor="#F6F1E7" stopOpacity="0.7" />
          <stop offset="46%" stopColor="#F6F1E7" stopOpacity="0.14" />
          <stop offset="100%" stopColor="#F6F1E7" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#ga-argyle)" />
      <rect width="100%" height="100%" fill="url(#ga-image-fade)" />
    </svg>
  )
}

export default function HeroBackdrop({ children }) {
  return (
    <>
      {/* Base ivory */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{ background: 'linear-gradient(180deg, #F6F1E7 0%, #F0E9DA 60%, #ECE3D2 100%)' }}
      />

      {/* Theme image — temple at sunrise, anchored right */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-cover bg-center bg-no-repeat lg:bg-right-center"
        style={{
          backgroundImage: 'url(/hero-temple.webp)',
          opacity: 0.85,
        }}
      />

      {/* Argyle lattice + ivory fade over the image */}
      <DiamondLattice />

      {children}
    </>
  )
}
