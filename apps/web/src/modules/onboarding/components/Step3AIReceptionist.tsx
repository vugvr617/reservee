"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bot, Loader2, Volume2 } from "lucide-react";
import { useState, useEffect } from "react";
import { saveStep3, fetchElevenLabsVoices } from "../actions";
import { VenueData } from "../types";
import { VoiceOption, getLanguageFlag } from "@/lib/vapi";
import VoicePreview from "./VoicePreview";

interface Step3AIReceptionistProps {
  onNext: () => void;
  onBack: () => void;
  initialData?: VenueData | null;
}

export default function Step3AIReceptionist({
  onNext,
  onBack,
  initialData,
}: Step3AIReceptionistProps) {
  const [selectedVoice, setSelectedVoice] = useState<VoiceOption | null>(null);
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [isLoadingVoices, setIsLoadingVoices] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load voices from ElevenLabs API
    const loadVoices = async () => {
      setIsLoadingVoices(true);
      try {
        const fetchedVoices = await fetchElevenLabsVoices();
        console.log('Fetched voices:', fetchedVoices);

        // Log the specific voice you're asking about
        const targetVoice = fetchedVoices.find(v => v.voiceId === 'M336tBVZHWWiWb4R54ui');
        if (targetVoice) {
          console.log('M336tBVZHWWiWb4R54ui voice data:', {
            name: targetVoice.name,
            verifiedLanguages: targetVoice.verifiedLanguages,
            languageCount: targetVoice.verifiedLanguages.length
          });
        }

        setVoices(fetchedVoices);

        // Pre-select voice if already saved
        if (initialData?.aiConfig?.ai_voice_id) {
          const savedVoice = fetchedVoices.find(
            (v) => v.voiceId === initialData.aiConfig!.ai_voice_id
          );
          if (savedVoice) {
            setSelectedVoice(savedVoice);
          }
        } else if (fetchedVoices.length > 0) {
          // Set first voice as default
          setSelectedVoice(fetchedVoices[0]);
        }
      } catch (err) {
        console.error("Failed to load voices:", err);
        setError("Failed to load voices. Please try again.");
      } finally {
        setIsLoadingVoices(false);
      }
    };

    loadVoices();
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedVoice) {
      setError("Please select a voice");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const result = await saveStep3({
      voiceId: selectedVoice.voiceId,
      voiceName: selectedVoice.name,
    });

    if (result.success) {
      // Move to next step
      onNext();
    } else {
      setError(result.error || "Something went wrong");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Bot className="h-8 w-8 text-green-500" />
          <h1 className="text-3xl font-semibold text-gray-900">
            AI Receptionist Setup
          </h1>
        </div>
        <p className="text-gray-500 mt-1">
          Choose a voice for your AI receptionist
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Voice Selection */}
        <div className="space-y-4">
          <Label className="text-base font-semibold text-gray-900">
            Select Voice
          </Label>

          {isLoadingVoices ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-green-500" />
              <span className="ml-3 text-gray-500">Loading voices...</span>
            </div>
          ) : voices.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-700">
              No voices available. Please check your API configuration.
            </div>
          ) : (
            <Select
              value={selectedVoice?.voiceId}
              onValueChange={(voiceId: string) => {
                const voice = voices.find((v) => v.voiceId === voiceId);
                if (voice) setSelectedVoice(voice);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a voice..." />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {voices.map((voice) => {
                  const MAX_FLAGS = 20;
                  const allLanguageFlags = voice.verifiedLanguages
                    .map((lang) => getLanguageFlag(lang.locale))
                    .filter((flag) => flag !== '');

                  const languageFlags = allLanguageFlags.slice(0, MAX_FLAGS);
                  const remainingCount = allLanguageFlags.length - MAX_FLAGS;

                  const flags = languageFlags.length > 0 ? languageFlags : ['🇺🇸'];

                  return (
                    <SelectItem key={voice.voiceId} value={voice.voiceId}>
                      <div className="flex items-center gap-2">
                        <span>{voice.gender === "female" ? "👩" : "👨"}</span>
                        <span className="font-medium">{voice.name}</span>
                        <span className="text-xs text-gray-400 ml-1">
                          {flags.join(" ")}
                          {remainingCount > 0 && ` +${remainingCount}`}
                        </span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* AI Receptionist Summary */}
        {selectedVoice && (
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600 mb-1">
                Selected voice: <span className="font-medium text-gray-900">{selectedVoice.name}</span>
              </p>
              <p className="text-xs text-gray-500">
                {selectedVoice.description}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-full border border-gray-200">
                <span className="text-lg">📞</span>
                <span className="text-xs font-medium text-gray-700">Answers calls 24/7</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-full border border-gray-200">
                <span className="text-lg">📅</span>
                <span className="text-xs font-medium text-gray-700">Takes reservations</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-full border border-gray-200">
                <span className="text-lg">💬</span>
                <span className="text-xs font-medium text-gray-700">Natural conversations</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-full border border-gray-200">
                <span className="text-lg">🌍</span>
                <span className="text-xs font-medium text-gray-700">Multi-language support</span>
              </div>
            </div>
          </div>
        )}

        {error && (
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
              disabled={isSubmitting}
              variant="outline"
              className="flex-1 h-12 border-gray-300 rounded-xl text-base font-medium hover:bg-gray-50"
            >
              Back
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !selectedVoice}
              className="flex-1 h-12 bg-black hover:bg-gray-900 text-white rounded-xl text-base font-medium shadow-lg shadow-green-400/10 hover:shadow-green-400/20 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                "Continue"
              )}
            </Button>
          </div>

          {/* Expectation hint */}
          <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
            <span>→</span>
            <span>Next: Connect your phone number</span>
          </div>
        </div>
      </form>
    </div>
  );
}
