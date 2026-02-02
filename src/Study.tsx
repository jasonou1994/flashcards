import React, { useEffect, useState, useMemo, useRef } from 'react';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Paper from '@mui/material/Paper';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';
import sampleDeck from '../decks/chapter1_1.json';
import { LocalStorageStatsProvider } from './stats/LocalStorageStatsProvider';
import type { CardStats } from './stats/StatsProvider';
import type { CardItem } from './utils';
import { validateDeckIds, aggregateAndDedupe as dedupeCards, shuffle, sampleN, sampleMixedByPriority, sampleFlagFirst } from './utils';
import Card from './Card';
import RandomControls from './RandomControls';
import { LocalStorageDifficultProvider } from './stats/LocalStorageDifficultProvider';

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

  const availableDecks = useMemo<DeckOption[]>(() => {
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
  const [prioritizeDifficult, setPrioritizeDifficult] = useState<boolean>(false);
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

  function failureRatioFor(card: CardItem): number {
    const { success, failure } = statsProvider.getCounts((card as any).id as string);
    const total = success + failure;
    return total > 0 ? failure / total : 0;
  }

  function sampleRandomRun(deduped: CardItem[]): CardItem[] {
    if (prioritizeDifficult) {
      const flaggedIds = new Set<string>(difficultProvider.getDifficult(RANDOM_KEY));
      return sampleFlagFirst<CardItem>(deduped, flaggedIds, randomCount, failureRatioFor);
    }
    return sampleMixedByPriority<CardItem>(deduped, randomCount, failureRatioFor);
  }

  function startRandomDeck() {
    const deduped = aggregateAllAndDedupe();
    const sampled = sampleRandomRun(deduped);
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
      const sampled = sampleRandomRun(deduped);
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

  const sidebarWidth = 280;

  // Single layout: sidebar + main; main renders content conditionally

  return (
    <Box>
      <Box sx={{ display: 'flex' }}>
        <Paper elevation={0} sx={{ width: sidebarWidth, flexShrink: 0 }}>
          <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Decks
          </Typography>
          <List>
            {availableDecks.map((d) => (
              <ListItem key={d.key} disablePadding>
                <ListItemButton selected={d.key === selectedDeckKey} onClick={() => setSelectedDeckKey(d.key)}>
                  <ListItemText primary={d.name} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          <Divider sx={{ my: 2 }} />
          <RandomControls
            onStartRandom={startRandomDeck}
            randomCount={randomCount}
            onChangeRandomCount={(n) => setRandomCount(n)}
            prioritizeDifficult={prioritizeDifficult}
            onTogglePrioritizeDifficult={(v) => setPrioritizeDifficult(v)}
          />
          <Divider sx={{ my: 2 }} />
          <FormControl component="fieldset">
            <FormLabel component="legend">Front Side</FormLabel>
            <RadioGroup
              name="frontSide"
              value={frontField}
              onChange={(_, v) => setFrontField(v as 'japanese' | 'english')}
            >
              <FormControlLabel value="japanese" control={<Radio />} label="Japanese" />
              <FormControlLabel value="english" control={<Radio />} label="English" />
            </RadioGroup>
          </FormControl>
          </Box>
        </Paper>

        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          {!current ? (
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
                  if (selectedDeckKey === RANDOM_KEY) {
                    const deduped = aggregateAllAndDedupe();
                    const sampled = sampleRandomRun(deduped);
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
                }}
              >
                Restart
              </Button>
            </>
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
                onToggleDifficult={(e) => {
                  e.stopPropagation();
                  if (!current || !(current as any).id) return;
                  const newState = difficultProvider.toggleDifficult(selectedDeckKey, (current as any).id as string);
                  setDifficult(newState);
                }}
              />

              <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                <Button variant="contained" color="success" onClick={markKnown}>Known</Button>
                <Button variant="contained" color="warning" onClick={markUnknown}>Unknown</Button>
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
