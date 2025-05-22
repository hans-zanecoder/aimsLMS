'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Sidebar } from '@/layouts/components/Sidebar';
import { Navbar } from '@/layouts/components/Navbar';
import { useState } from 'react';

export default function InstructorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'instructor')) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user || user.role !== 'instructor') {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar 
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />
      <Sidebar isOpen={isSidebarOpen} />
      <main className={`pt-[var(--nav-height)] transition-all duration-200 ${
        isSidebarOpen ? 'md:pl-64' : ''
      }`}>
        <div className="container mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
} 