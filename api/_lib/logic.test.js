import assert from 'node:assert';
import { draw, cleanWishes } from './logic.js';
const ids = ['a', 'b', 'c', 'd', 'e'];
for (let n = 0; n < 5000; n++) {
  const m = draw(ids);
  assert.deepStrictEqual(Object.keys(m).sort(), ids);
  assert.deepStrictEqual(Object.values(m).sort(), ids, 'everyone receives exactly once');
  for (const id of ids) assert.notStrictEqual(m[id], id, 'nobody draws themselves');
}
assert.deepStrictEqual(cleanWishes([{ title: ' Boek ', link: 'bol.com/x' }, { title: '' }]),
  [{ title: 'Boek', link: 'https://bol.com/x', note: '' }]);
console.log('ok');
