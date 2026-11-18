const token = new URLSearchParams(location.search).get('t');
const $ = (id) => document.getElementById(id);
const api = (opts) => fetch('/api/me?t=' + encodeURIComponent(token), opts).then(async (r) => {
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || 'Er ging iets mis');
  return d;
});
let data;

let wensNr = 0; // unieke id's, zodat elk label bij zijn eigen veld hoort
function wensRij(w = {}) {
  const d = document.createElement('fieldset'); d.className = 'wens';
  const n = ++wensNr;
  d.innerHTML = `<legend></legend>
    <div class="veld"><label for="wt${n}">Wat wens je?</label><input id="wt${n}" name="title" maxlength="120" placeholder="bijvoorbeeld: een goed boek"></div>
    <div class="veld"><label for="wl${n}">Link (optioneel)</label><input id="wl${n}" name="link" maxlength="500" placeholder="https://…" inputmode="url" autocapitalize="none" autocorrect="off" spellcheck="false"></div>
    <div class="veld notitieveld"><label for="wn${n}">Notitie (optioneel)</label><textarea id="wn${n}" name="note" maxlength="600" placeholder="maat, kleur, waar te koop…"></textarea></div>
    <button class="licht klein weg" type="button">✕</button>`;
  d.querySelector('[name=title]').value = w.title || '';
  d.querySelector('[name=link]').value = w.link || '';
  d.querySelector('[name=note]').value = w.note || '';
  d.querySelector('.weg').onclick = () => {
    const buur = d.previousElementSibling || d.nextElementSibling;
    d.remove();
    if (!buur) $('wensen').append(wensRij());
    nummer(); gewijzigd();
    (buur || $('wensen').firstElementChild).querySelector('input').focus(); // anders valt de focus terug naar het begin van de pagina
  };
  return d;
}

// "Wens 1, Wens 2…" in de legend en in de naam van de ✕-knop, zodat elke knop zegt welke wens hij weghaalt.
const nummer = () => [...$('wensen').children].forEach((f, i) => {
  f.querySelector('legend').innerHTML = `<span aria-hidden="true">🎁</span> Wens ${i + 1}`;
  f.querySelector('.weg').setAttribute('aria-label', `Wens ${i + 1} verwijderen`);
});

const leesWensen = () => [...$('wensen').children].map((d) => ({
  title: d.querySelector('[name=title]').value, link: d.querySelector('[name=link]').value, note: d.querySelector('[name=note]').value,
})).filter((w) => w.title.trim());

function lijstHtml(wensen) {
  if (!wensen.length) return '<li>Nog geen wensen ingevuld.</li>';
  return wensen.map((w) => `<li><div class="titel">🎁 ${esc(w.title)}</div>
    ${w.link ? `<a href="${esc(w.link)}" target="_blank" rel="noopener noreferrer">${esc(w.link)}</a>` : ''}
    ${w.note ? `<div class="notitie">${esc(w.note)}</div>` : ''}</li>`).join('');
}

function toon(d, eersteKeer) {
  data = d;
  $('welkom').textContent = `Dag ${d.me.name}! De Sint heeft je gevonden in zijn grote boek.`;
  ['lijstKaart', 'statusKaart'].forEach((id) => $(id).classList.remove('verborgen'));
  if (eersteKeer) {
    $('wensen').innerHTML = '';
    (d.me.wishes.length ? d.me.wishes : [{}]).forEach((w) => $('wensen').append(wensRij(w)));
    nummer();
    $('notitie').value = d.me.note;
    d.people.filter((p) => !p.me).forEach((p) => $('vorigJaar').add(new Option(p.name, p.id)));
    $('vorigJaar').value = d.me.lastYear;
  }
  $('klaar').classList.toggle('verborgen', d.me.done);
  $('nietKlaar').classList.toggle('verborgen', !d.me.done || d.drawn);
  $('vorigBlok').classList.toggle('verborgen', d.drawn);
  $('mensen').innerHTML = d.people.map((p) => `<li class="${p.done ? 'klaar' : ''} ${p.me ? 'ik' : ''}">${p.done ? '✅' : '⏳'} ${esc(p.name)}</li>`).join('');
  const nogTe = d.people.filter((p) => !p.done).length;
  $('statusUitleg').textContent = d.drawn ? 'Iedereen was klaar en de lootjes zijn getrokken!'
    : `Nog ${nogTe} van de ${d.people.length} te gaan. Zodra iedereen klaar is, trekt de Sint automatisch de lootjes en krijgt iedereen een mail.`;

  if (d.drawn) {
    $('lootKaart').classList.remove('verborgen'); $('gedichtKaart').classList.remove('verborgen');
    document.querySelectorAll('.doelNaam').forEach((e) => { e.textContent = d.target.name; });
    // Losse lettertjes voor de animatie; schermlezers lezen de hele naam in één keer.
    $('lootNaam').innerHTML = `<span class="visually-hidden">${esc(d.target.name)}</span>` +
      [...d.target.name].map((c, i) => `<span aria-hidden="true" style="animation-delay:${0.25 + i * 0.09}s">${esc(c)}</span>`).join('');
    $('doelWensen').innerHTML = lijstHtml(d.target.wishes);
    $('doelNotitie').textContent = d.target.note;
    if (eersteKeer && localStorageGet('geopend-' + token)) openEnvelop(false);
    setTimeout(() => { if (!$('gTekst').value) $('gMaak').click(); });
  }
}

function localStorageGet(k) { try { return localStorage.getItem(k); } catch { return null; } }
function localStorageSet(k, v) { try { localStorage.setItem(k, v); } catch {} }

function openEnvelop(feest = true) {
  $('envelop').classList.add('open');
  setTimeout(() => {
    $('envelop').parentElement.classList.add('verborgen');
    $('lootUitleg').textContent = 'Sssst… niet verder vertellen!';
    $('onthuld').classList.add('zichtbaar');
    if (feest) { confetti(); $('lootNaam').focus(); } // de envelopknop is weg, dus de focus gaat naar de naam
  }, feest ? 650 : 0);
  localStorageSet('geopend-' + token, '1');
}
$('envelop').onclick = () => openEnvelop(true);

const meld = (tekst, fout) => { $('melding').className = fout ? 'melding fout' : 'melding'; $('melding').textContent = tekst; };

const lijstPost = (done, keepalive) => ({ method: 'POST', keepalive, headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ wishes: leesWensen(), note: $('notitie').value, lastYear: $('vorigJaar').value, done }) });

// Vanzelf bewaren: anderhalve seconde nadat je stopt met typen, en meteen als je de pagina verlaat.
let wijziging = 0, bewaard = 0, autoTimer;
const gewijzigd = () => { wijziging++; clearTimeout(autoTimer); autoTimer = setTimeout(() => bewaar(undefined, true), 1500); };
$('lijstKaart').addEventListener('input', gewijzigd);
const bewaarBijVertrek = () => {
  if (wijziging === bewaard) return;
  clearTimeout(autoTimer); bewaard = wijziging;
  api(lijstPost(undefined, true)).catch(() => {}); // keepalive: komt ook aan als het tabblad dichtgaat
};
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') bewaarBijVertrek(); });
addEventListener('pagehide', bewaarBijVertrek); // Safari meldt sluiten niet altijd via visibilitychange

// done: true = klaar, false = toch nog niet klaar, weggelaten = alleen opslaan; stil = vanzelf bewaren.
// Alles gaat op volgorde, zodat een oudere versie van je lijstje nooit een nieuwere overschrijft.
let wachtrij = Promise.resolve();
const bewaar = (done, stil) => (wachtrij = wachtrij.then(() => stuur(done, stil)));
async function stuur(done, stil) {
  if (stil && wijziging === bewaard) return;
  clearTimeout(autoTimer);
  const knop = $(done === true ? 'klaar' : done === false ? 'nietKlaar' : 'opslaan'), versie = wijziging;
  if (!stil) { knop.disabled = true; meld('De Sint schrijft het op…'); }
  try {
    const d = await api(lijstPost(done));
    bewaard = Math.max(bewaard, versie);
    toon(d, false);
    meld(d.drawn && done ? '🎉 Jij was de laatste! De lootjes zijn getrokken.' : done ? 'Top! Je lijstje staat in het grote boek. ✔'
      : done === false ? 'Je lijstje staat weer op "nog niet klaar".' : 'Opgeslagen ✔');
    if (d.drawn && done) { $('lootKaart').scrollIntoView({ behavior: 'smooth' }); $('envelop').focus({ preventScroll: true }); }
    else if (done !== undefined) $(done ? 'nietKlaar' : 'klaar').focus(); // de knop die je indrukte is nu verborgen
  } catch (e) {
    meld(e.message, true);
  } finally { if (!stil) knop.disabled = false; }
}
$('opslaan').onclick = () => bewaar();
$('nietKlaar').onclick = () => bewaar(false);
$('klaar').onclick = async () => {
  if (!leesWensen().length) { meld('Voeg minstens één wens toe', true); $('wensen').querySelector('input').focus(); return; }
  // Alleen de laatste kan niet meer terug: dan trekt de Sint meteen.
  const laatste = data.people.length > 1 && data.people.every((p) => p.me || p.done);
  if (laatste && !await vraag({ titel: 'Jij bent de laatste!',
    tekst: 'Zodra jouw lijstje klaar is, trekt de Sint meteen de lootjes en krijgt iedereen een mail. Dat kan daarna niet meer terug; je wensen aanpassen kan wel.',
    ja: 'Ja, trek de lootjes' })) return;
  bewaar(true);
};
$('nieuweWens').onclick = () => { const r = wensRij(); $('wensen').append(r); nummer(); r.querySelector('input').focus(); };

let gNr = Math.floor(Math.random() * GEDICHTEN.length);
$('gMaak').onclick = () => {
  const v = (id, std) => $(id).value.trim() || std;
  $('gTekst').value = GEDICHTEN[gNr++ % GEDICHTEN.length]({
    naam: data.target.name, eigenschap: v('gEig', 'lief'), hobby: v('gHobby', 'gezelligheid'),
    hint: v('gHint', 'raad maar eens'), van: v('gVan', 'Sinterklaas'),
  });
  $('gMelding').textContent = 'Nog een keer klikken geeft een ander gedicht.';
};
$('gKopie').onclick = async () => {
  try { await navigator.clipboard.writeText($('gTekst').value); $('gMelding').textContent = 'Gekopieerd ✔'; }
  catch { $('gTekst').select(); $('gMelding').textContent = 'Selecteer en kopieer de tekst zelf.'; }
};

if (!token) { $('welkom').textContent = 'Open deze pagina via de persoonlijke link uit je mail.'; }
else api().then((d) => toon(d, true)).catch((e) => {
  $('welkom').textContent = 'De Sint kan je niet vinden in zijn boek.';
  $('fout').textContent = e.message === 'Onbekende link' ? 'Deze link klopt niet. Gebruik de link uit je mail.' : e.message;
});
