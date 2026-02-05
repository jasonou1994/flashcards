import React, { useEffect, useState, useMemo, useRef } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import type { CardStats } from './stats/CardDataProvider';
import { LocalStorageCardDataProvider } from './stats/LocalStorageCardDataProvider';
import type { CardItem } from './utils';
import { validateDeckIds, aggregateAndDedupe as dedupeCards, shuffle, sampleN, sampleMixedByPriority, sampleFlagFirst } from './utils';
import Card from './Card';
import Sidebar from './Sidebar';

export type { CardItem };

type DeckOption = { name: string; key: string; loader: () => CardItem[] };

export default function Study() {
  // discover decks from /decks using webpack require.context
  let deckContext: any = null;
  try {
    deckContext = (require as any).context('../decks', false, /\.json$/);
  } catch (e) {
    deckContext = null;
  }
  // Test fallback: allow injected test decks when require.context isn't available
  if (!deckContext && (globalThis as any).__TEST_DECKS__) {
    const maps = (globalThis as any).__TEST_DECKS__ as Record<string, CardItem[]>;
    const loader = (key: string) => maps[key];
    (loader as any).keys = () => Object.keys(maps);
    deckContext = loader;
  }

  const availableDecks = useMemo<DeckOption[]>(() => {
    if (!deckContext) return [];
    return deckContext.keys().map((k: string) => ({ name: k.replace(/^\.\//, ''), key: k, loader: () => deckContext(k) as CardItem[] }));
  }, []);

  const dataProvider = useMemo(() => new LocalStorageCardDataProvider(), []);
  // Track which card IDs have been counted in the current deck run
  const countedThisRun = useRef<Set<string>>(new Set());

  const [selectedDeckKey, setSelectedDeckKey] = useState<string>('');
  const [isRandomRun, setIsRandomRun] = useState<boolean>(false);
  const [randomCount, setRandomCount] = useState<number>(30);
  const [prioritizeDifficult, setPrioritizeDifficult] = useState<boolean>(false);
  const [deck, setDeck] = useState<CardItem[]>([]);
  // Preserve the initially sampled random deck to support restart without changing cards
  const initialRandomDeckRef = useRef<CardItem[] | null>(null);

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
      }
    } catch {
      all = [];
    }
    const deduped = dedupeCards(all);
    return deduped;
  }

  function failureRatioFor(card: CardItem): number {
    const { success, failure } = dataProvider.getCounts((card as any).id as string);
    const total = success + failure;
    return total > 0 ? failure / total : 0;
  }

  function sampleRandomRun(deduped: CardItem[]): CardItem[] {
    if (prioritizeDifficult) {
      const flaggedIds = new Set<string>(dataProvider.getDifficult());
      return sampleFlagFirst<CardItem>(deduped, flaggedIds, randomCount, failureRatioFor);
    }
    return sampleMixedByPriority<CardItem>(deduped, randomCount, failureRatioFor);
  }

  function startRandomDeck() {
    const deduped = aggregateAllAndDedupe();
    const sampled = sampleRandomRun(deduped);
    setIsRandomRun(true);
    countedThisRun.current.clear();
    validateDeckIds(sampled);
    const initial = shuffle(sampled);
    initialRandomDeckRef.current = initial;
    setDeck(initial);
    setFlipped(false);
  }

  // react to deck selection changes
  useEffect(() => {
    if (isRandomRun) {
      // Preserve current random run; do not reload on deck key changes until user selects a deck
      return;
    }
    if (!selectedDeckKey || !deckContext) {
      countedThisRun.current.clear();
      setDeck([]);
      setFlipped(false);
      return;
    }
    let loaded: CardItem[] = [];
    try {
      loaded = deckContext(selectedDeckKey) as CardItem[];
    } catch (e) {
      loaded = [];
    }
    countedThisRun.current.clear();
    validateDeckIds(loaded);
    setDeck(shuffle(loaded));
    setFlipped(false);
  }, [selectedDeckKey, isRandomRun]);

  const current = deck[0];

  // Update counts when current card changes
  useEffect(() => {
    if (current && (current as any).id) {
      setCounts(dataProvider.getCounts((current as any).id));
    } else {
      setCounts({ success: 0, failure: 0 });
    }
  }, [current, dataProvider]);

  // Update difficult flag when current card or deck changes
  useEffect(() => {
    if (current && (current as any).id) {
      setDifficult(dataProvider.isDifficult((current as any).id as string));
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
        dataProvider.incrementSuccess(id);
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
        dataProvider.incrementFailure(id);
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

  const sidebarWidth = 280;

  // Single layout: sidebar + main; main renders content conditionally

  return (
    <Box>
      <Box sx={{ display: 'flex', mt: 1 }}>
        <Paper elevation={0} sx={{ width: sidebarWidth, flexShrink: 0 }}>
          <Sidebar
            availableDecks={availableDecks}
            selectedDeckKey={selectedDeckKey}
            onSelectDeck={(key) => { setIsRandomRun(false); setSelectedDeckKey(key); }}
            onStartRandom={startRandomDeck}
            randomCount={randomCount}
            onChangeRandomCount={setRandomCount}
            prioritizeDifficult={prioritizeDifficult}
            onTogglePrioritizeDifficult={setPrioritizeDifficult}
            frontField={frontField}
            onChangeFrontField={(v) => setFrontField(v)}
          />
        </Paper>

        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          {!current ? (
            !isRandomRun && !selectedDeckKey ? (
              <>
                <Typography variant="h4" gutterBottom>
                  Select a deck to begin
                </Typography>
                <Typography variant="body1" gutterBottom>
                  Choose a deck from the sidebar or start a Random run.
                </Typography>
              </>
            ) : (
              <>
                <Typography variant="h4" gutterBottom>
                  All done 🎉
                </Typography>
                <Typography variant="body1" gutterBottom>
                  You completed the deck.
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => {
                    if (isRandomRun) {
                      // Restart random run using the same initially sampled cards
                      countedThisRun.current.clear();
                      const initial = initialRandomDeckRef.current || [];
                      if (initial.length > 0) {
                        validateDeckIds(initial);
                        // Restore the same order as the beginning of the run
                        setDeck(initial.slice());
                      }
                      return;
                    }
                    if (!selectedDeckKey || !deckContext) {
                      return;
                    }
                    try {
                      const loaded = deckContext(selectedDeckKey) as CardItem[];
                      countedThisRun.current.clear();
                      validateDeckIds(loaded);
                      setDeck(shuffle(loaded));
                    } catch (e) {
                      // no-op when reload fails
                    }
                  }}
                >
                  Restart
                </Button>
              </>
            )
          ) : (
            <>
              <Box sx={{ mb: 2 }}>
                <Button variant="outlined" onClick={() => { setDeck(shuffle(deck)); setFlipped(false); }}>Reshuffle</Button>
              </Box>

              <Card
                card={current}
                flipped={flipped}
                onFlip={() => setFlipped((f) => !f)}
                frontField={frontField}
                counts={counts}
                difficult={difficult}
                emphasizeFirstLine
                onToggleDifficult={(e) => {
                  e.stopPropagation();
                  if (!current || !(current as any).id) return;
                  const newState = dataProvider.toggleDifficult((current as any).id as string);
                  setDifficult(newState);
                }}
              />

              <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                <Button variant="contained" color="primary" onClick={markKnown}>Known</Button>
                <Button variant="outlined" color="primary" sx={{ bgcolor: 'common.white' }} onClick={markUnknown}>Unknown</Button>
              </Stack>

              <Typography variant="body2" sx={{ mt: 2 }}>Cards left: {deck.length}</Typography>
              <Typography variant="caption" sx={{ mt: 1, color: 'text.secondary' }}>
                Tip: press Space to flip, Enter to mark Known
              </Typography>
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
}
