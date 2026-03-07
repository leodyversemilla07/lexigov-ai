"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";

async function requireIdentity(ctx: { auth: { getUserIdentity: () => Promise<unknown> } }) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
        throw new Error("Not authenticated");
    }

    return identity;
}

/**
 * Generate a Philippine ordinance using Google Gemini AI
 */
export const generateOrdinance = action({
    args: {
        prompt: v.string(),
        jurisdiction: v.string(),
        jurisdictionName: v.string(),
        documentType: v.string(),
    },
    handler: async (ctx, args) => {
        await requireIdentity(ctx);

        const { GoogleGenerativeAI } = await import("@google/generative-ai");

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error("GEMINI_API_KEY not configured");
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 8192,
            }
        });

        const systemPrompt = `You are an expert Philippine legislative drafting assistant specializing in local ordinances.
Generate ordinances following RA 7160 (Local Government Code of 1991) format.

The ordinance should include:
1. Proper header with Republic of the Philippines, jurisdiction details
2. WHEREAS clauses with legal bases
3. Numbered sections with clear provisions
4. Penalty clauses (within legal limits for ${args.jurisdiction} level)
5. Separability, repealing, and effectivity clauses
6. Signature blocks

Jurisdiction: ${args.jurisdictionName} (${args.jurisdiction} level)
Document Type: ${args.documentType}

Generate a complete, professional ${args.documentType.toLowerCase()} based on the following request:`;

        const result = await model.generateContent(`${systemPrompt}\n\n${args.prompt}`);
        const text = result.response.text();

        return {
            content: text,
            generatedAt: Date.now(),
            model: "gemini-1.5-flash",
        };
    },
});

/**
 * Check ordinance compliance using AI
 */
export const checkCompliance = action({
    args: {
        content: v.string(),
        jurisdiction: v.string(),
    },
    handler: async (ctx, args) => {
        await requireIdentity(ctx);

        const { GoogleGenerativeAI } = await import("@google/generative-ai");

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error("GEMINI_API_KEY not configured");
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 4096,
            }
        });

        const prompt = `You are a Philippine legal compliance checker. Analyze the following ordinance for compliance with RA 7160 (Local Government Code of 1991).

Check for:
1. Proper structure (header, preamble, body, final provisions)
2. Required clauses (separability, repealing, effectivity)
3. Penalty limits for ${args.jurisdiction} jurisdiction
4. Due process protections
5. Legal basis citations

Respond in JSON format:
{
  "overallScore": <0-100>,
  "isValid": <boolean>,
  "issues": [
    {
      "type": "critical" | "warning" | "suggestion",
      "section": "<section number or name>",
      "title": "<issue title>",
      "description": "<detailed description>",
      "suggestion": "<how to fix>"
    }
  ]
}

Ordinance to check:
${args.content}`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();

        try {
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
        } catch {
            // Return default if parsing fails
        }

        return {
            overallScore: 0,
            isValid: false,
            issues: [{
                type: "critical",
                title: "Analysis Error",
                description: "Could not analyze the ordinance",
                suggestion: "Please try again"
            }]
        };
    },
});

/**
 * Generate executive summary for an ordinance
 */
export const generateSummary = action({
    args: {
        content: v.string(),
    },
    handler: async (ctx, args) => {
        await requireIdentity(ctx);

        const { GoogleGenerativeAI } = await import("@google/generative-ai");

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error("GEMINI_API_KEY not configured");
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: {
                temperature: 0.5,
                maxOutputTokens: 1024,
            }
        });

        const prompt = `Generate a concise executive summary (2-3 paragraphs) for this Philippine ordinance. 
Include: purpose, key provisions, affected parties, and implementation timeline.

Ordinance:
${args.content}`;

        const result = await model.generateContent(prompt);
        return { summary: result.response.text() };
    },
});
