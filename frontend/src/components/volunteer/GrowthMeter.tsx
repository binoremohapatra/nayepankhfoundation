import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Step } from '../../context/RegistrationContext';

interface GrowthMeterProps {
  currentStep: Step;
}

export const GrowthMeter: React.FC<GrowthMeterProps> = ({ currentStep }) => {
  const shouldReduceMotion = useReducedMotion();

  let activeIndex = 0;
  if (currentStep === 'OTP_SENT' || currentStep === 'VERIFYING') {
    activeIndex = 1;
  } else if (currentStep === 'SUCCESS') {
    activeIndex = 2;
  }

  // Percentage height of active track based on step
  const heightPercent = activeIndex === 0 ? 0 : activeIndex === 1 ? 50 : 100;

  return (
    <div className="relative flex flex-col items-center justify-between h-[340px] w-20 mr-8 flex-shrink-0">
      {/* Background Vertical Track */}
      <div className="absolute top-5 bottom-5 w-1 bg-sage rounded-full" />

      {/* Animated Filling Track */}
      <motion.div
        className="absolute top-5 w-1 bg-moss rounded-full origin-top"
        initial={{ height: '0%' }}
        animate={{ height: `${heightPercent}%` }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.6, ease: 'easeInOut' }}
        style={{ bottom: 'auto' }}
      />

      {/* Step 1: Details (Sprout) */}
      <div className="relative z-10 flex flex-col items-center">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500
            ${activeIndex >= 0 ? 'bg-moss border-moss text-white scale-110 shadow-md shadow-moss/20' : 'bg-white border-sage text-ink/40'}`}
        >
          🌱
        </div>
        <span className={`text-[10px] font-bold mt-1.5 uppercase tracking-wider ${activeIndex >= 0 ? 'text-moss' : 'text-ink/40'}`}>
          Details
        </span>
      </div>

      {/* Step 2: Verify (Seedling) */}
      <div className="relative z-10 flex flex-col items-center">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500
            ${activeIndex >= 1 ? 'bg-moss border-moss text-white scale-110 shadow-md shadow-moss/20' : 'bg-white border-sage/80 text-ink/40'}`}
        >
          🌿
        </div>
        <span className={`text-[10px] font-bold mt-1.5 uppercase tracking-wider ${activeIndex >= 1 ? 'text-moss' : 'text-ink/40'}`}>
          Verify
        </span>
      </div>

      {/* Step 3: Joined (Sapling) */}
      <div className="relative z-10 flex flex-col items-center">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500
            ${activeIndex >= 2 ? 'bg-moss border-moss text-white scale-110 shadow-md shadow-moss/20' : 'bg-white border-sage/80 text-ink/40'}`}
        >
          🌳
        </div>
        <span className={`text-[10px] font-bold mt-1.5 uppercase tracking-wider ${activeIndex >= 2 ? 'text-moss' : 'text-ink/40'}`}>
          Joined
        </span>
      </div>
    </div>
  );
};
export default GrowthMeter;
