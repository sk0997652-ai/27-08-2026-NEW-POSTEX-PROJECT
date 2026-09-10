import { IEmailProvider, EmailDispatchPayload, EmailDispatchResult, EmailProviderStatus } from './emailTypes';
import { ConsoleMockEmailProvider } from './providers/consoleMockEmailProvider';
import { AwsSesEmailProvider } from './providers/awsSesEmailProvider';
import { SendGridEmailProvider } from './providers/sendGridEmailProvider';
import { MailgunEmailProvider } from './providers/mailgunEmailProvider';

class EmailServiceManager {
  private providers: Map<string, IEmailProvider> = new Map();
  private activeProviderId: string = 'mock';

  constructor() {
    const mock = new ConsoleMockEmailProvider();
    const ses = new AwsSesEmailProvider();
    const sendgrid = new SendGridEmailProvider();
    const mailgun = new MailgunEmailProvider();

    this.providers.set(mock.id, mock);
    this.providers.set(ses.id, ses);
    this.providers.set(sendgrid.id, sendgrid);
    this.providers.set(mailgun.id, mailgun);

    const configured = (process.env.EMAIL_PROVIDER || '').toLowerCase().trim();
    if (configured && this.providers.has(configured)) {
      const p = this.providers.get(configured)!;
      if (p.isConfigured) {
        this.activeProviderId = configured;
        console.log(`[Email Service] Initialized active provider: ${p.name}`);
      } else {
        console.warn(`[Email Service] Requested provider '${configured}' lacks credentials in .env. Safely falling back to Console Mock.`);
        this.activeProviderId = 'mock';
      }
    } else {
      this.activeProviderId = 'mock';
    }
  }

  public getActiveProvider(): IEmailProvider {
    return this.providers.get(this.activeProviderId) || this.providers.get('mock')!;
  }

  public setActiveProvider(providerId: string): { success: boolean; message: string } {
    const provider = this.providers.get(providerId);
    if (!provider) {
      return { success: false, message: `Unknown Email provider ID: "${providerId}". Valid options: ${Array.from(this.providers.keys()).join(', ')}` };
    }

    if (provider.isPaid && !provider.isConfigured) {
      return {
        success: false,
        message: `Cannot switch to ${provider.name}: Required credentials are not set in environment variables.`
      };
    }

    this.activeProviderId = providerId;
    console.log(`[Email Service] Switched active provider to: ${provider.name}`);
    return {
      success: true,
      message: `Active Email provider switched to ${provider.name}.`
    };
  }

  public async sendEmail(payload: EmailDispatchPayload): Promise<EmailDispatchResult> {
    const active = this.getActiveProvider();

    if (active.isPaid && !active.isConfigured) {
      console.warn(`[Email Service] Active provider "${active.name}" missing credentials. Routing to Console Mock.`);
      const mock = this.providers.get('mock')!;
      return mock.sendEmail(payload);
    }

    try {
      const result = await active.sendEmail(payload);
      if (!result.success && active.id !== 'mock') {
        console.error(`[Email Service] Primary provider ${active.name} failed: ${result.errorMessage}. Falling back to Console Mock.`);
        const mock = this.providers.get('mock')!;
        const fallback = await mock.sendEmail(payload);
        return {
          ...fallback,
          errorMessage: `Notice: Primary (${active.name}) failed [${result.errorMessage}]. Fallback mock succeeded.`
        };
      }
      return result;
    } catch (err: any) {
      console.error(`[Email Service] Error sending email via ${active.name}:`, err);
      const mock = this.providers.get('mock')!;
      return mock.sendEmail(payload);
    }
  }

  public getStatus(): EmailProviderStatus {
    const active = this.getActiveProvider();
    const available = Array.from(this.providers.values()).map(p => ({
      id: p.id,
      name: p.name,
      isConfigured: p.isConfigured,
      isPaid: p.isPaid,
      description: p.id === 'ses'
        ? 'Enterprise Cloud Email with 99.9% uptime, custom DKIM/SPF domain verification, and high deliverability.'
        : p.id === 'sendgrid'
        ? 'Popular developer email API with dynamic templates and real-time event webhooks.'
        : p.id === 'mailgun'
        ? 'Developer-centric transactional email API with powerful routing and parsing.'
        : 'Development & testing console logger. Does not send live emails.',
      recommendationNote: p.id === 'ses'
        ? 'Recommended Choice: Lowest cost ($0.10/1,000 emails, ~50x cheaper than competitors), enterprise 99.9% SLA, and native custom domain postex.pk alignment.'
        : undefined
    }));

    return {
      activeProviderId: this.activeProviderId,
      activeProviderName: active.name,
      isConfigured: active.isConfigured,
      fromAddress: process.env.EMAIL_FROM_ADDRESS || 'onboarding@postex.pk',
      availableProviders: available
    };
  }

  public async testProvider(providerId: string, testRecipient: string): Promise<{ success: boolean; result: EmailDispatchResult; message: string }> {
    const target = this.providers.get(providerId);
    if (!target) {
      throw new Error(`Invalid provider ${providerId}`);
    }

    const testPayload: EmailDispatchPayload = {
      to: testRecipient || 'admin@postex.pk',
      subject: `[PostEx HR Test] Operational Verification at ${new Date().toLocaleTimeString()}`,
      text: `Hello PostEx Team,\n\nThis is a verification test from PostEx HR Onboarding Portal using ${target.name}.\n\nTimestamp: ${new Date().toISOString()}\nStatus: Operational\n\nKind Regards,\nPostEx Platform Operations`,
      templateType: 'ONBOARDING_INVITE'
    };

    const res = await target.sendEmail(testPayload);
    return {
      success: res.success,
      result: res,
      message: res.success ? `Test email successfully dispatched by ${target.name}` : `Test email failed: ${res.errorMessage}`
    };
  }
}

export const EmailService = new EmailServiceManager();
