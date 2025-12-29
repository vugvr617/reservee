export interface Step1FormData {
  managerName: string;
  managerEmail: string;
  managerPhone: string;
  venueName: string;
  address: string;
  city: string;
  country: string;
}

export interface TimeSlot {
  day: string;
  open: string;
  close: string;
  closed: boolean;
}

export interface Step2FormData {
  fallbackPhone: string;
  schedule: TimeSlot[];
}

export interface Step3FormData {
  voiceId: string;
  voiceName: string;
  customGreeting?: string;
}

export interface AIConfig {
  ai_voice_provider: 'elevenlabs';
  ai_voice_id: string;
  ai_custom_greeting: string | null;
}

export interface PhoneNumber {
  number: string;
  formattedNumber: string;
  friendlyName: string;
  locality?: string; // City name
  region?: string; // Region/state
  isoCountry: string; // Country code (e.g., "DE")
  monthlyPrice: number; // Monthly cost in USD
  capabilities: {
    voice: boolean;
    sms: boolean;
  };
}

export interface Step4FormData {
  phoneNumber: string;
  fallbackPhone: string;
}

// New interface for phone_numbers table
export interface PhoneNumberData {
  id: string;
  venueId: string;
  phoneNumber: string;
  phoneCountry: string;
  fallbackPhoneNumber: string | null;
  phoneProvider: 'twilio';
  phoneProviderSid: string;
  monthlyCost: number | null;
  vapiPhoneId: string;
  vapiAssistantId: string;
  phoneStatus: 'provisioning' | 'active' | 'inactive' | 'suspended';
  isPrimary: boolean;
  purchasedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface VenueData {
  id: string;
  userId: string;
  managerName: string | null;
  managerEmail: string | null;
  managerPhone: string | null;
  venueName: string | null;
  fallbackPhone: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  schedule: TimeSlot[] | null;

  // AI Configuration
  aiConfig: AIConfig | null;
  vapiAgentId: string | null;
  aiStatus: 'draft' | 'ready' | 'failed';

  onboardingStatus: "in-progress" | "completed";
  onboardingStep: number;
}
