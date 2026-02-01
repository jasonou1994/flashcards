import React from 'react';
import HtmlOrText from './HtmlOrText';
import type { CardItem } from './utils';
import type { CardStats } from './stats/StatsProvider';

export function Card({
  card,
  flipped,
  onFlip,
  frontField,
  counts,
  difficult,
  onToggleDifficult,
}: {
  card: CardItem;
  flipped: boolean;
  onFlip: () => void;
  frontField: 'japanese' | 'english';
  counts?: CardStats;
  difficult?: boolean;
  onToggleDifficult?: (e: React.MouseEvent) => void;
}) {
  return (
    <div className={`card ${flipped ? 'flipped' : ''}`} onClick={onFlip}>
      {/* Actions bar: flag (left) + counts (right) */}
      <div className="card-actions" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className={`flag-button ${difficult ? 'active' : ''}`}
          aria-label="Flag Difficult"
          aria-pressed={!!difficult}
          onClick={onToggleDifficult}
        >
          ⚑
        </button>
        {counts ? (
          <span className="card-stats-overlay">
            {counts.success} / {counts.success + counts.failure}
          </span>
        ) : (
          <span className="card-stats-overlay" />
        )}
      </div>

      <HtmlOrText className="side front" text={card[frontField]} />
      <div className="side back">
        <HtmlOrText className="japanese" text={card.japanese} />
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

export default Card;
