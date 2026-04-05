"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import {
    analyzeDeterministicCompliance,
    buildComplianceResultFromIssues,
    mergeComplianceIssues,
    type ComplianceIssue,
} from "../lib/compliance-analysis";

type AzureOpenAIConfig = {
    apiKey: string;
    apiVersion: string;
    deployment: string;
    endpoint: string;
};

async function requireIdentity(ctx: { auth: { getUserIdentity: () => Promise<unknown> } }) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
        throw new Error("Not authenticated");
    }

    return identity;
}

function getAzureOpenAIConfig(): AzureOpenAIConfig {
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const apiKey = process.env.AZURE_OPENAI_API_KEY;
    const apiVersion = process.env.AZURE_OPENAI_API_VERSION;
    const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;

    if (!endpoint) {
        throw new Error("AZURE_OPENAI_ENDPOINT not configured");
    }

    if (!apiKey) {
        throw new Error("AZURE_OPENAI_API_KEY not configured");
    }

    if (!apiVersion) {
        throw new Error("AZURE_OPENAI_API_VERSION not configured");
    }

    if (!deployment) {
        throw new Error("AZURE_OPENAI_DEPLOYMENT not configured");
    }

    return {
        apiKey,
        apiVersion,
        deployment,
        endpoint,
    };
}

async function createAzureOpenAIClient() {
    const { AzureOpenAI } = await import("openai");
    const config = getAzureOpenAIConfig();

    return {
        client: new AzureOpenAI({
            apiKey: config.apiKey,
            apiVersion: config.apiVersion,
            endpoint: config.endpoint,
        }),
        deployment: config.deployment,
    };
}

function extractCompletionText(content: unknown): string {
    if (typeof content === "string") {
        return content;
    }

    if (!Array.isArray(content)) {
        return "";
    }

    return content
        .map((part) => {
            if (
                typeof part === "object" &&
                part !== null &&
                "text" in part &&
                typeof part.text === "string"
            ) {
                return part.text;
            }

            return "";
        })
        .join("");
}

async function generateChatCompletion({
    maxCompletionTokens,
    systemPrompt,
    userPrompt,
}: {
    maxCompletionTokens: number;
    systemPrompt: string;
    userPrompt: string;
}) {
    const { client, deployment } = await createAzureOpenAIClient();
    for (let attempt = 0; attempt < 3; attempt += 1) {
        const completion = await client.chat.completions.create({
            max_completion_tokens: maxCompletionTokens,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
            ],
            model: deployment,
        });

        const message = completion.choices[0]?.message?.content;
        const text = extractCompletionText(message).trim();
        const finishReason = completion.choices[0]?.finish_reason;

        if (text) {
            return {
                model: deployment,
                text,
            };
        }

        console.warn(
            `Azure OpenAI returned an empty response on attempt ${attempt + 1} with finish reason ${finishReason ?? "unknown"}. Retrying.`,
        );
    }

    throw new Error("Azure OpenAI returned an empty response");
}

/**
 * Generate a Philippine ordinance using Azure OpenAI
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

Generate a complete, professional ${args.documentType.toLowerCase()} based on the following request.`;

        const result = await generateChatCompletion({
            maxCompletionTokens: 8192,
            systemPrompt,
            userPrompt: args.prompt,
        });

        return {
            content: result.text,
            generatedAt: Date.now(),
            model: result.model,
        };
    },
});

/**
 * Check ordinance compliance using Azure OpenAI
 */
export const checkCompliance = action({
    args: {
        content: v.string(),
        jurisdiction: v.string(),
    },
    handler: async (ctx, args) => {
        await requireIdentity(ctx);

        if (
            args.jurisdiction !== "barangay" &&
            args.jurisdiction !== "municipal" &&
            args.jurisdiction !== "city" &&
            args.jurisdiction !== "provincial"
        ) {
            throw new Error("Unsupported jurisdiction");
        }

        const deterministic = analyzeDeterministicCompliance(args.content, args.jurisdiction);

        const systemPrompt = `You are a Philippine legal drafting reviewer.
You are assisting a deterministic compliance engine, not replacing it.
Return only additional drafting or legal-risk findings that are not obvious structural checks.
Do not repeat issues about missing sections, missing clauses, or basic penalty ceilings unless there is a more nuanced concern.`;

        const userPrompt = `Review this ${args.jurisdiction} local ordinance draft and return up to 3 additional findings.
Focus on legal basis quality, enforceability, ambiguity, overbreadth, missing definitions, and due process.
Keep each description and suggestion concise, at most 2 sentences.

Respond in JSON format:
{
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

Draft:
${args.content}`;

        try {
            const result = await generateChatCompletion({
                maxCompletionTokens: 2500,
                systemPrompt,
                userPrompt,
            });

            const jsonMatch = result.text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                return deterministic;
            }

            const parsed = JSON.parse(jsonMatch[0]) as { issues?: ComplianceIssue[] };
            const aiIssues = Array.isArray(parsed.issues) ? parsed.issues : [];
            const mergedIssues = mergeComplianceIssues(deterministic.issues, aiIssues);

            return buildComplianceResultFromIssues(mergedIssues);
        } catch {
            return deterministic;
        }
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

        const systemPrompt = "You write concise executive summaries for Philippine local government ordinance drafts.";
        const userPrompt = `Generate a concise executive summary (2-3 paragraphs) for this Philippine ordinance.
Include: purpose, key provisions, affected parties, and implementation timeline.

Ordinance:
${args.content}`;

        const result = await generateChatCompletion({
            maxCompletionTokens: 1024,
            systemPrompt,
            userPrompt,
        });

        return { summary: result.text };
    },
});
