import { IWhatsAppProvider, WhatsAppDispatchPayload, WhatsAppDispatchResult } from '../whatsappTypes';

/**
 * Meta WhatsApp Business Cloud API Provider
 * Direct enterprise integration with Meta Graph API.
 * Requires:
 * - WHATSAPP_ACCESS_TOKEN (Meta System User Permanent Token with whatsapp_business_messaging scope)
 * - WHATSAPP_PHONE_NUMBER_ID (Meta Phone Number ID from WhatsApp App Dashboard)
 * - Optional: WHATSAPP_BUSINESS_ACCOUNT_ID (WABA ID)
 */
export class MetaCloudWhatsAppProvider implements IWhatsAppProvider {
  public readonly id = 'meta_cloud';
  public readonly name = 'Meta WhatsApp Business Cloud API';
  public readonly isPaid = true;

  private accessToken: string;
  private phoneNumberId: string;
  private apiVersion: string;

  constructor() {
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN || '';
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
    this.apiVersion = process.env.WHATSAPP_API_VERSION || 'v19.0';
  }

  public get isConfigured(): boolean {
    return Boolean(this.accessToken && this.phoneNumberId);
  }

  // Format Pakistan recipient to standard international number without +
  private formatRecipient(to: string): string {
    const cleaned = to.replace(/\D/g, '');
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

  public async sendMessage(payload: WhatsAppDispatchPayload): Promise<WhatsAppDispatchResult> {
    const timestamp = new Date().toISOString();
    const formattedTo = this.formatRecipient(payload.to);

    if (!this.isConfigured) {
      return {
        success: false,
        provider: this.name,
        messageId: '',
        recipient: formattedTo,
        timestamp,
        errorMessage: 'Meta WhatsApp credentials not configured. Please set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID in .env.'
      };
    }

    try {
      const endpoint = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`;

      let body: any;

      if (payload.templateName) {
        // Template-based message (Required by Meta for business-initiated conversations)
        body = {
          messaging_product: 'whatsapp',
          to: formattedTo,
          type: 'template',
          template: {
            name: payload.templateName,
            language: { code: payload.languageCode || 'en' },
            components: payload.parameters && payload.parameters.length > 0 ? [
              {
                type: 'body',
                parameters: payload.parameters
              }
            ] : undefined
          }
        };
      } else {
        // Freeform text message (Valid within 24hr customer care window)
        body = {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: formattedTo,
          type: 'text',
          text: { preview_url: false, body: payload.bodyText || 'PostEx HR Notification' }
        };
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      const data = await res.json() as any;

      if (!res.ok) {
        return {
          success: false,
          provider: this.name,
          messageId: '',
          recipient: formattedTo,
          timestamp,
          statusCode: res.status,
          errorMessage: data.error?.message || `Meta Graph API error HTTP ${res.status}`,
          rawResponse: data
        };
      }

      const msgId = data.messages?.[0]?.id || `wa-${Date.now()}`;
      return {
        success: true,
        provider: this.name,
        messageId: msgId,
        recipient: formattedTo,
        timestamp,
        statusCode: res.status,
        rawResponse: data
      };
    } catch (err: any) {
      return {
        success: false,
        provider: this.name,
        messageId: '',
        recipient: formattedTo,
        timestamp,
        errorMessage: err.message || 'Meta WhatsApp API request failed'
      };
    }
  }

  public async verifyCredentials(): Promise<{ valid: boolean; message: string }> {
    if (!this.isConfigured) {
      return {
        valid: false,
        message: 'Missing WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID.'
      };
    }

    try {
      const res = await fetch(`https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}`, {
        headers: { 'Authorization': `Bearer ${this.accessToken}` }
      });

      if (res.ok) {
        const data = await res.json() as any;
        return {
          valid: true,
          message: `Connected to Meta Phone Number ID: ${data.display_phone_number || this.phoneNumberId} (${data.verified_name || 'Verified Business'}).`
        };
      }
      return {
        valid: false,
        message: `Meta authentication failed with HTTP status ${res.status}.`
      };
    } catch (err: any) {
      return {
        valid: false,
        message: `Failed to connect to Meta Graph API: ${err.message}`
      };
    }
  }
}
