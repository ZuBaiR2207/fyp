import { useRef, useState } from 'react'
import './PortalLayout.css'

function NavIcon({ name }) {
  const common = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }
  switch (name) {
    case 'bell':
      return (
        <svg {...common} aria-hidden>
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      )
    case 'calendar':
      return (
        <svg {...common} aria-hidden>
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      )
    case 'activity':
      return (
        <svg {...common} aria-hidden>
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      )
    case 'layout':
      return (
        <svg {...common} aria-hidden>
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
        </svg>
      )
    case 'message':
      return (
        <svg {...common} aria-hidden>
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      )
    case 'chart':
      return (
        <svg {...common} aria-hidden>
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      )
    case 'search':
      return (
        <svg {...common} aria-hidden>
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      )
    case 'users':
      return (
        <svg {...common} aria-hidden>
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      )
    default:
      return (
        <svg {...common} aria-hidden>
          <circle cx="12" cy="12" r="10" />
        </svg>
      )
  }
}

export default function PortalLayout({ brand, title, subtitle, navItems, children, sidePanel, roleLabel, username, onLogout, activeSection, onNavClick }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const contentRef = useRef(null)

  function handleNavClick(id) {
    onNavClick?.(id)
    setMobileOpen(false)
    // scroll the content pane to the top
    if (contentRef.current) {
      contentRef.current.scrollTop = 0
    }
  }

  return (
    <div className="portal-shell">
      <div
        className={`portal-sidenav__backdrop ${mobileOpen ? 'is-visible' : ''}`}
        onClick={() => setMobileOpen(false)}
        aria-hidden={!mobileOpen}
      />
      <aside className={`portal-sidenav ${mobileOpen ? 'is-open' : ''}`} aria-label="Side navigation">
        <div className="portal-sidenav__brand">
          <img src="/fyp.svg" alt="Educational Logo" className="portal-sidenav__logo" />
          <div>
            <div className="portal-sidenav__brand-name">{brand}</div>
            <div className="portal-sidenav__title">{title}</div>
          </div>
        </div>
        <nav className="portal-sidenav__nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`portal-nav-link${activeSection === item.id ? ' is-active' : ''}`}
              onClick={() => handleNavClick(item.id)}
            >
              <span className="portal-nav-link__icon">
                <NavIcon name={item.icon} />
              </span>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="portal-sidenav__footer">
          <div className="portal-user">
            <span className="portal-user__name">{username}</span>
            {roleLabel ? <span className="portal-user__role">{roleLabel}</span> : null}
          </div>
          <button type="button" className="portal-btn-logout" onClick={onLogout}>
            Log out
          </button>
        </div>
      </aside>

      <div className="portal-main">
        <header className="portal-topbar">
          <button
            type="button"
            className="portal-menu-toggle"
            onClick={() => setMobileOpen((o) => !o)}
            aria-expanded={mobileOpen}
            aria-label="Open menu"
          >
            <span />
            <span />
            <span />
          </button>
          <img src="/fyp_header_updated.svg" alt="Educational Logo" className="portal-header__logo" style={{ height: 40, marginRight: 16 }} />
          <div className="portal-topbar__titles">
            <h1 className="portal-main__heading">{title}</h1>
            {subtitle ? <p className="portal-main__subtitle">{subtitle}</p> : null}
          </div>
        </header>
        <div className={`portal-content${sidePanel ? ' portal-content--with-side' : ''}`} ref={contentRef}>
          <div className="portal-content__main">{children}</div>
          {sidePanel ? <aside className="portal-content__side">{sidePanel}</aside> : null}
        </div>
      </div>
    </div>
  )
}
