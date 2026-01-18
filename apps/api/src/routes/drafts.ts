import { FastifyInstance } from 'fastify'
import { successResponse, errorResponse, ApiError } from '../utils/response'
import { prisma } from '@lexigov/db'

/**
 * Draft CRUD routes
 */
export async function draftRoutes(fastify: FastifyInstance) {
  /**
   * GET /api/drafts
   * Get all drafts for current user
   */
  fastify.get('/drafts', async (request, reply) => {
    try {
      const user = (request as any).user

      if (!user) {
        throw new ApiError('Unauthorized', 401)
      }

      // Query parameters
      const { page = '1', limit = '10', status } = request.query as any

      const skip = (parseInt(page) - 1) * parseInt(limit)

      // Get drafts
      const [drafts, total] = await Promise.all([
        prisma.draft.findMany({
          where: {
            userId: user.userId,
            ...(status && { status: status.toUpperCase() }),
          },
          skip,
          take: parseInt(limit),
          orderBy: { createdAt: 'desc' },
        }),
        prisma.draft.count({
          where: {
            userId: user.userId,
            ...(status && { status: status.toUpperCase() }),
          },
        }),
      ])

      return reply.code(200).send(successResponse({
        drafts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      }))
    } catch (error: any) {
      console.error('Get drafts error:', error)
      return reply.code(500).send(errorResponse('Failed to get drafts'))
    }
  })

  /**
   * GET /api/drafts/:id
   * Get a specific draft
   */
  fastify.get('/drafts/:id', async (request, reply) => {
    try {
      const user = (request as any).user
      const { id } = request.params as any

      if (!user) {
        throw new ApiError('Unauthorized', 401)
      }

      const draft = await prisma.draft.findFirst({
        where: {
          id,
          userId: user.userId,
        },
        include: {
          template: true,
          versions: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      })

      if (!draft) {
        throw new ApiError('Draft not found', 404)
      }

      return reply.code(200).send(successResponse({ draft }))
    } catch (error: any) {
      console.error('Get draft error:', error)
      return reply.code(500).send(errorResponse('Failed to get draft'))
    }
  })

  /**
   * POST /api/drafts
   * Create a new draft
   */
  fastify.post('/drafts', async (request, reply) => {
    try {
      const user = (request as any).user

      if (!user) {
        throw new ApiError('Unauthorized', 401)
      }

      const {
        title,
        documentType,
        jurisdiction,
        jurisdictionName,
        content,
        templateId,
        commitMessage,
      } = request.body as any

      // Validate required fields
      if (!title || !documentType || !jurisdiction || !jurisdictionName || !content) {
        throw new ApiError('Missing required fields', 400)
      }

      // Create draft
      const draft = await prisma.draft.create({
        data: {
          title,
          documentType: documentType.toUpperCase(),
          jurisdiction: jurisdiction.toUpperCase(),
          jurisdictionName,
          content,
          status: 'DRAFT',
          userId: user.id,
          templateId,
          commitMessage: commitMessage || 'Initial draft',
        },
      })

      return reply.code(201).send(successResponse({ draft }))
    } catch (error: any) {
      console.error('Create draft error:', error)
      return reply.code(500).send(errorResponse('Failed to create draft'))
    }
  })

  /**
   * PUT /api/drafts/:id
   * Update a draft
   */
  fastify.put('/drafts/:id', async (request, reply) => {
    try {
      const user = (request as any).user
      const { id } = request.params as any
      const updateData = request.body as any

      if (!user) {
        throw new ApiError('Unauthorized', 401)
      }

      // Check if draft exists and belongs to user
      const existingDraft = await prisma.draft.findFirst({
        where: {
          id,
          userId: user.userId,
        },
      })

      if (!existingDraft) {
        throw new ApiError('Draft not found', 404)
      }

      // Create new version if content changed
      if (updateData.content && JSON.stringify(existingDraft.content) !== JSON.stringify(updateData.content)) {
        await prisma.draft.create({
          data: {
            title: existingDraft.title,
            documentType: existingDraft.documentType,
            jurisdiction: existingDraft.jurisdiction,
            jurisdictionName: existingDraft.jurisdictionName,
            content: existingDraft.content,
            status: existingDraft.status,
            userId: user.id,
            templateId: existingDraft.templateId,
            parentDraftId: existingDraft.id,
            version: existingDraft.version + 1,
            commitMessage: updateData.commitMessage || `Update to version ${existingDraft.version + 1}`,
          },
        })
      }

      // Update draft
      const draft = await prisma.draft.update({
        where: { id },
        data: {
          ...(updateData.title && { title: updateData.title }),
          ...(updateData.content && { content: updateData.content }),
          ...(updateData.commitMessage && { commitMessage: updateData.commitMessage }),
          ...(updateData.status && { status: updateData.status.toUpperCase() }),
          ...(updateData.aiGenerated !== undefined && { aiGenerated: updateData.aiGenerated }),
          updatedAt: new Date(),
        },
      })

      return reply.code(200).send(successResponse({ draft }))
    } catch (error: any) {
      console.error('Update draft error:', error)
      return reply.code(500).send(errorResponse('Failed to update draft'))
    }
  })

  /**
   * DELETE /api/drafts/:id
   * Delete a draft
   */
  fastify.delete('/drafts/:id', async (request, reply) => {
    try {
      const user = (request as any).user
      const { id } = request.params as any

      if (!user) {
        throw new ApiError('Unauthorized', 401)
      }

      // Check if draft exists and belongs to user
      const existingDraft = await prisma.draft.findFirst({
        where: {
          id,
          userId: user.userId,
        },
      })

      if (!existingDraft) {
        throw new ApiError('Draft not found', 404)
      }

      // Delete draft (cascade will delete related records)
      await prisma.draft.delete({
        where: { id },
      })

      return reply.code(204).send()
    } catch (error: any) {
      console.error('Delete draft error:', error)
      return reply.code(500).send(errorResponse('Failed to delete draft'))
    }
  })

  /**
   * POST /api/drafts/:id/restore
   * Restore a previous version
   */
  fastify.post('/drafts/:id/restore', async (request, reply) => {
    try {
      const user = (request as any).user
      const { id, version } = request.params as any

      if (!user) {
        throw new ApiError('Unauthorized', 401)
      }

      // Find the version to restore
      const versionDraft = await prisma.draft.findFirst({
        where: {
          id,
          userId: user.userId,
          version: parseInt(version),
        },
      })

      if (!versionDraft) {
        throw new ApiError('Version not found', 404)
      }

      // Create new draft from restored version
      const restoredDraft = await prisma.draft.create({
        data: {
          title: versionDraft.title,
          documentType: versionDraft.documentType,
          jurisdiction: versionDraft.jurisdiction,
          jurisdictionName: versionDraft.jurisdictionName,
          content: versionDraft.content,
          status: 'DRAFT',
          userId: user.id,
          templateId: versionDraft.templateId,
          parentDraftId: versionDraft.id,
          version: versionDraft.version + 1,
          commitMessage: `Restored from version ${version}`,
        },
      })

      return reply.code(201).send(successResponse({ draft: restoredDraft }))
    } catch (error: any) {
      console.error('Restore draft error:', error)
      return reply.code(500).send(errorResponse('Failed to restore draft'))
    }
  })
}
