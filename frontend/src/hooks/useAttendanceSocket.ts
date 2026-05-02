import { useEffect, useRef, useState } from 'react'

import { API_BASE_URL } from '../shared/config/env'
import { authStore } from '../store/authStore'

export interface AttendanceSocketMessage {
  type: string
  student_id: string
  student_name: string
  method: string
  status: string
  timestamp: string
  total_present?: number
  total_students?: number
}

export interface UseAttendanceSocketResult {
  presentStudents: AttendanceSocketMessage[]
  totalStudents: number
  isConnected: boolean
}

const getWebSocketBaseUrl = (apiBaseUrl: string): string => {
  const trimmed = apiBaseUrl.replace(/\/+$/, '')
  return trimmed.replace(/^http(s?)/i, (_, secure: string) => (secure ? 'wss' : 'ws'))
}

const buildSessionWsUrl = (sessionId: string, token: string): string => {
  const wsBase = getWebSocketBaseUrl(API_BASE_URL)
  const encodedToken = encodeURIComponent(token)
  return `${wsBase}/ws/session/${sessionId}?token=${encodedToken}`
}

export const useAttendanceSocket = (sessionId: string | null): UseAttendanceSocketResult => {
  const [presentStudentsBySession, setPresentStudentsBySession] = useState<
    Record<string, AttendanceSocketMessage[]>
  >({})
  const [totalStudentsBySession, setTotalStudentsBySession] = useState<Record<string, number>>({})
  const [isConnected, setIsConnected] = useState(false)
  const socketRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<number | null>(null)
  const reconnectAttemptRef = useRef(0)
  const shouldReconnectRef = useRef(true)

  const accessToken = authStore.getAccessToken()

  const presentStudents = sessionId ? presentStudentsBySession[sessionId] ?? [] : []
  const totalStudents = sessionId ? totalStudentsBySession[sessionId] ?? 0 : 0

  useEffect(() => {
    if (!sessionId || !accessToken) {
      return
    }

    shouldReconnectRef.current = true

    const scheduleReconnect = () => {
      if (!shouldReconnectRef.current) {
        return
      }

      if (reconnectTimeoutRef.current) {
        window.clearTimeout(reconnectTimeoutRef.current)
      }

      reconnectAttemptRef.current += 1
      const delay = Math.min(30000, 1000 * Math.pow(2, reconnectAttemptRef.current - 1))

      reconnectTimeoutRef.current = window.setTimeout(() => {
        if (shouldReconnectRef.current) {
          connect()
        }
      }, delay)
    }

    const connect = () => {
      const wsUrl = buildSessionWsUrl(sessionId, accessToken)
      const socket = new WebSocket(wsUrl)
      socketRef.current = socket

      socket.onopen = () => {
        reconnectAttemptRef.current = 0
        setIsConnected(true)
      }

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data) as AttendanceSocketMessage
          if (!payload || typeof payload !== 'object') {
            return
          }

          setPresentStudentsBySession((prev) => {
            const current = prev[sessionId] ?? []
            return { ...prev, [sessionId]: [...current, payload] }
          })

          const totalStudentsValue = payload.total_students

          if (typeof totalStudentsValue === 'number') {
            setTotalStudentsBySession((prev) => ({ ...prev, [sessionId]: totalStudentsValue }))
          } else if (totalStudentsValue !== undefined) {
            const parsed = Number(totalStudentsValue)
            if (!Number.isNaN(parsed)) {
              setTotalStudentsBySession((prev) => ({ ...prev, [sessionId]: parsed }))
            }
          }
        } catch {
          // Ignore malformed messages
        }
      }

      socket.onerror = () => {
        socket.close()
      }

      socket.onclose = () => {
        setIsConnected(false)
        if (shouldReconnectRef.current) {
          scheduleReconnect()
        }
      }
    }

    connect()

    return () => {
      shouldReconnectRef.current = false

      if (reconnectTimeoutRef.current) {
        window.clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }

      if (socketRef.current) {
        socketRef.current.onopen = null
        socketRef.current.onmessage = null
        socketRef.current.onerror = null
        socketRef.current.onclose = null
        socketRef.current.close()
        socketRef.current = null
      }
    }
  }, [sessionId, accessToken])

  return { presentStudents, totalStudents, isConnected }
}
