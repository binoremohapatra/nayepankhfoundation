import React, { useRef } from 'react';

interface OtpInputProps {
  value: string;
  onChange: (otp: string) => void;
}

export const OtpInput: React.FC<OtpInputProps> = ({ value, onChange }) => {
  const inputsRef = useRef<HTMLInputElement[]>([]);
  const otpArray = value.split('').concat(Array(6).fill('')).slice(0, 6);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const val = e.target.value;
    const digit = val.substring(val.length - 1);
    
    if (!/^\d*$/.test(digit)) return;

    const newOtpArray = [...otpArray];
    newOtpArray[index] = digit;
    const updatedOtp = newOtpArray.join('');
    onChange(updatedOtp);

    // Auto advance focus
    if (digit !== '' && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      const newOtpArray = [...otpArray];
      if (otpArray[index] !== '') {
        newOtpArray[index] = '';
        onChange(newOtpArray.join(''));
      } else if (index > 0) {
        newOtpArray[index - 1] = '';
        onChange(newOtpArray.join(''));
        inputsRef.current[index - 1]?.focus();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim();
    if (!/^\d{6}$/.test(pasteData)) return;

    onChange(pasteData);
    inputsRef.current[5]?.focus();
  };

  return (
    <div className="flex gap-2 justify-center" onPaste={handlePaste}>
      {otpArray.map((digit, index) => (
        <input
          key={index}
          ref={(el) => { if (el) inputsRef.current[index] = el; }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={digit}
          onChange={(e) => handleInput(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          className="otp-cell"
          aria-label={`OTP Digit ${index + 1}`}
        />
      ))}
    </div>
  );
};
export default OtpInput;
