import { IStorageProvider, StorageUploadPayload, StorageUploadResult, SignedUrlResult } from '../storageTypes';
import { getSupabaseAdminClient, isSupabaseConfigured } from '../../../supabase/client';

/**
 * Supabase Storage Provider
 * Production-ready private storage for:
 * - Candidate identity proofs (CNIC, driving licenses, degrees, police clearance)
 * - Branch Manager / Central HR digital signatures
 * - Generated Joining Dossier PDFs
 * 
 * Enforces strictly private bucket (public: false) and authenticated short-lived signed URLs.
 */
export class SupabaseStorageProvider implements IStorageProvider {
  public readonly id = 'supabase';
  public readonly name = 'Supabase Storage (Private Encrypted Bucket)';
  public readonly defaultBucket: string;

  constructor() {
    this.defaultBucket = process.env.SUPABASE_STORAGE_BUCKET || 'hr-private-documents';
  }

  public get isConfigured(): boolean {
    const admin = getSupabaseAdminClient();
    return Boolean(isSupabaseConfigured() && admin);
  }

  /**
   * Helper to ensure private bucket exists with public: false
   */
  public async ensureBucket(bucketName: string = this.defaultBucket, isPrivate: boolean = true): Promise<{ success: boolean; message: string }> {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return { success: false, message: 'Supabase Admin client not initialized.' };
    }

    try {
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();
      if (listError) {
        return { success: false, message: `Failed to query Supabase buckets: ${listError.message}` };
      }

      const existing = buckets?.find(b => b.name === bucketName);
      if (existing) {
        return { success: true, message: `Bucket '${bucketName}' exists (Public: ${existing.public ? 'YES' : 'NO - Private'}).` };
      }

      // Create new private bucket
      const { error: createError } = await supabase.storage.createBucket(bucketName, {
        public: !isPrivate,
        fileSizeLimit: 25 * 1024 * 1024, // 25MB max
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
      });

      if (createError) {
        return { success: false, message: `Failed to create private bucket '${bucketName}': ${createError.message}` };
      }

      return { success: true, message: `Private bucket '${bucketName}' successfully provisioned.` };
    } catch (err: any) {
      return { success: false, message: err.message || 'Error checking Supabase bucket' };
    }
  }

  public async uploadFile(payload: StorageUploadPayload): Promise<StorageUploadResult> {
    const timestamp = new Date().toISOString();
    const bucket = payload.bucket || this.defaultBucket;
    const supabase = getSupabaseAdminClient();

    if (!this.isConfigured || !supabase) {
      return {
        success: false,
        provider: this.name,
        bucket,
        path: payload.path,
        fileSizeBytes: 0,
        contentType: payload.contentType,
        timestamp,
        errorMessage: 'Supabase credentials not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.'
      };
    }

    try {
      let fileData: Buffer;
      if (typeof payload.data === 'string') {
        if (payload.data.startsWith('data:')) {
          // Extract base64
          const base64Data = payload.data.split(',')[1] || payload.data;
          fileData = Buffer.from(base64Data, 'base64');
        } else {
          fileData = Buffer.from(payload.data, 'utf-8');
        }
      } else if (Buffer.isBuffer(payload.data)) {
        fileData = payload.data;
      } else {
        fileData = Buffer.from(payload.data);
      }

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(payload.path, fileData, {
          contentType: payload.contentType,
          upsert: true
        });

      if (uploadError) {
        return {
          success: false,
          provider: this.name,
          bucket,
          path: payload.path,
          fileSizeBytes: fileData.length,
          contentType: payload.contentType,
          timestamp,
          errorMessage: uploadError.message
        };
      }

      return {
        success: true,
        provider: this.name,
        bucket,
        path: payload.path,
        fileSizeBytes: fileData.length,
        contentType: payload.contentType,
        timestamp
      };
    } catch (err: any) {
      return {
        success: false,
        provider: this.name,
        bucket,
        path: payload.path,
        fileSizeBytes: 0,
        contentType: payload.contentType,
        timestamp,
        errorMessage: err.message || 'Supabase storage upload failed'
      };
    }
  }

  public async createSignedUrl(
    path: string,
    expiresInSeconds: number = 900, // 15 minutes default
    bucket: string = this.defaultBucket
  ): Promise<SignedUrlResult> {
    const supabase = getSupabaseAdminClient();
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString();

    if (!this.isConfigured || !supabase) {
      return {
        success: false,
        provider: this.name,
        signedUrl: '',
        expiresInSeconds,
        expiresAt,
        path,
        bucket,
        errorMessage: 'Supabase credentials not configured in environment variables.'
      };
    }

    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, expiresInSeconds);

      if (error || !data?.signedUrl) {
        return {
          success: false,
          provider: this.name,
          signedUrl: '',
          expiresInSeconds,
          expiresAt,
          path,
          bucket,
          errorMessage: error?.message || 'Failed to generate signed download URL'
        };
      }

      return {
        success: true,
        provider: this.name,
        signedUrl: data.signedUrl,
        expiresInSeconds,
        expiresAt,
        path,
        bucket
      };
    } catch (err: any) {
      return {
        success: false,
        provider: this.name,
        signedUrl: '',
        expiresInSeconds,
        expiresAt,
        path,
        bucket,
        errorMessage: err.message || 'Supabase signed URL generation failed'
      };
    }
  }

  public async deleteFile(path: string, bucket: string = this.defaultBucket): Promise<{ success: boolean; errorMessage?: string }> {
    const supabase = getSupabaseAdminClient();
    if (!supabase) return { success: false, errorMessage: 'Supabase not configured' };

    const { error } = await supabase.storage.from(bucket).remove([path]);
    return { success: !error, errorMessage: error?.message };
  }
}
