import { useEffect, useMemo, useState } from 'react'

import Button from '../components/ui/Button'
import MetricCard from '../components/ui/MetricCard'
import PageHeader from '../components/ui/PageHeader'
import WorkspaceShell, { type WorkspaceNavItem } from '../components/ui/WorkspaceShell'
import { useAuthActions } from '../features/auth/hooks/useAuthActions'
import { getAttendanceSessionsHistory } from '../features/attendance/api/attendanceSessionApi'
import type { AttendanceSessionHistoryResponse } from '../features/attendance/types/attendanceSessionTypes'
import { authStore } from '../store/authStore'
import { exportToCSV } from '../utils/exportToCSV'
import './HistoryPage.css'

const IconDashboard = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1" /><rect width="7" height="5" x="14" y="3" rx="1" /><rect width="7" height="9" x="14" y="12" rx="1" /><rect width="7" height="5" x="3" y="16" rx="1" /></svg>
)

const IconTimer = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2h4" /><path d="M12 14v-4" /><path d="M12 2v2" /><circle cx="12" cy="14" r="8" /></svg>
)

const IconHistory = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v5h5" /><path d="M3.05 13a9 9 0 1 0 2.13-5.3L3 10" /><path d="M12 7v5l4 2" /></svg>
)

const IconSettings = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 1.72l-.12.81a2 2 0 0 1-1.34 1.56l-.77.26a2 2 0 0 1-1.99-.33l-.64-.49a2 2 0 0 0-2.73.18l-.31.31a2 2 0 0 0-.18 2.73l.49.64a2 2 0 0 1 .33 1.99l-.26.77a2 2 0 0 1-1.56 1.34l-.81.12a2 2 0 0 0-1.72 2v.44a2 2 0 0 0 1.72 2l.81.12a2 2 0 0 1 1.56 1.34l.26.77a2 2 0 0 1-.33 1.99l-.49.64a2 2 0 0 0 .18 2.73l.31.31a2 2 0 0 0 2.73.18l.64-.49a2 2 0 0 1 1.99-.33l.77.26a2 2 0 0 1 1.34 1.56l.12.81a2 2 0 0 0 2 1.72h.44a2 2 0 0 0 2-1.72l.12-.81a2 2 0 0 1 1.34-1.56l.77-.26a2 2 0 0 1 1.99.33l.64.49a2 2 0 0 0 2.73-.18l.31-.31a2 2 0 0 0 .18-2.73l-.49-.64a2 2 0 0 1-.33-1.99l.26-.77a2 2 0 0 1 1.56-1.34l.81-.12a2 2 0 0 0 1.72-2v-.44a2 2 0 0 0-1.72-2l-.81-.12a2 2 0 0 1-1.56-1.34l-.26-.77a2 2 0 0 1 .33-1.99l.49-.64a2 2 0 0 0-.18-2.73l-.31-.31a2 2 0 0 0-2.73-.18l-.64.49a2 2 0 0 1-1.99.33l-.77-.26a2 2 0 0 1-1.34-1.56l-.12-.81a2 2 0 0 0-2-1.72Z" /><circle cx="12" cy="12" r="3" /></svg>
)

const IconCalendar = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v4" /><path d="M16 2v4" /><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M3 10h18" /></svg>
)

const IconPercent = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="5" x2="5" y2="19" /><circle cx="6.5" cy="6.5" r="2.5" /><circle cx="17.5" cy="17.5" r="2.5" /></svg>
)

const IconStar = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.1 8.3 22 9.3 17 14.2 18.2 21 12 17.8 5.8 21 7 14.2 2 9.3 8.9 8.3 12 2" /></svg>
)

const formatDate = (value: string) => {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(parsed)
}

const getSessionPercentage = (session: AttendanceSessionHistoryResponse): number | null => {
  const percentage = session.attendance_percentage ?? session.percentage
  if (typeof percentage === 'number' && Number.isFinite(percentage)) {
    return percentage
  }

  const presentCount = session.present_count ?? session.present
  const totalCount = session.total_students
  if (
    typeof presentCount === 'number' &&
    Number.isFinite(presentCount) &&
    typeof totalCount === 'number' &&
    Number.isFinite(totalCount) &&
    totalCount > 0
  ) {
    return (presentCount / totalCount) * 100
  }

  return null
}

const getBestDayLabel = (sessions: AttendanceSessionHistoryResponse[]) => {
  let bestDay = 'N/A'
  let bestScore = -1

  sessions.forEach((session) => {
    const percentage = getSessionPercentage(session)
    const parsedDate = new Date(session.start_time)
    if (percentage === null || Number.isNaN(parsedDate.getTime())) {
      return
    }

    if (percentage > bestScore) {
      bestScore = percentage
      bestDay = new Intl.DateTimeFormat(undefined, { weekday: 'long' }).format(parsedDate)
    }
  })

  return bestDay
}

const getStatusLabel = (session: AttendanceSessionHistoryResponse) => {
  if (session.status) {
    return session.status
  }
  return session.is_active ? 'Active' : 'Completed'
}

const getStatusClassName = (status: string) => {
  const normalizedStatus = status.trim().toLowerCase()
  if (normalizedStatus === 'active') {
    return 'history-page__status--active'
  }

  if (normalizedStatus === 'completed' || normalizedStatus === 'closed') {
    return 'history-page__status--completed'
  }

  return 'history-page__status--neutral'
}

const downloadSessionsCsv = (sessions: AttendanceSessionHistoryResponse[]) => {
  const datePart = new Date().toISOString().slice(0, 10)
  const exportRows = sessions.map((session) => {
    const percentage = getSessionPercentage(session)
    const presentCount = session.present_count ?? session.present
    const totalCount = session.total_students

    return {
      date: formatDate(session.start_time),
      title: session.title,
      section: session.section_name ?? session.section ?? session.section_id,
      present: typeof presentCount === 'number' ? presentCount : '',
      total: typeof totalCount === 'number' ? totalCount : '',
      percentage: percentage === null ? '' : percentage.toFixed(1),
      status: getStatusLabel(session),
    }
  })

  exportToCSV(exportRows, `attendance-sessions-history-${datePart}`)
}

export default function HistoryPage() {
  const { logout } = useAuthActions()
  const user = authStore.getUser()
  const [sessions, setSessions] = useState<AttendanceSessionHistoryResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)
  const [courseCodeFilter, setCourseCodeFilter] = useState('')
  const [startDateFilter, setStartDateFilter] = useState('')
  const [endDateFilter, setEndDateFilter] = useState('')

  useEffect(() => {
    let isActive = true

    const loadHistory = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await getAttendanceSessionsHistory({
          course_code: courseCodeFilter.trim() || undefined,
          start_date: startDateFilter || undefined,
          end_date: endDateFilter || undefined,
        })
        if (!isActive) {
          return
        }
        setSessions(response)
      } catch (requestError) {
        if (!isActive) {
          return
        }
        setError(requestError instanceof Error ? requestError.message : 'Failed to load attendance history.')
        setSessions([])
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    void loadHistory()

    return () => {
      isActive = false
    }
  }, [courseCodeFilter, endDateFilter, reloadToken, startDateFilter])

  const roleLabel = user?.role ? `${user.role.charAt(0).toUpperCase()}${user.role.slice(1)}` : 'User'
  const navigation = useMemo<WorkspaceNavItem[]>(() => {
    const items: WorkspaceNavItem[] = [
      {
        path: '/dashboard',
        label: 'Dashboard',
        shortLabel: 'Home',
        icon: <IconDashboard />,
        isActive: (pathname) => pathname === '/dashboard' || pathname.startsWith('/courses/'),
      },
      {
        path: '/session',
        label: 'Session',
        shortLabel: 'Session',
        icon: <IconTimer />,
        isActive: (pathname) => pathname.startsWith('/session'),
      },
      {
        path: '/history',
        label: 'History',
        shortLabel: 'History',
        icon: <IconHistory />,
        isActive: (pathname) => pathname.startsWith('/history'),
      },
    ]

    if (user?.role === 'admin') {
      items.push({
        path: '/admin/students',
        label: 'Admin',
        shortLabel: 'Admin',
        icon: <IconSettings />,
        isActive: (pathname) => pathname.startsWith('/admin'),
      })
    }

    return items
  }, [user?.role])

  const stats = useMemo(() => {
    const percentages = sessions
      .map((session) => getSessionPercentage(session))
      .filter((value): value is number => value !== null)

    const averageAttendance = percentages.length
      ? percentages.reduce((sum, value) => sum + value, 0) / percentages.length
      : 0

    return {
      totalSessions: sessions.length,
      averageAttendance,
      bestDay: getBestDayLabel(sessions),
    }
  }, [sessions])

  return (
    <WorkspaceShell
      brandingKicker="Attendance history"
      brandingTitle="Attendu"
      brandingSubtitle="Session records and outcomes"
      navigation={navigation}
      userName={user?.full_name ?? 'User'}
      userRole={roleLabel}
      topbarKicker="History"
      topbarTitle="Attendance Sessions History"
      topbarDescription="Review historical attendance sessions with date and course code filters."
      onLogout={logout}
    >
      <div className="history-page">
        <div className="ui-stat-grid">
          <MetricCard label="Total Sessions" value={stats.totalSessions} icon={<IconCalendar />} />
          <MetricCard label="Average Attendance %" value={`${stats.averageAttendance.toFixed(1)}%`} icon={<IconPercent />} />
          <MetricCard label="Best Day" value={stats.bestDay} icon={<IconStar />} />
        </div>

        <section className="ui-surface ui-section">
          <PageHeader
            eyebrow="Filters"
            title="Session filters"
            description="Filter attendance sessions by date range and course code using query parameters."
          />

          <div className="history-page__filters">
            <label className="ui-field">
              <span className="ui-field__label">Start date</span>
              <input
                type="date"
                className="ui-input"
                value={startDateFilter}
                onChange={(event) => setStartDateFilter(event.target.value)}
              />
            </label>

            <label className="ui-field">
              <span className="ui-field__label">End date</span>
              <input
                type="date"
                className="ui-input"
                value={endDateFilter}
                onChange={(event) => setEndDateFilter(event.target.value)}
              />
            </label>

            <label className="ui-field">
              <span className="ui-field__label">Course code</span>
              <input
                type="text"
                className="ui-input"
                placeholder="e.g. CS101"
                value={courseCodeFilter}
                onChange={(event) => setCourseCodeFilter(event.target.value)}
              />
            </label>

            <div className="history-page__filter-actions">
              <Button variant="secondary" onClick={() => setReloadToken((value) => value + 1)}>
                Refresh
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setStartDateFilter('')
                  setEndDateFilter('')
                  setCourseCodeFilter('')
                }}
              >
                Clear filters
              </Button>
            </div>
          </div>
        </section>

        <section className="ui-surface ui-section">
          <PageHeader
            eyebrow="Sessions"
            title="Attendance sessions table"
            description="Track attendance outcomes per session, section, and date."
            actions={(
              <Button
                variant="secondary"
                size="sm"
                disabled={isLoading || sessions.length === 0}
                onClick={() => downloadSessionsCsv(sessions)}
              >
                Export CSV
              </Button>
            )}
          />

          {error ? (
            <section className="ui-alert ui-alert--error" role="alert">
              <p className="ui-alert__content">{error}</p>
              <Button variant="secondary" size="sm" onClick={() => setReloadToken((value) => value + 1)}>
                Retry
              </Button>
            </section>
          ) : null}

          {!error && isLoading ? (
            <div className="ui-loading-grid">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="ui-skeleton-card">
                  <span className="ui-skeleton-line" style={{ width: '100%' }} />
                  <span className="ui-skeleton-line" style={{ width: '90%' }} />
                  <span className="ui-skeleton-line" style={{ width: '70%' }} />
                </div>
              ))}
            </div>
          ) : null}

          {!error && !isLoading && sessions.length === 0 ? (
            <section className="ui-empty">
              <h3>No attendance sessions found</h3>
              <p>Adjust the date range or course code filters, then try again.</p>
            </section>
          ) : null}

          {!error && !isLoading && sessions.length > 0 ? (
            <div className="history-page__table-shell">
              <table className="history-page__table">
                <thead>
                  <tr>
                    <th scope="col">Date</th>
                    <th scope="col">Title</th>
                    <th scope="col">Section</th>
                    <th scope="col">Present</th>
                    <th scope="col">Total</th>
                    <th scope="col">Percentage</th>
                    <th scope="col">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((session) => {
                    const percentage = getSessionPercentage(session)
                    const presentCount = session.present_count ?? session.present
                    const totalCount = session.total_students
                    const status = getStatusLabel(session)

                    return (
                      <tr key={session.id}>
                        <td>{formatDate(session.start_time)}</td>
                        <td>{session.title}</td>
                        <td>{session.section_name ?? session.section ?? session.section_id}</td>
                        <td>{typeof presentCount === 'number' ? presentCount : '-'}</td>
                        <td>{typeof totalCount === 'number' ? totalCount : '-'}</td>
                        <td>{percentage === null ? '-' : `${percentage.toFixed(1)}%`}</td>
                        <td>
                          <span className={`ui-badge history-page__status ${getStatusClassName(status)}`}>
                            {status}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
      </div>
    </WorkspaceShell>
  )
}
