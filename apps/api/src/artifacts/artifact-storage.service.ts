import { createHash, createHmac } from 'node:crypto';

export const ARTIFACT_STORAGE = 'ARTIFACT_STORAGE';

export interface ArtifactStorage {
  put(key: string, data: Buffer, contentType: string): Promise<string>;
  get(key: string): Promise<Buffer>;
  getUrl(key: string): string;
}

export interface ArtifactStorageEnv {
  S3_BUCKET?: string;
  S3_REGION?: string;
  S3_ACCESS_KEY_ID?: string;
  S3_SECRET_ACCESS_KEY?: string;
  S3_ENDPOINT?: string;
  S3_FORCE_PATH_STYLE?: boolean;
}

function sha256Hex(value: string | Buffer): string {
  return createHash('sha256').update(value).digest('hex');
}

function hmacHex(key: string, message: string): string {
  return createHmac('sha256', key).update(message).digest('hex');
}

export class InMemoryArtifactStorage implements ArtifactStorage {
  private readonly objects = new Map<string, Buffer>();

  async put(key: string, data: Buffer, _contentType: string): Promise<string> {
    this.objects.set(key, data);
    return `https://artifacts.internal/${key}`;
  }

  async get(key: string): Promise<Buffer> {
    const data = this.objects.get(key);
    if (!data) {
      throw new Error(`Artifact not found: ${key}`);
    }
    return data;
  }

  getUrl(key: string): string {
    return `https://artifacts.internal/${key}`;
  }
}

export class S3ArtifactStorage implements ArtifactStorage {
  private readonly bucket: string;
  private readonly region: string;
  private readonly accessKeyId: string;
  private readonly secretAccessKey: string;
  private readonly endpoint: string;
  private readonly forcePathStyle: boolean;

  constructor(env: ArtifactStorageEnv) {
    this.bucket = env.S3_BUCKET ?? '';
    this.region = env.S3_REGION ?? 'us-east-1';
    this.accessKeyId = env.S3_ACCESS_KEY_ID ?? '';
    this.secretAccessKey = env.S3_SECRET_ACCESS_KEY ?? '';
    this.endpoint = env.S3_ENDPOINT ?? '';
    this.forcePathStyle = env.S3_FORCE_PATH_STYLE ?? false;
  }

  async put(key: string, data: Buffer, contentType: string): Promise<string> {
    if (!this.bucket || !this.accessKeyId || !this.secretAccessKey) {
      throw new Error('S3 artifact storage is not configured');
    }

    const url = this.objectUrl(key);
    const host = this.hostHeader(key);
    const payloadHash = sha256Hex(data);
    const amzDate = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = amzDate.slice(0, 8);
    const credentialScope = `${dateStamp}/${this.region}/s3/aws4_request`;
    const signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date';
    const canonicalHeaders = `${[
      `content-type:${contentType}`,
      `host:${host}`,
      `x-amz-content-sha256:${payloadHash}`,
      `x-amz-date:${amzDate}`,
    ]
      .sort()
      .join('\n')}\n`;
    const canonicalRequest = `${[`PUT`, `/${key}`, '', canonicalHeaders, signedHeaders, payloadHash].join('\n')}\n`;
    const stringToSign = ['AWS4-HMAC-SHA256', amzDate, credentialScope, sha256Hex(canonicalRequest)].join('\n');
    const kDate = hmacHex(`AWS4${this.secretAccessKey}`, dateStamp);
    const kRegion = hmacHex(kDate, this.region);
    const kService = hmacHex(kRegion, 's3');
    const kSigning = hmacHex(kService, 'aws4_request');
    const signature = hmacHex(kSigning, stringToSign);
    const authorization = `AWS4-HMAC-SHA256 Credential=${this.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'content-type': contentType,
        host,
        'x-amz-content-sha256': payloadHash,
        'x-amz-date': amzDate,
        authorization,
      },
      body: data as unknown as BodyInit,
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`S3 artifact PUT failed (${response.status}): ${err}`);
    }

    return url;
  }

  async get(key: string): Promise<Buffer> {
    if (!this.bucket || !this.accessKeyId || !this.secretAccessKey) {
      throw new Error('S3 artifact storage is not configured');
    }

    const url = this.objectUrl(key);
    const host = this.hostHeader(key);
    const payloadHash = sha256Hex('');
    const amzDate = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = amzDate.slice(0, 8);
    const credentialScope = `${dateStamp}/${this.region}/s3/aws4_request`;
    const signedHeaders = 'host;x-amz-content-sha256;x-amz-date';
    const canonicalHeaders = `${[`host:${host}`, `x-amz-content-sha256:${payloadHash}`, `x-amz-date:${amzDate}`]
      .sort()
      .join('\n')}\n`;
    const canonicalRequest = `${[`GET`, `/${key}`, '', canonicalHeaders, signedHeaders, payloadHash].join('\n')}\n`;
    const stringToSign = ['AWS4-HMAC-SHA256', amzDate, credentialScope, sha256Hex(canonicalRequest)].join('\n');
    const kDate = hmacHex(`AWS4${this.secretAccessKey}`, dateStamp);
    const kRegion = hmacHex(kDate, this.region);
    const kService = hmacHex(kRegion, 's3');
    const kSigning = hmacHex(kService, 'aws4_request');
    const signature = hmacHex(kSigning, stringToSign);
    const authorization = `AWS4-HMAC-SHA256 Credential=${this.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        host,
        'x-amz-content-sha256': payloadHash,
        'x-amz-date': amzDate,
        authorization,
      },
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`S3 artifact GET failed (${response.status}): ${err}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  getUrl(key: string): string {
    if (!this.bucket) {
      return `https://artifacts.internal/${key}`;
    }
    return this.objectUrl(key);
  }

  private objectUrl(key: string): string {
    if (this.endpoint) {
      const base = this.forcePathStyle
        ? `${this.endpoint.replace(/\/$/, '')}/${this.bucket}`
        : this.endpoint.replace(/\/$/, '');
      return `${base}/${key}`;
    }
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
  }

  private hostHeader(key: string): string {
    if (this.endpoint) {
      const parsed = new URL(this.endpoint);
      return this.forcePathStyle ? `${parsed.host}/${this.bucket}` : parsed.host;
    }
    return `${this.bucket}.s3.${this.region}.amazonaws.com`;
  }
}

export function createArtifactStorage(env: ArtifactStorageEnv): ArtifactStorage {
  if (env.S3_BUCKET && env.S3_ACCESS_KEY_ID && env.S3_SECRET_ACCESS_KEY) {
    return new S3ArtifactStorage(env);
  }
  return new InMemoryArtifactStorage();
}
