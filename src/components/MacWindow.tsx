import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
}

export default function MacWindow({ children }: Props) {
  return (
    <div style={{
      width: '92vw', maxWidth: 960,
      height: '88vh', maxHeight: 680,
      background: '#111811',
      borderRadius: 10,
      boxShadow: '0 24px 80px rgba(0,0,0,.8), 0 0 0 1px rgba(255,255,255,.06)',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
      position: 'relative',
    }}>
      <div style={{
        height: 36, background: '#1c221c',
        borderBottom: '1px solid #222c22',
        display: 'flex', alignItems: 'center',
        padding: '0 14px', flexShrink: 0,
        gap: 8,
      }}>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          {(['#FF5F57', '#FFBD2E', '#28C840'] as const).map((c, i) => (
            <span key={i} style={{ width: 11, height: 11, borderRadius: '50%', background: c, display: 'inline-block' }} />
          ))}
        </div>
        <span style={{
          flex: 1, textAlign: 'center', fontSize: 11,
          color: 'var(--green-dim)', letterSpacing: '.06em',
        }}>
          terminal-portfolio — visitor_N@portfolio:~$
        </span>
      </div>
      {children}
    </div>
  )
}
