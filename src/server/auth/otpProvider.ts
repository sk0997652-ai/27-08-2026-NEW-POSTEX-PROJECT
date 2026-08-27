/**
 * PostEx HR Onboarding Portal - Pluggable OTP Provider Interface
 * Allows seamless hot-swapping between Dev Mock/Console provider and production SMS Gateways
 * (e.g. Twilio, Jazz, Telenor, Zong, WhatsApp Business API).
 */

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
 * Development & Testing Mock/Console OTP Provider
 * Logs OTP to server console with structured debug trace and returns it for in-browser testing
 */
export class ConsoleMockOtpProvider implements IOtpProvider {
  public readonly providerName = 'POSTEX_DEV_CONSOLE_MOCK';

  public async sendOtp(payload: OtpDispatchPayload): Promise<OtpDispatchResult> {
    const timestamp = new Date().toISOString();
    
    // Explicit server log as required: "mock/log OTP only for development"
    console.log(`\n======================================================`);
    console.log(`[DEV OTP SERVICE] 📩 New Candidate OTP Generated:`);
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
 * Defaults to ConsoleMockOtpProvider, ready for injection of real SMS providers
 */
let activeProvider: IOtpProvider = new ConsoleMockOtpProvider();

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
