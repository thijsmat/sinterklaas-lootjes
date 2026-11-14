// Gedeeld: pepernoten, countdown, confetti.
(function () {
  const rnd = (() => { let s = 1205; return () => (s = (s * 16807) % 2147483647) / 2147483647; })(); // vaste seed: elke keer dezelfde stad
  const el = (tag, cls, parent) => { const e = document.createElement(tag); if (cls) e.className = cls; e.setAttribute('aria-hidden', 'true'); (parent || document.body).appendChild(e); return e; };

  // Pepernoten-regen
  const box = el('div', 'pepernoten'); document.body.prepend(box);
  for (let i = 0; i < 26; i++) {
    const p = el('div', 'pepernoot', box), s = 8 + Math.random() * 14;
    Object.assign(p.style, { left: Math.random() * 100 + 'vw', width: s + 'px', height: s + 'px',
      animationDuration: 7 + Math.random() * 10 + 's', animationDelay: -Math.random() * 15 + 's' });
  }

  // Toneel in de kop: sterren, maan, daken en de Sint te paard
  const kop = document.querySelector('header.kop');
  if (kop) {
    const hemel = el('div', 'hemel', kop); kop.prepend(hemel);
    for (let i = 0; i < 90; i++) {
      const s = el('i', 'ster', hemel), g = 1 + rnd() * 2.2;
      Object.assign(s.style, { left: rnd() * 100 + '%', top: rnd() * 78 + '%', width: g + 'px', height: g + 'px', animationDelay: -rnd() * 6 + 's', animationDuration: 2.5 + rnd() * 4 + 's' });
    }
    el('div', 'maan', hemel);
    el('div', 'wolk w1', hemel); el('div', 'wolk w2', hemel);

    // Skyline met trapgevels, klokgevels en puntdaken; ramen branden goud
    let huizen = '', ramen = '', rook = '', x = -20;
    while (x < 2420) {
      const b = 62 + rnd() * 58, h = 52 + rnd() * 78, top = 170 - h, soort = Math.floor(rnd() * 3), m = x + b / 2;
      if (soort === 0) { // trapgevel
        const t = 9, n = 3; let d = `M${x} 170 V${top}`;
        for (let i = 1; i <= n; i++) d += ` h${(b / 2 - 8) / n} v-${t}`;
        d += ` h16`; for (let i = 1; i <= n; i++) d += ` v${t} h${(b / 2 - 8) / n}`;
        huizen += `<path d="${d} V170 Z"/>`;
      } else if (soort === 1) { // puntdak
        huizen += `<path d="M${x} 170 V${top} L${m} ${top - 30} L${x + b} ${top} V170 Z"/>`;
      } else { // klokgevel
        huizen += `<path d="M${x} 170 V${top} Q${x + b * .18} ${top - 4} ${x + b * .25} ${top - 16} Q${m} ${top - 46} ${x + b * .75} ${top - 16} Q${x + b * .82} ${top - 4} ${x + b} ${top} V170 Z"/>`;
      }
      if (rnd() < .6) { // schoorsteen met rook
        const sx = x + 8 + rnd() * (b - 26);
        huizen += `<rect x="${sx}" y="${top - 20}" width="10" height="24"/>`;
        rook += `<circle class="rook" cx="${sx + 5}" cy="${top - 24}" r="5" style="animation-delay:${-rnd() * 5}s"/>`;
      }
      const kol = Math.max(2, Math.floor(b / 24)), rij = Math.max(1, Math.floor((h - 14) / 26));
      for (let r = 0; r < rij; r++) for (let k = 0; k < kol; k++) if (rnd() < .62)
        ramen += `<rect x="${x + 9 + k * ((b - 18) / kol) + 2}" y="${top + 10 + r * 26}" width="9" height="13" rx="1.5" style="animation-delay:${-rnd() * 8}s"${rnd() < .18 ? ' class="knipper"' : ''}/>`;
      x += b - 1;
    }
    const daken = el('div', 'daken', kop);
    daken.innerHTML = `<svg viewBox="0 0 2400 170" preserveAspectRatio="xMidYMax slice"><g fill="#fff8e7" opacity=".25">${rook}</g><g class="huizen">${huizen}</g><g class="ramen">${ramen}</g></svg>`;

    // De Sint te paard, als silhouet over de daken
    const rit = el('div', 'rit', kop);
    rit.innerHTML = `<svg viewBox="0 0 220 170" class="ruiter">
      <g class="paard" fill="#fdf6e3">
        <path d="M52 92 C30 96 26 118 34 138 C40 128 40 112 58 104 Z"/>
        <g class="been b1"><rect x="64" y="108" width="8" height="46" rx="4"/></g>
        <g class="been b2"><rect x="78" y="110" width="8" height="46" rx="4"/></g>
        <g class="been b3"><rect x="126" y="110" width="8" height="46" rx="4"/></g>
        <g class="been b4"><rect x="140" y="108" width="8" height="46" rx="4"/></g>
        <ellipse cx="104" cy="98" rx="52" ry="23"/>
        <path d="M134 92 L160 46 L178 58 L158 108 Z"/>
        <path d="M158 44 C172 36 196 50 204 66 C206 72 198 76 192 72 L170 62 Z"/>
        <path d="M162 44 L160 30 L170 40 Z"/>
        <path d="M158 46 C148 56 140 70 134 90 L144 84 C148 70 154 58 164 50 Z" fill="#d9cfb8"/>
      </g>
      <path d="M92 90 C70 84 52 92 40 110 C62 104 78 104 96 108 Z" fill="#b3121f"/>
      <path d="M88 96 L92 50 C96 40 116 40 120 50 L130 98 Z" fill="#c8102e"/>
      <path d="M100 50 h12 v48 h-12 Z" fill="#e8b931"/>
      <circle cx="106" cy="38" r="10" fill="#f2c9a0"/>
      <path d="M97 40 C98 60 114 60 116 40 C112 48 102 48 97 40 Z" fill="#fff"/>
      <path d="M95 32 C96 12 106 2 106 2 C106 2 117 12 118 32 Z" fill="#c8102e" stroke="#e8b931" stroke-width="2.5"/>
      <path d="M106 10 v18 M100 18 h12" stroke="#e8b931" stroke-width="3" stroke-linecap="round"/>
      <path d="M126 96 L136 14 C136 2 152 2 150 14 C149 20 142 20 142 14" fill="none" stroke="#e8b931" stroke-width="4" stroke-linecap="round"/>
      <path d="M118 70 L132 62" stroke="#c8102e" stroke-width="9" stroke-linecap="round"/>
    </svg>`;
  }

  // Klik op de achtergrond: een handje pepernoten
  document.addEventListener('click', (e) => {
    if (e.target.closest('a, button, input, textarea, select, label, .kaart')) return;
    for (let i = 0; i < 9; i++) {
      const p = el('div', 'pepernoot strooi'), s = 9 + Math.random() * 9, a = Math.random() * Math.PI * 2, d = 50 + Math.random() * 90;
      Object.assign(p.style, { left: e.clientX + 'px', top: e.clientY + 'px', width: s + 'px', height: s + 'px' });
      p.style.setProperty('--dx', Math.cos(a) * d + 'px'); p.style.setProperty('--dy', Math.sin(a) * d - 40 + 'px');
      setTimeout(() => p.remove(), 1000);
    }
  });

  fetch('/api/event').then((r) => r.json()).then((ev) => {
    document.querySelectorAll('[data-ev]').forEach((e) => { e.textContent = ev[e.dataset.ev]; });
    document.title = ev.title;
    const klok = document.getElementById('aftellen');
    if (!klok) return;
    const doel = new Date(ev.iso);
    const tik = () => {
      const ms = doel - new Date();
      if (ms <= 0) { klok.innerHTML = '<span class="feest">Het is pakjesavond! 🎉</span>'; return; }
      const delen = [[Math.floor(ms / 864e5), 'dagen'], [Math.floor(ms / 36e5) % 24, 'uur'], [Math.floor(ms / 6e4) % 60, 'min'], [Math.floor(ms / 1e3) % 60, 'sec']];
      klok.innerHTML = delen.map(([n, l]) => `<span class="tegel"><b>${String(n).padStart(2, '0')}</b><small>${l}</small></span>`).join('');
    };
    tik(); setInterval(tik, 1000);
  }).catch(() => {});
})();

window.confetti = function () {
  const kleuren = ['#e8b931', '#ffd862', '#e0303f', '#fff8e7', '#8b0e1a'];
  for (let i = 0; i < 140; i++) {
    const c = document.createElement('div'); c.className = 'confetti';
    Object.assign(c.style, { left: Math.random() * 100 + 'vw', background: kleuren[i % kleuren.length],
      animationDelay: Math.random() * .8 + 's', animationDuration: 2 + Math.random() * 2 + 's' });
    document.body.appendChild(c); setTimeout(() => c.remove(), 5000);
  }
};

window.esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
