import React from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

export interface RandomControlsProps {
  onStartRandom: () => void;
  randomCount: number;
  onChangeRandomCount: (n: number) => void;
  prioritizeDifficult: boolean;
  onTogglePrioritizeDifficult: (v: boolean) => void;
}

export default function RandomControls({
  onStartRandom,
  randomCount,
  onChangeRandomCount,
  prioritizeDifficult,
  onTogglePrioritizeDifficult,
}: RandomControlsProps) {
  return (
    <Box role="group" aria-labelledby="random-legend">
      <Typography id="random-legend" variant="h6" component="h6" gutterBottom sx={{ fontSize: '1rem', color: 'text.secondary' }}>
        Random
      </Typography>
      <Stack direction="row" spacing={2} alignItems="center" aria-label="Random options bar">
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel htmlFor="random-quantity">Count</InputLabel>
          <Select
            value={randomCount}
            label="Count"
            onChange={(e) => onChangeRandomCount(Number(e.target.value))}
            native
            inputProps={{ id: 'random-quantity' }}
          >
            {[10, 20, 30, 50, 100].map((n) => (
              <option value={n} key={n}>{n}</option>
            ))}
          </Select>
        </FormControl>
        <FormControlLabel
          control={<Checkbox checked={prioritizeDifficult} onChange={(e) => onTogglePrioritizeDifficult(e.target.checked)} />}
          label="Target errors"
        />
      </Stack>
      <Box sx={{ mt: 2 }}>
        <Button variant="contained" onClick={onStartRandom} aria-label="Start Random Run">Start</Button>
      </Box>
    </Box>
  );
}
