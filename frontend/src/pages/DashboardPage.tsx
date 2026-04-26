import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import WorkspaceShell, { type WorkspaceNavItem } from '../components/ui/WorkspaceShell'
import MetricCard from '../components/ui/MetricCard'
import Button from '../components/ui/Button'
import PageHeader from '../components/ui/PageHeader'
import { useAuthActions } from '../features/auth/hooks/useAuthActions'
import { useCourses } from '../hooks/useCourses'
import { authStore } from '../store/authStore'
import './DashboardPage.css'

const SKELETON_COUNT = 6

const IconSearch = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
)

const IconDashboard = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1" /><rect width="7" height="5" x="14" y="3" rx="1" /><rect width="7" height="9" x="14" y="12" rx="1" /><rect width="7" height="5" x="3" y="16" rx="1" /></svg>
)

const IconSettings = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 1.72l-.12.81a2 2 0 0 1-1.34 1.56l-.77.26a2 2 0 0 1-1.99-.33l-.64-.49a2 2 0 0 0-2.73.18l-.31.31a2 2 0 0 0-.18 2.73l.49.64a2 2 0 0 1 .33 1.99l-.26.77a2 2 0 0 1-1.56 1.34l-.81.12a2 2 0 0 0-1.72 2v.44a2 2 0 0 0 1.72 2l.81.12a2 2 0 0 1 1.56 1.34l.26.77a2 2 0 0 1-.33 1.99l-.49.64a2 2 0 0 0 .18 2.73l.31.31a2 2 0 0 0 2.73.18l.64-.49a2 2 0 0 1 1.99-.33l.77.26a2 2 0 0 1 1.34 1.56l.12.81a2 2 0 0 0 2 1.72h.44a2 2 0 0 0 2-1.72l.12-.81a2 2 0 0 1 1.34-1.56l.77-.26a2 2 0 0 1 1.99.33l.64.49a2 2 0 0 0 2.73-.18l.31-.31a2 2 0 0 0 .18-2.73l-.49-.64a2 2 0 0 1-.33-1.99l.26-.77a2 2 0 0 1 1.56-1.34l.81-.12a2 2 0 0 0 1.72-2v-.44a2 2 0 0 0-1.72-2l-.81-.12a2 2 0 0 1-1.56-1.34l-.26-.77a2 2 0 0 1 .33-1.99l.49-.64a2 2 0 0 0-.18-2.73l-.31-.31a2 2 0 0 0-2.73-.18l-.64.49a2 2 0 0 1-1.99.33l-.77-.26a2 2 0 0 1-1.34-1.56l-.12-.81a2 2 0 0 0-2-1.72Z" /><circle cx="12" cy="12" r="3" /></svg>
)

const IconCourse = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" /></svg>
)

const IconArrowRight = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
)

const IconUsers = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
)

export default function DashboardPage() {
  const navigate = useNavigate()
  const { logout } = useAuthActions()
  const user = authStore.getUser()
  const [searchQuery, setSearchQuery] = useState('')
  const { courses, sectionCounts, isLoading, error, refetch } = useCourses(searchQuery)

  const roleLabel = useMemo(() => {
    if (!user?.role) {
      return 'User'
    }

    return user.role.charAt(0).toUpperCase() + user.role.slice(1)
  }, [user?.role])

  const firstName = user?.full_name?.split(' ')[0] ?? 'User'
  const totalSections = useMemo(
    () => Object.values(sectionCounts).reduce((sum, count) => sum + count, 0),
    [sectionCounts],
  )

  const navigation = useMemo<WorkspaceNavItem[]>(() => {
    const items: WorkspaceNavItem[] = [
      {
        path: '/dashboard',
        label: 'Dashboard',
        shortLabel: 'Home',
        icon: <IconDashboard />,
        isActive: (pathname) => pathname === '/dashboard' || pathname.startsWith('/courses/'),
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

  return (
    <WorkspaceShell
      brandingKicker="Instructor workspace"
      brandingTitle="Course Hub"
      brandingSubtitle="Courses, attendance, and analytics"
      navigation={navigation}
      userName={user?.full_name ?? 'User'}
      userRole={roleLabel}
      topbarKicker="Dashboard"
      topbarTitle={`Welcome back, ${firstName}`}
      topbarDescription="Browse your courses, review section coverage, and move into detailed analytics without leaving the shared product layout."
      onLogout={logout}
    >
      <section className="ui-hero">
        <p className="ui-auth-kicker">Overview</p>
        <h2>Everything you need to manage attendance is in one place.</h2>
        <p>Search across courses, open analytics for a single course, and move into administration when your role allows it.</p>
      </section>

      <div className="ui-stat-grid">
        <MetricCard label="Visible courses" value={courses.length} icon={<IconCourse />} />
        <MetricCard label="Tracked sections" value={totalSections} icon={<IconUsers />} />
      </div>

      <section className="ui-surface ui-section">
        <PageHeader
          eyebrow="Courses"
          title="Course directory"
          description="Search by course name or code. Results stay scoped to the courses available in your role."
        />

        <div className="dashboard-toolbar">
          <div className="ui-search">
            <span className="ui-search__icon" aria-hidden="true">
              <IconSearch />
            </span>
            <input
              type="search"
              className="ui-input"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search courses by name or code"
            />
          </div>
        </div>

        {error ? (
          <section className="ui-alert ui-alert--error" role="alert">
            <p className="ui-alert__content">{error}</p>
            <Button variant="secondary" size="sm" onClick={refetch}>
              Retry
            </Button>
          </section>
        ) : null}

        {!error && isLoading ? (
          <div className="ui-loading-grid">
            {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
              <div key={index} className="ui-skeleton-card">
                <span className="ui-skeleton-line" style={{ width: '2.75rem', height: '2.75rem' }} />
                <span className="ui-skeleton-line" style={{ width: '70%' }} />
                <span className="ui-skeleton-line" style={{ width: '40%' }} />
                <span className="ui-skeleton-line" style={{ width: '100%', height: '1px', marginTop: 'auto' }} />
              </div>
            ))}
          </div>
        ) : null}

        {!error && !isLoading && courses.length === 0 ? (
          <section className="ui-empty">
            <h3>No courses found</h3>
            <p>Try a different search term or clear the filter to see everything available to you.</p>
          </section>
        ) : null}

        {!error && !isLoading && courses.length > 0 ? (
          <div className="dashboard-course-grid">
            {courses.map((course, index) => (
              <button
                key={course.id}
                type="button"
                className={`dashboard-course-card animate-fade-up stagger-${index % 5}`}
                onClick={() => navigate(`/courses/${course.id}`)}
              >
                <div className="dashboard-course-card__header">
                  <div className="dashboard-course-card__icon" aria-hidden="true">
                    <IconCourse />
                  </div>
                  <span className="ui-badge">{course.course_code}</span>
                </div>

                <div className="dashboard-course-card__body">
                  <h3>{course.course_name}</h3>
                  <p>Open course analytics, review attendance summaries, and inspect weekly and monthly trends.</p>
                </div>

                <div className="dashboard-course-card__footer">
                  <span className="dashboard-course-card__meta">
                    <IconUsers />
                    {sectionCounts[course.id] ?? 0} sections
                  </span>
                  <span className="dashboard-course-card__cta">
                    Open analytics
                    <IconArrowRight />
                  </span>
                </div>
              </button>
            ))}
          </div>
        ) : null}
      </section>
    </WorkspaceShell>
  )
}
