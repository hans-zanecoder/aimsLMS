'use client'

import { useState } from 'react'
import { Navbar } from './components/Navbar'
import { Sidebar } from './components/Sidebar'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      <Navbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      <Sidebar isOpen={isSidebarOpen} />
      
      <main className="pt-[var(--nav-height)] md:pl-64">
        <div className="container mx-auto p-6">
          {children}
        </div>
      </main>

      <footer className="border-t py-4 md:pl-64">
        <div className="container mx-auto px-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} AIMA LMS. All rights reserved.
        </div>
      </footer>
    </div>
  )
} 