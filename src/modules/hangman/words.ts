export interface HangmanWord {
  word: string;
  hint: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export const WORDS: HangmanWord[] = [
  // ─── EASY (3-5 letters) ────────────────────────
  { word: 'chat', hint: 'Animal qui miaule', difficulty: 'easy' },
  { word: 'chien', hint: 'Animal qui aboie', difficulty: 'easy' },
  { word: 'lune', hint: 'Astre de la nuit', difficulty: 'easy' },
  { word: 'soleil', hint: 'Astre du jour', difficulty: 'easy' },
  { word: 'pomme', hint: 'Fruit rouge ou vert', difficulty: 'easy' },
  { word: 'fleur', hint: 'Pousse dans le jardin', difficulty: 'easy' },
  { word: 'arbre', hint: 'A des feuilles et des branches', difficulty: 'easy' },
  { word: 'pain', hint: 'Le boulanger en fait', difficulty: 'easy' },
  { word: 'eau', hint: 'On la boit', difficulty: 'easy' },
  { word: 'mer', hint: 'Très grande étendue d\'eau salée', difficulty: 'easy' },
  { word: 'lait', hint: 'Boisson blanche de la vache', difficulty: 'easy' },
  { word: 'roi', hint: 'Il porte une couronne', difficulty: 'easy' },
  { word: 'feu', hint: 'C\'est chaud et ça brûle', difficulty: 'easy' },
  { word: 'nuit', hint: 'Quand on dort', difficulty: 'easy' },
  { word: 'jour', hint: 'Quand le soleil brille', difficulty: 'easy' },
  { word: 'main', hint: 'On a cinq doigts dessus', difficulty: 'easy' },
  { word: 'pied', hint: 'Sert à marcher', difficulty: 'easy' },
  { word: 'tete', hint: 'En haut du corps', difficulty: 'easy' },
  { word: 'oeil', hint: 'Sert à voir', difficulty: 'easy' },
  { word: 'nez', hint: 'Sert à sentir', difficulty: 'easy' },

  // ─── MEDIUM (6-8 letters) ──────────────────────
  { word: 'maison', hint: 'On y habite', difficulty: 'medium' },
  { word: 'jardin', hint: 'Espace vert avec des fleurs', difficulty: 'medium' },
  { word: 'voiture', hint: 'A quatre roues et un moteur', difficulty: 'medium' },
  { word: 'oiseau', hint: 'Animal qui vole et qui chante', difficulty: 'medium' },
  { word: 'poisson', hint: 'Vit dans l\'eau et a des nageoires', difficulty: 'medium' },
  { word: 'bateau', hint: 'Flotte sur l\'eau', difficulty: 'medium' },
  { word: 'cheval', hint: 'Grand animal qu\'on monte', difficulty: 'medium' },
  { word: 'lapin', hint: 'Petit animal aux longues oreilles', difficulty: 'medium' },
  { word: 'banane', hint: 'Fruit jaune des singes', difficulty: 'medium' },
  { word: 'orange', hint: 'Fruit et couleur', difficulty: 'medium' },
  { word: 'fraise', hint: 'Petit fruit rouge', difficulty: 'medium' },
  { word: 'cerise', hint: 'Petit fruit rouge avec un noyau', difficulty: 'medium' },
  { word: 'gateau', hint: 'On en mange à son anniversaire', difficulty: 'medium' },
  { word: 'fromage', hint: 'Aliment fait avec du lait', difficulty: 'medium' },
  { word: 'biscuit', hint: 'Petit gâteau sec', difficulty: 'medium' },
  { word: 'crayon', hint: 'Sert à écrire ou dessiner', difficulty: 'medium' },
  { word: 'cahier', hint: 'On y écrit ses leçons', difficulty: 'medium' },
  { word: 'tableau', hint: 'La maîtresse écrit dessus', difficulty: 'medium' },
  { word: 'ecole', hint: 'Là où on apprend', difficulty: 'medium' },
  { word: 'eleve', hint: 'Enfant qui va à l\'école', difficulty: 'medium' },
  { word: 'fenetre', hint: 'On regarde dehors à travers', difficulty: 'medium' },
  { word: 'cuisine', hint: 'Pièce où on cuisine', difficulty: 'medium' },
  { word: 'chambre', hint: 'Pièce où on dort', difficulty: 'medium' },
  { word: 'famille', hint: 'Papa, maman et les enfants', difficulty: 'medium' },
  { word: 'dragon', hint: 'Créature qui crache du feu', difficulty: 'medium' },

  // ─── HARD (9+ letters) ─────────────────────────
  { word: 'elephant', hint: 'Très gros animal avec une trompe', difficulty: 'hard' },
  { word: 'girafe', hint: 'Animal au très long cou', difficulty: 'hard' },
  { word: 'crocodile', hint: 'Reptile dangereux des rivières', difficulty: 'hard' },
  { word: 'papillon', hint: 'Insecte aux ailes colorées', difficulty: 'hard' },
  { word: 'escargot', hint: 'Animal lent avec une coquille', difficulty: 'hard' },
  { word: 'chocolat', hint: 'Confiserie marron très bonne', difficulty: 'hard' },
  { word: 'spaghetti', hint: 'Longues pâtes italiennes', difficulty: 'hard' },
  { word: 'champignon', hint: 'Pousse dans la forêt', difficulty: 'hard' },
  { word: 'parapluie', hint: 'Protège de la pluie', difficulty: 'hard' },
  { word: 'ordinateur', hint: 'Machine pour jouer ou travailler', difficulty: 'hard' },
  { word: 'television', hint: 'On regarde des films dessus', difficulty: 'hard' },
  { word: 'telephone', hint: 'Sert à appeler', difficulty: 'hard' },
  { word: 'bibliotheque', hint: 'Lieu plein de livres', difficulty: 'hard' },
  { word: 'restaurant', hint: 'On y va pour manger', difficulty: 'hard' },
  { word: 'aeroport', hint: 'Là où décollent les avions', difficulty: 'hard' },
  { word: 'montagne', hint: 'Très haut relief de la nature', difficulty: 'hard' },
  { word: 'automne', hint: 'Saison où les feuilles tombent', difficulty: 'hard' },
  { word: 'printemps', hint: 'Saison des fleurs', difficulty: 'hard' },
  { word: 'dinosaure', hint: 'Animal préhistorique géant', difficulty: 'hard' },
  { word: 'astronaute', hint: 'Voyage dans l\'espace', difficulty: 'hard' },
];

export function getRandomWord(difficulty: 'easy' | 'medium' | 'hard', excludeWords: string[]): HangmanWord | null {
  const available = WORDS.filter((w) => w.difficulty === difficulty && !excludeWords.includes(w.word));
  if (available.length === 0) return null;
  return available[Math.floor(Math.random() * available.length)]!;
}
