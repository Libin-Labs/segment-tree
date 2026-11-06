import test from 'node:test';
import assert from 'node:assert/strict';
import { SegmentTree } from '../dist/esm/index.js';
const sum = { identity: 0, combine: (a, b) => a + b };
test('monoid sums, non-power-of-two padding and point update', () => {
  const t = new SegmentTree([1, 2, 3, 4, 5], sum);
  assert.equal(t.query(0, 5), 15);
  assert.equal(t.query(1, 4), 9);
  t.set(2, 10);
  assert.equal(t.query(1, 4), 16);
  assert.equal(t.get(2), 10);
  assert.equal(t.length, 5);
});
test('noncommutative concatenation preserves left to right order', () => {
  const t = new SegmentTree(['a', 'b', 'c', 'd', 'e'], { identity: '', combine: (a, b) => a + b });
  for (let start = 0; start <= 5; start++)
    for (let end = start; end <= 5; end++)
      assert.equal(t.query(start, end), 'abcde'.slice(start, end));
  t.set(1, 'B');
  assert.equal(t.query(0, 5), 'aBcde');
});
test('empty tree and empty ranges return identity', () => {
  assert.throws(() => new SegmentTree(new Array(2), sum), TypeError);
  const t = new SegmentTree([], sum, 0);
  assert.equal(t.query(0, 0), 0);
  assert.equal(t.length, 0);
  assert.throws(() => t.get(0));
  assert.throws(() => t.set(0, 1));
  assert.equal(new SegmentTree([3], sum).query(1, 1), 0);
});
test('throwing combine at a higher ancestor leaves every leaf and node unchanged', () => {
  let calls = 0,
    failAt = Infinity;
  const t = new SegmentTree([1, 2, 3, 4, 5, 6, 7, 8], {
    identity: 0,
    combine(a, b) {
      if (++calls === failAt) throw new Error('combine');
      return a + b;
    },
  });
  calls = 0;
  failAt = 3;
  assert.throws(() => t.set(0, 100));
  failAt = Infinity;
  assert.deepEqual(t.toArray(), [1, 2, 3, 4, 5, 6, 7, 8]);
  assert.equal(t.query(0, 8), 36);
  t.set(0, 100);
  assert.equal(t.query(0, 8), 135);
});
test('reentrant monoid calls reject and result containers are owned', () => {
  let reenter = false,
    t;
  t = new SegmentTree([1, 2], {
    identity: 0,
    combine(a, b) {
      if (reenter) t.set(0, 99);
      return a + b;
    },
  });
  reenter = true;
  assert.throws(() => t.query(0, 2), /Reentrant/);
  assert.throws(() => t.set(1, 8), /Reentrant/);
  reenter = false;
  const result = t.toArray();
  result[0] = 100;
  assert.equal(t.get(0), 1);
  assert.equal(t.query(0, 2), 3);
});
test('range, index and exact length budgets validate', () => {
  const t = new SegmentTree([1, 2], sum, 2);
  for (const [a, b] of [
    [-1, 1],
    [2, 1],
    [0, 3],
    [0, NaN],
    [0.5, 1],
  ])
    assert.throws(() => t.query(a, b));
  for (const i of [-1, 2, NaN, 0.5]) assert.throws(() => t.set(i, 1));
  assert.throws(() => new SegmentTree([1, 2, 3], sum, 2));
  assert.throws(() => new SegmentTree([], sum, -1));
});
test('seeded naive-array oracle checks minimum monoid queries and updates', () => {
  let seed = 354;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed >>> 8;
  };
  const a = Array.from({ length: 67 }, () => random() % 1000),
    t = new SegmentTree(a, { identity: Infinity, combine: Math.min });
  for (let i = 0; i < 2000; i++) {
    const at = random() % a.length,
      value = random() % 1000;
    t.set(at, value);
    a[at] = value;
    const low = random() % 68,
      high = low + (random() % (68 - low));
    assert.equal(t.query(low, high), Math.min(...a.slice(low, high)));
    assert.deepEqual(t.toArray(), a);
  }
});
