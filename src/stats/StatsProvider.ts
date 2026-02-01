export type CardStats = {
  success: number;
  failure: number;
};

export interface StatsProvider {
  incrementSuccess(cardId: string): void;
  incrementFailure(cardId: string): void;
  decrementSuccess(cardId: string): void;
  decrementFailure(cardId: string): void;
  getCounts(cardId: string): CardStats;
}
