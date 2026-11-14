import { load, update } from './_lib/store.js';
import { newToken, drawIfReady, readJson, siteUrl, safeEqual } from './_lib/logic.js';
import { sendMany } from './_lib/mail.js';

// The admin sees who is done and each personal link (to share by hand), never wishes or who drew whom.
export const status = (state, base) => ({
  drawn: !!state.assignments, drawnAt: state.drawnAt,
  participants: state.participants.map((p) => ({
    id: p.id, name: p.name, email: p.email, done: !!p.done, wishes: (p.wishes || []).length,
    invitedAt: p.invitedAt || null, remindedAt: p.remindedAt || null, link: `${base}/lootje?t=${p.token}`,
  })),
  mailConfigured: !!process.env.RESEND_API_KEY, from: process.env.MAIL_FROM || 'Sinterklaas <onboarding@resend.dev>',
});

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  // The example key from .env.example is public, so it never opens the admin page.
  if (process.env.ADMIN_KEY === 'kies-een-lange-geheime-sleutel') return res.status(403).json({ error: 'Kies eerst een eigen ADMIN_KEY in plaats van de voorbeeldwaarde' });
  if (!process.env.ADMIN_KEY || !safeEqual(req.query.k, process.env.ADMIN_KEY)) return res.status(403).json({ error: 'Geen toegang' });
  try {
    if (req.method === 'GET') return res.json(status((await load()).state, siteUrl(req)));
    if (req.method !== 'POST') return res.status(405).end();
    const body = await readJson(req);

    if (body.action === 'setup') {
      const rows = (body.participants || []).map((r) => ({ id: String(r.id || ''), name: String(r.name || '').trim().slice(0, 40), email: String(r.email || '').trim().toLowerCase().slice(0, 120) }))
        .filter((r) => r.name || r.email);
      if (rows.length < 2 || rows.some((r) => !r.name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(r.email))) return res.status(400).json({ error: 'Vul voor iedereen een naam en geldig mailadres in (minstens twee)' });
      if (new Set(rows.map((r) => r.email)).size !== rows.length) return res.status(400).json({ error: 'Elk mailadres mag maar één keer voorkomen' });
      let justDrawn;
      const out = await update((state) => {
        justDrawn = null; // update() reruns this after a write conflict
        if (state.assignments) throw Object.assign(new Error('De lootjes zijn al getrokken, de deelnemers liggen vast'), { status: 409 });
        // Match on id first, so correcting a mail address keeps the link and the wish list.
        const byId = new Map(state.participants.map((p) => [p.id, p]));
        const byEmail = new Map(state.participants.map((p) => [p.email, p]));
        const seen = new Set();
        state.participants = rows.map((r) => {
          let old = byId.get(r.id) || byEmail.get(r.email);
          if (old && seen.has(old.id)) old = null; // one existing participant is never used for two rows
          if (old) seen.add(old.id);
          return old ? { ...old, name: r.name, email: r.email }
            : { id: newToken().slice(0, 8), token: newToken(), wishes: [], note: '', done: false, name: r.name, email: r.email };
        });
        // Removing the last person who was not done can complete the group.
        if (drawIfReady(state)) justDrawn = state.participants;
        return status(state, siteUrl(req));
      });
      if (justDrawn) await sendMany('drawn', justDrawn, siteUrl(req));
      return res.json(out);
    }

    if (body.action === 'invite' || body.action === 'remind') {
      const kind = body.action;
      const { state } = await load();
      if (kind === 'remind' && state.assignments) throw Object.assign(new Error('De lootjes zijn al getrokken'), { status: 409 });
      const ids = new Set(body.ids || []);
      const targets = state.participants.filter((p) => (ids.size ? ids.has(p.id) : true) && (kind === 'invite' || !p.done));
      // After the draw "mail again" resends the draw mail, not the invitation.
      const results = await sendMany(kind === 'invite' && state.assignments ? 'drawn' : kind, targets, siteUrl(req));
      // Only a mail that went out counts as sent.
      const sent = new Set(targets.filter((p, i) => results[i].ok).map((p) => p.id));
      const out = !sent.size ? status(state, siteUrl(req)) : await update((s) => {
        const now = new Date().toISOString();
        s.participants.forEach((p) => { if (sent.has(p.id)) p[kind === 'invite' ? 'invitedAt' : 'remindedAt'] = now; });
        return status(s, siteUrl(req));
      });
      return res.json({ results, ...out });
    }
    return res.status(400).json({ error: 'Onbekende actie' });
  } catch (e) {
    if (!e.status) console.error(e);
    return res.status(e.status || 500).json({ error: e.status ? e.message : 'Er ging iets mis: ' + String(e.message).slice(0, 200) });
  }
}
