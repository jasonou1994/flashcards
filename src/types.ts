// Card data types
export interface CardItem {
  id: string;
  japanese: string;
  hiragana: string;
  english: string;
  japanese_example?: string;
  english_example?: string;
}

export interface CardStats {
  success: number;
  failure: number;
}

export interface CardRecord extends CardStats {
  difficult: boolean;
}

export interface CardDataProvider {
  // Stats
  incrementSuccess(cardId: string): void;
  incrementFailure(cardId: string): void;
  decrementSuccess(cardId: string): void;
  decrementFailure(cardId: string): void;
  getCounts(cardId: string): CardStats;
  // Bulk snapshot for performance-sensitive reads
  getAllRecords(): Record<string, CardRecord>;

  // Difficult (global)
  isDifficult(cardId: string): boolean;
  toggleDifficult(cardId: string): boolean; // returns new difficult state
  getDifficult(): Set<string>; // all difficult card ids
}

// Deck types
export interface DeckOption {
  name: string;
  key: string;
  loader: () => CardItem[];
}

// Front field options
export type FrontField = 'japanese' | 'english';

// Sidebar types
export interface SidebarProps {
  availableDecks: DeckOption[];
  selectedDeckKey: string;
  onSelectDeck: (key: string) => void;
  onStartRandom: () => void;
  randomCount: number;
  onChangeRandomCount: (n: number) => void;
  prioritizeDifficult: boolean;
  onTogglePrioritizeDifficult: (v: boolean) => void;
  frontField: FrontField;
  onChangeFrontField: (v: FrontField) => void;
}

// RandomControls types
export interface RandomControlsProps {
  onStartRandom: () => void;
  randomCount: number;
  onChangeRandomCount: (n: number) => void;
  prioritizeDifficult: boolean;
  onTogglePrioritizeDifficult: (v: boolean) => void;
}
