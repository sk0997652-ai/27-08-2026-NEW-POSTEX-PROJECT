import { ISmsProvider, SmsDispatchPayload, SmsDispatchResult } from '../smsTypes';

/**
 * Jazz Business / Local Pakistan Telco Gateway Provider
 * Cost: ~PKR 1.20 - 1.80 ($0.005) per SMS with PTA-approved Alphanumeric Mask
 * Directly routes through Mobilink / Jazz Pakistan Corporate SMS API or generic local aggregator
 */
export class JazzBusinessSmsProvider implements ISmsProvider {
  public readonly id = 'jazz';
  public readonly name = 'Jazz Business SMS / Local PK Gateway';
  public readonly isPaid = true;

  private apiUrl: string;
  private apiUsername: string;
  private apiPassword: string;
  private maskName: string;

  constructor() {
    this.apiUrl = process.env.JAZZ_SMS_API_URL || '';
    this.apiUsername = process.env.JAZZ_SMS_USERNAME || '';
    this.apiPassword = process.env.JAZZ_SMS_PASSWORD || '';
    this.maskName = process.env.JAZZ_SMS_MASK || 'PostEx';
  }

  public get isConfigured(): boolean {
    return Boolean(this.apiUrl && this.apiUrl.startsWith('http') && this.apiUsername && this.apiPassword);
  }

  // Local Pakistan format: 923001234567
  private formatLocalNumber(num: string): string {
    const cleaned = num.replace(/\D/g, '');
    if (cleaned.startsWith('92')) {
      return cleaned;
    }
    if (cleaned.startsWith('0')) {
      return '92' + cleaned.substring(1);
    }
    if (cleaned.length === 10 && cleaned.startsWith('3')) {
      return '92' + cleaned;
    }
    return cleaned;
  }

  public async sendSms(payload: SmsDispatchPayload): Promise<SmsDispatchResult> {
    const timestamp = new Date().toISOString();
    const formattedRecipient = this.formatLocalNumber(payload.to);

    if (!this.isConfigured) {
      return {
        success: false,
        provider: this.name,
        messageId: '',
        recipient: formattedRecipient,
        timestamp,
        errorMessage: 'Jazz Business SMS credentials not configured. Please set JAZZ_SMS_API_URL, JAZZ_SMS_USERNAME, and JAZZ_SMS_PASSWORD.'
      };
    }

    try {
      // Jazz Corporate standard HTTP query / post structure
      const query = new URLSearchParams({
        username: this.apiUsername,
        password: this.apiPassword,
        receiver: formattedRecipient,
        msgdata: payload.message,
        sender: this.maskName
      });

      const res = await fetch(`${this.apiUrl}?${query.toString()}`, {
        method: 'POST',
        headers: { 'Accept': 'application/json, text/plain' }
      });

      const textResponse = await res.text();

      if (!res.ok) {
        return {
          success: false,
          provider: this.name,
          messageId: '',
          recipient: formattedRecipient,
          timestamp,
          statusCode: res.status,
          errorMessage: `Jazz Gateway error ${res.status}: ${textResponse}`
        };
      }

      return {
        success: true,
        provider: this.name,
        messageId: `jazz-${Date.now()}`,
        recipient: formattedRecipient,
        timestamp,
        statusCode: res.status,
        rawResponse: textResponse
      };
    } catch (err: any) {
      return {
        success: false,
        provider: this.name,
        messageId: '',
        recipient: formattedRecipient,
        timestamp,
        errorMessage: err.message || 'Jazz Business SMS connection failed'
      };
    }
  }

  public async verifyCredentials(): Promise<{ valid: boolean; message: string }> {
    if (!this.isConfigured) {
      return {
        valid: false,
        message: 'Missing JAZZ_SMS_API_URL, JAZZ_SMS_USERNAME or JAZZ_SMS_PASSWORD.'
      };
    }
    return {
      valid: true,
      message: `Configured for Jazz Corporate Gateway at ${this.apiUrl} (Mask: ${this.maskName}).`
    };
  }
}
