export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export function parseWith(schema, value) {
  const result = schema.safeParse(value);
  if (!result.success) {
    const first = result.error.issues[0];
    throw new HttpError(400, `${first.path.join('.') || 'Input'}: ${first.message}`);
  }
  return result.data;
}

export function isId(value) {
  return /^[a-f\d]{24}$/i.test(String(value));
}

export function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
