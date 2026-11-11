
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function passwordError(pw) {
  if (!pw) return 'Password is required.';
  if (pw.length < 8 || pw.length > 16) return 'Use 8 to 16 characters.';
  if (!/[A-Z]/.test(pw)) return 'Add at least one uppercase letter.';
  if (!/[a-z]/.test(pw)) return 'Add at least one lowercase letter.';
  if (!/[0-9]/.test(pw)) return 'Add at least one number.';
  if (!/[^A-Za-z0-9]/.test(pw)) return 'Add at least one special character.';
  return '';
}

export function userErrors({ name, email, password }, { needPassword = true } = {}) {
  const e = {};
  if (!name || name.trim().length < 2) e.name = 'Enter a name of at least 2 characters.';
  if (!EMAIL_RE.test((email || '').trim())) e.email = 'Enter a valid email address.';
  if (needPassword || password) {
    const p = passwordError(password);
    if (p) e.password = p;
  }
  return e;
}

export function reviewErrors({ rating, comment }) {
  const e = {};
  if (!rating) e.rating = 'Pick a rating from 1 to 5.';
  if (!comment || comment.trim().length < 5) e.comment = 'Write at least 5 characters.';
  else if (comment.trim().length > 1000) e.comment = 'Keep it under 1000 characters.';
  return e;
}
