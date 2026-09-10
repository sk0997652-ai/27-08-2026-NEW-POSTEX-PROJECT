import { ISmsProvider, SmsDispatchPayload, SmsDispatchResult } from '../smsTypes';

/**
 * Infobip SMS Provider
 * RECOMMENDED FOR PAKISTAN:
 * - Direct SS7 / SMPP interconnects with all Pakistani operators (Jazz, Telenor, Zong, Ufone)
 * - 99%+ delivery rate to ported numbers (MNP)
 * - Supports PTA-registered alphanumeric Sender ID (e.g. "POSTEX")
 * - Cost: ~$0.012/SMS (significantly cheaper than Twilio in PK with higher deliverability)
 */
export class InfobipSmsProvider implements ISmsProvider {
  public readonly id = 'infobip';
  public readonly name = 'Infobip SMS Gateway (Recommended for Pakistan)';
  public readonly isPaid = true;

  private apiKey: string;
  private baseUrl: string;
  private senderId: string;

  constructor() {
    this.apiKey = process.env.INFOBIP_API_KEY || '';
    this.baseUrl = (process.env.INFOBIP_BASE_URL || '').replace(/\/$/, '');
    this.senderId = process.env.INFOBIP_SENDER_ID || 'POSTEX';
  }

  public get isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.length > 10 && this.baseUrl && this.baseUrl.startsWith('http'));
  }

  // Format Pakistan numbers: 03001234567 or 3001234567 -> 923001234567
  private formatPakistanNumber(num: string): string {
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
    const formattedRecipient = this.formatPakistanNumber(payload.to);

    if (!this.isConfigured) {
      return {
        success: false,
        provider: this.name,
        messageId: '',
        recipient: formattedRecipient,
        timestamp,
        errorMessage: 'Infobip credentials not configured. Please set INFOBIP_API_KEY and INFOBIP_BASE_URL in environment variables.'
      };
    }

    try {
      const endpoint = `${this.baseUrl}/sms/2/text/advanced`;
      const body = {
        messages: [
          {
            destinations: [{ to: formattedRecipient }],
            from: this.senderId,
            text: payload.message,
            notifyUrl: process.env.INFOBIP_WEBHOOK_URL || undefined
          }
        ]
      };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `App ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(body)
      });

      const data = await res.json() as any;

      if (!res.ok) {
        return {
          success: false,
          provider: this.name,
          messageId: '',
          recipient: formattedRecipient,
          timestamp,
          statusCode: res.status,
          errorMessage: data.requestError?.serviceException?.text || data.message || `Infobip API HTTP ${res.status}`,
          rawResponse: data
        };
      }

      const messageStatus = data.messages?.[0]?.status;
      const messageId = data.messages?.[0]?.messageId || `infobip-${Date.now()}`;

      return {
        success: true,
        provider: this.name,
        messageId,
        recipient: formattedRecipient,
        timestamp,
        statusCode: res.status,
        rawResponse: data
      };
    } catch (err: any) {
      return {
        success: false,
        provider: this.name,
        messageId: '',
        recipient: formattedRecipient,
        timestamp,
        errorMessage: err.message || 'Network failure communicating with Infobip API'
      };
    }
  }

  public async verifyCredentials(): Promise<{ valid: boolean; message: string }> {
    if (!this.isConfigured) {
      return {
        valid: false,
        message: 'Missing INFOBIP_API_KEY or INFOBIP_BASE_URL.'
      };
    }
    try {
      const res = await fetch(`${this.baseUrl}/account/1/balance`, {
        headers: {
          'Authorization': `App ${this.apiKey}`,
          'Accept': 'application/json'
        }
      });
      if (res.ok) {
        const data = await res.json() as any;
        return {
          valid: true,
          message: `Connected successfully to Infobip. Account Balance: ${data.balance} ${data.currency || 'EUR'}.`
        };
      }
      return {
        valid: false,
        message: `Infobip authentication failed with status ${res.status}.`
      };
    } catch (err: any) {
      return {
        valid: false,
        message: `Failed to connect to Infobip endpoint: ${err.message}`
      };
    }
  }
}
