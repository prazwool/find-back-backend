import { test } from 'node:test';
import assert from 'node:assert/strict';
import { escapeRegex, isId, HttpError, parseWith } from '../src/utils/http.js';
import { z } from 'zod';

test('MongoDB IDs require exactly 24 hex characters', () => {
  assert.equal(isId('66a6072bed99944bb288586d'), true);
  assert.equal(isId('incorrect-id'), false);
});
test('query input is escaped before making a regular expression', () => {
  assert.equal(escapeRegex('(test)+?'), '\\(test\\)\\+\\?');
});
test('bad request validation surfaces a readable 400 error', () => {
  assert.throws(() => parseWith(z.object({ title: z.string().min(5) }), { title: 'x' }), (err) => err instanceof HttpError && err.status === 400);
});
