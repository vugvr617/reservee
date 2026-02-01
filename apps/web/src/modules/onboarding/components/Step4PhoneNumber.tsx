"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectItem } from "@heroui/react";
import { Phone, Loader2, Check } from "lucide-react";
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

// Country data with flags
const COUNTRIES = [
  { value: "Germany", label: "Germany", flag: "🇩🇪" },
  { value: "United States", label: "United States", flag: "🇺🇸" },
  { value: "United Kingdom", label: "United Kingdom", flag: "🇬🇧" },
  { value: "France", label: "France", flag: "🇫🇷" },
  { value: "Spain", label: "Spain", flag: "🇪🇸" },
  { value: "Italy", label: "Italy", flag: "🇮🇹" },
  { value: "Netherlands", label: "Netherlands", flag: "🇳🇱" },
  { value: "Poland", label: "Poland", flag: "🇵🇱" },
  { value: "Austria", label: "Austria", flag: "🇦🇹" },
  { value: "Belgium", label: "Belgium", flag: "🇧🇪" },
  { value: "Hungary", label: "Hungary", flag: "🇭🇺" },
];

export default function Step4PhoneNumber({ onBack, onPhoneNumberPurchased, initialData }: Step4PhoneNumberProps) {
  const initialPhase: Step4Phase = "loading";

  const [phase, setPhase] = useState<Step4Phase>(initialPhase);
  const [availableNumbers, setAvailableNumbers] = useState<PhoneNumber[]>([]);
  const [selectedNumber, setSelectedNumber] = useState<PhoneNumber | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string>(initialData?.country || "Germany");
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
          <Select
            label="Select country"
            placeholder="Choose a country"
            selectedKeys={[selectedCountry]}
            onSelectionChange={(keys) => {
              const value = Array.from(keys)[0] as string;
              if (value) handleCountryChange(value);
            }}
            className="max-w-full"
          >
            {COUNTRIES.map((country) => (
              <SelectItem key={country.value}>
              {country.label}
              </SelectItem>
            ))}
          </Select>
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
              label="Select phone number"
              placeholder="Choose a phone number"
              selectedKeys={selectedNumber ? new Set([selectedNumber.number]) : new Set()}
              onSelectionChange={(keys) => {
                const value = Array.from(keys)[0] as string;
                if (value) handleNumberChange(value);
              }}
              classNames={{
                trigger: "h-12 rounded-xl border-gray-200",
                value: "text-gray-900",
              }}
            >
              {availableNumbers.map((number) => (
                <SelectItem
                  key={number.number}
                  description={`$${number.monthlyPrice.toFixed(2)}/month`}
                >
                  {number.formattedNumber}
                </SelectItem>
              ))}
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

        {/* Fallback Phone Number */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">
            Fallback Phone Number (Optional)
          </Label>
          <Input
            type="tel"
            placeholder="Your personal number (e.g., +1234567890)"
            value={fallbackPhone}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFallbackPhone(e.target.value)}
            className="h-12 rounded-xl border-gray-200"
          />
          <p className="text-xs text-gray-500">
            If the AI cannot handle a call, it will be forwarded to this number
          </p>
        </div>

        {/* Reassurance micro-copy */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
          <div className="flex gap-2 text-sm text-blue-700">
            <span className="text-blue-500 shrink-0">ℹ️</span>
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
