/**
 * PostEx HR Onboarding Portal - WhatsApp Business Cloud API Abstraction
 */

export interface WhatsAppDispatchPayload {
  to: string; // E.164 without leading plus: e.g. "923001234567"
  templateName?: string; // e.g. "postex_onboarding_welcome", "postex_doc_correction"
  languageCode?: string; // default "en" or "ur"
  bodyText?: string;
  parameters?: { type: 'text' | 'currency' | 'date_time'; text?: string }[];
  metadata?: Record<string, unknown>;
}

export interface WhatsAppDispatchResult {
  success: boolean;
  provider: string;
  messageId: string;
  recipient: string;
  timestamp: string;
  statusCode?: number;
  errorMessage?: string;
  rawResponse?: unknown;
}

export interface IWhatsAppProvider {
  readonly id: string;
  readonly name: string;
  readonly isConfigured: boolean;
  readonly isPaid: boolean;
  sendMessage(payload: WhatsAppDispatchPayload): Promise<WhatsAppDispatchResult>;
  verifyCredentials?(): Promise<{ valid: boolean; message: string }>;
}

export interface WhatsAppProviderStatus {
  activeProviderId: string;
  activeProviderName: string;
  isConfigured: boolean;
  phoneNumberId: string;
  wabaId: string;
  availableProviders: {
    id: string;
    name: string;
    isConfigured: boolean;
    isPaid: boolean;
    description: string;
  }[];
}
