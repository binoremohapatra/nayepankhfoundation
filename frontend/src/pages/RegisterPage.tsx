import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import * as THREE from 'three';
import { useNavigate, Link } from 'react-router-dom';
import {
  Heart, ArrowLeft, CheckCircle2, Send,
  Volume2, VolumeX, User, Mail, Phone, Sparkles, BookOpen
} from 'lucide-react';
import { sendGeminiMessage, getWelcomeMessage, type ChatMessage } from '../services/geminiService';
import { speak, stop, onSpeakingStateChange } from '../services/speechSynthesisService';
import { volunteerApi, type RegisterRequest } from '../services/apiService';
import { NayePankhScene } from '../components/NayePankhAvatarScene';

/* â”€â”€ Toast â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
interface ToastProps { message: string; type: 'success' | 'error' }
const Toast: React.FC<ToastProps> = ({ message, type }) => (
  <div className={type === 'success' ? 'toast-success' : 'toast-error'}>
    <span className="text-base">{type === 'success' ? 'âœ“' : 'âœ•'}</span>
    {message}
  </div>
);

/* â”€â”€ Sound wave bars â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const WaveBars = () => (
  <div className="flex items-end gap-0.5 h-3.5">
    {[1, 2, 3, 4, 5].map(i => (
      <div
        key={i}
        className="w-0.5 rounded-full animate-soundwave"
        style={{
          height: `${30 + i * 14}%`,
          animationDelay: `${i * 0.08}s`,
          backgroundColor: '#3F6F52',
        }}
      />
    ))}
  </div>
);

/* â”€â”€ Stepper â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const STEPS = ['Your Details', 'Verify Email', 'Confirmed'];
const StepBadge: React.FC<{ step: number; current: number }> = ({ step, current }) => {
  const done = current > step;
  const active = current === step;
  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300"
      style={{
        background: done ? '#3F6F52' : active ? '#fff' : '#fff',
        borderColor: done || active ? '#3F6F52' : '#D4E2C8',
        color: done ? '#fff' : active ? '#3F6F52' : '#9CA3AF',
        boxShadow: active ? '0 0 0 3px rgba(63,111,82,0.2)' : 'none',
      }}
    >
      {done ? <CheckCircle2 className="w-4 h-4" /> : step + 1}
    </div>
  );
};

/* â”€â”€ OTP 6-cell input â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const OtpCells: React.FC<{ value: string; onChange: (v: string) => void }> = ({ value, onChange }) => {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const arr = value.split('').concat(Array(6).fill('')).slice(0, 6);
  const handle = (e: React.ChangeEvent<HTMLInputElement>, i: number) => {
    const d = e.target.value.replace(/\D/, '').slice(-1);
    const next = [...arr]; next[i] = d;
    onChange(next.join(''));
    if (d && i < 5) refs.current[i + 1]?.focus();
  };
  const onKey = (e: React.KeyboardEvent<HTMLInputElement>, i: number) => {
    if (e.key === 'Backspace') {
      const next = [...arr];
      if (arr[i]) { next[i] = ''; onChange(next.join('')); }
      else if (i > 0) { next[i - 1] = ''; onChange(next.join('')); refs.current[i - 1]?.focus(); }
    }
  };
  const onPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const p = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(p.padEnd(6, ''));
    refs.current[Math.min(p.length, 5)]?.focus();
  };
  return (
    <div className="flex gap-2 justify-center" onPaste={onPaste}>
      {arr.map((d, i) => (
        <input
          key={i} ref={el => { refs.current[i] = el; }}
          type="text" inputMode="numeric" pattern="[0-9]*" maxLength={1}
          value={d} onChange={e => handle(e, i)} onKeyDown={e => onKey(e, i)}
          className="otp-cell" aria-label={`OTP digit ${i + 1}`}
        />
      ))}
    </div>
  );
};

/* â”€â”€ Chat message component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const ChatBubble: React.FC<{ msg: ChatMessage; isNew?: boolean }> = ({ msg, isNew }) => {
  const isUser = msg.role === 'user';
  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} items-end gap-2`}
      style={{
        animation: isNew ? 'chatSlideIn 0.35s cubic-bezier(0.34,1.2,0.64,1) both' : 'none',
      }}
    >
      {!isUser && (
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 mb-0.5"
          style={{ background: 'linear-gradient(135deg, #3F6F52, #1F3A2E)', boxShadow: '0 2px 8px rgba(63,111,82,0.35)' }}
        >
          P
        </div>
      )}
      <div className={`group relative max-w-[78%] ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        <div
          className="px-4 py-2.5 text-sm leading-relaxed"
          style={{
            borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
            background: isUser
              ? 'linear-gradient(135deg, #3F6F52, #2e6249)'
              : 'linear-gradient(145deg, #ffffff, #f5f9f2)',
            color: isUser ? '#fff' : '#1C1C1C',
            boxShadow: isUser
              ? '0 2px 12px rgba(63,111,82,0.25)'
              : '0 2px 8px rgba(31,58,46,0.08)',
            border: isUser ? 'none' : '1px solid #D4E2C8',
          }}
        >
          {msg.text}
        </div>
        <span className="text-[10px] text-gray-400 mt-1 px-1">
          {msg.timestamp
            ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : ''}
        </span>
      </div>
      {isUser && (
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 mb-5"
          style={{ background: '#D9A441' }}
        >
          U
        </div>
      )}
    </div>
  );
};

/* â”€â”€ Typing indicator â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const TypingIndicator = () => (
  <div className="flex items-end gap-2">
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
      style={{ background: 'linear-gradient(135deg, #3F6F52, #1F3A2E)', boxShadow: '0 2px 8px rgba(63,111,82,0.35)' }}
    >
      P
    </div>
    <div
      className="px-4 py-3 flex items-center gap-1.5"
      style={{
        borderRadius: '18px 18px 18px 4px',
        background: 'linear-gradient(145deg, #ffffff, #f5f9f2)',
        border: '1px solid #D4E2C8',
        boxShadow: '0 2px 8px rgba(31,58,46,0.08)',
      }}
    >
      {[0, 1, 2].map(i => (
        <div
          key={i}
          className="rounded-full"
          style={{
            width: 7, height: 7,
            background: '#3F6F52',
            animation: `typingBounce 1s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
    </div>
  </div>
);

/* â”€â”€ Quick reply chips â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const QUICK_REPLIES = [
  'What programs are available?',
  'How long does onboarding take?',
  'Is it remote or in-person?',
];

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   MAIN PAGE
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
export default function RegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ name: '', email: '', phone: '', skills: '', availability: 'Weekends', comments: '' });
  const [otp, setOtp] = useState('');
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [formError, setFormError] = useState('');
  const [toast, setToast] = useState<ToastProps | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([getWelcomeMessage()]);
  const [newMsgIds, setNewMsgIds] = useState<Set<string>>(new Set());
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [muted, setMuted] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    onSpeakingStateChange(setIsSpeaking);
    const t = setTimeout(() => !muted && speak(getWelcomeMessage().text, 0.95), 900);
    return () => { clearTimeout(t); stop(); };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const showToast = (message: string, type: ToastProps['type']) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const addMessage = (msg: ChatMessage) => {
    setMessages(prev => [...prev, msg]);
    setNewMsgIds(prev => new Set(prev).add(msg.id));
    setTimeout(() => setNewMsgIds(prev => { const s = new Set(prev); s.delete(msg.id); return s; }), 500);
  };

  const handleSend = useCallback(async (text?: string) => {
    const t = (text ?? inputText).trim();
    if (!t || isTyping) return;
    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: 'user', text: t, timestamp: new Date() };
    addMessage(userMsg);
    setInputText('');
    setIsTyping(true);
    stop();
    try {
      const reply = await sendGeminiMessage(t, messages);
      const aiMsg: ChatMessage = { id: `a-${Date.now()}`, role: 'assistant', text: reply, timestamp: new Date() };
      addMessage(aiMsg);
      if (!muted) speak(reply, 0.95);
    } catch (err: any) {
      showToast(err.message || 'AI unavailable.', 'error');
    } finally {
      setIsTyping(false);
      inputRef.current?.focus();
    }
  }, [inputText, isTyping, messages, muted]);

  const handleSendOtp = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim() || !form.skills.trim()) {
      setFormError('Please fill in all required fields.'); return;
    }
    setFormError(''); setOtpSending(true);
    try {
      await volunteerApi.generateOtp(form.email);
      setStep(1);
      showToast('OTP sent to your email!', 'success');
    } catch (err: any) { 
      setFormError(err.message || 'Failed to send OTP.'); 
      showToast(err.message || 'Failed to send OTP.', 'error');
    }
    finally { setOtpSending(false); }
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 6) { setOtpError('Enter all 6 digits.'); return; }
    setOtpError(''); setOtpVerifying(true);
    try {
      const req: RegisterRequest = { ...form, otp };
      await volunteerApi.register(req);
      setStep(2);
      showToast('Registration successful! Welcome to NayePankh ðŸŽ‰', 'success');
      const msg: ChatMessage = { id: `a-${Date.now()}`, role: 'assistant', text: `Welcome to the NayePankh family, ${form.name}! Your registration is confirmed. Our team will reach out soon. ðŸ’š`, timestamp: new Date() };
      addMessage(msg);
      if (!muted) speak(msg.text, 0.95);
      setTimeout(() => navigate('/dashboard'), 3500);
    } catch (err: any) { 
      setOtpError(err.message || 'OTP verification failed.'); 
      showToast(err.message || 'OTP verification failed.', 'error');
    }
    finally { setOtpVerifying(false); }
  };

  return (
    <>
      {/* Global keyframes for chat animations */}
      <style>{`
        @keyframes chatSlideIn {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)  scale(1); }
        }
        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); }
          30%            { transform: translateY(-6px); }
        }
        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(63,111,82,0.4); }
          50%       { box-shadow: 0 0 0 6px rgba(63,111,82,0); }
        }
        @keyframes speechBubbleIn {
          from { opacity: 0; transform: translateX(-12px) scale(0.95); }
          to   { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes userBubbleIn {
          from { opacity: 0; transform: translateX(12px) scale(0.95); }
          to   { opacity: 1; transform: translateX(0) scale(1); }
        }
        .priya-avatar-ring {
          animation: glowPulse 2.5s ease-in-out infinite;
        }
      `}</style>

      {toast && <Toast {...toast} />}

      <div className="min-h-screen bg-paper flex flex-col md:flex-row font-sans">

        {/* â•â• LEFT â€” Registration form â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        <div className="w-full md:w-[52%] lg:w-[48%] flex flex-col overflow-y-auto">

          {/* Top bar */}
          <div className="flex items-center justify-between px-6 py-4 border-b bg-white/70 backdrop-blur-sm" style={{ borderColor: '#D4E2C8' }}>
            <Link to="/" className="flex items-center gap-2 text-sm font-semibold hover:opacity-70 transition-opacity" style={{ color: '#1F3A2E' }}>
              <ArrowLeft className="w-4 h-4" /> Home
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#3F6F52,#1F3A2E)' }}>
                <Heart className="w-3 h-3 text-white fill-current" />
              </div>
              <span className="text-xs font-semibold" style={{ color: 'rgba(31,58,46,0.6)' }}>NayePankh Â· Volunteer Hub</span>
            </div>
          </div>

          {/* Stepper */}
          <div className="px-6 md:px-10 lg:px-14 pt-8 pb-0">
            <div className="flex items-center gap-3">
              {STEPS.map((s, i) => (
                <React.Fragment key={s}>
                  <div className="flex items-center gap-2">
                    <StepBadge step={i} current={step} />
                    <span className={`text-xs font-semibold hidden sm:block transition-colors duration-300 ${step === i ? 'text-forest' : step > i ? 'text-moss' : 'text-muted'}`} style={{ color: step === i ? '#1F3A2E' : step > i ? '#3F6F52' : '#9CA3AF' }}>{s}</span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className="flex-1 h-0.5 rounded-full transition-all duration-700" style={{ background: step > i ? '#3F6F52' : '#D4E2C8' }} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Form area */}
          <div className="flex-1 flex flex-col justify-center px-6 md:px-10 lg:px-14 py-8">

            {/* Step 0 â€” Details */}
            {step === 0 && (
              <div className="animate-fade-up">
                <p className="section-eyebrow mb-2">Step 1</p>
                <h1 className="text-3xl font-extrabold mb-2" style={{ fontFamily: 'Fraunces,serif', color: '#1F3A2E' }}>Join Our Mission</h1>
                <p className="text-sm mb-8 leading-relaxed" style={{ color: '#6B7280' }}>Fill out the form below. Our AI assistant Priya is here to help with any questions.</p>

                <div className="space-y-5">
                  <div>
                    <label className="input-label">Full Name *</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#6B7280' }} />
                      <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input pl-10" placeholder="Jane Doe" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="input-label">Email *</label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#6B7280' }} />
                        <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="input pl-10" placeholder="you@example.com" />
                      </div>
                    </div>
                    <div>
                      <label className="input-label">Phone *</label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#6B7280' }} />
                        <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="input pl-10" placeholder="9876543210" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="input-label">Your Skills *</label>
                    <div className="relative">
                      <Sparkles className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#6B7280' }} />
                      <input value={form.skills} onChange={e => setForm(f => ({ ...f, skills: e.target.value }))} className="input pl-10" placeholder="Teaching, Coding, Design..." />
                    </div>
                  </div>
                  <div>
                    <label className="input-label">Availability</label>
                    <select value={form.availability} onChange={e => setForm(f => ({ ...f, availability: e.target.value }))} className="input bg-white">
                      {['Weekends', 'Weekdays', 'Evenings', 'Anytime'].map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="input-label">Comments <span className="normal-case font-normal tracking-normal" style={{ color: '#6B7280' }}>(optional)</span></label>
                    <div className="relative">
                      <BookOpen className="absolute left-3.5 top-3 w-4 h-4" style={{ color: '#6B7280' }} />
                      <textarea value={form.comments} onChange={e => setForm(f => ({ ...f, comments: e.target.value }))} className="input pl-10" rows={2} placeholder="Tell us anything else..." />
                    </div>
                  </div>

                  {formError && (
                    <p className="text-sm font-medium flex items-center gap-1.5" style={{ color: '#DC2626' }}>
                      <span>âš </span> {formError}
                    </p>
                  )}

                  <button onClick={handleSendOtp} disabled={otpSending} className="btn-primary w-full" style={{ paddingTop: '0.9rem', paddingBottom: '0.9rem', fontSize: '0.95rem' }}>
                    {otpSending
                      ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending OTP...</>
                      : <><Mail className="w-4 h-4" /> Send Verification OTP</>}
                  </button>
                </div>
              </div>
            )}

            {/* Step 1 â€” OTP */}
            {step === 1 && (
              <div className="animate-fade-up">
                <p className="section-eyebrow mb-2">Step 2</p>
                <h1 className="text-3xl font-extrabold mb-2" style={{ fontFamily: 'Fraunces,serif', color: '#1F3A2E' }}>Check Your Email</h1>
                <p className="text-sm mb-2 leading-relaxed" style={{ color: '#6B7280' }}>
                  We sent a 6-digit code to <span className="font-semibold" style={{ color: '#1F3A2E' }}>{form.email}</span>
                </p>
                <p className="text-sm font-semibold mb-2" style={{ color: '#3F6F52' }}>
                  Please check your Spam or Junk folder if you don't see it in your Inbox.
                </p>
                <p className="text-xs mb-10" style={{ color: '#9CA3AF' }}>Valid for 5 minutes · max 3 attempts</p>

                <div className="card p-8 mb-6">
                  <OtpCells value={otp} onChange={setOtp} />
                  {otpError && <p className="text-sm font-medium text-center mt-4 flex items-center justify-center gap-1.5" style={{ color: '#DC2626' }}><span>⚠️</span>{otpError}</p>}
                </div>

                <button onClick={handleVerifyOtp} disabled={otpVerifying || otp.length < 6} className="btn-primary w-full mb-4" style={{ paddingTop: '0.9rem', paddingBottom: '0.9rem' }}>
                  {otpVerifying
                    ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Verifying...</>
                    : <><CheckCircle2 className="w-4 h-4" /> Verify & Complete Registration</>}
                </button>
                <button onClick={() => setStep(0)} className="btn-ghost w-full justify-center py-2.5">
                  <ArrowLeft className="w-4 h-4" /> Back to details
                </button>
              </div>
            )}

            {/* Step 2 — Success */}
            {step === 2 && (
              <div className="animate-fade-up text-center flex flex-col items-center">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center mb-6 animate-float"
                  style={{ background: 'linear-gradient(135deg,#3F6F52,#1F3A2E)', boxShadow: '0 0 32px 8px rgba(63,111,82,0.2)' }}
                >
                  <CheckCircle2 className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-3xl font-extrabold mb-3" style={{ fontFamily: 'Fraunces,serif', color: '#1F3A2E' }}>You're In! 🎉</h1>
                <p className="leading-relaxed mb-4 max-w-sm" style={{ color: '#6B7280' }}>
                  Welcome to the <span className="font-semibold" style={{ color: '#1F3A2E' }}>NayePankh family</span>, {form.name}! Our team will reach out shortly.
                </p>
                <div className="flex items-center gap-2 text-xs" style={{ color: '#9CA3AF' }}>
                  <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#3F6F52', borderTopColor: 'transparent' }} />
                  Redirecting to dashboard...
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ══ RIGHT — Immersive Priya Panel ════════════════════ */}
        <div
          className="w-full md:w-[48%] lg:w-[52%] relative overflow-hidden"
          style={{ borderLeft: '1px solid #D4E2C8', minHeight: '100vh', background: 'linear-gradient(170deg, #eef5f0 0%, #f5f9f4 40%, #FAF6EE 100%)' }}
        >
          {/* ── Full-screen 3D canvas ── */}
          <div className="absolute inset-0 z-0">
            <Canvas
              camera={{ position: [-0.35, 0.75, 4.5], fov: 54 }}
              gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }}
              style={{ width: '100%', height: '100%', background: 'transparent' }}
            >
              <Suspense fallback={null}>
                <NayePankhScene
                  isSpeaking={isSpeaking}
                  isThinking={isTyping}
                  onSuccess={step === 2}
                />
              </Suspense>
            </Canvas>
            {/* Subtle floor glow */}
            <div
              className="absolute bottom-0 inset-x-0 h-32 pointer-events-none"
              style={{ background: 'linear-gradient(to top, rgba(63,111,82,0.12) 0%, transparent 100%)' }}
            />
          </div>

          {/* ── Top bar (Priya status + mute) ── */}
          <div
            className="absolute top-0 inset-x-0 px-4 py-3 flex items-center justify-between z-20"
            style={{ background: 'linear-gradient(to bottom, rgba(238,245,240,0.95) 0%, transparent 100%)' }}
          >
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold priya-avatar-ring"
                  style={{ background: 'linear-gradient(135deg,#3F6F52,#1F3A2E)' }}
                >P</div>
                <span
                  className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white"
                  style={{ background: isSpeaking ? '#D9A441' : isTyping ? '#F59E0B' : '#16A34A', transition: 'background 0.3s' }}
                />
              </div>
              <div>
                <div className="text-sm font-bold" style={{ color: '#1F3A2E' }}>Priya</div>
                <div className="text-[11px] flex items-center gap-1" style={{ color: '#6B7280' }}>
                  {isSpeaking
                    ? <><WaveBars /><span className="ml-1">Speaking…</span></>
                    : isTyping
                      ? <><span style={{ color: '#F59E0B' }}>●</span><span className="ml-1">Thinking…</span></>
                      : <><span style={{ color: '#16A34A' }}>●</span><span className="ml-1">Online</span></>}
                </div>
              </div>
            </div>
            <button
              onClick={() => { setMuted(m => !m); if (!muted) stop(); }}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-150 hover:scale-110"
              style={{ background: 'rgba(255,255,255,0.85)', color: muted ? '#92400E' : '#3F6F52', border: '1px solid #D4E2C8', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
              title={muted ? 'Unmute' : 'Mute'}
            >
              {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* ── Scrollable Chat Box Overlay (Left Side) ── */}
          <div
            className="absolute left-4 top-[72px] bottom-[110px] w-[60%] flex flex-col z-20"
          >
            <div
              className="flex-1 overflow-y-auto pr-2 pb-4 space-y-3"
              style={{ scrollbarWidth: 'none', maskImage: 'linear-gradient(to bottom, transparent 0%, black 5%, black 95%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 5%, black 95%, transparent 100%)' }}
            >
              {messages.map((msg, i) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  style={{ animation: `chatSlideIn 0.3s ease ${i * 0.03}s both` }}
                >
                  <div
                    style={{
                      maxWidth: '90%',
                      background: msg.role === 'user'
                        ? 'linear-gradient(135deg, rgba(63,111,82,0.92), rgba(31,58,46,0.95))'
                        : 'rgba(255,255,255,0.96)',
                      backdropFilter: 'blur(12px)',
                      border: msg.role === 'user' ? 'none' : '1.5px solid rgba(63,111,82,0.18)',
                      borderRadius: msg.role === 'user' ? '18px 4px 18px 18px' : '18px 18px 18px 4px',
                      padding: '10px 14px',
                      boxShadow: msg.role === 'user'
                        ? '0 4px 16px rgba(63,111,82,0.25)'
                        : '0 4px 20px rgba(31,58,46,0.12)',
                      fontSize: '12.5px',
                      lineHeight: 1.55,
                      color: msg.role === 'user' ? '#fff' : '#1C1C1C',
                      wordBreak: 'break-word',
                    }}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div style={{ background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(12px)', border: '1.5px solid rgba(63,111,82,0.18)', borderRadius: '18px 18px 18px 4px', padding: '12px 14px' }}>
                    <div className="flex items-center gap-1.5">
                      {[0, 1, 2].map(i => (
                        <div key={i} className="rounded-full" style={{ width: 6, height: 6, background: '#3F6F52', animation: `typingBounce 1s ease-in-out ${i * 0.2}s infinite` }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          </div>

          {/* ── Quick reply chips (bottom, above input) ── */}
          {messages.length < 4 && !isTyping && (
            <div
              className="absolute z-20 flex gap-2 flex-wrap justify-center"
              style={{ bottom: '70px', left: '16px', right: '16px' }}
            >
              {QUICK_REPLIES.map(q => (
                <button
                  key={q}
                  onClick={() => handleSend(q)}
                  style={{
                    background: 'rgba(255,255,255,0.88)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(63,111,82,0.2)',
                    borderRadius: '20px',
                    padding: '6px 14px',
                    fontSize: '11.5px',
                    fontWeight: 500,
                    color: '#1F3A2E',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: '0 2px 8px rgba(31,58,46,0.08)',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(63,111,82,0.12)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.88)'; }}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* ── Frosted-glass input bar (bottom overlay) ── */}
          <div
            className="absolute bottom-0 inset-x-0 z-30 px-4 py-3"
            style={{ background: 'rgba(238,245,240,0.85)', backdropFilter: 'blur(16px)', borderTop: '1px solid rgba(63,111,82,0.12)' }}
          >
            <div className="flex gap-2 items-center">
              <input
                ref={inputRef}
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="Ask Priya about volunteering..."
                style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.95)',
                  border: '1.5px solid rgba(63,111,82,0.2)',
                  borderRadius: '24px',
                  padding: '9px 18px',
                  fontSize: '13px',
                  color: '#1C1C1C',
                  outline: 'none',
                  boxShadow: '0 2px 8px rgba(31,58,46,0.06)',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = '#3F6F52'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(63,111,82,0.12)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'rgba(63,111,82,0.2)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(31,58,46,0.06)'; }}
              />
              <button
                onClick={() => handleSend()}
                disabled={isTyping || !inputText.trim()}
                style={{
                  width: 40, height: 40,
                  background: 'linear-gradient(135deg,#3F6F52,#1F3A2E)',
                  border: 'none',
                  borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0,
                  boxShadow: '0 4px 12px rgba(63,111,82,0.35)',
                  opacity: (isTyping || !inputText.trim()) ? 0.45 : 1,
                  transition: 'opacity 0.2s, transform 0.15s',
                }}
                onMouseEnter={e => { if (!isTyping && inputText.trim()) (e.currentTarget as HTMLElement).style.transform = 'scale(1.1)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
              >
              </button>
            </div>
            <div ref={chatEndRef} />
          </div>
        </div>
      </div>
    </>
  );
}
