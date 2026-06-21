/**
 * speechSynthesisService.ts
 * Web Speech API TTS — drives avatar lip-sync via a store flag.
 * No server dependency: works in all modern browsers.
 */

let currentUtterance: SpeechSynthesisUtterance | null = null;
let onSpeakingChange: ((speaking: boolean) => void) | null = null;

/** Register a callback so the avatar store can track speaking state */
export function onSpeakingStateChange(cb: (speaking: boolean) => void) {
  onSpeakingChange = cb;
}

/** Strip action tags like <<HAPPY>> and emoji before speaking */
function cleanText(text: string): string {
  return text
    .replace(/<<[A-Z_]+>>/g, '')
    .replace(/[🌟💚🙌🎉✨🤝]/gu, '')
    .trim();
}

/** Pick the best available English female voice */
function getBestVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  const preferred = [
    'Microsoft Zira',
    'Microsoft Zira Desktop',
    'Microsoft Heera',
    'Microsoft Hazel Desktop',
    'Google UK English Female',
    'Google US English Female',
    'Samantha',
    'Karen',
    'Tessa',
    'Victoria',
    'Veena',
    'Lekha'
  ];

  // 1. Exact match from our preferred female voice list
  for (const name of preferred) {
    const v = voices.find(v => v.name.includes(name));
    if (v) return v;
  }

  // 2. Any voice explicitly containing "female" in the name or uri
  const femaleVoice = voices.find(v => 
    v.lang.startsWith('en') && 
    (v.name.toLowerCase().includes('female') || v.voiceURI.toLowerCase().includes('female'))
  );
  if (femaleVoice) return femaleVoice;

  // 3. Last resort fallback
  return voices.find(v => v.lang.startsWith('en')) || voices[0] || null;
}

/** Speak text and toggle avatar lip-sync via the callback */
export function speak(text: string, rate = 1.0, pitch = 1.05): void {
  if (!('speechSynthesis' in window)) return;

  stop();

  const cleaned = cleanText(text);
  if (!cleaned) return;

  currentUtterance = new SpeechSynthesisUtterance(cleaned);
  currentUtterance.rate  = rate;
  currentUtterance.pitch = pitch;
  currentUtterance.volume = 1.0;

  // Voice may not load immediately — use a short delay if empty
  const applyVoice = () => {
    const voice = getBestVoice();
    if (voice && currentUtterance) currentUtterance.voice = voice;
  };

  if (window.speechSynthesis.getVoices().length > 0) {
    applyVoice();
  } else {
    window.speechSynthesis.onvoiceschanged = applyVoice;
  }

  currentUtterance.onstart = () => onSpeakingChange?.(true);
  currentUtterance.onend   = () => onSpeakingChange?.(false);
  currentUtterance.onerror = () => onSpeakingChange?.(false);

  window.speechSynthesis.speak(currentUtterance);
}

/** Cancel any ongoing speech */
export function stop(): void {
  window.speechSynthesis.cancel();
  onSpeakingChange?.(false);
  currentUtterance = null;
}

export function isSpeaking(): boolean {
  return window.speechSynthesis.speaking;
}
