import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { HttpError, asyncHandler } from '../utils/http.js';

export const requireAuth = asyncHandler(async (req, _res, next) => {
  const match = /^Bearer (.+)$/i.exec(req.get('authorization') || '');
  if (!match) throw new HttpError(401, 'Please sign in to continue.');
  let payload;
  try { payload = jwt.verify(match[1], process.env.JWT_SECRET); }
  catch { throw new HttpError(401, 'Your session has expired. Please sign in again.'); }
  const user = await User.findById(payload.sub);
  if (!user) throw new HttpError(401, 'Account no longer exists.');
  req.user = user;
  next();
});
