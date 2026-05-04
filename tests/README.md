# SAA Smoke Tests

Test-Suite für den Sovereign Architecture Advisor. **Kein Test-Framework** — pure Node-Skripte. Ausführen ohne `npm install`.

## Lokal ausführen

```bash
# Alle:
node tests/run-all.mjs

# Einzeln (Beispiele):
node tests/smoke-saa-data.mjs
node tests/smoke-cloud-analyzer.mjs
node tests/smoke-application-instance.mjs
```

## Test-Suiten

| Suite | Zweck |
|---|---|
| `smoke-modules.mjs` | Alle wichtigen ES-Module laden + Export-Listen verifizieren. Fängt Syntax-Fehler und gebrochene Imports. |
| `smoke-saa-data.mjs` | Datenintegrität von `saa-data.js`: 10 Provider, 22 Service-Categories pro Provider, Komponenten, Patterns, Modi. |
| `smoke-c3a-sov7.mjs` | BSI C3A v1.0 (30 Kriterien, 6 SOV-Buckets) + SOV-7 Compliance (10 Kriterien). aggregateC3A C1/C2, aggregateSov7. |
| `smoke-sovereignty.mjs` | 10 Provider × 2 Audit-Modes gegen SCC v4.0.0-Erwartungswerte. Schlägt fehl, wenn Sovereignty-Engine oder Provider-C3A-Daten aus dem Sync laufen. |
| `smoke-audit-mode.mjs` | get/setAuditMode (C1/C2, idempotent, fallback bei invalid). |
| `smoke-application-instance.mjs` | ApplicationInstance: Constructor, generateUUID, fromCurrentState, snapshot/delta-API, resetArchitecture, applyArchitectureDelta, Privacy. |
| `smoke-application-matcher.mjs` | ApplicationMatcher: Index-Aufbau, exakte/keyword/fuzzy Matches, normalize, extractKeywords, stringSimilarity. |
| `smoke-sizing-detector.mjs` | SizingDetector: Keyword-basierte Erkennung small/medium/large + Default-Verhalten. |
| `smoke-deployment-pattern.mjs` | detectDeploymentPattern: alle 6 Patterns, Reihenfolge-Priorität, Edge Cases. |
| `smoke-multi-app-parser.mjs` | parseStorageSize/parseDBSize, extractHAConfig, formatVMTypeName, getDatabaseComponentId, parseStorageConfig, parseDatabaseConfig, parseApplicationList. |
| `smoke-pure-functions.mjs` | Konkrete Input/Output-Tests für extrahierte Pure Functions (parser, lookups, ApplicationInstance-Architektur-API). |
| `smoke-results-compute.mjs` | computeAppMonthlyTCO, computeTcoConsumptionBreakdown, computeRatingColors, formatRecommendationText, formatPortfolioRecommendationText, GENERIC_SERVICE_NAMES, PROVIDER_CATEGORY_NAMES. |
| `smoke-cloud-analyzer.mjs` | CloudAnalyzer: analyzeForComponents, getRequiredServices, analyzeProviderServices, calculateTCO, calculateTCOLevel, calculateProviderScore, getConsumptionEstimate, _estimate*-Helpers. |
| `smoke-portfolio-analyzer.mjs` | PortfolioAnalyzer: analyzePortfolio, analyzeOne, aggregateProviderScores, aggregateTCO, calculatePortfolioMetrics. |
| `smoke-session-migration.mjs` | migrateLegacySessionState (Single-App-Legacy → Always-Portfolio-Schema). |

## Coverage

**Was getestet wird:**
- Pure Functions (Input → Output, Edge Cases, Datenintegrität)
- Business-Logik in ApplicationInstance, CloudAnalyzer, PortfolioAnalyzer
- Daten-Schemas (Provider-Kataloge, C3A-Kriterien, deploymentPatterns)
- Migrations- und Aggregations-Pfade ohne UI-Abhängigkeiten

**Was nicht getestet wird:**
- DOM-Rendering (saa-results*.js, saa-components.js, saa-multiapp.js, saa-app.js)
- Browser-Events, Click-Handler, Form-Inputs
- PDF-Export (saa-pdf.js benötigt jsPDF + DOM)
- localStorage/sessionStorage-Persistenz (in Node nicht verfügbar; try/catch in Modulen prüft)
- Settings-Panel und Custom-Score-Editor

Module mit Top-Level-DOM-Zugriffen werden nicht direkt importiert. Pure Helper aus solchen Modulen (z.B. `migrateLegacySessionState` aus `saa-state.js`) werden separat exportiert und isoliert getestet.

## CI

GitHub Actions Workflow `.github/workflows/smoke-tests.yml` führt `run-all.mjs` bei jedem Push und PR aus.

## Erweitern

Neue Pure Functions (z.B. neue Lookup-Tabelle, neuer Helper) sollten hier mit ein paar Test-Cases ergänzt werden. Pattern:

```js
function check(name, actual, expected) {
    const ok = JSON.stringify(actual) === JSON.stringify(expected);
    if (ok) { console.log(`✓ ${name}`); pass++; }
    else    { console.log(`✗ ${name}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`); fail++; }
}
```

Bei neuen Suiten: Datei in `tests/` anlegen und in `run-all.mjs` ergänzen.
