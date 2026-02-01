'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Phone, CheckCircle2, Circle } from 'lucide-react';
import { completeOnboarding, getPrimaryPhoneNumber } from '../actions';

interface Step5TestCallProps {
  onBack: () => void;
  onComplete: () => void;
  phoneNumber: string;
}

interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
}

export default function Step5TestCall({ onBack, onComplete, phoneNumber: initialPhoneNumber }: Step5TestCallProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState<string>(initialPhoneNumber);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    { id: 'called', label: 'I called the phone number', checked: false },
    { id: 'ai_answered', label: 'AI receptionist answered the call', checked: false },
    { id: 'greeting_correct', label: 'Greeting message was correct', checked: false },
    { id: 'responses_good', label: 'AI responded appropriately to my questions', checked: false },
  ]);

  useEffect(() => {
    // If phone number not provided, fetch it from database
    if (!phoneNumber) {
      getPrimaryPhoneNumber().then(number => {
        if (number) setPhoneNumber(number);
      });
    }
  }, [phoneNumber]);

  const toggleCheckbox = (id: string) => {
    setChecklist(prev =>
      prev.map(item =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const allChecked = checklist.every(item => item.checked);

  async function handleComplete() {
    if (!allChecked) {
      setError('Please complete all test steps before continuing');
      return;
    }

    setIsLoading(true);
    setError(null);

    const result = await completeOnboarding();

    if (result.success) {
      onComplete();
    } else {
      setError(result.error || 'Failed to complete onboarding');
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl mb-2">
          <Phone className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900">
          Test Your AI Receptionist
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Your phone number is now live! Call it to test your AI receptionist before completing setup.
        </p>
      </div>

      {/* Phone Number Display */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 rounded-2xl p-8">
        <div className="text-center space-y-4">
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
            Your AI Phone Number
          </p>
          <div className="text-4xl font-bold text-gray-900 tracking-tight">
            {phoneNumber}
          </div>
          <p className="text-sm text-gray-600">
            This number is now active and ready to receive calls
          </p>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
          <Phone className="h-5 w-5" />
          How to test
        </h3>
        <ol className="space-y-2 text-sm text-blue-800">
          <li className="flex gap-2">
            <span className="font-semibold min-w-[20px]">1.</span>
            <span>Call the phone number above from your mobile phone</span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold min-w-[20px]">2.</span>
            <span>Listen to the AI greeting and verify it's correct</span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold min-w-[20px]">3.</span>
            <span>Ask questions about your venue (hours, location, reservations)</span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold min-w-[20px]">4.</span>
            <span>Optionally, ask to speak with a person to test call transfer</span>
          </li>
        </ol>
      </div>

      {/* Checklist */}
      <div className="bg-white border-2 border-gray-200 rounded-2xl p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Test Checklist</h3>
        <div className="space-y-3">
          {checklist.map((item) => (
            <label
              key={item.id}
              className="flex items-start gap-3 p-4 rounded-xl border-2 border-gray-200 hover:border-green-300 hover:bg-green-50/50 cursor-pointer transition-all group"
            >
              <input
                type="checkbox"
                checked={item.checked}
                onChange={() => toggleCheckbox(item.id)}
                className="hidden"
              />
              <div className="mt-0.5">
                {item.checked ? (
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                ) : (
                  <Circle className="h-6 w-6 text-gray-300 group-hover:text-green-400 transition-colors" />
                )}
              </div>
              <span className={`text-base flex-1 ${item.checked ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                {item.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4">
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
          onClick={handleComplete}
          disabled={!allChecked || isLoading}
          className="flex-1 h-12 bg-black hover:bg-gray-900 text-white rounded-xl text-base font-medium shadow-lg shadow-green-400/10 hover:shadow-green-400/20 transition-all disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Completing...
            </>
          ) : (
            'Complete Setup'
          )}
        </Button>
      </div>

      {/* Footer Note */}
      <div className="text-center text-sm text-gray-500 pt-4">
        <p>
          Don't worry, you can always test and modify your AI receptionist settings later from your dashboard.
        </p>
      </div>
    </div>
  );
}
