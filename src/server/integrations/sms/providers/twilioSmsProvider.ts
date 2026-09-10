import { ISmsProvider, SmsDispatchPayload, SmsDispatchResult } from '../smsTypes';

/**
 * Twilio SMS Gateway Provider
 * Global carrier network with fallback routing.
 * Requires: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER or TWILIO_MESSAGING_SERVICE_SID.
 */
export class TwilioSmsProvider implements ISmsProvider {
  public readonly id = 'twilio';
  public readonly name = 'Twilio Programmable Messaging';
  public readonly isPaid = true;

  private accountSid: string;
  private authToken: string;
  private fromNumber: string;
  private messagingServiceSid: string;

  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID || '';
    this.authToken = process.env.TWILIO_AUTH_TOKEN || '';
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER || '';
    this.messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID || '';
  }

  public get isConfigured(): boolean {
    const hasSender = Boolean(this.fromNumber || this.messagingServiceSid);
    return Boolean(this.accountSid && this.authToken && hasSender);
  }

  // Format Pakistan numbers to E.164: e.g. +923001234567
  private formatE164(num: string): string {
    const cleaned = num.replace(/\D/g, '');
    if (cleaned.startsWith('92')) {
      return `+${cleaned}`;
    }
    if (cleaned.startsWith('0')) {
      return `+92${cleaned.substring(1)}`;
    }
    if (cleaned.length === 10 && cleaned.startsWith('3')) {
      return `+92${cleaned}`;
    }
    return `+${cleaned}`;
  }

  public async sendSms(payload: SmsDispatchPayload): Promise<SmsDispatchResult> {
    const timestamp = new Date().toISOString();
    const formattedRecipient = this.formatE164(payload.to);

    if (!this.isConfigured) {
      return {
        success: false,
        provider: this.name,
        messageId: '',
        recipient: formattedRecipient,
        timestamp,
        errorMessage: 'Twilio credentials not configured. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER in environment variables.'
      };
    }

    try {
      const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;
      const basicAuth = Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64');

      const formData = new URLSearchParams();
      formData.append('To', formattedRecipient);
      if (this.messagingServiceSid) {
        formData.append('MessagingServiceSid', this.messagingServiceSid);
      } else {
        formData.append('From', this.fromNumber);
      }
      formData.append('Body', payload.message);

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${basicAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData.toString()
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
          errorMessage: data.message || `Twilio HTTP ${res.status}: Error code ${data.code}`,
          rawResponse: data
        };
      }

      return {
        success: true,
        provider: this.name,
        messageId: data.sid || `twilio-${Date.now()}`,
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
        errorMessage: err.message || 'Twilio connection failed'
      };
    }
  }

  public async verifyCredentials(): Promise<{ valid: boolean; message: string }> {
    if (!this.isConfigured) {
      return {
        valid: false,
        message: 'Missing TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN or sender details.'
      };
    }
    try {
      const basicAuth = Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64');
      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}.json`, {
        headers: { 'Authorization': `Basic ${basicAuth}` }
      });
      if (res.ok) {
        const data = await res.json() as any;
        return {
          valid: true,
          message: `Authenticated with Twilio account: "${data.friendly_name || this.accountSid}" (Status: ${data.status}).`
        };
      }
      return {
        valid: false,
        message: `Twilio verification failed with HTTP status ${res.status}.`
      };
    } catch (err: any) {
      return {
        valid: false,
        message: `Failed to connect to Twilio: ${err.message}`
      };
    }
  }
}
