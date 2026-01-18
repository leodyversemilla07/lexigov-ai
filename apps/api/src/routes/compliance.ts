import { FastifyInstance } from 'fastify'
import { successResponse, errorResponse, ApiError } from '../utils/response'
import { prisma } from '@lexigov/db'

/**
 * Required clauses for Philippine ordinances based on RA 7160
 */
const REQUIRED_CLAUSES = [
  'TITLE',
  'PRELIMINARY_CLAUSE',
  'STATEMENT_OF_POLICY',
  'ENACTING_CLAUSE',
  'DATE_EFFECTIVITY',
  'SEPARABILITY_CLAUSE',
  'REPEALING_CLAUSE',
  'EFFECTIVITY_CLAUSE',
  'PENALTY_CLAUSE',
  'AUTHORITY_CLAUSE',
  'APPROVAL_CLAUSE',
  'IMPLEMENTATION_CLAUSE',
  'ALLOCATION_CLAUSE',
  'FUNDS_CLAUSE',
  'AMENDMENT_CLAUSE',
  'REPEALING_CLAUSE',
  'EFFECTIVITY_DATE',
  'SUPERSEDING_CLAUSES',
]

/**
 * Jurisdiction-specific penalty limits based on RA 7160
 */
const PENALTY_LIMITS = {
  BARANGAY: {
    maxFine: 1000,
    maxImprisonmentDays: 1,
    imprisonmentCourt: true,
  },
  MUNICIPAL: {
    maxFine: 5000,
    maxImprisonmentDays: 365,
    imprisonmentCourt: true,
  },
  CITY: {
    maxFine: 5000,
    maxImprisonmentDays: 365,
    imprisonmentCourt: true,
  },
  PROVINCIAL: {
    maxFine: null, // Custom limits
    maxImprisonmentDays: null,
    imprisonmentCourt: true,
  },
}

/**
 * Check if a penalty exceeds limits for jurisdiction
 */
function checkPenaltyLimit(jurisdiction: string, penalty: any): boolean {
  const limits = PENALTY_LIMITS[jurisdiction.toUpperCase() as keyof typeof PENALTY_LIMITS]
  if (!limits) return true

  if (penalty.fine && limits.maxFine && penalty.fine > limits.maxFine) {
    return false
  }

  if (penalty.imprisonmentDays && limits.maxImprisonmentDays && penalty.imprisonmentDays > limits.maxImprisonmentDays) {
    return false
  }

  return true
}

/**
 * Analyze ordinance content and generate compliance report
 */
function analyzeCompliance(draft: any, content: any): any {
  const issues: any[] = []
  const warnings: any[] = []
  let score = 100

  // Check required clauses
  const contentLower = content.toLowerCase()

  for (const clause of REQUIRED_CLAUSES) {
    const clauseLower = clause.toLowerCase().replace(/_/g, ' ')
    if (!contentLower.includes(clauseLower)) {
      issues.push({
        type: 'MISSING_REQUIRED_CLAUSE',
        message: `Missing required clause: ${clause}`,
        severity: 'HIGH',
      })
      score -= 15
    }
  }

  // Check penalty limits
  const jurisdiction = draft.jurisdiction?.toUpperCase()
  if (content.penalty) {
    const withinLimits = checkPenaltyLimit(jurisdiction, content.penalty)
    if (!withinLimits) {
      issues.push({
        type: 'PENALTY_EXCEEDS_LIMITS',
        message: `Penalty exceeds ${jurisdiction} limits`,
        severity: 'CRITICAL',
      })
      score -= 20
    }

    // Check if imprisonment requires court
    if (content.penalty?.imprisonmentDays && content.penalty.imprisonmentDays > 0) {
      const limits = PENALTY_LIMITS[jurisdiction as keyof typeof PENALTY_LIMITS]
      if (limits?.imprisonmentCourt && !content.penalty.courtRef) {
        warnings.push({
          type: 'COURT_REFERENCE_MISSING',
          message: 'Imprisonment penalty requires court reference',
          severity: 'MEDIUM',
        })
      }
    }
  }

  // Check if title contains jurisdiction name
  const jurisdictionName = draft.jurisdictionName || 'Jurisdiction'
  if (!draft.title?.includes(jurisdictionName)) {
    issues.push({
      type: 'TITLE_MISSING_JURISDICTION',
      message: 'Title should include jurisdiction name',
      severity: 'LOW',
    })
    score -= 5
  }

  // Check document type appropriateness
  const typeMapping: { [key: string]: string[] } = {
    BARANGAY: ['ORDINANCE'],
    MUNICIPAL: ['ORDINANCE', 'RESOLUTION'],
    CITY: ['ORDINANCE', 'RESOLUTION', 'ORDINANCE_RESOLVED'],
    PROVINCIAL: ['ORDINANCE', 'RESOLUTION', 'PROVINCIAL_ORDINANCE'],
  }

  if (typeMapping[jurisdiction]) {
    if (!typeMapping[jurisdiction].includes(draft.documentType)) {
      issues.push({
        type: 'INVALID_DOCUMENT_TYPE',
        message: `${draft.documentType} may not be appropriate for ${jurisdiction}`,
        severity: 'LOW',
      })
      score -= 5
    }
  }

  return { issues, warnings, score }
}

/**
 * Generate improvement suggestions
 */
function generateSuggestions(issues: any[], jurisdiction: string): string[] {
  const suggestions: string[] = []

  issues.forEach((issue: any) => {
    switch (issue.type) {
      case 'MISSING_REQUIRED_CLAUSE':
        suggestions.push(
          `Consider adding the required clause: ${issue.message.replace('Missing required clause: ', '')}`
        )
        break
      case 'PENALTY_EXCEEDS_LIMITS':
        const limits = PENALTY_LIMITS[jurisdiction.toUpperCase() as keyof typeof PENALTY_LIMITS]
        if (limits) {
          suggestions.push(
            `Reduce penalty to within ${jurisdiction} limits (Fine: ${limits.maxFine}, Imprisonment: ${limits.maxImprisonmentDays} days)`
          )
          if (limits.imprisonmentCourt) {
            suggestions.push('Add court reference for imprisonment penalty')
          }
        }
        break
      case 'TITLE_MISSING_JURISDICTION':
        suggestions.push('Include jurisdiction name in ordinance title')
        break
      case 'INVALID_DOCUMENT_TYPE':
        suggestions.push('Verify document type is appropriate for this jurisdiction level')
        break
      case 'COURT_REFERENCE_MISSING':
        suggestions.push('When imposing imprisonment, specify the court that will enforce it')
        break
    }
  })

  return suggestions
}

/**
 * Compliance Checker routes
 */
export async function complianceRoutes(fastify: FastifyInstance) {
  /**
   * POST /api/compliance/check
   * Check a draft for compliance
   */
  fastify.post('/compliance/check', async (request, reply) => {
    try {
      const user = (request as any).user

      if (!user) {
        throw new ApiError('Unauthorized', 401)
      }

      const { draftId, content } = request.body as any

      if (!draftId) {
        throw new ApiError('Draft ID is required', 400)
      }

      // Get draft
      const draft = await prisma.draft.findUnique({
        where: { id: draftId },
      })

      if (!draft) {
        throw new ApiError('Draft not found', 404)
      }

      // Analyze compliance
      const { issues, warnings, score } = analyzeCompliance(draft, content || draft.content)

      // Save or update compliance report
      const existingReport = await prisma.complianceReport.findFirst({
        where: { draftId },
      })

      let report
      if (existingReport) {
        report = await prisma.complianceReport.update({
          where: { id: existingReport.id },
          data: {
            issues: JSON.stringify(issues),
            warnings: JSON.stringify(warnings),
            score,
            checkedById: user.id,
            suggestions: JSON.stringify(generateSuggestions(issues, draft.jurisdiction || 'MUNICIPAL')),
            checkedAt: new Date(),
          },
        })
      } else {
        report = await prisma.complianceReport.create({
          data: {
            draftId,
            issues: JSON.stringify(issues),
            warnings: JSON.stringify(warnings),
            score,
            status: score >= 80 ? 'COMPLIANT' : 'NON_COMPLIANT',
            checkedById: user.id,
            suggestions: JSON.stringify(generateSuggestions(issues, draft.jurisdiction || 'MUNICIPAL')),
            checkedAt: new Date(),
          },
        })
      }

      return reply.code(200).send(successResponse({
        report: {
          id: report.id,
          draftId: report.draftId,
          score: report.score,
          status: report.status,
          issues,
          warnings,
          suggestions: report.suggestions ? JSON.parse(report.suggestions) : [],
        },
      }))
    } catch (error: any) {
      console.error('Compliance check error:', error)
      return reply.code(500).send(errorResponse('Failed to check compliance'))
    }
  })

  /**
   * GET /api/compliance/reports
   * Get compliance reports for a draft
   */
  fastify.get('/compliance/reports', async (request, reply) => {
    try {
      const user = (request as any).user

      if (!user) {
        throw new ApiError('Unauthorized', 401)
      }

      const { draftId } = request.query as any

      if (!draftId) {
        throw new ApiError('Draft ID is required', 400)
      }

      // Get compliance reports
      const reports = await prisma.complianceReport.findMany({
        where: { draftId },
        orderBy: { checkedAt: 'desc' },
      })

      return reply.code(200).send(successResponse({ reports }))
    } catch (error: any) {
      console.error('Get compliance reports error:', error)
      return reply.code(500).send(errorResponse('Failed to get compliance reports'))
    }
  })

  /**
   * GET /api/compliance/reports/:id
   * Get a specific compliance report
   */
  fastify.get('/compliance/reports/:id', async (request, reply) => {
    try {
      const user = (request as any).user

      if (!user) {
        throw new ApiError('Unauthorized', 401)
      }

      const { id } = request.params as any

      const report = await prisma.complianceReport.findUnique({
        where: { id },
      })

      if (!report) {
        throw new ApiError('Report not found', 404)
      }

      return reply.code(200).send(successResponse({ report }))
    } catch (error: any) {
      console.error('Get report error:', error)
      return reply.code(500).send(errorResponse('Failed to get report'))
    }
  })

  /**
   * GET /api/compliance/summary
   * Get compliance summary for user's drafts
   */
  fastify.get('/compliance/summary', async (request, reply) => {
    try {
      const user = (request as any).user

      if (!user) {
        throw new ApiError('Unauthorized', 401)
      }

      // Get all compliance reports
      const reports = await prisma.complianceReport.findMany({
        where: { checkedById: user.id },
        select: {
          id: true,
          score: true,
          status: true,
          checkedAt: true,
        },
      })

      // Calculate summary
      const total = reports.length
      const compliant = reports.filter((r: any) => r.status === 'COMPLIANT').length
      const nonCompliant = reports.filter((r: any) => r.status === 'NON_COMPLIANT').length
      const avgScore = total > 0 ? reports.reduce((sum: number, r: any) => sum + r.score, 0) / total : 0

      return reply.code(200).send(successResponse({
        summary: {
          total,
          compliant,
          nonCompliant,
          averageScore: Math.round(avgScore),
          complianceRate: total > 0 ? Math.round((compliant / total) * 100) : 0,
        },
      }))
    } catch (error: any) {
      console.error('Compliance summary error:', error)
      return reply.code(500).send(errorResponse('Failed to get compliance summary'))
    }
  })
}
