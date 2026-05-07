import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
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
          borderRadius: 40,
        }}
      >
        {/* Glow halo */}
        <div
          style={{
            position: 'absolute',
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0,240,255,0.16) 0%, rgba(0,240,255,0.04) 50%, transparent 70%)',
            display: 'flex',
          }}
        />

        {/* Lightning bolt */}
        <svg width={76} height={76} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M13 2 L3 14 L12 14 L11 22 L21 10 L12 10 Z" fill="#00f0ff" />
        </svg>

        {/* Label */}
        <div
          style={{
            position: 'absolute',
            bottom: 18,
            display: 'flex',
            alignItems: 'center',
            gap: 3,
          }}
        >
          <div style={{ width: 10, height: 1, background: 'rgba(0,240,255,0.3)', display: 'flex' }} />
          <span style={{ color: 'rgba(0,240,255,0.5)', fontSize: 9, fontWeight: 700, letterSpacing: 3, fontFamily: 'sans-serif' }}>
            FLUX
          </span>
          <div style={{ width: 10, height: 1, background: 'rgba(0,240,255,0.3)', display: 'flex' }} />
        </div>
      </div>
    ),
    { width: 180, height: 180 }
  )
}
