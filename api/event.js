import { EVENT } from './_lib/mail.js';
export default function handler(req, res) { res.setHeader('Cache-Control', 'no-store'); res.json(EVENT); }
