export default function RatingDistribution({ distribution = [] }) {
  const max = Math.max(1, ...distribution.map((d) => d.count));
  return (
    <div className="dist" role="table" aria-label="Rating distribution">
      {distribution.map((d) => (
        <div className="dist-row" role="row" key={d.stars}>
          <span className="dist-label" role="cell">{d.stars} {d.stars === 1 ? 'star' : 'stars'}</span>
          <span className="dist-track" role="cell"><span style={{ width: `${(d.count / max) * 100}%` }} /></span>
          <span className="dist-count" role="cell">{d.count}</span>
        </div>
      ))}
    </div>
  );
}
