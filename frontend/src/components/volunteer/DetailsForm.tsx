import React, { useState } from 'react';
import { useRegistration } from '../../context/RegistrationContext';
import { volunteerApi } from '../../services/apiService';
import { motion, useReducedMotion } from 'framer-motion';

export const DetailsForm: React.FC = () => {
  const { state, dispatch } = useRegistration();
  const { formData, loading } = state;
  const [validationError, setValidationError] = useState('');
  const shouldReduceMotion = useReducedMotion();

  const handleUpdate = (field: keyof typeof formData, value: string) => {
    dispatch({ type: 'UPDATE_FORM', payload: { [field]: value } });
    if (validationError) setValidationError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim() || !formData.skills.trim()) {
      setValidationError('Please fill in all required fields.');
      return;
    }

    dispatch({ type: 'SUBMIT_DETAILS' });
    try {
      await volunteerApi.generateOtp(formData.email);
      dispatch({ type: 'OTP_SENT' });
    } catch (err: any) {
      dispatch({ type: 'REGISTRATION_ERROR', payload: err.message || 'Failed to send OTP.' });
    }
  };

  return (
    <motion.div
      initial={shouldReduceMotion ? {} : { opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={shouldReduceMotion ? {} : { opacity: 0, x: 20 }}
      transition={{ duration: 0.4 }}
      className="w-full"
    >
      <h2 className="text-3xl font-extrabold text-forest font-serif mb-2">Join Our Mission</h2>
      <p className="text-ink/60 mb-6 text-sm">
        Fill out the form below to register as a volunteer. Our AI assistant Priya is here to help with any questions.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-2xl border border-sage/60 card-shadow">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-forest mb-1">Full Name *</label>
          <input
            value={formData.name}
            onChange={(e) => handleUpdate('name', e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border border-sage focus:ring-2 focus:ring-moss/20 focus:border-moss focus:outline-none text-sm transition-all"
            required
            placeholder="Jane Doe"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-forest mb-1">Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleUpdate('email', e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-sage focus:ring-2 focus:ring-moss/20 focus:border-moss focus:outline-none text-sm transition-all"
              required
              placeholder="jane@example.com"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-forest mb-1">Phone *</label>
            <input
              value={formData.phone}
              onChange={(e) => handleUpdate('phone', e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-sage focus:ring-2 focus:ring-moss/20 focus:border-moss focus:outline-none text-sm transition-all"
              required
              placeholder="9876543210"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-forest mb-1">Your Skills *</label>
          <input
            value={formData.skills}
            onChange={(e) => handleUpdate('skills', e.target.value)}
            placeholder="e.g. Teaching, Mentoring, Design"
            className="w-full px-4 py-2.5 rounded-lg border border-sage focus:ring-2 focus:ring-moss/20 focus:border-moss focus:outline-none text-sm transition-all"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-forest mb-1">Availability</label>
          <select
            value={formData.availability}
            onChange={(e) => handleUpdate('availability', e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border border-sage focus:ring-2 focus:ring-moss/20 focus:border-moss focus:outline-none text-sm bg-white transition-all"
          >
            <option value="Weekends">Weekends</option>
            <option value="Weekdays">Weekdays</option>
            <option value="Evenings">Evenings</option>
            <option value="Anytime">Anytime</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-forest mb-1">Additional Comments (Optional)</label>
          <textarea
            value={formData.comments}
            onChange={(e) => handleUpdate('comments', e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border border-sage focus:ring-2 focus:ring-moss/20 focus:border-moss focus:outline-none text-sm transition-all"
            rows={2}
            placeholder="Tell us about yourself or ask anything..."
          />
        </div>

        {validationError && <p className="text-red-600 text-xs font-semibold">{validationError}</p>}
        {state.error && <p className="text-red-600 text-xs font-semibold">{state.error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-moss text-white font-bold rounded-lg hover:bg-forest transition-colors disabled:opacity-75 flex justify-center items-center gap-2 cursor-pointer shadow-md shadow-moss/10"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Sending Verification OTP...
            </>
          ) : (
            'Generate Email OTP'
          )}
        </button>
      </form>
    </motion.div>
  );
};
export default DetailsForm;
