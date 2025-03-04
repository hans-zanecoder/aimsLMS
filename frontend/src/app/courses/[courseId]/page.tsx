'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, User, Calendar, Clock, CheckCircle, XCircle, Play, RotateCcw } from 'lucide-react'

// Mock data - In real app, this would come from an API
const courseData = {
  id: '1',
  title: 'Bridal Makeup Mastery',
  instructor: 'Sarah Anderson',
  startDate: 'March 1, 2024',
  duration: '12 weeks',
  progress: 75,
  description: 'Master the art of bridal makeup with advanced techniques and professional tips.',
  objectives: [
    'Learn color theory and skin tone matching',
    'Master long-lasting makeup application',
    'Develop professional photography makeup techniques',
    'Practice different bridal styles',
  ],
  syllabus: [
    'Week 1-2: Foundation and Color Theory',
    'Week 3-4: Eye Makeup Techniques',
    'Week 5-6: Lip and Cheek Applications',
    'Week 7-8: Long-lasting Techniques',
    'Week 9-10: Photography Makeup',
    'Week 11-12: Final Projects',
  ],
  lessons: [
    {
      id: 1,
      title: 'Introduction to Bridal Makeup',
      duration: '45 minutes',
      completed: true,
      videoUrl: '/lessons/1',
    },
    {
      id: 2,
      title: 'Color Theory Basics',
      duration: '60 minutes',
      completed: true,
      videoUrl: '/lessons/2',
    },
    {
      id: 3,
      title: 'Foundation Matching',
      duration: '55 minutes',
      completed: false,
      videoUrl: '/lessons/3',
    },
    {
      id: 4,
      title: 'Eye Makeup Techniques',
      duration: '90 minutes',
      completed: false,
      videoUrl: '/lessons/4',
    },
  ],
  assignments: [
    {
      id: 1,
      title: 'Color Wheel Practice',
      dueDate: 'March 15, 2024',
      status: 'completed',
    },
    {
      id: 2,
      title: 'Foundation Matching Test',
      dueDate: 'March 22, 2024',
      status: 'pending',
    },
    {
      id: 3,
      title: 'Bridal Look Creation',
      dueDate: 'April 5, 2024',
      status: 'upcoming',
    },
  ],
  resources: [
    {
      id: 1,
      title: 'Bridal Makeup Guide',
      type: 'PDF',
      size: '2.5 MB',
      downloadUrl: '/resources/bridal-makeup-guide.pdf',
    },
    {
      id: 2,
      title: 'Color Theory Handbook',
      type: 'PDF',
      size: '1.8 MB',
      downloadUrl: '/resources/color-theory-handbook.pdf',
    },
    {
      id: 3,
      title: 'Product List and Kit Requirements',
      type: 'PDF',
      size: '500 KB',
      downloadUrl: '/resources/product-list.pdf',
    },
  ],
}

type Tab = 'overview' | 'lessons' | 'assignments' | 'resources'

export default function CourseDetailPage() {
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const params = useParams()
  const router = useRouter()

  // In a real app, we would fetch course data based on params.courseId

  const handleStartLesson = (lessonId: number, videoUrl: string) => {
    // In a real app, this would navigate to the video player page or open a modal
    console.log(`Starting lesson ${lessonId} at ${videoUrl}`)
    router.push(`/courses/${params.courseId}/lessons/${lessonId}`)
  }

  const handleDownloadResource = (resourceId: number, downloadUrl: string) => {
    // In a real app, this would trigger a file download
    console.log(`Downloading resource ${resourceId} from ${downloadUrl}`)
    window.open(downloadUrl, '_blank')
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'lessons', label: 'Lessons' },
    { id: 'assignments', label: 'Assignments' },
    { id: 'resources', label: 'Resources' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Link href="/courses">
            <Button variant="ghost" className="mb-4">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Courses
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">{courseData.title}</h1>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <User className="h-4 w-4" />
              <span>{courseData.instructor}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>Started {courseData.startDate}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{courseData.duration}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <Card className="p-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Course Progress</span>
            <span className="text-sm font-medium">{courseData.progress}%</span>
          </div>
          <div className="h-2 rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${courseData.progress}%` }}
            />
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`border-b-2 px-1 pb-4 text-sm font-medium transition-colors hover:text-primary ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold">Description</h3>
              <p className="mt-2 text-muted-foreground">{courseData.description}</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Learning Objectives</h3>
              <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
                {courseData.objectives.map((objective, index) => (
                  <li key={index}>{objective}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Course Syllabus</h3>
              <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
                {courseData.syllabus.map((week, index) => (
                  <li key={index}>{week}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'lessons' && (
          <div className="space-y-4">
            {courseData.lessons.map((lesson) => (
              <Card key={lesson.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    {lesson.completed ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-muted" />
                    )}
                    <div>
                      <h3 className="font-medium">{lesson.title}</h3>
                      <p className="text-sm text-muted-foreground">{lesson.duration}</p>
                    </div>
                  </div>
                  <Button
                    variant={lesson.completed ? 'outline' : 'default'}
                    onClick={() => handleStartLesson(lesson.id, lesson.videoUrl)}
                  >
                    {lesson.completed ? (
                      <>
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Review
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        Start
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {activeTab === 'assignments' && (
          <div className="space-y-4">
            {courseData.assignments.map((assignment) => (
              <Card key={assignment.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <h3 className="font-medium">{assignment.title}</h3>
                    <p className="text-sm text-muted-foreground">Due: {assignment.dueDate}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {assignment.status === 'completed' && (
                      <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                        Completed
                      </span>
                    )}
                    {assignment.status === 'pending' && (
                      <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">
                        In Progress
                      </span>
                    )}
                    {assignment.status === 'upcoming' && (
                      <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                        Upcoming
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {activeTab === 'resources' && (
          <div className="space-y-4">
            {courseData.resources.map((resource) => (
              <Card key={resource.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <h3 className="font-medium">{resource.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {resource.type} • {resource.size}
                    </p>
                  </div>
                  <Button 
                    variant="outline"
                    onClick={() => handleDownloadResource(resource.id, resource.downloadUrl)}
                  >
                    Download
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 