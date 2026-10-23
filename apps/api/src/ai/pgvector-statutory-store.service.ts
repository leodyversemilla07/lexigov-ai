import { type StatutoryChunk, type StatutoryVectorStore } from '@lexigov/ai';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface StatutoryChunkRow {
  id: string;
  citation: string;
  title: string;
  content: string;
}

/**
 * pgvector-backed statutory vector store.
 *
 * Expects a Postgres database with the `vector` extension enabled and a
 * `StatutoryChunk` table (see prisma migration `add_statutory_chunks`).
 */
@Injectable()
export class PgVectorStatutoryStore implements StatutoryVectorStore {
  constructor(private readonly prisma: PrismaService) {}

  async upsert(chunk: StatutoryChunk, embedding: number[]): Promise<void> {
    const embeddingLiteral = `[${embedding.join(',')}]`;
    await this.prisma.$executeRaw`
      INSERT INTO "StatutoryChunk" (id, citation, title, content, embedding, created_at, updated_at)
      VALUES (${chunk.id}, ${chunk.citation}, ${chunk.title}, ${chunk.content}, ${embeddingLiteral}::vector, now(), now())
      ON CONFLICT (id) DO UPDATE SET
        citation = EXCLUDED.citation,
        title = EXCLUDED.title,
        content = EXCLUDED.content,
        embedding = EXCLUDED.embedding,
        updated_at = EXCLUDED.updated_at
    `;
  }

  async query(embedding: number[], topK: number): Promise<StatutoryChunk[]> {
    const embeddingLiteral = `[${embedding.join(',')}]`;
    const rows = await this.prisma.$queryRaw<StatutoryChunkRow[]>`
      SELECT id, citation, title, content
      FROM "StatutoryChunk"
      ORDER BY embedding <=> ${embeddingLiteral}::vector ASC
      LIMIT ${topK}
    `;

    return rows.map((row) => ({
      id: row.id,
      citation: row.citation,
      title: row.title,
      content: row.content,
    }));
  }
}
