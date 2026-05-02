import { useCallback, useMemo, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

import { useAuthActions } from '../../features/auth/hooks/useAuthActions'
import { authStore } from '../../store/authStore'
import WorkspaceShell, { type WorkspaceNavItem } from '../ui/WorkspaceShell'
import Button from '../ui/Button'

import { IconDashboard, IconStudents, IconCourse as IconCourses, IconSections, IconDevices, IconEnrollments, IconUsers } from '../ui/Icons'

const navigationItems: WorkspaceNavItem[] = [
  { path: '/dashboard', label: 'Dashboard', shortLabel: 'Home', icon: <IconDashboard /> },
  { path: '/admin/users', label: 'Users', shortLabel: 'Users', icon: <IconUsers /> },
  { path: '/admin/students', label: 'Students', shortLabel: 'Students', icon: <IconStudents /> },
  { path: '/admin/courses', label: 'Courses', shortLabel: 'Courses', icon: <IconCourses /> },
  { path: '/admin/sections', label: 'Sections', shortLabel: 'Sections', icon: <IconSections /> },
  { path: '/admin/devices', label: 'Devices', shortLabel: 'Devices', icon: <IconDevices /> },
  { path: '/admin/enrollments', label: 'Enrollments', shortLabel: 'Enroll', icon: <IconEnrollments /> },
]

const routeTitles: Record<string, string> = {
  '/admin/users': 'Administrative Users',
  '/admin/students': 'Students',
  '/admin/courses': 'Courses',
  '/admin/sections': 'Sections',
  '/admin/devices': 'Devices',
  '/admin/enrollments': 'Enrollments',
}

const routeDescriptions: Record<string, string> = {
  '/admin/users': 'Manage system administrators and instructors with access to the control panel.',
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
