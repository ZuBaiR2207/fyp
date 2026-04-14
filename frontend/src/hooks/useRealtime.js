import { useEffect, useMemo, useState } from 'react'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

const WS_URL = import.meta.env.VITE_NOTIFICATION_WS_URL ?? 'http://localhost:8083/ws'

export function useRealtime() {
  const [latestReminders, setLatestReminders] = useState([])
  const [statusEvents, setStatusEvents] = useState([])
  const [chatMessages, setChatMessages] = useState([])

  const client = useMemo(() => {
    return new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      reconnectDelay: 4000,
      debug: () => undefined,
    })
  }, [])

  useEffect(() => {
    client.onConnect = () => {
      client.subscribe('/topic/reminders', (message) => {
        try {
          setLatestReminders(JSON.parse(message.body))
        } catch {
          // ignore
        }
      })

      client.subscribe('/topic/status', (message) => {
        try {
          const parsed = JSON.parse(message.body)
          setStatusEvents((prev) => [parsed, ...prev].slice(0, 30))
        } catch {
          // ignore
        }
      })

      client.subscribe('/topic/chat', (message) => {
        try {
          const parsed = JSON.parse(message.body)
          setChatMessages((prev) => {
            const merged = [parsed, ...prev]
            const seen = new Set()
            return merged.filter((item) => {
              if (!item?.id || seen.has(item.id)) return false
              seen.add(item.id)
              return true
            }).slice(0, 80)
          })
        } catch {
          // ignore
        }
      })
    }

    client.activate()
    return () => client.deactivate()
  }, [client])

  return { latestReminders, statusEvents, chatMessages }
}

