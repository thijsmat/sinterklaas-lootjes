import { randomBytes, randomInt, timingSafeEqual } from 'node:crypto';

export const newToken = () => randomBytes(18).toString('base64url');

// Random assignment where nobody draws themselves (a derangement), using crypto randomness.
export function draw(ids) {
  if (ids.length < 2) throw new Error('Minstens twee deelnemers nodig');
  for (;;) {
    const r = [...ids];
    for (let i = r.length - 1; i > 0; i--) { const j = randomInt(i + 1); [r[i], r[j]] = [r[j], r[i]]; }
    if (r.every((x, i) => x !== ids[i])) return Object.fromEntries(ids.map((id, i) => [id, r[i]]));
  }
}

export function safeEqual(a, b) {
  const x = Buffer.from(String(a || '')), y = Buffer.from(String(b || ''));
  return x.length === y.length && timingSafeEqual(x, y);
}

const clip = (s, n) => String(s ?? '').trim().slice(0, n);
const cleanLink = (s) => { const v = clip(s, 500); return /^https?:\/\//i.test(v) ? v : (v ? 'https://' + v : ''); };

export function cleanWishes(list) {
  return (Array.isArray(list) ? list : []).slice(0, 25)
    .map((w) => ({ title: clip(w.title, 120), link: cleanLink(w.link), note: clip(w.note, 600) }))
    .filter((w) => w.title);
}

export const cleanNote = (s) => clip(s, 1500);

export function siteUrl(req) {
  return process.env.SITE_URL || `${req.headers['x-forwarded-proto'] || (process.env.VERCEL ? 'https' : 'http')}://${req.headers['x-forwarded-host'] || req.headers.host}`;
}

export async function readJson(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  let raw = ''; for await (const c of req) raw += c;
  return raw ? JSON.parse(raw) : {};
}
