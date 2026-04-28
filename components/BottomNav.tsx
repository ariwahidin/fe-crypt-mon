'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Bell, Settings, Waves } from 'lucide-react'
import clsx from 'clsx'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/alerts', label: 'Alert', icon: Bell },
  { href: '/whale', label: 'Whale', icon: Waves },
  { href: '/settings', label: 'Pengaturan', icon: Settings },
]

export default function BottomNav() {
  const pathname = usePathname()
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-700/60 bg-slate-900/95 backdrop-blur-md pb-safe">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link key={href} href={href}
              className={clsx(
                'flex flex-col items-center gap-1 py-3 px-4 transition-colors duration-200',
                active ? 'text-amber-500' : 'text-slate-500 hover:text-slate-300'
              )}>
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{label}</span>
              {active && <span className="absolute bottom-0 w-8 h-0.5 bg-amber-500 rounded-t-full" />}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}