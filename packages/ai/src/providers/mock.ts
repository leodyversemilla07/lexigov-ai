import type {
  AiCompletionResult,
  AiProvider,
  GenerateStructuredOptions,
  GenerateTextOptions,
  StreamTextOptions,
} from '../contracts';

export class MockAiProvider implements AiProvider {
  readonly name = 'mock';

  private defaultTextResponse = `REPUBLIC OF THE PHILIPPINES
CITY OF PASIG
OFFICE OF THE SANGGUNIANG PANLUNGSOD

ORDINANCE NO. 2025-01

AN ORDINANCE REGULATING LOCAL ENVIRONMENTAL AND CIVIC MATTERS IN ACCORDANCE WITH REPUBLIC ACT NO. 7160.

WHEREAS, Section 16 of Republic Act No. 7160 empowers local government units to enact measures to promote the general welfare;

NOW, THEREFORE, BE IT ORDAINED by the Sangguniang Panlungsod in session assembled:

SECTION 1. Title. This Ordinance shall be known as the "Pasig City General Welfare Ordinance of 2025".

SECTION 2. Declaration of Policy. It is hereby declared the policy of the City Government to ensure public health and order.

SECTION 3. Operative Provisions. All covered establishments and residents shall adhere to standard guidelines.

SECTION 4. Penalties. Violators shall be subject to a fine not exceeding Five Thousand Pesos (₱5,000.00) or imprisonment not exceeding one (1) year, pursuant to Section 458 of RA 7160.

SECTION 5. Separability Clause. If any portion of this Ordinance is declared invalid, remaining sections shall remain in effect.

SECTION 6. Repealing Clause. All inconsistent local issuances are hereby modified accordingly.

SECTION 7. Effectivity Clause. This Ordinance shall take effect fifteen (15) days following publication in a newspaper of general circulation.`;

  private cannedResponses: Map<string, string> = new Map();
  private structuredResponses: Map<string, unknown> = new Map();

  setCannedResponse(promptSubstring: string, response: string): void {
    this.cannedResponses.set(promptSubstring, response);
  }

  setStructuredResponse<T>(promptSubstring: string, response: T): void {
    this.structuredResponses.set(promptSubstring, response);
  }

  clearCannedResponses(): void {
    this.cannedResponses.clear();
    this.structuredResponses.clear();
  }

  private resolveText(prompt: string): string {
    for (const [key, val] of this.cannedResponses.entries()) {
      if (prompt.includes(key)) {
        return val;
      }
    }
    return this.defaultTextResponse;
  }

  async generateText(options: GenerateTextOptions): Promise<AiCompletionResult> {
    const text = this.resolveText(options.prompt);
    return {
      text,
      model: options.model || 'mock-gpt-4o',
      provider: this.name,
      finishReason: 'stop',
      usage: {
        promptTokens: Math.ceil(options.prompt.length / 4),
        completionTokens: Math.ceil(text.length / 4),
        totalTokens: Math.ceil((options.prompt.length + text.length) / 4),
      },
    };
  }

  async *streamText(options: StreamTextOptions): AsyncIterable<string> {
    const text = this.resolveText(options.prompt);
    const words = text.split(/(\s+)/);

    for (const word of words) {
      if (options.onToken) {
        options.onToken(word);
      }
      yield word;
    }
  }

  async generateStructured<T = unknown>(options: GenerateStructuredOptions<T>): Promise<T> {
    for (const [key, val] of this.structuredResponses.entries()) {
      if (options.prompt.includes(key)) {
        return val as T;
      }
    }

    // Default structured response for compliance checking
    const defaultCompliance = {
      overallScore: 92,
      isValid: true,
      issues: [
        {
          type: 'suggestion',
          section: 'SECTION 4. Penalties.',
          title: 'Penalty matches statutory limits under RA 7160 Section 458.',
          description: 'Penalty matches statutory limits under RA 7160 Section 458; consider community service alternatives for indigent violators.',
          suggestion: 'Ensure community service alternatives are specified for indigent violators.',
        },
      ],
    };

    return defaultCompliance as unknown as T;
  }
}
