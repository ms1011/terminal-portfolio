import { useEffect, useRef } from 'react'
import type { Message } from '../types'
import MessageView from './Messages'

interface Props {
  messages: Message[]
}

export default function RightPanel({ messages }: Props) {
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'nearest' })
  }, [messages])

  return (
    <div style={{
      flex: 1, overflowY: 'auto', overflowX: 'hidden',
      padding: '16px 18px',
      display: 'flex', flexDirection: 'column',
    }}>
      {messages.map((msg, i) => (
        <div key={msg.id} className={i === messages.length - 1 ? 'fade-up' : ''}>
          <MessageView msg={msg} />
        </div>
      ))}
      <div ref={endRef} />
    </div>
  )
}
