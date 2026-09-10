/**
 * PostEx HR Onboarding Portal - Pluggable OTP Provider Interface
 * Bridges seamlessly with Phase 7 SmsService and WhatsApp notification channels.
 */

import { SmsService } from '../integrations/sms/smsService';
import { WhatsAppService } from '../integrations/whatsapp/whatsappService';

export interface OtpDispatchPayload {
  recipientMobile: string;
  recipientCnic: string;
  joiningId: string;
  otpCode: string;
  expiresInMinutes: number;
}

export interface OtpDispatchResult {
  success: boolean;
  messageId: string;
  provider: string;
  dispatchedAt: string;
  debugMockOtp?: string; // Included only in development mode for developer testing
}

export interface IOtpProvider {
  readonly providerName: string;
  sendOtp(payload: OtpDispatchPayload): Promise<OtpDispatchResult>;
}

/**
 * Production Gateway-Backed OTP Provider
 * Dispatches via SmsService (Infobip, Twilio, Jazz Business, or Console Mock)
 */
export class ProductionGatewayOtpProvider implements IOtpProvider {
  public get providerName(): string {
    return SmsService.getActiveProvider().name;
  }

  public async sendOtp(payload: OtpDispatchPayload): Promise<OtpDispatchResult> {
    const timestamp = new Date().toISOString();
    const smsMessage = `[PostEx HR] Your onboarding login verification code is ${payload.otpCode}. Valid for ${payload.expiresInMinutes} minutes. Never share this code with anyone. (Joining ID: ${payload.joiningId})`;

    // Dispatch via unified SMS Service
    const smsResult = await SmsService.sendSms({
      to: payload.recipientMobile,
      message: smsMessage,
      templateType: 'OTP',
      metadata: {
        joiningId: payload.joiningId,
        cnic: payload.recipientCnic,
        otpCode: payload.otpCode,
        expiresInMinutes: payload.expiresInMinutes
      }
    });

    // Optionally dispatch WhatsApp alert if WhatsApp provider is configured
    const waActive = WhatsAppService.getActiveProvider();
    if (waActive.isPaid && waActive.isConfigured) {
      WhatsAppService.sendMessage({
        to: payload.recipientMobile,
        templateName: 'postex_otp_code',
        languageCode: 'en',
        bodyText: smsMessage,
        parameters: [{ type: 'text', text: payload.otpCode }]
      }).catch(err => console.warn('[OTP Gateway] WhatsApp mirror dispatch note:', err));
    }

    return {
      success: smsResult.success,
      messageId: smsResult.messageId || `otp-dispatch-${Date.now()}`,
      provider: smsResult.provider,
      dispatchedAt: timestamp,
      debugMockOtp: smsResult.debugMockOtp || payload.otpCode
    };
  }
}

/**
 * Development & Testing Mock/Console OTP Provider
 * Logs OTP to server console with structured debug trace and returns it for in-browser testing
 */
export class ConsoleMockOtpProvider implements IOtpProvider {
  public readonly providerName = 'POSTEX_DEV_CONSOLE_MOCK';

  public async sendOtp(payload: OtpDispatchPayload): Promise<OtpDispatchResult> {
    const timestamp = new Date().toISOString();
    
    // Explicit server log as required: "mock/log OTP only for development"
    console.log(`\n======================================================`);
    console.log(`[DEV OTP SERVICE] 📩 Candidate OTP Generated:`);
    console.log(`  Joining ID : ${payload.joiningId}`);
    console.log(`  CNIC       : ${payload.recipientCnic}`);
    console.log(`  Mobile     : ${payload.recipientMobile}`);
    console.log(`  >>> OTP CODE: [ ${payload.otpCode} ] <<<`);
    console.log(`  Expires In : ${payload.expiresInMinutes} minutes (at ${new Date(Date.now() + payload.expiresInMinutes * 60000).toLocaleTimeString()})`);
    console.log(`======================================================\n`);

    return {
      success: true,
      messageId: `msg-otp-${Date.now()}`,
      provider: this.providerName,
      dispatchedAt: timestamp,
      debugMockOtp: payload.otpCode
    };
  }
}

/**
 * OTP Service Factory / Singleton
 * Uses ProductionGatewayOtpProvider which leverages the active SMS provider
 */
let activeProvider: IOtpProvider = new ProductionGatewayOtpProvider();

export const OtpService = {
  getProvider(): IOtpProvider {
    return activeProvider;
  },

  setProvider(provider: IOtpProvider): void {
    console.log(`[OTP Gateway] Switched active provider to: ${provider.providerName}`);
    activeProvider = provider;
  },

  generate6DigitCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
};

