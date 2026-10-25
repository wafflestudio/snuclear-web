import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  getKoreaDate,
  getPeriodStatus,
} from '../src/pages/home/sugangPeriod.ts';

test('uses the Korean date at midnight regardless of the system timezone', () => {
  assert.equal(getKoreaDate(new Date('2026-08-10T14:59:59Z')), '2026-08-10');
  assert.equal(getKoreaDate(new Date('2026-08-10T15:00:00Z')), '2026-08-11');
});

test('keeps upcoming and current ranges through the end date', () => {
  const range = '2026-08-10(월) ~ 2026-08-12(수)';
  assert.equal(getPeriodStatus(range, '2026-08-09'), 'upcoming');
  assert.equal(getPeriodStatus(range, '2026-08-10'), 'current');
  assert.equal(getPeriodStatus(range, '2026-08-12'), 'current');
  assert.equal(getPeriodStatus(range, '2026-08-13'), 'past');
});

test('supports single dates, unpadded dates and ranges across years', () => {
  assert.equal(getPeriodStatus('2026-8-1(토)', '2026-08-01'), 'current');
  assert.equal(getPeriodStatus('2026-8-1(토)', '2026-08-02'), 'past');
  assert.equal(
    getPeriodStatus('2026-12-30 ~ 2027-1-2', '2027-01-01'),
    'current'
  );
});

test('preserves unknown, invalid and reversed dates', () => {
  for (const date of [
    '',
    '추후 공지',
    '2026-02-30',
    '2026-13-01',
    '2026-08-12 ~ 2026-08-10',
  ]) {
    assert.equal(getPeriodStatus(date, '2026-10-25'), 'unknown');
  }
});
