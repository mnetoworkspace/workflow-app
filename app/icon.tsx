import { ImageResponse } from 'next/og'

export const size = { width: 512, height: 512 }
export const contentType = 'image/png'

export default function AppIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#06061a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {/* Subtle grid lines — horizontal */}
        {[0.25, 0.5, 0.75].map((y) => (
          <div
            key={y}
            style={{
              position: 'absolute',
              top: `${y * 100}%`,
              left: 0,
              right: 0,
              height: 1,
              background: 'rgba(0,240,255,0.04)',
              display: 'flex',
            }}
          />
        ))}
        {/* Subtle grid lines — vertical */}
        {[0.25, 0.5, 0.75].map((x) => (
          <div
            key={x}
            style={{
              position: 'absolute',
              left: `${x * 100}%`,
              top: 0,
              bottom: 0,
              width: 1,
              background: 'rgba(0,240,255,0.04)',
              display: 'flex',
            }}
          />
        ))}

        {/* Glow halo behind bolt */}
        <div
          style={{
            position: 'absolute',
            width: 320,
            height: 320,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0,240,255,0.14) 0%, rgba(0,240,255,0.04) 45%, transparent 70%)',
            display: 'flex',
          }}
        />

        {/* Lightning bolt — filled polygon */}
        <svg
          width={220}
          height={220}
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M13 2 L3 14 L12 14 L11 22 L21 10 L12 10 Z"
            fill="#00f0ff"
          />
        </svg>

        {/* Subtle bottom label */}
        <div
          style={{
            position: 'absolute',
            bottom: 52,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <div style={{ width: 28, height: 1, background: 'rgba(0,240,255,0.3)', display: 'flex' }} />
          <span
            style={{
              color: 'rgba(0,240,255,0.55)',
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: 6,
              fontFamily: 'sans-serif',
            }}
          >
            FLUX
          </span>
          <div style={{ width: 28, height: 1, background: 'rgba(0,240,255,0.3)', display: 'flex' }} />
        </div>
      </div>
    ),
    { width: 512, height: 512 }
  )
}
