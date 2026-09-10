import { IEmailProvider, EmailDispatchPayload, EmailDispatchResult } from '../emailTypes';

/**
 * SendGrid Email Provider
 * Popular developer email API with v3 Mail Send REST endpoint.
 * Requires: SENDGRID_API_KEY and EMAIL_FROM_ADDRESS
 */
export class SendGridEmailProvider implements IEmailProvider {
  public readonly id = 'sendgrid';
  public readonly name = 'Twilio SendGrid v3 Mail API';
  public readonly isPaid = true;

  private apiKey: string;
  private fromEmail: string;

  constructor() {
    this.apiKey = process.env.SENDGRID_API_KEY || '';
    this.fromEmail = process.env.EMAIL_FROM_ADDRESS || 'onboarding@postex.pk';
  }

  public get isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.startsWith('SG.') && this.apiKey.length > 20);
  }

  public async sendEmail(payload: EmailDispatchPayload): Promise<EmailDispatchResult> {
    const timestamp = new Date().toISOString();

    if (!this.isConfigured) {
      return {
        success: false,
        provider: this.name,
        messageId: '',
        recipient: payload.to,
        timestamp,
        errorMessage: 'SendGrid credentials not configured. Please set SENDGRID_API_KEY (starts with SG.) and EMAIL_FROM_ADDRESS in .env.'
      };
    }

    try {
      const endpoint = 'https://api.sendgrid.com/v3/mail/send';
      const contentArray: { type: string; value: string }[] = [];

      if (payload.text) {
        contentArray.push({ type: 'text/plain', value: payload.text });
      }
      if (payload.html) {
        contentArray.push({ type: 'text/html', value: payload.html });
      } else if (!payload.text) {
        contentArray.push({ type: 'text/plain', value: 'PostEx HR Notification' });
      }

      const body = {
        personalizations: [
          {
            to: [{ email: payload.to }]
          }
        ],
        from: { email: this.fromEmail, name: 'PostEx Human Resources' },
        subject: payload.subject,
        content: contentArray
      };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!res.ok && res.status !== 202) {
        const errorData = await res.json().catch(() => null);
        return {
          success: false,
          provider: this.name,
          messageId: '',
          recipient: payload.to,
          timestamp,
          statusCode: res.status,
          errorMessage: errorData?.errors?.[0]?.message || `SendGrid error HTTP ${res.status}`,
          rawResponse: errorData
        };
      }

      const msgId = res.headers.get('x-message-id') || `sg-${Date.now()}`;
      return {
        success: true,
        provider: this.name,
        messageId: msgId,
        recipient: payload.to,
        timestamp,
        statusCode: res.status
      };
    } catch (err: any) {
      return {
        success: false,
        provider: this.name,
        messageId: '',
        recipient: payload.to,
        timestamp,
        errorMessage: err.message || 'SendGrid request failed'
      };
    }
  }

  public async verifyCredentials(): Promise<{ valid: boolean; message: string }> {
    if (!this.isConfigured) {
      return {
        valid: false,
        message: 'Missing or invalid SENDGRID_API_KEY.'
      };
    }
    try {
      const res = await fetch('https://api.sendgrid.com/v3/user/profile', {
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });
      if (res.ok) {
        const data = await res.json() as any;
        return {
          valid: true,
          message: `SendGrid authenticated for account "${data.first_name || data.company || 'User'}" (${data.email}).`
        };
      }
      return {
        valid: false,
        message: `SendGrid authorization rejected with status ${res.status}.`
      };
    } catch (err: any) {
      return {
        valid: false,
        message: `Failed to connect to SendGrid: ${err.message}`
      };
    }
  }
}
