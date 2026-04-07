export type WordStatus = 'correct' | 'incorrect' | 'pending' | 'typing';

export interface ComparisonResult {
  expected: string;
  typed: string;
  status: WordStatus;
}

function stripAccents(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ç/gi, 'c').replace(/œ/gi, 'oe').replace(/æ/gi, 'ae');
}

function stripTrailingPunctuation(str: string): string {
  return str.replace(/[.,!?;:]+$/, '');
}

function matchWord(typed: string, expected: string, ignoreAccents: boolean): boolean {
  let a = ignoreAccents ? stripAccents(typed.toLowerCase()) : typed.toLowerCase();
  let b = ignoreAccents ? stripAccents(expected.toLowerCase()) : expected.toLowerCase();
  a = stripTrailingPunctuation(a);
  b = stripTrailingPunctuation(b);
  return a === b;
}

// Live comparison while typing — last word without trailing space stays 'typing'
export function compareWords(expected: string, typed: string, ignoreAccents = false): ComparisonResult[] {
  const expectedWords = expected.trim().split(/\s+/);
  const typedWords = typed.trim().split(/\s+/).filter((w) => w.length > 0);
  const typedEndsWithSpace = typed.endsWith(' ');

  return expectedWords.map((exp, i) => {
    if (i >= typedWords.length) {
      return { expected: exp, typed: '', status: 'pending' as const };
    }
    const tw = typedWords[i]!;
    const isLastTypedWord = i === typedWords.length - 1;

    // Last typed word without space after it → still typing
    if (isLastTypedWord && !typedEndsWithSpace) {
      return { expected: exp, typed: tw, status: 'typing' as const };
    }

    const correct = matchWord(tw, exp, ignoreAccents);
    return { expected: exp, typed: tw, status: correct ? 'correct' as const : 'incorrect' as const };
  });
}

// Force-evaluate all words (called on Enter or "Corriger" button)
export function finalizeResults(expected: string, typed: string, ignoreAccents = false): ComparisonResult[] {
  const expectedWords = expected.trim().split(/\s+/);
  const typedWords = typed.trim().split(/\s+/).filter((w) => w.length > 0);

  return expectedWords.map((exp, i) => {
    if (i >= typedWords.length) {
      return { expected: exp, typed: '', status: 'incorrect' as const };
    }
    const tw = typedWords[i]!;
    const correct = matchWord(tw, exp, ignoreAccents);
    return { expected: exp, typed: tw, status: correct ? 'correct' as const : 'incorrect' as const };
  });
}

export function getScore(results: ComparisonResult[]): { correct: number; total: number } {
  const total = results.length;
  const correct = results.filter((r) => r.status === 'correct').length;
  return { correct, total };
}

export function isComplete(results: ComparisonResult[]): boolean {
  return results.length > 0 && results.every((r) => r.status === 'correct' || r.status === 'incorrect');
}

export function isPerfect(results: ComparisonResult[]): boolean {
  return results.every((r) => r.status === 'correct');
}

export function getErrorRate(results: ComparisonResult[]): number {
  const { correct, total } = getScore(results);
  if (total === 0) return 0;
  return (total - correct) / total;
}
