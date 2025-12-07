"use client";

import { useState } from "react";
import Step1OwnerInfo from "@/modules/onboarding/components/Step1OwnerInfo";
import Step2BusinessDetails from "@/modules/onboarding/components/Step2BusinessDetails";
import OnboardingProgress from "@/modules/onboarding/components/OnboardingProgress";
import AuthLogo from "@/modules/auth/components/AuthLogo";
import { motion, AnimatePresence } from "framer-motion";
import { TOTAL_STEPS } from "@/modules/onboarding/constants";

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1);

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
      {/* Logo */}
      <AuthLogo />

      {/* Progress Indicator */}
      <OnboardingProgress currentStep={currentStep} totalSteps={TOTAL_STEPS} />

      {/* Step Content */}
      <div className="relative overflow-hidden">
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
            {currentStep === 1 && <Step1OwnerInfo onNext={handleNext} />}
            {currentStep === 2 && (
              <Step2BusinessDetails onNext={handleNext} onBack={handleBack} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
