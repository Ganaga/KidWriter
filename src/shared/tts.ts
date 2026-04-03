const TTS_KEY = 'kidwriter_tts_enabled';

let frenchVoice: SpeechSynthesisVoice | null = null;
let voicesLoaded = false;

function loadVoices(): void {
  const voices = speechSynthesis.getVoices();
  frenchVoice = voices.find((v) => v.lang.startsWith('fr')) ?? null;
  voicesLoaded = true;
}

// Voices may load async
if (typeof speechSynthesis !== 'undefined') {
  loadVoices();
  speechSynthesis.addEventListener('voiceschanged', loadVoices);
}

export function isTtsEnabled(): boolean {
  return localStorage.getItem(TTS_KEY) !== 'false';
}

export function toggleTts(): boolean {
  const newState = !isTtsEnabled();
  localStorage.setItem(TTS_KEY, String(newState));
  if (!newState) {
    speechSynthesis.cancel();
  }
  return newState;
}

export function speak(text: string): void {
  if (!isTtsEnabled()) return;
  if (typeof speechSynthesis === 'undefined') return;

  if (!voicesLoaded) loadVoices();

  speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'fr-FR';
  if (frenchVoice) {
    utterance.voice = frenchVoice;
  }
  utterance.rate = 0.9;
  utterance.pitch = 1.1;

  speechSynthesis.speak(utterance);
}

export function speakSpellingError(word: string, suggestion: string | undefined): void {
  if (suggestion) {
    speak(`Le mot ${word} est mal écrit. Essaie ${suggestion}.`);
  } else {
    speak(`Le mot ${word} semble mal écrit.`);
  }
}

export function speakGrammarError(message: string): void {
  speak(message);
}

export function hasTtsSupport(): boolean {
  return typeof speechSynthesis !== 'undefined';
}
