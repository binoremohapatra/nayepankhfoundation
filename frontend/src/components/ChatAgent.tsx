import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import * as THREE from 'three';
import { sendGeminiMessage, getWelcomeMessage, type ChatMessage } from '../services/geminiService';
import { speak, stop, onSpeakingStateChange } from '../services/speechSynthesisService';
import { volunteerApi, type Volunteer } from '../services/apiService';
import { NayePankhScene } from './NayePankhAvatarScene';

/* ── Toast notification ────────────────────────────── */
interface ToastProps { message: string; type: 'success' | 'error' }
const Toast: React.FC<ToastProps> = ({ message, type }) => (
  <div
    className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-6 py-3.5 rounded-2xl shadow-2xl text-sm font-medium text-white"
    style={{
      backdropFilter: 'blur(16px)',
      background: type === 'success' ? 'rgba(22,163,74,0.85)' : 'rgba(220,38,38,0.85)',
      border: `1px solid ${type === 'success' ? 'rgba(34,197,94,0.5)' : 'rgba(239,68,68,0.5)'}`,
      animation: 'slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
    }}>
    <span className="text-xl">{type === 'success' ? '✅' : '❌'}</span>
    {message}
  </div>
);

/* ── Wave bars for speaking indicator ─────────────── */
const WaveBars: React.FC = () => (
  <div className="flex items-end gap-0.5 h-4">
    {[1, 2, 3, 4, 5].map(i => (
      <div
        key={i}
        className="w-0.5 rounded-full bg-green-400"
        style={{
          animation: `soundwave ${0.3 + i * 0.08}s ease-in-out infinite alternate`,
          height: `${40 + i * 12}%`,
        }}
      />
    ))}
  </div>
);

/* ── ChatAgent ─────────────────────────────────────── */
interface ChatAgentProps { onVolunteerRegistered: () => void }

const ChatAgent: React.FC<ChatAgentProps> = ({ onVolunteerRegistered }) => {
  const [messages, setMessages]     = useState<ChatMessage[]>([getWelcomeMessage()]);
  const [inputText, setInputText]   = useState('');
  const [isTyping, setIsTyping]     = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [toast, setToast]           = useState<ToastProps | null>(null);

  /* Registration form */
  const [form, setForm]           = useState({ name: '', email: '', skills: '' });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError]   = useState('');

  const chatEndRef = useRef<HTMLDivElement>(null);

  /* Wire speech service → local speaking state (drives Avatar lip-sync) */
  useEffect(() => {
    onSpeakingStateChange(setIsSpeaking);
    const t = setTimeout(() => speak(getWelcomeMessage().text, 0.95), 900);
    return () => { clearTimeout(t); stop(); };
  }, []);

  /* Auto scroll chat to bottom */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  /* Show toast, auto-dismiss after 3.5 s */
  const showToast = useCallback((message: string, type: ToastProps['type']) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  /* ── Send chat message ── */
  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || isTyping) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);
    stop();

    try {
      const reply = await sendGeminiMessage(text, messages);
      const assistantMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        text: reply,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMsg]);
      speak(reply, 0.95);
    } catch (err: any) {
      showToast(err.message || 'Failed to reach Gemini API.', 'error');
    } finally {
      setIsTyping(false);
    }
  }, [inputText, isTyping, messages, showToast]);

  /* ── Register volunteer ── */
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!form.name.trim() || !form.email.trim() || !form.skills.trim()) {
      setFormError('All fields are required.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setFormError('Please enter a valid email address.');
      return;
    }

    setFormLoading(true);
    try {
      await volunteerApi.register(form as Omit<Volunteer, 'id' | 'status'>);
      setForm({ name: '', email: '', skills: '' });
      showToast('🎉 Welcome aboard! Registration successful!', 'success');
      onVolunteerRegistered();

      /* Trigger celebratory reply in chat */
      const celebMsg: ChatMessage = {
        id: `a-reg-${Date.now()}`,
        role: 'assistant',
        text: `🎉 Welcome to the NayePankh family, ${form.name}! Your registration is confirmed and our team will reach out soon. Together we'll change lives! 💚🙌`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, celebMsg]);
      stop();
      speak(celebMsg.text, 0.95);
    } catch (err: any) {
      showToast(err.message || 'Registration failed. Is the backend running on port 8080?', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden flex flex-col">
      {/* Global CSS for animations */}
      <style>{`
        @keyframes soundwave {
          from { transform: scaleY(0.4); }
          to   { transform: scaleY(1.0); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translate(-50%, -20px); }
          to   { opacity: 1; transform: translate(-50%, 0); }
        }
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40%            { transform: translateY(-6px); }
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {toast && <Toast {...toast} />}

      {/* ── IMMERSIVE 3D BACKGROUND ── */}
      <div className="absolute inset-0 z-0 bg-[#050510]">
        <Canvas
          camera={{ position: [0, 0.9, 2.6], fov: 40 }}
          gl={{
            antialias: true,
            alpha: false,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.2,
          }}
          dpr={[1, 1.5]}
        >
          <Suspense fallback={null}>
            <NayePankhScene isSpeaking={isSpeaking} />
          </Suspense>
        </Canvas>

        {/* Top Gradient Overlay to blend HUD */}
        <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-[#050508] to-transparent opacity-80 pointer-events-none" />
        
        {/* Speaking indicator overlay */}
        {isSpeaking && (
          <div
            className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full text-sm text-green-300 font-bold"
            style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(34,197,94,0.4)', backdropFilter: 'blur(12px)', boxShadow: '0 0 20px rgba(34,197,94,0.2)' }}
          >
            <WaveBars />
            <span className="ml-1 tracking-wide">Priya is speaking</span>
          </div>
        )}
      </div>

      {/* ── GLASS HUD FOREGROUND ── */}
      <div className="relative z-10 flex flex-col h-full pointer-events-none">
        
        {/* Top spacer so avatar head is visible */}
        <div className="flex-1" />

        {/* Bottom Panel (Chat + Form) */}
        <div className="w-full shrink-0 flex flex-col pointer-events-auto"
             style={{ 
               background: 'linear-gradient(180deg, rgba(5,5,10,0) 0%, rgba(5,5,10,0.85) 15%, rgba(5,5,10,0.98) 100%)',
               paddingTop: '2rem' 
             }}>
          
          {/* ── Chat Messages Stream ── */}
          <div className="w-full px-6 py-2 max-h-[35vh] overflow-y-auto scrollbar-hide space-y-3 mb-2 flex flex-col">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mr-3 mt-0.5 text-xs font-bold text-white shadow-lg shadow-green-500/20"
                    style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)' }}
                  >
                    P
                  </div>
                )}
                <div
                  className={`max-w-[85%] px-5 py-3 rounded-2xl text-[14px] leading-relaxed shadow-lg
                    ${msg.role === 'user' ? 'rounded-tr-sm text-white' : 'rounded-tl-sm text-white/95'}`}
                  style={
                    msg.role === 'user'
                      ? { background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', border: '1px solid rgba(255,255,255,0.1)' }
                      : { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(16px)' }
                  }
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mr-3 mt-0.5 text-xs font-bold text-white shadow-lg shadow-green-500/20"
                     style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)' }}>P</div>
                <div className="px-5 py-4 rounded-2xl rounded-tl-sm flex items-center gap-1.5 shadow-lg"
                     style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(16px)' }}>
                  {[0, 150, 300].map((delay, i) => (
                    <div key={i} className="w-2 h-2 rounded-full bg-green-400"
                         style={{ animation: `bounce 1.2s ease-in-out ${delay}ms infinite` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="px-6 pb-6 space-y-4">
            {/* ── Chat Input ── */}
            <div className="flex gap-2 relative">
              <input
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="Message Priya..."
                className="flex-1 pl-5 pr-14 py-3.5 rounded-2xl text-sm text-white placeholder-white/40 outline-none transition-all shadow-lg"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(12px)' }}
              />
              <button
                onClick={handleSend}
                disabled={isTyping || !inputText.trim()}
                className="absolute right-1.5 top-1.5 bottom-1.5 px-5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105 active:scale-95 shadow-lg shadow-green-500/20"
                style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)' }}
              >
                {isTyping ? '...' : 'Send'}
              </button>
            </div>

            {/* ── Registration Form ── */}
            <div className="p-5 rounded-2xl shadow-xl"
                 style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)' }}>
              
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-white/[0.08]" />
                <span className="text-[11px] text-green-400 font-bold uppercase tracking-widest">
                  Quick Registration
                </span>
                <div className="flex-1 h-px bg-white/[0.08]" />
              </div>

              <form onSubmit={handleRegister} className="grid grid-cols-2 gap-3">
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Full Name *"
                  className="col-span-2 md:col-span-1 px-4 py-3 rounded-xl text-sm text-white placeholder-white/30 outline-none transition-all focus:ring-1 focus:ring-green-500/50"
                  style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)' }}
                />
                <input
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="Email Address *"
                  type="email"
                  className="col-span-2 md:col-span-1 px-4 py-3 rounded-xl text-sm text-white placeholder-white/30 outline-none transition-all focus:ring-1 focus:ring-green-500/50"
                  style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)' }}
                />
                <input
                  value={form.skills}
                  onChange={e => setForm(f => ({ ...f, skills: e.target.value }))}
                  placeholder="Your Skills (e.g. Teaching, Mentoring, IT) *"
                  className="col-span-2 px-4 py-3 rounded-xl text-sm text-white placeholder-white/30 outline-none transition-all focus:ring-1 focus:ring-green-500/50"
                  style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)' }}
                />

                {formError && (
                  <p className="col-span-2 text-red-400 text-xs font-medium pl-1 animate-pulse">⚠️ {formError}</p>
                )}

                <button
                  type="submit"
                  disabled={formLoading}
                  className="col-span-2 mt-1 py-3.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50 hover:shadow-green-500/40 hover:scale-[1.01] active:scale-[0.99] shadow-xl"
                  style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)', boxShadow: '0 8px 25px -5px rgba(34,197,94,0.4)' }}
                >
                  {formLoading ? (
                    <>
                      <div className="w-5 h-5 rounded-full border-[3px] border-white/30 border-t-white animate-spin" />
                      <span>Registering...</span>
                    </>
                  ) : '🌟 Join NayePankh Foundation'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatAgent;
