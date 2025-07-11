import { useState, useCallback } from 'react';

interface UseWizardStepsProps {
  initialStep?: number;
  totalSteps?: number;
  onStepChange?: (step: number) => void;
}

/**
 * Hook for managing multi-step wizard navigation
 * Handles step state and navigation logic
 */
export const useWizardSteps = ({ 
  initialStep = 1, 
  totalSteps = 2,
  onStepChange 
}: UseWizardStepsProps = {}) => {
  const [currentStep, setCurrentStep] = useState(initialStep);

  const goToStep = useCallback((step: number) => {
    if (step >= 1 && step <= totalSteps) {
      setCurrentStep(step);
      onStepChange?.(step);
    }
  }, [totalSteps, onStepChange]);

  const nextStep = useCallback(() => {
    if (currentStep < totalSteps) {
      const newStep = currentStep + 1;
      setCurrentStep(newStep);
      onStepChange?.(newStep);
    }
  }, [currentStep, totalSteps, onStepChange]);

  const prevStep = useCallback(() => {
    if (currentStep > 1) {
      const newStep = currentStep - 1;
      setCurrentStep(newStep);
      onStepChange?.(newStep);
    }
  }, [currentStep, onStepChange]);

  const resetSteps = useCallback(() => {
    setCurrentStep(initialStep);
    onStepChange?.(initialStep);
  }, [initialStep, onStepChange]);

  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === totalSteps;
  const canGoNext = currentStep < totalSteps;
  const canGoPrev = currentStep > 1;

  return {
    currentStep,
    goToStep,
    nextStep,
    prevStep,
    resetSteps,
    isFirstStep,
    isLastStep,
    canGoNext,
    canGoPrev
  };
};