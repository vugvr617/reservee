import { VapiClient } from "@vapi-ai/server-sdk";

export const vapi = new VapiClient({
  token: process.env.VAPI_PRIVATE_KEY!,
});

export interface VerifiedLanguage {
  language: string;
  model_id: string;
  accent?: string;
  locale: string;
  preview_url: string;
}

export interface VoiceOption {
  voiceId: string;
  name: string;
  gender: string;
  description: string;
  category: string;
  previewUrl: string;
  accent?: string;
  age?: string;
  verifiedLanguages: VerifiedLanguage[];
}

export function getVoiceConfig(voiceId: string) {
  return {
    provider: "11labs" as const,
    voiceId,
  };
}

export function generateGreeting(venueName: string): string {
  return `Hello! Thank you for calling ${venueName}. How can I help you today?`;
}

// Map language codes to flag emojis
export function getLanguageFlag(locale: string | null | undefined): string {
  if (!locale) return '';

  const countryCode = locale.split('-')[1]?.toUpperCase() || locale.toUpperCase();
  const flagMap: Record<string, string> = {
    'US': '🇺🇸',
    'GB': '🇬🇧',
    'EN': '🇬🇧',
    'ES': '🇪🇸',
    'FR': '🇫🇷',
    'DE': '🇩🇪',
    'IT': '🇮🇹',
    'PT': '🇵🇹',
    'BR': '🇧🇷',
    'NL': '🇳🇱',
    'PL': '🇵🇱',
    'RU': '🇷🇺',
    'ZH': '🇨🇳',
    'JA': '🇯🇵',
    'KO': '🇰🇷',
    'AR': '🇸🇦',
    'HI': '🇮🇳',
    'TR': '🇹🇷',
    'SV': '🇸🇪',
    'FI': '🇫🇮',
    'DA': '🇩🇰',
    'NO': '🇳🇴',
    'CS': '🇨🇿',
    'UK': '🇺🇦',
    'ID': '🇮🇩',
    'MS': '🇲🇾',
    'TH': '🇹🇭',
    'VI': '🇻🇳',
    'HU': '🇭🇺',
  };
  return flagMap[countryCode] || '';
}
