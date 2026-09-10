/**
 * PostEx HR Onboarding Portal - SMS & OTP Provider Abstraction
 */

export interface SmsDispatchPayload {
  to: string; // E.164 or Pakistan local format (e.g. +923001234567 or 03001234567)
  message: string;
  templateType?: 'OTP' | 'ONBOARDING_INVITE' | 'CORRECTION_NOTICE' | 'DECISION_NOTICE';
  metadata?: {
    joiningId?: string;
    cnic?: string;
    otpCode?: string;
    expiresInMinutes?: number;
  };
}

export interface SmsDispatchResult {
  success: boolean;
  provider: string;
  messageId: string;
  recipient: string;
  timestamp: string;
  statusCode?: number;
  errorMessage?: string;
  rawResponse?: unknown;
  debugMockOtp?: string; // Only populated in mock mode
}

export interface ISmsProvider {
  readonly id: string;
  readonly name: string;
  readonly isConfigured: boolean;
  readonly isPaid: boolean;
  sendSms(payload: SmsDispatchPayload): Promise<SmsDispatchResult>;
  verifyCredentials?(): Promise<{ valid: boolean; message: string }>;
}

export interface SmsProviderStatus {
  activeProviderId: string;
  activeProviderName: string;
  isConfigured: boolean;
  availableProviders: {
    id: string;
    name: string;
    isConfigured: boolean;
    isPaid: boolean;
    description: string;
    recommendationNote?: string;
  }[];
}
