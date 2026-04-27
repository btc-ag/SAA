# SAA Refactor — „Always Portfolio" + Hygiene + CSS-Split

**Stand:** 2026-04-27
**Branch-Basis:** `claude/revise-infrastructure-costs-3AxEW` (post v4.0.0)
**Ziel:** Code-Hygiene (Primärziel) + SCC-Parität für Sovereignty-Logik (Sekundärziel)
**Risiko-Klasse:** mittel-hoch — Phase 4 (State-Modell) ist kritisch
**Out of Scope:** App-Daten (`saa-apps-data.js`), Provider-C3A-Daten (`provider-c3a-data.js`), `cloud-pricing.js`

---

## 1. Problem

Der SAA-Codebase hat post-v4.0.0 etwa 19.4k LOC JavaScript und 7k LOC CSS. Die größte Code-Schuld ist nicht die Dateigröße, sondern ein **duales State-Modell** in der Orchestrator-Klasse `SovereignArchitectureAdvisor`:

- **16 Getter/Setter-Proxies** (`saa-app.js:109-196`) routen jeden State-Zugriff entweder auf `this._foo` (Single-App) oder `this.applications[currentAppIndex].foo` (Multi-App). 130 Zeilen Zeremonie.
- **46 `isMultiAppMode`-Branches** über 7 Module (`saa-app.js: 27`, `saa-settings.js: 5`, `saa-state.js: 5`, `saa-components.js: 3`, `saa-pdf.js: 3`, `saa-results.js: 2`, `saa-multiapp.js: 1`).
- **5 parallele Render-Pärchen** in `saa-results.js` (`render*` ↔ `renderAggregated*`), weil die Daten-Form unterschiedlich ist.

Der Git-Verlauf bestätigt das Symptom: ≥6 `fix:`-Commits mit „Multi-App" im Titel allein zwischen v3.0.0 und v4.0.0 (Kubernetes, Block-Storage, restoreSet, Architektur-Modus, …) — alle Wurzelproblem identisch: Zwei State-Welten, eine wird vergessen.

Daneben sechs separate Hygiene-Themen: Sovereignty-Logik (SOV-8-Weights, EU-CSF-Formel) hardcoded in `saa-analysis.js`, `saa-data.js` mit Side-Effect-Merge und vier Klassen-Definitionen, 21 hardcodierte `providerId === '...'`-Branches, Render+Compute vermischt in `saa-results.js`, und `saa-styles.css` mit 5532 Zeilen in einer Datei.

## 2. Zielarchitektur

### 2.1 „Always Portfolio" State-Modell

State lebt **immer** auf einer `ApplicationInstance` in `this.applications[]`. „Single-App-Modus" bedeutet: `this.applications.length === 1`, `currentAppIndex = 0`. Der Flag `isMultiAppMode` bleibt erhalten, dient aber **ausschließlich der UI-Sichtbarkeit** (App-Tabs, Navigation-Buttons, Input-Layout) — nicht mehr für State-Routing.

Der Orchestrator bekommt eine `currentApp`-Property als Convenience:

```js
get currentApp() { return this.applications[this.currentAppIndex] ?? null; }
```

Damit kollabieren die 16 Getter-Proxies zu direkten Property-Accessen (`this.currentApp.selectedComponents`). Die 46 `isMultiAppMode`-Stellen reduzieren sich auf vermutlich 8-10 echte UI-Schalter (Tab-Sichtbarkeit, Step-Navigation-Verzweigung, Input-UI-Variante).

### 2.2 Datenstruktur: Ein Analyse-Output

`runAnalysis()` und `runMultiAppAnalysis()` werden zu **einer** `runAnalysis()`-Methode. Liefert immer ein Portfolio-Resultat:

```js
{
  perAppResults: [{ app, results }],  // length 1 für „Single-App"
  aggregatedProviders,                 // bei length===1 trivial == perAppResults[0].results
  aggregatedTCO,
  portfolioMetrics
}
```

`MultiAppAnalyzer` wird zu `PortfolioAnalyzer` (umbenannt). `CloudAnalyzer` bleibt als interner Per-App-Worker, von `PortfolioAnalyzer` aufgerufen.

### 2.3 Render-Layer: Eine Entry-Funktion

`renderAnalysisResults(portfolio)` ist die einzige Entry-Methode. Sie schaltet UI-Elemente (App-Breakdown, Portfolio-Metriken, Tab-Bar) basierend auf `portfolio.perAppResults.length > 1`. Die 5 Render-Pärchen werden zu 5 Single-Implementierungen, die intern mit `if (isPortfolio)` verzweigen oder noch besser per Helper-Funktion einheitlich rechnen.

### 2.4 Sovereignty-Engine als eigenes Modul (SCC-paritätisch)

Neues Modul `js/modules/sovereignty-engine.js` — strukturell **deckungsgleich mit SCC's `js/data/sov-framework.js` + Aggregat-Logik aus `provider-assessments.js`**. Exports:

```js
export const SOV_WEIGHTS = { sov1: 0.15, ..., sov8: 0.05 };
export const SOV8_EXPERT_SCORES = { aws: 60, azure: 65, ... };
export function aggregateProviderSovScores(provider, mode);  // { sov1..sov8 }
export function calculateControlFromSov(sovScores);          // EU-CSF gewichtet
export function getC3AAdjustedControl(provider, mode);       // Convenience
```

Damit ist der Stand: `saa-analysis.js` importiert `getC3AAdjustedControl` aus `sovereignty-engine.js`. Die hardcodierten Tabellen verschwinden aus der Engine-Datei. BSI-Updates müssen künftig nur in einer Datei nachgezogen werden, die in beiden Repos (SCC + SAA) byte-identisch sein kann.

### 2.5 Daten-Hygiene

`saa-data.js` wird auf reine Daten reduziert (Provider-Liste, Komponenten-Definitionen, deploymentPatterns, selfBuildOptions, architectureModes). Die vier eingebetteten Klassen wandern in eigene Module:

| Aktuell in `saa-data.js` | Neu unter |
|---|---|
| `class ApplicationInstance` (1979) | `js/modules/application-instance.js` |
| `class ApplicationMatcher` (2027) | `js/modules/application-matcher.js` |
| `class SizingDetector` (2225) | `js/modules/sizing-detector.js` |
| `function detectDeploymentPattern` (293) | `js/modules/deployment-pattern.js` |

Der Side-Effect-Merge `cloudProviders.forEach(p => { p.c3a = PROVIDER_C3A_DATA[p.id]?.c3a; ... })` am Dateiende verschwindet. Stattdessen exportiert `saa-data.js` die Provider unverändert; `sovereignty-engine.js` greift bei Bedarf auf `PROVIDER_C3A_DATA` zu, oder ein expliziter Init-Schritt in `saa-app.js#init()` hängt die Daten an.

### 2.6 Provider-Branches → Lookup-Tabelle

Die ~21 `providerId === 'aws'`-Stellen in `saa-analysis.js` (DynamoDB/Cosmos/Firestore-NoSQL-Mapping etc.) werden zu einer Lookup-Tabelle in `cloud-pricing.js` oder einem neuen `js/modules/provider-service-mapping.js`:

```js
export const PROVIDER_NOSQL_SERVICES = {
  aws: { dynamo: 'dynamodb' },
  azure: { cosmos: 'cosmos-db' },
  gcp: { firestore: 'firestore' },
  // ...
};
```

### 2.7 Render/Compute-Split in `saa-results.js`

Pure Berechnungen (TCO-Aggregation, Recommendation-Text-Generation, Ratings-Math, Cost-Breakdown-Math) wandern aus den Render-Methoden in ein neues Modul `js/modules/results-compute.js`. `saa-results.js` ruft die pure Functions auf, bleibt thin-render.

Zielgröße `saa-results.js`: ~1300 Zeilen (von 2285), bestehend aus DOM-Render-Templates und Event-Wiring.

### 2.8 CSS-Split in 6 Dateien

`css/saa-styles.css` (5532 Z.) hat bereits 9 thematische Sektionen via Kommentar-Marker. Wird gesplittet in:

| Neue Datei | Inhalt | ~ Zeilen |
|---|---|---|
| `css/base.css` | Reset, Variablen, Body, Header, allgemeine Layout | ~600 |
| `css/wizard.css` | Steps 1-3, Komponenten-Auswahl, App-Suche, Sizing | ~1400 |
| `css/results.css` | Analyse-Ergebnis-Cards, Vergleichstabelle, Spider-Chart-Bereich | ~1500 |
| `css/modals.css` | Settings-Dialog, Detail-Popup, Tooltips, Cost-Breakdown-Modal, Criteria-Info-Modal | ~1300 |
| `css/responsive.css` | Alle `@media`-Queries und Mobile-Burger-Menu (4 Stellen aktuell) | ~500 |
| `css/v4-additions.css` | Audit-Toggle, neue v4.0.0-Komponenten | ~200 |

Lade-Strategie: `index.html` lädt alle 6 in fester Reihenfolge (kein Bundler vorhanden — vanilla statische CSS-Includes). `evaluation-criteria.html` lädt nur `base.css`, `modals.css`, `responsive.css`, `criteria-styles.css` (separat schon vorhanden).

Die CSS-Datei `criteria-styles.css` (1547 Z.) bleibt unangetastet — sie ist bereits eine separate Concern.

## 3. Refactor-Phasen

Sechs Phasen, jede ist ein eigener PR/Commit, jede Phase muss einzeln smoke-testbar sein. Reihenfolge ist nicht beliebig: Sicheres Zeug zuerst, der riskante State-Eingriff (Phase 4) als isolierte PR.

### Phase 1: Sovereignty-Engine extrahieren

**Risiko:** sehr niedrig
**Was:** Neues `js/modules/sovereignty-engine.js` mit `SOV_WEIGHTS`, `SOV8_EXPERT_SCORES`, `aggregateProviderSovScores()`, `calculateControlFromSov()`, `getC3AAdjustedControl()`. `saa-analysis.js` importiert statt eigener Definition.
**Verifikation:** Smoke-Test alle 10 Provider × 2 Modi gegen SCC-Werte (siehe Verify-Script in Phase 4 dieser Konversation).
**Smoke-Test:** App lädt, Audit-Toggle C1↔C2 ändert Kontrolle-Score, Werte = SCC.

### Phase 2: `saa-data.js` säubern

**Risiko:** niedrig
**Was:**
- 4 Klassen/Funktionen in eigene Module unter `js/modules/` ausgliedern
- Side-Effect-Merge `PROVIDER_C3A_DATA` entfernen → expliziter Aufruf in `saa-app.js#init()` oder Lazy-Getter in `sovereignty-engine.js`
- `js/modules/provider-service-mapping.js` einführen für die NoSQL/Service-Branches; `saa-analysis.js` nutzt Lookup statt Switch

**Smoke-Test:** App lädt, Quick-Suggestion „SAP S/4HANA" matcht, Sizing-Detection funktioniert, Deployment-Pattern-Anzeige korrekt.

### Phase 3: `PortfolioAnalyzer` einführen (single = portfolio of 1)

**Risiko:** niedrig (parallele Welt)
**Was:**
- `MultiAppAnalyzer` umbenennen zu `PortfolioAnalyzer` (Klasse, Datei, Export)
- `CloudAnalyzer.analyzeForComponents()` bleibt unverändert
- Neue Convenience-Methode `PortfolioAnalyzer.analyzeOne(app, weights, ...)` für Single-App-Aufrufe — liefert dieselbe Portfolio-Datenstruktur (`perAppResults.length === 1`)
- `runAnalysis()` und `runMultiAppAnalysis()` rufen beide den `PortfolioAnalyzer` auf, aber **noch mit zwei Render-Pfaden** — Render-Layer wird erst in Phase 5 unifiziert

**Smoke-Test:** Single-App rendert wie vorher, Multi-App rendert wie vorher, beide Outputs intern jetzt Portfolio-shaped.

### Phase 4: State-Modell unifizieren ⚠️ kritischer Eingriff

**Risiko:** mittel-hoch
**Was:**
- 16 Getter/Setter-Proxies in `saa-app.js` entfernen
- Neue Property `get currentApp()` als Single Source
- Beim App-Konstruktor: immer eine initiale `ApplicationInstance` in `this.applications[]` anlegen, `currentAppIndex = 0`
- **Session-State-Migration** beim Load: alte Saves mit `_selectedComponents`, `_componentConfigs` etc. → in `applications[0]` migrieren
- Alle 46 `isMultiAppMode`-Stellen audit: bleiben nur die UI-Schalter (Tabs sichtbar, Navigation-Buttons, Step-1-Layout-Variante)
- Der Flag bleibt erhalten und steuert UI-Sichtbarkeit, **routet aber keinen State mehr**

**Smoke-Test ausführlich:**
- Frischer App-Start, alle 3 Wizard-Steps durchgehen (Single)
- Multi-App-Modus aktivieren, Template laden, durch Apps navigieren, alle bearbeiten
- F5-Reload mit aktiver Session: Single-State korrekt, Multi-State korrekt
- Alte Session-State (gespeichert vor Refactor): Migration läuft sauber durch
- Architektur-Modus-Toggle in Single + Multi
- Audit-Toggle in Single + Multi
- PDF-Export in Single + Multi

### Phase 5: Render-Layer kollabieren

**Risiko:** mittel
**Was:** Die 5 Render-Pärchen in `saa-results.js` zu 5 Single-Methoden vereinen:

| Methode-Pärchen | wird zu |
|---|---|
| `renderAnalysisResults` + `renderAggregatedAnalysisResults` | `renderAnalysisResults(portfolio)` |
| `renderRecommendationCard` + `renderAggregatedProviderCard` | `renderProviderCard(result, isAggregated)` |
| `renderProviderDetailContent` + `renderAggregatedProviderDetailContent` | `renderProviderDetail(result, isAggregated)` |
| `renderComparisonTable` + `renderComparisonTableForApp` | `renderComparisonTable(portfolio, appIndex?)` |
| `formatRecommendationText` + `formatPortfolioRecommendationText` | `formatRecommendationText(result, portfolio?)` |

Verzweigung intern per Daten-Heuristik (`portfolio.perAppResults.length > 1`) oder einem expliziten `isAggregated`-Param. Die unifizierten Methoden verbleiben in Phase 5 noch in `saa-results.js`. Pure Functions (z.B. der unifizierte `formatRecommendationText`) wandern erst in Phase 6 nach `results-compute.js`.

**Smoke-Test:** Diff Single-App-Output vor/nach Refactor (visuell, screenshot-basiert), gleiches für Multi-App. Alle Charts und Tabellen rendern korrekt.

### Phase 6: Render/Compute-Split + CSS-Split

**Risiko:** niedrig
**Was:**
- `js/modules/results-compute.js` neu — pure Functions: `computeTcoAggregation`, `formatRecommendationText`, `computeRatingScores`, `computeCostBreakdown`. Keine DOM-Zugriffe.
- `saa-results.js` importiert und ruft auf
- CSS-Split: `saa-styles.css` → `base.css` + `wizard.css` + `results.css` + `modals.css` + `responsive.css` + `v4-additions.css`. `index.html` lädt alle in Reihenfolge.

**Smoke-Test:** Visuell unverändert. Browser-DevTools: alle CSS-Regeln werden geladen, keine 404s.

## 4. Migration & Backward-Kompatibilität

### Session-State-Migration (Phase 4)

Im Load-Pfad in `saa-state.js#loadSessionState()` oder `saa-app.js#init()`:

```js
function migrateLegacySessionState(state) {
    // Legacy: state hat _selectedComponents, _componentConfigs, etc. am Top-Level
    // Neu: state.applications[0] hält diese Properties
    if (state._selectedComponents && !state.applications) {
        state.applications = [{
            id: generateUUID(),
            name: state._applicationData?.name || 'Anwendung',
            selectedComponents: state._selectedComponents,
            componentConfigs: state._componentConfigs,
            applicationData: state._applicationData,
            sizing: state._selectedSizing,
            systemConfig: state._systemConfig,
            // ...
        }];
        state.currentAppIndex = 0;
        // Legacy-Felder entfernen
        delete state._selectedComponents; /* ... */
    }
    return state;
}
```

### HTML-onclick-Kompatibilität

Globale Methoden bleiben namensgleich:

- `app.runAnalysis()` ✓ (bleibt)
- `app.startMultiAppMode(text)` ✓ (bleibt)
- `app.goToStep(n)` ✓ (bleibt)
- `app.nextStep()`, `app.prevStep()` ✓ (bleiben)
- `app.runMultiAppAnalysis()` → wird zu Alias auf `runAnalysis()`, bleibt als Funktion erhalten

### Externe Auswirkungen

Keine. SAA hat keine konsumierenden Drittsysteme. Tool wird via GitHub Pages deployed, Browser-only.

## 5. Akzeptanzkriterien

- ✅ `saa-app.js` hat keine `_*`-Backup-Properties mehr (außer `__archOriginal`/`__archDelta`-Style-Felder, die sind innerhalb der ApplicationInstance gerechtfertigt)
- ✅ Anzahl `isMultiAppMode`-Vorkommen über alle JS-Module zusammen < 12 (von aktuell 46) — Verifikation via `grep -rE "isMultiAppMode" js/ | wc -l`
- ✅ `saa-analysis.js`: keine hardcodierten `SOV_WEIGHTS` oder `SOV8_EXPERT_SCORES`-Tabellen mehr
- ✅ `saa-data.js`: < 1500 Zeilen, enthält nur Daten-Konstanten und `selfBuildOptions`/`architectureModes`/`cloudProviders`/`architectureComponents`/`deploymentPatterns`-Exports
- ✅ `saa-results.js`: < 1500 Zeilen, keine TCO-Berechnung mehr inline
- ✅ Keine Datei in `css/` > 1700 Zeilen
- ✅ Alle Smoke-Test-Punkte aus Phase 4 grün
- ✅ Sovereignty-Werte: Smoke-Test 10 Provider × 2 Modi == SCC byte-identisch
- ✅ `provider-service-mapping.js` ersetzt alle 21 `providerId === '...'`-Branches in `saa-analysis.js`

## 6. Out of Scope

Bewusst ausgeklammert:

- **`js/saa-apps-data.js`** (1814 Z.) — pure App-Datenbank, keine Logik
- **`js/data/provider-c3a-data.js`** (1733 Z.) — pure Provider-Bewertungsdaten
- **`js/cloud-pricing.js`** (1521 Z.) — funktioniert, eigene Domäne, kein Touch ohne Anlass
- **`css/criteria-styles.css`** (1547 Z.) — bereits separate Concern
- **Tests einführen** — SAA hat keine Test-Suite. Wir machen reine manuelle Smoke-Tests pro Phase. Eine Test-Suite einzuführen ist eigene Initiative.
- **TypeScript / Build-Tooling** — vanilla JS / kein Bundler bleibt

## 7. Geschätzter Aufwand

Pro Phase realistisch (mit Smoke-Test-Zeit):

| Phase | geschätzte Dauer |
|---|---|
| 1 — Sovereignty-Engine | 1-2 h |
| 2 — `saa-data.js` säubern | 2-3 h |
| 3 — `PortfolioAnalyzer` | 1-2 h |
| 4 — State-Modell ⚠️ | 4-6 h (inkl. Migration + Test) |
| 5 — Render-Layer kollabieren | 3-4 h |
| 6 — Compute-Split + CSS-Split | 2-3 h |
| **Gesamt** | **13-20 h** |

Phase 4 ist der Risiko-Faktor. Wenn dort Bugs auftauchen, kann sich das verdoppeln.
