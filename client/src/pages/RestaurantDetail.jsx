import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { Alert, Notice, Pager, fmtDate } from '../components/Common.jsx';
import { Stars, StarInput } from '../components/Stars.jsx';
import RatingDistribution from '../components/RatingDistribution.jsx';
import ScoreRing from '../components/ScoreRing.jsx';
import { reviewErrors } from '../validators.js';
import { restaurantCover } from '../cover.js';

function ReviewForm({ restaurantId, existing, onSaved }) {
  const [rating, setRating] = useState(existing?.rating || 0);
  const [comment, setComment] = useState(existing?.comment || '');
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { setRating(existing?.rating || 0); setComment(existing?.comment || ''); }, [existing]);

  const save = async (e) => {
    e.preventDefault();
    setError(null); setNotice('');
    const v = reviewErrors({ rating, comment });
    setErrors(v);
    if (Object.keys(v).length) return;
    setBusy(true);
    try {
      if (existing) await api(`/reviews/${existing._id}`, { method: 'PUT', body: { rating, comment } });
      else await api(`/restaurants/${restaurantId}/reviews`, { method: 'POST', body: { rating, comment } });
      setNotice(existing ? 'Review updated.' : 'Review posted.');
      onSaved();
    } catch (err) {
      setError(err); setErrors(err.errors || {});
      if (err.status === 409) onSaved();
    } finally { setBusy(false); }
  };

  const remove = async () => {
    if (!window.confirm('Delete your review? This cannot be undone.')) return;
    setBusy(true);
    try {
      await api(`/reviews/${existing._id}`, { method: 'DELETE' });
      setRating(0); setComment(''); setNotice('Review deleted.');
      onSaved();
    } catch (err) { setError(err); } finally { setBusy(false); }
  };

  return (
    <form className="review-form" onSubmit={save} noValidate>
      <p className="kicker" style={{ color: '#b8901a' }}>{existing ? 'Your mark' : 'Leave a mark'}</p>
      <h2>{existing ? 'Your review' : 'Rate this restaurant'}</h2>
      <Alert error={error} />
      <Notice>{notice}</Notice>
      <StarInput value={rating} onChange={setRating} disabled={busy} />
      {errors.rating && <em className="field-error">{errors.rating}</em>}
      <label className="field">
        <span>What did you think?</span>
        <textarea rows="4" value={comment} maxLength={1000} onChange={(e) => setComment(e.target.value)} />
        {errors.comment && <em className="field-error">{errors.comment}</em>}
      </label>
      <div className="actions">
        <button className="btn" disabled={busy}>{existing ? 'Save changes' : 'Post review'}</button>
        {existing && <button type="button" className="btn btn-danger" onClick={remove} disabled={busy}>Delete review</button>}
      </div>
    </form>
  );
}

export default function RestaurantDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [reviews, setReviews] = useState(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState(null);

  const loadAll = useCallback(async () => {
    try {
      const [d, r] = await Promise.all([api(`/restaurants/${id}`), api(`/restaurants/${id}/reviews`, { params: { page, limit: 6 } })]);
      setData(d); setReviews(r); setError(null);
    } catch (e) { setError(e); }
  }, [id, page, user]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const adminDelete = async (rid) => {
    if (!window.confirm('Remove this review?')) return;
    try { await api(`/reviews/${rid}`, { method: 'DELETE' }); loadAll(); } catch (e) { setError(e); }
  };

  if (error && !data) return <div className="page"><Alert error={error} /><Link to="/" className="back">All restaurants</Link></div>;
  if (!data) return <div className="page"><p className="page-note">Loading the table…</p></div>;
  const { restaurant: r, distribution, totalRatings, myReview } = data;
  const cover = restaurantCover(r.name, r.cuisine);

  return (
    <>
      <section className="detail-hero">
        <div className="hero-media" style={{ backgroundImage: `url(${cover})` }} />
        <div className="detail-hero-copy">
          <div>
            <Link to="/" className="back" style={{ color: '#d8cfc3' }}>All restaurants</Link>
            <p className="kicker">{r.cuisine} · {r.location}</p>
            <h1>{r.name}</h1>
            <div className="detail-facts">
              {r.address && <p>{r.address}</p>}
              {r.openingHours && <p>Open {r.openingHours}</p>}
              {r.phone && <p>{r.phone}</p>}
            </div>
            {r.description && <p className="desc">{r.description}</p>}
          </div>
          <div>
            <ScoreRing value={r.averageRating} size={110} />
            <p className="place-meta" style={{ marginTop: '.7rem', color: '#d8cfc3' }}>
              {r.averageRating !== null && <Stars value={r.averageRating} />}
              <span>{r.reviewCount} {r.reviewCount === 1 ? 'review' : 'reviews'}</span>
            </p>
            {r.myRating && <small className="mine">Your rating: {r.myRating} of 5</small>}
          </div>
        </div>
      </section>

      <div className="detail-grid">
        <Alert error={error} />
        <div className="two-col">
          <section>
            <p className="kicker" style={{ color: '#b8901a' }}>The room’s verdict</p>
            <h2>Rating breakdown</h2>
            {totalRatings === 0 ? <p className="page-note">No ratings yet. Be the first to rate it.</p> : <RatingDistribution distribution={distribution} />}
          </section>
          <section>
            {user?.role === 'customer' && <ReviewForm restaurantId={id} existing={myReview} onSaved={loadAll} />}
            {!user && <p className="page-note"><Link to="/login" state={{ from: `/restaurants/${id}` }}>Log in</Link> as a customer to rate and review this restaurant.</p>}
            {user && user.role !== 'customer' && <p className="page-note">Only customer accounts can post reviews.</p>}
          </section>
        </div>

        <section className="card-block">
          <p className="kicker" style={{ color: '#b8901a' }}>Guest book</p>
          <h2>Reviews</h2>
          {reviews?.reviews.length === 0 && <p className="page-note">No written reviews yet.</p>}
          <ul className="reviews">
            {reviews?.reviews.map((rv) => (
              <li key={rv._id}>
                <div className="review-top">
                  <strong>{rv.customer?.name || 'Former user'}</strong>
                  <Stars value={rv.rating} />
                  <time>{fmtDate(rv.updatedAt)}</time>
                </div>
                <p>{rv.comment}</p>
                {user?.role === 'admin' && <button className="btn btn-danger btn-small" onClick={() => adminDelete(rv._id)}>Remove review</button>}
              </li>
            ))}
          </ul>
          {reviews && <Pager page={reviews.page} pages={reviews.pages} onPage={setPage} />}
        </section>
      </div>
    </>
  );
}
