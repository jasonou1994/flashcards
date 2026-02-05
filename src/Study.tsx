import React, { useEffect, useState, useMemo, useRef } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import type { CardItem, CardStats, FrontField } from './types';
import { LocalStorageCardDataProvider } from './stats/LocalStorageCardDataProvider';
import {
  validateDeckIds,
  shuffle,
  sampleMixedByPriority,
  sampleFlagFirst,
  createDeckContext,
  buildDeckOptions,
  loadAllCards,
  getCardId,
  SIDEBAR_WIDTH,
} from './utils';
import Card from './Card';
import Sidebar from './Sidebar';

export default function Study() {
  const deckContext = useMemo(() => createDeckContext(), []);
  const availableDecks = useMemo(() => buildDeckOptions(deckContext), [deckContext]);
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
  const [frontField, setFrontField] = useState<FrontField>('japanese');
  const [counts, setCounts] = useState<CardStats>({ success: 0, failure: 0 });
  const [difficult, setDifficult] = useState<boolean>(false);

  function failureRatioFor(card: CardItem): number {
    const { success, failure } = dataProvider.getCounts(getCardId(card));
    const total = success + failure;
    return total > 0 ? failure / total : 0;
  }

  function sampleRandomRun(deduped: CardItem[]): CardItem[] {
    if (prioritizeDifficult) {
      const flaggedIds = dataProvider.getDifficult();
      return sampleFlagFirst(deduped, flaggedIds, randomCount, failureRatioFor);
    }
    return sampleMixedByPriority(deduped, randomCount, failureRatioFor);
  }

  function startRandomDeck() {
    const deduped = loadAllCards(deckContext);
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
      loaded = deckContext(selectedDeckKey);
    } catch {
      loaded = [];
    }
    countedThisRun.current.clear();
    validateDeckIds(loaded);
    setDeck(shuffle(loaded));
    setFlipped(false);
  }, [selectedDeckKey, isRandomRun, deckContext]);

  const current = deck[0];

  // Update counts when current card changes
  useEffect(() => {
    if (current) {
      setCounts(dataProvider.getCounts(getCardId(current)));
    } else {
      setCounts({ success: 0, failure: 0 });
    }
  }, [current, dataProvider]);

  // Update difficult flag when current card or deck changes
  useEffect(() => {
    if (current) {
      setDifficult(dataProvider.isDifficult(getCardId(current)));
    } else {
      setDifficult(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, selectedDeckKey]);

  function markKnown() {
    if (!current) return;
    const id = getCardId(current);
    if (!countedThisRun.current.has(id)) {
      dataProvider.incrementSuccess(id);
      countedThisRun.current.add(id);
    }
    const remaining = deck.slice(1);
    setDeck(remaining);
    setFlipped(false);
  }

  function markUnknown() {
    if (!current) return;
    const id = getCardId(current);
    if (!countedThisRun.current.has(id)) {
      dataProvider.incrementFailure(id);
      countedThisRun.current.add(id);
    }
    // reinsert this card at random position after shuffling remaining
    const remaining = deck.slice(1);
    const newDeck = shuffle(remaining.concat(current));
    setDeck(newDeck);
    setFlipped(false);
  }

  function restartDeck() {
    if (isRandomRun) {
      countedThisRun.current.clear();
      const initial = initialRandomDeckRef.current || [];
      if (initial.length > 0) {
        validateDeckIds(initial);
        setDeck(initial.slice());
      }
      return;
    }
    if (!selectedDeckKey || !deckContext) return;
    try {
      const loaded = deckContext(selectedDeckKey);
      countedThisRun.current.clear();
      validateDeckIds(loaded);
      setDeck(shuffle(loaded));
    } catch {
      // no-op when reload fails
    }
  }

  const isDeckComplete = !current && (isRandomRun || selectedDeckKey);

  // keyboard handlers: Space to flip, E/Enter to mark known, F to mark unknown
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (isDeckComplete) {
          restartDeck();
        } else {
          markKnown();
        }
      } else if (e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        markKnown();
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        markUnknown();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [deck, current, isDeckComplete]);

  return (
    <Box>
      <Box sx={{ display: 'flex', mt: 1 }}>
        <Paper elevation={0} sx={{ width: SIDEBAR_WIDTH, flexShrink: 0 }}>
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
            onChangeFrontField={setFrontField}
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
                  All done
                </Typography>
                <Typography variant="body1" gutterBottom>
                  You completed the deck.
                </Typography>
                <Button variant="contained" color="primary" onClick={restartDeck}>
                  Restart
                </Button>
                <Typography variant="caption" sx={{ mt: 1, display: 'block', color: 'text.secondary' }}>
                  Press Enter to restart
                </Typography>
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
                  if (!current) return;
                  const newState = dataProvider.toggleDifficult(getCardId(current));
                  setDifficult(newState);
                }}
              />

              <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                <Button variant="contained" color="primary" onClick={markKnown}>Known</Button>
                <Button variant="outlined" color="primary" sx={{ bgcolor: 'common.white' }} onClick={markUnknown}>Unknown</Button>
              </Stack>

              <Typography variant="body2" sx={{ mt: 2 }}>Cards left: {deck.length}</Typography>
              <Typography variant="caption" sx={{ mt: 1, color: 'text.secondary' }}>
                Tip: Space to flip, E/Enter for Known, F for Unknown
              </Typography>
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
}
