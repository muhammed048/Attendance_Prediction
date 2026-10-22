import { NavLink, Outlet } from 'react-router-dom'
import { useState } from 'react'

const navItems = [
  { path: '/', label: 'Predict', icon: '🎯' },
  { path: '/batch', label: 'Batch', icon: '📊' },
  { path: '/students', label: 'Students', icon: '👥' },
  { path: '/insights', label: 'Insights', icon: '📈' },
]

export default function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-cream text-charcoal flex flex-col">
      <header className="sticky top-0 z-50 bg-cream/95 backdrop-blur-sm border-b border-border-passive">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-label="Main navigation">
          <div className="flex items-center justify-between h-16">
            <NavLink to="/" className="flex items-center gap-2 text-xl font-semibold text-charcoal hover:text-charcoal/80 transition-colors" aria-label="Attendance Prediction Home">
              <span className="text-2xl">🎓</span>
              <span className="hidden sm:block tracking-tight">Attendance Prediction</span>
            </NavLink>

            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-charcoal-04 text-charcoal border border-border-interactive'
                        : 'text-muted-gray hover:text-charcoal hover:bg-charcoal-04'
                    }`
                  }
                  aria-current={({ isActive }) => (isActive ? 'page' : undefined)}
                >
                  <span aria-hidden="true">{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>

            <button
              className="md:hidden btn-pill p-2 text-charcoal"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? '✕' : '☰'}
            </button>
          </div>

          {mobileMenuOpen && (
            <div id="mobile-menu" className="md:hidden py-4 border-t border-border-passive animate-slide-down">
              <div className="flex flex-col gap-1">
                {navItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium transition-colors ${
                        isActive
                          ? 'bg-charcoal-04 text-charcoal border border-border-interactive'
                          : 'text-muted-gray hover:text-charcoal hover:bg-charcoal-04'
                      }`
                    }
                    aria-current={({ isActive }) => (isActive ? 'page' : undefined)}
                  >
                    <span aria-hidden="true" className="text-xl">{item.icon}</span>
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          )}
        </nav>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        <Outlet />
      </main>

      <footer className="border-t border-border-passive py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-muted-gray text-sm">
          Student Attendance Prediction System
        </div>
      </footer>
    </div>
  )
}