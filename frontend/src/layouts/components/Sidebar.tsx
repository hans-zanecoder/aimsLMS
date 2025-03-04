'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { Home, BookOpen, Users, Calendar, Settings, BarChart, ShieldCheck } from 'lucide-react'

interface SidebarProps {
  isOpen: boolean
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Courses', href: '/courses', icon: BookOpen },
  { name: 'Students', href: '/students', icon: Users },
  { name: 'Schedule', href: '/schedule', icon: Calendar },
  { name: 'Analytics', href: '/analytics', icon: BarChart },
  { name: 'Admin', href: '/admin', icon: ShieldCheck },
  { name: 'Settings', href: '/settings', icon: Settings },
]

// Storage key for the last active tab
const LAST_TAB_KEY = 'aimaLMS_lastActiveTab';

export function Sidebar({ isOpen }: SidebarProps) {
  const pathname = usePathname();
  
  // Use refs to access form elements
  const formRefs = useRef<(HTMLFormElement | null)[]>([]);
  
  // Check if a tab is active
  const isTabActive = (href: string) => {
    return pathname === href || pathname.startsWith(`${href}/`);
  };
  
  // Submit the form directly to force a real page navigation
  const handleNavigation = (index: number) => {
    // If we have a form ref, submit it directly
    if (formRefs.current[index]) {
      formRefs.current[index]?.submit();
    }
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-[var(--nav-height)] bottom-0 z-40 w-64 transform border-r bg-background transition-transform duration-200 ease-in-out md:translate-x-0',
        !isOpen && '-translate-x-full'
      )}
    >
      <nav className="flex h-full flex-col">
        <div className="flex-1 space-y-1 p-4">
          {navigation.map((item, index) => {
            const isActive = isTabActive(item.href);
            const Icon = item.icon;

            return (
              <div key={item.name} className="relative">
                {/* Hidden form that will be submitted */}
                <form
                  action={item.href}
                  method="GET"
                  style={{ display: 'none' }}
                  ref={el => formRefs.current[index] = el}
                  target="_self"
                >
                  {/* Add a timestamp to prevent caching */}
                  <input type="hidden" name="_t" value={Date.now().toString()} />
                </form>
                
                {/* Button that triggers form submission */}
                <button
                  type="button"
                  onClick={() => handleNavigation(index)}
                  className={cn(
                    'w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors text-left',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </button>
              </div>
            );
          })}
        </div>
      </nav>
    </aside>
  );
} 