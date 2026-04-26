import { useCallback, useEffect, useRef, useState } from 'react'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { API_BASE } from '../config'
import type { CommandFeedItem, Visitor, WsStatus } from '../types'

export function usePresence(onWave?: (nick: string) => void) {
  const [visitors, setVisitors]       = useState<Visitor[]>([])
  const [wsStatus, setWsStatus]       = useState<WsStatus>('RETRYING')
  const [serverNick, setServerNick]   = useState<string | null>(null)
  const [commandFeed, setCommandFeed] = useState<CommandFeedItem[]>([])
  const clientRef = useRef<Client | null>(null)
  const onWaveRef = useRef(onWave)
  onWaveRef.current = onWave

  const MAX_FEED = 8

  useEffect(() => {
    const t = setInterval(() => {
      setVisitors(prev => prev.map(v => ({
        ...v,
        idle: Math.floor((Date.now() - v.lastMoveAt) / 1000),
      })))
    }, 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new (SockJS as any)(`${API_BASE}/ws/presence`),
      reconnectDelay: 3000,
      onDisconnect: () => setWsStatus('RETRYING'),
      onStompError:  () => setWsStatus('OFFLINE'),
    })

    client.onConnect = () => {
      setWsStatus('CONNECTED')
      client.subscribe('/user/queue/session', (msg) => {
        const p = JSON.parse(msg.body)
        if (p.nick) setServerNick(p.nick)
      })
      client.subscribe('/topic/presence', (msg) => {
        const p = JSON.parse(msg.body)
        switch (p.event) {
          case 'presence.snapshot':
            setVisitors((p.users as any[]).map((u: any) => ({
              nick: u.nick,
              path: u.path,
              idle: Math.floor(u.idleMs / 1000),
              lastMoveAt: Date.now() - u.idleMs,
            })))
            break
          case 'presence.join':
            setVisitors(prev => [
              ...prev.filter(v => v.nick !== p.nick),
              { nick: p.nick, path: p.path, idle: 0, lastMoveAt: Date.now() },
            ])
            break
          case 'presence.leave':
            setVisitors(prev => prev.filter(v => v.nick !== p.nick))
            break
          case 'presence.move':
            setVisitors(prev => prev.map(v =>
              v.nick === p.nick
                ? { ...v, path: p.path, idle: 0, lastMoveAt: Date.now() }
                : v
            ))
            break
          case 'visitor.wave':
            onWaveRef.current?.(p.from)
            break
          case 'command.broadcast':
            setCommandFeed(prev => [
              ...prev.slice(-(MAX_FEED - 1)),
              { nick: p.nick, cmd: p.cmd, ts: Date.now() },
            ])
            break
        }
      })
      client.publish({ destination: '/app/presence/hello', body: '{}' })
    }

    client.activate()
    clientRef.current = client
    return () => { client.deactivate() }
  }, [])

  const sendCommand = useCallback((cmd: string) => {
    if (clientRef.current?.connected) {
      clientRef.current.publish({
        destination: '/app/presence/command',
        body: JSON.stringify({ cmd }),
      })
    }
  }, [])

  const sendPath = useCallback((path: string) => {
    if (clientRef.current?.connected) {
      clientRef.current.publish({
        destination: '/app/presence/path',
        body: JSON.stringify({ path }),
      })
    }
  }, [])

  const sendWave = useCallback(() => {
    if (clientRef.current?.connected) {
      clientRef.current.publish({ destination: '/app/presence/wave', body: '{}' })
    }
  }, [])

  return { visitors, wsStatus, serverNick, commandFeed, sendCommand, sendPath, sendWave }
}
