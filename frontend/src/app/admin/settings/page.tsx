'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Redirect to the main admin page with a hash to indicate the section
export default function SettingsPage() {
  const router = useRouter()
  
  useEffect(() => {
    router.push('/admin#settings')
  }, [router])
  
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <p>Redirecting to Settings section...</p>
    </div>
  )
}
