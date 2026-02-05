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
