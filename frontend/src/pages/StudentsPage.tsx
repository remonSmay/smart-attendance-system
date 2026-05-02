import {
  startTransition,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import Button from '../components/ui/Button'
import PageHeader from '../components/ui/PageHeader'
import WorkspaceShell, { type WorkspaceNavItem } from '../components/ui/WorkspaceShell'
import {
  getCourse,
  getCourseStudents,
  type CourseResponse,
  type CourseStudentAttendanceResponse,
} from '../features/courses/api/courseApi'
import { useAuthActions } from '../features/auth/hooks/useAuthActions'
import StudentDetailDrawer from '../features/students/components/StudentDetailDrawer'
import { authStore } from '../store/authStore'
import { exportToCSV } from '../utils/exportToCSV'
import './StudentsPage.css'

const GOOD_STANDING_THRESHOLD = 75
const WARNING_THRESHOLD = 50

type StudentFilterKey = 'all' | 'good' | 'risk'
type StudentSortKey = 'full_name' | 'email' | 'attendance_percentage'
type SortDirection = 'asc' | 'desc'

interface SortState {
  key: StudentSortKey
  direction: SortDirection
}


const IconDashboard = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1" /><rect width="7" height="5" x="14" y="3" rx="1" /><rect width="7" height="9" x="14" y="12" rx="1" /><rect width="7" height="5" x="3" y="16" rx="1" /></svg>
)

const IconChart = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" /></svg>
)

const IconStudents = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
)

const IconTimer = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2h4" /><path d="M12 14v-4" /><path d="M12 2v2" /><circle cx="12" cy="14" r="8" /></svg>
)

const IconHistory = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v5h5" /><path d="M3.05 13a9 9 0 1 0 2.13-5.3L3 10" /><path d="M12 7v5l4 2" /></svg>
)

const IconSearch = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
)

const filterLabels: Record<StudentFilterKey, string> = {
  all: 'All',
  good: 'Good Standing',
  risk: 'At Risk',
}

const isGoodStanding = (attendancePercentage: number) =>
  attendancePercentage >= GOOD_STANDING_THRESHOLD

const isAtRisk = (attendancePercentage: number) =>
  attendancePercentage < GOOD_STANDING_THRESHOLD

const getProgressTone = (attendancePercentage: number) => {
  if (attendancePercentage >= GOOD_STANDING_THRESHOLD) {
    return 'success'
  }

  if (attendancePercentage >= WARNING_THRESHOLD) {
    return 'warning'
  }

  return 'danger'
}

const getStandingLabel = (attendancePercentage: number) => {
  if (attendancePercentage >= GOOD_STANDING_THRESHOLD) {
    return 'Good standing'
  }

  if (attendancePercentage >= WARNING_THRESHOLD) {
    return 'Needs attention'
  }

  return 'Critical risk'
}

const formatAttendance = (attendancePercentage: number) =>
  `${attendancePercentage.toFixed(1)}%`

const clampPercentage = (value: number) => Math.min(100, Math.max(0, value))

const getNextSortState = (
  currentSortState: SortState,
  key: StudentSortKey,
): SortState => {
  if (currentSortState.key !== key) {
    return {
      key,
      direction: key === 'attendance_percentage' ? 'desc' : 'asc',
    }
  }

  return {
    key,
    direction: currentSortState.direction === 'asc' ? 'desc' : 'asc',
  }
}

const getSortIndicator = (sortState: SortState, key: StudentSortKey) => {
  if (sortState.key !== key) {
    return 'SORT'
  }

  return sortState.direction === 'asc' ? 'ASC' : 'DESC'
}

const getAriaSort = (
  sortState: SortState,
  key: StudentSortKey,
): 'ascending' | 'descending' | 'none' => {
  if (sortState.key !== key) {
    return 'none'
  }

  return sortState.direction === 'asc' ? 'ascending' : 'descending'
}

const downloadStudentsCsv = (
  students: CourseStudentAttendanceResponse[],
  courseCode?: string,
) => {
  const filePrefix = (courseCode ?? 'course-students')
    .trim()
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .toLowerCase()
  const datePart = new Date().toISOString().slice(0, 10)
  const exportRows = students.map((student) => ({
    student_name: student.full_name,
    email: student.email,
    attendance_percentage: student.attendance_percentage.toFixed(1),
  }))

  exportToCSV(exportRows, `${filePrefix}-attendance-${datePart}`)
}

const getStudentInitials = (fullName: string) =>
  fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')

export default function StudentsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { logout } = useAuthActions()
  const user = authStore.getUser()
  const [course, setCourse] = useState<CourseResponse | null>(null)
  const [students, setStudents] = useState<CourseStudentAttendanceResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<StudentFilterKey>('all')
  const [sortState, setSortState] = useState<SortState>({
    key: 'attendance_percentage',
    direction: 'desc',
  })
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  const deferredSearchQuery = useDeferredValue(searchQuery)
  const isMissingCourseId = !id

  useEffect(() => {
    if (!id) {
      setIsLoading(false)
      setCourse(null)
      setStudents([])
      return
    }

    let isActive = true

    const loadStudentsPage = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const [courseResponse, studentsResponse] = await Promise.all([
          getCourse(id),
          getCourseStudents(id),
        ])

        if (!isActive) {
          return
        }

        setCourse(courseResponse)
        setStudents(studentsResponse)
      } catch (requestError) {
        if (!isActive) {
          return
        }

        setError(
          requestError instanceof Error
            ? requestError.message
            : 'Failed to load students.',
        )
        setCourse(null)
        setStudents([])
        setSelectedStudentId(null)
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    void loadStudentsPage()

    return () => {
      isActive = false
    }
  }, [id, reloadToken])

  useEffect(() => {
    if (selectedStudentId && !students.some((student) => student.id === selectedStudentId)) {
      setSelectedStudentId(null)
    }
  }, [selectedStudentId, students])

  const roleLabel = user?.role ? `${user.role.charAt(0).toUpperCase()}${user.role.slice(1)}` : 'User'
  const coursePath = id ? `/courses/${id}` : '/dashboard'
  const studentsPath = id ? `/courses/${id}/students` : '/dashboard'

  const navigation = useMemo<WorkspaceNavItem[]>(
    () => [
      {
        path: '/dashboard',
        label: 'Dashboard',
        shortLabel: 'Home',
        icon: <IconDashboard />,
        isActive: (pathname) => pathname === '/dashboard',
      },
      {
        path: coursePath,
        label: 'Analytics',
        shortLabel: 'Charts',
        icon: <IconChart />,
        isActive: (pathname) => pathname === coursePath,
      },
      {
        path: studentsPath,
        label: 'Students',
        shortLabel: 'Students',
        icon: <IconStudents />,
        isActive: (pathname) => pathname.startsWith(studentsPath),
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
    ],
    [coursePath, studentsPath],
  )

  const tabCounts = useMemo(
    () => ({
      all: students.length,
      good: students.filter((student) => isGoodStanding(student.attendance_percentage)).length,
      risk: students.filter((student) => isAtRisk(student.attendance_percentage)).length,
    }),
    [students],
  )

  const filteredStudents = useMemo(() => {
    const normalizedQuery = deferredSearchQuery.trim().toLowerCase()

    return students.filter((student) => {
      if (activeFilter === 'good' && !isGoodStanding(student.attendance_percentage)) {
        return false
      }

      if (activeFilter === 'risk' && !isAtRisk(student.attendance_percentage)) {
        return false
      }

      if (!normalizedQuery) {
        return true
      }

      return [
        student.full_name,
        student.email,
        student.rfid_uid,
      ].some((value) => value.toLowerCase().includes(normalizedQuery))
    })
  }, [activeFilter, deferredSearchQuery, students])

  const sortedStudents = useMemo(() => {
    const sorted = [...filteredStudents]

    sorted.sort((left, right) => {
      const directionMultiplier = sortState.direction === 'asc' ? 1 : -1

      if (sortState.key === 'attendance_percentage') {
        return (
          (left.attendance_percentage - right.attendance_percentage) * directionMultiplier
        )
      }

      return (
        left[sortState.key]
          .toLowerCase()
          .localeCompare(right[sortState.key].toLowerCase()) * directionMultiplier
      )
    })

    return sorted
  }, [filteredStudents, sortState])

  const selectedStudent = students.find((student) => student.id === selectedStudentId) ?? null
  const courseTitle = course ? `${course.course_name} students` : 'Students'
  const courseDescription = course
    ? `${course.course_code} student directory with attendance standing at a glance.`
    : 'Student directory with attendance standing at a glance.'

  return (
    <WorkspaceShell
      brandingKicker="Course roster"
      brandingTitle="Course Hub"
      brandingSubtitle="Attendance visibility and intervention"
      navigation={navigation}
      userName={user?.full_name ?? 'User'}
      userRole={roleLabel}
      topbarKicker="Students"
      topbarTitle={courseTitle}
      topbarDescription={courseDescription}
      topbarActions={
        <Button variant="secondary" onClick={() => navigate(coursePath)}>
          Back to analytics
        </Button>
      }
      onLogout={logout}
    >
      <section className="ui-surface ui-section students-page">
        <PageHeader
          eyebrow="Directory"
          title="Attendance by student"
          description="Search by name, email, or RFID, then focus the grid on students in good standing or anyone currently at risk."
          actions={
            <div className="students-page__header-actions">
              {course ? <span className="ui-badge">{course.course_code}</span> : null}
              <Button
                variant="secondary"
                size="sm"
                disabled={isLoading || sortedStudents.length === 0}
                onClick={() => downloadStudentsCsv(sortedStudents, course?.course_code)}
              >
                Export CSV
              </Button>
            </div>
          }
        />

        {isMissingCourseId ? (
          <section className="ui-alert ui-alert--error" role="alert">
            <p className="ui-alert__content">Course identifier is missing.</p>
            <Button variant="secondary" size="sm" onClick={() => navigate('/dashboard')}>
              Return to dashboard
            </Button>
          </section>
        ) : null}

        {error ? (
          <section className="ui-alert ui-alert--error" role="alert">
            <p className="ui-alert__content">{error}</p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setReloadToken((current) => current + 1)}
            >
              Retry
            </Button>
          </section>
        ) : null}

        {!isMissingCourseId && !error ? (
          <>
            <div className="students-page__toolbar">
              <div className="ui-search">
                <span className="ui-search__icon" aria-hidden="true">
                  <IconSearch />
                </span>
                <input
                  type="search"
                  className="ui-input"
                  value={searchQuery}
                  onChange={(event) => {
                    const nextValue = event.target.value
                    startTransition(() => {
                      setSearchQuery(nextValue)
                    })
                  }}
                  placeholder="Search students by name, email, or RFID"
                />
              </div>

              <div className="students-page__filters" role="tablist" aria-label="Student attendance filters">
                {(Object.keys(filterLabels) as StudentFilterKey[]).map((filterKey) => {
                  const isActive = activeFilter === filterKey

                  return (
                    <button
                      key={filterKey}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      className={`students-page__filter-tab${isActive ? ' students-page__filter-tab--active' : ''}`}
                      onClick={() => setActiveFilter(filterKey)}
                    >
                      <span>{filterLabels[filterKey]}</span>
                      <span className="students-page__filter-count">{tabCounts[filterKey]}</span>
                    </button>
                  )
                })}
              </div>

              {!isLoading ? (
                <p className="students-page__results">
                  Showing {filteredStudents.length} of {students.length} students
                </p>
              ) : null}
            </div>

            {isLoading ? (
              <div className="ui-loading-grid">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="ui-skeleton-card">
                    <span className="ui-skeleton-line" style={{ width: '3rem', height: '3rem' }} />
                    <span className="ui-skeleton-line" style={{ width: '60%' }} />
                    <span className="ui-skeleton-line" style={{ width: '75%' }} />
                    <span className="ui-skeleton-line" style={{ width: '40%' }} />
                    <span className="ui-skeleton-line" style={{ width: '100%', height: '0.625rem' }} />
                  </div>
                ))}
              </div>
            ) : null}

            {!isLoading && students.length === 0 ? (
              <section className="ui-empty">
                <h3>No students enrolled</h3>
                <p>This course does not have any enrolled students yet.</p>
              </section>
            ) : null}

            {!isLoading && students.length > 0 && filteredStudents.length === 0 ? (
              <section className="ui-empty">
                <h3>No matching students</h3>
                <p>Adjust the search or switch filters to see more students in this course.</p>
              </section>
            ) : null}

            {!isLoading && sortedStudents.length > 0 ? (
              <div className="students-page__table-shell">
                <table className="students-page__table">
                  <thead>
                    <tr>
                      <th scope="col" aria-sort={getAriaSort(sortState, 'full_name')}>
                        <button
                          type="button"
                          className="students-page__sort-button"
                          onClick={() => setSortState((current) => getNextSortState(current, 'full_name'))}
                        >
                          Student name <span aria-hidden="true">{getSortIndicator(sortState, 'full_name')}</span>
                        </button>
                      </th>
                      <th scope="col" aria-sort={getAriaSort(sortState, 'email')}>
                        <button
                          type="button"
                          className="students-page__sort-button"
                          onClick={() => setSortState((current) => getNextSortState(current, 'email'))}
                        >
                          Email <span aria-hidden="true">{getSortIndicator(sortState, 'email')}</span>
                        </button>
                      </th>
                      <th scope="col" aria-sort={getAriaSort(sortState, 'attendance_percentage')}>
                        <button
                          type="button"
                          className="students-page__sort-button students-page__sort-button--numeric"
                          onClick={() => setSortState((current) => getNextSortState(current, 'attendance_percentage'))}
                        >
                          Attendance % <span aria-hidden="true">{getSortIndicator(sortState, 'attendance_percentage')}</span>
                        </button>
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {sortedStudents.map((student) => {
                      const tone = getProgressTone(student.attendance_percentage)

                      return (
                        <tr
                          key={student.id}
                          className="students-page__table-row"
                          onClick={() => setSelectedStudentId(student.id)}
                        >
                          <td>
                            <div className="students-page__student-cell">
                              <div className="students-page__avatar" aria-hidden="true">
                                {getStudentInitials(student.full_name)}
                              </div>
                              <div className="students-page__student-copy">
                                <strong>{student.full_name}</strong>
                                <span className="students-page__rfid">RFID {student.rfid_uid}</span>
                              </div>
                            </div>
                          </td>
                          <td>{student.email}</td>
                          <td>
                            <div className="students-page__attendance-cell">
                              <strong>{formatAttendance(student.attendance_percentage)}</strong>
                              <span className={`ui-badge students-page__standing students-page__standing--${tone}`}>
                                {getStandingLabel(student.attendance_percentage)}
                              </span>
                              <div className="students-page__progress-track" aria-hidden="true">
                                <span
                                  className={`students-page__progress-fill students-page__progress-fill--${tone}`}
                                  style={{ width: `${clampPercentage(student.attendance_percentage)}%` }}
                                />
                              </div>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : null}
          </>
        ) : null}
      </section>

      <StudentDetailDrawer
        student={selectedStudent}
        onClose={() => setSelectedStudentId(null)}
      />
    </WorkspaceShell>
  )
}
