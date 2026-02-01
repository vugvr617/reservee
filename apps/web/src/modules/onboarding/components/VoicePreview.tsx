"use client";

import { useState, useRef, useEffect } from "react";
import { VoiceOption } from "@/lib/vapi";
import { Volume2, Loader2 } from "lucide-react";

interface VoicePreviewProps {
  voice: VoiceOption;
  onPreviewReady?: (isReady: boolean) => void;
}

export default function VoicePreview({
  voice,
  onPreviewReady,
}: VoicePreviewProps) {
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isReady, setIsReady] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Create audio element for preview
    if (voice.previewUrl) {
      audioRef.current = new Audio(voice.previewUrl);
      audioRef.current.addEventListener('ended', () => {
        setIsPreviewing(false);
      });
      setIsReady(true);
      onPreviewReady?.(true);
    } else {
      setIsReady(false);
      onPreviewReady?.(false);
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [voice.previewUrl, onPreviewReady]);

  const handlePreview = () => {
    if (!audioRef.current || !voice.previewUrl) {
      console.log("No preview URL available for", voice.name);
      return;
    }

    console.log("Playing preview for voice:", voice.name);
    setIsPreviewing(true);
    audioRef.current.play().catch(error => {
      console.error("Audio play error:", error);
      setIsPreviewing(false);
    });
  };

  const handleStopPreview = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPreviewing(false);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent parent card from being selected
    if (isPreviewing) {
      handleStopPreview();
    } else {
      handlePreview();
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!isReady}
      className={`h-8 px-3 rounded-lg font-medium transition-all text-xs flex items-center gap-1.5 ${
        isPreviewing
          ? "bg-red-500 hover:bg-red-600 text-white"
          : "bg-green-400 hover:bg-green-500 text-black"
      } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {!isReady ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <Volume2 className="h-3 w-3" />
      )}
      <span>
        {isPreviewing ? "Stop" : "Preview"}
      </span>
    </button>
  );
}
