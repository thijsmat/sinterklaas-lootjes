import { load, update } from './_lib/store.js';
import { newToken, readJson, siteUrl, safeEqual } from './_lib/logic.js';
import { sendMany } from './_lib/mail.js';

// The admin sees who is done and each personal link (to share by hand), never wishes or who drew whom.
const status = (state, base) => ({
  drawn: !!state.assignments, drawnAt: state.drawnAt,
  participants: state.participants.map((p) => ({
    id: p.id, name: p.name, email: p.email, done: !!p.done, wishes: (p.wishes || []).length,
    invitedAt: p.invitedAt || null, remindedAt: p.remindedAt || null, link: `${base}/lootje?t=${p.token}`,
  })),
  mailConfigured: !!process.env.RESEND_API_KEY, from: process.env.MAIL_FROM || 'Sinterklaas <onboarding@resend.dev>',
});

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!process.env.ADMIN_KEY || !safeEqual(req.query.k, process.env.ADMIN_KEY)) return res.status(403).json({ error: 'Geen toegang' });
  try {
    if (req.method === 'GET') return res.json(status((await load()).state, siteUrl(req)));
    if (req.method !== 'POST') return res.status(405).end();
    const body = await readJson(req);

    if (body.action === 'setup') {
      const rows = (body.participants || []).map((r) => ({ name: String(r.name || '').trim().slice(0, 40), email: String(r.email || '').trim().toLowerCase().slice(0, 120) }))
        .filter((r) => r.name || r.email);
      if (rows.length < 2 || rows.some((r) => !r.name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(r.email))) return res.status(400).json({ error: 'Vul voor iedereen een naam en geldig mailadres in (minstens twee)' });
      if (new Set(rows.map((r) => r.email)).size !== rows.length) return res.status(400).json({ error: 'Elk mailadres mag maar één keer voorkomen' });
      const out = await update((state) => {
        if (state.assignments) throw Object.assign(new Error('De lootjes zijn al getrokken, de deelnemers liggen vast'), { status: 409 });
        const byEmail = new Map(state.participants.map((p) => [p.email, p]));
        state.participants = rows.map((r) => {
          const old = byEmail.get(r.email);
          return old ? { ...old, name: r.name } : { id: newToken().slice(0, 8), token: newToken(), wishes: [], note: '', done: false, ...r };
        });
        return status(state, siteUrl(req));
      });
      return res.json(out);
    }

    if (body.action === 'invite' || body.action === 'remind') {
      const kind = body.action;
      let targets = [];
      await update((state) => {
        if (kind === 'remind' && state.assignments) throw Object.assign(new Error('De lootjes zijn al getrokken'), { status: 409 });
        const ids = new Set(body.ids || []);
        targets = state.participants.filter((p) => (ids.size ? ids.has(p.id) : true) && (kind === 'invite' || !p.done));
        const now = new Date().toISOString();
        targets.forEach((p) => { p[kind === 'invite' ? 'invitedAt' : 'remindedAt'] = now; });
      });
      const results = await sendMany(kind, targets, siteUrl(req));
      return res.json({ results, ...status((await load()).state, siteUrl(req)) });
    }
    return res.status(400).json({ error: 'Onbekende actie' });
  } catch (e) {
    if (!e.status) console.error(e);
    return res.status(e.status || 500).json({ error: e.status ? e.message : 'Er ging iets mis: ' + String(e.message).slice(0, 200) });
  }
}
