import type { CommandFeedItem, WsStatus } from '../types'
import { BIRD_ART } from '../data'

interface Props {
  myNick: string
  online: number
  wsStatus: WsStatus
  currentCmd: string | null
  commandFeed: CommandFeedItem[]
}

export default function LeftPanel({ myNick, online, wsStatus, currentCmd, commandFeed }: Props) {
  const bc = wsStatus === 'CONNECTED' ? 'var(--amber)' : 'var(--red)'
  const bt = wsStatus === 'CONNECTED' ? `[LIVE] ${online} online`
           : wsStatus === 'RETRYING'  ? '[RETRYING]' : '[OFFLINE]'

  return (
    <div style={{
      width: 270, flexShrink: 0,
      borderRight: '1px dashed var(--dash)',
      padding: '18px 12px',
      display: 'flex', flexDirection: 'column', gap: 0,
    }}>
      <div style={{
        fontSize: 11, color: 'var(--green-dim)',
        borderBottom: '1px dashed var(--dash)',
        paddingBottom: 10, marginBottom: 14,
        letterSpacing: '.04em',
      }}>
        terminal-portfolio v1.0.0
      </div>

      <div style={{ marginBottom: 14 }}>
        <div style={{ color: 'var(--green-dim)', fontSize: 11, marginBottom: 3 }}>Hello, YAPP 운영진.</div>
        <div style={{ color: 'var(--amber)', fontSize: 12, fontWeight: 700, lineHeight: 1.5 }} className="g-amber">
          This site IS the demo.
        </div>
        <div style={{
          display: 'inline-block', marginTop: 6,
          border: '1px solid var(--amber)', borderRadius: 2,
          padding: '1px 6px', fontSize: 10,
          color: 'var(--amber)', opacity: .75, letterSpacing: '.05em',
        }}>
          YAPP 28기 지원작
        </div>
      </div>

      <div style={{
        background: 'var(--green-low)', border: '1px dashed var(--dash)',
        padding: '8px 6px', marginBottom: 14, overflow: 'hidden',
      }}>
        <pre style={{
          color: 'var(--amber)', fontSize: 8.5, lineHeight: 1.32,
          textShadow: '0 0 10px rgba(255,179,71,.35)',
          fontFamily: 'var(--font)', margin: 0,
        }}>{BIRD_ART}</pre>
      </div>

      <div style={{ fontSize: 11, lineHeight: 1.9, color: 'var(--green-dim)', marginBottom: 14 }}>
        <div>
          <span style={{ color: 'var(--green-dim)' }}>name  </span>
          <span style={{ color: 'var(--white)' }}>장민석</span>
        </div>
        <div>
          <span style={{ color: 'var(--green-dim)' }}>role  </span>
          <span style={{ color: 'var(--green)' }}>Backend Engineer</span>
        </div>
        <div>
          <span style={{ color: 'var(--green-dim)' }}>stack </span>
          <span style={{ color: 'var(--green-dim)' }}>Java · Spring · Redis</span>
        </div>
        <div>
          <span style={{ color: 'var(--green-dim)' }}>model </span>
          <span style={{ color: 'var(--green-dim)' }}>Spring Boot 3.x</span>
        </div>
      </div>

      {commandFeed.length > 0 && (
        <div style={{
          borderTop: '1px dashed var(--dash)',
          paddingTop: 10, marginBottom: 14,
        }}>
          <div style={{ fontSize: 10, color: 'var(--green-dim)', marginBottom: 5, opacity: .6 }}>
            activity
          </div>
          {commandFeed.slice(-5).map((item, i) => (
            <div key={i} style={{
              fontSize: 10, color: 'var(--green-dim)',
              marginBottom: 2, opacity: .75,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              <span style={{ color: 'var(--amber)', opacity: .85 }}>{item.nick}</span>
              {' '}{item.cmd}
            </div>
          ))}
        </div>
      )}

      <div style={{ borderTop: '1px dashed var(--dash)', paddingTop: 12, marginTop: 'auto' }}>
        <div style={{ fontSize: 11, color: 'var(--green-dim)', marginBottom: 4 }}>
          {myNick}@portfolio
        </div>
        <div
          style={{ fontSize: 11, color: bc }}
          className={wsStatus === 'CONNECTED' ? 'live-blink g-amber' : 'g-red'}
        >
          {bt}
        </div>
        {currentCmd && (
          <div style={{ fontSize: 10, color: 'var(--green-dim)', marginTop: 6, opacity: .7 }}>
            last: {currentCmd}
          </div>
        )}
      </div>
    </div>
  )
}
