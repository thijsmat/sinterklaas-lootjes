// Gedeeld: pepernoten, countdown, confetti.
(function () {
  const box = document.createElement('div'); box.className = 'pepernoten'; box.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < 26; i++) {
    const p = document.createElement('div'); p.className = 'pepernoot';
    const s = 8 + Math.random() * 14;
    Object.assign(p.style, { left: Math.random() * 100 + 'vw', width: s + 'px', height: s + 'px',
      animationDuration: 7 + Math.random() * 10 + 's', animationDelay: -Math.random() * 15 + 's' });
    box.appendChild(p);
  }
  document.body.prepend(box);

  fetch('/api/event').then((r) => r.json()).then((ev) => {
    document.querySelectorAll('[data-ev]').forEach((e) => { e.textContent = ev[e.dataset.ev]; });
    document.title = ev.title;
    const el = document.getElementById('aftellen');
    if (!el) return;
    const doel = new Date(ev.iso);
    const tik = () => {
      const ms = doel - new Date();
      if (ms <= 0) { el.textContent = 'Het is pakjesavond! 🎉'; return; }
      const d = Math.floor(ms / 864e5), u = Math.floor(ms / 36e5) % 24, m = Math.floor(ms / 6e4) % 60;
      el.innerHTML = `Nog <b>${d}</b> dagen, <b>${u}</b> uur en <b>${m}</b> min`;
    };
    tik(); setInterval(tik, 30000);
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
