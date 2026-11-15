import multer from 'multer';

export function notFound(_req, _res, next) {
  const err = new Error('Endpoint not found.');
  err.status = 404;
  next(err);
}

export function errorHandler(err, _req, res, _next) {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: err.code === 'LIMIT_FILE_SIZE' ? 'Each image must be 5 MB or smaller.' : 'Maximum 3 images per listing.' });
  }
  if (err?.code === 11000) return res.status(409).json({ message: 'A record with these details already exists.' });
  if (err?.name === 'CastError') return res.status(400).json({ message: 'Invalid identifier.' });
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ message: status >= 500 ? 'Something went wrong on the server.' : err.message });
}
