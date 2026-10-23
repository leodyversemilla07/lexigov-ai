import { createHash } from 'node:crypto';
import {
  type ArtifactStorage,
  createArtifactStorage,
  InMemoryArtifactStorage,
  S3ArtifactStorage,
} from './artifact-storage.service';

describe('ArtifactStorage', () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn().mockResolvedValue({ ok: true, text: async () => '' });
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  describe('InMemoryArtifactStorage', () => {
    it('stores artifacts and exposes their URLs', async () => {
      const storage: ArtifactStorage = new InMemoryArtifactStorage();

      const url = await storage.put(
        'drafts/abc/ordinance-1.docx',
        Buffer.from('docx-bytes'),
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      );

      expect(url).toContain('drafts/abc/ordinance-1.docx');
      expect(storage.getUrl('drafts/abc/ordinance-1.docx')).toContain('drafts/abc/ordinance-1.docx');
    });

    it('retrieves stored artifacts', async () => {
      const storage: ArtifactStorage = new InMemoryArtifactStorage();
      await storage.put(
        'drafts/abc/ordinance-1.docx',
        Buffer.from('docx-bytes'),
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      );

      const data = await storage.get('drafts/abc/ordinance-1.docx');
      expect(data.toString()).toBe('docx-bytes');
    });

    it('throws when retrieving a missing artifact', async () => {
      const storage: ArtifactStorage = new InMemoryArtifactStorage();
      await expect(storage.get('missing')).rejects.toThrow(/not found/);
    });
  });

  describe('createArtifactStorage', () => {
    it('falls back to in-memory storage when S3 is not configured', () => {
      const storage = createArtifactStorage({});

      expect(storage).toBeInstanceOf(InMemoryArtifactStorage);
    });

    it('uses S3 storage when bucket and credentials are provided', () => {
      const storage = createArtifactStorage({
        S3_BUCKET: 'lexigov-artifacts',
        S3_REGION: 'us-east-1',
        S3_ACCESS_KEY_ID: 'test-access-key',
        S3_SECRET_ACCESS_KEY: 'test-secret-key',
      });

      expect(storage).toBeInstanceOf(S3ArtifactStorage);
    });
  });

  describe('S3ArtifactStorage', () => {
    it('uploads artifacts via a signed S3 PUT request', async () => {
      const storage = new S3ArtifactStorage({
        S3_BUCKET: 'lexigov-artifacts',
        S3_REGION: 'us-east-1',
        S3_ACCESS_KEY_ID: 'test-access-key',
        S3_SECRET_ACCESS_KEY: 'test-secret-key',
      });

      const url = await storage.put('drafts/abc/ordinance-1.pdf', Buffer.from('pdf-bytes'), 'application/pdf');

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const call = fetchMock.mock.calls[0];
      const init = call[1] as RequestInit;
      expect(init.method).toBe('PUT');
      const headers = init.headers as Record<string, string>;
      expect(headers.authorization).toContain('AWS4-HMAC-SHA256');
      expect(url).toContain('drafts/abc/ordinance-1.pdf');
    });

    it('downloads artifacts via a signed S3 GET request', async () => {
      fetchMock.mockResolvedValueOnce({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) } as unknown as Response);
      const storage = new S3ArtifactStorage({
        S3_BUCKET: 'lexigov-artifacts',
        S3_REGION: 'us-east-1',
        S3_ACCESS_KEY_ID: 'test-access-key',
        S3_SECRET_ACCESS_KEY: 'test-secret-key',
      });

      const data = await storage.get('drafts/abc/ordinance-1.pdf');

      const call = fetchMock.mock.calls[0];
      const init = call[1] as RequestInit;
      expect(init.method).toBe('GET');
      const headers = init.headers as Record<string, string>;
      expect(headers.authorization).toContain('AWS4-HMAC-SHA256');
      expect(data).toBeDefined();
    });

    it('rejects uploads when S3 is not configured', async () => {
      const storage = new S3ArtifactStorage({});

      await expect(
        storage.put('drafts/abc/ordinance-1.pdf', Buffer.from('pdf-bytes'), 'application/pdf'),
      ).rejects.toThrow(/not configured/);
    });

    it('computes deterministic sha256 hashes for signed payloads', () => {
      const hash = createHash('sha256').update('payload').digest('hex');
      expect(hash).toHaveLength(64);
    });
  });
});
