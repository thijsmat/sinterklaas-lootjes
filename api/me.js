import { load, update } from './_lib/store.js';
import { cleanWishes, cleanNote, draw, readJson, siteUrl, safeEqual } from './_lib/logic.js';
import { sendMany, EVENT } from './_lib/mail.js';

const find = (state, t) => state.participants.find((p) => t && safeEqual(p.token, t));

function view(state, me) {
  const out = {
    me: { name: me.name, wishes: me.wishes || [], note: me.note || '', done: !!me.done },
    people: state.participants.map((p) => ({ name: p.name, done: !!p.done, me: p.id === me.id })),
    drawn: !!state.assignments, event: EVENT,
  };
  if (state.assignments) {
    const t = state.participants.find((p) => p.id === state.assignments[me.id]);
    out.target = { name: t.name, wishes: t.wishes || [], note: t.note || '' };
  }
  return out;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const token = req.query.t;
  try {
    if (req.method === 'GET') {
      const { state } = await load();
      const me = find(state, token);
      if (!me) return res.status(404).json({ error: 'Onbekende link' });
      return res.json(view(state, me));
    }
    if (req.method !== 'POST') return res.status(405).end();
    const body = await readJson(req);
    let justDrawn = null;
    const result = await update((state) => {
      const me = find(state, token);
      if (!me) return null;
      me.wishes = cleanWishes(body.wishes);
      me.note = cleanNote(body.note);
      if (body.done === true) {
        if (!me.wishes.length) throw Object.assign(new Error('Voeg minstens één wens toe'), { status: 400 });
        me.done = true;
      } else if (body.done === false && !state.assignments) me.done = false;
      if (!state.assignments && state.participants.length >= 2 && state.participants.every((p) => p.done)) {
        state.assignments = draw(state.participants.map((p) => p.id));
        state.drawnAt = new Date().toISOString();
        justDrawn = state.participants;
      }
      return view(state, me);
    });
    if (!result) return res.status(404).json({ error: 'Onbekende link' });
    if (justDrawn) result.mails = (await sendMany('drawn', justDrawn, siteUrl(req))).map(({ ok }) => ok);
    return res.json(result);
  } catch (e) {
    return res.status(e.status || 500).json({ error: e.status ? e.message : 'Er ging iets mis bij de Sint' });
  }
}
