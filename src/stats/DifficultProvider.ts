export interface DifficultProvider {
  isDifficult(deckId: string, cardId: string): boolean;
  toggleDifficult(deckId: string, cardId: string): boolean;
  getDifficult(deckId: string): Set<string>;
}
