import { useState } from 'react'
import type { WsStatus } from '../types'

interface Props {
  wsStatus: WsStatus
  setWsStatus: (s: WsStatus) => void
  setRetryCount: (n: number) => void
  onExternalWave: () => void
}

const TWEAK_DEFAULTS = { theme: 'green', scanlines: true, birdColor: 'amber' }

export default function TweaksPanel({ wsStatus: _wsStatus, setWsStatus, setRetryCount, onExternalWave }: Props) {
  const [vals, setVals] = useState(TWEAK_DEFAULTS)

  const apply = (key: string, val: string | boolean) => {
    const next = { ...vals, [key]: val }
    setVals(next)
    window.parent.postMessage({ type: '__edit_mode_set_keys', edits: next }, '*')

    if (key === 'theme' && typeof val === 'string') {
      const map: Record<string, [string, string]> = {
        green: ['#33FF66', '#2a7a40'],
        amber: ['#FFB347', '#8B5E00'],
        blue:  ['#55CCFF', '#2266AA'],
      }
      const [m, d] = map[val] ?? map['green']!
      document.documentElement.style.setProperty('--green', m)
      document.documentElement.style.setProperty('--green-dim', d)
    }
    if (key === 'scanlines') {
      const el = document.getElementById('scanlines')
      if (el) el.style.display = val ? 'block' : 'none'
    }
  }

  const simDisconnect = () => {
    setWsStatus('RETRYING'); setRetryCount(1)
    let n = 1
    const t = setInterval(() => {
      if (++n >= 4) { clearInterval(t); setWsStatus('CONNECTED'); setRetryCount(0) }
      else setRetryCount(n)
    }, 1100)
  }

  return (
    <div style={{
      position: 'absolute', bottom: 60, right: 16, zIndex: 9000,
      background: '#111811', border: '1px solid var(--green-dim)',
      padding: 14, width: 210, fontSize: 12,
      boxShadow: '0 0 20px rgba(51,255,102,.12)',
    }}>
      <div style={{ color: 'var(--white)', fontWeight: 700, marginBottom: 12 }}>// Tweaks</div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ color: 'var(--green-dim)', marginBottom: 5 }}>Terminal Theme</div>
        {(['green', 'amber', 'blue'] as const).map(t => (
          <label key={t} style={{ display: 'flex', gap: 7, alignItems: 'center', cursor: 'pointer', marginBottom: 3 }}>
            <input
              type="radio" name="tw-theme"
              checked={vals.theme === t}
              onChange={() => apply('theme', t)}
              style={{ accentColor: 'var(--green)' }}
            />
            <span style={{ color: vals.theme === t ? 'var(--amber)' : 'var(--green-dim)' }}>{t} phosphor</span>
          </label>
        ))}
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'flex', gap: 7, alignItems: 'center', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={vals.scanlines}
            onChange={e => apply('scanlines', e.target.checked)}
            style={{ accentColor: 'var(--green)' }}
          />
          <span style={{ color: 'var(--green-dim)' }}>Scanlines</span>
        </label>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <button onClick={simDisconnect} style={{ fontSize: 11 }}>[simulate disconnect]</button>
        <button onClick={onExternalWave} style={{ fontSize: 11 }}>[trigger wave 👋]</button>
      </div>
    </div>
  )
}
