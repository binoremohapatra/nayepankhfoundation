import React, { useState } from 'react';
import { useRegistration } from '../../context/RegistrationContext';
import { volunteerApi } from '../../services/apiService';
import { OtpInput } from './OtpInput';
import { motion, useReducedMotion } from 'framer-motion';
import toast from 'react-hot-toast';

interface OtpFormProps {
  onSuccess: (name: string) => void;
}

export const OtpForm: React.FC<OtpFormProps> = ({ onSuccess }) => {
  const { state, dispatch } = useRegistration();
  const { formData, loading, error } = state;
  const [otpValue, setOtpValue] = useState('');
  const shouldReduceMotion = useReducedMotion();

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpValue.length !== 6) {
      toast.error('Please enter the full 6-digit OTP.');
      return;
    }

    dispatch({ type: 'VERIFY_OTP' });
    try {
      const result = await volunteerApi.register({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        skills: formData.skills,
        otp: otpValue,
        availability: formData.availability,
        comments: formData.comments,
      });

      dispatch({ type: 'REGISTRATION_SUCCESS' });
      toast.success('Onboarding verified successfully!');
      onSuccess(formData.name);
    } catch (err: any) {
      dispatch({ type: 'REGISTRATION_ERROR', payload: err.message || 'Verification failed.' });
      toast.error(err.message || 'Invalid OTP code.');
    }
  };

  const handleResend = async () => {
    dispatch({ type: 'SUBMIT_DETAILS' });
    try {
      await volunteerApi.generateOtp(formData.email);
      dispatch({ type: 'OTP_SENT' });
      setOtpValue('');
      toast.success('Verification OTP resent successfully!');
    } catch (err: any) {
      dispatch({ type: 'REGISTRATION_ERROR', payload: err.message || 'Failed to resend OTP.' });
      toast.error(err.message || 'Resend rate-limited or failed.');
    }
  };

  const handleGoBack = () => {
    // Return to details step but preserve form inputs
    dispatch({ type: 'UPDATE_FORM', payload: {} });
    dispatch({ type: 'RESET' });
  };

  return (
    <motion.div
      initial={shouldReduceMotion ? {} : { opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={shouldReduceMotion ? {} : { opacity: 0, x: -20 }}
      transition={{ duration: 0.4 }}
      className="w-full"
    >
      <h2 className="text-3xl font-extrabold text-forest font-serif mb-2">Verify Your Email</h2>
      <p className="text-ink/60 mb-6 text-sm">
        We have sent a 6-digit verification code to <strong className="text-forest font-medium">{formData.email}</strong>. Please enter the code below to complete your registration.
        <br />
        <span className="text-moss font-semibold mt-2 inline-block">Please check your Spam or Junk folder if you don't see it in your Inbox.</span>
      </p>

      <form onSubmit={handleVerify} className="space-y-6 bg-white p-6 rounded-2xl border border-sage/60 card-shadow">
        <div className="space-y-3">
          <label className="block text-center text-xs font-semibold uppercase tracking-wider text-forest">
            Enter 6-Digit OTP *
          </label>
          <OtpInput value={otpValue} onChange={setOtpValue} />
        </div>

        {error && <p className="text-red-600 text-xs font-semibold text-center">{error}</p>}

        <div className="space-y-3">
          <button
            type="submit"
            disabled={loading || otpValue.length !== 6}
            className="w-full py-3 bg-moss text-white font-bold rounded-lg hover:bg-forest transition-colors disabled:opacity-60 flex justify-center items-center gap-2 cursor-pointer shadow-md shadow-moss/10"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Verifying OTP...
              </>
            ) : (
              'Verify & Onboard'
            )}
          </button>

          <div className="flex justify-between items-center text-xs text-ink/60 px-1 pt-1">
            <button
              type="button"
              onClick={handleGoBack}
              disabled={loading}
              className="hover:text-forest underline cursor-pointer disabled:opacity-50"
            >
              Change Details
            </button>
            <button
              type="button"
              onClick={handleResend}
              disabled={loading}
              className="hover:text-forest font-semibold cursor-pointer disabled:opacity-50"
            >
              Resend OTP
            </button>
          </div>
        </div>
      </form>
    </motion.div>
  );
};
export default OtpForm;
