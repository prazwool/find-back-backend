import multer from 'multer';
import sharp from 'sharp';
import { randomUUID } from 'node:crypto';
import { mkdir, unlink } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { HttpError } from '../utils/http.js';

export const uploadDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../uploads');
const allowed = ['image/jpeg', 'image/png', 'image/webp'];

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 3 },
  fileFilter(_req, file, cb) {
    if (!allowed.includes(file.mimetype)) return cb(new HttpError(400, 'Only JPEG, PNG and WEBP photos are allowed.'));
    cb(null, true);
  },
}).array('images', 3);

export async function saveImages(files = []) {
  await mkdir(uploadDir, { recursive: true });
  const urls = [];
  try {
    for (const file of files) {
      const filename = `${randomUUID()}.webp`;
      await sharp(file.buffer, { limitInputPixels: 25_000_000 })
        .rotate()
        .resize({ width: 1400, height: 1400, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 82 })
        .toFile(path.join(uploadDir, filename));
      urls.push(`/uploads/${filename}`);
    }
  } catch {
    await deleteImages(urls);
    throw new HttpError(400, 'Could not process one of the images. Use a valid JPEG, PNG or WEBP file.');
  }
  return urls;
}

export async function deleteImages(urls = []) {
  await Promise.all(urls.map(async (url) => {
    const name = path.basename(url);
    if (!/^[a-f0-9-]{36}\.webp$/i.test(name)) return;
    try { await unlink(path.join(uploadDir, name)); } catch { /* already deleted */ }
  }));
}
