import { SegmentTree, type Monoid } from '@lp-labs/segment-tree';
const monoid: Monoid<string> = { identity: '', combine: (a, b) => a + b };
const tree = new SegmentTree(['a', 'b'], monoid);
const value: string = tree.query(0, 2);
// @ts-expect-error string payload required
tree.set(0, 1);
// @ts-expect-error integer coordinate represented as number
tree.query('0', 2);
void value;
