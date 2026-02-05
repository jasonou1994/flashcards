import React from 'react';
import HtmlOrText from './HtmlOrText';
import type { CardItem, CardStats, FrontField } from './types';
import MUICard from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import FlagIcon from '@mui/icons-material/Flag';

export function Card({
  card,
  flipped,
  onFlip,
  frontField,
  counts,
  difficult,
  onToggleDifficult,
  contentCenter = false,
  backVariant = 'full',
  emphasizeFirstLine = false,
}: {
  card: CardItem;
  flipped: boolean;
  onFlip: () => void;
  frontField: FrontField;
  counts?: CardStats;
  difficult?: boolean;
  onToggleDifficult?: (e: React.MouseEvent) => void;
  contentCenter?: boolean;
  backVariant?: 'full' | 'englishOnly';
  emphasizeFirstLine?: boolean;
}) {
  return (
    <MUICard className={`card ${flipped ? 'flipped' : ''}`} onClick={onFlip} sx={{ position: 'relative', p: 2, display: 'flex', flexDirection: 'column' }}>
      {/* Actions bar: flag (left) + counts (right) */}
      <Box className="card-actions" onClick={(e) => e.stopPropagation()} sx={{
        position: 'absolute',
        top: 8,
        left: 8,
        right: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <IconButton
          className={`flag-button ${difficult ? 'active' : ''}`}
          aria-label="Flag Difficult"
          aria-pressed={!!difficult}
          color={difficult ? 'error' : 'default'}
          size="small"
          onClick={onToggleDifficult}
        >
          <FlagIcon />
        </IconButton>
        {counts ? (
          <Typography className="card-stats-overlay" variant="caption">
            {counts.success} / {counts.success + counts.failure}
          </Typography>
        ) : (
          <Typography className="card-stats-overlay" variant="caption" />
        )}
      </Box>

      <CardContent sx={contentCenter ? { flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' } : undefined}>
        {!flipped ? (
          <HtmlOrText className="side front" text={card[frontField]} variant={emphasizeFirstLine ? 'h3' : 'h5'} />
        ) : (
          <Box className="side back" sx={contentCenter ? { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' } : undefined}>
            {backVariant === 'englishOnly' ? (
              <HtmlOrText className="english" text={card.english} />
            ) : (
              <>
                <HtmlOrText className="japanese" text={card.japanese} variant={emphasizeFirstLine ? 'h3' : 'h5'} />
                <HtmlOrText className="hiragana" text={card.hiragana} />
                <HtmlOrText className="english-definition" text={card.english_definition} />
                {card.japanese_example ? (
                  <HtmlOrText className="japanese-example" text={card.japanese_example} />
                ) : null}
                {card.english_example ? (
                  <HtmlOrText className="english-example" text={card.english_example} />
                ) : null}
              </>
            )}
          </Box>
        )}
      </CardContent>
    </MUICard>
  );
}

export default Card;
