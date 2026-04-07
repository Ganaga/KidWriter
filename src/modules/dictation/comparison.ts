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

    // The word is still being typed if:
    // - it's the last typed word AND
    // - there's no space after it AND
    // - the typed word is shorter than the expected word (still typing)
    //   OR it could still become correct (starts matching)
    if (isLastTypedWord && !typedEndsWithSpace) {
      const isLastExpectedWord = i === expectedWords.length - 1;
      if (!isLastExpectedWord) {
        return { expected: exp, typed: tw, status: 'typing' as const };
      }
      // Last expected word: compare without trailing punctuation for length check
      const expCore = stripTrailingPunctuation(exp);
      if (tw.length < expCore.length) {
        return { expected: exp, typed: tw, status: 'typing' as const };
      }
    }

    // Compare: strip trailing punctuation so missing "." at end is not an error
    let a = ignoreAccents ? stripAccents(tw.toLowerCase()) : tw.toLowerCase();
    let b = ignoreAccents ? stripAccents(exp.toLowerCase()) : exp.toLowerCase();
    a = stripTrailingPunctuation(a);
    b = stripTrailingPunctuation(b);
    const match = a === b;
    return { expected: exp, typed: tw, status: match ? 'correct' as const : 'incorrect' as const };
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
