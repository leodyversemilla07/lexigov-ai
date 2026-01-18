import { FastifyInstance } from 'fastify'
import { successResponse, errorResponse, ApiError } from '../utils/response'
import { prisma } from '@lexigov/db'

/**
 * Template CRUD routes
 */
export async function templateRoutes(fastify: FastifyInstance) {
  /**
   * GET /api/templates
   * Get all templates for current user
   */
  fastify.get('/templates', async (request, reply) => {
    try {
      const user = (request as any).user

      if (!user) {
        throw new ApiError('Unauthorized', 401)
      }

      // Query parameters
      const { page = '1', limit = '20', category, documentType } = request.query as any

      const skip = (parseInt(page) - 1) * parseInt(limit)

      // Get templates (filtering is optional)
      const [templates, total] = await Promise.all([
        prisma.template.findMany({
          where: {
            ...(category && { category }),
            ...(documentType && { documentType: documentType.toUpperCase() }),
          },
          skip,
          take: parseInt(limit),
          orderBy: { createdAt: 'desc' },
        }),
        prisma.template.count({
          where: {
            ...(category && { category }),
            ...(documentType && { documentType: documentType.toUpperCase() }),
          },
        }),
      ])

      return reply.code(200).send(successResponse({
        templates,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      }))
    } catch (error: any) {
      console.error('Get templates error:', error)
      return reply.code(500).send(errorResponse('Failed to get templates'))
    }
  })

  /**
   * GET /api/templates/categories
   * Get all template categories
   */
  fastify.get('/templates/categories', async (request, reply) => {
    try {
      // Get distinct categories from templates
      const templates = await prisma.template.findMany({
        select: { category: true },
        distinct: ['category'],
        where: { category: { not: null } },
      })

      const categories = templates.map((t) => t.category)

      return reply.code(200).send(successResponse({ categories }))
    } catch (error: any) {
      console.error('Get categories error:', error)
      return reply.code(500).send(errorResponse('Failed to get categories'))
    }
  })

  /**
   * GET /api/templates/:id
   * Get a specific template
   */
  fastify.get('/templates/:id', async (request, reply) => {
    try {
      const { id } = request.params as any

      const template = await prisma.template.findUnique({
        where: { id },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })

      if (!template) {
        throw new ApiError('Template not found', 404)
      }

      return reply.code(200).send(successResponse({ template }))
    } catch (error: any) {
      console.error('Get template error:', error)
      return reply.code(500).send(errorResponse('Failed to get template'))
    }
  })

  /**
   * POST /api/templates
   * Create a new template (admin only)
   */
  fastify.post('/templates', async (request, reply) => {
    try {
      const user = (request as any).user

      if (!user) {
        throw new ApiError('Unauthorized', 401)
      }

      // Check if user has permission (admin or legislative staff)
      if (
        !['ADMIN', 'LEGISLATIVE_STAFF', 'BARANGAY_SECRETARY', 'CITY_COUNCIL'].includes(user.role)
      ) {
        throw new ApiError('Insufficient permissions', 403)
      }

      const {
        name,
        category,
        documentType,
        description,
        jurisdiction,
        placeholderData,
        requiredClauses,
      } = request.body as any

      // Validate required fields
      if (!name || !category || !documentType || !jurisdiction) {
        throw new ApiError('Missing required fields', 400)
      }

      // Create template
      const template = await prisma.template.create({
        data: {
          name,
          category,
          documentType: documentType.toUpperCase(),
          description: description || '',
          jurisdiction: jurisdiction.toUpperCase(),
          placeholderData: placeholderData || {},
          requiredClauses: requiredClauses || [],
          status: 'PUBLISHED',
          createdById: user.id,
        },
      })

      return reply.code(201).send(successResponse({ template }))
    } catch (error: any) {
      console.error('Create template error:', error)
      return reply.code(500).send(errorResponse('Failed to create template'))
    }
  })

  /**
   * PUT /api/templates/:id
   * Update a template (admin only)
   */
  fastify.put('/templates/:id', async (request, reply) => {
    try {
      const user = (request as any).user
      const { id } = request.params as any
      const updateData = request.body as any

      if (!user) {
        throw new ApiError('Unauthorized', 401)
      }

      // Check if user has permission
      if (
        !['ADMIN', 'LEGISLATIVE_STAFF', 'BARANGAY_SECRETARY', 'CITY_COUNCIL'].includes(user.role)
      ) {
        throw new ApiError('Insufficient permissions', 403)
      }

      // Check if template exists
      const existingTemplate = await prisma.template.findUnique({
        where: { id },
      })

      if (!existingTemplate) {
        throw new ApiError('Template not found', 404)
      }

      // Update template
      const template = await prisma.template.update({
        where: { id },
        data: {
          ...(updateData.name && { name: updateData.name }),
          ...(updateData.category && { category: updateData.category }),
          ...(updateData.documentType && { documentType: updateData.documentType.toUpperCase() }),
          ...(updateData.description !== undefined && { description: updateData.description }),
          ...(updateData.jurisdiction && { jurisdiction: updateData.jurisdiction.toUpperCase() }),
          ...(updateData.placeholderData !== undefined && { placeholderData: updateData.placeholderData }),
          ...(updateData.requiredClauses !== undefined && { requiredClauses: updateData.requiredClauses }),
          ...(updateData.status && { status: updateData.status }),
          updatedBy: user.id,
          updatedAt: new Date(),
        },
      })

      return reply.code(200).send(successResponse({ template }))
    } catch (error: any) {
      console.error('Update template error:', error)
      return reply.code(500).send(errorResponse('Failed to update template'))
    }
  })

  /**
   * DELETE /api/templates/:id
   * Delete a template (admin only)
   */
  fastify.delete('/templates/:id', async (request, reply) => {
    try {
      const user = (request as any).user
      const { id } = request.params as any

      if (!user) {
        throw new ApiError('Unauthorized', 401)
      }

      // Check if user has permission
      if (
        !['ADMIN', 'LEGISLATIVE_STAFF', 'BARANGAY_SECRETARY', 'CITY_COUNCIL'].includes(user.role)
      ) {
        throw new ApiError('Insufficient permissions', 403)
      }

      // Check if template exists
      const existingTemplate = await prisma.template.findUnique({
        where: { id },
      })

      if (!existingTemplate) {
        throw new ApiError('Template not found', 404)
      }

      // Delete template (cascade will delete related drafts)
      await prisma.template.delete({
        where: { id },
      })

      return reply.code(204).send()
    } catch (error: any) {
      console.error('Delete template error:', error)
      return reply.code(500).send(errorResponse('Failed to delete template'))
    }
  })

  /**
   * POST /api/templates/:id/use
   * Create a draft from a template
   */
  fastify.post('/templates/:id/use', async (request, reply) => {
    try {
      const user = (request as any).user
      const { id } = request.params as any

      if (!user) {
        throw new ApiError('Unauthorized', 401)
      }

      // Get template
      const template = await prisma.template.findUnique({
        where: { id },
      })

      if (!template) {
        throw new ApiError('Template not found', 404)
      }

      // Create draft from template
      const draft = await prisma.draft.create({
        data: {
          title: template.name,
          documentType: template.documentType,
          jurisdiction: template.jurisdiction,
          jurisdictionName: user.organization || 'My LGU',
          content: template.placeholderData || {},
          status: 'DRAFT',
          userId: user.id,
          templateId: id,
          commitMessage: 'Created from template',
        },
      })

      return reply.code(201).send(successResponse({ draft }))
    } catch (error: any) {
      console.error('Use template error:', error)
      return reply.code(500).send(errorResponse('Failed to create draft from template'))
    }
  })
}
