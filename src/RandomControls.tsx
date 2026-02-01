import React from 'react';

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
  const quantityId = 'random-quantity';
  const prioritizeId = 'random-prioritize-flagged';
  return (
    <div className="random-controls" role="group" aria-labelledby="random-legend">
      <h4 id="random-legend">Random</h4>
      {/* Top control bar */}
      <div className="random-row" aria-label="Random options bar">
        <label htmlFor={quantityId}>
          Count
        </label>
        <select id={quantityId} value={randomCount} onChange={(e) => onChangeRandomCount(parseInt(e.target.value))}>
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={30}>30</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
        <label htmlFor={prioritizeId} className="checkbox-label">
          <input
            id={prioritizeId}
            type="checkbox"
            checked={prioritizeDifficult}
            onChange={(e) => onTogglePrioritizeDifficult(e.target.checked)}
          />
          Target errors
        </label>
      </div>
      {/* Start button below bar */}
      <div>
        <button className="random-start-button" onClick={onStartRandom}>Start</button>
      </div>
    </div>
  );
}
