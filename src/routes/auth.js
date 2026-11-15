import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import User from '../models/User.js';
import { asyncHandler, HttpError, parseWith } from '../utils/http.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 25, standardHeaders: 'draft-7', legacyHeaders: false, message: { message: 'Too many attempts. Try again shortly.' } });
const email = z.string().trim().email().max(254).transform((v) => v.toLowerCase());
const registerSchema = z.object({
  name: z.string().trim().min(2).max(60),
  email,
  password: z.string().min(8).max(72),
}).strict();
const loginSchema = z.object({ email, password: z.string().min(1) }).strict();
function session(user) {
  return { token: jwt.sign({}, process.env.JWT_SECRET, { subject: user.id, expiresIn: process.env.JWT_EXPIRES_IN || '7d' }), user: user.toPublic() };
}
router.post('/register', authLimiter, asyncHandler(async (req, res) => {
  const data = parseWith(registerSchema, req.body);
  if (await User.exists({ email: data.email })) throw new HttpError(409, 'This email is already registered.');
  const passwordHash = await bcrypt.hash(data.password, 12);
  const user = await User.create({ name: data.name, email: data.email, passwordHash });
  res.status(201).json(session(user));
}));
router.post('/login', authLimiter, asyncHandler(async (req, res) => {
  const data = parseWith(loginSchema, req.body);
  const user = await User.findOne({ email: data.email }).select('+passwordHash');
  if (!user || !(await bcrypt.compare(data.password, user.passwordHash))) throw new HttpError(401, 'Incorrect email or password.');
  res.json(session(user));
}));
router.get('/me', requireAuth, (req, res) => res.json({ user: req.user.toPublic() }));
export default router;
