import { IEmailProvider, EmailDispatchPayload, EmailDispatchResult } from '../emailTypes';

/**
 * Mailgun Email Provider
 * API-driven email delivery platform.
 * Requires: MAILGUN_API_KEY, MAILGUN_DOMAIN, and optional MAILGUN_REGION (us/eu).
 */
export class MailgunEmailProvider implements IEmailProvider {
  public readonly id = 'mailgun';
  public readonly name = 'Mailgun by Sinch';
  public readonly isPaid = true;

  private apiKey: string;
  private domain: string;
  private fromEmail: string;
  private isEu: boolean;

  constructor() {
    this.apiKey = process.env.MAILGUN_API_KEY || '';
    this.domain = process.env.MAILGUN_DOMAIN || '';
    this.fromEmail = process.env.EMAIL_FROM_ADDRESS || 'onboarding@postex.pk';
    this.isEu = (process.env.MAILGUN_REGION || '').toLowerCase() === 'eu';
  }

  public get isConfigured(): boolean {
    return Boolean(this.apiKey && this.domain);
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
        errorMessage: 'Mailgun credentials not configured. Please set MAILGUN_API_KEY and MAILGUN_DOMAIN in .env.'
      };
    }

    try {
      const baseUrl = this.isEu ? 'https://api.eu.mailgun.net/v3' : 'https://api.mailgun.net/v3';
      const endpoint = `${baseUrl}/${this.domain}/messages`;
      const authHeader = 'Basic ' + Buffer.from(`api:${this.apiKey}`).toString('base64');

      const formData = new URLSearchParams();
      formData.append('from', `PostEx HR <${this.fromEmail}>`);
      formData.append('to', payload.to);
      formData.append('subject', payload.subject);
      if (payload.text) {
        formData.append('text', payload.text);
      }
      if (payload.html) {
        formData.append('html', payload.html);
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
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
          recipient: payload.to,
          timestamp,
          statusCode: res.status,
          errorMessage: data.message || `Mailgun HTTP error ${res.status}`,
          rawResponse: data
        };
      }

      return {
        success: true,
        provider: this.name,
        messageId: data.id || `mg-${Date.now()}`,
        recipient: payload.to,
        timestamp,
        rawResponse: data
      };
    } catch (err: any) {
      return {
        success: false,
        provider: this.name,
        messageId: '',
        recipient: payload.to,
        timestamp,
        errorMessage: err.message || 'Mailgun dispatch failed'
      };
    }
  }

  public async verifyCredentials(): Promise<{ valid: boolean; message: string }> {
    if (!this.isConfigured) {
      return {
        valid: false,
        message: 'Missing MAILGUN_API_KEY or MAILGUN_DOMAIN.'
      };
    }
    return {
      valid: true,
      message: `Configured for domain '${this.domain}' on ${this.isEu ? 'EU' : 'US'} Mailgun cluster.`
    };
  }
}
