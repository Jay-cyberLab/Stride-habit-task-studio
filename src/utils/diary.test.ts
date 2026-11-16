import test from 'node:test';
import assert from 'node:assert/strict';
import { DiaryEntry } from '../types';
import {
  filterAndSortDiaryEntries,
  hashDiaryPassword,
  validateDiaryEntryInput,
  validatePasswordSetup,
} from './diary';

test('validatePasswordSetup checks length and confirmation match', () => {
  assert.ok(validatePasswordSetup('abc', 'abc'));
  assert.ok(validatePasswordSetup('secret1', 'secret2'));
  assert.equal(validatePasswordSetup('secret1', 'secret1'), null);
});

test('validateDiaryEntryInput rejects empty thoughts and overly long titles', () => {
  assert.ok(validateDiaryEntryInput({ title: 'Day 1', content: '   ' }));
  assert.ok(validateDiaryEntryInput({ title: 'x'.repeat(101), content: 'Hello' }));
  assert.equal(validateDiaryEntryInput({ title: 'Quiet Morning', content: 'Good focus.' }), null);
});

test('hashDiaryPassword produces consistent digests for identical inputs and differs for wrong passwords', async () => {
  const hashA = await hashDiaryPassword('my-pass-123', 'salt-1');
  const hashB = await hashDiaryPassword('my-pass-123', 'salt-1');
  const hashWrong = await hashDiaryPassword('other-pass', 'salt-1');

  assert.equal(hashA, hashB);
  assert.notEqual(hashA, hashWrong);
  assert.ok(hashA.length >= 16);
});

test('filterAndSortDiaryEntries sorts newest date first and filters by query', () => {
  const entries: DiaryEntry[] = [
    {
      id: '1',
      date: '2026-11-12',
      title: 'Early reflection',
      content: 'Walked in the rain.',
      mood: 'Calm',
      createdAt: '2026-11-12T08:00:00Z',
      updatedAt: '2026-11-12T08:00:00Z',
    },
    {
      id: '2',
      date: '2026-11-15',
      title: 'Project launch',
      content: 'Shipped the new dashboard.',
      mood: 'Focused',
      createdAt: '2026-11-15T19:00:00Z',
      updatedAt: '2026-11-15T19:00:00Z',
    },
  ];

  const sorted = filterAndSortDiaryEntries(entries, '');
  assert.deepEqual(
    sorted.map((e) => e.id),
    ['2', '1']
  );

  const filtered = filterAndSortDiaryEntries(entries, 'rain');
  assert.deepEqual(
    filtered.map((e) => e.id),
    ['1']
  );
});
