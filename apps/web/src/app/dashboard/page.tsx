'use client'

import { useAuth } from '@lexigov/ui'
import { Layout } from '@lexigov/ui'
import { Button } from '@lexigov/ui'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@lexigov/ui'

export default function DashboardPage() {
  const { user, isAuthenticated } = useAuth()

  // Mock data - will be replaced with actual API calls
  const stats = {
    totalDrafts: 12,
    inProgress: 4,
    completed: 6,
    compliant: 10,
    nonCompliant: 2,
    templatesUsed: 8,
  }

  const recentDrafts = [
    {
      id: '1',
      title: 'Ordinance on Proper Waste Management',
      documentType: 'ORDINANCE',
      status: 'DRAFT',
      jurisdiction: 'CITY',
      jurisdictionName: 'Manila',
      createdAt: '2026-01-15T10:30:00.000Z',
      updatedAt: '2026-01-16T14:20:00.000Z',
    },
    {
      id: '2',
      title: 'Barangay Resolution on Clean and Green Program',
      documentType: 'RESOLUTION',
      status: 'DRAFT',
      jurisdiction: 'BARANGAY',
      jurisdictionName: 'Sample Barangay',
      createdAt: '2026-01-14T09:15:00.000Z',
      updatedAt: '2026-01-15T11:45:00.000Z',
    },
    {
      id: '3',
      title: 'Sangguniang Ordinance No. 2025-001',
      documentType: 'ORDINANCE',
      status: 'IN_REVIEW',
      jurisdiction: 'MUNICIPALITY',
      jurisdictionName: 'Sangguniang',
      createdAt: '2026-01-13T16:30:00.000Z',
      updatedAt: '2026-01-17T10:20:00.000Z',
    },
    {
      id: '4',
      title: 'Anti-Illegal Gambling Ordinance',
      documentType: 'ORDINANCE',
      status: 'APPROVED',
      jurisdiction: 'CITY',
      jurisdictionName: 'Cebu City',
      createdAt: '2026-01-12T08:00:00.000Z',
      updatedAt: '2026-01-18T14:30:00.000Z',
    },
    {
      id: '5',
      title: 'Zoning Ordinance Update',
      documentType: 'ORDINANCE',
      status: 'DRAFT',
      jurisdiction: 'PROVINCIAL',
      jurisdictionName: 'Cavite',
      createdAt: '2026-01-10T11:20:00.000Z',
      updatedAt: '2026-01-16T09:00:00.000Z',
    },
  ]

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Welcome to LexiGov AI
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Please sign in to access your dashboard
          </p>
          <Button onClick={() => window.location.href = '/login'}>
            Sign In
          </Button>
        </div>
      </div>
    )
  }

  return (
    <Layout user={user} currentPage="dashboard">
      <div className="p-6 space-y-6">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Dashboard
          </h1>
          <p className="text-gray-600">
            Welcome back, {user?.name || 'User'}! Here's an overview of your ordinance drafting progress.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Total Drafts</CardTitle>
              <CardDescription>All ordinance drafts you've created</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-bold text-blue-600">{stats.totalDrafts}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>In Progress</CardTitle>
              <CardDescription>Drafts currently being worked on</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-bold text-orange-600">{stats.inProgress}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Completed</CardTitle>
              <CardDescription>Approved ordinances</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-bold text-green-600">{stats.completed}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Compliance</CardTitle>
              <CardDescription>RA 7160 compliant</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-bold text-emerald-600">{stats.compliant}</div>
              <div className="text-sm text-gray-600 mt-2">
                <span className="text-red-600">{stats.nonCompliant}</span> need attention
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Create new ordinance or start from template</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-4">
            <Button className="flex-1" size="lg">
              <span className="mr-2">+</span> Create New Draft
            </Button>
            <Button variant="outline" className="flex-1" size="lg">
              <span className="mr-2">📄</span> Browse Templates
            </Button>
          </CardContent>
        </Card>

        {/* Recent Drafts */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Drafts</CardTitle>
            <CardDescription>Your latest ordinance drafts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentDrafts.map((draft) => (
                <div
                  key={draft.id}
                  className="flex items-center justify-between p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div className="flex-1">
                    <div className="text-sm text-gray-600 mb-1">
                      {draft.createdAt}
                    </div>
                    <div className="font-semibold text-gray-900">{draft.title}</div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                        draft.status === 'DRAFT' ? 'bg-gray-200 text-gray-700' :
                        draft.status === 'IN_REVIEW' ? 'bg-yellow-100 text-yellow-700' :
                        draft.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {draft.status}
                      </span>
                      <span className="text-sm text-gray-500">
                        • {draft.documentType}
                      </span>
                      <span className="text-sm text-gray-500">
                        • {draft.jurisdiction}
                      </span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                </div>
              ))}
            </div>

            {recentDrafts.length === 0 && (
              <div className="text-center py-8 text-gray-600">
                No drafts yet. Start creating your first ordinance!
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}
