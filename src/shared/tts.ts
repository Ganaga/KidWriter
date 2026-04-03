const TTS_KEY = 'kidwriter_tts_enabled';

let frenchVoice: SpeechSynthesisVoice | null = null;

function findFrenchVoice(): void {
  if (typeof speechSynthesis === 'undefined') return;
  const voices = speechSynthesis.getVoices();
  frenchVoice = voices.find((v) => v.lang.startsWith('fr')) ?? null;
}

// Voices load asynchronously on most browsers
if (typeof speechSynthesis !== 'undefined') {
  findFrenchVoice();
  speechSynthesis.addEventListener('voiceschanged', findFrenchVoice);
}

export function isTtsEnabled(): boolean {
  return localStorage.getItem(TTS_KEY) !== 'false';
}

export function toggleTts(): boolean {
  const newState = !isTtsEnabled();
  localStorage.setItem(TTS_KEY, String(newState));
  if (!newState && typeof speechSynthesis !== 'undefined') {
    speechSynthesis.cancel();
  }
  return newState;
}

export function speak(text: string): void {
  if (!isTtsEnabled()) return;
  if (typeof speechSynthesis === 'undefined') return;

  // Refresh voices if not found yet
  if (!frenchVoice) findFrenchVoice();

  // Chrome bug: cancel() then immediate speak() can fail.
  // Use a small delay to work around it.
  speechSynthesis.cancel();

  setTimeout(() => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fr-FR';
    if (frenchVoice) {
      utterance.voice = frenchVoice;
    }
    utterance.rate = 0.9;
    utterance.pitch = 1.1;
    utterance.volume = 1;

    speechSynthesis.speak(utterance);
  }, 50);
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
