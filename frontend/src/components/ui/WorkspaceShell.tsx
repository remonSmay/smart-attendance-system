import type { ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'

import BrandLogo from './BrandLogo'
import Button from './Button'

export interface WorkspaceNavItem {
  path: string
  label: string
  shortLabel?: string
  icon?: ReactNode
  isActive?: (pathname: string) => boolean
}

interface WorkspaceShellProps {
  brandingKicker?: string
  brandingTitle?: string
  brandingSubtitle?: string
  navigation: WorkspaceNavItem[]
  userName: string
  userRole: string
  topbarKicker?: string
  topbarTitle: string
  topbarDescription?: string
  topbarActions?: ReactNode
  footerNote?: string
  onLogout: () => void
  children: ReactNode
}

export default function WorkspaceShell({
  brandingKicker = 'Attendu',
  brandingTitle = 'Workspace',
  brandingSubtitle = 'Smart attendance system',
  navigation,
  userName,
  userRole,
  topbarKicker,
  topbarTitle,
  topbarDescription,
  topbarActions,
  footerNote = 'Attendu smart attendance platform',
  onLogout,
  children,
}: WorkspaceShellProps) {
  const location = useLocation()

  const isItemActive = (item: WorkspaceNavItem): boolean => {
    if (item.isActive) {
      return item.isActive(location.pathname)
    }

    return location.pathname === item.path
  }

  return (
    <div className="ui-shell">
      <aside className="ui-shell__sidebar" aria-label="Primary navigation">
        <div className="ui-shell__brand">
          <p className="ui-auth-kicker">{brandingKicker}</p>
          <BrandLogo title={brandingTitle} subtitle={brandingSubtitle} />
        </div>

        <section className="ui-shell__user">
          <p className="ui-shell__user-name">{userName}</p>
          <span className="ui-badge">{userRole}</span>
        </section>

        <nav className="ui-shell__nav">
          {navigation.map((item) => {
            const isActive = isItemActive(item)
            const className = `ui-shell__nav-link${isActive ? ' ui-shell__nav-link--active' : ''}`

            return (
              <NavLink key={item.path} to={item.path} className={className}>
                {item.icon ? <span className="ui-button-icon" aria-hidden="true">{item.icon}</span> : null}
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>

        <Button variant="ghost" onClick={onLogout}>
          Log out
        </Button>
      </aside>

      <div className="ui-shell__content">
        <header className="ui-surface ui-shell__topbar">
          <div className="ui-shell__topbar-copy">
            {topbarKicker ? <p className="ui-shell__kicker">{topbarKicker}</p> : null}
            <h1 className="ui-shell__title">{topbarTitle}</h1>
            {topbarDescription ? <p className="ui-shell__description">{topbarDescription}</p> : null}
          </div>
          {topbarActions}
        </header>

        <main className="ui-shell__main">{children}</main>

        <footer className="ui-shell__footer">{footerNote}</footer>
      </div>

      <nav className="ui-shell__mobile-nav" aria-label="Mobile navigation">
        {navigation.map((item) => {
          const isActive = isItemActive(item)
          const className = `ui-shell__mobile-link${isActive ? ' ui-shell__mobile-link--active' : ''}`

          return (
            <NavLink key={item.path} to={item.path} className={className}>
              {item.shortLabel ?? item.label}
            </NavLink>
          )
        })}
      </nav>
    </div>
  )
}
