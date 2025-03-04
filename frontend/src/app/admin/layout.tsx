'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Shield } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { user, loading } = useAuth()
  
  // The isAdmin check is now properly handled in the page component
  // This layout should just render the children and let the page handle auth
  
  return <div className="container mx-auto py-6">{children}</div>
} 