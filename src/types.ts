export interface TextLine {
  text: string
  color?: string
  indent?: number
}

export interface TableRow extends Array<string> {}

export interface CardRow {
  label: string
  value: string
  color?: string
}

export interface Visitor {
  nick: string
  path: string
  idle: number
  lastMoveAt: number
}

export type WsStatus = 'CONNECTED' | 'RETRYING' | 'OFFLINE'

export interface MetricsData {
  heapUsedMb: number
  heapMaxMb: number
  heapPct: number
  cpuPct: number
  reqCount: number
  uptimeMs: number
}

export interface CommandFeedItem {
  nick: string
  cmd: string
  ts: number
}

// ── Message types ──

export interface MsgSystem   { id: number; type: 'system';   lines: string[] }
export interface MsgCommand  { id: number; type: 'command';  text: string }
export interface MsgText     { id: number; type: 'text';     lines: TextLine[]; color?: string }
export interface MsgCard     { id: number; type: 'card';     title?: string; rows: CardRow[] }
export interface MsgTable    { id: number; type: 'table';    headers: string[]; rows: string[][] }
export interface MsgPresence { id: number; type: 'presence'; visitors: Visitor[]; myNick: string }
export interface MsgLetter   { id: number; type: 'letter';   myNick: string }
export interface MsgWave     { id: number; type: 'wave';     from: string }
export interface MsgMetrics { id: number; type: 'metrics'; data: MetricsData | null }

export type Message =
  | MsgSystem
  | MsgCommand
  | MsgText
  | MsgCard
  | MsgTable
  | MsgPresence
  | MsgLetter
  | MsgWave
  | MsgMetrics

export type MessageInput =
  | Omit<MsgSystem,   'id'>
  | Omit<MsgCommand,  'id'>
  | Omit<MsgText,     'id'>
  | Omit<MsgCard,     'id'>
  | Omit<MsgTable,    'id'>
  | Omit<MsgPresence, 'id'>
  | Omit<MsgLetter,   'id'>
  | Omit<MsgWave,     'id'>
  | Omit<MsgMetrics,  'id'>

export interface Project {
  id: string
  slug: string
  title: string
  problem: string
  solution: string
  result: string
  period: string
  stack: string[]
  metrics: string[][]
}

export interface SlashCmd {
  cmd: string
  desc: string
}
