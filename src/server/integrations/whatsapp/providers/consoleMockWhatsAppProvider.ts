import { IWhatsAppProvider, WhatsAppDispatchPayload, WhatsAppDispatchResult } from '../whatsappTypes';

/**
 * Development & Testing Console Mock WhatsApp Provider
 * Safe default that formats and logs WhatsApp template messages to stdout without incurring Meta API fees.
 */
export class ConsoleMockWhatsAppProvider implements IWhatsAppProvider {
  public readonly id = 'mock';
  public readonly name = 'Console Mock WhatsApp (Dev Safe)';
  public readonly isConfigured = true;
  public readonly isPaid = false;

  public async sendMessage(payload: WhatsAppDispatchPayload): Promise<WhatsAppDispatchResult> {
    const timestamp = new Date().toISOString();
    const msgId = `mock-wa-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    console.log(`\n======================================================`);
    console.log(`[DEV WHATSAPP SERVICE] 💬 Mock WhatsApp Dispatched`);
    console.log(`  Recipient  : +${payload.to}`);
    console.log(`  Template   : ${payload.templateName || 'TEXT_MESSAGE'} (${payload.languageCode || 'en'})`);
    if (payload.parameters && payload.parameters.length > 0) {
      console.log(`  Parameters : ${JSON.stringify(payload.parameters.map(p => p.text))}`);
    }
    if (payload.bodyText) {
      console.log(`  Body       : "${payload.bodyText}"`);
    }
    console.log(`  Dispatched : ${timestamp}`);
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
      message: 'Console Mock WhatsApp Provider is active for safe local development.'
    };
  }
}
