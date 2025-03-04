import { ReactNode } from 'react'

interface DashboardLayoutProps {
  children: ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b">
        <div className="flex h-16 items-center px-4">
          <div className="flex items-center space-x-4">
            <span className="text-xl font-bold">AIMA LMS</span>
          </div>
          <div className="ml-auto flex items-center space-x-4">
            {/* User menu will go here */}
          </div>
        </div>
      </nav>
      <div className="flex">
        <aside className="w-64 border-r bg-muted/20 min-h-[calc(100vh-4rem)]">
          <div className="space-y-4 py-4">
            <div className="px-3 py-2">
              <h2 className="mb-2 px-4 text-lg font-semibold">Dashboard</h2>
              <div className="space-y-1">
                {/* Navigation items will go here */}
              </div>
            </div>
          </div>
        </aside>
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  )
} 