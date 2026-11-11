export default function ScoreRing({ value, size = 86 }) {
  if (value === null || value === undefined) {
    return <div className="score-ring empty" style={{ '--size': `${size}px` }}><span>New</span></div>;
  }
  const pct = Math.max(0, Math.min(1, Number(value) / 5));
  return (
    <div className="score-ring" style={{ '--size': `${size}px`, '--p': pct }} aria-label={`${value} out of 5`}>
      <strong>{Number(value).toFixed(1)}</strong>
    </div>
  );
}
