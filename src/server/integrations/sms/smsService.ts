import { ISmsProvider, SmsDispatchPayload, SmsDispatchResult, SmsProviderStatus } from './smsTypes';
import { ConsoleMockSmsProvider } from './providers/consoleMockSmsProvider';
import { InfobipSmsProvider } from './providers/infobipSmsProvider';
import { TwilioSmsProvider } from './providers/twilioSmsProvider';
import { JazzBusinessSmsProvider } from './providers/jazzBusinessSmsProvider';

class SmsServiceManager {
  private providers: Map<string, ISmsProvider> = new Map();
  private activeProviderId: string = 'mock';

  constructor() {
    // Register all supported providers
    const mock = new ConsoleMockSmsProvider();
    const infobip = new InfobipSmsProvider();
    const twilio = new TwilioSmsProvider();
    const jazz = new JazzBusinessSmsProvider();

    this.providers.set(mock.id, mock);
    this.providers.set(infobip.id, infobip);
    this.providers.set(twilio.id, twilio);
    this.providers.set(jazz.id, jazz);

    // Pick active provider based on environment variable SMS_PROVIDER, or default to 'mock'
    const configuredProvider = (process.env.SMS_PROVIDER || '').toLowerCase().trim();
    if (configuredProvider && this.providers.has(configuredProvider)) {
      const p = this.providers.get(configuredProvider)!;
      if (p.isConfigured) {
        this.activeProviderId = configuredProvider;
        console.log(`[SMS Service] Initialized active provider: ${p.name}`);
      } else {
        console.warn(`[SMS Service] Requested provider '${configuredProvider}' lacks required credentials. Safely falling back to Console Mock.`);
        this.activeProviderId = 'mock';
      }
    } else {
      this.activeProviderId = 'mock';
    }
  }

  public getActiveProvider(): ISmsProvider {
    return this.providers.get(this.activeProviderId) || this.providers.get('mock')!;
  }

  public setActiveProvider(providerId: string): { success: boolean; message: string } {
    const provider = this.providers.get(providerId);
    if (!provider) {
      return { success: false, message: `Unknown SMS provider ID: "${providerId}". Valid options: ${Array.from(this.providers.keys()).join(', ')}` };
    }

    if (provider.isPaid && !provider.isConfigured) {
      return {
        success: false,
        message: `Cannot switch to ${provider.name}: Required environment variables are not configured in .env.`
      };
    }

    this.activeProviderId = providerId;
    console.log(`[SMS Service] Active provider switched to: ${provider.name}`);
    return {
      success: true,
      message: `Active SMS provider switched to ${provider.name}.`
    };
  }

  public async sendSms(payload: SmsDispatchPayload): Promise<SmsDispatchResult> {
    const active = this.getActiveProvider();

    // If active is a paid provider but not configured, fail gracefully to mock
    if (active.isPaid && !active.isConfigured) {
      console.warn(`[SMS Service] Active provider "${active.name}" is missing credentials. Routing to Console Mock.`);
      const mock = this.providers.get('mock')!;
      return mock.sendSms(payload);
    }

    try {
      const result = await active.sendSms(payload);
      if (!result.success && active.id !== 'mock') {
        console.error(`[SMS Service] Primary provider ${active.name} failed: ${result.errorMessage}. Falling back to Console Mock.`);
        const mock = this.providers.get('mock')!;
        const fallbackResult = await mock.sendSms(payload);
        return {
          ...fallbackResult,
          errorMessage: `Notice: Primary (${active.name}) failed [${result.errorMessage}]. Fallback mock succeeded.`
        };
      }
      return result;
    } catch (err: any) {
      console.error(`[SMS Service] Unhandled error in ${active.name}:`, err);
      const mock = this.providers.get('mock')!;
      return mock.sendSms(payload);
    }
  }

  public getStatus(): SmsProviderStatus {
    const active = this.getActiveProvider();
    const available = Array.from(this.providers.values()).map(p => ({
      id: p.id,
      name: p.name,
      isConfigured: p.isConfigured,
      isPaid: p.isPaid,
      description: p.id === 'infobip'
        ? 'Enterprise SMS with direct SS7 Pakistan telco connections, high MNP deliverability, and alphanumeric sender ID support.'
        : p.id === 'jazz'
        ? 'Local Pakistan Corporate SMS Gateway (Jazz / Mobilink). Ultra low-cost (~PKR 1.20/SMS) with PTA mask compliance.'
        : p.id === 'twilio'
        ? 'Global carrier network with international coverage and REST API.'
        : 'Development & testing console logger. Does not incur carrier fees or send actual SMS.',
      recommendationNote: p.id === 'infobip'
        ? 'Recommended Choice for Pakistan: Highest delivery rate for OTPs across Jazz, Zong, Telenor, and Ufone with branded mask "POSTEX".'
        : p.id === 'jazz'
        ? 'Best Cost for Pakistan: Bulk corporate rate (~$0.005/SMS), requires PTA mask registration.'
        : undefined
    }));

    return {
      activeProviderId: this.activeProviderId,
      activeProviderName: active.name,
      isConfigured: active.isConfigured,
      availableProviders: available
    };
  }

  public async testProvider(providerId: string, testRecipient: string): Promise<{ success: boolean; result: SmsDispatchResult; message: string }> {
    const target = this.providers.get(providerId);
    if (!target) {
      throw new Error(`Invalid provider ${providerId}`);
    }

    const testPayload: SmsDispatchPayload = {
      to: testRecipient || '03001234567',
      message: `[PostEx HR Test] Connectivity verification ping dispatched at ${new Date().toLocaleTimeString()}. Joining ID: J-99999. Code: 789456`,
      templateType: 'OTP',
      metadata: { otpCode: '789456', joiningId: 'J-TEST' }
    };

    const res = await target.sendSms(testPayload);
    return {
      success: res.success,
      result: res,
      message: res.success ? `Test SMS successfully processed by ${target.name}` : `Test SMS failed: ${res.errorMessage}`
    };
  }
}

export const SmsService = new SmsServiceManager();
