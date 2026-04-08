import { navigate } from '../../router';
import { updateState } from '../../shared/storage';
import { addPoints } from '../../shared/gamification';
import { fireConfetti, fireStars, showNotification } from '../../shared/animations';
import { playKeySound, playAchievement } from '../../shared/audio';
import { renderMascot } from '../../shared/mascot';
import { speak } from '../../shared/tts';
import { getRandomWord, type HangmanWord } from './words';
import './hangman.css';

type Difficulty = 'easy' | 'medium' | 'hard';
const MAX_ERRORS = 7;

interface HangmanState {
  difficulty: Difficulty;
  word: HangmanWord;
  guessedLetters: Set<string>;
  errors: number;
  done: boolean;
  won: boolean;
  playedWords: string[];
}

let session: HangmanState | null = null;

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz'.split('');

function normalize(letter: string): string {
  return letter.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function renderDifficultySelect(container: HTMLElement): void {
  container.innerHTML = `
    <div class="hangman-page fade-in">
      <button class="back-btn" id="btn-back-hang">← Retour</button>
      <h1>🎯 Le Pendu</h1>

      <div class="hangman-intro">
        ${renderMascot('happy', 100)}
        <p>Devine le mot lettre par lettre !</p>
      </div>

      <div class="difficulty-selector">
        <button class="difficulty-btn difficulty-easy" data-diff="easy">
          <span class="difficulty-icon">🌱</span>
          <span class="difficulty-label">Facile</span>
          <span class="difficulty-desc">Mots courts</span>
        </button>
        <button class="difficulty-btn difficulty-medium" data-diff="medium">
          <span class="difficulty-icon">🌿</span>
          <span class="difficulty-label">Moyen</span>
          <span class="difficulty-desc">Mots moyens</span>
        </button>
        <button class="difficulty-btn difficulty-hard" data-diff="hard">
          <span class="difficulty-icon">🌳</span>
          <span class="difficulty-label">Difficile</span>
          <span class="difficulty-desc">Mots longs</span>
        </button>
      </div>
    </div>
  `;

  document.getElementById('btn-back-hang')?.addEventListener('click', () => navigate(''));

  container.querySelectorAll('.difficulty-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const diff = btn.getAttribute('data-diff') as Difficulty;
      startGame(container, diff);
    });
  });
}

function startGame(container: HTMLElement, difficulty: Difficulty): void {
  const word = getRandomWord(difficulty, session?.playedWords ?? []);
  if (!word) {
    showNotification('Tous les mots ont été joués !', '🎉');
    renderDifficultySelect(container);
    return;
  }

  session = {
    difficulty,
    word,
    guessedLetters: new Set(),
    errors: 0,
    done: false,
    won: false,
    playedWords: session?.playedWords ?? [],
  };

  renderGame(container);
  setTimeout(() => speak(word.word), 300);
}

function renderHangmanSvg(errors: number): string {
  const parts = [
    // Base
    '<line x1="10" y1="180" x2="100" y2="180" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>',
    // Pole
    '<line x1="30" y1="180" x2="30" y2="20" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>',
    // Top
    '<line x1="30" y1="20" x2="100" y2="20" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>',
    // Rope
    '<line x1="100" y1="20" x2="100" y2="40" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>',
    // Head
    '<circle cx="100" cy="55" r="15" fill="none" stroke="currentColor" stroke-width="3"/>',
    // Body
    '<line x1="100" y1="70" x2="100" y2="120" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>',
    // Arms
    '<line x1="100" y1="85" x2="80" y2="105" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><line x1="100" y1="85" x2="120" y2="105" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>',
    // Legs
    '<line x1="100" y1="120" x2="85" y2="150" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><line x1="100" y1="120" x2="115" y2="150" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>',
  ];

  const visible = parts.slice(0, errors).join('');
  return `<svg viewBox="0 0 140 200" class="hangman-svg">${visible}</svg>`;
}

function renderWordDisplay(): string {
  if (!session) return '';
  return session.word.word
    .split('')
    .map((letter) => {
      const norm = normalize(letter);
      const guessed = session!.guessedLetters.has(norm) || session!.done;
      return `<span class="hangman-letter ${guessed ? 'revealed' : ''}">${guessed ? letter : '_'}</span>`;
    })
    .join('');
}

function renderKeyboard(): string {
  if (!session) return '';
  return ALPHABET.map((l) => {
    const guessed = session!.guessedLetters.has(l);
    const wordLetters = session!.word.word.split('').map(normalize);
    const isCorrect = guessed && wordLetters.includes(l);
    const isWrong = guessed && !wordLetters.includes(l);
    const cls = isCorrect ? 'letter-correct' : isWrong ? 'letter-wrong' : '';
    return `<button class="hangman-key ${cls}" data-letter="${l}" ${guessed || session!.done ? 'disabled' : ''}>${l.toUpperCase()}</button>`;
  }).join('');
}

function checkWin(): boolean {
  if (!session) return false;
  return session.word.word.split('').every((letter) => session!.guessedLetters.has(normalize(letter)));
}

function guessLetter(container: HTMLElement, letter: string): void {
  if (!session || session.done) return;
  if (session.guessedLetters.has(letter)) return;

  session.guessedLetters.add(letter);

  const wordLetters = session.word.word.split('').map(normalize);
  const isInWord = wordLetters.includes(letter);

  if (!isInWord) {
    session.errors += 1;
    playKeySound(false);
  } else {
    playKeySound(true);
  }

  // Check win
  if (checkWin()) {
    session.done = true;
    session.won = true;
    session.playedWords.push(session.word.word);
    updateState((s) => { s.hangman.wordsWon += 1; });
    fireConfetti();
    playAchievement();
    speak(`Bravo ! Le mot était ${session.word.word}`);
    addPoints(session.errors === 0 ? 5 : Math.max(1, 5 - session.errors));
  } else if (session.errors >= MAX_ERRORS) {
    session.done = true;
    session.won = false;
    session.playedWords.push(session.word.word);
    updateState((s) => { s.hangman.wordsLost += 1; });
    speak(`Dommage ! Le mot était ${session.word.word}`);
  }

  renderGame(container);
}

function renderGame(container: HTMLElement): void {
  if (!session) return;

  const remainingErrors = MAX_ERRORS - session.errors;

  let resultHtml = '';
  if (session.done) {
    const pose = session.won ? 'ecstatic' : 'unhappy';
    const title = session.won ? 'Bravo !' : 'Dommage...';
    const message = session.won ? 'Tu as trouvé le mot !' : `Le mot était : <strong>${session.word.word}</strong>`;
    resultHtml = `
      <div class="hangman-result">
        ${renderMascot(pose, 80)}
        <h2>${title}</h2>
        <p>${message}</p>
        <button class="btn btn-primary" id="btn-next-word">Mot suivant →</button>
      </div>
    `;
  }

  container.innerHTML = `
    <div class="hangman-page fade-in">
      <button class="back-btn" id="btn-back-game">← Changer de niveau</button>

      <div class="hangman-game">
        <div class="hangman-drawing">
          ${renderHangmanSvg(session.errors)}
          <span class="hangman-tries">${remainingErrors} essai${remainingErrors > 1 ? 's' : ''}</span>
        </div>

        <div class="hangman-info">
          <p class="hangman-hint">💡 ${session.word.hint}</p>
          <button class="btn btn-ghost" id="btn-replay-word">🔊 Réécouter</button>
        </div>
      </div>

      <div class="hangman-word">${renderWordDisplay()}</div>

      ${resultHtml}

      <div class="hangman-keyboard">
        ${renderKeyboard()}
      </div>
    </div>
  `;

  document.getElementById('btn-back-game')?.addEventListener('click', () => {
    session = null;
    renderDifficultySelect(container);
  });

  document.getElementById('btn-replay-word')?.addEventListener('click', () => {
    if (session) speak(session.word.word);
  });

  document.getElementById('btn-next-word')?.addEventListener('click', () => {
    if (session) startGame(container, session.difficulty);
  });

  container.querySelectorAll('.hangman-key').forEach((btn) => {
    btn.addEventListener('click', () => {
      const letter = btn.getAttribute('data-letter')!;
      guessLetter(container, letter);
    });
  });

  // Physical keyboard support
  if (!session.done) {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k.length === 1 && /[a-z]/.test(k)) {
        guessLetter(container, k);
      }
    };
    document.addEventListener('keydown', onKey);
    // Cleanup on next render — store on session
    (session as any).keyHandler = onKey;
  }
}

export function renderHangman(container: HTMLElement): (() => void) {
  session = null;
  renderDifficultySelect(container);
  return () => {
    if (session && (session as any).keyHandler) {
      document.removeEventListener('keydown', (session as any).keyHandler);
    }
    session = null;
  };
}

// Note: fireStars unused but imported to avoid linter complaint
void fireStars;
