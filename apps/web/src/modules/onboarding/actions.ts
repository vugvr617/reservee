"use server";

import { supabase } from "@/lib/supabase";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Step1FormData, Step2FormData, Step3FormData, VenueData } from "./types";
import { VoiceOption } from "@/lib/vapi";
import { createVapiAssistant } from "@/lib/domain/vapi/service";
import { normalizeVenue } from "@/lib/domain/venue/normalize";

async function getSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session;
}

export async function getVenue(): Promise<VenueData | null> {
  const session = await getSession();
  if (!session?.user?.id) return null;

  const { data: ownVenue } = await supabase
    .from("venue")
    .select("*")
    .eq("userId", session.user.id)
    .maybeSingle();

  if (ownVenue) return normalizeVenue(ownVenue);

  const { data: userRow } = await supabase
    .from("user")
    .select("staff_venue_id")
    .eq("id", session.user.id)
    .maybeSingle();

  if (!userRow?.staff_venue_id) return null;

  const { data: staffVenue, error } = await supabase
    .from("venue")
    .select("*")
    .eq("id", userRow.staff_venue_id)
    .single();

  if (error || !staffVenue) return null;
  return normalizeVenue(staffVenue);
}

export async function saveStep1(formData: Step1FormData): Promise<{ success: boolean; error?: string }> {
  const session = await getSession();
  if (!session?.user?.id) {
    return { success: false, error: "Not authenticated" };
  }

  const existing = await supabase
    .from("venue")
    .select("id")
    .eq("userId", session.user.id)
    .single();

  if (existing.data) {
    const { error } = await supabase
      .from("venue")
      .update({
        ...formData,
        onboardingStep: 2,
        updatedAt: new Date().toISOString(),
      })
      .eq("userId", session.user.id);

    if (error) return { success: false, error: error.message };
  } else {
    const { error } = await supabase.from("venue").insert({
      userId: session.user.id,
      ...formData,
      onboardingStep: 2,
      onboardingStatus: "in-progress",
    });

    if (error) return { success: false, error: error.message };
  }

  return { success: true };
}

export async function saveStep2(formData: Step2FormData): Promise<{ success: boolean; error?: string }> {
  const session = await getSession();
  if (!session?.user?.id) {
    return { success: false, error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("venue")
    .update({
      fallbackPhone: formData.fallbackPhone,
      schedule: formData.schedule,
      onboardingStep: 3,
      updatedAt: new Date().toISOString(),
    })
    .eq("userId", session.user.id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

interface ElevenLabsVoiceDetail {
  voice_id: string;
  name: string;
  labels?: {
    gender?: string;
    accent?: string;
    age?: string;
    description?: string;
    use_case?: string;
  };
  description?: string;
  category?: string;
  preview_url?: string;
  verified_languages?: Array<{
    language: string;
    model_id: string;
    accent?: string;
    locale: string;
    preview_url: string;
  }>;
}

// Curated voice IDs for AI receptionist
const CURATED_VOICE_IDS = [
  "kPzsL2i3teMYv0FxEYQ6",
  "15CVCzDByBinCIoCblXo",
  "q0IMILNRPxOgtBTS4taI",
  "xjlfQQ3ynqiEyRpArrT8",
  "M336tBVZHWWiWb4R54ui",
  "uQPOhlzA94sogqmhGLCI",
];

export async function fetchElevenLabsVoices(): Promise<VoiceOption[]> {
  try {
    const voicePromises = CURATED_VOICE_IDS.map(async (voiceId) => {
      const response = await fetch(
        `https://api.elevenlabs.io/v1/voices/${voiceId}`,
        {
          headers: {
            "xi-api-key": process.env.ELEVENLABS_API_KEY || "",
          },
        }
      );

      if (!response.ok) {
        console.error(`Failed to fetch voice ${voiceId}`);
        return null;
      }

      return response.json() as Promise<ElevenLabsVoiceDetail>;
    });

    const voiceResults = await Promise.all(voicePromises);
    const voices = voiceResults.filter((v): v is ElevenLabsVoiceDetail => v !== null);

    return voices.map((voice) => ({
      voiceId: voice.voice_id,
      name: voice.name,
      gender: voice.labels?.gender || "neutral",
      description: voice.description || voice.labels?.description || "Professional voice",
      category: voice.category || "conversational",
      previewUrl: voice.preview_url || "",
      accent: voice.labels?.accent,
      age: voice.labels?.age,
      verifiedLanguages: voice.verified_languages || [],
    }));
  } catch (error) {
    console.error("Error fetching ElevenLabs voices:", error);
    // Return fallback voices if API fails
    return [
      {
        voiceId: "xjlfQQ3ynqiEyRpArrT8",
        name: "Vera",
        gender: "female",
        description: "Professional and articulate voice",
        category: "professional",
        previewUrl: "",
        verifiedLanguages: [],
      },
      {
        voiceId: "q0IMILNRPxOgtBTS4taI",
        name: "Drew",
        gender: "male",
        description: "Warm and friendly voice",
        category: "conversational",
        previewUrl: "",
        verifiedLanguages: [],
      },
    ];
  }
}

export async function saveStep3(formData: Step3FormData): Promise<{ success: boolean; error?: string }> {
  const session = await getSession();
  if (!session?.user?.id) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    // Get venue data
    const venue = await getVenue();
    if (!venue) {
      return { success: false, error: "Venue not found" };
    }

    // Build AI config object
    const aiConfig = {
      ai_voice_provider: 'elevenlabs' as const,
      ai_voice_id: formData.voiceId,
      ai_custom_greeting: formData.customGreeting || null,
    };

    // ONLY save AI config - NO assistant creation yet!
    const { error } = await supabase
      .from("venue")
      .update({
        ai_config: aiConfig,
        ai_status: 'draft', // Draft: config saved but assistant not created yet
        onboardingStep: 4,
        updatedAt: new Date().toISOString(),
      })
      .eq("userId", session.user.id);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (error) {
    console.error("AI config save error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save AI configuration",
    };
  }
}

// Helper function to convert country name to ISO code
function getCountryCode(countryName: string | null): string {
  if (!countryName) return "DE"; // Default to Germany

  const countryMap: Record<string, string> = {
    "Hungary": "HU",
    "Germany": "DE",
    "United States": "US",
    "United Kingdom": "GB",
    "France": "FR",
    "Spain": "ES",
    "Italy": "IT",
    "Netherlands": "NL",
    "Poland": "PL",
    "Austria": "AT",
    "Belgium": "BE",
    "Czech Republic": "CZ",
    "Denmark": "DK",
    "Finland": "FI",
    "Greece": "GR",
    "Ireland": "IE",
    "Portugal": "PT",
    "Sweden": "SE",
    "Switzerland": "CH",
    "Norway": "NO",
  };

  // If already an ISO code (2 letters), return as is
  if (countryName.length === 2) {
    return countryName.toUpperCase();
  }

  // Otherwise, look up the country name
  return countryMap[countryName] || "DE";
}

// Helper function to format phone numbers
function formatPhoneNumber(number: string): string {
  // Remove all non-digit characters
  const cleaned = number.replace(/\D/g, "");

  // International format
  if (cleaned.length > 10) {
    const countryCode = cleaned.substring(0, cleaned.length - 10);
    const areaCode = cleaned.substring(cleaned.length - 10, cleaned.length - 7);
    const firstPart = cleaned.substring(cleaned.length - 7, cleaned.length - 4);
    const secondPart = cleaned.substring(cleaned.length - 4);
    return `+${countryCode} (${areaCode}) ${firstPart}-${secondPart}`;
  }

  // US format
  if (cleaned.length === 10) {
    return `(${cleaned.substring(0, 3)}) ${cleaned.substring(3, 6)}-${cleaned.substring(6)}`;
  }

  return number;
}

export async function fetchAvailableNumbers(
  countryInput: string = "DE"
): Promise<{ success: boolean; numbers?: import("./types").PhoneNumber[]; error?: string }> {
  try {
    // Convert country name to ISO code if needed
    const countryCode = getCountryCode(countryInput);

    // Initialize Twilio client
    const twilio = require("twilio")(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    console.log("🔍 Fetching pricing for country:", countryCode, "(from input:", countryInput, ")");

    // Step 1: Fetch pricing info for the country
    const pricingClient = twilio.pricing.v1.phoneNumbers;
    const countryPricing = await pricingClient.countries(countryCode).fetch();

    console.log("💰 Country pricing data:", JSON.stringify(countryPricing, null, 2));

    // Declare monthlyPrice outside the if/else block
    let monthlyPrice = 1.15; // Default price

    // Check if phoneNumberPrices exists
    if (!countryPricing.phoneNumberPrices || countryPricing.phoneNumberPrices.length === 0) {
      console.log("⚠️ No pricing data available for country:", countryCode);
      console.log("💵 Using default monthly price:", monthlyPrice);
    } else {
      // Find local number pricing
      const localPricing = countryPricing.phoneNumberPrices.find(
        (price: any) => price.number_type === "local"
      );

      console.log("📊 Local pricing found:", localPricing);

      monthlyPrice = localPricing ? parseFloat(localPricing.current_price) : 1.15;

      console.log("💵 Monthly price:", monthlyPrice);

      // Skip if monthly price exceeds $2
      if (monthlyPrice > 2.0) {
        return {
          success: false,
          error: `Local numbers in ${countryCode} cost $${monthlyPrice.toFixed(2)}/month (max $2.00)`,
        };
      }
    }

    console.log("📞 Fetching available numbers...");

    // Step 2: Search for available phone numbers in the specified country
    let availableNumbers;
    try {
      availableNumbers = await twilio
        .availablePhoneNumbers(countryCode)
        .local.list({
          voiceEnabled: true,
          limit: 10, // Get 10 numbers within budget
          excludeAllAddressRequired: true, // Only show numbers that don't require address validation
        });

      console.log(`✅ Found ${availableNumbers.length} available numbers for ${countryCode}`);
    } catch (searchError: any) {
      console.error("❌ Error searching for numbers:", searchError);

      // If the country doesn't support local numbers, return error
      if (searchError.status === 404 || searchError.code === 20404) {
        return {
          success: false,
          error: `Phone numbers are not available for ${countryInput}. Please select a different country.`,
        };
      } else {
        throw searchError;
      }
    }

    if (!availableNumbers || availableNumbers.length === 0) {
      return {
        success: false,
        error: `No phone numbers available for country: ${countryCode}. Please try a different country or contact support.`,
      };
    }

    // Step 3: Map numbers with pricing info
    const numbers: import("./types").PhoneNumber[] = availableNumbers.map((num: any) => ({
      number: num.phoneNumber,
      formattedNumber: num.friendlyName || formatPhoneNumber(num.phoneNumber),
      friendlyName: num.friendlyName,
      locality: num.locality,
      region: num.region,
      isoCountry: num.isoCountry,
      monthlyPrice: monthlyPrice,
      capabilities: num.capabilities,
    }));

    console.log("📋 Mapped numbers with pricing:", numbers[0]);

    return { success: true, numbers };
  } catch (error) {
    console.error("❌ Error fetching Twilio numbers:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch phone numbers from Twilio",
    };
  }
}

// Helper function to extract country code from phone number
function extractCountryCode(phoneNumber: string): string {
  const cleaned = phoneNumber.replace(/[^\d]/g, '');

  if (cleaned.startsWith('1')) return 'US';
  if (cleaned.startsWith('49')) return 'DE';
  if (cleaned.startsWith('44')) return 'GB';
  if (cleaned.startsWith('33')) return 'FR';
  if (cleaned.startsWith('34')) return 'ES';
  if (cleaned.startsWith('39')) return 'IT';
  if (cleaned.startsWith('31')) return 'NL';
  if (cleaned.startsWith('48')) return 'PL';
  if (cleaned.startsWith('43')) return 'AT';
  if (cleaned.startsWith('32')) return 'BE';
  if (cleaned.startsWith('36')) return 'HU';

  return 'DE'; // Default
}

export async function purchasePhoneNumber(
  phoneNumber: string,
  fallbackPhone: string
): Promise<{ success: boolean; error?: string }> {
  const session = await getSession();
  if (!session?.user?.id) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    const venue = await getVenue();
    if (!venue) {
      return { success: false, error: "Venue not found" };
    }

    const aiConfig = venue.aiConfig;

    if (!aiConfig?.ai_voice_id) {
      console.error("AI config missing:", { aiConfig, venue });
      return { success: false, error: "AI configuration not set" };
    }

    // STEP 1: Check for existing phone number — reuse it across retries so we
    // don't burn Twilio money on every Step 4 re-submit.
    const { data: existingPhone } = await supabase
      .from("phone_numbers")
      .select("*")
      .eq("venue_id", venue.id)
      .eq("is_primary", true)
      .maybeSingle();

    let twilioNumber: string;
    let twilioSid: string;
    let vapiPhoneId: string | null = existingPhone?.vapi_phone_id ?? null;

    if (existingPhone) {
      console.log("♻️ Reusing existing Twilio number:", existingPhone.phone_number);
      twilioNumber = existingPhone.phone_number;
      twilioSid = existingPhone.phone_provider_sid;
    } else {
      const twilio = require("twilio")(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );

      const purchasedNumber = await twilio.incomingPhoneNumbers.create({
        phoneNumber: phoneNumber,
        voiceUrl: "",
        voiceMethod: "POST",
        addressRequirements: "none",
      });

      console.log("✅ Purchased Twilio number:", purchasedNumber.sid, purchasedNumber.phoneNumber);
      twilioNumber = phoneNumber;
      twilioSid = purchasedNumber.sid;
    }

    const phoneCountry = extractCountryCode(twilioNumber);

    // STEP 2: Delete the previous Vapi assistant (if any) so we don't leave orphans
    if (venue.vapiAgentId) {
      console.log("🗑️ Deleting previous Vapi assistant:", venue.vapiAgentId);
      const deleteRes = await fetch(`https://api.vapi.ai/assistant/${venue.vapiAgentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${process.env.VAPI_PRIVATE_KEY}` },
      });
      if (!deleteRes.ok && deleteRes.status !== 404) {
        console.warn("⚠️ Failed to delete old Vapi assistant:", await deleteRes.text());
      }
    }

    // STEP 3: Create a fresh Vapi assistant
    const assistant = await createVapiAssistant(venue, aiConfig, fallbackPhone);
    console.log("Created Vapi assistant:", assistant.id);

    // STEP 4: Bind the phone number to the new assistant
    if (vapiPhoneId) {
      console.log("🔗 Updating existing Vapi phone-number binding:", vapiPhoneId);
      const patchRes = await fetch(`https://api.vapi.ai/phone-number/${vapiPhoneId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${process.env.VAPI_PRIVATE_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ assistantId: assistant.id }),
      });
      if (!patchRes.ok) {
        throw new Error(`Vapi phone-number patch failed: ${await patchRes.text()}`);
      }
    } else {
      console.log("📞 Importing to Vapi with phone number:", twilioNumber);
      const vapiResponse = await fetch("https://api.vapi.ai/phone-number/import/twilio", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.VAPI_PRIVATE_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          twilioPhoneNumber: twilioNumber,
          twilioAccountSid: process.env.TWILIO_ACCOUNT_SID!,
          twilioAuthToken: process.env.TWILIO_AUTH_TOKEN!,
          assistantId: assistant.id,
        }),
      });

      if (!vapiResponse.ok) {
        throw new Error(`Vapi import failed: ${await vapiResponse.text()}`);
      }

      const vapiImport = await vapiResponse.json();
      vapiPhoneId = vapiImport.id;
      console.log("✅ Imported to Vapi:", vapiPhoneId);
    }

    // STEP 5: Upsert phone_numbers row
    if (existingPhone) {
      const { error: phoneError } = await supabase
        .from("phone_numbers")
        .update({
          fallback_phone_number: fallbackPhone || null,
          vapi_assistant_id: assistant.id,
          phone_status: 'active',
        })
        .eq("id", existingPhone.id);

      if (phoneError) {
        console.error("Failed to update phone number row:", phoneError);
        return { success: false, error: phoneError.message };
      }
    } else {
      const { error: phoneError } = await supabase
        .from("phone_numbers")
        .insert({
          venue_id: venue.id,
          phone_number: twilioNumber,
          phone_country: phoneCountry,
          fallback_phone_number: fallbackPhone || null,
          phone_provider: 'twilio',
          phone_provider_sid: twilioSid,
          monthly_cost: null,
          vapi_phone_id: vapiPhoneId,
          vapi_assistant_id: assistant.id,
          phone_status: 'active',
          is_primary: true,
          purchased_at: new Date().toISOString(),
        });

      if (phoneError) {
        console.error("Failed to save phone number:", phoneError);
        return { success: false, error: phoneError.message };
      }
    }

    // STEP 6: Update venue with vapi_agent_id, ai_status, and move to Step 5
    const { error: venueError } = await supabase
      .from("venue")
      .update({
        vapi_agent_id: assistant.id,
        ai_status: 'ready',
        onboardingStep: 5,
        updatedAt: new Date().toISOString(),
      })
      .eq("userId", session.user.id);

    if (venueError) {
      console.error("Failed to update venue:", venueError);
      return { success: false, error: venueError.message };
    }

    console.log("✅ Saved to database");

    return { success: true };
  } catch (error) {
    console.error("Phone number purchase error:", error);

    // Mark AI status as failed if assistant creation failed
    const session = await getSession();
    if (session?.user?.id) {
      await supabase
        .from("venue")
        .update({
          ai_status: 'failed', // Failed: assistant creation encountered an error
          updatedAt: new Date().toISOString(),
        })
        .eq("userId", session.user.id);
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to purchase phone number",
    };
  }
}

export async function getPrimaryPhoneNumber(): Promise<string | null> {
  const session = await getSession();
  if (!session?.user?.id) return null;

  const venue = await getVenue();
  if (!venue) return null;

  const { data, error } = await supabase
    .from("phone_numbers")
    .select("phone_number")
    .eq("venue_id", venue.id)
    .eq("is_primary", true)
    .single();

  if (error || !data) return null;
  return data.phone_number;
}

export async function completeOnboarding(): Promise<{ success: boolean; error?: string }> {
  const session = await getSession();
  if (!session?.user?.id) {
    return { success: false, error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("venue")
    .update({
      onboardingStatus: "completed",
      updatedAt: new Date().toISOString(),
    })
    .eq("userId", session.user.id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}
