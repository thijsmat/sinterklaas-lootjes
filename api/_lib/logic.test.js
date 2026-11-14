import assert from 'node:assert';
import { draw, drawIfReady, cleanWishes } from './logic.js';
import { status } from '../admin.js';
import { view } from '../me.js';
const ids = ['a', 'b', 'c', 'd', 'e'];
for (let n = 0; n < 5000; n++) {
  const m = draw(ids);
  assert.deepStrictEqual(Object.keys(m).sort(), ids);
  assert.deepStrictEqual(Object.values(m).sort(), ids, 'everyone receives exactly once');
  for (const id of ids) assert.notStrictEqual(m[id], id, 'nobody draws themselves');
}
assert.deepStrictEqual(cleanWishes([{ title: ' Boek ', link: 'bol.com/x' }, { title: '' }]),
  [{ title: 'Boek', link: 'https://bol.com/x', note: '' }]);
assert.deepStrictEqual(cleanWishes([null]), []);

// The draw happens once, and only when everyone is done.
const mens = (id, done) => ({ id, token: 'tok-' + id, name: 'Naam-' + id, email: id + '@x.nl', done, wishes: [{ title: 'wens-' + id }], note: 'notitie-' + id });
const state = { participants: [mens('a', true), mens('b', true), mens('c', false)], assignments: null, drawnAt: null };
assert.strictEqual(drawIfReady(state), false);
assert.strictEqual(state.assignments, null);
state.participants[2].done = true;
assert.strictEqual(drawIfReady(state), true);
const eerste = JSON.stringify(state.assignments);
assert.strictEqual(drawIfReady(state), false, 'never draws twice');
assert.strictEqual(JSON.stringify(state.assignments), eerste);

// Secrecy: the admin never gets wishes, notes or who drew whom.
const beheer = JSON.stringify(status(state, 'http://x'));
for (const geheim of ['wens-', 'notitie-', 'assignments']) assert.ok(!beheer.includes(geheim), 'admin sees ' + geheim);

// A participant sees only their own list and the list of the person they drew.
const ik = JSON.stringify(view(state, state.participants[0]));
const doel = state.assignments.a, ander = ['b', 'c'].find((id) => id !== doel);
assert.ok(ik.includes('wens-a') && ik.includes('wens-' + doel));
assert.ok(!ik.includes('wens-' + ander) && !ik.includes('tok-') && !ik.includes('@x.nl'));
console.log('ok');
