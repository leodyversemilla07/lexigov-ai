'use client'

import { useState } from 'react'
import { useAuth } from '@lexigov/ui'
import { Layout } from '@lexigov/ui'
import { Button } from '@lexigov/ui'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@lexigov/ui'
import { Input } from '@lexigov/ui'

export default function TemplatesPage() {
  const { user, isAuthenticated } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')

  // Mock templates data - will be replaced with actual API calls
  const templates = [
    {
      id: '1',
      name: 'Barangay Anti-Illegal Gambling Ordinance',
      category: 'SOCIAL_SERVICES',
      documentType: 'ORDINANCE',
      description: 'Comprehensive ordinance banning illegal gambling operations within barangays, defining penalties and enforcement mechanisms.',
      jurisdiction: 'BARANGAY',
      requiredUses: ['TITLE', 'PRELIMINARY_CLAUSE', 'PENALTY_CLAUSE', 'SEPARABILITY_CLAUSE'],
      status: 'PUBLISHED',
      createdBy: {
        id: 'admin-1',
        name: 'Admin User',
        email: 'admin@lexigov.ai',
      },
    },
    {
      id: '2',
      name: 'Barangay Resolution No. 2023-001',
      category: 'LEGISLATIVE',
      documentType: 'RESOLUTION',
      description: 'Official barangay resolution calling for the cancellation of unpermitted small business establishments operating without business permits.',
      jurisdiction: 'BARANGAY',
      requiredUses: ['TITLE', 'REQUIREMENTS', 'DATE_EFFECTIVITY', 'AUTHORITY_CLAUSE'],
      status: 'PUBLISHED',
      createdBy: {
        id: 'admin-1',
        name: 'Admin User',
        email: 'admin@lexigov.ai',
      },
    },
    {
      id: '3',
      name: 'Clean and Green Program Ordinance',
      category: 'ENVIRONMENT',
      documentType: 'ORDINANCE',
      description: 'Environmental ordinance establishing guidelines for waste segregation, recycling practices, and maintenance of barangay cleanliness programs.',
      jurisdiction: 'BARANGAY',
      requiredUses: ['TITLE', 'OBJECTIVES', 'IMPLEMENTATION_CLAUSE', 'PENALTY_CLAUSE'],
      status: 'PUBLISHED',
      createdBy: {
        id: 'admin-1',
        name: 'Admin User',
        email: 'admin@lexigov.ai',
      },
    },
    {
      id: '4',
      name: 'Zoning Ordinance Template',
      category: 'LAND_USE',
      documentType: 'ORDINANCE',
      description: 'Template for barangay zoning ordinances regulating land use, building setbacks, and commercial zones.',
      jurisdiction: 'CITY',
      requiredUses: ['TITLE', 'AUTHORITY_CLAUSE', 'ZONING_CLASSIFICATION', 'EFFECTIVITY_CLAUSE'],
      status: 'PUBLISHED',
      createdBy: {
        id: 'admin-1',
        name: 'Admin User',
        email: 'admin@lexigov.ai',
      },
    },
    {
      id: '5',
      name: 'Revenue Generation Ordinance',
      category: 'FINANCE',
      documentType: 'ORDINANCE',
      description: 'Template for barangay revenue ordinances covering local business taxes, fees, and revenue generation mechanisms.',
      jurisdiction: 'CITY',
      requiredUses: ['TITLE', 'AUTHORITY_CLAUSE', 'APPROVAL_CLAUSE', 'FUNDS_CLAUSE'],
      status: 'PUBLISHED',
      createdBy: {
        id: 'admin-1',
        name: 'Admin User',
        email: 'admin@lexigov.ai',
      },
    },
    {
      id: '6',
      name: 'Health and Sanitation Ordinance',
      category: 'HEALTH',
      documentType: 'ORDINANCE',
      description: 'Template for health and sanitation ordinances covering waste management, food establishment regulations, and disease prevention protocols.',
      jurisdiction: 'CITY',
      requiredUses: ['TITLE', 'AUTHORITY_CLAUSE', 'IMPLEMENTATION_CLAUSE', 'PENALTY_CLAUSE'],
      status: 'PUBLISHED',
      createdBy: {
        id: 'admin-1',
        name: 'Admin User',
        email: 'admin@lexigov.ai',
      },
    },
    {
      id: '7',
      name: 'Construction and Safety Ordinance',
      category: 'INFRASTRUCTURE',
      documentType: 'ORDINANCE',
      description: 'Template for construction and safety ordinances covering building permits, safety standards, and structural regulations.',
      jurisdiction: 'CITY',
      requiredUses: ['TITLE', 'AUTHORITY_CLAUSE', 'SAFETY_CLAUSE', 'PENALTY_CLAUSE'],
      status: 'PUBLISHED',
      createdBy: {
        id: 'admin-1',
        name: 'Admin User',
        email: 'admin@lexigov.ai',
      },
    },
    {
      id: '8',
      name: 'Traffic and Transportation Ordinance',
      category: 'TRANSPORTATION',
      documentType: 'ORDINANCE',
      description: 'Template for traffic management and transportation ordinances covering vehicle regulation, parking rules, and road maintenance.',
      jurisdiction: 'CITY',
      requiredUses: ['TITLE', 'AUTHORITY_CLAUSE', 'ENACTING_CLAUSE', 'PENALTY_CLAUSE'],
      status: 'PUBLISHED',
      createdBy: {
        id: 'admin-1',
        name: 'Admin User',
        email: 'admin@lexigov.ai',
      },
    },
  ]

  const filteredTemplates = templates.filter((template) => {
    if (!searchTerm) return true
    const searchLower = searchTerm.toLowerCase()
    return (
      template.name.toLowerCase().includes(searchLower) ||
      template.category.toLowerCase().includes(searchLower) ||
      template.documentType.toLowerCase().includes(searchLower)
    )
  })

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Ordinance Templates
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Please sign in to browse and use ordinance templates
          </p>
          <Button onClick={() => window.location.href = '/api/auth/login'}>
            Sign In
          </Button>
        </div>
      </div>
    )
  }

  return (
    <Layout user={user} currentPage="templates">
      <div className="p-6 space-y-6">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Ordinance Templates
          </h1>
          <p className="text-gray-600">
            Browse and use pre-built ordinance templates compliant with RA 7160 (Local Government Code of 1991)
          </p>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Search templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm((e.target as HTMLInputElement).value)}
                  className="w-full"
                />
              </div>
              <Button variant="outline">
                Search
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Category Filters */}
        <Card className="mb-6">
          <CardContent>
            <h3 className="font-semibold text-gray-900 mb-4">
              Filter by Category
            </h3>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm">
                All
              </Button>
              <Button variant="outline" size="sm">
                Social Services
              </Button>
              <Button variant="outline" size="sm">
                Legislative
              </Button>
              <Button variant="outline" size="sm">
                Environment
              </Button>
              <Button variant="outline" size="sm">
                Land Use
              </Button>
              <Button variant="outline" size="sm">
                Finance
              </Button>
              <Button variant="outline" size="sm">
                Health
              </Button>
              <Button variant="outline" size="sm">
                Infrastructure
              </Button>
              <Button variant="outline" size="sm">
                Transportation
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle>
                  {template.name}
                </CardTitle>
                <CardDescription>
                  {template.category} • {template.documentType}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  {template.description}
                </p>
                <div className="flex items-center gap-2 mb-4">
                  <div className="text-sm text-gray-600">
                    Jurisdiction: {template.jurisdiction}
                  </div>
                  <div className="text-sm text-gray-600">
                    Status: {template.status}
                  </div>
                  <div className="text-sm text-gray-600">
                    Created by: {template.createdBy.name}
                  </div>
                </div>
                <Button
                  className="w-full"
                  onClick={() => {
                    console.log('Use template:', template.id)
                    // TODO: Implement start from template functionality
                  }}
                >
                  Use This Template
                </Button>
              </CardContent>
            </Card>
          ))}

          {filteredTemplates.length === 0 && (
            <div className="text-center py-12 text-gray-600">
              No templates match your search. Try different filters.
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
