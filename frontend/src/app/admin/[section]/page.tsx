'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AdminDashboard from '../page'

// This is a catch-all route that renders the main AdminDashboard component
// It allows us to have clean URLs like /admin/students instead of /admin?tab=students
export default function AdminSection({ params }: { params: { section: string } }) {
  const router = useRouter()
  const validSections = ['students', 'courses', 'analytics', 'permissions', 'settings']
  
  // Redirect invalid sections to the main dashboard
  useEffect(() => {
    if (!validSections.includes(params.section)) {
      // Use replace instead of push to avoid adding to history stack
      router.replace('/admin', { scroll: false })
    }
  }, [params.section, router])

  // Render the main dashboard component which will read the path and show the correct section
  return <AdminDashboard />
}
