"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Phone, Loader2, Check, Info } from "lucide-react";
import { useState, useEffect } from "react";
import {
  fetchAvailableNumbers,
  purchasePhoneNumber,
} from "../actions";
import { PhoneNumber, VenueData } from "../types";

interface Step4PhoneNumberProps {
  onBack: () => void;
  onPhoneNumberPurchased: (phoneNumber: string) => void;
  initialData?: VenueData | null;
}

type Step4Phase =
  | "loading"
  | "selecting"
  | "purchasing";

// Country data with flags. Only countries where Twilio allows instant
// purchase without a verified regulatory bundle are enabled in the MVP.
const COUNTRIES = [
  { value: "United States", label: "United States", flag: "🇺🇸", enabled: true },
  { value: "United Kingdom", label: "United Kingdom", flag: "🇬🇧", enabled: true },
  { value: "Hungary", label: "Hungary", flag: "🇭🇺", enabled: false },
  { value: "Germany", label: "Germany", flag: "🇩🇪", enabled: false },
  { value: "France", label: "France", flag: "🇫🇷", enabled: false },
  { value: "Spain", label: "Spain", flag: "🇪🇸", enabled: false },
  { value: "Italy", label: "Italy", flag: "🇮🇹", enabled: false },
  { value: "Netherlands", label: "Netherlands", flag: "🇳🇱", enabled: false },
  { value: "Poland", label: "Poland", flag: "🇵🇱", enabled: false },
  { value: "Austria", label: "Austria", flag: "🇦🇹", enabled: false },
  { value: "Belgium", label: "Belgium", flag: "🇧🇪", enabled: false },
];

export default function Step4PhoneNumber({ onBack, onPhoneNumberPurchased, initialData }: Step4PhoneNumberProps) {
  const initialPhase: Step4Phase = "loading";

  const [phase, setPhase] = useState<Step4Phase>(initialPhase);
  const [availableNumbers, setAvailableNumbers] = useState<PhoneNumber[]>([]);
  const [selectedNumber, setSelectedNumber] = useState<PhoneNumber | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string>(
    initialData?.country && COUNTRIES.find((c) => c.value === initialData.country)?.enabled
      ? initialData.country
      : "United States"
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fallbackPhone, setFallbackPhone] = useState<string>(initialData?.fallbackPhone || "");

  const loadAvailableNumbers = async (country?: string) => {
    setIsLoading(true);
    setError(null);
    setSelectedNumber(null); // Reset selection when changing country

    const countryToUse = country || selectedCountry;
    const result = await fetchAvailableNumbers(countryToUse);

    if (result.success && result.numbers) {
      setAvailableNumbers(result.numbers);
      setPhase("selecting");
    } else {
      setAvailableNumbers([]);
      setError(result.error || "Failed to load numbers");
      setPhase("selecting");
    }

    setIsLoading(false);
  };

  useEffect(() => {
    // Load numbers on mount
    loadAvailableNumbers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCountryChange = async (value: string) => {
    setSelectedCountry(value);
    await loadAvailableNumbers(value);
  };

  const handleNumberChange = (value: string) => {
    const selected = availableNumbers.find(n => n.number === value);
    setSelectedNumber(selected || null);
  };

  async function handleConfirmNumber() {
    if (!selectedNumber) return;

    setPhase("purchasing");
    setError(null);

    const result = await purchasePhoneNumber(selectedNumber.number, fallbackPhone);

    if (result.success) {
      // Move to Step 5 (Test Call)
      onPhoneNumberPurchased(selectedNumber.number);
    } else {
      setError(result.error || "Failed to purchase number");
      setPhase("selecting");
    }
  }

  // Loading Phase
  if (phase === "loading") {
    return (
      <div className="space-y-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Phone className="h-8 w-8 text-green-500" />
            <h1 className="text-3xl font-semibold text-gray-900">
              Choose Your Phone Number
            </h1>
          </div>
          <p className="text-gray-500 mt-1">
            Select a number for your AI receptionist
          </p>
        </div>

        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-green-500" />
          <span className="ml-3 text-gray-500">Finding available numbers...</span>
        </div>
      </div>
    );
  }

  // Purchasing Phase
  if (phase === "purchasing") {
    return (
      <div className="space-y-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Phone className="h-8 w-8 text-green-500" />
            <h1 className="text-3xl font-semibold text-gray-900">
              Setting Up Your Number
            </h1>
          </div>
          <p className="text-gray-500 mt-1">
            Please wait while we configure your phone number
          </p>
        </div>

        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-green-500" />
          <p className="text-gray-600">Setting up your phone number...</p>
          <p className="text-sm text-gray-500">This may take a few moments</p>
        </div>
      </div>
    );
  }

  // Selection Phase (default)
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Phone className="h-8 w-8 text-green-500" />
          <h1 className="text-3xl font-semibold text-gray-900">
            Choose Your Phone Number
          </h1>
        </div>
        <p className="text-gray-500 mt-1">
          Select a number for your AI receptionist
        </p>
      </div>

      {/* Country and Number Selection */}
      <div className="space-y-4">
        {/* Country Selection */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">
            Country
          </Label>
          <Select value={selectedCountry} onValueChange={handleCountryChange}>
            <SelectTrigger className="w-full h-12 rounded-xl border-gray-200">
              <SelectValue placeholder="Choose a country" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              {COUNTRIES.map((country) => (
                <SelectItem
                  key={country.value}
                  value={country.value}
                  disabled={!country.enabled}
                >
                  <span className="flex items-center gap-2">
                    <span>{country.flag}</span>
                    <span>{country.label}</span>
                    {!country.enabled && (
                      <span className="text-[10px] uppercase tracking-wider text-gray-400 ml-1">
                        Coming soon
                      </span>
                    )}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                <Info className="h-3.5 w-3.5" />
                <span className="underline decoration-dotted underline-offset-2">
                  Why are some countries unavailable?
                </span>
              </button>
            </TooltipTrigger>
            <TooltipContent
              side="bottom"
              align="start"
              className="max-w-xs bg-white text-gray-700 border border-gray-200 shadow-lg"
            >
              <p className="text-xs leading-relaxed">
                Twilio requires a verified local address to provision phone
                numbers in most non-US countries. Supporting that compliance
                flow is out of scope for the MVP, so only countries where we
                can instantly purchase numbers are shown.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Phone Number Selection */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">
            Phone Number
          </Label>

          {isLoading ? (
            <div className="w-full h-12 px-4 bg-white border border-gray-200 rounded-xl flex items-center gap-2 text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin text-green-500" />
              <span className="text-sm">Loading available numbers...</span>
            </div>
          ) : availableNumbers.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-700">
              {error || "No phone numbers available at this time. Please try a different country."}
            </div>
          ) : (
            <Select
              value={selectedNumber?.number ?? ""}
              onValueChange={handleNumberChange}
            >
              <SelectTrigger className="w-full h-12 rounded-xl border-gray-200">
                <SelectValue placeholder="Choose a phone number" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {availableNumbers.map((number) => (
                  <SelectItem key={number.number} value={number.number}>
                    <span className="flex items-center gap-2">
                      <span className="font-medium">{number.formattedNumber}</span>
                      <span className="text-xs text-gray-500">
                        ${number.monthlyPrice.toFixed(2)}/month
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {selectedNumber && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mt-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                  <Phone className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">
                    {selectedNumber.formattedNumber}
                  </p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    ${selectedNumber.monthlyPrice.toFixed(2)}/month
                  </p>
                </div>
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                  <Check className="h-3 w-3 text-white" />
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Reassurance micro-copy */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
          <div className="flex gap-2.5 text-sm text-blue-700">
            <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <p>No calls will be received until you test the number in the next step.</p>
              <p className="mt-1">You can change this number later.</p>
            </div>
          </div>
        </div>
      </div>

      {error && !isLoading && availableNumbers.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Buttons */}
      <div className="space-y-3 pt-4">
        <div className="flex gap-3">
          <Button
            type="button"
            onClick={onBack}
            disabled={isLoading}
            variant="outline"
            className="flex-1 h-12 border-gray-300 rounded-xl text-base font-medium hover:bg-gray-50"
          >
            Back
          </Button>
          <Button
            onClick={handleConfirmNumber}
            disabled={!selectedNumber || isLoading}
            className="flex-1 h-12 bg-black hover:bg-gray-900 text-white rounded-xl text-base font-medium shadow-lg shadow-green-400/10 hover:shadow-green-400/20 transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              "Continue"
            )}
          </Button>
        </div>

        {/* Expectation hint */}
        {selectedNumber && (
          <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
            <span>→</span>
            <span>Monthly cost: ${selectedNumber.monthlyPrice.toFixed(2)}/mo</span>
          </div>
        )}
      </div>
    </div>
  );
}
