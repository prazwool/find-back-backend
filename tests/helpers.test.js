import { test } from 'node:test';
import assert from 'node:assert/strict';
import { escapeRegex, isId, HttpError } from '../src/utils/http.js';

test('ObjectId syntax is checked strictly', () => {
  assert.equal(isId('6a255164ec648c758f62ca90'), true);
  assert.equal(isId('ABCDEF123456ABCDEF123456'), true);
  assert.equal(isId('6a255164ec648c758f62ca9'), false);
  assert.equal(isId('../../'), false);
});
test('regex special characters in a search are treated literally', () => {
  const pattern = new RegExp(escapeRegex('[bag](?!)'), 'i');
  assert.equal(pattern.test('lost [bag](?!) yesterday'), true);
  assert.equal(pattern.test('lost bag yesterday'), false);
});
test('HTTP errors preserve error status', () => {
  assert.equal(new HttpError(403, 'No access').status, 403);
});
