import React, { useEffect, useState, useMemo, useRef } from 'react';
import sampleDeck from '../decks/chapter1_1.json';
import { LocalStorageStatsProvider } from './stats/LocalStorageStatsProvider';
import type { CardStats } from './stats/StatsProvider';
import type { CardItem } from './utils';
import { validateDeckIds, aggregateAndDedupe as dedupeCards, shuffle, sampleN } from './utils';
import Card from './Card';
import { LocalStorageDifficultProvider } from './stats/LocalStorageDifficultProvider';

export type { CardItem };

// shuffle() moved to utils.ts

// Components extracted to ./HtmlOrText and ./Card

export default function App() {
  // discover decks from /decks using webpack require.context
  let deckContext: any = null;
  try {
    deckContext = (require as any).context('../decks', false, /\.json$/);
  } catch (e) {
    deckContext = null;
  }

  const availableDecks = useMemo(() => {
    if (!deckContext) return [{ name: 'default', key: '../deck.json', loader: () => sampleDeck as CardItem[] }];
    return deckContext.keys().map((k: string) => ({ name: k.replace(/^\.\//, ''), key: k, loader: () => deckContext(k) as CardItem[] }));
  }, []);

  const statsProvider = useMemo(() => new LocalStorageStatsProvider(), []);
  const difficultProvider = useMemo(() => new LocalStorageDifficultProvider(), []);
  // Track which card IDs have been counted in the current deck run
  const countedThisRun = useRef<Set<string>>(new Set());


  const RANDOM_KEY = '__random__';
  const [selectedDeckKey, setSelectedDeckKey] = useState<string>(() => (availableDecks[0] && availableDecks[0].key) || '../deck.json');
  const [randomCount, setRandomCount] = useState<number>(30);
  const [deck, setDeck] = useState<CardItem[]>(() => {
    // load initial deck
    try {
      if (deckContext && selectedDeckKey && selectedDeckKey !== '../deck.json') {
        const initial = deckContext(selectedDeckKey) as CardItem[];
        validateDeckIds(initial);
        return shuffle(initial);
      }
    } catch (e) {}
    const initial = sampleDeck as CardItem[];
    validateDeckIds(initial);
    return shuffle(initial);
  }); 

  const [flipped, setFlipped] = useState<boolean>(false);
  const [frontField, setFrontField] = useState<'japanese' | 'english'>('japanese');
  const [counts, setCounts] = useState<CardStats>({ success: 0, failure: 0 });
  const [difficult, setDifficult] = useState<boolean>(false);

  function aggregateAllAndDedupe(): CardItem[] {
    // Aggregate all cards across discovered decks and dedupe by any of the fields
    let all: CardItem[] = [];
    try {
      if (deckContext) {
        const keys: string[] = deckContext.keys();
        for (const k of keys) {
          const arr = deckContext(k) as CardItem[];
          if (Array.isArray(arr)) {
            all = all.concat(arr);
          }
        }
      } else {
        all = sampleDeck as CardItem[];
      }
    } catch {
      all = sampleDeck as CardItem[];
    }
    const deduped = dedupeCards(all);
    return deduped;
  }

  // sampleN() moved to utils.ts

  function startRandomDeck() {
    const deduped = aggregateAllAndDedupe();
    const sampled = sampleN<CardItem>(deduped, randomCount);
    setSelectedDeckKey(RANDOM_KEY);
    countedThisRun.current.clear();
    validateDeckIds(sampled);
    setDeck(shuffle(sampled));
    setFlipped(false);
  }

  // react to deck selection changes
  useEffect(() => {
    if (selectedDeckKey === RANDOM_KEY) {
      const deduped = aggregateAllAndDedupe();
      const sampled = sampleN<CardItem>(deduped, randomCount);
      countedThisRun.current.clear();
      validateDeckIds(sampled);
      setDeck(shuffle(sampled));
      setFlipped(false);
      return;
    }
    let loaded: CardItem[] = sampleDeck as CardItem[];
    try {
      if (deckContext && selectedDeckKey) {
        loaded = deckContext(selectedDeckKey) as CardItem[];
      }
    } catch (e) {
      loaded = sampleDeck as CardItem[];
    }
    countedThisRun.current.clear();
    validateDeckIds(loaded);
    setDeck(shuffle(loaded));
    setFlipped(false);
  }, [selectedDeckKey]);
  
  const current = deck[0];

  // Update counts when current card changes
  useEffect(() => {
    if (current && (current as any).id) {
      setCounts(statsProvider.getCounts((current as any).id));
    } else {
      setCounts({ success: 0, failure: 0 });
    }
  }, [current, statsProvider]);

  // Update difficult flag when current card or deck changes
  useEffect(() => {
    if (current && (current as any).id && selectedDeckKey) {
      setDifficult(difficultProvider.isDifficult(selectedDeckKey, (current as any).id as string));
    } else {
      setDifficult(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, selectedDeckKey]);

  function markKnown() {
    if (!current) return;
    // Record success for current card
    if ((current as any).id) {
      const id = (current as any).id as string;
      if (!countedThisRun.current.has(id)) {
        statsProvider.incrementSuccess(id);
        countedThisRun.current.add(id);
      }
    }
    const remaining = deck.slice(1);
    setDeck(remaining);
    setFlipped(false);
  }

  function markUnknown() {
    if (!current) return;
    // Record failure for current card
    if ((current as any).id) {
      const id = (current as any).id as string;
      if (!countedThisRun.current.has(id)) {
        statsProvider.incrementFailure(id);
        countedThisRun.current.add(id);
      }
    }
    // reinsert this card at random position after shuffling remaining
    const remaining = deck.slice(1);
    const newDeck = shuffle(remaining.concat(current));
    setDeck(newDeck);
    setFlipped(false);
  }
  

  // keyboard handlers: Space to flip, Enter to mark known
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        markKnown();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [deck, current]);

  if (!current) {
    return (
      <div className="app layout">
        <aside className="sidebar">
          <h3>Decks</h3>
          <ul>
            {availableDecks.map((d) => (
              <li key={d.key} className={d.key === selectedDeckKey ? 'active' : ''}>
                <button onClick={() => setSelectedDeckKey(d.key)}>{d.name}</button>
              </li>
            ))}
          </ul>
          <div className="random-controls">
            <h4>Random</h4>
            <div className="random-row">
              <button onClick={startRandomDeck}>Random</button>
              <label>
                Quantity
                <select value={randomCount} onChange={(e) => setRandomCount(parseInt(e.target.value))}>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={30}>30</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </label>
            </div>
          </div>
          <div className="front-toggle">
            <h4>Front Side</h4>
            <label>
              <input
                type="radio"
                name="frontSide"
                value="japanese"
                checked={frontField === 'japanese'}
                onChange={() => setFrontField('japanese')}
              />
              Japanese
            </label>
            <label>
              <input
                type="radio"
                name="frontSide"
                value="english"
                checked={frontField === 'english'}
                onChange={() => setFrontField('english')}
              />
              English
            </label>
          </div>
        </aside>
        <main className="main">
          <h1>All done 🎉</h1>
          <p>You completed the deck.</p>
          <button onClick={() => {
            if (selectedDeckKey === RANDOM_KEY) {
              const deduped = aggregateAllAndDedupe();
              const sampled = sampleN<CardItem>(deduped, randomCount);
              countedThisRun.current.clear();
              validateDeckIds(sampled);
              setDeck(shuffle(sampled));
              return;
            }
            try {
              const loaded = deckContext && selectedDeckKey ? (deckContext(selectedDeckKey) as CardItem[]) : (sampleDeck as CardItem[]);
              countedThisRun.current.clear();
              validateDeckIds(loaded);
              setDeck(shuffle(loaded));
            } catch (e) {
              const fallback = sampleDeck as CardItem[];
              countedThisRun.current.clear();
              validateDeckIds(fallback);
              setDeck(shuffle(fallback));
            }
          }}>Restart</button>
        </main>
      </div>
    );
  }

  return (
    <div className="app layout">
      <aside className="sidebar">
        <h3>Decks</h3>
        <ul>
          {availableDecks.map((d) => (
            <li key={d.key} className={d.key === selectedDeckKey ? 'active' : ''}>
              <button onClick={() => setSelectedDeckKey(d.key)}>{d.name}</button>
            </li>
          ))}
        </ul>
        <div className="random-controls">
          <h4>Random</h4>
          <div className="random-row">
            <button onClick={startRandomDeck}>Random</button>
            <label>
              Quantity
              <select value={randomCount} onChange={(e) => setRandomCount(parseInt(e.target.value))}>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={30}>30</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </label>
          </div>
        </div>
        <div className="front-toggle">
          <h4>Front Side</h4>
          <label>
            <input
              type="radio"
              name="frontSide"
              value="japanese"
              checked={frontField === 'japanese'}
              onChange={() => setFrontField('japanese')}
            />
            Japanese
          </label>
          <label>
            <input
              type="radio"
              name="frontSide"
              value="english"
              checked={frontField === 'english'}
              onChange={() => setFrontField('english')}
            />
            English
          </label>
        </div>
      </aside>

      <main className="main">
        <h1>Japanese Flashcards</h1>
        <div className="controls">
          <button onClick={() => { setDeck(shuffle(deck)); setFlipped(false); }}>Reshuffle</button>
        </div>

        <Card
          card={current}
          flipped={flipped}
          onFlip={() => setFlipped((f) => !f)}
          frontField={frontField}
          counts={counts}
          difficult={difficult}
          onToggleDifficult={(e) => {
            e.stopPropagation();
            if (!current || !(current as any).id) return;
            const newState = difficultProvider.toggleDifficult(selectedDeckKey, (current as any).id as string);
            setDifficult(newState);
          }}
        />

        <div className="actions">
          <button onClick={markKnown}>Known</button>
          <button onClick={markUnknown}>Unknown</button>
        </div>

        <div className="progress">Cards left: {deck.length}</div>
        <div className="hint">Tip: press Space to flip, Enter to mark Known</div>
      </main>
    </div>
  );
}
