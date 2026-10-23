export interface StatutoryChunk {
  id: string;
  citation: string;
  title: string;
  content: string;
}

export interface StatutoryVectorStore {
  upsert(chunk: StatutoryChunk, embedding: number[]): Promise<void>;
  query(embedding: number[], topK: number): Promise<StatutoryChunk[]>;
}

export type StatutoryEmbedFn = (text: string) => Promise<number[]>;

export interface StatutoryEmbeddingProvider {
  embed(text: string): Promise<number[]>;
}

export interface StatutoryRetrievalResult {
  chunks: StatutoryChunk[];
  context: string;
}

const DEFAULT_TOP_K = 3;

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function mockEmbedding(text: string, dimensions = 8): number[] {
  const vector = new Array<number>(dimensions).fill(0);
  const seed = hashString(text.toLowerCase().trim());
  for (let i = 0; i < dimensions; i += 1) {
    vector[i] = ((seed >> (i * 3)) & 0xff) / 255;
  }
  const magnitude = Math.sqrt(vector.reduce((acc, v) => acc + v * v, 0)) || 1;
  return vector.map((v) => v / magnitude);
}

export class MockEmbeddingProvider implements StatutoryEmbeddingProvider {
  async embed(text: string): Promise<number[]> {
    return mockEmbedding(text);
  }
}

export class AzureOpenAiEmbeddingProvider implements StatutoryEmbeddingProvider {
  constructor(
    private readonly apiKey: string,
    private readonly endpoint: string,
    private readonly deployment: string,
    private readonly apiVersion: string,
    private readonly dimensions: number,
  ) {}

  async embed(text: string): Promise<number[]> {
    const url = `${this.endpoint.replace(/\/$/, '')}/openai/deployments/${encodeURIComponent(this.deployment)}/embeddings?api-version=${encodeURIComponent(this.apiVersion)}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'api-key': this.apiKey,
      },
      body: JSON.stringify({ input: text, dimensions: this.dimensions }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Azure OpenAI Embedding Error (${response.status}): ${err}`);
    }

    const json = (await response.json()) as { data?: Array<{ embedding?: number[] }> };
    const embedding = json.data?.[0]?.embedding;
    if (!embedding) {
      throw new Error('Azure OpenAI Embedding response missing embedding data');
    }
    return embedding;
  }
}

export class OpenAiCompatibleEmbeddingProvider implements StatutoryEmbeddingProvider {
  constructor(
    private readonly apiKey: string,
    private readonly baseUrl: string,
    private readonly model: string,
    private readonly dimensions: number,
  ) {}

  async embed(text: string): Promise<number[]> {
    const response = await fetch(`${this.baseUrl.replace(/\/$/, '')}/embeddings`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({ input: text, dimensions: this.dimensions }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Embedding Error (${response.status}): ${err}`);
    }

    const json = (await response.json()) as { data?: Array<{ embedding?: number[] }> };
    const embedding = json.data?.[0]?.embedding;
    if (!embedding) {
      throw new Error('Embedding response missing embedding data');
    }
    return embedding;
  }
}

export class InMemoryStatutoryVectorStore implements StatutoryVectorStore {
  private readonly entries: Array<StatutoryChunk & { embedding: number[] }> = [];

  async upsert(chunk: StatutoryChunk, embedding: number[]): Promise<void> {
    const existing = this.entries.findIndex((e) => e.id === chunk.id);
    const entry = { ...chunk, embedding };
    if (existing >= 0) {
      this.entries[existing] = entry;
    } else {
      this.entries.push(entry);
    }
  }

  async query(embedding: number[], topK: number): Promise<StatutoryChunk[]> {
    const queryNorm = Math.sqrt(embedding.reduce((acc, v) => acc + v * v, 0)) || 1;
    const scored = this.entries
      .map((entry) => {
        const entryNorm = Math.sqrt(entry.embedding.reduce((acc, v) => acc + v * v, 0)) || 1;
        let dot = 0;
        for (let i = 0; i < embedding.length; i += 1) {
          const queryValue = embedding[i] ?? 0;
          const entryValue = entry.embedding[i] ?? 0;
          dot += queryValue * entryValue;
        }
        const cosine = dot / (queryNorm * entryNorm);
        return { chunk: entry, score: cosine };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    return scored.map((s) => ({ id: s.chunk.id, citation: s.chunk.citation, title: s.chunk.title, content: s.chunk.content }));
  }
}

export class StatutoryRAG {
  constructor(
    private readonly embed: StatutoryEmbeddingProvider,
    private readonly store: StatutoryVectorStore,
  ) {}

  async retrieve(query: string, topK: number = DEFAULT_TOP_K): Promise<StatutoryRetrievalResult> {
    const embedding = await this.embed.embed(query);
    const chunks = await this.store.query(embedding, topK);
    const context = this.buildContext(chunks);
    return { chunks, context };
  }

  private buildContext(chunks: StatutoryChunk[]): string {
    if (chunks.length === 0) {
      return '';
    }
    const lines = chunks.map((c, i) => `${i + 1}. ${c.citation} — ${c.title}\n${c.content}`);
    return ['Statutory Context (retrieved):', ...lines].join('\n\n');
  }
}

export interface StatutoryRAGEnv {
  AZURE_OPENAI_API_KEY?: string;
  AZURE_OPENAI_ENDPOINT?: string;
  AZURE_OPENAI_API_VERSION?: string;
  AZURE_OPENAI_DEPLOYMENT?: string;
  AZURE_OPENAI_EMBEDDING_DIMENSIONS?: number;
  OPENAI_API_KEY?: string;
  OPENAI_BASE_URL?: string;
  CUSTOM_AI_API_KEY?: string;
  CUSTOM_AI_BASE_URL?: string;
  CUSTOM_AI_MODEL?: string;
}

export function createStatutoryRAGFromEnv(env: StatutoryRAGEnv, store: StatutoryVectorStore = new InMemoryStatutoryVectorStore()): StatutoryRAG {
  const dimensions = env.AZURE_OPENAI_EMBEDDING_DIMENSIONS ?? 1024;

  let embed: StatutoryEmbeddingProvider;
  if (env.AZURE_OPENAI_API_KEY && env.AZURE_OPENAI_ENDPOINT && env.AZURE_OPENAI_DEPLOYMENT) {
    embed = new AzureOpenAiEmbeddingProvider(
      env.AZURE_OPENAI_API_KEY,
      env.AZURE_OPENAI_ENDPOINT,
      env.AZURE_OPENAI_DEPLOYMENT,
      env.AZURE_OPENAI_API_VERSION ?? '2024-10-21',
      dimensions,
    );
  } else if (env.OPENAI_API_KEY) {
    embed = new OpenAiCompatibleEmbeddingProvider(env.OPENAI_API_KEY, env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1', 'text-embedding-3-small', dimensions);
  } else if (env.CUSTOM_AI_API_KEY) {
    embed = new OpenAiCompatibleEmbeddingProvider(env.CUSTOM_AI_API_KEY, env.CUSTOM_AI_BASE_URL ?? 'https://api.openai.com/v1', env.CUSTOM_AI_MODEL ?? 'text-embedding-3-small', dimensions);
  } else {
    embed = new MockEmbeddingProvider();
  }

  return new StatutoryRAG(embed, new InMemoryStatutoryVectorStore());
}
