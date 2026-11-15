import { Router } from 'express';
import Item from '../models/Item.js';
import User from '../models/User.js';
import { asyncHandler } from '../utils/http.js';

const router = Router();
router.get('/', asyncHandler(async (_req, res) => {
  const [open, reunited, members] = await Promise.all([
    Item.countDocuments({ status: 'open' }),
    Item.countDocuments({ status: 'resolved' }),
    User.countDocuments(),
  ]);
  res.json({ open, reunited, members });
}));
export default router;
