/**
 * AI Generation routes
 */
export async function aiRoutes(fastify: FastifyInstance) {
  /**
   * POST /api/ai/generate
   * Generate a complete ordinance using Vertex AI
   */
  fastify.post('/ai/generate', async (request, reply) => {
    try {
      const user = (request as any).user;

      if (!user) {
        throw new ApiError('Unauthorized', 401);
      }

      const { prompt, jurisdiction, documentType, templateId } = request.body as any;

      // Validate required fields
      if (!prompt || !jurisdiction || !documentType) {
        throw new ApiError('Prompt, jurisdiction, and document type are required', 400);
      }

      // Generate ordinance using Vertex AI
      const ordinance = await generateOrdinance(prompt, jurisdiction, documentType);

      // Save as draft
      const savedDraft = await saveAIGeneratedDraft(
        user.id,
        ordinance.title,
        documentType,
        jurisdiction,
        documentType === 'ORDINANCE' ? 'Barangay' : documentType === 'RESOLUTION' ? 'Barangay' : documentType,
        ordinance.content,
        prompt,
      );

      return reply.code(201).send(successResponse({
        draft: savedDraft,
        message: 'Ordinance generated successfully',
      }));
    } catch (error: any) {
      console.error('AI generate error:', error);
      return reply.code(500).send(errorResponse('Failed to generate ordinance'));
    }
  });

  /**
   * GET /api/ai/templates
   * Get available ordinance templates
   */
  fastify.get('/ai/templates', async (request, reply) => {
    try {
      const user = (request as any).user;

      if (!user) {
        throw new ApiError('Unauthorized', 401);
      }

      // Get templates from database
      const templates = await getOrdinanceTemplates();

      return reply.code(200).send(successResponse({ templates }));
    } catch (error: any) {
      console.error('Get templates error:', error);
      return reply.code(500).send(errorResponse('Failed to get templates'));
    }
  });
}
