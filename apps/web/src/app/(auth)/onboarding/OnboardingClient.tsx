"use client";

import { useState } from "react";
import Step1OwnerInfo from "@/modules/onboarding/components/Step1OwnerInfo";
import Step2BusinessDetails from "@/modules/onboarding/components/Step2BusinessDetails";
import Step3AIReceptionist from "@/modules/onboarding/components/Step3AIReceptionist";
import Step4PhoneNumber from "@/modules/onboarding/components/Step4PhoneNumber";
import Step5TestCall from "@/modules/onboarding/components/Step5TestCall";
import OnboardingProgress from "@/modules/onboarding/components/OnboardingProgress";
import AuthLogo from "@/modules/auth/components/AuthLogo";
import { motion, AnimatePresence } from "framer-motion";
import { TOTAL_STEPS } from "@/modules/onboarding/constants";
import { VenueData } from "@/modules/onboarding/types";
import { signOut } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

interface OnboardingClientProps {
  initialData: VenueData | null;
}

export default function OnboardingClient({ initialData }: OnboardingClientProps) {
  const [currentStep, setCurrentStep] = useState(initialData?.onboardingStep || 1);
  const [purchasedPhoneNumber, setPurchasedPhoneNumber] = useState<string | null>(null);

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handlePhoneNumberPurchased = (phoneNumber: string) => {
    setPurchasedPhoneNumber(phoneNumber);
    handleNext();
  };

  const handleComplete = () => {
    window.location.href = "/dashboard";
  };

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/login";
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
    }),
  };

  return (
    <div className="space-y-8">
      <div className="px-4 space-y-8">
        <div className="flex items-center justify-between">
          <AuthLogo />
          <Button
            onClick={handleSignOut}
            variant="outline"
            size="sm"
            className="text-gray-600 hover:text-gray-900 border-gray-200"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>

        <OnboardingProgress currentStep={currentStep} totalSteps={TOTAL_STEPS} />
      </div>
      <div className="relative px-4">
        <AnimatePresence mode="wait" custom={currentStep}>
          <motion.div
            key={currentStep}
            custom={currentStep}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
          >
            {currentStep === 1 && (
              <Step1OwnerInfo onNext={handleNext} initialData={initialData} />
            )}
            {currentStep === 2 && (
              <Step2BusinessDetails onNext={handleNext} onBack={handleBack} initialData={initialData} />
            )}
            {currentStep === 3 && (
              <Step3AIReceptionist onNext={handleNext} onBack={handleBack} initialData={initialData} />
            )}
            {currentStep === 4 && (
              <Step4PhoneNumber onBack={handleBack} onPhoneNumberPurchased={handlePhoneNumberPurchased} initialData={initialData} />
            )}
            {currentStep === 5 && (
              <Step5TestCall
                onComplete={handleComplete}
                phoneNumber={purchasedPhoneNumber || ""}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
