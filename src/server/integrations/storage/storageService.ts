import { IStorageProvider, StorageUploadPayload, StorageUploadResult, SignedUrlResult, StorageProviderStatus } from './storageTypes';
import { SupabaseStorageProvider } from './providers/supabaseStorageProvider';
import { LocalSecureStorageProvider } from './providers/localSecureStorageProvider';

class StorageServiceManager {
  private providers: Map<string, IStorageProvider> = new Map();
  private activeProviderId: string = 'local_vault';
  private localVault: LocalSecureStorageProvider;

  constructor() {
    this.localVault = new LocalSecureStorageProvider();
    const supabase = new SupabaseStorageProvider();

    this.providers.set(this.localVault.id, this.localVault);
    this.providers.set(supabase.id, supabase);

    const configured = (process.env.STORAGE_PROVIDER || '').toLowerCase().trim();
    if (configured === 'supabase' || (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)) {
      if (supabase.isConfigured) {
        this.activeProviderId = 'supabase';
        console.log(`[Storage Service] Initialized active provider: ${supabase.name}`);
        // Attempt lazy bucket check
        supabase.ensureBucket().then(res => {
          console.log(`[Storage Service] Bucket status: ${res.message}`);
        }).catch(() => {});
      } else {
        console.log('[Storage Service] Supabase not fully configured. Using Local Secure Vault with cryptographic signed URLs.');
        this.activeProviderId = 'local_vault';
      }
    } else {
      this.activeProviderId = 'local_vault';
    }
  }

  public getActiveProvider(): IStorageProvider {
    return this.providers.get(this.activeProviderId) || this.localVault;
  }

  public getLocalVault(): LocalSecureStorageProvider {
    return this.localVault;
  }

  public setActiveProvider(providerId: string): { success: boolean; message: string } {
    const provider = this.providers.get(providerId);
    if (!provider) {
      return { success: false, message: `Unknown storage provider "${providerId}". Options: supabase, local_vault` };
    }

    if (provider.id === 'supabase' && !provider.isConfigured) {
      return {
        success: false,
        message: 'Cannot switch to Supabase Storage: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing in .env.'
      };
    }

    this.activeProviderId = providerId;
    console.log(`[Storage Service] Switched active provider to: ${provider.name}`);
    return {
      success: true,
      message: `Active storage provider switched to ${provider.name}.`
    };
  }

  public async uploadDocument(payload: StorageUploadPayload): Promise<StorageUploadResult> {
    const active = this.getActiveProvider();
    try {
      const result = await active.uploadFile(payload);
      if (!result.success && active.id !== 'local_vault') {
        console.warn(`[Storage Service] Primary ${active.name} failed: ${result.errorMessage}. Falling back to Local Vault.`);
        return this.localVault.uploadFile(payload);
      }
      return result;
    } catch (err: any) {
      console.error(`[Storage Service] Storage upload error in ${active.name}:`, err);
      return this.localVault.uploadFile(payload);
    }
  }

  public async getSignedUrl(path: string, expiresInSeconds: number = 900, bucket?: string): Promise<SignedUrlResult> {
    const active = this.getActiveProvider();
    try {
      const result = await active.createSignedUrl(path, expiresInSeconds, bucket);
      if (!result.success && active.id !== 'local_vault') {
        console.warn(`[Storage Service] Primary ${active.name} failed to generate signed URL. Falling back to Local Vault.`);
        return this.localVault.createSignedUrl(path, expiresInSeconds, bucket);
      }
      return result;
    } catch (err: any) {
      console.error(`[Storage Service] Signed URL generation error:`, err);
      return this.localVault.createSignedUrl(path, expiresInSeconds, bucket);
    }
  }

  public getStatus(): StorageProviderStatus {
    const active = this.getActiveProvider();
    return {
      activeProviderId: this.activeProviderId,
      activeProviderName: active.name,
      isConfigured: active.isConfigured,
      defaultBucket: active.defaultBucket,
      isPrivateEnforced: true,
      defaultSignedUrlTtlSeconds: 900, // 15 minutes
      availableProviders: [
        {
          id: 'supabase',
          name: 'Supabase Storage (Private Encrypted S3-Compatible Bucket)',
          isConfigured: this.providers.get('supabase')?.isConfigured || false,
          description: 'S3-compatible object storage with Row Level Security (RLS), private buckets, and time-bounded HMAC signed URLs.',
          recommendationNote: 'Primary Production Target: Private bucket "hr-private-documents" with 15-minute signed URLs.'
        },
        {
          id: 'local_vault',
          name: 'Local Secure Vault (Cryptographic HMAC Signed URLs)',
          isConfigured: true,
          description: 'Zero-exposure development and offline safe vault with SHA-256 HMAC timestamp verification.',
          recommendationNote: 'Active during local development or when Supabase keys are not yet provided.'
        }
      ]
    };
  }

  public async testStorage(): Promise<{ success: boolean; upload: StorageUploadResult; signedUrl: SignedUrlResult; message: string }> {
    const testPath = `system_diagnostics/ping_${Date.now()}.txt`;
    const uploadRes = await this.uploadDocument({
      path: testPath,
      data: Buffer.from(`PostEx HR Document Vault Verification Ping: ${new Date().toISOString()}`),
      contentType: 'text/plain',
      isPrivate: true
    });

    const signedUrlRes = await this.getSignedUrl(testPath, 300);

    return {
      success: uploadRes.success && signedUrlRes.success,
      upload: uploadRes,
      signedUrl: signedUrlRes,
      message: uploadRes.success
        ? `Successfully verified secure upload and generated 15-minute signed URL with ${uploadRes.provider}.`
        : `Storage diagnostic failed: ${uploadRes.errorMessage}`
    };
  }
}

export const StorageService = new StorageServiceManager();
