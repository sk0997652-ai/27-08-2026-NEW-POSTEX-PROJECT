import { IWhatsAppProvider, WhatsAppDispatchPayload, WhatsAppDispatchResult, WhatsAppProviderStatus } from './whatsappTypes';
import { ConsoleMockWhatsAppProvider } from './providers/consoleMockWhatsAppProvider';
import { MetaCloudWhatsAppProvider } from './providers/metaCloudWhatsAppProvider';

class WhatsAppServiceManager {
  private providers: Map<string, IWhatsAppProvider> = new Map();
  private activeProviderId: string = 'mock';

  constructor() {
    const mock = new ConsoleMockWhatsAppProvider();
    const meta = new MetaCloudWhatsAppProvider();

    this.providers.set(mock.id, mock);
    this.providers.set(meta.id, meta);

    const configured = (process.env.WHATSAPP_PROVIDER || '').toLowerCase().trim();
    if (configured === 'meta_cloud' || (process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID)) {
      if (meta.isConfigured) {
        this.activeProviderId = 'meta_cloud';
        console.log(`[WhatsApp Service] Initialized active provider: ${meta.name}`);
      } else {
        this.activeProviderId = 'mock';
      }
    } else {
      this.activeProviderId = 'mock';
    }
  }

  public getActiveProvider(): IWhatsAppProvider {
    return this.providers.get(this.activeProviderId) || this.providers.get('mock')!;
  }

  public setActiveProvider(providerId: string): { success: boolean; message: string } {
    const provider = this.providers.get(providerId);
    if (!provider) {
      return { success: false, message: `Unknown WhatsApp provider "${providerId}". Options: meta_cloud, mock` };
    }

    if (provider.isPaid && !provider.isConfigured) {
      return {
        success: false,
        message: 'Cannot switch to Meta WhatsApp Cloud API: WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID is missing in .env.'
      };
    }

    this.activeProviderId = providerId;
    console.log(`[WhatsApp Service] Switched active provider to: ${provider.name}`);
    return {
      success: true,
      message: `Active WhatsApp provider switched to ${provider.name}.`
    };
  }

  public async sendMessage(payload: WhatsAppDispatchPayload): Promise<WhatsAppDispatchResult> {
    const active = this.getActiveProvider();

    if (active.isPaid && !active.isConfigured) {
      console.warn(`[WhatsApp Service] Active provider "${active.name}" missing credentials. Routing to Console Mock.`);
      const mock = this.providers.get('mock')!;
      return mock.sendMessage(payload);
    }

    try {
      const result = await active.sendMessage(payload);
      if (!result.success && active.id !== 'mock') {
        console.error(`[WhatsApp Service] Primary provider ${active.name} failed: ${result.errorMessage}. Falling back to Console Mock.`);
        const mock = this.providers.get('mock')!;
        const fallback = await mock.sendMessage(payload);
        return {
          ...fallback,
          errorMessage: `Notice: Primary (${active.name}) failed [${result.errorMessage}]. Fallback mock succeeded.`
        };
      }
      return result;
    } catch (err: any) {
      console.error(`[WhatsApp Service] Error sending WhatsApp message:`, err);
      const mock = this.providers.get('mock')!;
      return mock.sendMessage(payload);
    }
  }

  public getStatus(): WhatsAppProviderStatus {
    const active = this.getActiveProvider();
    return {
      activeProviderId: this.activeProviderId,
      activeProviderName: active.name,
      isConfigured: active.isConfigured,
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID ? 'Configured (ID: ' + process.env.WHATSAPP_PHONE_NUMBER_ID.slice(0, 4) + '...)' : 'Not Set',
      wabaId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || 'Not Set',
      availableProviders: [
        {
          id: 'meta_cloud',
          name: 'Meta WhatsApp Business Cloud API (Official)',
          isConfigured: this.providers.get('meta_cloud')?.isConfigured || false,
          isPaid: true,
          description: 'Direct Cloud API hosted by Meta. Send template notifications for onboarding, verification approvals, and correction alerts.'
        },
        {
          id: 'mock',
          name: 'Console Mock WhatsApp (Dev Safe)',
          isConfigured: true,
          isPaid: false,
          description: 'Safe development fallback that logs WhatsApp message payloads to server console without Meta charges.'
        }
      ]
    };
  }

  public async testWhatsApp(testRecipient: string): Promise<{ success: boolean; result: WhatsAppDispatchResult; message: string }> {
    const active = this.getActiveProvider();
    const payload: WhatsAppDispatchPayload = {
      to: testRecipient || '923001234567',
      templateName: 'postex_onboarding_welcome',
      languageCode: 'en',
      bodyText: `[PostEx HR Test] WhatsApp Cloud API operational ping at ${new Date().toLocaleTimeString()}.`,
      parameters: [
        { type: 'text', text: 'Candidate Test' },
        { type: 'text', text: 'J-99999' }
      ]
    };

    const res = await active.sendMessage(payload);
    return {
      success: res.success,
      result: res,
      message: res.success ? `Test message successfully dispatched by ${active.name}` : `Test message failed: ${res.errorMessage}`
    };
  }
}

export const WhatsAppService = new WhatsAppServiceManager();
