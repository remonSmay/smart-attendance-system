import { useCallback, useMemo, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

import { useAuthActions } from '../../features/auth/hooks/useAuthActions'
import { authStore } from '../../store/authStore'
import WorkspaceShell, { type WorkspaceNavItem } from '../ui/WorkspaceShell'
import Button from '../ui/Button'

const IconDashboard = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1" /><rect width="7" height="5" x="14" y="3" rx="1" /><rect width="7" height="9" x="14" y="12" rx="1" /><rect width="7" height="5" x="3" y="16" rx="1" /></svg>
)

const IconStudents = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
)

const IconCourses = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" /></svg>
)

const IconSections = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9h18" /><path d="M3 15h18" /><rect width="18" height="18" x="3" y="3" rx="2" /></svg>
)

const IconDevices = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="16" height="10" x="4" y="4" rx="2" /><line x1="12" x2="12" y1="20" y2="14" /><line x1="8" x2="16" y1="20" y2="20" /></svg>
)

const IconEnrollments = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><polyline points="16 11 18 13 22 9" /></svg>
)

const navigationItems: WorkspaceNavItem[] = [
  { path: '/dashboard', label: 'Dashboard', shortLabel: 'Home', icon: <IconDashboard /> },
  { path: '/admin/students', label: 'Students', shortLabel: 'Students', icon: <IconStudents /> },
  { path: '/admin/courses', label: 'Courses', shortLabel: 'Courses', icon: <IconCourses /> },
  { path: '/admin/sections', label: 'Sections', shortLabel: 'Sections', icon: <IconSections /> },
  { path: '/admin/devices', label: 'Devices', shortLabel: 'Devices', icon: <IconDevices /> },
  { path: '/admin/enrollments', label: 'Enrollments', shortLabel: 'Enroll', icon: <IconEnrollments /> },
]

const routeTitles: Record<string, string> = {
  '/admin/students': 'Students',
  '/admin/courses': 'Courses',
  '/admin/sections': 'Sections',
  '/admin/devices': 'Devices',
  '/admin/enrollments': 'Enrollments',
}

const routeDescriptions: Record<string, string> = {
  '/admin/students': 'Manage student profiles, identifiers, and section assignments from one consistent admin surface.',
  '/admin/courses': 'Keep course records clean and aligned with the rest of the product experience.',
  '/admin/sections': 'Connect sections to courses, schedules, and instructors with the same shared forms and tables.',
  '/admin/devices': 'Review attendance devices, locations, methods, and status within the unified control panel.',
  '/admin/enrollments': 'Add and remove students from sections without leaving the standardized admin workflow.',
}

export interface AdminTopBarConfig {
  title: string
  description?: string
  primaryActionLabel?: string
  onPrimaryAction?: () => void
  isPrimaryActionDisabled?: boolean
  isPrimaryActionLoading?: boolean
}

export interface AdminShellOutletContext {
  setTopBarConfig: (config: AdminTopBarConfig) => void
  resetTopBarConfig: () => void
}

const getDefaultTopBarConfig = (pathname: string): AdminTopBarConfig => ({
  title: routeTitles[pathname] ?? 'Admin workspace',
  description: routeDescriptions[pathname] ?? 'Manage operational records and system configuration from the shared workspace shell.',
})

export default function AdminShell() {
  const location = useLocation()
  const { logout } = useAuthActions()
  const user = authStore.getUser()

  const defaultTopBarConfig = useMemo(
    () => getDefaultTopBarConfig(location.pathname),
    [location.pathname],
  )

  const [topBarOverride, setTopBarOverride] = useState<{
    pathname: string
    config: AdminTopBarConfig
  } | null>(null)

  const setTopBarConfig = useCallback((config: AdminTopBarConfig) => {
    setTopBarOverride({
      pathname: location.pathname,
      config,
    })
  }, [location.pathname])

  const resetTopBarConfig = useCallback(() => {
    setTopBarOverride(null)
  }, [])

  const topBarConfig =
    topBarOverride && topBarOverride.pathname === location.pathname
      ? topBarOverride.config
      : defaultTopBarConfig

  const outletContext = useMemo<AdminShellOutletContext>(
    () => ({ setTopBarConfig, resetTopBarConfig }),
    [resetTopBarConfig, setTopBarConfig],
  )

  const topbarActions = topBarConfig.primaryActionLabel ? (
    <Button
      onClick={topBarConfig.onPrimaryAction}
      disabled={
        topBarConfig.isPrimaryActionDisabled ||
        topBarConfig.isPrimaryActionLoading ||
        !topBarConfig.onPrimaryAction
      }
      loading={topBarConfig.isPrimaryActionLoading}
    >
      {topBarConfig.primaryActionLabel}
    </Button>
  ) : null

  return (
    <WorkspaceShell
      brandingKicker="Administration"
      brandingTitle="Control Panel"
      brandingSubtitle="Records, devices, enrollments, and configuration"
      navigation={navigationItems}
      userName={user?.full_name ?? 'Admin User'}
      userRole={user?.role ?? 'Admin'}
      topbarKicker="Administration"
      topbarTitle={topBarConfig.title}
      topbarDescription={topBarConfig.description}
      topbarActions={topbarActions}
      footerNote="Attendu administration workspace"
      onLogout={logout}
    >
      <Outlet context={outletContext} />
    </WorkspaceShell>
  )
}
