import { FastifyInstance } from 'fastify'
import { successResponse, errorResponse, ApiError } from '../utils/response'
import { prisma } from '@lexigov/db'

/**
 * Export History routes
 */
export async function exportRoutes(fastify: FastifyInstance) {
  /**
   * POST /api/exports
   * Create a new export record
   */
  fastify.post('/exports', async (request, reply) => {
    try {
      const user = (request as any).user

      if (!user) {
        throw new ApiError('Unauthorized', 401)
      }

      const { draftId, format = 'PDF', options = {} } = request.body as any

      if (!draftId) {
        throw new ApiError('Draft ID is required', 400)
      }

      // Validate format
      if (!['PDF', 'DOCX', 'DOC'].includes(format)) {
        throw new ApiError('Invalid export format', 400)
      }

      // Get draft
      const draft = await prisma.draft.findUnique({
        where: { id: draftId },
      })

      if (!draft) {
        throw new ApiError('Draft not found', 404)
      }

      // Create export record
      const exportHistory = await prisma.exportHistory.create({
        data: {
          draftId,
          format,
          options: options || {},
          status: 'COMPLETED',
          userId: user.id,
          fileName: `${draft.title.replace(/[^a-zA-Z0-9]/g, '_')}.${format.toLowerCase()}`,
          exportedAt: new Date(),
        },
      })

      // Update draft export status if needed
      await prisma.draft.update({
        where: { id: draftId },
        data: {
          status: 'EXPORTED',
          exportedAt: new Date(),
        },
      })

      return reply.code(201).send(successResponse({
        export: exportHistory,
        message: `Successfully exported draft to ${format.toUpperCase()}`,
      }))
    } catch (error: any) {
      console.error('Create export error:', error)
      return reply.code(500).send(errorResponse('Failed to create export'))
    }
  })

  /**
   * GET /api/exports
   * Get export history for a draft
   */
  fastify.get('/exports', async (request, reply) => {
    try {
      const user = (request as any).user

      if (!user) {
        throw new ApiError('Unauthorized', 401)
      }

      const { draftId, page = '1', limit = '20' } = request.query as any

      if (!draftId) {
        throw new ApiError('Draft ID is required', 400)
      }

      const skip = (parseInt(page) - 1) * parseInt(limit)

      // Get exports
      const [exports, total] = await Promise.all([
        prisma.exportHistory.findMany({
          where: { draftId },
          orderBy: { exportedAt: 'desc' },
          skip,
          take: parseInt(limit),
        }),
        prisma.exportHistory.count({
          where: { draftId },
        }),
      ])

      return reply.code(200).send(successResponse({
        exports,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      }))
    } catch (error: any) {
      console.error('Get exports error:', error)
      return reply.code(500).send(errorResponse('Failed to get exports'))
    }
  })

  /**
   * GET /api/exports/:id
   * Get a specific export record
   */
  fastify.get('/exports/:id', async (request, reply) => {
    try {
      const user = (request as any).user

      if (!user) {
        throw new ApiError('Unauthorized', 401)
      }

      const { id } = request.params as any

      const exportRecord = await prisma.exportHistory.findUnique({
        where: { id },
      })

      if (!exportRecord) {
        throw new ApiError('Export record not found', 404)
      }

      return reply.code(200).send(successResponse({ export: exportRecord }))
    } catch (error: any) {
      console.error('Get export error:', error)
      return reply.code(500).send(errorResponse('Failed to get export'))
    }
  })

  /**
   * DELETE /api/exports/:id
   * Delete an export record
   */
  fastify.delete('/exports/:id', async (request, reply) => {
    try {
      const user = (request as any).user

      if (!user) {
        throw new ApiError('Unauthorized', 401)
      }

      const { id } = request.params as any

      // Check if export exists
      const exportRecord = await prisma.exportHistory.findUnique({
        where: { id },
      })

      if (!exportRecord) {
        throw new ApiError('Export record not found', 404)
      }

      // Delete export (cascade will handle related records)
      await prisma.exportHistory.delete({
        where: { id },
      })

      return reply.code(204).send()
    } catch (error: any) {
      console.error('Delete export error:', error)
      return reply.code(500).send(errorResponse('Failed to delete export'))
    }
  })
}
