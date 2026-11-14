# Instructies voor AI-assistenten

Dit is een kleine Sinterklaas-lootjessite. Houd het klein: geen framework, geen build-stap, geen extra dependencies zonder goede reden.

## Opbouw

- `public/` statische pagina's (Nederlands): `index.html` (welkom), `lootje.html` + `lootje.js` (persoonlijke pagina via `?t=<token>`), `beheer.html` (beheer via `?k=<ADMIN_KEY>`), `common.js` (pepernoten, aftelklok, confetti), `gedichten.js` (rijmsjablonen), `style.css`.
- `api/me.js` GET/POST voor één deelnemer: eigen lijstje lezen/opslaan, "klaar" melden, en de automatische trekking als iedereen klaar is.
- `api/admin.js` beheer: deelnemers instellen, uitnodigingen en herinneringen sturen.
- `api/event.js` levert de feestgegevens uit de environment variables.
- `api/_lib/store.js` opslag: één privé JSON-blob in Vercel Blob met optimistic locking (`ifMatch`); lokaal `.data/state.json`.
- `api/_lib/logic.js` trekking (`draw`), validatie, tokens. Test: `npm test`.
- `api/_lib/mail.js` mailsjablonen en verzending via de Resend API.
- `dev.js` lokale server die Vercel nabootst.

## Regels die je niet mag breken

1. **Geheimhouding**: `api/admin.js` mag nooit wensen of `assignments` teruggeven. Het geeft wel ieders persoonlijke link terug, zodat de beheerder die via WhatsApp kan delen. Alleen `api/me.js` geeft één deelnemer zijn eigen getrokken persoon terug.
2. **Lijstjes**: een deelnemer ziet alleen zijn eigen lijstje en dat van de persoon die hij getrokken heeft.
3. **Trekking**: niemand trekt zichzelf en iedereen wordt precies één keer getrokken. Pas `api/_lib/logic.test.js` aan als je regels toevoegt (bijvoorbeeld partners uitsluiten) en draai `npm test`.
4. **Geen persoonlijke gegevens in de code**: namen en mailadressen gaan via de beheerpagina in de opslag; feestgegevens via environment variables.
5. **Escapen**: alle gebruikersinvoer wordt in de browser via `esc()` of `textContent` getoond, nooit rauw via `innerHTML`.

## Gedichtenhulp

De sjablonen in `public/gedichten.js` zetten de invulwoorden nooit op het rijmwoord, zodat het gedicht altijd rijmt. Houd dat zo als je sjablonen toevoegt.
