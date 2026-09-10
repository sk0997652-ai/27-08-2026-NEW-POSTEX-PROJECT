/**
 * PostEx HR Onboarding Portal - Unified Integrations Gateway
 * Production-ready abstractions for:
 * 1. SMS / OTP Gateways (Infobip, Twilio, Jazz Business, Console Mock)
 * 2. Transactional Email Gateways (AWS SES, SendGrid, Mailgun, Console Mock)
 * 3. Private Encrypted Document Storage (Supabase Storage, Local Secure Vault)
 * 4. WhatsApp Business Cloud API (Meta Cloud API, Console Mock)
 */

export { SmsService } from './sms/smsService';
export * from './sms/smsTypes';

export { EmailService } from './email/emailService';
export * from './email/emailTypes';

export { StorageService } from './storage/storageService';
export * from './storage/storageTypes';

export { WhatsAppService } from './whatsapp/whatsappService';
export * from './whatsapp/whatsappTypes';

import { SmsService } from './sms/smsService';
import { EmailService } from './email/emailService';
import { StorageService } from './storage/storageService';
import { WhatsAppService } from './whatsapp/whatsappService';

export interface GlobalIntegrationsOverview {
  environment: string;
  sms: ReturnType<typeof SmsService.getStatus>;
  email: ReturnType<typeof EmailService.getStatus>;
  storage: ReturnType<typeof StorageService.getStatus>;
  whatsapp: ReturnType<typeof WhatsAppService.getStatus>;
  recommendations: {
    category: string;
    recommendedProvider: string;
    rationale: string;
    requiredCredentials: string[];
    costProfile: string;
  }[];
}

export function getIntegrationsOverview(): GlobalIntegrationsOverview {
  return {
    environment: process.env.NODE_ENV || 'development',
    sms: SmsService.getStatus(),
    email: EmailService.getStatus(),
    storage: StorageService.getStatus(),
    whatsapp: WhatsAppService.getStatus(),
    recommendations: [
      {
        category: 'SMS & OTP Delivery',
        recommendedProvider: 'Infobip (Global/PK) or Jazz Business (Local Direct)',
        rationale: 'Pakistan mobile networks (Jazz, Telenor, Zong, Ufone) strictly filter non-whitelisted international aggregator traffic. Infobip provides direct Tier-1 SS7 telco routes and branded PTA sender masking ("POSTEX"). Jazz Business provides lowest local cost (~PKR 1.40/SMS).',
        requiredCredentials: ['INFOBIP_API_KEY', 'INFOBIP_BASE_URL', 'INFOBIP_SENDER_ID'],
        costProfile: 'Infobip: ~$0.012/SMS | Jazz Direct: ~PKR 1.20 - 1.80/SMS'
      },
      {
        category: 'Transactional Email',
        recommendedProvider: 'Amazon Web Services SES (Simple Email Service)',
        rationale: 'AWS SES offers industry-leading deliverability, dedicated IP warm-up, custom DKIM/SPF domain verification for postex.pk, and an unbeatable cost of $0.10 per 1,000 emails (50x cheaper than SendGrid or Mailgun).',
        requiredCredentials: ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_REGION', 'EMAIL_FROM_ADDRESS'],
        costProfile: '$0.10 per 1,000 emails | Free tier includes 62,000 emails/month when hosted on AWS'
      },
      {
        category: 'Private Document & Signature Storage',
        recommendedProvider: 'Supabase Storage (Encrypted S3-Compatible)',
        rationale: 'Private bucket with strict non-public ACLs. Candidate CNIC scans, degree certificates, police clearances, and digital signatures are accessed exclusively through time-bounded HMAC signed URLs (15-minute TTL).',
        requiredCredentials: ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_STORAGE_BUCKET'],
        costProfile: 'Included in Supabase tier (50GB storage included free, $0.021/GB thereafter)'
      },
      {
        category: 'WhatsApp Notifications',
        recommendedProvider: 'Meta WhatsApp Business Cloud API (Official)',
        rationale: 'Direct Graph API integration with Meta. Highly effective for high-priority candidate alerts (e.g. document return correction warnings and joining instructions).',
        requiredCredentials: ['WHATSAPP_ACCESS_TOKEN', 'WHATSAPP_PHONE_NUMBER_ID', 'WHATSAPP_BUSINESS_ACCOUNT_ID'],
        costProfile: 'First 1,000 service conversations/month free; utility conversations ~$0.01 - $0.02'
      }
    ]
  };
}
