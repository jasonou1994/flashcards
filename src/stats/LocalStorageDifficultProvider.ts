import type { DifficultProvider } from './DifficultProvider';

const PREFIX = 'flashcards:difficult:v1:';

export class LocalStorageDifficultProvider implements DifficultProvider {
  private getKey(deckId: string): string {
    return `${PREFIX}${deckId}`;
  }

  private readSet(deckId: string): Set<string> {
    try {
      const raw = window.localStorage.getItem(this.getKey(deckId));
      if (!raw) return new Set<string>();
      const arr = JSON.parse(raw);
      if (!Array.isArray(arr)) return new Set<string>();
      return new Set<string>(arr.filter((x) => typeof x === 'string'));
    } catch {
      return new Set<string>();
    }
  }

  private writeSet(deckId: string, set: Set<string>): void {
    try {
      const arr = Array.from(set);
      window.localStorage.setItem(this.getKey(deckId), JSON.stringify(arr));
    } catch {
      // noop
    }
  }

  isDifficult(deckId: string, cardId: string): boolean {
    const set = this.readSet(deckId);
    return set.has(cardId);
  }

  toggleDifficult(deckId: string, cardId: string): boolean {
    const set = this.readSet(deckId);
    if (set.has(cardId)) {
      set.delete(cardId);
      this.writeSet(deckId, set);
      return false;
    }
    set.add(cardId);
    this.writeSet(deckId, set);
    return true;
  }

  getDifficult(deckId: string): Set<string> {
    return this.readSet(deckId);
  }
}
