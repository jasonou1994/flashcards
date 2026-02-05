import React, { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import type { CardItem } from './types';
import {
  validateDeckIds,
  createDeckContext,
  buildDeckOptions,
  loadAllCards,
  getCardId,
  SIDEBAR_WIDTH,
} from './utils';
import { LocalStorageCardDataProvider } from './stats/LocalStorageCardDataProvider';
import Card from './Card';

export default function Stats() {
  const deckContext = useMemo(() => createDeckContext(), []);
  const availableDecks = useMemo(() => buildDeckOptions(deckContext), [deckContext]);
  const dataProvider = useMemo(() => new LocalStorageCardDataProvider(), []);

  const [selectedDeckKey, setSelectedDeckKey] = useState<string>('');
  const [flaggedOnly, setFlaggedOnly] = useState<boolean>(false);
  const [ascending, setAscending] = useState<boolean>(true);
  const [refreshTick, setRefreshTick] = useState<number>(0);
  const [flippedById, setFlippedById] = useState<Record<string, boolean>>({});

  // Compute base list according to selection (no deck chosen -> all deduped)
  const baseCards = useMemo<CardItem[]>(() => {
    if (!selectedDeckKey) {
      const deduped = loadAllCards(deckContext);
      validateDeckIds(deduped);
      return deduped;
    }
    try {
      const loaded = deckContext ? deckContext(selectedDeckKey) : [];
      validateDeckIds(loaded);
      return loaded.slice();
    } catch {
      return [];
    }
  }, [selectedDeckKey, deckContext]);

  // Snapshot table once per render cycle / when toggled
  const tableSnapshot = useMemo(
    () => dataProvider.getAllRecords(),
    [dataProvider, refreshTick, selectedDeckKey]
  );

  // Apply flagged-only filter
  const filteredCards = useMemo<CardItem[]>(() => {
    if (!flaggedOnly) return baseCards;
    return baseCards.filter((c) => !!tableSnapshot[getCardId(c)]?.difficult);
  }, [baseCards, flaggedOnly, tableSnapshot]);

  // Sort by success rate, placing 0/0 cards at the bottom
  const orderedCards = useMemo<CardItem[]>(() => {
    const withData = filteredCards.map((c) => {
      const id = getCardId(c);
      const rec = tableSnapshot[id] || { success: 0, failure: 0, difficult: false };
      const total = rec.success + rec.failure;
      const successRate = total > 0 ? rec.success / total : 0;
      const name = (c.japanese || c.english || '').toString();
      return { card: c, successRate, name, total };
    });
    // Split into attempted and zero-attempt groups
    const attempted = withData.filter((x) => x.total > 0);
    const zeroAttempts = withData.filter((x) => x.total === 0);
    // Sort attempted by successRate with deterministic tiebreaker
    attempted.sort((a, b) => {
      if (a.successRate !== b.successRate) {
        return ascending ? a.successRate - b.successRate : b.successRate - a.successRate;
      }
      const cmp = a.name.localeCompare(b.name);
      return ascending ? cmp : -cmp;
    });
    return attempted.concat(zeroAttempts).map((x) => x.card);
  }, [filteredCards, ascending, tableSnapshot]);

  return (
    <Box>
      <Box sx={{ display: 'flex', mt: 1 }}>
        {/* Sidebar: Decks list */}
        <Paper elevation={0} sx={{ width: SIDEBAR_WIDTH, flexShrink: 0 }}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ fontSize: '1rem', color: 'text.secondary' }}>
              Decks
            </Typography>
            <List>
              {availableDecks.map((d) => (
                <ListItem key={d.key} disablePadding>
                  <ListItemButton
                    selected={d.key === selectedDeckKey}
                    onClick={() => setSelectedDeckKey((prev) => (prev === d.key ? '' : d.key))}
                  >
                    <ListItemText primary={d.name} />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Box>
        </Paper>

        {/* Main content: toolbar + responsive card grid */}
        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          <Typography variant="h4" gutterBottom>Stats</Typography>

          {/* Top toolbar */}
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel htmlFor="order-by">Order by</InputLabel>
              <Select
                native
                value="ratio"
                inputProps={{ id: 'order-by' }}
                onChange={() => { /* Single option for now */ }}
              >
                <option value="ratio">Success rate</option>
              </Select>
            </FormControl>
            <FormControlLabel
              control={<Switch checked={ascending} onChange={(e) => setAscending(e.target.checked)} />}
              label={ascending ? 'Ascending' : 'Descending'}
            />
            <Divider orientation="vertical" flexItem />
            <FormControlLabel
              control={<Switch checked={flaggedOnly} onChange={(e) => setFlaggedOnly(e.target.checked)} />}
              label="Flagged only"
            />
          </Stack>

          {/* Responsive flex grid of cards */}
          <Box aria-label="Stats cards grid" sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {orderedCards.map((c) => {
              const id = getCardId(c);
              const rec = tableSnapshot[id] || { success: 0, failure: 0, difficult: false };
              const counts = { success: rec.success, failure: rec.failure };
              const difficult = !!rec.difficult;
              return (
                <Box
                  key={id}
                  sx={{
                    flexGrow: 0,
                    minWidth: 0,
                    flexBasis: {
                      xs: '100%',
                      sm: 'calc((100% - 16px) / 2)',
                      md: 'calc((100% - 32px) / 3)',
                      lg: 'calc((100% - 48px) / 4)',
                      xl: 'calc((100% - 64px) / 5)',
                    },
                    maxWidth: {
                      xs: '100%',
                      sm: 'calc((100% - 16px) / 2)',
                      md: 'calc((100% - 32px) / 3)',
                      lg: 'calc((100% - 48px) / 4)',
                      xl: 'calc((100% - 64px) / 5)',
                    },
                  }}
                >
                  <Card
                    card={c}
                    flipped={!!flippedById[id]}
                    onFlip={() => setFlippedById((prev) => ({ ...prev, [id]: !prev[id] }))}
                    frontField="japanese"
                    counts={counts}
                    difficult={difficult}
                    contentCenter
                    backVariant="englishOnly"
                    onToggleDifficult={(e) => {
                      e.stopPropagation();
                      dataProvider.toggleDifficult(id);
                      setRefreshTick((t) => t + 1);
                    }}
                  />
                </Box>
              );
            })}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
