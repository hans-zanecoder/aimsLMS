'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Redirect to the main admin page with a hash to indicate the section
export default function StudentsPage() {
  const router = useRouter()
  
  useEffect(() => {
    router.push('/admin#students')
  }, [router])
  
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <p>Redirecting to Students section...</p>
    </div>
  )
}
