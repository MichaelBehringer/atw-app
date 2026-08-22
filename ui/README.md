# atw-app – Frontend

React-Frontend der Atemschutzpflegestelle (FFW Wemding). Build-Tooling: Vite.

## Setup

```bash
npm install
```

Node >= 22.22 wird benötigt (Vorgabe von react-router 8).

## Entwicklung

```bash
npm run dev      # Dev-Server auf http://localhost:3000
```

Der Dev-Server erwartet das Go-Backend auf `http://localhost:8080` und leitet
alle Requests unter `/server/` dorthin weiter (`server.proxy` in
`vite.config.js`). Das entspricht genau der nginx-Regel in Produktion, deshalb
ist die API-Basis-URL in beiden Umgebungen `/server/` – im Quellcode muss dafür
nichts umgestellt werden.

Backend parallel starten:

```bash
cd ../server && go run .
```

## Weitere Kommandos

```bash
npm run build    # Production-Build nach dist/
npm run preview  # Production-Build lokal ausliefern
npm run lint     # ESLint
npm test         # Vitest
```

## Konfiguration

Siehe `.env.example`. Einzige Variable ist `VITE_API_URL`; sie überschreibt die
API-Basis-URL und ist nur nötig, wenn das Backend nicht über denselben Host
erreichbar ist.

## PWA

Die App ist installierbar und cacht ihre Shell über einen Service Worker
(`vite-plugin-pwa`). Der Service Worker läuft nur im Production-Build, im
Dev-Server ist er bewusst aus.

Bei einer neuen Version fragt die App nach, statt selbständig neu zu laden –
wer gerade einen Auftrag abhakt, soll dabei nicht unterbrochen werden.

Daten unter `/server/` werden **nicht** gecacht, damit nie veraltete Aufträge
erscheinen.

### App-Icon ändern

Vorlage ist `public/app-icon.svg`. Die PNG-Größen daraus zu erzeugen braucht
`@vite-pwa/assets-generator`, das bewusst **keine** Abhängigkeit des Projekts
ist: es zieht `sharp` mit, das nur zur Bauzeit gebraucht wird und regelmäßig
libvips-CVEs meldet. Einmalig ausführen und danach wieder entfernen:

```bash
npm i -D @vite-pwa/assets-generator
npx pwa-assets-generator
npm uninstall @vite-pwa/assets-generator && npm prune
```

Die erzeugten Dateien (`pwa-*.png`, `maskable-icon-*.png`,
`apple-touch-icon-*.png`, `favicon.ico`) liegen im Repository. Neue Größen
müssen zusätzlich in der `manifest`-Sektion von `vite.config.js` stehen.

## Ausliefern

Das Container-Image baut die App und liefert sie mit nginx aus
(`ui-nginx.conf`). Dort stehen zwei Dinge, die man nicht verlieren darf:

- **Kompression** – ohne sie gehen rund 1,3 MB statt 420 kB über die Leitung.
- **Cache-Header** – `/assets/*` ist inhaltsgehasht und darf ein Jahr lang
  gecacht werden, `index.html`, `sw.js` und `manifest.webmanifest` brauchen
  `no-cache`. Werden diese drei gecacht, kommt bei den Nutzern kein Update an.
