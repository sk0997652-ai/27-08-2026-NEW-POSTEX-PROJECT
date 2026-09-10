import { ISmsProvider, SmsDispatchPayload, SmsDispatchResult } from '../smsTypes';

/**
 * Development & Testing Console Mock SMS Provider
 * Safe default that never charges or connects to external carriers.
 */
export class ConsoleMockSmsProvider implements ISmsProvider {
  public readonly id = 'mock';
  public readonly name = 'Console Mock Provider (Dev Safe)';
  public readonly isConfigured = true;
  public readonly isPaid = false;

  public async sendSms(payload: SmsDispatchPayload): Promise<SmsDispatchResult> {
    const timestamp = new Date().toISOString();
    const msgId = `mock-sms-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    console.log(`\n======================================================`);
    console.log(`[DEV SMS GATEWAY] 📱 Mock SMS Dispatched`);
    console.log(`  Recipient  : ${payload.to}`);
    console.log(`  Template   : ${payload.templateType || 'GENERAL_SMS'}`);
    if (payload.metadata?.otpCode) {
      console.log(`  >>> OTP CODE: [ ${payload.metadata.otpCode} ] <<<`);
    }
    console.log(`  Message    : "${payload.message}"`);
    console.log(`  Dispatched : ${timestamp}`);
    console.log(`======================================================\n`);

    return {
      success: true,
      provider: this.name,
      messageId: msgId,
      recipient: payload.to,
      timestamp,
      debugMockOtp: payload.metadata?.otpCode
    };
  }

  public async verifyCredentials(): Promise<{ valid: boolean; message: string }> {
    return {
      valid: true,
      message: 'Console Mock Provider is always ready for development testing.'
    };
  }
}
