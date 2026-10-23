-- Enable the pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Statutory corpus chunks used for AI prompt grounding via RAG
CREATE TABLE IF NOT EXISTS "StatutoryChunk" (
    id          TEXT NOT NULL,
    citation   TEXT NOT NULL,
    title      TEXT NOT NULL,
    content    TEXT NOT NULL,
    embedding  vector(1536) NOT NULL,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StatutoryChunk_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "StatutoryChunk_embedding_idx"
    ON "StatutoryChunk"
    USING ivfflat (embedding vector_cosine_ops);
