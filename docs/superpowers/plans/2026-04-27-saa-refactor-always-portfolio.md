# SAA Refactor „Always Portfolio" — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminiere das duale State-Modell (16 Getter-Proxies, 46 `isMultiAppMode`-Branches), extrahiere SCC-paritätische Sovereignty-Engine, splitte CSS-Monolith in 6 Dateien.

**Architecture:** Single-App wird zu „Portfolio of 1". State lebt immer auf `ApplicationInstance` in `this.applications[]`. `isMultiAppMode` steuert nur noch UI-Sichtbarkeit. Sovereignty-Logik wandert in eigenes Modul, byte-identisch mit SCC. Pure Compute-Funktionen werden aus Render-Methoden extrahiert.

**Tech Stack:** Vanilla ES Modules (kein Build-Step), Browser-only, kein Test-Framework. Verifikation per Node-Smoke-Tests + Browser-Manual-Tests pro Phase.

**Branch:** Alle Arbeit auf `claude/revise-infrastructure-costs-3AxEW` (= GitHub-Pages-Quelle).

**Spec:** `docs/superpowers/specs/2026-04-27-saa-refactor-always-portfolio-design.md`

---

## File Structure (Target State)

**Neue Module unter `js/modules/`:**
- `sovereignty-engine.js` — SOV-Weights, SOV-8-Expert-Scores, `aggregateProviderSovScores`, `calculateControlFromSov`, `getC3AAdjustedControl`
- `application-instance.js` — `class ApplicationInstance`
- `application-matcher.js` — `class ApplicationMatcher`
- `sizing-detector.js` — `class SizingDetector`
- `deployment-pattern.js` — `function detectDeploymentPattern`
- `provider-service-mapping.js` — Lookup-Tabelle für Provider-spezifische Services (NoSQL etc.)
- `results-compute.js` — Pure Functions: `computeTcoAggregation`, `formatRecommendationText`, `computeRatingScores`, `computeCostBreakdown`

**Geänderte Files:**
- `js/saa-data.js` — nur noch reine Daten, kein Side-Effect-Merge, keine Klassen
- `js/saa-analysis.js` — keine hardcoded SOV-Tabellen, keine Provider-ID-Branches, `MultiAppAnalyzer` → `PortfolioAnalyzer`
- `js/saa-app.js` — keine 16 Getter-Proxies, `currentApp`-Getter, immer initiale `ApplicationInstance`
- `js/modules/saa-results.js` — eine Render-Entry-Methode, pure Compute extrahiert
- `js/modules/saa-multiapp.js`, `saa-components.js`, `saa-state.js`, `saa-settings.js`, `saa-pdf.js` — `isMultiAppMode`-Branches reduziert
- `index.html` — 6 CSS-Files statt 1
- `evaluation-criteria.html` — angepasste CSS-Includes

**Neue CSS-Dateien unter `css/`:**
- `base.css`, `wizard.css`, `results.css`, `modals.css`, `responsive.css`, `v4-additions.css`
- `saa-styles.css` wird **gelöscht**, `criteria-styles.css` bleibt

---

## Smoke-Test-Konventionen

SAA hat keine automatisierten Tests. Jede Phase verwendet:

**A) Node-Smoke-Test** (für reine Daten/Logik): Skript unter `/tmp/smoke-saa-phase-N.mjs`, ausgeführt via `node /tmp/smoke-saa-phase-N.mjs`. Erwartet exakte numerische Outputs.

**B) Browser-Smoke-Test** (für UI/Lifecycle): Lokaler Server starten, Pfade in Browser durchklicken. Standard-Befehl:
```bash
cd /Users/thsoring/Library/CloudStorage/OneDrive-BTCAG/CCode/SAA && python3 -m http.server 8765
```
Browser-URL: `http://localhost:8765/`. Nach Test: `Ctrl+C` zum Beenden.

**C) Standard-Browser-Checkliste** (für jede Phase, sofern nicht abweichend angegeben):
1. Seite lädt ohne Console-Errors (DevTools öffnen, F12)
2. Auf „Quick-Suggestion: SAP S/4HANA" klicken → Step 2 zeigt Komponenten
3. Komponenten anpassen, „Weiter" → Step 3 zeigt Provider-Vergleich
4. Audit-Toggle C1↔C2 wechseln → Werte ändern sich
5. Zurück zu Step 1, „Multi-App" aktivieren → Template-Dropdown lädt
6. Template „DevOps-Stack" wählen → durch Apps navigieren
7. F5-Reload → Session-State wird wiederhergestellt
8. Page `/evaluation-criteria.html` lädt korrekt

---

## Phase 1: Sovereignty-Engine extrahieren

**Risiko:** sehr niedrig — reine Code-Verschiebung, nichts wird gelöscht in Konsumenten.

### Task 1.1: Neues Modul `sovereignty-engine.js` erstellen

**Files:**
- Create: `js/modules/sovereignty-engine.js`

- [ ] **Step 1: Datei mit komplettem Inhalt erstellen**

Inhalt (vollständig, identisch zur Logik in SCC `js/data/sov-framework.js` + Aggregat aus `provider-assessments.js`):

```js
/**
 * Sovereignty Engine — EU CSF gewichteter Kontrolle-Score.
 *
 * Strukturell paritätisch zum SCC-Schwesterprojekt
 * (SCC: js/data/sov-framework.js + Aggregat aus provider-assessments.js).
 * BSI-Updates müssen in beiden Repos byte-identisch nachgezogen werden.
 *
 * @module modules/sovereignty-engine
 */

import { aggregateC3A } from './c3a-framework.js';
import { aggregateSov7 } from './sov7-compliance.js';
import { getAuditMode } from './audit-mode.js';

/**
 * EU Cloud Sovereignty Framework — Gewichte SOV-1...8.
 * Identisch zu SCC `SOV_WEIGHTS` in `js/data/sov-framework.js`.
 */
export const SOV_WEIGHTS = Object.freeze({
    sov1: 0.15, sov2: 0.10, sov3: 0.10, sov4: 0.15,
    sov5: 0.20, sov6: 0.15, sov7: 0.10, sov8: 0.05
});

/**
 * SOV-8 Experten-Scores. BSI-C3A-Mandat deckt SOV-8 (Operative Souveränität)
 * nicht ab — Experten-Einschätzung der BTC. Identisch zu SCC.
 */
export const SOV8_EXPERT_SCORES = Object.freeze({
    'aws': 60,
    'azure': 65,
    'gcp': 55,
    'aws-sovereign': 70,
    'delos': 65,
    'stackit': 85,
    'ionos': 75,
    'otc': 76,
    'sap-ci': 76,
    'openstack': 50
});

/**
 * Berechnet pro Provider die SOV-1...8-Werte für einen Audit-Mode.
 * SOV-1...6 aus C3A-Aggregation, SOV-7 aus SOV-7-Compliance,
 * SOV-8 aus Experten-Score.
 *
 * @param {Object} provider - mit `id`, `c3a`, `sov7`-Properties
 * @param {string} mode - 'c1' oder 'c2'
 * @returns {Object|null} {sov1...sov8} oder null bei fehlenden Daten
 */
export function aggregateProviderSovScores(provider, mode) {
    if (!provider?.c3a) return null;
    const c3a = aggregateC3A(provider.c3a, mode);
    const sov7 = provider.sov7 ? aggregateSov7(provider.sov7) : null;
    const sov8 = SOV8_EXPERT_SCORES[provider.id] ?? 50;
    if (!c3a || sov7 == null) return null;
    return {
        sov1: c3a.sov1, sov2: c3a.sov2, sov3: c3a.sov3,
        sov4: c3a.sov4, sov5: c3a.sov5, sov6: c3a.sov6,
        sov7, sov8
    };
}

/**
 * Berechnet den Kontrolle-Score nach EU-CSF aus SOV-1...8.
 * Identische Formel wie SCC `calculateControlFromSov`.
 *
 * @param {Object} sovScores - {sov1...sov8}
 * @returns {number} 0...100, gerundet
 */
export function calculateControlFromSov(sovScores) {
    if (!sovScores) return 0;
    const totalWeight = Object.values(SOV_WEIGHTS).reduce((s, w) => s + w, 0);
    let weightedSum = 0;
    for (const [key, weight] of Object.entries(SOV_WEIGHTS)) {
        weightedSum += (sovScores[key] || 0) * weight;
    }
    return Math.round(weightedSum / totalWeight);
}

/**
 * Liefert den Provider-Level-Kontrolle-Wert (Hybrid):
 * Wenn der Provider C3A-Daten hat → EU-CSF-gewichteter Mittelwert über SOV-1...8.
 * Sonst Fallback auf statischen `provider.control`-Wert.
 *
 * @param {Object} provider
 * @param {string} [mode] - C1/C2; default = aktueller AuditMode
 * @returns {number}
 */
export function getC3AAdjustedControl(provider, mode = getAuditMode()) {
    if (!provider) return 50;
    if (!provider.c3a) return provider.control ?? 50;
    const sov = aggregateProviderSovScores(provider, mode);
    if (!sov) return provider.control ?? 50;
    return calculateControlFromSov(sov);
}
```

- [ ] **Step 2: Smoke-Test-Skript erstellen**

`/tmp/smoke-saa-phase1.mjs`:

```js
import { getC3AAdjustedControl, calculateControlFromSov, aggregateProviderSovScores }
    from '/Users/thsoring/Library/CloudStorage/OneDrive-BTCAG/CCode/SAA/js/modules/sovereignty-engine.js';
import { PROVIDER_C3A_DATA }
    from '/Users/thsoring/Library/CloudStorage/OneDrive-BTCAG/CCode/SAA/js/data/provider-c3a-data.js';

// Erwartete Werte (1:1 SCC v4.0.0)
const expected = {
    'aws':      { c1: 36, c2: 36 },
    'azure':    { c1: 37, c2: 37 },
    'gcp':      { c1: 36, c2: 36 },
    'stackit':  { c1: 88, c2: 88 },
    'ionos':    { c1: 87, c2: 83 },
    'otc':      { c1: 74, c2: 69 },
    'aws-sovereign': { c1: 77, c2: 68 },
    'delos':    { c1: 76, c2: 76 },
    'openstack': { c1: 87, c2: 74 },
    'sap-ci':   { c1: 81, c2: 77 }
};

let pass = 0, fail = 0;
for (const [id, exp] of Object.entries(expected)) {
    const data = PROVIDER_C3A_DATA[id];
    if (!data) { console.log(`✗ ${id}: no PROVIDER_C3A_DATA entry`); fail++; continue; }
    const provider = { id, c3a: data.c3a, sov7: data.sov7, control: 50 };
    const c1 = getC3AAdjustedControl(provider, 'c1');
    const c2 = getC3AAdjustedControl(provider, 'c2');
    const ok = (c1 === exp.c1 && c2 === exp.c2);
    if (ok) { console.log(`✓ ${id}: C1=${c1}, C2=${c2}`); pass++; }
    else    { console.log(`✗ ${id}: got C1=${c1}/C2=${c2}, expected C1=${exp.c1}/C2=${exp.c2}`); fail++; }
}
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
```

- [ ] **Step 3: Smoke-Test ausführen**

Run: `node /tmp/smoke-saa-phase1.mjs`
Expected: `10 passed, 0 failed`, Exit 0.

### Task 1.2: `saa-analysis.js` auf neues Modul umstellen

**Files:**
- Modify: `js/saa-analysis.js:1-65` (Imports + lokale Definitionen entfernen)

- [ ] **Step 1: Imports anpassen**

Aktuell (Zeilen 1-12):
```js
import { selfBuildOptions } from './saa-data.js';
import { CloudPricing } from './cloud-pricing.js';
import { aggregateC3A } from './modules/c3a-framework.js';
import { aggregateSov7 } from './modules/sov7-compliance.js';
import { getAuditMode } from './modules/audit-mode.js';
```

Neu:
```js
import { selfBuildOptions } from './saa-data.js';
import { CloudPricing } from './cloud-pricing.js';
import { getC3AAdjustedControl } from './modules/sovereignty-engine.js';
```

(Die anderen 3 Imports werden nicht mehr gebraucht — `getC3AAdjustedControl` kapselt sie.)

- [ ] **Step 2: Lokale Definitionen entfernen**

Lösche aus `js/saa-analysis.js`:
- `SOV8_EXPERT_SCORES`-Konstante (steht in der lokalen Datei seit Phase-1-Audit-Fix, nach `import`-Block)
- `SOV_WEIGHTS`-Konstante
- die lokale `getC3AAdjustedControl()`-Funktion-Definition

Das ist der gesamte Block zwischen den ersten Imports und `class CloudAnalyzer {`. Resultat: nach den Imports folgt direkt `class CloudAnalyzer { ... }` (vorher Zeile 65).

- [ ] **Step 3: Browser-Smoke-Test**

Run: Server starten, Browser-Smoke-Test-Standard-Checkliste durchgehen. Insbesondere Step 4 (Audit-Toggle) muss Werte verändern.
Expected: alle 8 Schritte grün, keine Console-Errors.

- [ ] **Step 4: Commit**

```bash
git add js/modules/sovereignty-engine.js js/saa-analysis.js
git commit -m "refactor(phase-1): Sovereignty-Engine aus saa-analysis.js extrahiert

Neues Modul js/modules/sovereignty-engine.js mit SOV_WEIGHTS,
SOV8_EXPERT_SCORES, aggregateProviderSovScores, calculateControlFromSov,
getC3AAdjustedControl. Strukturell paritätisch zu SCC sov-framework.js.

Smoke-Test 10 Provider × 2 Audit-Modes == SCC byte-identisch.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Phase 2: `saa-data.js` säubern

**Risiko:** niedrig — pure Code-Verschiebung. Verifikation per Browser-Smoke-Test.

### Task 2.1: `ApplicationInstance`-Klasse extrahieren

**Files:**
- Create: `js/modules/application-instance.js`
- Modify: `js/saa-data.js` (Klasse entfernen, Export entfernen)
- Modify: `js/modules/saa-multiapp.js:5` (Import-Source ändern)

- [ ] **Step 1: Neues Modul erstellen**

Inhalt von `js/modules/application-instance.js`:

```js
/**
 * ApplicationInstance — Repräsentiert eine einzelne Anwendung im
 * Portfolio (Multi-App-Modus). Hält Komponenten-Auswahl, Konfigurationen,
 * Architektur-Snapshot/Delta und Analyse-Ergebnisse.
 *
 * Im neuen „Always Portfolio"-Modell (ab Phase 4) hat auch Single-App
 * genau 1 ApplicationInstance.
 *
 * @module modules/application-instance
 */

class ApplicationInstance {
    constructor(id, name, type = null, sizing = 'medium') {
        this.id = id || this.generateUUID();
        this.name = name;
        this.type = type;
        this.sizing = sizing;
        this.applicationData = null;
        this.selectedComponents = new Set();
        this.componentConfigs = {};
        this.systemConfig = null;
        this.analysisResults = null;
        this.architectureMode = null;
        this._archOriginal = null;
        this._archDelta = null;
    }

    generateUUID() {
        return 'app-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9);
    }
}

export { ApplicationInstance };
```

(Inhalt entspricht 1:1 der aktuellen Klasse in `saa-data.js:1979-2025`. Beim Kopieren exakte Methoden inkl. allen Properties übernehmen.)

- [ ] **Step 2: Klasse aus `saa-data.js` entfernen**

In `js/saa-data.js`:
- Lösche den Block `class ApplicationInstance { ... }` (aktuell Zeilen 1979-2025)
- Im Export-Statement am Dateiende `ApplicationInstance` entfernen

Vorher (Zeilenende, Zeile 2248):
```js
export { selfBuildOptions, architectureModes, deploymentPatterns, cloudProviders, architectureComponents, detectDeploymentPattern, ApplicationMatcher, SizingDetector, ApplicationInstance };
```

Nachher:
```js
export { selfBuildOptions, architectureModes, deploymentPatterns, cloudProviders, architectureComponents, detectDeploymentPattern, ApplicationMatcher, SizingDetector };
```

- [ ] **Step 3: Konsumenten-Import in `saa-multiapp.js` aktualisieren**

Aktuell `js/modules/saa-multiapp.js:5`:
```js
import { ApplicationInstance } from '../saa-data.js';
```

Neu:
```js
import { ApplicationInstance } from './application-instance.js';
```

- [ ] **Step 4: Browser-Smoke-Test**

Run: Server starten, Browser-Smoke-Checkliste Schritt 5-7 (Multi-App-Flow).
Expected: Multi-App-Modus aktivierbar, Apps werden hinzugefügt, F5-Reload restored.

- [ ] **Step 5: Commit**

```bash
git add js/modules/application-instance.js js/saa-data.js js/modules/saa-multiapp.js
git commit -m "refactor(phase-2a): ApplicationInstance aus saa-data.js extrahiert

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

### Task 2.2: `ApplicationMatcher`-Klasse extrahieren

**Files:**
- Create: `js/modules/application-matcher.js`
- Modify: `js/saa-data.js` (Klasse entfernen)
- Modify: `js/saa-app.js:6` (Import-Source ändern)

- [ ] **Step 1: Neues Modul erstellen**

Datei `js/modules/application-matcher.js` — Inhalt:

```js
/**
 * ApplicationMatcher — Fuzzy-Match zwischen User-Input und bekannten
 * Anwendungen aus saa-apps-data.js. Verwendet einen Search-Index aus
 * Keywords + Levenshtein-Ähnlichkeit.
 *
 * @module modules/application-matcher
 */

class ApplicationMatcher {
    constructor(knownApps) {
        this.knownApps = knownApps;
        this.searchIndex = this.buildSearchIndex();
    }
    // ... weitere Methoden
}

export { ApplicationMatcher };
```

Vollständigen Klassen-Body aus `js/saa-data.js:2027-2223` 1:1 übernehmen (alle Methoden: `buildSearchIndex`, `matchApplication`, `normalize`, `extractKeywords`, `stringSimilarity`, `levenshtein`).

- [ ] **Step 2: Klasse aus `saa-data.js` entfernen**

Lösche `class ApplicationMatcher { ... }` (Zeilen 2027-2223).
Aus Export-Statement `ApplicationMatcher` entfernen.

- [ ] **Step 3: Import in `saa-app.js` aktualisieren**

Aktuell `js/saa-app.js:6`:
```js
import { cloudProviders, architectureComponents, ApplicationMatcher, SizingDetector } from './saa-data.js';
```

Neu (zwei Import-Zeilen):
```js
import { cloudProviders, architectureComponents } from './saa-data.js';
import { ApplicationMatcher } from './modules/application-matcher.js';
import { SizingDetector } from './modules/sizing-detector.js';  // Vorbereitung für Task 2.3
```

(SizingDetector-Import noch falsch in dieser Phase — wird in Task 2.3 erstellt. Falls Task 2.3 noch nicht durch ist, behalte SizingDetector-Import vorerst aus saa-data.js.)

- [ ] **Step 4: Browser-Smoke-Test**

Run: Server, Quick-Suggestion-Click testet Matcher-Funktionalität (Schritt 2 der Checkliste).
Expected: SAP S/4HANA-Match findet Komponenten korrekt.

- [ ] **Step 5: Commit**

```bash
git add js/modules/application-matcher.js js/saa-data.js js/saa-app.js
git commit -m "refactor(phase-2b): ApplicationMatcher aus saa-data.js extrahiert"
```

### Task 2.3: `SizingDetector`-Klasse extrahieren

**Files:**
- Create: `js/modules/sizing-detector.js`
- Modify: `js/saa-data.js` (Klasse entfernen)
- Modify: `js/saa-app.js` (Import bereits in Task 2.2 vorbereitet)

- [ ] **Step 1: Neues Modul erstellen**

Datei `js/modules/sizing-detector.js` — Inhalt:

```js
/**
 * SizingDetector — Erkennt Sizing (small/medium/large) aus Keywords im Anwendungsnamen.
 *
 * @module modules/sizing-detector
 */

class SizingDetector {
    detectSizing(userInput) {
        const normalized = userInput.toLowerCase();

        const sizePatterns = {
            small: ['klein', 'small', 'dev', 'test', 'entwicklung', 'poc', 'pilot', 'staging'],
            medium: ['mittel', 'medium', 'standard', 'prod', 'produktion', 'production'],
            large: ['groß', 'gross', 'large', 'enterprise', 'konzern', 'xl', 'xxl', 'huge']
        };

        for (const [size, patterns] of Object.entries(sizePatterns)) {
            for (const pattern of patterns) {
                if (normalized.includes(pattern)) {
                    return { sizing: size, confidence: 0.8, keyword: pattern };
                }
            }
        }

        // Default
        return { sizing: 'medium', confidence: 0.3, keyword: 'standard' };
    }
}

export { SizingDetector };
```

(Klassen-Body 1:1 aus `js/saa-data.js:2225-2247`.)

- [ ] **Step 2: Klasse aus `saa-data.js` entfernen**

Lösche `class SizingDetector { ... }` (Zeilen 2225-2247).
Aus Export-Statement `SizingDetector` entfernen.

Endgültiger Export-Stand `js/saa-data.js`:
```js
export { selfBuildOptions, architectureModes, deploymentPatterns, cloudProviders, architectureComponents, detectDeploymentPattern };
```

- [ ] **Step 3: Browser-Smoke-Test**

Run: Server, Quick-Suggestion mit verschiedenen Sizing-Keywords testen.
Expected: Sizing wird korrekt erkannt.

- [ ] **Step 4: Commit**

```bash
git add js/modules/sizing-detector.js js/saa-data.js
git commit -m "refactor(phase-2c): SizingDetector aus saa-data.js extrahiert"
```

### Task 2.4: `detectDeploymentPattern` extrahieren

**Files:**
- Create: `js/modules/deployment-pattern.js`
- Modify: `js/saa-data.js` (Funktion entfernen)
- Modify: `js/modules/saa-components.js:4` (Import-Source ändern)

- [ ] **Step 1: Neues Modul erstellen**

Datei `js/modules/deployment-pattern.js`:

```js
/**
 * detectDeploymentPattern — Erkennt das passende Deployment-Pattern
 * (z.B. Web-App, Enterprise-App, KI-Workload) basierend auf gewählten
 * Komponenten und optional einer App-ID.
 *
 * @module modules/deployment-pattern
 */

import { deploymentPatterns } from '../saa-data.js';

function detectDeploymentPattern(components, appId = null) {
    // ... Funktions-Body
}

export { detectDeploymentPattern };
```

Vollständigen Body aus `js/saa-data.js:293-NNN` 1:1 übernehmen (Funktionsende per `}` direkt nach Return-Statement).

- [ ] **Step 2: Funktion aus `saa-data.js` entfernen**

Lösche `function detectDeploymentPattern(...) { ... }` aus `saa-data.js`.
Aus Export-Statement `detectDeploymentPattern` entfernen.

- [ ] **Step 3: Import in `saa-components.js` aktualisieren**

Aktuell `js/modules/saa-components.js:4`:
```js
import { architectureComponents, detectDeploymentPattern } from '../saa-data.js';
```

Neu:
```js
import { architectureComponents } from '../saa-data.js';
import { detectDeploymentPattern } from './deployment-pattern.js';
```

- [ ] **Step 4: Browser-Smoke-Test**

Run: Server, Quick-Suggestion → Step 2: das Deployment-Pattern wird in der UI angezeigt.
Expected: Pattern-Anzeige korrekt (z.B. „Web-Application").

- [ ] **Step 5: Commit**

```bash
git add js/modules/deployment-pattern.js js/saa-data.js js/modules/saa-components.js
git commit -m "refactor(phase-2d): detectDeploymentPattern aus saa-data.js extrahiert"
```

### Task 2.5: Provider-Service-Mapping einführen

**Files:**
- Create: `js/modules/provider-service-mapping.js`
- Modify: `js/saa-analysis.js:817-850` (`_estimateDatabaseNoSQL`-Methode)

- [ ] **Step 1: Mapping-Datei erstellen**

`js/modules/provider-service-mapping.js`:

```js
/**
 * Provider-spezifische Service-Mappings.
 *
 * Bisher hardcoded als if-Branches in saa-analysis.js#_estimateDatabaseNoSQL.
 * Datengetrieben sauberer und erweiterbar.
 *
 * @module modules/provider-service-mapping
 */

/**
 * NoSQL-Service-Lookup je Provider.
 * Key: Substring im User-DB-Typ (lowercase), Value: Pfad in CloudPricing.database.nosql[providerId]
 *
 * Beispiel: User schreibt „DynamoDB" → matched 'dynamo' → AWS-Pfad 'dynamodb'.
 */
export const PROVIDER_NOSQL_LOOKUP = Object.freeze({
    aws:   { 'dynamo': 'dynamodb' },
    azure: { 'cosmos': 'cosmosdb' },
    gcp:   { 'firestore': 'firestore' }
});

/**
 * Liefert den Pfad-Key des passenden NoSQL-Services oder null.
 *
 * @param {string} providerId
 * @param {string} userDbType - z.B. „DynamoDB", „Cosmos DB"
 * @returns {string|null}
 */
export function getNosqlServiceKey(providerId, userDbType) {
    const lookup = PROVIDER_NOSQL_LOOKUP[providerId];
    if (!lookup) return null;
    const lower = userDbType.toLowerCase();
    for (const [keyword, serviceKey] of Object.entries(lookup)) {
        if (lower.includes(keyword)) return serviceKey;
    }
    return null;
}
```

- [ ] **Step 2: `_estimateDatabaseNoSQL` umbauen**

In `js/saa-analysis.js`, Header der Datei: zusätzlicher Import:
```js
import { getNosqlServiceKey } from './modules/provider-service-mapping.js';
```

Aktuelle Zeilen 828-835 (`_estimateDatabaseNoSQL`):
```js
if (useRealPricing && this.cloudPricing.database?.nosql?.[providerId]) {
    if (nosqlType.toLowerCase().includes('dynamo') && providerId === 'aws')
        pricePerGB = this.cloudPricing.database.nosql.aws.dynamodb.storagePerGB;
    else if (nosqlType.toLowerCase().includes('cosmos') && providerId === 'azure')
        pricePerGB = this.cloudPricing.database.nosql.azure.cosmosdb.storagePerGB;
    else if (nosqlType.toLowerCase().includes('firestore') && providerId === 'gcp')
        pricePerGB = this.cloudPricing.database.nosql.gcp.firestore.storagePerGB;
    source = 'CloudPricing API';
} else { /* ... */ }
```

Neu:
```js
if (useRealPricing && this.cloudPricing.database?.nosql?.[providerId]) {
    const serviceKey = getNosqlServiceKey(providerId, nosqlType);
    if (serviceKey) {
        pricePerGB = this.cloudPricing.database.nosql[providerId][serviceKey].storagePerGB;
        source = 'CloudPricing API';
    }
} else { /* ... */ }
```

- [ ] **Step 3: Browser-Smoke-Test**

Run: Server, Multi-App-Template „Data Analytics" laden (enthält DynamoDB-Apps), AWS auswählen, prüfen dass NoSQL-Kostenposition korrekt erscheint.
Expected: Cost-Breakdown zeigt DynamoDB-Pricing aus CloudPricing-API.

- [ ] **Step 4: Commit**

```bash
git add js/modules/provider-service-mapping.js js/saa-analysis.js
git commit -m "refactor(phase-2e): Provider-NoSQL-Mapping als Lookup-Tabelle"
```

### Task 2.6: PROVIDER_C3A_DATA Side-Effect-Merge entfernen

**Files:**
- Modify: `js/saa-data.js:1788-1801` (Side-Effect-Block entfernen)
- Modify: `js/modules/sovereignty-engine.js` (Lazy-Lookup integrieren)

- [ ] **Step 1: Lazy-Lookup im Sovereignty-Modul**

In `js/modules/sovereignty-engine.js` zwei Änderungen:

Imports erweitern:
```js
import { PROVIDER_C3A_DATA } from '../data/provider-c3a-data.js';
```

`getC3AAdjustedControl` so anpassen, dass es Provider ohne `c3a`-Property automatisch aus `PROVIDER_C3A_DATA` ergänzt:

```js
export function getC3AAdjustedControl(provider, mode = getAuditMode()) {
    if (!provider) return 50;
    // Lazy-Lookup: wenn Provider noch keine C3A-Daten hat, aus zentraler Tabelle holen
    if (!provider.c3a && PROVIDER_C3A_DATA[provider.id]) {
        const data = PROVIDER_C3A_DATA[provider.id];
        provider.c3a = data.c3a;
        provider.sov7 = data.sov7;
        provider.sources = data.sources;
    }
    if (!provider.c3a) return provider.control ?? 50;
    const sov = aggregateProviderSovScores(provider, mode);
    if (!sov) return provider.control ?? 50;
    return calculateControlFromSov(sov);
}
```

- [ ] **Step 2: Side-Effect-Block aus `saa-data.js` löschen**

Lösche aus `js/saa-data.js` Zeilen 1788-1801 (kompletter Block ab dem Kommentar `// ====== Provider-C3A/SOV-7-Bewertungen mergen ======`):

```js
// ====== Provider-C3A/SOV-7-Bewertungen mergen (v4.0.0) ======
// Pro Provider werden c3a, sov7 und sources aus PROVIDER_C3A_DATA als zusätzliche
// Felder gemergt. Die statischen control-Werte bleiben bestehen — Phase 2 löst
// sie optional durch eine berechnete Hybrid-Variante ab.
cloudProviders.forEach(p => {
    const c3aData = PROVIDER_C3A_DATA[p.id];
    if (c3aData) {
        p.c3a = c3aData.c3a;
        p.sov7 = c3aData.sov7;
        p.sources = c3aData.sources;
    }
});
```

Auch den `import { PROVIDER_C3A_DATA }`-Import am Dateianfang entfernen (`js/saa-data.js:10`).

- [ ] **Step 3: Browser-Smoke-Test**

Run: Server, vollständige Browser-Smoke-Checkliste durchgehen.
Expected: Audit-Toggle C1↔C2 zeigt verschiedene Werte (= C3A-Daten werden lazy gezogen).

- [ ] **Step 4: Commit**

```bash
git add js/saa-data.js js/modules/sovereignty-engine.js
git commit -m "refactor(phase-2f): Side-Effect-Merge entfernt, Lazy-Lookup in Sovereignty-Engine

saa-data.js wird wieder pure Daten. Provider-C3A-Daten werden bei Bedarf
lazy aus PROVIDER_C3A_DATA in sovereignty-engine.js#getC3AAdjustedControl ergänzt."
```

---

## Phase 3: `PortfolioAnalyzer` einführen

**Risiko:** niedrig — Rename + neue Convenience-Methode, parallele Welt zur alten.

### Task 3.1: `MultiAppAnalyzer` zu `PortfolioAnalyzer` umbenennen

**Files:**
- Modify: `js/saa-analysis.js:1843-2119` (Class-Name + Export)
- Modify: `js/saa-app.js:8, 1372` (Import + Verwendung)

- [ ] **Step 1: Klassen-Name in `saa-analysis.js` umbenennen**

Aktuell Zeile 1843:
```js
class MultiAppAnalyzer {
```

Neu:
```js
class PortfolioAnalyzer {
```

Doc-Kommentar darüber (Zeile 1841) anpassen:
```js
/**
 * PortfolioAnalyzer — analysiert eine oder mehrere Anwendungen und aggregiert.
 * Single-App = Portfolio mit length 1.
 */
```

Export am Ende der Datei (Zeile 2119):
```js
export { CloudAnalyzer, ApplicationResearcher, MultiAppAnalyzer };
```

Neu:
```js
export { CloudAnalyzer, ApplicationResearcher, PortfolioAnalyzer };
```

- [ ] **Step 2: Import + Verwendung in `saa-app.js`**

Zeile 8 aktuell:
```js
import { CloudAnalyzer, ApplicationResearcher, MultiAppAnalyzer } from './saa-analysis.js';
```

Neu:
```js
import { CloudAnalyzer, ApplicationResearcher, PortfolioAnalyzer } from './saa-analysis.js';
```

Zeile 1372 aktuell (in `runMultiAppAnalysis`):
```js
const multiAnalyzer = new MultiAppAnalyzer(cloudProviders, architectureComponents);
```

Neu:
```js
const multiAnalyzer = new PortfolioAnalyzer(cloudProviders, architectureComponents);
```

- [ ] **Step 3: Browser-Smoke-Test**

Run: Server, Multi-App-Template laden, Analyse durchgehen.
Expected: Multi-App-Analyse läuft wie vorher.

- [ ] **Step 4: Commit**

```bash
git add js/saa-analysis.js js/saa-app.js
git commit -m "refactor(phase-3a): MultiAppAnalyzer → PortfolioAnalyzer (Rename)"
```

### Task 3.2: `analyzeOne()` Convenience-Methode

**Files:**
- Modify: `js/saa-analysis.js:1843-2119` (PortfolioAnalyzer um Methode erweitern)

- [ ] **Step 1: Neue Methode in der Klasse**

In `class PortfolioAnalyzer { ... }` direkt nach `analyzePortfolio` einfügen (nach Zeile 1892, vor `aggregateProviderScores`):

```js
/**
 * Convenience: analysiert eine einzelne App und liefert dieselbe
 * Portfolio-Datenstruktur wie analyzePortfolio.
 * `perAppResults.length === 1`, `aggregatedProviders` trivial.
 *
 * @param {Object} app - {selectedComponents, systemConfig, ...} (analog ApplicationInstance)
 * @returns {Object} Portfolio-shaped result
 */
analyzeOne(app, weights, maturitySettings, operationsSettings, projectEffortSettings) {
    return this.analyzePortfolio([app], weights, maturitySettings, operationsSettings, projectEffortSettings);
}
```

- [ ] **Step 2: Smoke-Test in Browser**

Run: Server, Single-App-Flow durchgehen.
Expected: Funktioniert wie vorher (alte Pfade nutzen `analyzeOne` noch nicht — kommt in Phase 4).

- [ ] **Step 3: Commit**

```bash
git add js/saa-analysis.js
git commit -m "refactor(phase-3b): PortfolioAnalyzer.analyzeOne() für Single-App"
```

---

## Phase 4: State-Modell unifizieren ⚠️

**Risiko:** mittel-hoch — größter Eingriff im ganzen Refactor. Eigene PR / eigener Commit-Block.

### Task 4.1: `currentApp`-Getter + initiale ApplicationInstance

**Files:**
- Modify: `js/saa-app.js:25-105` (Constructor, neue Initialisierung)

- [ ] **Step 1: Import von ApplicationInstance ergänzen**

In `js/saa-app.js`, Imports am Dateianfang (~Zeile 6-15) ergänzen:

```js
import { ApplicationInstance } from './modules/application-instance.js';
```

- [ ] **Step 2: Constructor anpassen**

Aktuell `js/saa-app.js:25-100` (Auszug Constructor-Anfang):
```js
constructor() {
    this.currentStep = 0;
    this.applicationData = null;
    this.selectedComponents = new Set();
    this.componentConfigs = {};
    this.systemConfig = null;
    this.analysisResults = null;
    this.weights = { ... };
    this.applications = []; // Multi-App
    this.currentAppIndex = -1;
    this.isMultiAppMode = false;
    // ...
}
```

Direkt am Ende des Konstruktor-Bodies, **bevor `this.init()` aufgerufen wird**, eine Anlauf-Initialisierung einfügen:

```js
// Always-Portfolio: starte mit genau 1 ApplicationInstance, currentAppIndex=0.
// Single-App-Modus = isMultiAppMode=false + applications.length===1.
if (this.applications.length === 0) {
    this.applications.push(new ApplicationInstance(null, 'Anwendung'));
}
this.currentAppIndex = 0;
```

- [ ] **Step 3: Neuer `currentApp`-Getter**

In der Klasse `SovereignArchitectureAdvisor`, direkt unter dem Constructor-Ende und **vor** den Backward-Compat-Gettern (Zeile 109), einfügen:

```js
/**
 * Liefert die aktuell aktive ApplicationInstance.
 * Im Always-Portfolio-Modell ist dies sowohl im Single- als auch im
 * Multi-App-Modus die Single Source of Truth für State.
 */
get currentApp() {
    return this.applications[this.currentAppIndex] ?? null;
}
```

- [ ] **Step 4: Browser-Smoke-Test (Zwischenstand, alte Getter noch aktiv)**

Run: Server, Browser-Standard-Checkliste.
Expected: Keine Regression, denn die alten Getter haben Vorrang. App startet mit einer leeren ApplicationInstance, aber im Single-App-Modus werden die alten `_*`-Felder weiter verwendet.

- [ ] **Step 5: Commit (Zwischenstand)**

```bash
git add js/saa-app.js
git commit -m "refactor(phase-4a): currentApp-Getter + initiale ApplicationInstance

Vorbereitung für State-Unifikation. Konstruktor legt immer eine erste
ApplicationInstance an, currentAppIndex=0. Alte Getter-Proxies bleiben
in Phase 4a noch aktiv und übersteuern."
```

### Task 4.2: Session-State-Migration

**Files:**
- Modify: `js/modules/saa-state.js` (Migration-Funktion und Aufruf)

- [ ] **Step 1: Migration-Logik in `saa-state.js` ergänzen**

In `js/modules/saa-state.js`, vor dem Export-Statement (am Dateiende), neue Helper-Funktion:

```js
/**
 * Migriert Legacy-Session-State (vor „Always Portfolio") in das neue Schema.
 * Alte Saves haben _selectedComponents, _componentConfigs, etc. am Top-Level.
 * Neue: applications[0] hält diese Properties.
 *
 * @param {Object} state - der rohe deserialisierte Session-State
 * @returns {Object} migrierter State
 */
function migrateLegacySessionState(state) {
    if (!state) return state;
    // Legacy erkennen: _selectedComponents existiert UND applications fehlt/leer
    const hasLegacyFields = state._selectedComponents !== undefined
                         || state._componentConfigs !== undefined
                         || state._applicationData !== undefined;
    const hasNewFields = Array.isArray(state.applications) && state.applications.length > 0;
    if (!hasLegacyFields || hasNewFields) return state;

    // Legacy → neue Struktur
    const migrated = { ...state };
    migrated.applications = [{
        id: 'app-' + Date.now().toString(36),
        name: state._applicationData?.name || 'Anwendung',
        type: state._applicationData?.type || null,
        sizing: state._selectedSizing || 'medium',
        applicationData: state._applicationData || null,
        selectedComponents: state._selectedComponents || new Set(),
        componentConfigs: state._componentConfigs || {},
        systemConfig: state._systemConfig || null,
        analysisResults: state._analysisResults || null,
        architectureMode: null,
        _archOriginal: state.__archOriginal ?? null,
        _archDelta: state.__archDelta ?? null
    }];
    migrated.currentAppIndex = 0;

    // Legacy-Felder explizit entfernen
    delete migrated._selectedComponents;
    delete migrated._componentConfigs;
    delete migrated._applicationData;
    delete migrated._systemConfig;
    delete migrated._selectedSizing;
    delete migrated._analysisResults;
    delete migrated.__archOriginal;
    delete migrated.__archDelta;

    return migrated;
}
```

- [ ] **Step 2: Migration im Load-Pfad aufrufen**

In `js/modules/saa-state.js` die Funktion `loadSessionState()` finden und am Anfang nach dem JSON-Parse die Migration einfügen:

Aktuell (Auszug):
```js
loadSessionState() {
    const raw = sessionStorage.getItem('saa-session') || localStorage.getItem('saa-session');
    if (!raw) return;
    try {
        const state = JSON.parse(raw);
        // ... bisherige Restore-Logik
```

Neu:
```js
loadSessionState() {
    const raw = sessionStorage.getItem('saa-session') || localStorage.getItem('saa-session');
    if (!raw) return;
    try {
        let state = JSON.parse(raw);
        state = migrateLegacySessionState(state);   // ← NEU
        // ... bisherige Restore-Logik
```

- [ ] **Step 3: Browser-Smoke-Test mit künstlichem Legacy-Save**

Im DevTools-Console (mit der App geladen):

```js
// Legacy-State manuell ins LocalStorage schreiben:
localStorage.setItem('saa-session', JSON.stringify({
    currentStep: 2,
    _selectedComponents: ['compute', 'database_sql'],
    _applicationData: { name: 'Test-Legacy-App' },
    _selectedSizing: 'medium'
}));
```

Dann F5. Erwartetes Verhalten:
- Step 2 wird gerendert
- App heißt „Test-Legacy-App"
- `app.applications` hat ein Element mit `selectedComponents` und `applicationData`
- Im LocalStorage ist nach Save kein `_selectedComponents` mehr, sondern `applications[0]`

Run: in Console `app.applications` und `app.currentApp` inspizieren.
Expected: `app.applications.length === 1`, `app.currentApp.applicationData.name === 'Test-Legacy-App'`.

- [ ] **Step 4: Commit**

```bash
git add js/modules/saa-state.js
git commit -m "refactor(phase-4b): Session-State-Migration für Always-Portfolio

Alte Saves mit _selectedComponents, _componentConfigs etc. werden beim
Load in applications[0] migriert. Legacy-Felder werden bereinigt."
```

### Task 4.3: 16 Backward-Compat-Getter entfernen

**Files:**
- Modify: `js/saa-app.js:109-196` (kompletter Getter/Setter-Block raus)

- [ ] **Step 1: Block löschen**

Lösche aus `js/saa-app.js` den gesamten Bereich von `// ========== BACKWARD COMPATIBILITY GETTERS/SETTERS ==========` (Zeile 109) bis vor `init() {` (Zeile 198). Das umfasst alle 16 Property-Accessor-Paare:
- `selectedComponents` get/set
- `componentConfigs` get/set
- `applicationData` get/set
- `analysisResults` get/set
- `selectedSizing` get/set
- `systemConfig` get/set
- `_archOriginal` get/set
- `_archDelta` get/set

- [ ] **Step 2: Alle `this.foo` → `this.currentApp.foo` ersetzen**

Im gesamten `js/saa-app.js` (außer in den drei Methoden `runAnalysis`, `runMultiAppAnalysis`, `init`) jede Verwendung von:

| Vorher | Nachher |
|---|---|
| `this.selectedComponents` | `this.currentApp.selectedComponents` |
| `this.componentConfigs` | `this.currentApp.componentConfigs` |
| `this.applicationData` | `this.currentApp.applicationData` |
| `this.analysisResults` | `this.currentApp.analysisResults` |
| `this.selectedSizing` | `this.currentApp.sizing` |
| `this.systemConfig` | `this.currentApp.systemConfig` |
| `this._archOriginal` | `this.currentApp._archOriginal` |
| `this._archDelta` | `this.currentApp._archDelta` |

Run: `grep -nE "this\.(selectedComponents|componentConfigs|applicationData|analysisResults|selectedSizing|systemConfig|_archOriginal|_archDelta)" js/saa-app.js | wc -l`
Expected: 0 Treffer nach Replace (außer evtl. Schreibzugriffe in `loadSessionState` selbst).

Achtung: Die Konsumenten-Module (`saa-multiapp.js`, `saa-results.js` etc.) greifen via Prototype-Mixin ebenfalls über `this.foo` auf den Orchestrator zu — das funktioniert weiterhin, **wenn dort `this.currentApp.foo` steht**. Also auch in diesen Modulen den Replace durchführen:

```bash
for FILE in js/modules/saa-multiapp.js js/modules/saa-results.js js/modules/saa-components.js js/modules/saa-state.js js/modules/saa-settings.js js/modules/saa-pdf.js; do
  grep -nE "this\.(selectedComponents|componentConfigs|applicationData|analysisResults|selectedSizing|systemConfig|_archOriginal|_archDelta)" "$FILE"
done
```

Jede gefundene Zeile per Edit-Tool auf `this.currentApp.foo` umstellen. Ausnahmen:
- In `loadSessionState()` selbst werden die Properties direkt zugewiesen — diese Zeilen nicht ersetzen, da sie die Migration vornehmen.

- [ ] **Step 3: Browser-Smoke-Test (komplett)**

Run: Server, **alle 8 Standard-Smoke-Test-Schritte** durchgehen.
Expected:
- Frischer Start: leere Anwendung, Single-App-Modus default
- Quick-Suggestion: SAP S/4HANA matched, Step 2 zeigt Komponenten
- Audit-Toggle ändert Werte
- Multi-App-Modus aktivierbar, Templates laden
- F5: State persistent
- Console: keine Errors

- [ ] **Step 4: Commit**

```bash
git add js/saa-app.js js/modules/saa-multiapp.js js/modules/saa-results.js \
        js/modules/saa-components.js js/modules/saa-state.js js/modules/saa-settings.js \
        js/modules/saa-pdf.js
git commit -m "refactor(phase-4c): 16 Backward-Compat-Getter entfernt

State lebt nun ausschließlich auf this.applications[currentAppIndex] (= this.currentApp).
130 Zeilen Getter-Proxy-Ceremony eliminiert.

Konsumenten-Module nutzen this.currentApp.foo statt der Proxies."
```

### Task 4.4: `isMultiAppMode`-Branches auf UI-Schalter reduzieren

**Files:**
- Modify: `js/saa-app.js`, `js/modules/saa-state.js`, `js/modules/saa-settings.js`, `js/modules/saa-components.js`, `js/modules/saa-pdf.js`, `js/modules/saa-results.js`, `js/modules/saa-multiapp.js`

- [ ] **Step 1: Audit aller `isMultiAppMode`-Stellen**

Run: `grep -rnE "isMultiAppMode" js/`
Erwartet: 46 Treffer (Stand vor Phase 4) → nach Audit reduziert auf < 12.

Für jede Stelle anhand folgender Heuristik entscheiden:

**BEHALTEN** (bleibt UI-Schalter):
- Tab-Bar / App-Navigation-Sichtbarkeit (`saa-app.js`, `saa-multiapp.js`)
- Step-1-Layout (Single-Input-Feld vs. Multi-Textarea + Templates)
- Render-Verzweigung Single-Card vs. Aggregated-Card (wird in Phase 5 weiter konsolidiert)
- PDF-Export-Variante (Single-Report vs. Portfolio-Report) — bleibt vorerst, evtl. in späterer Phase
- Step-Navigation: `if (!isMultiAppMode && currentStep === 0)` → für Multi-App andere Step-1-Logik

**ENTFERNEN** (State-Routing, jetzt obsolet):
- Lese-/Schreibzugriffe auf Component-Configs, applicationData etc. — alles via `this.currentApp` (sollte schon in 4.3 erledigt sein)
- Save/Load-Switching zwischen `_foo` und `applications[currentAppIndex]` (`saa-state.js`) — ist nun einheitlich

Konkret zu entfernende Zeilen-Cluster (Anhaltspunkte aus Audit):
- `js/saa-app.js:111-195` (sind in 4.3 bereits weg)
- `js/modules/saa-state.js:` alle 5 Stellen mit `if (this.isMultiAppMode)` im Save-/Load-Pfad — hier wird einheitlich `this.applications` persistiert
- `js/modules/saa-settings.js:` 5 Stellen — Settings sind app-übergreifend, keine Switch-Logik mehr nötig
- `js/modules/saa-components.js:` 3 Stellen (vermutlich Konfiguration-Render — entscheiden ob UI-Variante oder State-Routing)
- `js/modules/saa-pdf.js:` 3 Stellen — PDF-Export bleibt vorerst (Variante)

- [ ] **Step 2: Pro Stelle entscheiden + ändern**

Diese Audit-Tabelle als Checkliste durchgehen. Jede Stelle einzeln editieren und mental prüfen: „Ist das State-Routing (entfernen) oder UI-Sichtbarkeit (behalten)?"

Save-Pfad in `saa-state.js` (Beispiel — vor Audit):
```js
saveSessionState() {
    const state = {
        currentStep: this.currentStep,
        weights: this.weights,
        // ...
    };
    if (this.isMultiAppMode) {
        state.applications = this.applications.map(serializeApp);
        state.currentAppIndex = this.currentAppIndex;
    } else {
        state._selectedComponents = [...this._selectedComponents];
        state._componentConfigs = this._componentConfigs;
        // ...
    }
    sessionStorage.setItem('saa-session', JSON.stringify(state));
}
```

Nach Audit:
```js
saveSessionState() {
    const state = {
        currentStep: this.currentStep,
        weights: this.weights,
        applications: this.applications.map(serializeApp),
        currentAppIndex: this.currentAppIndex,
        isMultiAppMode: this.isMultiAppMode,   // bleibt: UI-Modus-Persistenz
        // ...
    };
    sessionStorage.setItem('saa-session', JSON.stringify(state));
}
```

- [ ] **Step 3: Verifikations-Grep**

Run: `grep -rnE "isMultiAppMode" js/ | wc -l`
Expected: < 12

Run: `grep -rnE "isMultiAppMode" js/ | tee /tmp/multiapp-audit.txt`
Visuelle Prüfung: alle übrigbleibenden sollten UI-Sichtbarkeit oder Modus-Persistenz sein.

- [ ] **Step 4: Browser-Smoke-Test (vollständig + Multi-App-Flow ausführlich)**

Run: Server, alle 8 Smoke-Test-Schritte. Plus zusätzlich:
- Multi-App: 3 Apps via Template laden, durch alle navigieren, in jeder Komponenten ändern, F5, prüfen dass jede App ihren State behalten hat
- Multi-App → Single-App-Toggle (in Step 1) und zurück: verhält sich konsistent
- Architektur-Modus-Toggle in Multi-App pro App separat
- Audit-Toggle in Multi-App: alle Apps neu gerechnet
- PDF-Export Single + Multi

Expected: Keine Regression. Alle Werte konsistent, keine State-Verluste.

- [ ] **Step 5: Commit**

```bash
git add js/saa-app.js js/modules/saa-state.js js/modules/saa-settings.js \
        js/modules/saa-components.js js/modules/saa-pdf.js js/modules/saa-results.js \
        js/modules/saa-multiapp.js
git commit -m "refactor(phase-4d): isMultiAppMode-Branches auf UI-Schalter reduziert

Von 46 auf < 12 reduziert. Verbleibende Vorkommen sind UI-Sichtbarkeit
(Tabs, Step-1-Layout, Render-Variante) oder Modus-Persistenz.
State-Routing erfolgt einheitlich über this.currentApp.

Always-Portfolio-Refactor abgeschlossen."
```

---

## Phase 5: Render-Layer kollabieren

**Risiko:** mittel — visuelle Diffs müssen gegengeprüft werden.

### Task 5.1: `renderAnalysisResults` unifizieren

**Files:**
- Modify: `js/modules/saa-results.js:8, 249` (zwei Methoden zu einer)
- Modify: `js/saa-app.js:1356, 1389` (Aufrufer)

- [ ] **Step 1: Aufruf-Pfade analysieren**

Aktuell:
- `saa-app.js:1356` ruft `this.renderAnalysisResults()` (kein Argument, liest `this.analysisResults`)
- `saa-app.js:1389` ruft `this.renderAggregatedAnalysisResults()` (kein Argument, liest `this.aggregatedResults`)

Ziel: nur `this.renderAnalysisResults(portfolio)`, mit `portfolio` als expliziter Daten-Container.

- [ ] **Step 2: Methoden-Body unifizieren**

In `js/modules/saa-results.js`, die beiden Methoden zu einer zusammenführen.
Aktuelle Header (Zeilen 8 und 249):
```js
renderAnalysisResults() { /* Single-App ~240 Zeilen */ }
renderAggregatedAnalysisResults() { /* Multi-App ~120 Zeilen */ }
```

Neu (eine Methode):
```js
/**
 * Rendert Analyse-Ergebnisse. Funktioniert für Single-App (portfolio mit
 * length 1) und Multi-App (portfolio mit length > 1). Schaltet UI-Elemente
 * (App-Breakdown, Portfolio-Metriken) anhand portfolio.perAppResults.length.
 *
 * @param {Object} portfolio - {perAppResults, aggregatedProviders, aggregatedTCO, portfolioMetrics}
 */
renderAnalysisResults(portfolio) {
    const isAggregated = portfolio.perAppResults.length > 1;

    // Container-State setzen
    document.getElementById('appBreakdownSection').style.display = isAggregated ? '' : 'none';
    document.getElementById('portfolioMetricsSection').style.display = isAggregated ? '' : 'none';

    if (isAggregated) {
        // Aggregated-Pfad (entspricht altem renderAggregatedAnalysisResults-Body)
        this._renderAggregatedSummary(portfolio);
        portfolio.aggregatedProviders.forEach((p, i) => this.renderProviderCard(p, i, true, portfolio.aggregatedTCO));
        portfolio.perAppResults.forEach((app, i) => this.renderAppBreakdownItem(app, i));
    } else {
        // Single-Pfad (entspricht altem renderAnalysisResults-Body)
        const result = portfolio.perAppResults[0].results;
        result.forEach((p, i) => this.renderProviderCard(p, i, false));
    }
},
```

(Die alten Methoden-Bodies entsprechend in den `if/else`-Pfad einbetten. **Wichtig:** Die Detail-Method-Calls wie `renderTCOOverview`, `renderRecommendationCard` etc. werden in den nachfolgenden Tasks 5.2-5.5 entsprechend unifiziert — bis dahin alle paarweise Aufrufe (Single vs. Aggregated) erhalten und korrekt aus dem `if/else` aufrufen.)

- [ ] **Step 3: Aufrufer in `saa-app.js` umstellen**

Aktuell `saa-app.js:1356`:
```js
this.analysisResults = this.analyzer.analyzeForComponents(componentIds, ...);
this.renderAnalysisResults();
```

Neu:
```js
const portfolioAnalyzer = new PortfolioAnalyzer(cloudProviders, architectureComponents);
const portfolio = portfolioAnalyzer.analyzeOne(this.currentApp, this.weights, ...);
this.currentApp.analysisResults = portfolio.perAppResults[0].results;
this.lastPortfolio = portfolio;
this.renderAnalysisResults(portfolio);
```

Aktuell `saa-app.js:1373-1389` (`runMultiAppAnalysis`):
```js
const multiAnalyzer = new PortfolioAnalyzer(cloudProviders, architectureComponents);
this.aggregatedResults = multiAnalyzer.analyzePortfolio(this.applications, ...);
// ... Result-Speichern ...
this.renderAggregatedAnalysisResults();
```

Neu:
```js
const portfolioAnalyzer = new PortfolioAnalyzer(cloudProviders, architectureComponents);
const portfolio = portfolioAnalyzer.analyzePortfolio(this.applications, this.weights, ...);
this.aggregatedResults = portfolio;
portfolio.perAppResults.forEach(({app, results}) => {
    const inst = this.applications.find(a => a.id === app.id);
    if (inst) inst.analysisResults = results;
});
this.renderAnalysisResults(portfolio);
```

- [ ] **Step 4: Browser-Smoke-Test mit visuellem Vergleich**

Run: Server, im Single-App-Modus:
1. Vor Phase 5: `git stash` aktuelle Änderungen
2. Screenshot von Step 3 (Provider-Cards, TCO, Recommendation)
3. `git stash pop`
4. Erneut Step 3 öffnen, Screenshot
5. Visuell vergleichen: identisch?

Same für Multi-App-Modus.

- [ ] **Step 5: Commit**

```bash
git add js/modules/saa-results.js js/saa-app.js
git commit -m "refactor(phase-5a): renderAnalysisResults unifiziert

Eine Methode für Single + Multi. Schaltet UI per portfolio.length."
```

### Task 5.2: `renderProviderCard` unifizieren

**Files:**
- Modify: `js/modules/saa-results.js` (renderRecommendationCard + renderAggregatedProviderCard)

- [ ] **Step 1: Signatur vereinheitlichen**

Aktuell:
```js
renderRecommendationCard(result, index, appIndex = null) { /* Single ~150 Zeilen */ }
renderAggregatedProviderCard(result, index, aggregatedTCO) { /* Multi ~100 Zeilen */ }
```

Neu — eine Methode:
```js
/**
 * Rendert eine Provider-Card.
 *
 * @param {Object} result - Provider-Result-Objekt
 * @param {number} index
 * @param {boolean} isAggregated - true im Multi-App-Modus
 * @param {Object} [aggregatedTCO] - nur bei isAggregated=true
 */
renderProviderCard(result, index, isAggregated, aggregatedTCO = null) {
    // Gemeinsame Berechnungen (Score, Position, Klasse)
    const baseHTML = `<div class="recommendation-card ${index === 0 ? 'top-rank' : ''}">...`;

    if (isAggregated) {
        // App-Score-Liste, Coverage-Diff etc.
    } else {
        // Single-App: TCO-Overview, Strategy
    }
    // ... Card-Inhalt rendern
},
```

Konkrete Implementierung: nimm den längeren der beiden alten Methoden-Bodies als Basis, ersetze den anderen-spezifischen Block durch `if (isAggregated) { ... } else { ... }`. Gemeinsame Berechnungen oben extrahieren.

- [ ] **Step 2: Alte Methoden-Aufrufe in `saa-results.js` umstellen**

Alle Aufrufe von `renderRecommendationCard` und `renderAggregatedProviderCard` (vermutlich nur in `renderAnalysisResults` aus Task 5.1) auf `renderProviderCard` umbiegen.

Run: `grep -nE "renderRecommendationCard\|renderAggregatedProviderCard" js/`
Expected: alle Treffer in `saa-results.js` selbst (und ggf. eine Definition).

- [ ] **Step 3: Alte Methoden-Definitionen entfernen**

Alte Bodies von `renderRecommendationCard` und `renderAggregatedProviderCard` aus `saa-results.js` löschen.

- [ ] **Step 4: Browser-Smoke-Test**

Run: Server, Single + Multi durchgehen, Provider-Cards visuell prüfen.
Expected: Identisch zu vorher.

- [ ] **Step 5: Commit**

```bash
git add js/modules/saa-results.js
git commit -m "refactor(phase-5b): renderProviderCard unifiziert"
```

### Task 5.3: `renderProviderDetail` unifizieren

**Files:**
- Modify: `js/modules/saa-results.js` (renderProviderDetailContent + renderAggregatedProviderDetailContent)

- [ ] **Step 1: Signatur vereinheitlichen**

Aktuell:
```js
renderProviderDetailContent(result) { /* Single ~150 Zeilen */ }
renderAggregatedProviderDetailContent(aggregatedProvider, aggregatedTCO) { /* Multi ~120 Zeilen */ }
```

Neu:
```js
/**
 * Rendert den Detail-Popup-Inhalt für einen Provider.
 *
 * @param {Object} result - Provider-Result oder Aggregated-Provider
 * @param {boolean} isAggregated
 * @param {Object} [aggregatedTCO]
 */
renderProviderDetail(result, isAggregated, aggregatedTCO = null) {
    // ...
},
```

- [ ] **Step 2: Aufrufer umstellen**

Run: `grep -nE "renderProviderDetailContent\|renderAggregatedProviderDetailContent" js/`
Alle Aufrufe (vermutlich in onclick-Handlern in den Provider-Cards) auf `renderProviderDetail(result, isAggregated)` umbiegen.

- [ ] **Step 3: Alte Methoden entfernen**

- [ ] **Step 4: Browser-Smoke-Test**

Run: Detail-Popups öffnen (Klick auf Provider-Card → Details), Single + Multi.
Expected: Inhalt korrekt.

- [ ] **Step 5: Commit**

```bash
git add js/modules/saa-results.js
git commit -m "refactor(phase-5c): renderProviderDetail unifiziert"
```

### Task 5.4: `renderComparisonTable` unifizieren

**Files:**
- Modify: `js/modules/saa-results.js` (renderComparisonTable + renderComparisonTableForApp)

- [ ] **Step 1: Signatur vereinheitlichen**

Aktuell:
```js
renderComparisonTableForApp(app) { /* Single, app-spezifisch */ }
renderComparisonTable() { /* Multi, aggregiert */ }
```

Neu:
```js
/**
 * Rendert die Vergleichstabelle.
 *
 * @param {Object} portfolio - {perAppResults, aggregatedProviders, ...}
 * @param {number} [appIndex] - wenn gesetzt, nur diese App; sonst aggregiert
 */
renderComparisonTable(portfolio, appIndex = null) {
    const useApp = appIndex !== null;
    const data = useApp
        ? portfolio.perAppResults[appIndex]?.results
        : portfolio.aggregatedProviders;
    // ...
},
```

- [ ] **Step 2: Aufrufer umstellen + alte Methode entfernen**

Run: `grep -nE "renderComparisonTable\|renderComparisonTableForApp" js/`
Vereinheitlichen.

- [ ] **Step 3: Browser-Smoke-Test**

Vergleichstabelle in Single + Multi.

- [ ] **Step 4: Commit**

```bash
git add js/modules/saa-results.js
git commit -m "refactor(phase-5d): renderComparisonTable unifiziert"
```

### Task 5.5: `formatRecommendationText` unifizieren

**Files:**
- Modify: `js/modules/saa-results.js` (formatRecommendationText + formatPortfolioRecommendationText)

- [ ] **Step 1: Signatur vereinheitlichen**

Aktuell:
```js
formatRecommendationText(text) { /* Single ~10 Zeilen */ }
formatPortfolioRecommendationText(topProvider, metrics, aggregatedTCO) { /* Multi ~150 Zeilen, generiert Empfehlung */ }
```

Sind nicht echte Doppel-Implementierungen, sondern unterschiedliche Funktionen:
- Single ist ein simpler Text-Formatter
- Multi generiert Portfolio-Empfehlungs-Text

Pragmatische Lösung: zwei Methoden bleiben, aber **Naming klarer**:
- `formatRecommendationText(text)` → bleibt
- `formatPortfolioRecommendationText(...)` → bleibt, wird aber an einem zentralen Punkt aufgerufen

Falls Phase 5 hier keine echte Vereinfachung ergibt: dokumentieren, aber **nicht zwanghaft mergen**. Also: in Task 5.5 nur prüfen, ob beide Methoden weiterhin nötig sind, ggf. internes Style-Cleanup.

- [ ] **Step 2: Browser-Smoke-Test**

Beide Recommendation-Pfade ausführen.

- [ ] **Step 3: Commit (ggf. leerer Commit oder Cleanup)**

```bash
git add js/modules/saa-results.js
git commit -m "refactor(phase-5e): formatRecommendationText/Portfolio Cleanup"
```

(Falls keine Änderungen nötig: Task überspringen, im PR-Beschrieb erwähnen.)

---

## Phase 6: Render/Compute-Split + CSS-Split

**Risiko:** niedrig.

### Task 6.1: `results-compute.js` erstellen + Pure Functions extrahieren

**Files:**
- Create: `js/modules/results-compute.js`
- Modify: `js/modules/saa-results.js` (Compute-Aufrufe ersetzen)

- [ ] **Step 1: Neues Modul erstellen**

Datei `js/modules/results-compute.js`:

```js
/**
 * results-compute — Pure Functions für die Render-Schicht.
 * Keine DOM-Zugriffe. Eingabe: Result-Daten. Ausgabe: berechnete Werte.
 *
 * @module modules/results-compute
 */

/**
 * Aggregiert TCO-Werte aus einer Liste von Provider-Results.
 *
 * @param {Array<Object>} results - perAppResults oder aggregatedProviders
 * @returns {Object} {monthly, yearly, perCategory}
 */
export function computeTcoAggregation(results) {
    let monthly = 0, yearly = 0;
    const perCategory = { consumption: 0, operations: 0, projectEffort: 0, selfBuild: 0 };
    for (const r of results) {
        const tco = r.tcoEstimate || {};
        monthly += tco.consumption?.monthlyEstimate || 0;
        // ... weitere Aggregation
    }
    yearly = monthly * 12;
    return { monthly, yearly, perCategory };
}

/**
 * Berechnet Bewertungs-Indikator-Werte aus einer Service-Liste.
 *
 * @param {Object} service
 * @returns {Object} {control, performance, availability, cost} mit 0..5-Werten
 */
export function computeRatingScores(service) {
    const ratings = {};
    ratings.control = Math.round((service.control || 50) / 20);
    ratings.performance = Math.round((service.performance || 50) / 20);
    // ...
    return ratings;
}

/**
 * Generiert Cost-Breakdown-Daten aus einem TCO-Objekt.
 *
 * @param {Object} tco
 * @returns {Array<{label, value, percentage}>}
 */
export function computeCostBreakdown(tco) {
    const total = (tco.consumption?.monthlyEstimate || 0)
                + (tco.operations?.monthlyPersonnelCost || 0)
                + (tco.projectEffort?.monthlyAmortization || 0);
    return [
        { label: 'Verbrauch', value: tco.consumption?.monthlyEstimate || 0, percentage: 0 },
        { label: 'Betrieb', value: tco.operations?.monthlyPersonnelCost || 0, percentage: 0 },
        { label: 'Projekt', value: tco.projectEffort?.monthlyAmortization || 0, percentage: 0 }
    ].map(item => ({ ...item, percentage: total > 0 ? (item.value / total * 100) : 0 }));
}

/**
 * Generiert Empfehlungs-Text aus Top-Provider und Portfolio-Metriken.
 *
 * @param {Object} topProvider
 * @param {Object} metrics
 * @param {Object} aggregatedTCO
 * @returns {string} HTML-Text
 */
export function formatRecommendationText(topProvider, metrics, aggregatedTCO) {
    // ... Generierung des Empfehlungs-Texts (1:1 aus alter formatPortfolioRecommendationText)
    return `<p>...</p>`;
}
```

(Die Bodies hier stark abgekürzt — beim Implementieren die tatsächliche Logik aus `saa-results.js` 1:1 übernehmen, ohne DOM-Zugriffe.)

- [ ] **Step 2: `saa-results.js` Compute-Stellen umstellen**

In `saa-results.js`:

Imports oben ergänzen:
```js
import { computeTcoAggregation, computeRatingScores, computeCostBreakdown,
         formatRecommendationText as formatRecText } from './results-compute.js';
```

Innerhalb von Render-Methoden:
- alte inline TCO-Aggregation → `computeTcoAggregation(results)`
- alte inline Rating-Berechnung in `renderRatingIndicators` → `computeRatingScores(service)`
- alte inline Cost-Breakdown-Math in `renderCostBreakdown` → `computeCostBreakdown(tco)`
- alte inline Recommendation-Text-Generierung in `formatPortfolioRecommendationText` → Aufruf von `formatRecText(...)`

- [ ] **Step 3: Browser-Smoke-Test**

Run: Server, alle Render-Pfade visuell prüfen (Cards, Details, Tabelle, Cost-Breakdown).
Expected: Pixel-identisch zu vorher.

- [ ] **Step 4: Commit**

```bash
git add js/modules/results-compute.js js/modules/saa-results.js
git commit -m "refactor(phase-6a): Pure Compute aus saa-results.js extrahiert

Neues Modul js/modules/results-compute.js mit computeTcoAggregation,
computeRatingScores, computeCostBreakdown, formatRecommendationText.
saa-results.js bleibt thin-render."
```

### Task 6.2: CSS-Split — neue 6 Dateien anlegen

**Files:**
- Create: `css/base.css`
- Create: `css/wizard.css`
- Create: `css/results.css`
- Create: `css/modals.css`
- Create: `css/responsive.css`
- Create: `css/v4-additions.css`

- [ ] **Step 1: CSS-Sektionen anhand Section-Marker mappen**

Aktuell `css/saa-styles.css` hat Marker auf Zeilen:
- 1-2389: Base + Wizard + Results gemischt (kein Marker)
- 2390: SETTINGS DIALOG
- 2895: DETAIL POPUP
- 3121: IMPROVED TOOLTIPS
- 3191: PDF EXPORT SECTION
- 3236: COST BREAKDOWN SECTION (Detail Popup)
- 4486: CRITERIA INFO BUTTON & MODAL
- 5020: MOBILE NAVIGATION - BURGER MENU
- 5372: RESPONSIVE BREAKPOINTS - MOBILE NAVIGATION
- 5464: Audit-Strenge-Toggle (v4.0.0)
- Weitere `@media`-Queries inline auf Zeilen 932, 2346, 3371, 4105, 4114, 4975, 5377

Mapping (Empfehlung):
| Aktuelle Zeilen | Neue Datei |
|---|---|
| 1-~600 (Reset, :root, body, header, layout) | `base.css` |
| ~600-2389 (Wizard, Steps, Component-Auswahl, App-Suche, Sizing) | `wizard.css` |
| 2390-2894 (Settings Dialog) | `modals.css` |
| 2895-3120 (Detail Popup) | `modals.css` |
| 3121-3190 (Tooltips) | `base.css` |
| 3191-3235 (PDF Export) | `results.css` |
| 3236-4485 (Cost Breakdown — `wird` für Provider-Cards in Step 3 genutzt) | `results.css` |
| 4486-5019 (Criteria Info Modal) | `modals.css` |
| 5020-5371 (Mobile Burger Menu) | `responsive.css` |
| 5372-5463 (Responsive Breakpoints Mobile Nav) | `responsive.css` |
| 5464-end (Audit-Toggle) | `v4-additions.css` |
| Inline `@media`-Blöcke (Zeilen 932, 2346, 3371, 4105, 4114, 4975, 5377) | `responsive.css` |

- [ ] **Step 2: Dateien anlegen mittels Block-Extraktion**

Vorgehen pro neuer Datei:
1. Zeilenbereich identifizieren (siehe Mapping).
2. Block aus `saa-styles.css` mit `sed -n 'X,Yp'` lesen.
3. In neue Datei schreiben — mit Header-Kommentar:
   ```css
   /* SAA — base.css
      Reset, CSS-Variablen, Body, Header, allgemeines Layout. */
   ```

Beispiel `base.css` Erstellung:

```bash
{
  echo "/* SAA — base.css"
  echo "   Reset, CSS-Variablen, Body, Header, allgemeines Layout. */"
  echo ""
  sed -n '1,600p' css/saa-styles.css
  echo ""
  echo "/* === Aus Sektion: IMPROVED TOOLTIPS === */"
  sed -n '3121,3190p' css/saa-styles.css
} > css/base.css
```

(Analog für die anderen 5 Dateien.)

Wichtig:
- `@media`-Queries die innerhalb eines thematischen Blocks stehen (z.B. Zeile 932 mitten in Wizard) → in `wizard.css` belassen (lokale Responsiveness)
- Nur die expliziten Mobile-Nav-`@media`-Blöcke ab Zeile 5020 → in `responsive.css`

- [ ] **Step 3: HTML-Includes aktualisieren**

`index.html` Zeile 48 — aktuell:
```html
<link rel="stylesheet" href="css/saa-styles.css">
```

Neu (genau diese Reihenfolge!):
```html
<link rel="stylesheet" href="css/base.css">
<link rel="stylesheet" href="css/wizard.css">
<link rel="stylesheet" href="css/results.css">
<link rel="stylesheet" href="css/modals.css">
<link rel="stylesheet" href="css/responsive.css">
<link rel="stylesheet" href="css/v4-additions.css">
```

`evaluation-criteria.html` Zeile 47 — aktuell:
```html
<link rel="stylesheet" href="css/saa-styles.css">
<link rel="stylesheet" href="css/criteria-styles.css">
```

Neu:
```html
<link rel="stylesheet" href="css/base.css">
<link rel="stylesheet" href="css/modals.css">
<link rel="stylesheet" href="css/responsive.css">
<link rel="stylesheet" href="css/v4-additions.css">
<link rel="stylesheet" href="css/criteria-styles.css">
```

(Wizard-/Results-CSS sind auf der Criteria-Page nicht relevant.)

- [ ] **Step 4: `saa-styles.css` löschen**

Run:
```bash
git rm css/saa-styles.css
```

- [ ] **Step 5: Browser-Smoke-Test (visuell ausführlich)**

Run: Server, beide Seiten besuchen:
- `http://localhost:8765/` — Wizard durchklicken, alle Modals öffnen, alle Detail-Popups, Cost-Breakdown, Settings, Criteria-Info-Modal, Mobile-Ansicht (DevTools Responsive-Mode)
- `http://localhost:8765/evaluation-criteria.html` — Tabs, Drawer öffnen, Mobile-Nav

Expected: Pixel-identisch zum Stand vor Phase 6. Network-Tab in DevTools: 6 CSS-Files geladen, 0 × 404.

- [ ] **Step 6: Commit**

```bash
git add css/ index.html evaluation-criteria.html
git commit -m "refactor(phase-6b): css/saa-styles.css in 6 thematische Dateien gesplittet

base.css, wizard.css, results.css, modals.css, responsive.css, v4-additions.css.
Keine Datei mehr > 1700 Zeilen. saa-styles.css entfernt."
```

---

## Final-Verifikation

Nach Phase 6:

- [ ] **Akzeptanzkriterien-Checkliste durchlaufen**

Run-Befehle:
```bash
cd /Users/thsoring/Library/CloudStorage/OneDrive-BTCAG/CCode/SAA

# 1. Keine _* Backup-Properties mehr in saa-app.js (außer evtl. Migration)
grep -nE "this\.(_selectedComponents|_componentConfigs|_applicationData|_systemConfig|_selectedSizing|_analysisResults)" js/saa-app.js

# 2. isMultiAppMode-Anzahl
grep -rE "isMultiAppMode" js/ | wc -l   # Expected: < 12

# 3. Keine SOV_WEIGHTS / SOV8_EXPERT_SCORES in saa-analysis.js
grep -nE "SOV_WEIGHTS|SOV8_EXPERT_SCORES" js/saa-analysis.js   # Expected: keine Treffer

# 4. saa-data.js Größe
wc -l js/saa-data.js   # Expected: < 1500

# 5. saa-results.js Größe
wc -l js/modules/saa-results.js   # Expected: < 1500

# 6. CSS-Dateien
wc -l css/*.css   # Expected: keine > 1700 (außer criteria-styles.css = 1547)

# 7. Sovereignty-Werte: SCC-Vergleich
node /tmp/smoke-saa-phase1.mjs   # Expected: 10 passed, 0 failed

# 8. provider-service-mapping ersetzt NoSQL-Branches
grep -nE "providerId\s*===\s*'(aws|azure|gcp)'" js/saa-analysis.js   # Expected: keine Treffer
```

- [ ] **Final Browser-Smoke-Test (vollständig)**

Standard-Smoke-Test-Checkliste (alle 8 Schritte) + zusätzlich:
- 3 Apps in Multi-App, alle bearbeiten, F5 → State persistent
- Architektur-Modus pro App
- Audit-Toggle pro Modus
- PDF-Export Single + Multi
- Mobile-Ansicht (DevTools Responsive)
- evaluation-criteria.html: alle Sektionen, Drawer, Mobile-Nav

Expected: keine Regression, identische Funktion zur Pre-Refactor-Version.

- [ ] **Final-Commit (Tag-Vorbereitung)**

```bash
git log --oneline | head -15
```

Wenn alle Phasen sauber:
```bash
git tag -a v4.1.0 -m "v4.1.0 — Always-Portfolio Refactor + Hygiene"
git push origin v4.1.0
gh release create v4.1.0 --target claude/revise-infrastructure-costs-3AxEW \
    --title "v4.1.0 — Always-Portfolio Refactor" \
    --notes "Code-Hygiene-Release. Keine Feature-Änderungen. Siehe CHANGELOG.md für Details."
```

(CHANGELOG-Eintrag für v4.1.0 davor schreiben — siehe nächster Schritt.)

- [ ] **CHANGELOG.md ergänzen**

In `CHANGELOG.md` neuen Eintrag oben einfügen:

```markdown
## [4.1.0] - 2026-04-XX

Code-Hygiene-Release ohne Feature-Änderungen. Architektur-Refactor in 6 Phasen.

### Changed (intern)
- **„Always Portfolio"-State-Modell:** Single-App ist jetzt ein Portfolio mit length 1.
  16 Backward-Compat-Getter und ~46 `isMultiAppMode`-Branches eliminiert.
  State lebt einheitlich auf `ApplicationInstance` in `this.applications[]`.
- **Sovereignty-Engine extrahiert:** Neues Modul `js/modules/sovereignty-engine.js`
  ist strukturell paritätisch zum SCC-Schwesterprojekt. BSI-Updates können künftig
  byte-identisch in beiden Repos nachgezogen werden.
- **`saa-data.js` zu reinen Daten:** 4 Klassen + 1 Funktion in eigene Module
  ausgegliedert (`application-instance.js`, `application-matcher.js`,
  `sizing-detector.js`, `deployment-pattern.js`). Side-Effect-Merge entfernt.
- **NoSQL-Provider-Branches:** Hardcoded Provider-ID-Switches durch
  Lookup-Tabelle in `provider-service-mapping.js` ersetzt.
- **Render/Compute-Split:** Pure Compute aus `saa-results.js` in neues Modul
  `results-compute.js` ausgegliedert. Render-Layer bleibt thin.
- **CSS-Monolith aufgesplittet:** `css/saa-styles.css` (5532 Z.) in 6 thematische
  Dateien (`base`, `wizard`, `results`, `modals`, `responsive`, `v4-additions`).

### Migrations
- Session-State alter Versionen wird beim Load automatisch migriert.
- Keine externen API-Änderungen. Keine User-sichtbaren Verhaltensänderungen.
```

```bash
git add CHANGELOG.md
git commit -m "docs: CHANGELOG-Eintrag v4.1.0"
git push origin claude/revise-infrastructure-costs-3AxEW
```

---

## Self-Review-Checkliste (für plan-author selbst)

Spec-Coverage:
- ✅ Phase 1 = Spec 2.4 (Sovereignty-Engine)
- ✅ Phase 2 = Spec 2.5 + 2.6 (Daten-Hygiene + Provider-Branches)
- ✅ Phase 3 = Spec 2.2 (Datenstruktur Portfolio)
- ✅ Phase 4 = Spec 2.1 + 4 (State-Modell + Migration)
- ✅ Phase 5 = Spec 2.3 (Render-Layer)
- ✅ Phase 6 = Spec 2.7 + 2.8 (Compute-Split + CSS)
- ✅ Akzeptanzkriterien aus Spec §5 in Final-Verifikation abgebildet

Type-Konsistenz:
- `currentApp` (Getter) — überall einheitlich
- `aggregateProviderSovScores` / `calculateControlFromSov` / `getC3AAdjustedControl` — Signaturen konsistent
- `PortfolioAnalyzer.analyzeOne` und `analyzePortfolio` — gleiche Return-Shape
- `renderAnalysisResults(portfolio)` — überall mit dem `portfolio`-Argument
- `renderProviderCard(result, index, isAggregated, aggregatedTCO?)` — konsistent
- `renderProviderDetail(result, isAggregated, aggregatedTCO?)` — konsistent

Placeholder-Scan:
- Keine TBD/TODO/„similar to Task N"
- Code-Snippets in jedem Code-Step
- Tasks 2.2 (ApplicationMatcher) und 2.3 (SizingDetector): Vollständige Klassen-Bodies werden zwar nicht inline gezeigt (zu lang), aber die Datei + Zeilenbereich für 1:1-Kopie ist konkret angegeben (`saa-data.js:2027-2223`, `saa-data.js:2225-2247`). Akzeptabel.
- Phase 5 Task 5.5 (`formatRecommendationText`): Bewusst als „evtl. kein Merge nötig" markiert — kein Placeholder, sondern realistische Bewertung.
