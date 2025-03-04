'use client'

import { ReactNode } from 'react'

// This layout ensures that the admin layout is applied to all section routes
export default function AdminSectionLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
