import { useEffect, useMemo, useState } from 'react'

import Button from '../components/ui/Button'
import WorkspaceShell, { type WorkspaceNavItem } from '../components/ui/WorkspaceShell'
import { ManualCheckIn } from '../features/attendance/components/ManualCheckIn'
import { AttendanceList } from '../features/attendance/components/AttendanceList'
import SessionControls from '../features/attendance/components/SessionControls'
import { SessionStats } from '../features/attendance/components/SessionStats'
import type { AttendanceSessionResponse } from '../features/attendance/types/attendanceSessionTypes'
import { listDevicesAdmin } from '../features/admin/api/devicesAdminApi'
import type { DeviceApiResponse } from '../features/admin/types/adminApiTypes'
import { useAuthActions } from '../features/auth/hooks/useAuthActions'
import { getSections } from '../features/sections/api/sectionApi'
import type { SectionResponse } from '../features/sections/types/sectionTypes'
import { useAttendanceSocket } from '../hooks/useAttendanceSocket'
import { authStore } from '../store/authStore'
import './SessionPage.css'

/* --- Icons --- */
const IconDashboard = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1" /><rect width="7" height="5" x="14" y="3" rx="1" /><rect width="7" height="9" x="14" y="12" rx="1" /><rect width="7" height="5" x="3" y="16" rx="1" /></svg>
)

const IconTimer = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2h4" /><path d="M12 14v-4" /><path d="M12 2v2" /><circle cx="12" cy="14" r="8" /></svg>
)

const IconHistory = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v5h5" /><path d="M3.05 13a9 9 0 1 0 2.13-5.3L3 10" /><path d="M12 7v5l4 2" /></svg>
)

const IconSearch = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
)

const IconSettings = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 1.72l-.12.81a2 2 0 0 1-1.34 1.56l-.77.26a2 2 0 0 1-1.99-.33l-.64-.49a2 2 0 0 0-2.73.18l-.31.31a2 2 0 0 0-.18 2.73l.49.64a2 2 0 0 1 .33 1.99l-.26.77a2 2 0 0 1-1.56 1.34l-.81.12a2 2 0 0 0-1.72 2v.44a2 2 0 0 0 1.72 2l.81.12a2 2 0 0 1 1.56 1.34l.26.77a2 2 0 0 1-.33 1.99l-.49.64a2 2 0 0 0 .18 2.73l.31.31a2 2 0 0 0 2.73.18l.64-.49a2 2 0 0 1 1.99-.33l.77.26a2 2 0 0 1 1.34 1.56l.12.81a2 2 0 0 0 2 1.72h.44a2 2 0 0 0 2-1.72l.12-.81a2 2 0 0 1 1.34-1.56l.77-.26a2 2 0 0 1 1.99.33l.64.49a2 2 0 0 0 2.73-.18l.31-.31a2 2 0 0 0 .18-2.73l-.49-.64a2 2 0 0 1-.33-1.99l.26-.77a2 2 0 0 1 1.56-1.34l.81-.12a2 2 0 0 0 1.72-2v-.44a2 2 0 0 0-1.72-2l-.81-.12a2 2 0 0 1-1.56-1.34l-.26-.77a2 2 0 0 1 .33-1.99l.49-.64a2 2 0 0 0-.18-2.73l-.31-.31a2 2 0 0 0-2.73-.18l-.64.49a2 2 0 0 1-1.99.33l-.77-.26a2 2 0 0 1-1.34-1.56l-.12-.81a2 2 0 0 0-2-1.72Z" /><circle cx="12" cy="12" r="3" /></svg>
)

const IconSignal = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 8.82a15 15 0 0 1 20 0" /><path d="M5 12.87a10 10 0 0 1 14 0" /><path d="M8.5 16.9a5 5 0 0 1 7 0" /><line x1="12" y1="21" x2="12.01" y2="21" /></svg>
)

/* --- Helpers --- */
const formatSchedule = (value: string): string =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))

const formatElapsed = (milliseconds: number): string => {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return [hours, minutes, seconds].map((unit) => String(unit).padStart(2, '0')).join(':')
}

export default function SessionPage() {
  const { logout } = useAuthActions()
  const user = authStore.getUser()
  const [sections, setSections] = useState<SectionResponse[]>([])
  const [selectedSectionId, setSelectedSectionId] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)
  const [activeSession, setActiveSession] = useState<AttendanceSessionResponse | null>(null)
  const [devices, setDevices] = useState<DeviceApiResponse[]>([])
  const [selectedDeviceId, setSelectedDeviceId] = useState('')
  const [isDeviceLoading, setIsDeviceLoading] = useState(true)
  const [deviceError, setDeviceError] = useState<string | null>(null)
  const [checkinSearch, setCheckinSearch] = useState('')
  const [checkInMode, setCheckInMode] = useState<'rfid' | 'rfid_face' | 'manual'>('manual')
  const [sessionNow, setSessionNow] = useState(() => Date.now())
  
  const { presentStudents, totalStudents, isConnected } = useAttendanceSocket(
    activeSession?.id ?? null,
  )

  useEffect(() => {
    let isActive = true
    const loadSections = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const result = await getSections()
        if (!isActive) return
        setSections(result)
        setSelectedSectionId((current) => {
          if (current && result.some((section) => section.id === current)) return current
          return result[0]?.id ?? ''
        })
      } catch (requestError) {
        if (!isActive) return
        setError(requestError instanceof Error ? requestError.message : 'Failed to load sections.')
        setSections([])
        setSelectedSectionId('')
      } finally {
        if (isActive) setIsLoading(false)
      }
    }
    void loadSections()
    return () => { isActive = false }
  }, [reloadToken])

  useEffect(() => {
    if (!activeSession) return
    setSessionNow(Date.now())
    const timerId = window.setInterval(() => {
      setSessionNow(Date.now())
    }, 1000)
    return () => window.clearInterval(timerId)
  }, [activeSession])

  useEffect(() => {
    let isActive = true
    const loadDevices = async () => {
      setIsDeviceLoading(true)
      setDeviceError(null)
      try {
        const result = await listDevicesAdmin()
        if (!isActive) return
        setDevices(result)
        setSelectedDeviceId((current) => {
          if (current && result.some((device) => device.id === current)) return current
          return result[0]?.id ?? ''
        })
      } catch (requestError) {
        if (!isActive) return
        setDeviceError(requestError instanceof Error ? requestError.message : 'Failed to load devices.')
        setDevices([])
        setSelectedDeviceId('')
      } finally {
        if (isActive) setIsDeviceLoading(false)
      }
    }
    void loadDevices()
    return () => { isActive = false }
  }, [reloadToken])

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

  const selectedSection = useMemo(
    () => sections.find((section) => section.id === selectedSectionId) ?? null,
    [sections, selectedSectionId],
  )

  const selectedDevice = useMemo(
    () => devices.find((device) => device.id === selectedDeviceId) ?? null,
    [devices, selectedDeviceId],
  )

  const elapsedTime = useMemo(() => {
    if (!activeSession) return '--:--:--'
    const startTime = new Date(activeSession.start_time)
    if (Number.isNaN(startTime.getTime())) return '--:--:--'
    return formatElapsed(sessionNow - startTime.getTime())
  }, [activeSession, sessionNow])

  const sessionStatusLabel = activeSession ? 'ACTIVE' : 'IDLE'

  return (
    <WorkspaceShell
      brandingKicker="Attendance"
      brandingTitle="Attendu"
      brandingSubtitle="Smart attendance system"
      navigation={navigation}
      userName={user?.full_name ?? 'User'}
      userRole={user?.role?.toUpperCase() ?? 'USER'}
      topbarTitle={
        <div className="session-topbar-title">
          Live Session
          <span className={`session-topbar-pill ${activeSession ? 'is-active' : 'is-idle'}`}>
            {sessionStatusLabel}
          </span>
        </div>
      }
      topbarActions={
        <div className="session-topbar-actions">
          <div className="ui-search">
            <span className="ui-search__icon" aria-hidden="true"><IconSearch /></span>
            <input
              type="search"
              className="ui-input"
              placeholder="Search feed..."
              value={checkinSearch}
              onChange={(event) => setCheckinSearch(event.target.value)}
            />
          </div>
        </div>
      }
      onLogout={logout}
    >
      <div className="session-page-layout">
        {/* --- Phase 1: Summary Metrics --- */}
        <section className="session-page-stats">
          {activeSession ? (
            <SessionStats session={{ ...activeSession, total_students: totalStudents }} presentCount={presentStudents.length} />
          ) : (
            <div className="session-page-empty">
              <h3>Ready to start?</h3>
              <p>Configure your section and device in the sidebar to open a live attendance window.</p>
            </div>
          )}
        </section>

        {/* --- Phase 2: Live Info Strip --- */}
        <section className="session-page-strip">
          <article className="session-strip-card">
            <span className="session-strip-icon"><IconTimer /></span>
            <div>
              <p className="session-strip-label">Session Timer</p>
              <p className="session-strip-value">{elapsedTime}</p>
              <p className="session-strip-meta">Time since session start</p>
            </div>
          </article>

          <article className="session-strip-card">
            <span className="session-strip-icon"><IconSignal /></span>
            <div>
              <p className="session-strip-label">System Health</p>
              <p className="session-strip-value">{selectedDevice ? 'Operational' : 'Idle'}</p>
              <p className="session-strip-meta">
                {selectedDevice ? `Live: ${selectedDevice.device_name}` : 'No device selected'}
              </p>
            </div>
            <div className={`session-strip-status ${isConnected ? '' : 'is-offline'}`}>
              <span className="session-strip-status-dot" />
              {isConnected ? 'Socket Live' : 'Offline'}
            </div>
          </article>

          <article className="session-strip-card session-strip-card--mode">
            <p className="session-strip-label">Check-in Preference</p>
            <div className="session-toggle-group">
              <button
                type="button"
                className={`session-toggle-button ${checkInMode === 'rfid' ? 'is-active' : ''}`}
                onClick={() => setCheckInMode('rfid')}
              >
                RFID
              </button>
              <button
                type="button"
                className={`session-toggle-button ${checkInMode === 'rfid_face' ? 'is-active' : ''}`}
                onClick={() => setCheckInMode('rfid_face')}
              >
                Hybrid
              </button>
              <button
                type="button"
                className={`session-toggle-button ${checkInMode === 'manual' ? 'is-active' : ''}`}
                onClick={() => setCheckInMode('manual')}
              >
                Manual
              </button>
            </div>
          </article>
        </section>

        {/* --- Phase 3: Control Center --- */}
        <aside className="session-page-sidebar">
          <section className="session-panel">
            <div className="ui-field">
              <label className="ui-field__label">Section Selection</label>
              <select
                className="ui-select"
                value={selectedSectionId}
                onChange={(event) => setSelectedSectionId(event.target.value)}
              >
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>{s.section_name}</option>
                ))}
              </select>
            </div>

            {selectedSection && (
              <div className="session-page-meta-card">
                <div className="session-page-meta-row">
                  <span className="session-page-meta-label">Course ID</span>
                  <span className="session-page-meta-value">{selectedSection.course_id.slice(0, 8)}...</span>
                </div>
                <div className="session-page-meta-row">
                  <span className="session-page-meta-label">Schedule</span>
                  <span className="session-page-meta-value">{formatSchedule(selectedSection.schedule_time)}</span>
                </div>
              </div>
            )}
          </section>

          <section className="session-panel">
            <div className="ui-field">
              <label className="ui-field__label">Target Device</label>
              <select
                className="ui-select"
                value={selectedDeviceId}
                onChange={(event) => setSelectedDeviceId(event.target.value)}
                disabled={isDeviceLoading}
              >
                {devices.map((d) => (
                  <option key={d.id} value={d.id}>{d.device_name}</option>
                ))}
              </select>
            </div>

            {selectedDevice && (
              <div className="session-page-meta-card">
                <div className="session-page-meta-row">
                  <span className="session-page-meta-label">Location</span>
                  <span className="session-page-meta-value">{selectedDevice.location ?? 'Unknown'}</span>
                </div>
              </div>
            )}
          </section>

          {selectedSection ? (
            <SessionControls
              sectionId={selectedSection.id}
              title="Session Control"
              description="Manage the attendance window for this section."
              onSessionChange={setActiveSession}
            />
          ) : null}
        </aside>

        {/* --- Phase 4: Live Data --- */}
        <div className="session-page-main">
          {activeSession ? (
            <>
              {selectedDeviceId ? (
                <ManualCheckIn
                  sessionId={activeSession.id}
                  sectionId={selectedSection?.id ?? ''}
                  deviceId={selectedDeviceId}
                />
              ) : (
                <div className="ui-alert ui-alert--error">Please select a device to enable manual entries.</div>
              )}
              <AttendanceList
                presentStudents={presentStudents}
                totalStudents={totalStudents}
                isConnected={isConnected}
                query={checkinSearch}
              />
            </>
          ) : (
            <div className="session-page-empty">
              <h3>Waiting for Session</h3>
              <p>Start a session to see the live check-in feed and manual controls.</p>
            </div>
          )}
        </div>
      </div>
    </WorkspaceShell>
  )
}

