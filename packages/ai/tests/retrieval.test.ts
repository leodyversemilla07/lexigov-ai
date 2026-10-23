import { describe, expect, it } from 'vitest';
import {
  InMemoryStatutoryVectorStore,
  MockEmbeddingProvider,
  StatutoryRAG,
  type StatutoryChunk,
} from '../src';

describe('@lexigov/ai Statutory Retrieval Suite', () => {
  it('returns no context when the vector store is empty', async () => {
    const rag = new StatutoryRAG(new MockEmbeddingProvider(), new InMemoryStatutoryVectorStore());

    const result = await rag.retrieve('single use plastic ordinance', 3);

    expect(result.chunks).toEqual([]);
    expect(result.context).toBe('');
  });

  it('returns retrieved statutory context for matching queries', async () => {
    const store = new InMemoryStatutoryVectorStore();
    const rag = new StatutoryRAG(new MockEmbeddingProvider(), store);
    const embedder = new MockEmbeddingProvider();
    const chunk: StatutoryChunk = {
      id: 'ra7160-ss16',
      citation: 'RA 7160 § 16',
      title: 'General Welfare Clause',
      content: 'The sanggunian shall consider the general welfare of the community.',
    };
    await store.upsert(chunk, await embedder.embed(chunk.content));

    const result = await rag.retrieve(chunk.content, 3);

    expect(result.chunks.length).toBeGreaterThan(0);
    expect(result.context).toContain('RA 7160 § 16');
  });

  it('upserts and replaces chunks by id', async () => {
    const store = new InMemoryStatutoryVectorStore();
    const chunk: StatutoryChunk = {
      id: 'ra9003-ss1',
      citation: 'RA 9003 § 1',
      title: 'Sanitation Authority',
      content: 'The sanitation authority shall...',
    };
    await store.upsert(chunk, await new MockEmbeddingProvider().embed(chunk.content));
    await store.upsert(
      { ...chunk, content: 'Updated sanitation authority text.' },
      await new MockEmbeddingProvider().embed('Updated sanitation authority text.'),
    );

    const found = await store.query(await new MockEmbeddingProvider().embed(chunk.content), 5);

    expect(found.length).toBe(1);
    expect(found[0].content).toBe('Updated sanitation authority text.');
  });
});
