# @lp-labs/segment-tree

A generic associative-monoid segment tree preserving noncommutative order and atomic point updates.

## Install

```sh
npm install @lp-labs/segment-tree
```

Version 0.1.0. MIT. Zero runtime, peer, or sibling dependencies. Node >=18;
browser-compatible ES2022 runtime without browser-global reads. ESM and CommonJS
exports have separate matching declarations.

## Quick start

```js
import { SegmentTree } from '@lp-labs/segment-tree';
const text = new SegmentTree(['a', 'b', 'c'], {
  identity: '',
  combine: (left, right) => left + right,
});
text.set(1, 'B');
if (text.query(0, 3) !== 'aBc') throw new Error('order');
console.log(text.query(1, 3)); // Bc
```

## Contract, customization, errors and ownership

`values` is a readonly array; holes are rejected with TypeError, while explicit undefined values are allowed when part of T. Monoid<T> supplies an immutable identity and a pure associative `combine(left, right)` with a two-sided identity. Noncommutative monoids are supported: query preserves input order. The library cannot prove algebraic laws. Inputs/results/identity are retained by reference and MUST be immutable; callback-side mutation of them cannot be rolled back.

maxLength defaults 1,000,000 and must be an integer 0..1,000,000. Empty arrays are valid and query(0,0) returns the monoid identity by its laws. Lengths beyond maxLength and invalid indices/ranges throw RangeError. `get/set` require integer indices 0..length-1. `query(start,end)` accepts integer half-open ranges 0 <= start <= end <= length, including empty ranges. `toArray` returns a fresh leaf array with shared values.

combine must be synchronous and may run during construction, update, and query (including identity combinations). Exceptions propagate. `set` computes all candidate ancestors before committing any nodes; throwing combine therefore leaves all internal nodes/leaves unchanged under the purity contract. Read-only queries change no state. Reentrant operations from combine throw Error; length is immutable metadata and may be read. There is no numeric overflow policy for a generic T: encode domain validation in combine if needed.

Construction O(n) time/storage with power-of-two identity padding; point updates and range queries O(log n), toArray O(n). Generic callback costs are additional. No lazy range updates or built-in numeric coercion.

## Complete public declaration contract

Runtime exports and all exported types are listed below. Internal storage members
are omitted. Optional settings are constructor/function options, not globals.

```ts
export interface Monoid<T> {
  identity: T;
  combine: (left: T, right: T) => T;
}
/** Values and monoid results must be immutable; combine must be pure and associative. */
export declare class SegmentTree<T> {
  readonly length: number;
  constructor(values: readonly T[], monoid: Monoid<T>, maxLength?: number);
  get(index: number): T;
  set(index: number, value: T): void;
  query(start: number, end: number): T;
  toArray(): T[];
}
```

## Development

```sh
npm ci --offline
npm run build
npm run typecheck
npm test
npm run format:check
```

TypeScript ^5.9.3 and Prettier ^3.6.2 are development-only. Offline installation
requires their locked packages already in the local npm cache. Build emits
dist/esm and dist/cjs with separate declarations; tests exercise runtime behavior
and bare-package ESM/CommonJS type consumers with negative checks. No publish
step is needed to build or test.

## Support

If this library is useful to you, consider supporting its maintenance with a [donation via PayPal](https://www.paypal.me/LibinPrasanth).

## Author

Created by [Libin Prasanth](https://www.linkedin.com/in/libinprasanth/). Connect on LinkedIn for updates and discussion.
