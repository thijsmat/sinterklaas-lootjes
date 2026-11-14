// All family-specific details come from environment variables, so the code itself holds no personal data.
export const EVENT = {
  title: process.env.EVENT_TITLE || 'Lootjes van de Sint',
  date: process.env.EVENT_DATE || '5 december',
  iso: process.env.EVENT_ISO || '2026-12-05T18:00:00+01:00',
  place: process.env.EVENT_PLACE || 'bij ons thuis',
  budget: process.env.EVENT_BUDGET || '€25',
  organizer: process.env.ORGANIZER_NAME || 'de organisator',
};

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function layout(title, bodyHtml, link, button) {
  return `<!doctype html><html><body style="margin:0;background:#2a0508;font-family:Georgia,serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#2a0508;padding:32px 12px"><tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#8b0e1a;border:3px solid #e8b931;border-radius:18px;color:#fff8e7">
<tr><td style="padding:28px 32px 8px;text-align:center;font-size:44px">🎁</td></tr>
<tr><td style="padding:0 32px;text-align:center;color:#ffd862;font-size:26px;font-weight:bold">${esc(title)}</td></tr>
<tr><td style="padding:18px 32px;font-size:17px;line-height:1.6">${bodyHtml}</td></tr>
<tr><td style="padding:6px 32px 28px;text-align:center">
<a href="${esc(link)}" style="display:inline-block;background:#e8b931;color:#4a0a0f;text-decoration:none;font-weight:bold;font-size:18px;padding:14px 28px;border-radius:999px">${esc(button)}</a>
<p style="font-size:13px;color:#f3c9c9;margin-top:18px">Deze link is persoonlijk. Stuur hem niet door, anders weet een ander wie jij getrokken hebt!</p>
</td></tr></table>
<p style="color:#c98a8a;font-size:12px">Pakjesavond ${EVENT.date}, ${EVENT.place} · budget ${EVENT.budget}</p>
</td></tr></table></body></html>`;
}

const TEMPLATES = {
  invite: (p) => ({
    subject: '📜 Sinterklaas heeft een uitnodiging voor je!',
    title: `Beste ${p.name},`,
    body: `<p>Sinterklaas is weer in het land en dit jaar trekken we lootjes! Vul op je persoonlijke pagina je cadeauwensen in, met links en notities als je wilt.</p>
<p>Zodra iedereen klaar is, trekt de Sint vanzelf de lootjes en krijg je een mail. Niemand, ook de beheerder niet, kan zien wie wie heeft.</p>
<p>Pakjesavond is op <b>${EVENT.date}</b> ${EVENT.place}. Het budget is <b>${EVENT.budget}</b>.</p>`,
    button: 'Vul mijn verlanglijstje in',
  }),
  remind: (p) => ({
    subject: '⏰ De Sint wacht nog op jouw verlanglijstje',
    title: `Hoi ${p.name}!`,
    body: `<p>Het grote boek van de Sint is bijna vol, alleen jouw verlanglijstje ontbreekt nog. Pas als iedereen klaar is kunnen de lootjes getrokken worden.</p><p>Het kost maar een paar minuutjes!</p>`,
    button: 'Naar mijn verlanglijstje',
  }),
  drawn: (p) => ({
    subject: '🎉 De lootjes zijn getrokken!',
    title: `${p.name}, je lootje ligt klaar!`,
    body: `<p>Iedereen heeft zijn wensen ingevuld en de Sint heeft de lootjes getrokken. Open je persoonlijke pagina om te zien voor wie jij een cadeau en een gedicht mag maken.</p>
<p>Er staat ook een gedichtenhulp klaar voor als de inspiratie even op is.</p>`,
    button: 'Open mijn lootje',
  }),
};

export async function sendMail(kind, p, link) {
  if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY ontbreekt');
  const t = TEMPLATES[kind](p);
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.MAIL_FROM || 'Sinterklaas <onboarding@resend.dev>',
      to: [p.email], subject: t.subject,
      html: layout(t.title, t.body, link, t.button),
      text: `${t.title}\n\n${t.body.replace(/<[^>]+>/g, '')}\n\n${t.button}: ${link}`,
    }),
  });
  if (!r.ok) throw new Error(`Resend ${r.status}: ${await r.text()}`);
}

// Sends to each person, never throws; returns per-person results so a failed mail is visible.
export async function sendMany(kind, people, base) {
  const out = [];
  for (const p of people) {
    try { await sendMail(kind, p, `${base}/lootje?t=${p.token}`); out.push({ name: p.name, ok: true }); }
    catch (e) {
      if (!process.env.VERCEL) console.log(`[mail ${kind}] ${p.name}: ${base}/lootje?t=${p.token}`);
      out.push({ name: p.name, ok: false, error: String(e.message).slice(0, 300) });
    }
  }
  return out;
}
