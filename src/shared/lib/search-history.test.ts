import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mergeSearchTerm, SEARCH_HISTORY_LIMIT } from './search-history.ts';

test('ignores empty and whitespace terms', () => {
  assert.deepEqual(mergeSearchTerm(['a'], ''), ['a']);
  assert.deepEqual(mergeSearchTerm(['a'], '   '), ['a']);
});

test('trims and dedupes case-insensitively, newest first', () => {
  assert.deepEqual(mergeSearchTerm(['Iron', 'Gold'], '  iron '), ['iron', 'Gold']);
  assert.deepEqual(mergeSearchTerm(['Iron', 'Gold'], 'gold'), ['gold', 'Iron']);
});

test('prepends new terms and caps at the limit', () => {
  const full = Array.from({ length: SEARCH_HISTORY_LIMIT }, (_, i) => `t${i}`);
  const next = mergeSearchTerm(full, 'new');
  assert.equal(next.length, SEARCH_HISTORY_LIMIT);
  assert.equal(next[0], 'new');
  assert.equal(next.includes(`t${SEARCH_HISTORY_LIMIT - 1}`), false);
});
