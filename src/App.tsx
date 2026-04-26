import { useState, useEffect, useRef } from 'react'
import type { Message, MessageInput } from './types'
import { PROJECTS, STACK_LINES, SLASH_CMDS } from './data'
import MacWindow from './components/MacWindow'
import LeftPanel from './components/LeftPanel'
import RightPanel from './components/RightPanel'
import CommandInput from './components/CommandInput'
import TweaksPanel from './components/TweaksPanel'
import { useMetrics } from './hooks/useMetrics'
import { usePresence } from './hooks/usePresence'

// ── helpers ──────────────────────────────────────────────────────
const randNick = () => `visitor_${Math.floor(Math.random() * 18) + 2}`
const startTime = Date.now()
const fmtT = () => {
  const s = Math.floor((Date.now() - startTime) / 1000)
  return `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}
let msgCounter = 0
const mkId = () => ++msgCounter

// ── initial messages ──────────────────────────────────────────────
function makeInitialMessages(nick: string): Message[] {
  return [
    {
      id: mkId(), type: 'system',
      lines: ['terminal-portfolio v1.0.0', '──────────────────────────'],
    },
    {
      id: mkId(), type: 'system',
      lines: [
        `connected as ${nick}`,
        'connecting to presence server...',
        '',
        'type / to see slash commands',
        'or try:  /about  /projects  /help',
      ],
    },
    { id: mkId(), type: 'letter', myNick: nick },
  ]
}

const UPTIME_BASE = 14 * 86400 + 3 * 3600 + 22 * 60

export default function App() {
  const myNick = useRef(randNick()).current

  const { data: metricsData } = useMetrics()

  const { visitors, wsStatus, serverNick, commandFeed, sendCommand, sendPath, sendWave } =
    usePresence((nick) => push({ type: 'wave', from: nick }))

  const displayNick = serverNick ?? myNick

  const [messages, setMessages]           = useState<Message[]>(() => makeInitialMessages(myNick))
  const [history, setHistory]             = useState<string[]>([])
  const [currentCmd, setCurrentCmd]       = useState<string | null>(null)
  const [_retryCount, setRetryCount]      = useState(0)
  const [tweaksVisible, setTweaksVisible] = useState(false)

  // ── push helper ───────────────────────────────────────────────
  const push = (...msgs: MessageInput[]) =>
    setMessages(prev => [...prev, ...msgs.map(m => ({ id: mkId(), ...m } as Message))])

  // ── tweaks bridge ─────────────────────────────────────────────
  useEffect(() => {
    const h = (e: MessageEvent) => {
      if (e.data?.type === '__activate_edit_mode')   setTweaksVisible(true)
      if (e.data?.type === '__deactivate_edit_mode') setTweaksVisible(false)
    }
    window.addEventListener('message', h)
    window.parent.postMessage({ type: '__edit_mode_available' }, '*')
    return () => window.removeEventListener('message', h)
  }, [])

  // ── metricsData effect ────────────────────────────────────────
  useEffect(() => {
    if (metricsData) {
      setMessages(prev =>
        prev.map(m => (m.type === 'metrics' ? { ...m, data: metricsData } as Message : m))
      )
    }
  }, [metricsData])

  // ── serverNick effect: backfill letter messages created before hello handshake ──
  useEffect(() => {
    if (serverNick) {
      setMessages(prev =>
        prev.map(m => (m.type === 'letter' ? { ...m, myNick: serverNick } as Message : m))
      )
    }
  }, [serverNick])

  // ── command handler ───────────────────────────────────────────
  const handleCommand = (raw: string) => {
    const cmd = raw.trim()
    if (!cmd) return

    setHistory(prev => [...prev, cmd])
    setCurrentCmd(cmd)
    push({ type: 'command', text: cmd })
    sendCommand(cmd)

    const [verb, ...args] = cmd.split(/\s+/)

    switch (verb!.toLowerCase()) {
      case '/about':
        push({ type: 'text', lines: [
          { text: 'name    : 장민석 (Jang Min-seok)', color: 'var(--white)' },
          { text: 'role    : Backend Engineer',        color: 'var(--green)' },
          { text: 'career  : idsTrust (22.11~23.10) → 소프트퍼즐 (24.12~present)', color: 'var(--white)' },
          { text: 'focus   : 실시간 시스템 · 분산락 · AI 생산성 하네스', color: 'var(--white)' },
          { text: 'moto    : "보여주지 말고 증명하라"', color: 'var(--amber)' },
        ]})
        break

      case '/projects':
        PROJECTS.forEach(p => {
          push({ type: 'card', title: `[${p.id}] ${p.title}`, rows: [
            { label: 'problem :', value: p.problem },
            { label: 'solution:', value: p.solution, color: 'var(--green)' },
            { label: 'result  :', value: p.result,   color: 'var(--amber)' },
            { label: 'period  :', value: `${p.period}  [${p.stack.join(', ')}]`, color: 'var(--green-dim)' },
            { label: 'detail  :', value: `/project ${p.slug}`, color: 'var(--green-dim)' },
          ]})
        })
        break

      case '/project': {
        const slug = args[0]
        const p = PROJECTS.find(x => x.slug === slug || x.id.toLowerCase() === slug?.toLowerCase())
        if (!p) {
          push({ type: 'text', lines: [{ text: `project "${slug}" not found. try /projects`, color: 'var(--red)' }] })
          break
        }
        push(
          { type: 'card', title: `[${p.id}] ${p.title}`, rows: [
            { label: 'period  :', value: p.period },
            { label: 'stack   :', value: p.stack.join(' · '), color: 'var(--green-dim)' },
            { label: 'problem :', value: p.problem },
            { label: 'solution:', value: p.solution, color: 'var(--green)' },
            { label: 'result  :', value: p.result,   color: 'var(--amber)' },
          ]},
          { type: 'table', headers: ['metric', 'before', 'after'], rows: p.metrics },
        )
        break
      }

      case '/stack':
        push({ type: 'text', lines: STACK_LINES.map(l => ({
          text: l,
          color: l.startsWith('[') ? 'var(--white)' : 'var(--green-dim)',
        }))})
        break

      case '/yapp':
        push({ type: 'letter', myNick: displayNick })
        break

      case '/contact':
        push({ type: 'text', lines: [
          { text: 'email  : msjang.dev@gmail.com', color: 'var(--white)' },
          { text: 'github : github.com/msjang',     color: 'var(--green)' },
        ]})
        break

      case '/live':
        push({ type: 'presence', visitors, myNick: displayNick })
        break

      case '/whoami':
        push({ type: 'text', lines: [
          { text: `nickname : ${displayNick}`, color: 'var(--amber)' },
          { text: `session  : active since ${fmtT()}`, color: 'var(--green-dim)' },
          { text: `uptime   : ${Math.floor((UPTIME_BASE + (Date.now() - startTime) / 1000) / 86400)}d server`, color: 'var(--green-dim)' },
        ]})
        break

      case '/wave':
        sendWave()
        sendPath('/wave')
        setTimeout(() => sendPath('/about'), 2000)
        break

      case '/help':
        push({ type: 'text', lines: [
          { text: 'Available slash commands:', color: 'var(--white)' },
          { text: '', color: '' },
          ...SLASH_CMDS.map(c => ({ text: `  ${c.cmd.padEnd(28)}${c.desc}`, color: 'var(--green-dim)' })),
          { text: '', color: '' },
          { text: '  /project <slug>             specific project detail', color: 'var(--green-dim)' },
          { text: '', color: '' },
          { text: '  ↑/↓  history  ·  Tab/Enter  autocomplete  ·  Ctrl+L  clear', color: 'var(--green-low)' },
        ]})
        break

      case '/clear':
        setMessages(makeInitialMessages(displayNick))
        return

      case '/sudo': {
        const rest = args.join(' ')
        if (rest === 'hire-me') {
          push({ type: 'text', lines: [
            { text: '[sudo] password for hiring_manager: ··········', color: 'var(--green-dim)' },
          ]})
          setTimeout(() => push({ type: 'text', lines: [{ text: 'Authentication successful.', color: 'var(--amber)' }] }), 700)
          setTimeout(() => push({ type: 'letter', myNick: displayNick }), 1200)
        } else {
          push({ type: 'text', lines: [{ text: `sudo: ${rest}: command not found`, color: 'var(--red)' }] })
        }
        break
      }

      case '/uptime': {
        const s = UPTIME_BASE + Math.floor((Date.now() - startTime) / 1000)
        const d = Math.floor(s / 86400)
        const h = Math.floor((s % 86400) / 3600)
        const m = Math.floor((s % 3600) / 60)
        push({ type: 'text', lines: [
          { text: `server uptime : ${d}d ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`, color: 'var(--green)' },
          { text: `your session  : ${fmtT()}`, color: 'var(--green-dim)' },
        ]})
        break
      }

      default:
        if (cmd.startsWith('/')) {
          push({ type: 'text', lines: [
            { text: `unknown command: ${cmd}`, color: 'var(--red)' },
            { text: 'type /help to see available commands', color: 'var(--green-dim)' },
          ]})
        } else {
          push({ type: 'text', lines: [
            { text: `commands start with /  (e.g. /help, /about)`, color: 'var(--green-dim)' },
          ]})
        }
    }
  }

  const externalWave = () => push({ type: 'wave', from: displayNick })

  return (
    <>
      <div id="scanlines" />
      <MacWindow>
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          <LeftPanel
            myNick={displayNick}
            online={visitors.length}
            wsStatus={wsStatus}
            currentCmd={currentCmd}
            commandFeed={commandFeed}
          />
          <RightPanel messages={messages} />
        </div>
        <CommandInput onCommand={handleCommand} history={history} />
        {tweaksVisible && (
          <TweaksPanel
            wsStatus={wsStatus}
            setWsStatus={() => {}}
            setRetryCount={setRetryCount}
            onExternalWave={externalWave}
          />
        )}
      </MacWindow>
    </>
  )
}
