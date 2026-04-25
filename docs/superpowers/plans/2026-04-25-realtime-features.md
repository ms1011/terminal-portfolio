# Realtime Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** SSE로 서버 메트릭을 실시간 스트리밍하는 `/metrics` 명령어와, WebSocket으로 방문자 명령어를 브로드캐스트하는 Activity Feed를 구현한다.

**Architecture:** 백엔드는 (A) Micrometer MeterRegistry를 읽어 1초마다 SSE로 emit하는 `MetricsController`와, (B) STOMP `/app/presence/command` 엔드포인트로 명령어를 받아 `/topic/presence`로 브로드캐스트하는 기능을 추가한다. 프론트엔드는 `useMetrics` 훅으로 EventSource를 관리하고, `usePresence` 훅으로 SockJS+STOMP 연결을 관리해 기존 mock 데이터를 모두 대체한다.

**Tech Stack:** Kotlin/Spring Boot 3.5, Micrometer, SseEmitter, Virtual Threads, @stomp/stompjs, sockjs-client, React 18, TypeScript

---

## File Map

**새로 생성:**
- `backend/src/main/kotlin/dev/msjang/portfolio/metrics/MetricsController.kt`
- `backend/src/test/kotlin/dev/msjang/portfolio/metrics/MetricsControllerTest.kt`
- `src/config.ts`
- `src/hooks/useMetrics.ts`
- `src/hooks/usePresence.ts`

**수정:**
- `backend/src/main/kotlin/dev/msjang/portfolio/presence/PresenceModel.kt` — CommandBroadcast, CommandRequest 추가
- `backend/src/main/kotlin/dev/msjang/portfolio/presence/PresenceController.kt` — /presence/command 엔드포인트 추가
- `vite.config.ts` — global: 'globalThis' 추가 (SockJS 필요)
- `src/types.ts` — MetricsData, MsgMetrics, CommandFeedItem 추가
- `src/components/Messages.tsx` — MsgMetrics 렌더러 추가
- `src/components/LeftPanel.tsx` — commandFeed props + 렌더링 추가
- `src/App.tsx` — hooks 연결, mock 제거, /metrics 명령어 추가

---

## Task 1: Backend — MetricsController (SSE)

**Files:**
- Create: `backend/src/main/kotlin/dev/msjang/portfolio/metrics/MetricsController.kt`
- Create: `backend/src/test/kotlin/dev/msjang/portfolio/metrics/MetricsControllerTest.kt`

- [ ] **Step 1: 테스트 작성**

`backend/src/test/kotlin/dev/msjang/portfolio/metrics/MetricsControllerTest.kt`:
```kotlin
package dev.msjang.portfolio.metrics

import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.header
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status

@SpringBootTest
@AutoConfigureMockMvc
class MetricsControllerTest {

    @Autowired lateinit var mvc: MockMvc

    @Test
    fun `stream endpoint returns text event stream content type`() {
        val result = mvc.perform(
            get("/api/metrics/stream")
                .accept(MediaType.TEXT_EVENT_STREAM)
        )
            .andExpect(status().isOk)
            .andExpect(header().string("Content-Type", org.hamcrest.Matchers.containsString("text/event-stream")))
            .andReturn()

        // 비동기 SSE이므로 response가 시작되면 성공
        assert(result.response.contentType?.contains("text/event-stream") == true)
    }
}
```

- [ ] **Step 2: 테스트 실행 → FAIL 확인**

```bash
cd backend && ./gradlew test --tests "dev.msjang.portfolio.metrics.MetricsControllerTest" 2>&1 | tail -20
```
Expected: `FAILED` (MetricsController not found)

- [ ] **Step 3: MetricsController 구현**

`backend/src/main/kotlin/dev/msjang/portfolio/metrics/MetricsController.kt`:
```kotlin
package dev.msjang.portfolio.metrics

import io.micrometer.core.instrument.MeterRegistry
import org.springframework.http.MediaType
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter
import java.io.IOException
import java.time.Instant
import java.util.concurrent.Executors

@RestController
@RequestMapping("/api/metrics")
class MetricsController(private val registry: MeterRegistry) {

    private val executor = Executors.newVirtualThreadPerTaskExecutor()
    private val startedAt = Instant.now().toEpochMilli()

    @GetMapping("/stream", produces = [MediaType.TEXT_EVENT_STREAM_VALUE])
    fun stream(): SseEmitter {
        val emitter = SseEmitter(60_000L)

        executor.submit {
            try {
                while (!Thread.interrupted()) {
                    val heapUsed = registry.find("jvm.memory.used").tag("area", "heap").gauge()?.value() ?: 0.0
                    val heapMax  = registry.find("jvm.memory.max").tag("area", "heap").gauge()?.value() ?: 1.0
                    val cpu      = registry.find("process.cpu.usage").gauge()?.value() ?: 0.0
                    val reqCount = registry.find("http.server.requests").timer()?.count() ?: 0L

                    emitter.send(
                        SseEmitter.event().name("metrics").data(mapOf(
                            "heapUsedMb" to (heapUsed / 1024 / 1024).toLong(),
                            "heapMaxMb"  to (heapMax  / 1024 / 1024).toLong(),
                            "heapPct"    to if (heapMax > 0) (heapUsed / heapMax * 100).toInt() else 0,
                            "cpuPct"     to (cpu * 100).toInt().coerceIn(0, 100),
                            "reqCount"   to reqCount,
                            "uptimeMs"   to Instant.now().toEpochMilli() - startedAt,
                        ))
                    )
                    Thread.sleep(1000)
                }
            } catch (_: IOException) {
                emitter.completeWithError(IOException("client disconnected"))
            } catch (_: InterruptedException) {
                emitter.complete()
            }
        }

        return emitter
    }
}
```

- [ ] **Step 4: 테스트 실행 → PASS 확인**

```bash
cd backend && ./gradlew test --tests "dev.msjang.portfolio.metrics.MetricsControllerTest" 2>&1 | tail -20
```
Expected: `BUILD SUCCESSFUL`

- [ ] **Step 5: 커밋**

```bash
git add backend/src/main/kotlin/dev/msjang/portfolio/metrics/MetricsController.kt \
        backend/src/test/kotlin/dev/msjang/portfolio/metrics/MetricsControllerTest.kt
git commit -m "feat(backend): add /api/metrics/stream SSE endpoint with Virtual Threads"
```

---

## Task 2: Backend — Presence Command Broadcast

**Files:**
- Modify: `backend/src/main/kotlin/dev/msjang/portfolio/presence/PresenceModel.kt`
- Modify: `backend/src/main/kotlin/dev/msjang/portfolio/presence/PresenceController.kt`

- [ ] **Step 1: PresenceModel에 CommandBroadcast, CommandRequest 추가**

`PresenceModel.kt` 파일의 `// ── Client → Server payloads` 섹션 아래에 추가:
```kotlin
data class CommandBroadcast(val event: String = "command.broadcast", val nick: String, val cmd: String)

// 기존 PathChangeRequest 뒤에:
data class CommandRequest(val cmd: String = "")
```

- [ ] **Step 2: PresenceController에 command 엔드포인트 추가**

`PresenceController.kt`의 `onPong()` 메서드 바로 다음에 추가:
```kotlin
@MessageMapping("/presence/command")
fun onCommand(request: CommandRequest, accessor: SimpMessageHeaderAccessor) {
    val sessionId = accessor.sessionId ?: return
    val session = registry.all().find { it.sessionId == sessionId } ?: return
    broadcast(CommandBroadcast(nick = session.nickname, cmd = request.cmd))
}
```

- [ ] **Step 3: 전체 백엔드 빌드 확인**

```bash
cd backend && ./gradlew build 2>&1 | tail -20
```
Expected: `BUILD SUCCESSFUL`

- [ ] **Step 4: 커밋**

```bash
git add backend/src/main/kotlin/dev/msjang/portfolio/presence/PresenceModel.kt \
        backend/src/main/kotlin/dev/msjang/portfolio/presence/PresenceController.kt
git commit -m "feat(backend): broadcast visitor command events over WebSocket"
```

---

## Task 3: Frontend — 의존성 설치 + 설정

**Files:**
- Modify: `package.json` (npm install로 자동 수정)
- Modify: `vite.config.ts`
- Create: `src/config.ts`

- [ ] **Step 1: STOMP + SockJS 패키지 설치**

```bash
cd /Users/ms/Projects/terminal-portfolio
npm install @stomp/stompjs sockjs-client
npm install --save-dev @types/sockjs-client
```
Expected: `added N packages`

- [ ] **Step 2: vite.config.ts에 global 정의 추가** (SockJS는 Node.js의 `global`을 참조)

현재 `vite.config.ts`를 읽고 `plugins` 앞에 `define` 블록 추가:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
  },
})
```

- [ ] **Step 3: src/config.ts 생성**

```typescript
export const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? 'http://localhost:8080'
```

- [ ] **Step 4: 프론트엔드 빌드 확인**

```bash
cd /Users/ms/Projects/terminal-portfolio && npm run build 2>&1 | tail -20
```
Expected: `built in Xs`

- [ ] **Step 5: 커밋**

```bash
git add package.json package-lock.json vite.config.ts src/config.ts
git commit -m "feat(frontend): add @stomp/stompjs, sockjs-client and API_BASE config"
```

---

## Task 4: Frontend — 타입 정의 추가

**Files:**
- Modify: `src/types.ts`

- [ ] **Step 1: MetricsData, MsgMetrics, CommandFeedItem 추가**

`src/types.ts`의 맨 위 (import 없음) 또는 `Visitor` 인터페이스 위에 추가:
```typescript
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
```

`types.ts`의 Message 타입들 블록에 MsgMetrics 추가:
```typescript
export interface MsgMetrics { id: number; type: 'metrics'; data: MetricsData | null }
```

`Message` union type에 `MsgMetrics` 추가:
```typescript
export type Message =
  | MsgSystem
  | MsgCommand
  | MsgText
  | MsgCard
  | MsgTable
  | MsgPresence
  | MsgLetter
  | MsgWave
  | MsgMetrics   // ← 추가
```

`MessageInput` union type에도 추가:
```typescript
export type MessageInput =
  | Omit<MsgSystem,   'id'>
  | Omit<MsgCommand,  'id'>
  | Omit<MsgText,     'id'>
  | Omit<MsgCard,     'id'>
  | Omit<MsgTable,    'id'>
  | Omit<MsgPresence, 'id'>
  | Omit<MsgLetter,   'id'>
  | Omit<MsgWave,     'id'>
  | Omit<MsgMetrics,  'id'>   // ← 추가
```

- [ ] **Step 2: TypeScript 타입 오류 없는지 확인**

```bash
cd /Users/ms/Projects/terminal-portfolio && npx tsc --noEmit 2>&1
```
Expected: no output (no errors)

- [ ] **Step 3: 커밋**

```bash
git add src/types.ts
git commit -m "feat(frontend): add MetricsData, MsgMetrics, CommandFeedItem types"
```

---

## Task 5: Frontend — useMetrics 훅

**Files:**
- Create: `src/hooks/useMetrics.ts`

- [ ] **Step 1: src/hooks/ 디렉토리 생성 확인**

```bash
mkdir -p /Users/ms/Projects/terminal-portfolio/src/hooks
```

- [ ] **Step 2: useMetrics 훅 구현**

`src/hooks/useMetrics.ts`:
```typescript
import { useEffect, useRef, useState } from 'react'
import { API_BASE } from '../config'
import type { MetricsData } from '../types'

export function useMetrics() {
  const [data, setData] = useState<MetricsData | null>(null)
  const esRef = useRef<EventSource | null>(null)

  const start = () => {
    if (esRef.current) return
    const es = new EventSource(`${API_BASE}/api/metrics/stream`)
    es.addEventListener('metrics', (e: MessageEvent) => {
      setData(JSON.parse(e.data) as MetricsData)
    })
    es.onerror = () => {
      es.close()
      esRef.current = null
    }
    esRef.current = es
  }

  const stop = () => {
    esRef.current?.close()
    esRef.current = null
    setData(null)
  }

  useEffect(() => () => { esRef.current?.close() }, [])

  return { data, start, stop }
}
```

- [ ] **Step 3: TypeScript 오류 없는지 확인**

```bash
cd /Users/ms/Projects/terminal-portfolio && npx tsc --noEmit 2>&1
```
Expected: no output

- [ ] **Step 4: 커밋**

```bash
git add src/hooks/useMetrics.ts
git commit -m "feat(frontend): add useMetrics hook for SSE metrics stream"
```

---

## Task 6: Frontend — usePresence 훅

**Files:**
- Create: `src/hooks/usePresence.ts`

- [ ] **Step 1: usePresence 훅 구현**

`src/hooks/usePresence.ts`:
```typescript
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

  // 1초마다 idle 갱신
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
      client.subscribe('/topic/presence', (msg) => {
        const p = JSON.parse(msg.body)
        switch (p.event) {
          case 'session.assigned':
            setServerNick(p.nick)
            break
          case 'presence.snapshot':
            setVisitors((p.users as any[]).map(u => ({
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
              ...prev.slice(-7),
              { nick: p.nick, cmd: p.cmd, ts: Date.now() },
            ])
            break
        }
      })
    }

    client.activate()
    clientRef.current = client
    return () => { client.deactivate() }
  }, [])

  const sendCommand = useCallback((cmd: string) => {
    clientRef.current?.publish({
      destination: '/app/presence/command',
      body: JSON.stringify({ cmd }),
    })
  }, [])

  const sendPath = useCallback((path: string) => {
    clientRef.current?.publish({
      destination: '/app/presence/path',
      body: JSON.stringify({ path }),
    })
  }, [])

  const sendWave = useCallback(() => {
    clientRef.current?.publish({ destination: '/app/presence/wave', body: '{}' })
  }, [])

  return { visitors, wsStatus, serverNick, commandFeed, sendCommand, sendPath, sendWave }
}
```

- [ ] **Step 2: TypeScript 오류 없는지 확인**

```bash
cd /Users/ms/Projects/terminal-portfolio && npx tsc --noEmit 2>&1
```
Expected: no output

- [ ] **Step 3: 커밋**

```bash
git add src/hooks/usePresence.ts
git commit -m "feat(frontend): add usePresence hook for STOMP/SockJS WebSocket connection"
```

---

## Task 7: Frontend — MsgMetrics 렌더러

**Files:**
- Modify: `src/components/Messages.tsx`

- [ ] **Step 1: MsgMetrics import 추가 및 헬퍼 함수 추가**

`Messages.tsx`의 import 줄을 아래로 교체:
```typescript
import type {
  Message, MsgSystem, MsgCommand, MsgText,
  MsgCard, MsgTable, MsgPresence, MsgLetter, MsgWave, MsgMetrics,
} from '../types'
```

`MsgWave` 컴포넌트 함수 바로 아래, `export default function MessageView` 위에 추가:

```typescript
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

function MsgMetrics({ data }: Pick<MsgMetrics, 'data'>) {
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
```

- [ ] **Step 2: MessageView switch에 metrics 케이스 추가**

`export default function MessageView` 의 switch 마지막 `case 'wave':` 줄 다음에 추가:
```typescript
    case 'metrics': return <MsgMetrics data={msg.data} />
```

- [ ] **Step 3: TypeScript 오류 없는지 확인**

```bash
cd /Users/ms/Projects/terminal-portfolio && npx tsc --noEmit 2>&1
```
Expected: no output

- [ ] **Step 4: 커밋**

```bash
git add src/components/Messages.tsx
git commit -m "feat(frontend): add MsgMetrics live bar-chart renderer"
```

---

## Task 8: Frontend — LeftPanel Activity Feed

**Files:**
- Modify: `src/components/LeftPanel.tsx`

- [ ] **Step 1: LeftPanel Props에 commandFeed 추가 및 렌더링**

`src/components/LeftPanel.tsx` 전체를 아래로 교체:
```typescript
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
        <div style={{ color: 'var(--green-dim)', fontSize: 11, marginBottom: 3 }}>Hello, Reviewer.</div>
        <div style={{ color: 'var(--amber)', fontSize: 12, fontWeight: 700, lineHeight: 1.5 }} className="g-amber">
          This site IS the demo.
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
```

- [ ] **Step 2: TypeScript 오류 없는지 확인**

```bash
cd /Users/ms/Projects/terminal-portfolio && npx tsc --noEmit 2>&1
```
Expected: LeftPanel의 `commandFeed` prop이 없다는 오류 1개 (App.tsx에서 아직 전달 안 함)

- [ ] **Step 3: 커밋**

```bash
git add src/components/LeftPanel.tsx
git commit -m "feat(frontend): add activity feed to LeftPanel"
```

---

## Task 9: Frontend — App.tsx 전체 연결

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: import 추가**

`App.tsx` 상단 import 블록을 아래로 교체:
```typescript
import { useState, useEffect, useRef } from 'react'
import type { Message, MessageInput, WsStatus } from './types'
import { PROJECTS, STACK_LINES, SLASH_CMDS } from './data'
import MacWindow from './components/MacWindow'
import LeftPanel from './components/LeftPanel'
import RightPanel from './components/RightPanel'
import CommandInput from './components/CommandInput'
import TweaksPanel from './components/TweaksPanel'
import { useMetrics } from './hooks/useMetrics'
import { usePresence } from './hooks/usePresence'
```

- [ ] **Step 2: App 컴포넌트 hooks 교체 및 mock 제거**

`App()` 함수 내 상태 선언 블록을 아래로 교체 (기존 `visitors` useState와 fake simulation useEffect 2개 제거):
```typescript
  const myNick = useRef(randNick()).current

  const [messages, setMessages]           = useState<Message[]>(() => makeInitialMessages(myNick))
  const [history, setHistory]             = useState<string[]>([])
  const [currentCmd, setCurrentCmd]       = useState<string | null>(null)
  const [_retryCount, setRetryCount]      = useState(0)
  const [tweaksVisible, setTweaksVisible] = useState(false)

  const metricsIdRef = useRef<number | null>(null)
  const { data: metricsData, start: startMetrics } = useMetrics()

  const { visitors, wsStatus, serverNick, commandFeed, sendCommand, sendPath, sendWave } =
    usePresence((nick) => push({ type: 'wave', from: nick }))

  const displayNick = serverNick ?? myNick
```

- [ ] **Step 3: metricsData 변경 시 메시지 업데이트 effect 추가**

기존 `idle ticker` useEffect 블록 자리 (또는 `tweaks bridge` useEffect 위)에 추가:
```typescript
  useEffect(() => {
    if (metricsData && metricsIdRef.current !== null) {
      const id = metricsIdRef.current
      setMessages(prev =>
        prev.map(m => (m.id === id ? { ...m, data: metricsData } as Message : m))
      )
    }
  }, [metricsData])
```

- [ ] **Step 4: handleCommand에 metrics 케이스 + sendCommand 추가**

`handleCommand` 함수 내 `push({ type: 'command', text: cmd })` 바로 다음 줄에 추가:
```typescript
    sendCommand(cmd)
```

switch의 `/wave` case를 아래로 교체:
```typescript
      case '/wave':
        push({ type: 'wave', from: displayNick })
        sendWave()
        sendPath('/wave')
        setTimeout(() => sendPath('/about'), 2000)
        break
```

`/whoami` case를 아래로 교체:
```typescript
      case '/whoami':
        push({ type: 'text', lines: [
          { text: `nickname : ${displayNick}`, color: 'var(--amber)' },
          { text: `session  : active since ${fmtT()}`, color: 'var(--green-dim)' },
          { text: `uptime   : ${Math.floor((UPTIME_BASE + (Date.now() - startTime) / 1000) / 86400)}d server`, color: 'var(--green-dim)' },
        ]})
        break
```

`/yapp` case를 아래로 교체:
```typescript
      case '/yapp':
        push({ type: 'letter', myNick: displayNick })
        break
```

switch의 `/projects` case 다음에 `/metrics` case 추가:
```typescript
      case '/metrics': {
        const id = mkId()
        metricsIdRef.current = id
        startMetrics()
        setMessages(prev => [...prev, { id, type: 'metrics', data: null }])
        break
      }
```

- [ ] **Step 5: LeftPanel에 commandFeed prop 전달**

JSX의 `<LeftPanel>` 호출을 아래로 교체:
```tsx
          <LeftPanel
            myNick={displayNick}
            online={visitors.length}
            wsStatus={wsStatus}
            currentCmd={currentCmd}
            commandFeed={commandFeed}
          />
```

- [ ] **Step 6: TweaksPanel 상태 처리**

`wsStatus`는 이제 `usePresence`에서 관리되므로, TweaksPanel의 시뮬레이션은 별도 local state로 분리한다. `App()` 내 상태 선언 블록 끝에 추가:
```typescript
  const [_retryCount, setRetryCount] = useState(0)
```

JSX의 `<TweaksPanel>` 호출을 아래로 교체 (setWsStatus는 no-op으로 처리 — 실제 WebSocket 상태와 분리):
```tsx
          <TweaksPanel
            wsStatus={wsStatus}
            setWsStatus={() => {}}
            setRetryCount={setRetryCount}
            onExternalWave={externalWave}
          />
```

- [ ] **Step 7: /help에 /metrics 설명 추가**

`SLASH_CMDS` 는 `data.ts`에 있으므로 `data.ts`에서 `/metrics` 항목 추가:

`src/data.ts`의 `SLASH_CMDS` 배열에 항목 추가:
```typescript
  { cmd: '/metrics', desc: '서버 메트릭 실시간 스트림' },
```

- [ ] **Step 8: TypeScript 오류 없는지 확인**

```bash
cd /Users/ms/Projects/terminal-portfolio && npx tsc --noEmit 2>&1
```
Expected: no output

- [ ] **Step 9: 빌드 확인**

```bash
cd /Users/ms/Projects/terminal-portfolio && npm run build 2>&1 | tail -20
```
Expected: `built in Xs`

- [ ] **Step 10: 커밋**

```bash
git add src/App.tsx src/data.ts
git commit -m "feat(frontend): wire usePresence + useMetrics into App, add /metrics command"
```

---

## 수동 검증 체크리스트

백엔드와 프론트엔드를 동시에 실행:
```bash
# 터미널 1
cd backend && ./gradlew bootRun

# 터미널 2
cd /Users/ms/Projects/terminal-portfolio && npm run dev
```

- [ ] 브라우저에서 `http://localhost:5173` 열기
- [ ] LeftPanel 하단에 `[LIVE] N online` 표시 확인 (백엔드 연결 시)
- [ ] `/metrics` 입력 → `heap`, `cpu`, `req`, `up` 바 차트가 1초마다 업데이트 확인
- [ ] `/wave` 입력 → LeftPanel activity feed에 `myNick /wave` 항목 표시 확인
- [ ] 탭 두 개 열고 한쪽에서 `/about` 입력 → 다른 탭 activity feed에 표시 확인
- [ ] 백엔드 없이 실행 시 `wsStatus`가 `[RETRYING]`으로 표시 확인
