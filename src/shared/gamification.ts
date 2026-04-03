import type { Achievement, Level } from '../types';
import { updateState, getState } from './storage';

export const LEVELS: Level[] = [
  { name: 'Débutant', minPoints: 0 },
  { name: 'Apprenti', minPoints: 100 },
  { name: 'Explorateur', minPoints: 300 },
  { name: 'Aventurier', minPoints: 600 },
  { name: 'Champion', minPoints: 1000 },
  { name: 'Maître des mots', minPoints: 1500 },
  { name: 'Légendaire', minPoints: 2500 },
];

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-story',
    name: 'Auteur en herbe',
    description: 'Écris ta première histoire',
    icon: '📝',
    check: (s) => s.writing.stories.length >= 1,
  },
  {
    id: 'novelist',
    name: 'Romancier',
    description: 'Écris une histoire de plus de 100 mots',
    icon: '📖',
    check: (s) => s.writing.stories.some((st) => st.wordCount >= 100),
  },
  {
    id: 'great-writer',
    name: 'Grand écrivain',
    description: 'Écris une histoire de plus de 500 mots',
    icon: '✒️',
    check: (s) => s.writing.stories.some((st) => st.wordCount >= 500),
  },
  {
    id: 'zero-fault',
    name: 'Zéro faute',
    description: 'Écris un texte sans aucune erreur',
    icon: '🏆',
    check: (s) => s.gamification.achievements.includes('zero-fault'),
  },
  {
    id: 'fixer-10',
    name: 'Correcteur',
    description: 'Corrige 10 fautes',
    icon: '🔧',
    check: (s) => s.writing.totalCorrections >= 10,
  },
  {
    id: 'grammar-fixer-10',
    name: 'Grammairien',
    description: 'Corrige 10 fautes de grammaire',
    icon: '📐',
    check: (s) => s.writing.grammarCorrections >= 10,
  },
  {
    id: 'rich-vocab',
    name: 'Vocabulaire riche',
    description: 'Utilise 100 mots différents dans une histoire',
    icon: '🌟',
    check: (s) => {
      return s.writing.stories.some((st) => {
        const words = st.content.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
        return new Set(words).size >= 100;
      });
    },
  },
  {
    id: 'streak-7',
    name: 'Fidèle',
    description: 'Utilise KidWriter 7 jours de suite',
    icon: '🔥',
    check: (s) => s.gamification.dailyStreak >= 7,
  },
  {
    id: 'streak-30',
    name: 'Inarrêtable',
    description: 'Utilise KidWriter 30 jours de suite',
    icon: '💎',
    check: (s) => s.gamification.dailyStreak >= 30,
  },
  {
    id: 'library',
    name: 'Bibliothèque',
    description: 'Écris 10 histoires',
    icon: '📚',
    check: (s) => s.writing.stories.length >= 10,
  },
];

function computeLevel(points: number): number {
  let level = 1;
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (points >= LEVELS[i]!.minPoints) {
      level = i + 1;
      break;
    }
  }
  return level;
}

export function getCurrentLevel(): Level {
  const state = getState();
  return LEVELS[state.gamification.level - 1] ?? LEVELS[0]!;
}

export function getNextLevel(): Level | null {
  const state = getState();
  return LEVELS[state.gamification.level] ?? null;
}

export function addPoints(amount: number): { newAchievements: Achievement[]; leveledUp: boolean } {
  let leveledUp = false;
  const newAchievements: Achievement[] = [];

  updateState((state) => {
    state.gamification.totalPoints += amount;
    const newLevel = computeLevel(state.gamification.totalPoints);
    if (newLevel > state.gamification.level) {
      leveledUp = true;
    }
    state.gamification.level = newLevel;

    for (const achievement of ACHIEVEMENTS) {
      if (!state.gamification.achievements.includes(achievement.id) && achievement.check(state)) {
        state.gamification.achievements.push(achievement.id);
        newAchievements.push(achievement);
      }
    }
  });

  return { newAchievements, leveledUp };
}

export function recordCorrection(isGrammar: boolean): void {
  updateState((state) => {
    state.writing.totalCorrections += 1;
    if (isGrammar) {
      state.writing.grammarCorrections += 1;
    }
  });
}

export function awardZeroFault(): void {
  updateState((state) => {
    if (!state.gamification.achievements.includes('zero-fault')) {
      state.gamification.achievements.push('zero-fault');
    }
  });
}

export function updateDailyStreak(): void {
  updateState((state) => {
    const today = new Date().toISOString().slice(0, 10);
    const last = state.gamification.lastActiveDate;

    if (last === today) return;

    if (last) {
      const lastDate = new Date(last);
      const todayDate = new Date(today);
      const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / 86400000);

      if (diffDays === 1) {
        state.gamification.dailyStreak += 1;
      } else if (diffDays > 2) {
        state.gamification.dailyStreak = 1;
      }
    } else {
      state.gamification.dailyStreak = 1;
    }

    state.gamification.lastActiveDate = today;

    if (!state.gamification.dailyActivity[today]) {
      state.gamification.dailyActivity[today] = { wordsWritten: 0 };
      state.gamification.totalPoints += 20;
      state.gamification.level = computeLevel(state.gamification.totalPoints);
    }
  });
}

export function recordWritingActivity(words: number): void {
  updateState((state) => {
    const today = new Date().toISOString().slice(0, 10);
    if (!state.gamification.dailyActivity[today]) {
      state.gamification.dailyActivity[today] = { wordsWritten: 0 };
    }
    state.gamification.dailyActivity[today]!.wordsWritten += words;
  });
}
