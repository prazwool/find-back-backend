import mongoose from 'mongoose';

export const categories = ['Electronics', 'Bags', 'Documents', 'Keys', 'Accessories', 'Clothing', 'Other'];

const itemSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: ['lost', 'found'], required: true },
  title: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, required: true, trim: true, maxlength: 1500 },
  category: { type: String, enum: categories, required: true },
  location: { type: String, required: true, trim: true, maxlength: 120 },
  occurredOn: { type: Date, required: true },
  images: { type: [String], default: [] },
  status: { type: String, enum: ['open', 'resolved'], default: 'open', index: true },
}, { timestamps: true });

itemSchema.index({ createdAt: -1 });
itemSchema.index({ type: 1, status: 1, createdAt: -1 });

export default mongoose.model('Item', itemSchema);
