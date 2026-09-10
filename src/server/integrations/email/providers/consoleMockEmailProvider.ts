import { IEmailProvider, EmailDispatchPayload, EmailDispatchResult } from '../emailTypes';

/**
 * Development & Testing Console Mock Email Provider
 * Safe default that logs emails to stdout without sending actual external mail.
 */
export class ConsoleMockEmailProvider implements IEmailProvider {
  public readonly id = 'mock';
  public readonly name = 'Console Mock Email (Dev Safe)';
  public readonly isConfigured = true;
  public readonly isPaid = false;

  public async sendEmail(payload: EmailDispatchPayload): Promise<EmailDispatchResult> {
    const timestamp = new Date().toISOString();
    const msgId = `mock-mail-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    console.log(`\n======================================================`);
    console.log(`[DEV EMAIL SERVICE] 📧 Mock Email Dispatched`);
    console.log(`  To          : ${payload.to}`);
    console.log(`  Subject     : ${payload.subject}`);
    console.log(`  Template    : ${payload.templateType || 'GENERAL_NOTIFICATION'}`);
    console.log(`  Content     :\n${payload.text || payload.html?.substring(0, 200)}...`);
    console.log(`  Dispatched  : ${timestamp}`);
    console.log(`======================================================\n`);

    return {
      success: true,
      provider: this.name,
      messageId: msgId,
      recipient: payload.to,
      timestamp
    };
  }

  public async verifyCredentials(): Promise<{ valid: boolean; message: string }> {
    return {
      valid: true,
      message: 'Console Mock Email Provider is always ready for development testing.'
    };
  }
}
