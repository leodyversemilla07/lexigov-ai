'use client'

import { useAuth } from '@lexigov/ui'
import { Layout } from '@lexigov/ui'
import { Button } from '@lexigov/ui'
import { Card, CardContent, CardHeader, CardTitle } from '@lexigov/ui'
import { Input } from '@lexigov/ui'
import { useState } from 'react'

export default function DraftsPage() {
  const { user, isAuthenticated } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [filterType, setFilterType] = useState('ALL')
  const [filterJurisdiction, setFilterJurisdiction] = useState('ALL')

  // Mock data - will be replaced with actual API calls
  const drafts = [
    {
      id: '1',
      title: 'Ordinance on Proper Waste Management',
      documentType: 'ORDINANCE',
      status: 'DRAFT',
      jurisdiction: 'CITY',
      jurisdictionName: 'Manila',
      createdAt: '2026-01-15T10:30:00.000Z',
      updatedAt: '2026-01-16T14:20:00.000Z',
      version: 1,
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
      version: 1,
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
      version: 2,
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
      version: 1,
    },
    {
      id: '5',
      title: 'Zoning Ordinance Update',
      documentType: 'ORDINANCE',
      status: 'DRAFT',
      jurisdiction: 'PROVINCIAL',
      jurisdictionName: 'Cavite',
      createdAt: '2026-01-10T11:20:00.000Z',
      updatedAt: '2026-01-16T09:00.000Z',
      version: 1,
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
          <Button onClick={() => (window.location.href = '/api/auth/login')}>
            Sign In
          </Button>
        </div>
      </div>
    )
  }

  const filteredDrafts = drafts.filter((draft) => {
    if (filterStatus !== 'ALL' && draft.status !== filterStatus) return false
    if (filterType !== 'ALL' && draft.documentType !== filterType) return false
    if (filterJurisdiction !== 'ALL' && draft.jurisdiction !== filterJurisdiction) return false
    if (searchTerm && !draft.title.toLowerCase().includes(searchTerm.toLowerCase())) return false
    return true
  })

  return (
    <Layout user={user} currentPage="drafts">
      <div className="p-6 space-y-6">
        {/* Page Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              My Drafts
            </h1>
            <p className="text-gray-600">
              Manage and edit your ordinance drafts
            </p>
          </div>
          <Button>
            <span className="mr-2">+</span> New Draft
          </Button>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              {/* Search */}
              <div className="md:col-span-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Drafts
                </label>
                <Input
                  type="text"
                  placeholder="Search by title..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm((e.target as HTMLInputElement).value)}
                  className="w-full"
                />
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus((e.target as HTMLSelectElement).value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">All Status</option>
                  <option value="DRAFT">Draft</option>
                  <option value="IN_REVIEW">In Review</option>
                  <option value="APPROVED">Approved</option>
                </select>
              </div>

              {/* Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Document Type
                </label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType((e.target as HTMLSelectElement).value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">All Types</option>
                  <option value="ORDINANCE">Ordinance</option>
                  <option value="RESOLUTION">Resolution</option>
                  <option value="MEMORANDUM">Memorandum</option>
                  <option value="POLICY">Policy</option>
                </select>
              </div>

              {/* Jurisdiction Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jurisdiction
                </label>
                <select
                  value={filterJurisdiction}
                  onChange={(e) => setFilterJurisdiction((e.target as HTMLSelectElement).value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">All Jurisdictions</option>
                  <option value="BARANGAY">Barangay</option>
                  <option value="MUNICIPALITY">Municipality</option>
                  <option value="CITY">City</option>
                  <option value="PROVINCIAL">Provincial</option>
                </select>
              </div>

              {/* Clear Filters */}
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('')
                  setFilterStatus('ALL')
                  setFilterType('ALL')
                  setFilterJurisdiction('ALL')
                }}
                size="sm"
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Drafts List */}
        <Card>
          <CardHeader>
            <CardTitle>Ordinance Drafts</CardTitle>
            <CardDescription>
              {filteredDrafts.length} {filteredDrafts.length === 1 ? 'draft' : 'drafts'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredDrafts.map((draft) => (
                <div
                  key={draft.id}
                  className="flex items-center justify-between p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div className="flex-1">
                    <div className="text-sm text-gray-600 mb-1">
                      {new Date(draft.createdAt).toLocaleDateString()}
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
                      {draft.version > 1 && (
                        <span className="text-sm text-blue-600">
                          • v{draft.version}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                    <Button variant="outline" size="sm">
                      Duplicate
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        console.log('Delete draft:', draft.id)
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}

              {filteredDrafts.length === 0 && (
                <div className="text-center py-12 text-gray-600">
                  No drafts match your filters. Try adjusting your search criteria.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}
