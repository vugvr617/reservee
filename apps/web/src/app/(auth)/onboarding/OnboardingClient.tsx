"use client";

import { useState } from "react";
import Step1OwnerInfo from "@/modules/onboarding/components/Step1OwnerInfo";
import Step2BusinessDetails from "@/modules/onboarding/components/Step2BusinessDetails";
import OnboardingProgress from "@/modules/onboarding/components/OnboardingProgress";
import AuthLogo from "@/modules/auth/components/AuthLogo";
import { motion, AnimatePresence } from "framer-motion";
import { TOTAL_STEPS } from "@/modules/onboarding/constants";
import { VenueData } from "@/modules/onboarding/types";

interface OnboardingClientProps {
  initialData: VenueData | null;
}

export default function OnboardingClient({ initialData }: OnboardingClientProps) {
  const [currentStep, setCurrentStep] = useState(initialData?.onboardingStep || 1);

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
      <AuthLogo />

      <OnboardingProgress currentStep={currentStep} totalSteps={TOTAL_STEPS} />
      </div>
      <div className="relative px-4 overflow-hidden">
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
              <div className="text-center py-12">
                <h2 className="text-2xl font-semibold text-gray-900">Step 3</h2>
                <p className="text-gray-500 mt-2">Coming soon...</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
