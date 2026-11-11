const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const OBJECT_ID_RE = /^[a-f\d]{24}$/i;
const PHONE_RE = /^[0-9+()\-\s]{6,30}$/;
const ROLES = ['admin', 'customer', 'owner'];

const OWNER_FIELDS = ['location', 'cuisine', 'address', 'description', 'phone', 'openingHours'];
const ADMIN_FIELDS = ['name', ...OWNER_FIELDS];

const isValidId = (id) => typeof id === 'string' && OBJECT_ID_RE.test(id);
const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const exactCI = (s) => new RegExp(`^${escapeRegex(s.trim())}$`, 'i');
const str = (v) => (typeof v === 'string' ? v.trim() : '');


function passwordError(pw) {
  if (typeof pw !== 'string' || !pw) return 'Password is required.';
  if (pw.length < 8 || pw.length > 16) return 'Password must be 8 to 16 characters long.';
  if (!/[A-Z]/.test(pw)) return 'Password must contain at least one uppercase letter.';
  if (!/[a-z]/.test(pw)) return 'Password must contain at least one lowercase letter.';
  if (!/[0-9]/.test(pw)) return 'Password must contain at least one number.';
  if (!/[^A-Za-z0-9]/.test(pw)) return 'Password must contain at least one special character.';
  return null;
}

function ratingError(r) {
  if (r === undefined || r === null || r === '') return 'Rating is required.';
  if (typeof r !== 'number' || Number.isNaN(r)) return 'Rating must be a number.';
  if (!Number.isInteger(r)) return 'Rating must be a whole number.';
  if (r < 1 || r > 5) return 'Rating must be between 1 and 5.';
  return null;
}

function commentError(c) {
  if (typeof c !== 'string' || !c.trim()) return 'Review text is required.';
  const len = c.trim().length;
  if (len < 5) return 'Review must be at least 5 characters long.';
  if (len > 1000) return 'Review must be 1000 characters or fewer.';
  return null;
}

function validateUser(body, { requirePassword = true, partial = false } = {}) {
  const errors = {};
  const data = {};
  if (!partial || body.name !== undefined) {
    const name = str(body.name);
    if (!name) errors.name = 'Name is required.';
    else if (name.length < 2 || name.length > 50) errors.name = 'Name must be 2 to 50 characters.';
    else data.name = name;
  }
  if (!partial || body.email !== undefined) {
    const email = str(body.email).toLowerCase();
    if (!email) errors.email = 'Email is required.';
    else if (!EMAIL_RE.test(email) || email.length > 100) errors.email = 'Enter a valid email address.';
    else data.email = email;
  }
  if (requirePassword || body.password !== undefined) {
    const msg = passwordError(body.password);
    if (msg) errors.password = msg;
    else data.password = body.password;
  }
  return { errors, data };
}

const RESTAURANT_RULES = {
  name: { label: 'Name', min: 2, max: 100, required: true },
  location: { label: 'Location', min: 2, max: 100, required: true },
  cuisine: { label: 'Cuisine', min: 2, max: 60, required: true },
  address: { label: 'Address', min: 0, max: 200, required: false },
  description: { label: 'Description', min: 0, max: 1000, required: false },
  phone: { label: 'Phone', min: 0, max: 30, required: false },
  openingHours: { label: 'Opening hours', min: 0, max: 200, required: false },
};

function validateRestaurant(body, allowedFields, requireAll) {
  const errors = {};
  const data = {};
  for (const f of allowedFields) {
    const rule = RESTAURANT_RULES[f];
    const raw = body[f];
    if (raw === undefined) {
      if (requireAll && rule.required) errors[f] = `${rule.label} is required.`;
      continue;
    }
    if (typeof raw !== 'string') { errors[f] = `${rule.label} must be text.`; continue; }
    const v = raw.trim();
    if (!v && rule.required) errors[f] = `${rule.label} is required.`;
    else if (v && v.length < rule.min) errors[f] = `${rule.label} must be at least ${rule.min} characters.`;
    else if (v.length > rule.max) errors[f] = `${rule.label} must be ${rule.max} characters or fewer.`;
    else if (f === 'phone' && v && !PHONE_RE.test(v)) errors[f] = 'Enter a valid phone number.';
    else data[f] = v;
  }
  return { errors, data };
}

module.exports = {
  ROLES, OWNER_FIELDS, ADMIN_FIELDS,
  isValidId, escapeRegex, exactCI, str,
  passwordError, ratingError, commentError,
  validateUser, validateRestaurant,
};
