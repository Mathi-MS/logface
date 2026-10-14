import { useEffect, useRef, useState } from 'react'
import {
  ChevronDown,
  Gauge,
  LayoutGrid,
  LogIn,
  Menu,
  NotebookText,
  Settings,
  UserRound,
  UserRoundSearch,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import clsx from 'clsx'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import Avatar from './Avatar'
import { contactOf, currentUser } from '../data/employees'

const year = new Date().getFullYear()

const navItems: { to: string; label: string; icon: LucideIcon }[] = [
  { to: '/dashboard', label: 'Dashboard', icon: Gauge },
  { to: '/projects', label: 'Projects', icon: LayoutGrid },
  { to: '/employee', label: 'Employee', icon: UserRoundSearch },
  { to: '/payroll', label: 'Payroll', icon: Wallet },
]

// TODO: add pages for the items without a `to` yet
const moreItems: { label: string; icon: LucideIcon; to?: string }[] = [
  { label: 'Report', icon: NotebookText, to: '/reports' },
  { label: 'Settings', icon: Settings },
  { label: 'User Management', icon: UserRound },
]

const APP_VERSION = 'v1.34.6'
const userContact = contactOf(currentUser)
const userAvatar = currentUser.gender === 'Female' ? 'female' : 'male'

const navItemClass = 'flex flex-col items-center gap-1 px-2 text-[13px] transition-colors sm:px-4'

function useClickOutside(onOutside: () => void) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onOutside()
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [onOutside])
  return ref
}

export default function Layout() {
  const navigate = useNavigate()
  const [moreOpen, setMoreOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const moreRef = useClickOutside(() => setMoreOpen(false))
  const profileRef = useClickOutside(() => setProfileOpen(false))
  const { pathname } = useLocation()

  // Start each new page at the top instead of keeping the previous scroll position
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="flex min-h-screen flex-col bg-[#f5f6fa] font-[Roboto,Helvetica,Arial,sans-serif]">
      <header className="sticky top-0 z-30 border-b border-[#d6d6d6] bg-white">
        <div className="mx-auto flex h-[60px] max-w-[1170px] items-center justify-between px-[15px]">
          <Link to="/dashboard" className="flex items-center gap-2">
            <img src="/logo-single.png" alt="" className="h-[34px] w-auto" />
            <span className="text-[21px] text-[#666] max-sm:hidden">Logface</span>
          </Link>

          <nav className="flex items-center">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  clsx(navItemClass, isActive ? 'text-[#1976d2]' : 'text-[#777] hover:text-[#1976d2]')
                }
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={1.5} />
                <span className="max-md:hidden">{label}</span>
              </NavLink>
            ))}

            <div ref={moreRef} className="relative">
              <button
                type="button"
                onClick={() => setMoreOpen((o) => !o)}
                className={clsx(navItemClass, 'text-[#777] hover:text-[#1976d2]')}
              >
                <Menu className="h-[18px] w-[18px]" strokeWidth={1.5} />
                <span className="flex items-center gap-1 max-md:hidden">
                  More <ChevronDown className="h-3.5 w-3.5 fill-current" />
                </span>
              </button>
              {moreOpen && (
                <div className="absolute right-0 z-20 mt-2 w-56 rounded-sm bg-white py-2 shadow-[0_2px_10px_rgba(0,0,0,0.18)]">
                  {moreItems.map(({ label, icon: Icon, to }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => {
                        setMoreOpen(false)
                        if (to) navigate(to)
                      }}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left text-[14px] text-[#222] hover:bg-[#f5f6fa]"
                    >
                      <Icon className="h-[18px] w-[18px] text-[#333]" strokeWidth={1.4} />
                      {label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setMoreOpen(false)
                      navigate('/login')
                    }}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-[14px] text-[#222] hover:bg-[#f5f6fa]"
                  >
                    <LogIn className="h-[18px] w-[18px] rotate-180 text-[#333]" strokeWidth={1.4} />
                    Logout
                    <span className="ml-auto text-[13px] font-semibold text-[#222]">{APP_VERSION}</span>
                  </button>
                </div>
              )}
            </div>

            <div ref={profileRef} className="relative ml-2 sm:ml-6">
              <button
                type="button"
                onClick={() => setProfileOpen((o) => !o)}
                aria-label="Account details"
                aria-expanded={profileOpen}
              >
                <Avatar variant={userAvatar} className="h-10 w-10" />
              </button>
              {profileOpen && (
                <div
                  role="dialog"
                  aria-label="Account details"
                  className="absolute right-0 z-30 mt-2 w-[310px] overflow-hidden rounded-lg bg-white shadow-[0_4px_18px_rgba(0,0,0,0.18)]"
                >
                  <div className="flex items-center gap-3 border-b border-[#ececec] bg-[#f7f7f7] px-4 py-4">
                    <Avatar variant={userAvatar} className="h-[52px] w-[52px]" />
                    <div className="min-w-0">
                      <div className="truncate text-[15px] font-semibold text-[#333]">{currentUser.name}</div>
                      <div className="truncate text-[13px] text-[#555]">{userContact.email}</div>
                    </div>
                  </div>
                  <dl className="space-y-4 px-6 py-5 text-[14px]">
                    {[
                      ['Username', userContact.username],
                      ['Emp Code', currentUser.code],
                      ['Mobile Number', userContact.mobile],
                    ].map(([label, value]) => (
                      <div key={label} className="flex items-center justify-between gap-4">
                        <dt className="text-[#222]">{label}</dt>
                        <dd className="text-[#666]">{value}</dd>
                      </div>
                    ))}
                  </dl>
                  <div className="border-t border-[#ececec]">
                    <button
                      type="button"
                      onClick={() => setProfileOpen(false)}
                      className="w-full px-6 py-3.5 text-left text-[14px] text-[#222] hover:bg-[#f5f6fa]"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1170px] flex-1 px-[15px] py-8">
        <Outlet />
      </main>

      <footer className="border-t border-[#e5e5e5] bg-[#fafafa] px-[10px] py-3 text-[14px] text-[#333]">
        © {year} - Logface
      </footer>
    </div>
  )
}
