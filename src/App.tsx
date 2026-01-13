import React, { useEffect, useState, useMemo } from 'react';
import sampleDeck from '../decks/chapter1_1.json';

export interface CardItem {
  japanese: string;
  hiragana: string;
  english: string;
  japanese_example?: string;
  english_example?: string;
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Render text that may contain <ruby>…<rt>…</rt></ruby> markup
function HtmlOrText({ className, text }: { className?: string; text?: string }) {
  const hasRuby = typeof text === 'string' && /<\s*(ruby|rb|rt|rp)\b/i.test(text);
  if (hasRuby) {
    return <div className={className} dangerouslySetInnerHTML={{ __html: text! }} />;
  }
  return <div className={className}>{text}</div>;
}

function Card({ card, flipped, onFlip }: { card: CardItem; flipped: boolean; onFlip: () => void }) {
  return (
    <div className={`card ${flipped ? 'flipped' : ''}`} onClick={onFlip}>
      <HtmlOrText className="side front" text={card.japanese} />
      <div className="side back">
        <HtmlOrText className="hiragana" text={card.hiragana} />
        <HtmlOrText className="english" text={card.english} />
        {card.japanese_example ? (
          <HtmlOrText className="japanese-example" text={card.japanese_example} />
        ) : null}
        {card.english_example ? (
          <HtmlOrText className="english-example" text={card.english_example} />
        ) : null}
      </div>
    </div>
  );
}

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

  const [selectedDeckKey, setSelectedDeckKey] = useState<string>(() => (availableDecks[0] && availableDecks[0].key) || '../deck.json');
  const [deck, setDeck] = useState<CardItem[]>(() => {
    // load initial deck
    try {
      if (deckContext && selectedDeckKey && selectedDeckKey !== '../deck.json') return shuffle(deckContext(selectedDeckKey) as CardItem[]);
    } catch (e) {}
    return shuffle(sampleDeck as CardItem[]);
  }); 

  const [flipped, setFlipped] = useState<boolean>(false);

  // react to deck selection changes
  useEffect(() => {
    let loaded: CardItem[] = sampleDeck as CardItem[];
    try {
      if (deckContext && selectedDeckKey) {
        loaded = deckContext(selectedDeckKey) as CardItem[];
      }
    } catch (e) {
      loaded = sampleDeck as CardItem[];
    }
    setDeck(shuffle(loaded));
    setFlipped(false);
  }, [selectedDeckKey]);
  
  const current = deck[0];

  function markKnown() {
    if (!current) return;
    const remaining = deck.slice(1);
    setDeck(remaining);
    setFlipped(false);
  }

  function markUnknown() {
    if (!current) return;
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
        </aside>
        <main className="main">
          <h1>All done 🎉</h1>
          <p>You completed the deck.</p>
          <button onClick={() => {
            try {
              const loaded = deckContext && selectedDeckKey ? (deckContext(selectedDeckKey) as CardItem[]) : (sampleDeck as CardItem[]);
              setDeck(shuffle(loaded));
            } catch (e) {
              setDeck(shuffle(sampleDeck as CardItem[]));
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
      </aside>

      <main className="main">
        <h1>Japanese Flashcards</h1>
        <div className="controls">
          <button onClick={() => { setDeck(shuffle(deck)); setFlipped(false); }}>Reshuffle</button>
        </div>

        <Card card={current} flipped={flipped} onFlip={() => setFlipped((f) => !f)} />

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
