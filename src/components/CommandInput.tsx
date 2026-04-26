import { useState, useEffect, useRef } from 'react'
import { SLASH_CMDS } from '../data'

interface Props {
  onCommand: (cmd: string) => void
  history: string[]
}

function SlashMenu({
  query, visible, activeIdx, onSelect,
}: {
  query: string
  visible: boolean
  activeIdx: number
  onSelect: (cmd: string) => void
}) {
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    itemRefs.current[activeIdx]?.scrollIntoView({ block: 'nearest' })
  }, [activeIdx])

  if (!visible) return null
  const filtered = SLASH_CMDS.filter(c => c.cmd.startsWith(query || '/'))

  return (
    <div style={{
      position: 'absolute', bottom: '100%', left: 0, right: 0,
      background: '#111811', border: '1px solid var(--dash)',
      maxHeight: 200, overflowY: 'auto', zIndex: 100,
      boxShadow: '0 -8px 24px rgba(0,0,0,.5)',
    }}>
      {filtered.map((c, i) => (
        <div
          key={c.cmd}
          ref={el => { itemRefs.current[i] = el }}
          onClick={() => onSelect(c.cmd)}
          style={{
            display: 'flex', gap: 12, padding: '6px 14px',
            background: i === activeIdx ? 'var(--green-low)' : 'transparent',
            cursor: 'pointer', borderBottom: '1px solid #1a2a1a',
            transition: 'background .1s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--green-low)')}
          onMouseLeave={e => (e.currentTarget.style.background = i === activeIdx ? 'var(--green-low)' : 'transparent')}
        >
          <span style={{ color: 'var(--amber)', minWidth: 90, fontWeight: 700, fontSize: 12 }}>{c.cmd}</span>
          <span style={{ color: 'var(--green-dim)', fontSize: 12 }}>{c.desc}</span>
        </div>
      ))}
      {filtered.length === 0 && (
        <div style={{ padding: '6px 14px', color: 'var(--green-dim)', fontSize: 12 }}>no matching commands</div>
      )}
    </div>
  )
}

export default function CommandInput({ onCommand, history }: Props) {
  const [input, setInput]     = useState('')
  const [histIdx, setHistIdx] = useState(-1)
  const [showMenu, setShowMenu] = useState(false)
  const [menuIdx, setMenuIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const filteredCmds = SLASH_CMDS.filter(c => c.cmd.startsWith(input || '/'))

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return
      if (e.key.length === 1 || e.key === 'Backspace') inputRef.current?.focus()
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])

  const submit = (val?: string) => {
    const cmd = (val ?? input).trim()
    if (!cmd) return
    onCommand(cmd)
    setInput(''); setHistIdx(-1); setShowMenu(false); setMenuIdx(0)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    setInput(v)
    setShowMenu(v.startsWith('/'))
    setMenuIdx(0)
  }

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showMenu && filteredCmds.length > 0) {
      if (e.key === 'ArrowUp')   { e.preventDefault(); setMenuIdx(i => Math.max(i - 1, 0)); return }
      if (e.key === 'ArrowDown') { e.preventDefault(); setMenuIdx(i => Math.min(i + 1, filteredCmds.length - 1)); return }
      if (e.key === 'Tab' || e.key === 'Enter') {
        e.preventDefault()
        const chosen = filteredCmds[menuIdx]?.cmd
        if (chosen) submit(chosen)
        return
      }
    }
    if (e.key === 'Enter') { submit(); return }
    if (e.key === 'Escape') { setShowMenu(false); return }
    if (e.key === 'ArrowUp' && !showMenu) {
      e.preventDefault()
      const idx = Math.min(histIdx + 1, history.length - 1)
      setHistIdx(idx)
      setInput(history[history.length - 1 - idx] ?? '')
    }
    if (e.key === 'ArrowDown' && !showMenu) {
      e.preventDefault()
      const idx = Math.max(histIdx - 1, -1)
      setHistIdx(idx)
      setInput(idx === -1 ? '' : (history[history.length - 1 - idx] ?? ''))
    }
    if (e.ctrlKey && e.key === 'c') { setInput(''); setShowMenu(false) }
    if (e.ctrlKey && e.key === 'l') { e.preventDefault(); onCommand('/clear') }
  }

  return (
    <div style={{
      borderTop: '1px solid var(--border)',
      padding: '0 16px',
      background: '#0d130d',
      flexShrink: 0, position: 'relative',
    }}>
      <SlashMenu
        query={input}
        visible={showMenu}
        activeIdx={menuIdx}
        onSelect={cmd => submit(cmd)}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 40 }}>
        <span style={{ color: 'var(--amber)', fontSize: 13, flexShrink: 0 }} className="g-amber">{'>'}</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={handleChange}
          onKeyDown={handleKey}
          autoFocus
          spellCheck={false}
          autoComplete="off"
          placeholder={`try "/help" or type a slash command...`}
          onFocus={() => { if (input.startsWith('/')) setShowMenu(true) }}
          onBlur={() => setTimeout(() => setShowMenu(false), 150)}
        />
      </div>
    </div>
  )
}
