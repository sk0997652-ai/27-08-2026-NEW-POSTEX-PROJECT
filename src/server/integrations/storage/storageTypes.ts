/**
 * PostEx HR Onboarding Portal - Private Document Storage Abstraction
 * Handles Candidate Documents, Branch Manager / Central HR Signatures, and Cryptographic Joining Dossier PDFs.
 */

export interface StorageUploadPayload {
  bucket?: string;
  path: string; // e.g. "candidates/{candidateId}/documents/{documentId}.jpg"
  data: Buffer | Uint8Array | string; // Buffer, Uint8Array or base64 data URL
  contentType: string; // e.g. "image/jpeg", "application/pdf"
  isPrivate?: boolean;
  metadata?: Record<string, string>;
}

export interface StorageUploadResult {
  success: boolean;
  provider: string;
  bucket: string;
  path: string;
  fileSizeBytes: number;
  contentType: string;
  timestamp: string;
  errorMessage?: string;
}

export interface SignedUrlResult {
  success: boolean;
  provider: string;
  signedUrl: string;
  expiresInSeconds: number;
  expiresAt: string;
  path: string;
  bucket: string;
  errorMessage?: string;
}

export interface IStorageProvider {
  readonly id: string;
  readonly name: string;
  readonly isConfigured: boolean;
  readonly defaultBucket: string;
  uploadFile(payload: StorageUploadPayload): Promise<StorageUploadResult>;
  createSignedUrl(path: string, expiresInSeconds?: number, bucket?: string): Promise<SignedUrlResult>;
  deleteFile?(path: string, bucket?: string): Promise<{ success: boolean; errorMessage?: string }>;
  ensureBucket?(bucketName: string, isPrivate: boolean): Promise<{ success: boolean; message: string }>;
}

export interface StorageProviderStatus {
  activeProviderId: string;
  activeProviderName: string;
  isConfigured: boolean;
  defaultBucket: string;
  isPrivateEnforced: boolean;
  defaultSignedUrlTtlSeconds: number;
  availableProviders: {
    id: string;
    name: string;
    isConfigured: boolean;
    description: string;
    recommendationNote?: string;
  }[];
}
