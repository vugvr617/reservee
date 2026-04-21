"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Bot, Loader2, MessageSquare, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { updateAIConfig, retryAISync } from "@/modules/dashboard/settings-actions";
import { fetchElevenLabsVoices } from "@/modules/onboarding/actions";
import type { VenueData } from "@/modules/onboarding/types";
import { VoiceOption, getLanguageFlag } from "@/lib/vapi";
import VoicePreview from "@/modules/onboarding/components/VoicePreview";
import { useUnsavedChangesGuard } from "@/modules/dashboard/hooks/use-unsaved-changes-guard";

interface AIAgentSectionProps {
  venue: VenueData;
  onUpdated: () => void;
}

const GREETING_MAX = 300;

export function AIAgentSection({ venue, onUpdated }: AIAgentSectionProps) {
  const aiConfig = venue.aiConfig;
  const aiStatus = venue.aiStatus;
  const initialVoiceId = aiConfig?.ai_voice_id || "";
  const initialGreeting = aiConfig?.ai_custom_greeting || "";

  const [selectedVoiceId, setSelectedVoiceId] = useState<string>(initialVoiceId);
  const [customGreeting, setCustomGreeting] = useState<string>(initialGreeting);
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [isLoadingVoices, setIsLoadingVoices] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  const isDirty =
    selectedVoiceId !== initialVoiceId || customGreeting !== initialGreeting;
  useUnsavedChangesGuard(isDirty);

  useEffect(() => {
    const loadVoices = async () => {
      setIsLoadingVoices(true);
      try {
        const fetchedVoices = await fetchElevenLabsVoices();
        setVoices(fetchedVoices);
      } catch {
        toast.error("Failed to load voices");
      } finally {
        setIsLoadingVoices(false);
      }
    };

    loadVoices();
  }, []);

  const selectedVoice = voices.find((v) => v.voiceId === selectedVoiceId);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedVoiceId) {
      toast.error("Please select a voice");
      return;
    }

    setIsSaving(true);

    const result = await updateAIConfig({
      voiceId: selectedVoiceId,
      customGreeting: customGreeting || null,
    });

    if (result.success) {
      toast.success("AI agent settings updated successfully");
      onUpdated();
    } else {
      toast.error(result.error || "Failed to update AI settings");
    }

    setIsSaving(false);
  };

  const handleRetrySync = async () => {
    setIsRetrying(true);
    const result = await retryAISync();
    if (result.success) {
      toast.success("AI receptionist synchronized");
      onUpdated();
    } else {
      toast.error(result.error || "Sync failed. Please try again.");
    }
    setIsRetrying(false);
  };

  const lastSynced = venue.updatedAt
    ? new Date(venue.updatedAt).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : null;

  const statusMeta =
    aiStatus === "ready"
      ? {
          label: "Active",
          dot: "bg-green-500",
          text: "text-green-700",
          bg: "bg-green-50",
          border: "border-green-200",
        }
      : aiStatus === "failed"
        ? {
            label: "Failed",
            dot: "bg-red-500",
            text: "text-red-700",
            bg: "bg-red-50",
            border: "border-red-200",
          }
        : {
            label: "Draft",
            dot: "bg-gray-400",
            text: "text-gray-700",
            bg: "bg-gray-50",
            border: "border-gray-200",
          };

  const greetingChars = customGreeting.length;
  const greetingOver = greetingChars > GREETING_MAX;

  return (
    <form onSubmit={handleSave} className="space-y-5">
      {/* Status strip */}
      <div
        className={`flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl border ${statusMeta.bg} ${statusMeta.border}`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            {aiStatus === "ready" && (
              <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping" />
            )}
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${statusMeta.dot}`} />
          </span>
          <div className="min-w-0">
            <div className={`text-sm font-medium ${statusMeta.text}`}>
              AI Receptionist &middot; {statusMeta.label}
            </div>
            {aiStatus === "failed" && (
              <div className="text-xs text-red-600/80 mt-0.5">
                The assistant failed to sync with our voice provider. Click retry to try again.
              </div>
            )}
          </div>
        </div>

        {aiStatus === "failed" ? (
          <Button
            type="button"
            size="sm"
            onClick={handleRetrySync}
            disabled={isRetrying}
            className="bg-red-500 hover:bg-red-600 text-white gap-1.5 shrink-0"
          >
            {isRetrying ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            Retry Sync
          </Button>
        ) : (
          lastSynced && (
            <span className="text-xs text-gray-500 shrink-0 hidden sm:inline">
              Last synced {lastSynced}
            </span>
          )
        )}
      </div>

      {/* Voice card */}
      <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <header className="flex items-start gap-3 px-6 pt-6 pb-4 border-b border-gray-100 bg-gradient-to-b from-gray-50/50 to-transparent">
          <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
            <Bot className="h-4 w-4 text-green-600" />
          </div>
          <div className="min-w-0">
            <h3 className="text-[15px] font-semibold text-gray-900 leading-snug">
              Voice
            </h3>
            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
              Pick the voice your callers hear. Preview before saving.
            </p>
          </div>
        </header>

        <div className="px-6 py-5 space-y-4">
          {isLoadingVoices ? (
            <div className="flex items-center gap-3 py-6 justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-green-500" />
              <span className="text-sm text-gray-500">Loading voices...</span>
            </div>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-600">
                  Select a voice
                </Label>
                <Select
                  value={selectedVoiceId}
                  onValueChange={(voiceId: string) => setSelectedVoiceId(voiceId)}
                >
                  <SelectTrigger className="w-full h-11 bg-white border-gray-200">
                    <SelectValue placeholder="Select a voice..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {voices.map((voice) => {
                      const MAX_FLAGS = 20;
                      const allLanguageFlags = voice.verifiedLanguages
                        .map((lang) => getLanguageFlag(lang.locale))
                        .filter((flag) => flag !== "");

                      const languageFlags = allLanguageFlags.slice(0, MAX_FLAGS);
                      const remainingCount = allLanguageFlags.length - MAX_FLAGS;
                      const flags = languageFlags.length > 0 ? languageFlags : ["🇺🇸"];

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
              </div>

              {selectedVoice && (
                <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-gray-200 bg-gradient-to-br from-green-50/40 to-white">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 shrink-0 rounded-full bg-white border border-gray-200 flex items-center justify-center text-lg">
                      {selectedVoice.gender === "female" ? "👩" : "👨"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {selectedVoice.name}
                      </p>
                      <p className="text-xs text-gray-500 line-clamp-2 leading-snug">
                        {selectedVoice.description}
                      </p>
                    </div>
                  </div>
                  <VoicePreview voice={selectedVoice} />
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Greeting card */}
      <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <header className="flex items-start gap-3 px-6 pt-6 pb-4 border-b border-gray-100 bg-gradient-to-b from-gray-50/50 to-transparent">
          <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
            <MessageSquare className="h-4 w-4 text-green-600" />
          </div>
          <div className="min-w-0">
            <h3 className="text-[15px] font-semibold text-gray-900 leading-snug">
              Custom Greeting
            </h3>
            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
              The first line your AI says when picking up. Leave empty for the default.
            </p>
          </div>
        </header>

        <div className="px-6 py-5 space-y-2">
          <Textarea
            id="customGreeting"
            placeholder="Hello! Welcome to our restaurant. How can I help you today?"
            value={customGreeting}
            onChange={(e) => setCustomGreeting(e.target.value)}
            className="min-h-[96px] bg-white border-gray-200 rounded-lg focus:border-green-400 focus:ring-green-400/20 resize-none"
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400">
              Try to keep it short and warm.
            </p>
            <span
              className={`text-xs tabular-nums ${
                greetingOver ? "text-red-500 font-medium" : "text-gray-400"
              }`}
            >
              {greetingChars} / {GREETING_MAX}
            </span>
          </div>
        </div>
      </section>

      {/* Save bar */}
      <div className="sticky bottom-0 z-10 -mx-2 px-2">
        <div
          className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border ${
            isDirty
              ? "bg-white border-green-200 shadow-lg"
              : "bg-white/80 border-gray-200 shadow-sm"
          } backdrop-blur-sm transition-all`}
        >
          <p className="text-sm text-gray-500">
            {isDirty ? (
              <span className="text-gray-700 font-medium">You have unsaved changes</span>
            ) : (
              "All changes saved"
            )}
          </p>
          <Button
            type="submit"
            disabled={!isDirty || isSaving || isLoadingVoices || greetingOver}
            className="bg-green-500 hover:bg-green-600 text-white px-6 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Save Changes
          </Button>
        </div>
      </div>
    </form>
  );
}
