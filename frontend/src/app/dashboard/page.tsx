'use client'

import { Card } from '@/components/ui/card'
import { Palette, Clock, Calendar, Award, Sparkles, Brush, Scissors, Heart } from 'lucide-react'

const stats = [
  {
    name: 'AIMA Programs',
    value: '5',
    icon: Palette,
    description: '3 in progress',
  },
  {
    name: 'Practice Hours',
    value: '45.5',
    icon: Clock,
    description: 'Last 30 days',
  },
  {
    name: 'Upcoming Tests',
    value: '2',
    icon: Calendar,
    description: 'Next 7 days',
  },
  {
    name: 'Certifications',
    value: '3',
    icon: Award,
    description: 'Professional level',
  },
]

const programs = [
  {
    name: 'Makeup Artistry',
    progress: 85,
    icon: Sparkles,
  },
  {
    name: 'Microblading',
    progress: 60,
    icon: Brush,
  },
  {
    name: 'Eyelash Extensions',
    progress: 45,
    icon: Scissors,
  },
  {
    name: 'Esthetician',
    progress: 30,
    icon: Heart,
  },
]

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold">Welcome to AIMA</h1>
        <p className="mt-2 text-muted-foreground">
          Your journey to becoming a certified beauty professional starts here
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.name} className="p-4">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.name}
                  </p>
                  <h2 className="text-2xl font-bold">{stat.value}</h2>
                  <p className="text-xs text-muted-foreground">
                    {stat.description}
                  </p>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-6">
          <h2 className="text-lg font-semibold">Upcoming Assessments</h2>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <div>
                <p className="font-medium">Bridal Makeup Final Exam</p>
                <p className="text-sm text-muted-foreground">Due in 3 days</p>
              </div>
              <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">
                Preparation Required
              </span>
            </div>
            <div className="flex items-center justify-between border-b pb-2">
              <div>
                <p className="font-medium">Microblading Stroke Practice</p>
                <p className="text-sm text-muted-foreground">Due in 5 days</p>
              </div>
              <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                Practice Started
              </span>
            </div>
            <div className="flex items-center justify-between border-b pb-2">
              <div>
                <p className="font-medium">Lash Application Test</p>
                <p className="text-sm text-muted-foreground">Due in 7 days</p>
              </div>
              <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                Materials Ready
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold">Program Progress</h2>
          <div className="mt-4 space-y-4">
            {programs.map((program) => {
              const Icon = program.icon
              return (
                <div key={program.name}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-primary" />
                      <p className="font-medium">{program.name}</p>
                    </div>
                    <p className="text-sm font-medium">{program.progress}%</p>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${program.progress}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </div>
    </div>
  )
} 