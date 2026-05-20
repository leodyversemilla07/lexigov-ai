import { Injectable } from "@nestjs/common";
import { analyzeDeterministicCompliance, mergeComplianceIssues, buildComplianceResultFromIssues } from "@lexigov/shared";
import type { ComplianceIssue } from "@lexigov/shared";

interface AzureConfig {
    apiKey: string;
    apiVersion: string;
    deployment: string;
    endpoint: string;
}

@Injectable()
export class AiService {
    private getConfig(): AzureConfig {
        const apiKey = process.env.AZURE_OPENAI_API_KEY;
        const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
        const apiVersion = process.env.AZURE_OPENAI_API_VERSION;
        const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;

        if (!apiKey || !endpoint || !apiVersion || !deployment) {
            throw new Error("Azure OpenAI not configured");
        }

        return { apiKey, apiVersion, deployment, endpoint };
    }

    async generateOrdinance(
        prompt: string,
        jurisdiction: string,
        jurisdictionName: string,
        documentType: string,
    ) {
        const config = this.getConfig();
        const { AzureOpenAI } = await import("openai");

        const client = new AzureOpenAI({
            apiKey: config.apiKey,
            apiVersion: config.apiVersion,
            endpoint: config.endpoint,
        });

        const systemPrompt = `You are an expert Philippine legislative drafting assistant. Generate a ${documentType.toLowerCase()} for ${jurisdictionName} (${jurisdiction} level) following RA 7160 format.`;

        const completion = await client.chat.completions.create({
            model: config.deployment,
            max_completion_tokens: 8192,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: prompt },
            ],
        });

        return {
            content: completion.choices[0]?.message?.content ?? "",
            generatedAt: Date.now(),
            model: config.deployment,
        };
    }

    async checkCompliance(content: string, jurisdiction: string) {
        const deterministic = analyzeDeterministicCompliance(
            content,
            jurisdiction as any,
        );

        if (
            jurisdiction !== "barangay" &&
            jurisdiction !== "municipal" &&
            jurisdiction !== "city" &&
            jurisdiction !== "provincial"
        ) {
            return deterministic;
        }

        const config = this.getConfig();
        const { AzureOpenAI } = await import("openai");

        const client = new AzureOpenAI({
            apiKey: config.apiKey,
            apiVersion: config.apiVersion,
            endpoint: config.endpoint,
        });

        try {
            const result = await client.chat.completions.create({
                model: config.deployment,
                max_completion_tokens: 2500,
                messages: [
                    {
                        role: "system",
                        content:
                            "You are a Philippine legal drafting reviewer. Return only additional findings that are not obvious structural checks.",
                    },
                    {
                        role: "user",
                        content: `Review this ${jurisdiction} ordinance. Return up to 3 additional findings in JSON: { "issues": [{ "type": "critical"|"warning"|"suggestion", "section": "...", "title": "...", "description": "...", "suggestion": "..." }] }\n\nDraft:\n${content}`,
                    },
                ],
            });

            const text = result.choices[0]?.message?.content ?? "";
            const jsonMatch = text.match(/\{[\s\S]*\}/);

            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]) as {
                    issues?: ComplianceIssue[];
                };
                const aiIssues = Array.isArray(parsed.issues)
                    ? parsed.issues
                    : [];
                const merged = mergeComplianceIssues(
                    deterministic.issues,
                    aiIssues,
                );
                return buildComplianceResultFromIssues(merged);
            }
        } catch {
            // Fall back to deterministic only
        }

        return deterministic;
    }

    async generateSummary(content: string) {
        const config = this.getConfig();
        const { AzureOpenAI } = await import("openai");

        const client = new AzureOpenAI({
            apiKey: config.apiKey,
            apiVersion: config.apiVersion,
            endpoint: config.endpoint,
        });

        const completion = await client.chat.completions.create({
            model: config.deployment,
            max_completion_tokens: 1024,
            messages: [
                {
                    role: "system",
                    content: "You write concise executive summaries for Philippine local government ordinance drafts.",
                },
                {
                    role: "user",
                    content: `Generate a 2-3 paragraph executive summary for this Philippine ordinance:\n\n${content}`,
                },
            ],
        });

        return { summary: completion.choices[0]?.message?.content ?? "" };
    }
}
