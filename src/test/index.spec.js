/* eslint-env mocha */

import assert from 'assert';
import { getRouteNameMap } from '../index';

describe('getRouteMap', () => {
  it('should accept a string argument', () => {
    const expected = { foo: 'foo' };
    const actual = getRouteNameMap('foo');
    assert.deepEqual(expected, actual);
  });

  it('should accept an array argument', () => {
    const expected = { bar: 'bar' };
    const actual = getRouteNameMap(['bar']);
    assert.deepEqual(expected, actual);
  });

  it('should accept an object argument', () => {
    const expected = { baz: 'baz' };
    const actual = getRouteNameMap({ baz: 'baz' });
    assert.deepEqual(expected, actual);
  });
});
