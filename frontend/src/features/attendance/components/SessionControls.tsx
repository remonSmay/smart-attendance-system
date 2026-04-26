import { useEffect, useMemo, useState, type FormEvent } from 'react'

import { createSession, getActiveSessions, updateSession } from '../api/attendanceSessionApi'
import type {
  AttendanceSessionCreate,
  AttendanceSessionResponse,
} from '../types/attendanceSessionTypes'
import { authStore } from '../../../store/authStore'
import './SessionControls.css'

export interface SessionControlsProps {
  sectionId: string
  title?: string
  description?: string
  onSessionChange?: (session: AttendanceSessionResponse | null) => void
}

interface SessionFormState {
  title: string
  start_time: string
  end_time: string
}

const getDefaultDateTimeValue = (date: Date): string => {
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return offsetDate.toISOString().slice(0, 16)
}

const createInitialFormState = (): SessionFormState => {
  const startDate = new Date()
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000)

  return {
    title: '',
    start_time: getDefaultDateTimeValue(startDate),
    end_time: getDefaultDateTimeValue(endDate),
  }
}

const formatDateTime = (value: string): string =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))

const formatCountdown = (milliseconds: number): string => {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return [hours, minutes, seconds].map((unit) => String(unit).padStart(2, '0')).join(':')
}

export function SessionControls({
  sectionId,
  title = 'Attendance Session',
  description = 'Open a live attendance window for this section.',
  onSessionChange,
}: SessionControlsProps) {
  const currentUser = authStore.getUser()
  const [formState, setFormState] = useState<SessionFormState>(() => createInitialFormState())
  const [activeSession, setActiveSession] = useState<AttendanceSessionResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    let cancelled = false

    const loadActiveSession = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const sessions = await getActiveSessions()
        const matchingSession = sessions.find((session) => session.section_id === sectionId) ?? null

        if (!cancelled) {
          setActiveSession(matchingSession)
          onSessionChange?.(matchingSession)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load attendance sessions.')
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadActiveSession()

    return () => {
      cancelled = true
    }
  }, [onSessionChange, sectionId])

  useEffect(() => {
    if (!activeSession) {
      return
    }

    const timerId = window.setInterval(() => {
      setNow(Date.now())
    }, 1000)

    return () => {
      window.clearInterval(timerId)
    }
  }, [activeSession])

  const countdown = useMemo(() => {
    if (!activeSession) {
      return null
    }

    return formatCountdown(new Date(activeSession.end_time).getTime() - now)
  }, [activeSession, now])

  const handleChange = (field: keyof SessionFormState, value: string) => {
    setFormState((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const handleCreateSession = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!currentUser) {
      setError('You must be logged in to start a session.')
      return
    }

    if (!formState.title.trim()) {
      setError('Session title is required.')
      return
    }

    const startTime = new Date(formState.start_time)
    const endTime = new Date(formState.end_time)

    if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) {
      setError('Start and end time must be valid.')
      return
    }

    if (endTime <= startTime) {
      setError('End time must be after the start time.')
      return
    }

    const payload: AttendanceSessionCreate = {
      section_id: sectionId,
      created_by_id: String(currentUser.id),
      title: formState.title.trim(),
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const createdSession = await createSession(payload)
      setActiveSession(createdSession)
      setNow(Date.now())
      setFormState(createInitialFormState())
      onSessionChange?.(createdSession)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create attendance session.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStopSession = async () => {
    if (!activeSession) {
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      await updateSession(activeSession.id, { is_active: false })
      setActiveSession(null)
      setFormState(createInitialFormState())
      onSessionChange?.(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop attendance session.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="session-controls" aria-live="polite">
      <div className="session-controls-header">
        <div>
          <h3>{title}</h3>
          <p className="session-controls-description">{description}</p>
        </div>

        <span className={`session-controls-status ${activeSession ? 'active' : 'idle'}`}>
          {activeSession && <span className="session-controls-status-dot" aria-hidden="true" />}
          {activeSession ? 'Session Active' : 'No Active Session'}
        </span>
      </div>

      {error && <p className="session-controls-feedback error">{error}</p>}
      {isLoading && <p className="session-controls-feedback info">Loading session status...</p>}

      {!isLoading && !activeSession && (
        <form className="session-controls-form" onSubmit={handleCreateSession}>
          <div className="session-controls-grid">
            <div className="session-controls-field full-width">
              <label htmlFor={`session-title-${sectionId}`}>Title</label>
              <input
                id={`session-title-${sectionId}`}
                type="text"
                value={formState.title}
                onChange={(event) => handleChange('title', event.target.value)}
                placeholder="Attendance window"
                maxLength={120}
                required
              />
            </div>

            <div className="session-controls-field">
              <label htmlFor={`session-start-${sectionId}`}>Start time</label>
              <input
                id={`session-start-${sectionId}`}
                type="datetime-local"
                value={formState.start_time}
                onChange={(event) => handleChange('start_time', event.target.value)}
                required
              />
            </div>

            <div className="session-controls-field">
              <label htmlFor={`session-end-${sectionId}`}>End time</label>
              <input
                id={`session-end-${sectionId}`}
                type="datetime-local"
                value={formState.end_time}
                onChange={(event) => handleChange('end_time', event.target.value)}
                required
              />
            </div>
          </div>

          <div className="session-controls-actions">
            <button className="session-controls-button primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Starting...' : 'Start Session'}
            </button>
          </div>
        </form>
      )}

      {!isLoading && activeSession && (
        <div className="session-controls-active-card">
          <div className="session-controls-active-meta">
            <h4>{activeSession.title}</h4>
            <p>Started {formatDateTime(activeSession.start_time)}</p>
            <p>Ends {formatDateTime(activeSession.end_time)}</p>
          </div>

          <div className="session-controls-countdown">
            <span className="session-controls-countdown-label">Time Remaining</span>
            <span className="session-controls-countdown-value">{countdown}</span>
          </div>

          <div className="session-controls-actions">
            <button
              className="session-controls-button stop"
              type="button"
              onClick={handleStopSession}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Stopping...' : 'Stop Session'}
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

export default SessionControls
