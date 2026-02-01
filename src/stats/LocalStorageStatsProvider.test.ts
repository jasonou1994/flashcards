import { LocalStorageStatsProvider } from './LocalStorageStatsProvider';

describe('LocalStorageStatsProvider', () => {
  let provider: LocalStorageStatsProvider;
  const cardId = 'test-card-123';

  beforeEach(() => {
    localStorage.clear();
    provider = new LocalStorageStatsProvider();
  });

  it('returns zero counts by default', () => {
    const counts = provider.getCounts(cardId);
    expect(counts).toEqual({ success: 0, failure: 0 });
  });

  it('increments success and persists', () => {
    provider.incrementSuccess(cardId);
    provider.incrementSuccess(cardId);
    const counts = provider.getCounts(cardId);
    expect(counts).toEqual({ success: 2, failure: 0 });
  });

  it('increments failure and persists', () => {
    provider.incrementFailure(cardId);
    const counts = provider.getCounts(cardId);
    expect(counts).toEqual({ success: 0, failure: 1 });
  });

  it('decrements success/failure without going below zero', () => {
    provider.incrementSuccess(cardId);
    provider.incrementFailure(cardId);
    provider.decrementSuccess(cardId);
    provider.decrementSuccess(cardId); // extra decrement should clamp to 0
    provider.decrementFailure(cardId);
    provider.decrementFailure(cardId); // extra decrement should clamp to 0
    const counts = provider.getCounts(cardId);
    expect(counts).toEqual({ success: 0, failure: 0 });
  });
});
