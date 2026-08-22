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
