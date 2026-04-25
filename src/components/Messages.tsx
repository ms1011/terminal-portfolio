import type {
  Message, MsgSystem, MsgCommand, MsgText,
  MsgCard, MsgTable, MsgPresence, MsgLetter, MsgWave, MsgMetrics,
} from '../types'

function MsgSystem({ lines }: Pick<MsgSystem, 'lines'>) {
  return (
    <div style={{ marginBottom: 4 }}>
      {lines.map((l, i) => (
        <div key={i} style={{ color: 'var(--green-dim)', fontSize: 11, marginBottom: 1 }}>{l}</div>
      ))}
    </div>
  )
}

function MsgCommand({ text }: Pick<MsgCommand, 'text'>) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '12px 0 6px' }}>
      <span style={{ color: 'var(--amber)', fontSize: 12 }}>{'>'}</span>
      <span style={{ color: 'var(--white)', fontWeight: 700 }}>{text}</span>
    </div>
  )
}

function MsgText({ lines, color }: Pick<MsgText, 'lines' | 'color'>) {
  const c = color || 'var(--white)'
  return (
    <div style={{ marginBottom: 4 }}>
      {lines.map((l, i) => (
        <div
          key={i}
          style={{
            color: l.color || c,
            marginBottom: 1,
            paddingLeft: l.indent ? l.indent * 14 : 0,
          }}
        >
          {l.text}
        </div>
      ))}
    </div>
  )
}

function MsgCard({ title, rows }: Pick<MsgCard, 'title' | 'rows'>) {
  return (
    <div style={{ border: '1px solid var(--border)', marginBottom: 8 }}>
      {title && (
        <div style={{
          padding: '4px 12px', background: 'var(--green-low)',
          borderBottom: '1px solid var(--border)',
          color: 'var(--white)', fontWeight: 700, fontSize: 12,
        }}>{title}</div>
      )}
      <div style={{ padding: '8px 12px' }}>
        {rows.map((r, i) => (
          <div key={i} style={{ display: 'flex', gap: 0, marginBottom: 2, fontSize: 12 }}>
            <span style={{ color: 'var(--green-dim)', width: 100, flexShrink: 0 }}>{r.label}</span>
            <span style={{ color: r.color || 'var(--white)' }}>{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function MsgTable({ headers, rows }: Pick<MsgTable, 'headers' | 'rows'>) {
  const colW = headers.map((h, ci) =>
    Math.max(h.length, ...rows.map(r => String(r[ci] ?? '').length)) + 2
  )
  const pad = (s: string | number, w: number) => String(s).padEnd(w, ' ')
  const sep = colW.map(w => '─'.repeat(w)).join('┼')

  return (
    <pre style={{ color: 'var(--green-dim)', fontSize: 11, lineHeight: 1.7, marginBottom: 8, fontFamily: 'var(--font)' }}>
      <span style={{ color: 'var(--green-dim)' }}>{'┌' + sep.replace(/┼/g, '┬') + '┐\n'}</span>
      <span style={{ color: 'var(--green)' }}>
        {'│' + headers.map((h, i) => pad(' ' + h, colW[i]!)).join('│') + '│\n'}
      </span>
      {'├' + sep + '┤\n'}
      {rows.map((r) =>
        '│' + r.map((c, ci) => pad(' ' + String(c), colW[ci]!)).join('│') + '│\n'
      )}
      {'└' + sep.replace(/┼/g, '┴') + '┘'}
    </pre>
  )
}

function MsgPresence({ visitors, myNick }: Pick<MsgPresence, 'visitors' | 'myNick'>) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontSize: 11, color: 'var(--green-dim)', marginBottom: 6 }}>
        {visitors.length} visitors currently online
      </div>
      {visitors.map((v, i) => (
        <div key={i} style={{ fontSize: 12, display: 'flex', gap: 8, marginBottom: 2 }}>
          <span style={{ color: v.nick === myNick ? 'var(--amber)' : 'var(--green-dim)' }}>
            {v.nick === myNick ? '▶' : ' '} {v.nick}
          </span>
          <span style={{ color: 'var(--green-dim)' }}>{v.path}</span>
          <span style={{ color: 'var(--green-dim)', opacity: .6 }}>{v.idle}s ago</span>
          {v.nick === myNick && <span style={{ color: 'var(--green-dim)', fontSize: 10 }}>(you)</span>}
        </div>
      ))}
    </div>
  )
}

function MsgLetter({ myNick }: Pick<MsgLetter, 'myNick'>) {
  const body = [
    `From: ${myNick}`,
    `To  : YAPP 운영진 귀하`,
    `Subj: 왜 YAPP인가`,
    ``,
    `  저는 백엔드 개발자로서 항상 "글로 설명하는 것"보다`,
    `  "동작으로 증명하는 것"을 더 신뢰해왔습니다.`,
    `  이 포트폴리오 사이트 자체가 그 철학의 구현입니다 —`,
    `  지금 이 순간 SSE 스트림이 흐르고, WebSocket으로`,
    `  다른 방문자의 존재가 실시간으로 공유되고 있습니다.`,
    ``,
    `  YAPP에 지원하는 이유는 단순합니다.`,
    `  IT 커뮤니티에서 가장 치열하게 성장하는 사람들과`,
    `  함께하고 싶기 때문입니다.`,
    ``,
    `  이 사이트의 서버는 지금도 돌아가고 있습니다.`,
    `  저도 그렇게 — 항상 켜져 있을 준비가 되어 있습니다.`,
    ``,
    `-- 장민석  msjang.dev@gmail.com`,
  ]
  return (
    <div style={{ border: '1px dashed var(--dash)', padding: '10px 14px', marginBottom: 8 }}>
      {body.map((l, i) => (
        <div key={i} style={{
          fontSize: 12, lineHeight: 1.75,
          color: i < 3 ? 'var(--green-dim)'
               : i === body.length - 1 ? 'var(--amber)'
               : 'var(--white)',
        }}>
          {l || ' '}
        </div>
      ))}
    </div>
  )
}

function MsgWave({ from }: Pick<MsgWave, 'from'>) {
  return (
    <div style={{
      color: 'var(--amber)', fontSize: 13, padding: '6px 0 6px',
      textShadow: '0 0 12px rgba(255,179,71,.5)',
    }}>
      {'👋  ' + from + ' waves!'}
    </div>
  )
}

function bar(pct: number, width = 10): string {
  const filled = Math.round(Math.min(pct, 100) / 100 * width)
  return '█'.repeat(filled) + '░'.repeat(width - filled)
}

function fmtUptime(ms: number): string {
  const s = Math.floor(ms / 1000)
  const d = Math.floor(s / 86400)
  const h = String(Math.floor((s % 86400) / 3600)).padStart(2, '0')
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0')
  const sec = String(s % 60).padStart(2, '0')
  return d > 0 ? `${d}d ${h}:${m}:${sec}` : `${h}:${m}:${sec}`
}

function MsgMetricsView({ data }: Pick<MsgMetrics, 'data'>) {
  if (!data) {
    return (
      <div style={{ color: 'var(--green-dim)', fontSize: 11, marginBottom: 4 }}>
        connecting to metrics stream...
      </div>
    )
  }
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontSize: 11, color: 'var(--green-dim)', marginBottom: 4 }}>
        SERVER METRICS  <span style={{ opacity: .5 }}>(live · 1s)</span>
      </div>
      <pre style={{
        fontSize: 12, color: 'var(--green)', lineHeight: 1.8,
        margin: 0, fontFamily: 'var(--font)',
      }}>
        {`heap  [${bar(data.heapPct)}] ${data.heapUsedMb}/${data.heapMaxMb} MB\n`}
        {`cpu   [${bar(data.cpuPct)}] ${String(data.cpuPct).padStart(3)}%\n`}
        {`req   ${data.reqCount.toLocaleString()} total\n`}
        {`up    ${fmtUptime(data.uptimeMs)}`}
      </pre>
    </div>
  )
}

export default function MessageView({ msg }: { msg: Message }) {
  switch (msg.type) {
    case 'system':   return <MsgSystem lines={msg.lines} />
    case 'command':  return <MsgCommand text={msg.text} />
    case 'text':     return <MsgText lines={msg.lines} color={msg.color} />
    case 'card':     return <MsgCard title={msg.title} rows={msg.rows} />
    case 'table':    return <MsgTable headers={msg.headers} rows={msg.rows} />
    case 'presence': return <MsgPresence visitors={msg.visitors} myNick={msg.myNick} />
    case 'letter':   return <MsgLetter myNick={msg.myNick} />
    case 'wave':     return <MsgWave from={msg.from} />
    case 'metrics': return <MsgMetricsView data={msg.data} />
  }
}
