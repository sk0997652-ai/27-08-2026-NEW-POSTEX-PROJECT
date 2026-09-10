/**
 * PostEx HR Onboarding Portal - Email Provider Abstraction
 */

export interface EmailDispatchPayload {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  templateType?: 'ONBOARDING_INVITE' | 'CORRECTION_REQUIRED' | 'EMPLOYMENT_APPROVED' | 'CREDENTIALS_ISSUED';
  metadata?: Record<string, unknown>;
}

export interface EmailDispatchResult {
  success: boolean;
  provider: string;
  messageId: string;
  recipient: string;
  timestamp: string;
  statusCode?: number;
  errorMessage?: string;
  rawResponse?: unknown;
}

export interface IEmailProvider {
  readonly id: string;
  readonly name: string;
  readonly isConfigured: boolean;
  readonly isPaid: boolean;
  sendEmail(payload: EmailDispatchPayload): Promise<EmailDispatchResult>;
  verifyCredentials?(): Promise<{ valid: boolean; message: string }>;
}

export interface EmailProviderStatus {
  activeProviderId: string;
  activeProviderName: string;
  isConfigured: boolean;
  fromAddress: string;
  availableProviders: {
    id: string;
    name: string;
    isConfigured: boolean;
    isPaid: boolean;
    description: string;
    recommendationNote?: string;
  }[];
}
