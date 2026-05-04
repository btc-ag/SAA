# SAA Smoke Tests

Minimal-Test-Suite für den Sovereign Architecture Advisor. **Kein Test-Framework** — pure Node-Skripte. Ausführen ohne `npm install`.

## Lokal ausführen

```bash
# Einzeln:
node tests/smoke-sovereignty.mjs
node tests/smoke-modules.mjs
node tests/smoke-pure-functions.mjs

# Alle:
node tests/run-all.mjs
```

## Was sie prüfen

| Test | Zweck |
|---|---|
| `smoke-sovereignty.mjs` | 10 Provider × 2 Audit-Modes gegen SCC v4.0.0-Erwartungswerte. Schlägt fehl, wenn Sovereignty-Engine oder Provider-C3A-Daten aus dem Sync laufen. |
| `smoke-modules.mjs` | Alle wichtigen ES-Module laden + Export-Listen verifizieren. Fängt Syntax-Fehler und gebrochene Imports. |
| `smoke-pure-functions.mjs` | Konkrete Input/Output-Tests für extrahierte Pure Functions. |

## CI

GitHub Actions Workflow `.github/workflows/smoke-tests.yml` führt `run-all.mjs` bei jedem Push und PR aus.

## Erweitern

Neue Pure Functions (z.B. neue Lookup-Tabelle, neuer Helper) sollten hier mit ein paar Test-Cases ergänzt werden. Pattern: `check('description', actualCall, expectedValue)`.
