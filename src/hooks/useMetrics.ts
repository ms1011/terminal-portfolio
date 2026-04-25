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
