import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';
import type { SidebarProps, FrontField } from './types';
import RandomControls from './RandomControls';

export default function Sidebar({
  availableDecks,
  selectedDeckKey,
  onSelectDeck,
  onStartRandom,
  randomCount,
  onChangeRandomCount,
  prioritizeDifficult,
  onTogglePrioritizeDifficult,
  frontField,
  onChangeFrontField,
}: SidebarProps) {
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom sx={{ fontSize: '1rem', color: 'text.secondary' }}>
        Decks
      </Typography>
      <List>
        {availableDecks.map((d) => (
          <ListItem key={d.key} disablePadding>
            <ListItemButton selected={d.key === selectedDeckKey} onClick={() => onSelectDeck(d.key)}>
              <ListItemText primary={d.name} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider sx={{ my: 2 }} />
      <RandomControls
        onStartRandom={onStartRandom}
        randomCount={randomCount}
        onChangeRandomCount={onChangeRandomCount}
        prioritizeDifficult={prioritizeDifficult}
        onTogglePrioritizeDifficult={onTogglePrioritizeDifficult}
      />
      <Divider sx={{ my: 2 }} />
      <FormControl component="fieldset">
        <FormLabel component="legend" sx={{ typography: 'h6', fontSize: '1rem', color: 'text.secondary', mb: 1 }}>Front Side</FormLabel>
        <RadioGroup
          name="frontSide"
          value={frontField}
          onChange={(_, v) => onChangeFrontField(v as FrontField)}
        >
          <FormControlLabel value="japanese" control={<Radio />} label="Japanese" />
          <FormControlLabel value="english" control={<Radio />} label="English" />
        </RadioGroup>
      </FormControl>
    </Box>
  );
}
