import { Router } from 'express';
import { z } from 'zod';
import Item, { categories } from '../models/Item.js';
import Claim from '../models/Claim.js';
import { requireAuth } from '../middleware/auth.js';
import { upload, saveImages, deleteImages } from '../middleware/uploads.js';
import { asyncHandler, escapeRegex, HttpError, isId, parseWith } from '../utils/http.js';

const router = Router();
const dateField = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD.').refine((v) => {
  const d = new Date(`${v}T00:00:00Z`);
  // One-day UTC allowance avoids rejecting today's date in positive UTC offsets.
  const latest = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return !Number.isNaN(d.valueOf()) && d.toISOString().startsWith(v) && d <= latest;
}, 'Enter a real date that is not in the future.');
const itemSchema = z.object({
  type: z.enum(['lost', 'found']),
  title: z.string().trim().min(5).max(100),
  description: z.string().trim().min(15).max(1500),
  category: z.enum(categories),
  location: z.string().trim().min(3).max(120),
  occurredOn: dateField,
}).strict();
const editSchema = itemSchema.partial().extend({ status: z.enum(['open', 'resolved']).optional() }).strict().refine((value) => Object.keys(value).length > 0, 'No changes provided.');

router.get('/', asyncHandler(async (req, res) => {
  const q = String(req.query.q || '').trim().slice(0, 80);
  const type = ['lost', 'found'].includes(req.query.type) ? req.query.type : undefined;
  const category = categories.includes(req.query.category) ? req.query.category : undefined;
  const status = ['open', 'resolved', 'all'].includes(req.query.status) ? req.query.status : 'open';
  const page = Math.min(10000, Math.max(1, Number.parseInt(String(req.query.page || '1'), 10) || 1));
  const limit = Math.min(24, Math.max(1, Number.parseInt(String(req.query.limit || '9'), 10) || 9));
  const filter = {};
  if (type) filter.type = type;
  if (category) filter.category = category;
  if (status !== 'all') filter.status = status;
  if (q) {
    const pattern = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ title: pattern }, { description: pattern }, { location: pattern }];
  }
  const [total, items] = await Promise.all([
    Item.countDocuments(filter),
    Item.find(filter).populate('owner', 'name').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
  ]);
  res.json({ items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
}));

router.get('/mine', requireAuth, asyncHandler(async (req, res) => {
  const items = await Item.find({ owner: req.user.id }).sort({ createdAt: -1 }).lean();
  res.json({ items });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  if (!isId(req.params.id)) throw new HttpError(404, 'Listing not found.');
  const item = await Item.findById(req.params.id).populate('owner', 'name createdAt').lean();
  if (!item) throw new HttpError(404, 'Listing not found.');
  res.json({ item });
}));

router.post('/', requireAuth, upload, asyncHandler(async (req, res) => {
  const data = parseWith(itemSchema, req.body);
  const images = await saveImages(req.files);
  try {
    const item = await Item.create({ ...data, owner: req.user.id, images, occurredOn: new Date(`${data.occurredOn}T12:00:00Z`) });
    res.status(201).json({ item });
  } catch (err) {
    await deleteImages(images);
    throw err;
  }
}));

router.patch('/:id', requireAuth, asyncHandler(async (req, res) => {
  if (!isId(req.params.id)) throw new HttpError(404, 'Listing not found.');
  const data = parseWith(editSchema, req.body);
  const item = await Item.findById(req.params.id);
  if (!item) throw new HttpError(404, 'Listing not found.');
  if (String(item.owner) !== req.user.id) throw new HttpError(403, 'Only the owner can edit this listing.');
  if (data.occurredOn) data.occurredOn = new Date(`${data.occurredOn}T12:00:00Z`);
  Object.assign(item, data);
  await item.save();
  if (data.status === 'resolved') await Claim.updateMany({ item: item.id, status: 'pending' }, { status: 'rejected' });
  res.json({ item });
}));

router.delete('/:id', requireAuth, asyncHandler(async (req, res) => {
  if (!isId(req.params.id)) throw new HttpError(404, 'Listing not found.');
  const item = await Item.findById(req.params.id);
  if (!item) throw new HttpError(404, 'Listing not found.');
  if (String(item.owner) !== req.user.id) throw new HttpError(403, 'Only the owner can remove this listing.');
  await Promise.all([Item.deleteOne({ _id: item.id }), Claim.deleteMany({ item: item.id })]);
  await deleteImages(item.images);
  res.json({ message: 'Listing deleted.' });
}));

export default router;
