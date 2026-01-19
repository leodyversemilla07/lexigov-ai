import type { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { successResponse, errorResponse, ApiError } from '../utils/response.js'
import type { AuthenticatedRequest } from '../utils/auth.js'
import {
  generateOrdinance,
  checkCompliance,
  generateExecutiveSummary,
  suggestLegalReferences
} from '../services/gemini.js'
import type {
  OrdinanceGenerationParams,
  PhilippineOrdinance,
  JurisdictionLevel
} from '@repo/types'

/**
 * AI Generation routes plugin
 * Provides endpoints for ordinance generation, compliance checking, and AI assistance
 */
export const aiRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  /**
   * POST /ai/generate
   * Generate a complete ordinance using Vertex AI (Gemini)
   */
  fastify.post<{
    Body: {
      topic: string
      ordinanceType: JurisdictionLevel
      jurisdiction: {
        name: string
        province?: string
        city?: string
      }
      problemStatement: string
      objectives: string[]
      targetPopulation: string
      prohibitedActs: string[]
      enforcementBody: string
      penalties?: {
        firstOffense?: string
        secondOffense?: string
        thirdOffense?: string
      }
      exceptions?: string[]
      budget?: string
      useProModel?: boolean
    }
  }>(
    '/ai/generate',
    {
      schema: {
        body: {
          type: 'object',
          required: [
            'topic',
            'ordinanceType',
            'jurisdiction',
            'problemStatement',
            'objectives',
            'targetPopulation',
            'prohibitedActs',
            'enforcementBody'
          ],
          properties: {
            topic: { type: 'string' },
            ordinanceType: {
              type: 'string',
              enum: ['barangay', 'city', 'municipal', 'provincial']
            },
            jurisdiction: {
              type: 'object',
              required: ['name'],
              properties: {
                name: { type: 'string' },
                province: { type: 'string' },
                city: { type: 'string' }
              }
            },
            problemStatement: { type: 'string' },
            objectives: {
              type: 'array',
              items: { type: 'string' }
            },
            targetPopulation: { type: 'string' },
            prohibitedActs: {
              type: 'array',
              items: { type: 'string' }
            },
            enforcementBody: { type: 'string' },
            penalties: {
              type: 'object',
              properties: {
                firstOffense: { type: 'string' },
                secondOffense: { type: 'string' },
                thirdOffense: { type: 'string' }
              }
            },
            exceptions: {
              type: 'array',
              items: { type: 'string' }
            },
            budget: { type: 'string' },
            useProModel: { type: 'boolean' }
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const user = (request as AuthenticatedRequest).user

        if (!user) {
          throw new ApiError('Unauthorized', 401)
        }

        const params: OrdinanceGenerationParams = {
          topic: request.body.topic,
          ordinanceType: request.body.ordinanceType,
          jurisdiction: request.body.jurisdiction,
          problemStatement: request.body.problemStatement,
          objectives: request.body.objectives,
          targetPopulation: request.body.targetPopulation,
          prohibitedActs: request.body.prohibitedActs,
          enforcementBody: request.body.enforcementBody,
          penalties: request.body.penalties,
          exceptions: request.body.exceptions,
          budget: request.body.budget
        }

        // Generate ordinance using Vertex AI
        fastify.log.info({ params, model: request.body.useProModel ? 'pro' : 'flash' }, 'Generating ordinance')

        const result = await generateOrdinance(params, request.body.useProModel || false)

        return reply.code(201).send(
          successResponse({
            ordinance: result.ordinance,
            metadata: {
              generatedAt: result.generatedAt,
              model: result.model,
              tokens: result.tokens
            },
            message: 'Ordinance generated successfully'
          })
        )
      } catch (error) {
        if (error instanceof ApiError) {
          return reply.code(error.statusCode).send(errorResponse(error.message))
        }
        fastify.log.error(error, 'AI generate error')
        return reply.code(500).send(
          errorResponse(
            `Failed to generate ordinance: ${error instanceof Error ? error.message : 'Unknown error'}`
          )
        )
      }
    }
  )

  /**
   * POST /ai/check-compliance
   * Check ordinance compliance with RA 7160 using Vertex AI
   */
  fastify.post<{
    Body: {
      ordinance: PhilippineOrdinance
    }
  }>(
    '/ai/check-compliance',
    {
      schema: {
        body: {
          type: 'object',
          required: ['ordinance'],
          properties: {
            ordinance: { type: 'object' }
          }
        }
      }
    },
    async (request, reply) => {
      try {
        const user = (request as AuthenticatedRequest).user

        if (!user) {
          throw new ApiError('Unauthorized', 401)
        }

        fastify.log.info('Checking ordinance compliance')

        const result = await checkCompliance(request.body.ordinance)

        return reply.code(200).send(
          successResponse({
            compliance: result,
            message: result.isValid
              ? 'Ordinance is compliant with RA 7160'
              : 'Ordinance has compliance issues'
          })
        )
      } catch (error) {
        if (error instanceof ApiError) {
          return reply.code(error.statusCode).send(errorResponse(error.message))
        }
        fastify.log.error(error, 'Compliance check error')
        return reply.code(500).send(
          errorResponse(
            `Failed to check compliance: ${error instanceof Error ? error.message : 'Unknown error'}`
          )
        )
      }
    }
  )

  /**
   * POST /ai/executive-summary
   * Generate an executive summary for an ordinance
   */
  fastify.post<{
    Body: {
      ordinance: PhilippineOrdinance
    }
  }>(
    '/ai/executive-summary',
    {
      schema: {
        body: {
          type: 'object',
          required: ['ordinance'],
          properties: {
            ordinance: { type: 'object' }
          }
        }
      }
    },
    async (request, reply) => {
      try {
        const user = (request as AuthenticatedRequest).user

        if (!user) {
          throw new ApiError('Unauthorized', 401)
        }

        fastify.log.info('Generating executive summary')

        const summary = await generateExecutiveSummary(request.body.ordinance)

        return reply.code(200).send(
          successResponse({
            summary,
            message: 'Executive summary generated successfully'
          })
        )
      } catch (error) {
        if (error instanceof ApiError) {
          return reply.code(error.statusCode).send(errorResponse(error.message))
        }
        fastify.log.error(error, 'Executive summary error')
        return reply.code(500).send(
          errorResponse(
            `Failed to generate executive summary: ${error instanceof Error ? error.message : 'Unknown error'}`
          )
        )
      }
    }
  )

  /**
   * POST /ai/suggest-references
   * Suggest legal references for ordinance content
   */
  fastify.post<{
    Body: {
      content: string
      jurisdiction: JurisdictionLevel
    }
  }>(
    '/ai/suggest-references',
    {
      schema: {
        body: {
          type: 'object',
          required: ['content', 'jurisdiction'],
          properties: {
            content: { type: 'string' },
            jurisdiction: {
              type: 'string',
              enum: ['barangay', 'city', 'municipal', 'provincial']
            }
          }
        }
      }
    },
    async (request, reply) => {
      try {
        const user = (request as AuthenticatedRequest).user

        if (!user) {
          throw new ApiError('Unauthorized', 401)
        }

        fastify.log.info({ jurisdiction: request.body.jurisdiction }, 'Suggesting legal references')

        const references = await suggestLegalReferences(
          request.body.content,
          request.body.jurisdiction
        )

        return reply.code(200).send(
          successResponse({
            references,
            count: references.length,
            message: 'Legal references suggested successfully'
          })
        )
      } catch (error) {
        if (error instanceof ApiError) {
          return reply.code(error.statusCode).send(errorResponse(error.message))
        }
        fastify.log.error(error, 'Legal references error')
        return reply.code(500).send(
          errorResponse(
            `Failed to suggest legal references: ${error instanceof Error ? error.message : 'Unknown error'}`
          )
        )
      }
    }
  )
}

