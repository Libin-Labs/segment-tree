export interface Monoid<T> {
  identity: T;
  combine: (left: T, right: T) => T;
}
/** Values and monoid results must be immutable; combine must be pure and associative. */
export class SegmentTree<T> {
  private readonly tree: T[];
  private readonly base: number;
  readonly length: number;
  private busy = false;
  private readonly identity: T;
  private readonly combine: Monoid<T>['combine'];
  constructor(values: readonly T[], monoid: Monoid<T>, maxLength = 1_000_000) {
    if (
      !Number.isSafeInteger(maxLength) ||
      maxLength < 0 ||
      maxLength > 1_000_000 ||
      !Array.isArray(values) ||
      values.length > maxLength
    )
      throw new RangeError('Invalid length budget');
    if (typeof monoid.combine !== 'function') throw new TypeError('Expected combine function');
    this.length = values.length;
    this.identity = monoid.identity;
    this.combine = monoid.combine;
    let base = 1;
    while (base < values.length) base *= 2;
    this.base = base;
    this.tree = new Array<T>(base * 2).fill(this.identity);
    for (let i = 0; i < values.length; i++) {
      if (!Object.hasOwn(values, i)) throw new TypeError('Sparse input arrays are not supported');
      this.tree[base + i] = values[i]!;
    }
    for (let i = base - 1; i > 0; i--)
      this.tree[i] = this.call(this.tree[2 * i]!, this.tree[2 * i + 1]!);
  }
  private guard(): void {
    if (this.busy) throw new Error('Reentrant monoid access');
  }
  private call(left: T, right: T): T {
    this.busy = true;
    try {
      return this.combine(left, right);
    } finally {
      this.busy = false;
    }
  }
  private index(index: number): void {
    if (!Number.isSafeInteger(index) || index < 0 || index >= this.length)
      throw new RangeError('Index out of bounds');
  }
  get(index: number): T {
    this.guard();
    this.index(index);
    return this.tree[this.base + index]!;
  }
  set(index: number, value: T): void {
    this.guard();
    this.index(index);
    let position = this.base + index,
      current = value;
    const changes: [number, T][] = [[position, current]];
    while (position > 1) {
      current =
        position % 2 === 0
          ? this.call(current, this.tree[position + 1]!)
          : this.call(this.tree[position - 1]!, current);
      position = Math.floor(position / 2);
      changes.push([position, current]);
    }
    for (const [at, next] of changes) this.tree[at] = next;
  }
  query(start: number, end: number): T {
    this.guard();
    if (
      !Number.isSafeInteger(start) ||
      !Number.isSafeInteger(end) ||
      start < 0 ||
      start > end ||
      end > this.length
    )
      throw new RangeError('Invalid half-open range');
    let left = this.identity,
      right = this.identity,
      low = start + this.base,
      high = end + this.base;
    while (low < high) {
      if (low % 2) left = this.call(left, this.tree[low++]!);
      if (high % 2) right = this.call(this.tree[--high]!, right);
      low = Math.floor(low / 2);
      high = Math.floor(high / 2);
    }
    return this.call(left, right);
  }
  toArray(): T[] {
    this.guard();
    return this.tree.slice(this.base, this.base + this.length);
  }
}
