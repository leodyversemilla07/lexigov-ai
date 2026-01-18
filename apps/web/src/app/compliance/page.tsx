'use client'

import { useState } from 'react'
import { useAuth } from '@lexigov/ui'
import { Layout } from '@lexigov/ui'
import { Button } from '@lexigov/ui'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@lexigov/ui'

export default function CompliancePage() {
  const { user, isAuthenticated } = useAuth()
  const [draftId, setDraftId] = useState('')
  const [complianceResult, setComplianceResult] = useState<any>(null)
  const [isChecking, setIsChecking] = useState(false)

  // Mock compliance check function
  const checkCompliance = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!draftId) {
      alert('Please enter a draft ID to check compliance')
      return
    }

    setIsChecking(true)

    // Simulate API call - will be replaced with actual API
    setTimeout(() => {
      const mockResult = {
        score: 78,
        status: 'NON_COMPLIANT',
        issues: [
          {
            type: 'MISSING_REQUIRED_CLAUSE',
            message: 'Missing required clause: PENALTY_CLAUSE',
            severity: 'HIGH',
          },
          {
            type: 'PENALTY_EXCEEDS_LIMITS',
            message: 'Penalty amount (₱8,000) exceeds Barangay limits (₱1,000)',
            severity: 'CRITICAL',
          },
        ],
        warnings: [
          {
            type: 'COURT_REFERENCE_MISSING',
            message: 'Imprisonment penalty requires court reference',
            severity: 'MEDIUM',
          },
        ],
        suggestions: [
          'Reduce penalty amount to within Barangay limits',
          'Add court reference for imprisonment penalty',
          'Add missing required clauses',
        ],
      }

      setComplianceResult(mockResult)
      setIsChecking(false)
    }, 1000)
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Compliance Checker
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Please sign in to access the compliance checker
          </p>
          <Button onClick={() => window.location.href = '/api/auth/login'}>
            Sign In
          </Button>
        </div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    if (status === 'COMPLIANT') return 'bg-green-500'
    if (status === 'NON_COMPLIANT') return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getSeverityColor = (severity: string) => {
    if (severity === 'CRITICAL') return 'bg-red-500'
    if (severity === 'HIGH') return 'bg-red-200'
    if (severity === 'MEDIUM') return 'bg-yellow-300'
    return 'border-gray-200'
  }

  return (
    <Layout user={user} currentPage="compliance">
      <div className="p-6 space-y-6">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Compliance Checker
          </h1>
          <p className="text-gray-600">
            Check your ordinances for RA 7160 (Local Government Code of 1991) compliance issues and legal requirements.
          </p>
        </div>

        {/* Compliance Check Form */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Check Ordinance Compliance</CardTitle>
            <CardDescription>Enter a draft ID to analyze compliance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Draft ID
              </label>
              <input
                type="text"
                placeholder="Enter draft ID..."
                value={draftId}
                onChange={(e) => setDraftId((e.target as HTMLInputElement).value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <Button
              onClick={checkCompliance}
              disabled={isChecking || !draftId}
              className="w-full"
            >
              {isChecking ? 'Checking...' : 'Check Compliance'}
            </Button>
          </CardContent>
        </Card>

        {/* Compliance Results */}
        {complianceResult && (
          <Card>
            <CardHeader>
              <CardTitle>Compliance Report</CardTitle>
              <CardDescription>
                Score: {complianceResult.score}/100
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Status Badge */}
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-white font-bold mb-4 ${getStatusColor(complianceResult.status)}`}>
                {complianceResult.status === 'COMPLIANT' ? '✓ Compliant' : complianceResult.status === 'NON_COMPLIANT' ? '⚠ Issues Found' : '✗ Critical Issues'}
              </div>

              {/* Issues List */}
              <div className="space-y-4 mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Issues Found ({complianceResult.issues ? complianceResult.issues.length : 0})
                </h3>

                {complianceResult.issues && complianceResult.issues.map((issue, index) => (
                  <div key={index} className={`p-4 border-l-4 rounded-md ${getSeverityColor(issue.severity)}`}>
                    <div className="font-semibold text-gray-900 mb-1">
                      {issue.type}
                    </div>
                    <p className="text-sm text-gray-700">
                      {issue.message}
                    </p>
                    {issue.severity === 'CRITICAL' && (
                      <div className="mt-2 p-3 bg-red-100 rounded">
                        <p className="text-xs font-semibold text-red-700">
                          CRITICAL - Immediate Action Required
                        </p>
                      </div>
                    )}
                  </div>
                ))}

                {complianceResult.issues && complianceResult.issues.length === 0 && (
                  <div className="text-center py-12 text-gray-600">
                    No issues found. Your ordinance is compliant!
                  </div>
                )}
              </div>

              {/* Suggestions */}
              {complianceResult.suggestions && complianceResult.suggestions.length > 0 && (
                <div className="p-4 bg-blue-50 rounded-md mb-6">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Suggestions for Improvement
                  </h3>
                  <ul className="list-disc list-inside space-y-2">
                    {complianceResult.suggestions.map((suggestion, index) => (
                      <li key={index} className="text-sm text-gray-700">
                        • {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  )
}
