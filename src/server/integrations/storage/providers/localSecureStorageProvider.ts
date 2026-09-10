import crypto from 'crypto';
import { IStorageProvider, StorageUploadPayload, StorageUploadResult, SignedUrlResult } from '../storageTypes';

interface StoredFile {
  data: Buffer;
  contentType: string;
  fileSizeBytes: number;
  uploadedAt: string;
}

/**
 * Local Cryptographically Signed Storage Provider
 * Safe development fallback that implements time-limited HMAC signed URLs.
 * Ensures zero credential exposure and seamless offline testing before Supabase keys are configured.
 */
export class LocalSecureStorageProvider implements IStorageProvider {
  public readonly id = 'local_vault';
  public readonly name = 'Local Secure Vault (HMAC Signed URLs)';
  public readonly isConfigured = true;
  public readonly defaultBucket = 'hr-private-documents';

  private fileStore: Map<string, StoredFile> = new Map();
  private secretKey: string;

  constructor() {
    this.secretKey = process.env.SESSION_SECRET || 'postex-secure-internal-hmac-salt-key-2026';
  }

  public async uploadFile(payload: StorageUploadPayload): Promise<StorageUploadResult> {
    const timestamp = new Date().toISOString();
    const bucket = payload.bucket || this.defaultBucket;
    const fullPath = `${bucket}/${payload.path}`;

    let buffer: Buffer;
    if (typeof payload.data === 'string') {
      if (payload.data.startsWith('data:')) {
        const base64Data = payload.data.split(',')[1] || payload.data;
        buffer = Buffer.from(base64Data, 'base64');
      } else {
        buffer = Buffer.from(payload.data, 'utf-8');
      }
    } else if (Buffer.isBuffer(payload.data)) {
      buffer = payload.data;
    } else {
      buffer = Buffer.from(payload.data);
    }

    this.fileStore.set(fullPath, {
      data: buffer,
      contentType: payload.contentType,
      fileSizeBytes: buffer.length,
      uploadedAt: timestamp
    });

    return {
      success: true,
      provider: this.name,
      bucket,
      path: payload.path,
      fileSizeBytes: buffer.length,
      contentType: payload.contentType,
      timestamp
    };
  }

  public async createSignedUrl(
    path: string,
    expiresInSeconds: number = 900,
    bucket: string = this.defaultBucket
  ): Promise<SignedUrlResult> {
    const expiresAtTimestamp = Date.now() + expiresInSeconds * 1000;
    const expiresAt = new Date(expiresAtTimestamp).toISOString();

    // Generate cryptographic HMAC-SHA256 signature
    const payloadToSign = `${bucket}:${path}:${expiresAtTimestamp}`;
    const signature = crypto
      .createHmac('sha256', this.secretKey)
      .update(payloadToSign)
      .digest('hex')
      .substring(0, 32);

    const signedUrl = `/api/storage/signed-download?bucket=${encodeURIComponent(bucket)}&path=${encodeURIComponent(path)}&expires=${expiresAtTimestamp}&sig=${signature}`;

    return {
      success: true,
      provider: this.name,
      signedUrl,
      expiresInSeconds,
      expiresAt,
      path,
      bucket
    };
  }

  public verifySignedDownload(bucket: string, path: string, expiresStr: string, sig: string): { valid: boolean; file?: StoredFile; message: string } {
    const expiresAt = parseInt(expiresStr, 10);
    if (isNaN(expiresAt) || Date.now() > expiresAt) {
      return { valid: false, message: 'Signed download link has expired. Please request a new authenticated URL.' };
    }

    const payloadToSign = `${bucket}:${path}:${expiresAt}`;
    const expectedSig = crypto
      .createHmac('sha256', this.secretKey)
      .update(payloadToSign)
      .digest('hex')
      .substring(0, 32);

    if (sig !== expectedSig) {
      return { valid: false, message: 'Invalid cryptographic signature. Access denied to private document.' };
    }

    const fullPath = `${bucket}/${path}`;
    const file = this.fileStore.get(fullPath);
    if (!file) {
      return { valid: false, message: 'Document file not found in local vault.' };
    }

    return { valid: true, file, message: 'Signature verified successfully.' };
  }

  public async deleteFile(path: string, bucket: string = this.defaultBucket): Promise<{ success: boolean; errorMessage?: string }> {
    this.fileStore.delete(`${bucket}/${path}`);
    return { success: true };
  }
}
