/**
 * Passenger API error envelope adapter.
 *
 * Backend errors arrive in one of two shapes:
 *
 *  1. Domain error (business-rule failures):
 *     { detail: { error: string, message: string, ...extra } }
 *
 *  2. FastAPI request-validation failure (HTTP 422):
 *     { detail: [{ type, loc: (string|number)[], msg, input }, ...] }
 *
 * This adapter normalizes both into a single Error object carrying:
 *   - message      human-readable text safe to show in an Alert
 *   - code         detail.error for domain errors, 'validation_error' for 422
 *   - detail       the raw detail (object or array) for callers that need extras
 *   - fields       for 422 only: [{ path: string, message: string, input: unknown }]
 *
 * Never treat detail.message as present on a 422 body — it isn't.
 */

const pathFromLoc = (loc) => {
  if (!Array.isArray(loc)) return '';
  // Drop the leading "body" segment FastAPI adds; keep the rest (which may
  // include array indices like seats[1].traveller.phone).
  return loc
    .filter((seg) => seg !== 'body')
    .map((seg) => (typeof seg === 'number' ? `[${seg}]` : seg))
    .join('.')
    .replace(/\.\[/g, '[');
};

export const buildApiError = (status, data) => {
  const detail = data?.detail;

  if (Array.isArray(detail)) {
    const fields = detail.map((item) => ({
      path: pathFromLoc(item.loc),
      message: item.msg || 'Invalid value',
      input: item.input,
    }));
    const message = fields[0]?.message || 'Request validation failed';
    const err = new Error(message);
    err.status = status;
    err.code = 'validation_error';
    err.detail = detail;
    err.fields = fields;
    return err;
  }

  if (detail && typeof detail === 'object') {
    const err = new Error(detail.message || `Request failed with status ${status}`);
    err.status = status;
    err.code = detail.error || null;
    err.detail = detail;
    err.fields = [];
    return err;
  }

  const err = new Error(`Request failed with status ${status}`);
  err.status = status;
  err.code = null;
  err.detail = detail ?? null;
  err.fields = [];
  return err;
};

/** Find the first field error whose path ends with a given key, e.g. 'phone'. */
export const fieldError = (err, key) => {
  if (!err?.fields?.length) return null;
  return err.fields.find((f) => f.path === key || f.path.endsWith(`.${key}`)) || null;
};

/** Shared response handler used by every passenger API service module. */
export const handleApiResponse = async (response, url) => {
  const text = await response.text();
  console.log(`[API] ${url} - Status: ${response.status}`);
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch (e) {
    console.error(`[API] JSON parse error for ${url}. Response:`, text);
    throw new Error(`Server returned invalid JSON (status ${response.status})`);
  }
  if (!response.ok) {
    throw buildApiError(response.status, data);
  }
  return data;
};