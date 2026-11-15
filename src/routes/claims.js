import { Router } from 'express';
import { z } from 'zod';
import Claim from '../models/Claim.js';
import Item from '../models/Item.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler, HttpError, isId, parseWith } from '../utils/http.js';

const router = Router();
router.use(requireAuth);

const claimSchema = z.object({ itemId: z.string().refine(isId, 'Invalid listing.'), message: z.string().trim().min(15).max(1000) }).strict();
router.post('/', asyncHandler(async (req, res) => {
  const data = parseWith(claimSchema, req.body);
  const item = await Item.findById(data.itemId);
  if (!item) throw new HttpError(404, 'Listing not found.');
  if (item.status !== 'open') throw new HttpError(409, 'This listing is already resolved.');
  if (String(item.owner) === req.user.id) throw new HttpError(400, 'You cannot send a request to your own listing.');
  if (await Claim.exists({ item: item.id, claimant: req.user.id })) throw new HttpError(409, 'You already sent a request for this listing.');
  const claim = await Claim.create({ item: item.id, claimant: req.user.id, message: data.message });
  res.status(201).json({ claim });
}));

router.get('/mine', asyncHandler(async (req, res) => {
  const claims = await Claim.find({ claimant: req.user.id })
    .populate({ path: 'item', select: 'title type status images location owner', populate: { path: 'owner', select: 'name email' } })
    .sort({ createdAt: -1 }).lean();
  const safe = claims.map((claim) => {
    if (claim.item?.owner && claim.status !== 'approved') delete claim.item.owner.email;
    return claim;
  });
  res.json({ claims: safe });
}));

router.get('/incoming', asyncHandler(async (req, res) => {
  const owned = await Item.find({ owner: req.user.id }).select('_id').lean();
  const claims = await Claim.find({ item: { $in: owned.map((i) => i._id) } })
    .populate('item', 'title type status images')
    .populate('claimant', 'name email')
    .sort({ createdAt: -1 }).lean();
  const safe = claims.map((claim) => {
    if (claim.claimant && claim.status !== 'approved') delete claim.claimant.email;
    return claim;
  });
  res.json({ claims: safe });
}));

router.patch('/:id', asyncHandler(async (req, res) => {
  if (!isId(req.params.id)) throw new HttpError(404, 'Request not found.');
  const { status } = parseWith(z.object({ status: z.enum(['approved', 'rejected']) }).strict(), req.body);
  const claim = await Claim.findById(req.params.id).populate('item');
  if (!claim || !claim.item) throw new HttpError(404, 'Request not found.');
  if (String(claim.item.owner) !== req.user.id) throw new HttpError(403, 'Only the listing owner can review requests.');
  if (claim.status !== 'pending') throw new HttpError(409, 'This request has already been reviewed.');
  if (claim.item.status !== 'open') throw new HttpError(409, 'The listing is no longer open.');
  if (status === 'approved') {
    const result = await Item.findOneAndUpdate({ _id: claim.item._id, status: 'open' }, { status: 'resolved' });
    if (!result) throw new HttpError(409, 'Another request has already resolved this listing.');
    await Claim.updateMany({ item: claim.item._id, status: 'pending', _id: { $ne: claim._id } }, { status: 'rejected' });
  }
  claim.status = status;
  await claim.save();
  res.json({ claim });
}));

export default router;
