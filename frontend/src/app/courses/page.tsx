'use client'

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronRight, Clock, Calendar, User } from 'lucide-react'
import { useRouter } from 'next/navigation'

// Mock data - In real app, this would come from an API
const enrolledCourses = [
  {
    program: 'Makeup Artistry',
    courses: [
      {
        id: 1,
        title: 'Bridal Makeup Mastery',
        instructor: 'Sarah Anderson',
        progress: 75,
        startDate: 'March 1, 2024',
        duration: '12 weeks',
        description: 'Master the art of bridal makeup with advanced techniques and professional tips.',
      },
      {
        id: 2,
        title: 'Special Effects Makeup',
        instructor: 'Michael Chen',
        progress: 45,
        startDate: 'April 15, 2024',
        duration: '8 weeks',
        description: 'Learn to create stunning special effects makeup for film and theater.',
      },
    ],
  },
  {
    program: 'Microblading',
    courses: [
      {
        id: 3,
        title: 'Microblading Fundamentals',
        instructor: 'Emily Rodriguez',
        progress: 90,
        startDate: 'February 15, 2024',
        duration: '6 weeks',
        description: 'Learn the basics of microblading with hands-on practice and expert guidance.',
      },
    ],
  },
  {
    program: 'Eyelash Extensions',
    courses: [
      {
        id: 4,
        title: 'Classic Lash Application',
        instructor: 'Jessica Kim',
        progress: 60,
        startDate: 'March 10, 2024',
        duration: '4 weeks',
        description: 'Master the art of classic eyelash extension application.',
      },
      {
        id: 5,
        title: 'Volume Lash Techniques',
        instructor: 'Lisa Wang',
        progress: 30,
        startDate: 'April 1, 2024',
        duration: '6 weeks',
        description: 'Advanced techniques for creating stunning volume lash sets.',
      },
    ],
  },
]

export default function CoursesPage() {
  const router = useRouter()

  const handleContinueCourse = (courseId: number) => {
    router.push(`/courses/${courseId}`)
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold">My Courses</h1>
        <p className="mt-2 text-muted-foreground">
          Access your enrolled courses and continue your beauty education journey
        </p>
      </div>

      <div className="space-y-8">
        {enrolledCourses.map((program) => (
          <div key={program.program} className="space-y-4">
            <h2 className="text-2xl font-semibold">{program.program}</h2>
            <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {program.courses.map((course) => (
                <Card key={course.id} className="flex flex-col">
                  <CardHeader>
                    <CardTitle>{course.title}</CardTitle>
                    <CardDescription>{course.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="h-4 w-4" />
                        <span>{course.instructor}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>Started {course.startDate}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{course.duration}</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Progress</span>
                          <span className="text-sm font-medium">{course.progress}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{ width: `${course.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full" 
                      onClick={() => handleContinueCourse(course.id)}
                    >
                      Continue Course
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 