/**
 * Client-side traveller field validation. This mirrors the backend rules in
 * PASSENGER_FE_LATER_COMMITS_INTEGRATION.md §5 closely enough to catch typos
 * immediately, but the backend always re-validates — this is UX only, never
 * the source of truth. See doc §5.1.
 */

// Indian mobile: 10 digits after stripping separators/leading 0/91, starting 6-9.
const INDIAN_MOBILE_RE = /^[6-9]\d{9}$/;
// International: leading +, 8-15 digits after separators removed.
const INTL_RE = /^\+\d{8,15}$/;

export const validateTravellerPhone = (rawPhone) => {
  const value = (rawPhone || '').trim();
  if (!value) return { valid: false, message: 'Phone is required' };
  if (value.length < 5 || value.length > 20) {
    return { valid: false, message: 'Phone must be 5–20 characters' };
  }

  // Strip spaces, parentheses, periods, hyphens for digit counting.
  const stripped = value.replace(/[\s().-]/g, '');

  if (stripped.startsWith('+')) {
    if (!INTL_RE.test(stripped)) {
      return { valid: false, message: 'Enter a valid international number (+ and 8–15 digits)' };
    }
    return { valid: true, normalized: stripped };
  }

  // Indian number: allow optional leading 0 or 91 prefix.
  let digits = stripped;
  if (digits.startsWith('91') && digits.length === 12) digits = digits.slice(2);
  else if (digits.startsWith('0') && digits.length === 11) digits = digits.slice(1);

  if (!INDIAN_MOBILE_RE.test(digits)) {
    return { valid: false, message: 'Enter a valid 10-digit Indian mobile number' };
  }
  return { valid: true, normalized: `+91${digits}` };
};

export const validateTravellerEmail = (rawEmail) => {
  const value = (rawEmail || '').trim();
  if (!value) return { valid: true, normalized: null }; // optional field
  if (value.length > 255) {
    return { valid: false, message: 'Email must be 255 characters or fewer' };
  }
  // Syntax check only — no deliverability/DNS claim, matching doc §5.3.
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!EMAIL_RE.test(value)) {
    return { valid: false, message: 'Enter a valid email address' };
  }
  return { valid: true, normalized: value.toLowerCase() };
};

export const validateTravellerName = (rawName) => {
  const value = (rawName || '').trim();
  if (!value) return { valid: false, message: 'Name is required' };
  if (value.length > 120) {
    return { valid: false, message: 'Name must be 120 characters or fewer' };
  }
  return { valid: true, normalized: value };
};

/**
 * Validate a guest/profile traveller form. Returns { valid, errors } where
 * errors is keyed by field name for inline display.
 */
export const validateTravellerForm = ({ full_name, phone, email }) => {
  const errors = {};
  const nameCheck = validateTravellerName(full_name);
  if (!nameCheck.valid) errors.full_name = nameCheck.message;

  const phoneCheck = validateTravellerPhone(phone);
  if (!phoneCheck.valid) errors.phone = phoneCheck.message;

  const emailCheck = validateTravellerEmail(email);
  if (!emailCheck.valid) errors.email = emailCheck.message;

  return { valid: Object.keys(errors).length === 0, errors };
};