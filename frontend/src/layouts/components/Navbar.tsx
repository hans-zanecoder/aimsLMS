'use client'

import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Menu } from 'lucide-react'

interface NavbarProps {
  isSidebarOpen: boolean
  toggleSidebar: () => void
}

export function Navbar({ isSidebarOpen, toggleSidebar }: NavbarProps) {
  const { user, logout } = useAuth()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-[var(--nav-height)] border-b bg-background">
      <div className="flex h-full items-center px-4">
        <Button
          variant="ghost"
          size="icon"
          className="mr-4 md:hidden"
          onClick={toggleSidebar}
        >
          <Menu className="h-6 w-6" />
        </Button>
        
        <div className="flex-1">
          <h1 className="text-xl font-bold">AIMA LMS</h1>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            {user?.email}
          </span>
          <Button
            variant="ghost"
            onClick={() => logout()}
          >
            Logout
          </Button>
        </div>
      </div>
    </nav>
  )
} 