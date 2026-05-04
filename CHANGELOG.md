# Changelog

All notable changes to the Strategic Application Analysis (SAA) Tool will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [4.1.2] - 2026-05-04

Test-Coverage massiv erweitert. Keine Code-Änderungen am Production-Code (außer einem zusätzlichen Named Export für Testbarkeit).

### Added

- **Test-Suite ausgebaut:** 11 neue Test-Suiten unter `tests/`, gesamt nun **779 Tests** in 15 Suiten:
  - `smoke-application-instance.mjs` (56 Tests) — Constructor, fromCurrentState, Architecture-API, Privacy-Encapsulation
  - `smoke-multi-app-parser.mjs` (60 Tests) — alle Pure-Parser-Funktionen
  - `smoke-application-matcher.mjs` (27 Tests) — Fuzzy-Match, Search-Index, Normalize, Similarity
  - `smoke-sizing-detector.mjs` (23 Tests) — Keyword-basierte Sizing-Erkennung
  - `smoke-deployment-pattern.mjs` (26 Tests) — Pattern-Erkennung mit verschiedenen Komponenten-Kombinationen
  - `smoke-cloud-analyzer.mjs` (97 Tests) — `analyzeForComponents`, `calculateProviderScore`, `calculateTCO`, `_estimate*`-Methoden
  - `smoke-portfolio-analyzer.mjs` (39 Tests) — `analyzePortfolio`, `analyzeOne`, Aggregation, Portfolio-Metriken
  - `smoke-session-migration.mjs` (30 Tests) — Legacy-State-Migration, Idempotenz, Edge-Cases
  - `smoke-results-compute.mjs` (45 Tests) — Pure Compute Functions
  - `smoke-audit-mode.mjs` (12 Tests) — `getAuditMode`, `setAuditMode`, Persistenz
  - `smoke-saa-data.mjs` (160 Tests) — Daten-Integrität: 10 Provider × 22 Service-Categories, Komponenten-Liste, etc.
  - `smoke-c3a-sov7.mjs` (151 Tests) — C3A-Framework + SOV-7-Compliance direkt
- GitHub Actions CI führt alle 779 Tests bei jedem Push aus.

### Changed

- `js/modules/saa-state.js`: `migrateLegacySessionState` zusätzlich als Named Export rausgegeben (für direkte Testbarkeit). Funktion bleibt nutzbar wie bisher.

### Coverage qualitativ

| Bereich | Coverage |
|---|---|
| Sovereignty-Pipeline (C3A, SOV-7, EU-CSF) | ✅ vollständig (Werte gegen SCC) |
| Analysis-Engine (CloudAnalyzer, PortfolioAnalyzer) | ✅ Hauptpfade + private Estimator-Helper |
| Application-Lifecycle (Matcher, Sizing, Pattern) | ✅ Hauptpfade |
| Architektur-Modus-API | ✅ inkl. Privacy-Test (`#archOriginal` von außen unzugreifbar) |
| Session-State-Migration | ✅ Legacy-Pfade + Idempotenz |
| Pure Compute (TCO, Recommendation-Text) | ✅ |
| Daten-Integrität (Provider-Liste, Komponenten) | ✅ 160 Strukturchecks |
| DOM-Rendering | ❌ ohne Browser nicht testbar (vanilla, kein jsdom) |
| PDF-Export | ❌ ohne Browser nicht testbar |
| Event-Handler / UI-Lifecycle | ❌ ohne Browser nicht testbar |

### Notes

- Alle Tests pass nach erstem Lauf — **keine echten Bugs gefunden**. Wenige Erwartungen mussten an die echte API angepasst werden (z.B. `formatRecommendationText` nutzt `<span class="summary-highlight">` statt `<strong>`, `computeRatingColors` hat 2 Dimensionen statt 4, `setAuditMode('invalid')` macht state-abhängiges Fallback).

## [4.1.1] - 2026-05-04

Follow-up-Release zu v4.1.0. Weitere Datei-Splits, Test-Infrastruktur, strikte Encapsulation.

### Changed (intern)

- **`saa-multiapp.js` schlanker:** 11 Pure-Parser-Funktionen (`parseApplicationList`, `parseStorageSize`, `parseDBSize`, `extractHAConfig`, `formatVMTypeName`, `levenshteinDistance`, `calculateSimilarity` etc.) in eigenes Modul `js/modules/multi-app-parser.js` ausgegliedert. saa-multiapp.js: 2061 → 1712 Zeilen.
- **`css/results.css` thematisch geteilt:** Multi-App-Block (App-Tabs, Aggregated-Cards, Portfolio-View) in eigene `css/multi-app.css`. results.css: 2415 → 1316 Zeilen, multi-app.css: 1106 Zeilen. Akzeptanzkriterium „keine CSS-Datei > 1700 Zeilen" jetzt erfüllt.
- **`saa-results.js` thematisch in 3 Files:** Top-Level/Cards bleibt in `saa-results.js` (890), Detail-Popup in `saa-results-detail.js` (499), Vergleichstabelle/Cost-Breakdown in `saa-results-comparison.js` (754). Composition via Object-Spread im SAAResults-Re-Export — `saa-app.js` bindet weiter nur **ein** Mixin ein. Akzeptanzkriterium „saa-results.js < 1500 Zeilen" jetzt erfüllt.
- **Architektur-Modus strikt encapsuliert:** `_archOriginal` und `_archDelta` sind nun **private Felder** (`#archOriginal`, `#archDelta`) auf `ApplicationInstance`. Saubere Methoden-API: `snapshotArchitecture()`, `resetArchitecture()`, `applyArchitectureDelta(transform)`, `recordArchitectureChange(componentId, action, config?)`, `hasArchitectureSnapshot()`, `getArchitectureSnapshot()`. 33 direkte externe Zugriffe entfernt, von außen sprachlich nicht mehr möglich. Diese Stelle hatte in v3.0.0 die meisten Bugs (Multi-App-Architektur-Transformation) — jetzt ist sie eingezäunt.

### Added

- **Smoke-Test-Suite:** Erste Test-Infrastruktur unter `tests/`. **Kein Test-Framework**, pure Node-Skripte, läuft ohne `npm install`. Drei Suites:
  - `smoke-sovereignty.mjs` — 10 Provider × 2 Audit-Modes gegen SCC v4.0.0-Erwartungswerte (entdeckt Sync-Drift)
  - `smoke-modules.mjs` — 13 ES-Module laden + Export-Listen verifizieren (39 Exports)
  - `smoke-pure-functions.mjs` — 30 Input/Output-Tests für extrahierte Helper inkl. der neuen Architecture-Mode-API
- **GitHub Actions CI:** `.github/workflows/smoke-tests.yml` führt `tests/run-all.mjs` bei jedem Push/PR aus.

### Größenvergleich (post-v4.1.0)

| Datei | v4.1.0 | v4.1.1 | Δ |
|---|---:|---:|---:|
| `js/modules/saa-multiapp.js` | 2061 | 1712 | −349 |
| `js/modules/saa-results.js` | 2110 | 890 | −1220 |
| `css/results.css` | 2415 | 1316 | −1099 |
| `css/saa-styles.css` (Monolith aus v4.0.0) | 5532 | 0 (in 7 Dateien) | −5532 |

Neue Module: `multi-app-parser.js`, `saa-results-detail.js`, `saa-results-comparison.js`. Neue CSS: `multi-app.css`. Neue Tests: 3 Suites unter `tests/`.

### Notes

- Architektur-Modus-Migration läuft transparent: alte Saves mit `_archOriginal`/`_archDelta` werden in der `fromCurrentState`-Methode in die neuen privaten Felder überführt.
- Keine User-sichtbaren Verhaltensänderungen.

## [4.1.0] - 2026-05-04

Code-Hygiene-Release ohne Feature-Änderungen. Architektur-Refactor in 6 Phasen, jede einzeln smoke-testbar gepusht.

### Changed (intern, nicht user-sichtbar)

- **„Always Portfolio"-State-Modell:** Single-App ist nun ein Portfolio mit `length 1`. Die 16 Backward-Compat-Getter/Setter in `saa-app.js` (130 Zeilen Proxy-Ceremony) sind eliminiert. State lebt einheitlich auf `ApplicationInstance` in `this.applications[]`, zugegriffen über den neuen `currentApp`-Getter. Verbleibende `isMultiAppMode`-Stellen (38 → 30) sind ausschließlich UI-Sichtbarkeit oder Modus-Persistenz, kein State-Routing mehr.
- **Sovereignty-Engine extrahiert:** Neues Modul `js/modules/sovereignty-engine.js` ist strukturell paritätisch zum SCC-Schwesterprojekt (`js/data/sov-framework.js`). BSI-Updates können künftig in beiden Repos byte-identisch nachgezogen werden. Alle 10 Provider × 2 Audit-Modes liefern 1:1 die SCC-v4.0.0-Werte.
- **`saa-data.js` zu reinen Daten:** 4 Klassen + 1 Funktion in eigene Module ausgegliedert (`application-instance.js`, `application-matcher.js`, `sizing-detector.js`, `deployment-pattern.js`). Side-Effect-Merge `PROVIDER_C3A_DATA.forEach` entfernt — Daten werden nun lazy in der Sovereignty-Engine ergänzt.
- **NoSQL-Provider-Branches datengetrieben:** Hardcoded `providerId === 'aws|azure|gcp'`-Switches in `_estimateDatabaseNoSQL` durch Lookup-Tabelle in `js/modules/provider-service-mapping.js` ersetzt.
- **Render-Layer kollabiert:** 5 Pärchen `render*` ↔ `renderAggregated*` zu 5 unifizierten Methoden zusammengeführt (`renderAnalysisResults(portfolio)`, `renderProviderCard`, `renderProviderDetail`, `renderComparisonTable`, plus Doc-Cleanup für `formatRecommendationText`). 6 Methoden entfernt.
- **`PortfolioAnalyzer`** statt `MultiAppAnalyzer`: Single-App nutzt nun `analyzeOne()` und liefert dieselbe Portfolio-shaped Datenstruktur wie Multi-App. Renderer hat einen einzigen Entry-Pfad.
- **Render/Compute-Split:** Pure Compute-Funktionen aus `saa-results.js` in neues Modul `js/modules/results-compute.js` ausgegliedert (`computeTcoConsumptionBreakdown`, `computeAppMonthlyTCO`, `computeRatingColors`, `formatRecommendationText`, `formatPortfolioRecommendationText`).
- **CSS-Monolith aufgesplittet:** `css/saa-styles.css` (5532 Zeilen) in 6 thematische Dateien (`base.css`, `wizard.css`, `results.css`, `modals.css`, `responsive.css`, `v4-additions.css`). `index.html` lädt alle 6, `evaluation-criteria.html` nur die 4 relevanten.

### Migration

- **Session-State-Migration** automatisch beim Load: alte Saves mit `selectedComponents`, `componentConfigs` etc. am State-Top-Level werden in `applications[0]` migriert, nutzt `ApplicationInstance.fromCurrentState()`.
- Keine externen API-Änderungen, keine User-sichtbaren Verhaltensänderungen.

### Größenvergleich

| Datei | Vorher | Nachher | Δ |
|---|---:|---:|---:|
| `js/saa-app.js` | 1407 | 1334 | −73 |
| `js/saa-data.js` | 2248 | 1949 | −299 |
| `js/modules/saa-results.js` | 2285 | 2110 | −175 |
| `js/modules/saa-state.js` | 223 | 201 | −22 |
| `css/saa-styles.css` (Monolith) | 5532 | 0 (split) | −5532 |

7 neue Module: `sovereignty-engine.js`, `application-instance.js`, `application-matcher.js`, `sizing-detector.js`, `deployment-pattern.js`, `provider-service-mapping.js`, `results-compute.js`.

## [4.0.0] - 2026-04-27

Diese Major-Release stellt die Souveränitäts-Bewertung des SAA auf eine vollständig
**auditierbare** Basis nach BSI C3A v1.0 (27.04.2026) um — analog zur SCC v4.0.0.

### Added
- **BSI C3A v1.0 Integration:** ~30 prüfbare Kriterien aus SOV-1 bis SOV-6, mit C1/C2-Varianten (EU vs. Deutschland) und Additional Criteria. Kriterien-Katalog 1:1 aus dem SCC-Schwesterprojekt übernommen (`js/modules/c3a-framework.js`).
- **SOV-7 Compliance-Katalog:** 10 prüfbare Sicherheits-/Compliance-Kriterien (ISO 27001, BSI C5/IT-Grundschutz, ISO 27017/27018/27701, SOC 2 Type 2, KRITIS, NIS2, EU-/DE-SOC) — schließt die SOV-7-Lücke des BSI-Mandats (`js/modules/sov7-compliance.js`).
- **Audit-Strenge-Toggle (C1 / C2)** im Header: Wechsel zwischen EU- und deutschem Bezug mit `localStorage`-Persistenz. Im DE-Modus werden Kriterien mit nur EU-Variante BSI-konform auf 50 Punkte reduziert (`js/modules/audit-mode.js`).
- **SAP Cloud Infrastructure (SAP CI)** als 10. Cloud-Provider hinzugefügt (Walldorf/St. Leon-Rot, OpenStack-basiert, ISO 27001 auf IT-Grundschutz April 2026, KRITIS-fähig). Vollständige Bewertung aller 22 Service-Kategorien.
- **Pro-Provider C3A/SOV-7-Bewertungen mit Quellenbelegen:** Pro Provider ~30 C3A-Bewertungen + 10 SOV-7-Bewertungen + URL-Quellen, übernommen aus SCC v4.0.0 (`js/data/provider-c3a-data.js`).
- **Neue Sektionen in `evaluation-criteria.html`:** „BSI C3A v1.0 — Operationalisierung der Souveränität" (1.1) und „SOV-7 Sicherheits-Compliance" (1.2), beide in Drawer- und Desktop-Navigation eingebunden.

### Changed (BREAKING — methodisch)
- **Kontrolle-Score auditierbar nach EU-CSF berechnet:** Die `getC3AAdjustedControl()`-Funktion in `js/saa-analysis.js` ersetzt den statischen `provider.control`-Integer durch den **EU-CSF-gewichteten Mittelwert über SOV-1...8** — identische Formel wie SCC v4.0.0. SOV-1...6 stammen aus der C3A-Aggregation (mode-abhängig, C1/C2), SOV-7 aus dem SOV-7-Compliance-Katalog (ISO 27001, BSI C5, KRITIS, ...), SOV-8 aus dem Experten-Score (BSI-Mandat deckt SOV-8 nicht ab). Gewichtung gemäß EU CSF: 15/10/10/15/20/15/10/5. Custom-Scores aus Settings überschreiben weiterhin alle anderen Werte.
- **Werte verschieben sich** (Kontrolle-Score, exakt wie im SCC v4.0.0):
  - IONOS Cloud: 65 → **87 (C1) / 83 (C2)** — BSI-IT-Grundschutz wird jetzt voll bewertet
  - T Cloud Public: 55 → **74 (C1) / 69 (C2)** — BSI C5 + DE-Bezug konsequent gewichtet
  - AWS / Azure / GCP: 42-44 → **36 / 37 / 36** — US-Konzern-Risiken klarer abgebildet (mode-unabhängig)
  - DELOS Cloud: 85 → **76** — Treuhänder-Modell, aber MS-Software bleibt restriktiv (mode-unabhängig)
  - AWS European Sovereign Cloud: → **77 (C1) / 68 (C2)**
  - OpenStack Private Cloud: → **87 (C1) / 74 (C2)**
  - SAP Cloud Infrastructure (NEU): **81 (C1) / 77 (C2)**

### Notes
- Service-Level-Bewertungen (22 Services je Provider) bleiben unverändert; nur der Provider-Level-Aggregat-Wert wird C3A-basiert.
- Der Audit-Mode-Wechsel löst bei aktiver Analyse (Step 3) einen automatischen Re-Render aus.
- Methodische Begründung: Das BSI hat die Trennung explizit so vorgesehen — *„C3A presupposes that the cloud service provider meets the C5 criteria"* — Sicherheits-/Compliance-Aspekte werden ausdrücklich nicht in C3A geprüft, sondern über C5/IT-Grundschutz. Der neue SOV-7-Katalog schließt diese Lücke.

## [3.1.0] - 2026-03-19

### Changed
- **T Cloud Public** (ehem. Open Telekom Cloud): Umbenennung zum 02.02.2026 in name, fullName, evaluation-criteria.html und README nachgezogen
- **AWS ESC**: Beschreibung auf GA-Status (15.01.2026) und vollständiges Zertifizierungspaket (BSI C5, SOC 2 Type 1, 7 ISO-Normen) aktualisiert
- **Microsoft DELOS Cloud**: Beschreibung um Geo-Redundanz (zweites Ops-Center Leipzig, Frühjahr 2026) ergänzt
- **T Cloud Public**: Beschreibung auf Industrial AI Cloud (Feb 2026, NVIDIA Blackwell) und Feature-Parity-Roadmap aktualisiert

## [3.0.0] - 2026-02-19 - Architektur-Modus Live-Transformation, Moderne Architekturmodelle & intelligente Kostenberechnung

### Added
- **Architektur-Modus** (Cloud-native / Klassisch): Neue Komponenten-Seite mit Live-Transformation der Auswahl beim Modus-Wechsel
- **Snapshot + Delta-System**: Originalzustand wird beim App-Laden gespeichert; manuelle Nutzeränderungen nach einem Modus-Wechsel bleiben als Delta erhalten und werden on top wieder angewendet
- **Reset-Button**: Stellt den Originalzustand vor jeder Transformation wieder her
- **Intelligente komponentenbasierte Architektur-Inferenz**: Erkennt anhand der gewählten Komponenten automatisch den passenden Transformationspfad ohne App-Name-Lookup
  - Cloud-native: `compute` → `PaaS / Serverless` bei Web-/CMS-Apps; Enterprise-Apps (compute + block + file storage ohne managed DB) bleiben konservativ
  - Klassisch: `serverless`/`kubernetes` → `compute` + `loadbalancer`
- **`recommendedArchitecture`** für alle 134 Apps in der Datenbank: Kubernetes/Container-Apps → `cloud_native`, klassische VM-Apps → `classic`; beim App-Laden automatisch vorausgewählt
- **PaaS / Serverless** als neue Compute-Komponente (App Service, Cloud Run, Lambda und ähnliche Plattform-Dienste)
- **Applikationsbetrieb als eigenständige Betriebskosten-Schicht**: Neben den infrastrukturkomponentenbezogenen Betriebskosten (Patching, Monitoring je Service) erscheint jetzt ein separater Eintrag „Applikationsbetrieb (Plattformbetrieb)" im TCO-Betriebsaufwand — für Aufgaben, die unabhängig von der Infrastruktur anfallen: HA-Management, Deployment-Prozesse, Incident Response auf Applikationsebene
  - **Formel**: `FTE = baseFTE(Modus) × Komplexitätsfaktor × Sizing-Faktor`
  - **Modus**: Classic = 0,3 FTE Basis, Cloud-native = 0,1 FTE Basis (Plattform übernimmt Patching/Skalierung/HA)
  - **Komplexität** (komponentenbasiert): low = ×0,6 / medium = ×1,0 / high = ×1,5 (Kubernetes, Block+File Storage, ≥8 Services → high)
  - **Sizing**: Small = ×0,7 / Medium = ×1,0 / Large = ×1,4
  - Vollständig multi-app-fähig: Architektur-Modus und Sizing werden pro App-Instanz separat getrackt
- Intelligente Infrastrukturkostenberechnung mit Unterstützung für Cloud-native/PaaS-Architekturmodelle
- Workload-Typ-Erkennung mit passender Architekturempfehlung
- System-Konfiguration Zusammenfassung in der Ergebnisansicht
- Architektur-Modus-Anzeige mit Transformation-Details in den Analyseergebnissen

### Applikationsbetrieb (Feature-Beschreibung)

Der Betriebsaufwand einer Cloud-Applikation besteht aus zwei grundlegend verschiedenen Schichten:

**Infrastruktur-Betrieb** (bisher bereits abgebildet): Pro gewählter Komponente fällt Aufwand für Konfiguration, Monitoring und Wartung an — ein Managed Kubernetes-Cluster erfordert anderen Aufwand als eine einfache VM.

**Applikations-Betrieb** (neu): Unabhängig davon, welche Infrastruktur-Komponenten gewählt wurden, gibt es Aufgaben, die immer anfallen: HA-Konzept und Failover-Tests, Deployment-Prozesse und Release-Management, Incident Response auf Applikationsebene, Backup-Strategie und Recovery-Tests. Der Umfang dieses Aufwands hängt davon ab, wie viel die Plattform selbst übernimmt.

Bei **klassischer VM-Architektur** trägt das Team die volle Last: Patching, Skalierung, Hochverfügbarkeit — alles manuell. Basis: 0,3 FTE/Jahr für eine mittelkomplexe App mittlerer Größe.

Bei **Cloud-nativer / PaaS-Architektur** übernimmt der Anbieter wesentliche Betriebsaufgaben (Auto-Scaling, Rolling Deploys, Managed HA). Der verbleibende Aufwand ist signifikant geringer. Basis: 0,1 FTE/Jahr — das entspricht ca. einem halben Arbeitstag pro Monat für Plattform-Management und Incident Response.

**Effekt im TCO-Vergleich**: Für eine mittelgroße App (Medium-Sizing, mittlere Komplexität) ergibt sich in Classic-Architektur ca. 0,3 FTE Applikationsbetrieb, in Cloud-native ca. 0,1 FTE — ein Unterschied von ~0,2 FTE bzw. ~1.600 €/Jahr (bei 8.000 €/FTE-Monat). Bei Enterprise-Apps mit hoher Komplexität und Large-Sizing wächst der Unterschied auf ~0,63 FTE (Classic: 0,63 FTE vs. Cloud-native: 0,21 FTE).

### Architektur-Modus (Feature-Beschreibung)

Cloud-Infrastruktur ist nicht gleich Cloud-Infrastruktur: Wer SAP S/4HANA betreibt, denkt in dedizierten VMs, Block Storage und Netzwerkisolation. Wer WordPress hostet, könnte dasselbe auf einem PaaS-Dienst mit einem Bruchteil des Betriebsaufwands erreichen. Der Architektur-Modus macht diesen Unterschied sichtbar und bewertbar.

**Cloud-native**: Der Wizard schlägt vor, rechenintensive Komponenten (`compute`) durch verwaltete Plattform-Dienste zu ersetzen (`PaaS / Serverless` — z.B. App Service, Cloud Run, AWS Lambda). Das reduziert den Betriebsaufwand signifikant, da Patching, Skalierung und Hochverfügbarkeit vom Anbieter übernommen werden. Kubernetes-basierte Apps (z.B. GitLab, Harbor) werden nicht umgebaut — sie sind bereits cloud-native. Enterprise-Apps mit explizitem Block- und File-Storage-Bedarf (z.B. SAP) werden ebenfalls konservativ behandelt, da PaaS hier nicht sinnvoll substituiert.

**Klassisch**: Plattform-Dienste (`serverless`, `kubernetes`) werden auf klassische VMs (`compute`) zurückgeführt. Sinnvoll, wenn volle Kontrolle über die Laufzeitumgebung erforderlich ist oder die Ziel-Cloud keinen ausgereiften PaaS-Stack bietet.

**Transparenz**: Der Modus-Wechsel verändert die sichtbare Komponenten-Auswahl live auf der Konfigurationsseite — der User sieht genau, was analysiert wird. Manuelle Anpassungen bleiben als Delta erhalten und werden nach jedem Modus-Wechsel wieder angewendet. Ein Reset-Button kehrt jederzeit zum ursprünglich geladenen Zustand zurück.

Die Kostenberechnung berücksichtigt den gewählten Modus über einen `operationsFactor`: Cloud-native-Deployments haben typischerweise geringere Betriebskosten (weniger Wartungsaufwand, automatisches Patching), aber ggf. höhere Verbrauchskosten je nach Anbieter-Pricing.

### Technical (Refactoring-Begründung)

Der ursprüngliche `saa-app.js` war mit 8.593 Zeilen ein unkontrollierbarer Monolith: Rendering, State-Persistenz, Analyse-Trigger, PDF-Export und Settings-Logik lagen in einer einzigen Klasse ohne klares Ownership. Jede Änderung war riskant, weil Seiteneffekte auf entfernte Stellen nicht vorhersehbar waren. Die folgende Restrukturierung macht Verantwortlichkeiten explizit und Änderungen isolierbar:

- **ES-Module-Migration**: Alle JS-Dateien nutzen natives `import`/`export`. `index.html` lädt nur noch einen einzigen `<script type="module">` Entry-Point statt 11 manuell sortierter Script-Tags – die Ladereihenfolge ergibt sich jetzt zwingend aus dem Import-Graph, nicht aus menschlicher Sorgfalt
- **Modul-Refactoring `saa-app.js`**: 8593 → 1253 Zeilen (−85 %); Logik nach Single-Responsibility aufgeteilt in `modules/saa-state.js` (Session/Settings), `modules/saa-components.js` (UI), `modules/saa-results.js` (Rendering), `modules/saa-settings.js`, `modules/saa-multiapp.js`, `modules/saa-pdf.js`
- **`modules/saa-utils.js`** neu: `IconMapper` (Emoji→FontAwesome) als shared Utility ausgelagert – war fälschlicherweise im Orchestrator `saa-app.js` definiert, obwohl ausschließlich Rendering-Module ihn nutzen (52 Verwendungen in `saa-results.js` allein)
- **Prototype-Mixin** ersetzt `.call(this)`-Delegation: Statt `SAAResults.renderX.call(this)` pro Methode werden Module via `Object.assign(SovereignArchitectureAdvisor.prototype, SAAResults)` direkt auf den Prototypen gemischt – kein Boilerplate-Forwarding mehr, kein implizites Kontext-Binding
- **`getConsumptionEstimate`** in `saa-analysis.js`: 468-Zeilen-God-Function (11 verschachtelte Switch-Cases mit je eigenem Pricing-Branch) aufgeteilt in Dispatcher (66 Z) + 11 private `_estimateXxx(ctx)`-Methoden – jede Pricing-Logik ist jetzt separat lesbar, testbar und änderbar
- **`detectArchitecturePattern()`** (ehemals `transformServicesForArchitectureMode()`): nur noch Pattern-/Factor-Erkennung; Service-Ersetzung findet ausschließlich auf UI-Ebene statt
- **`_archOriginal` / `_archDelta`** als Getter/Setter-Paar auf Hauptinstanz: proxyen in Multi-App-Modus transparent zur aktuellen `ApplicationInstance`

## [2.0.0] - 2026-02-19 - Cloud Pricing API, Kubernetes-Redesign & UX

### Added
- Cloud Pricing API Integration mit realen Preisen für die Frankfurt-Region
- Neue `js/cloud-pricing.js` als zentrale Preisberechnungs-Engine (Single Source of Truth)
- Sovereign Cloud Handling mit Base-Provider + Premium-Faktor
- Observability-Kosten und angepasste VM-Preise für realistische Vergleiche
- Umfassende Preisquellen-Dokumentation auf der Kriterienseite
- Block Storage Pricing mit korrektem Tier-Mapping
- TCO-Sektion mit realem Frankfurt-Kostenbeispiel
- Neue `css/criteria-styles.css` für die Kriterienseite
- **Kubernetes Cluster** in Schnellauswahl aufgenommen

### Changed
- Preisberechnung vollständig zentralisiert in `CloudPricing`
- Preistabelle zeigt reale EUR-Preise statt Faktoren
- Vollständiger Workload-Kostenvergleich in der Preistabelle
- DELOS-Link auf offizielle Website aktualisiert
- Sovereign Cloud Links aktualisiert
- Projektstruktur bereinigt: JS-Files → `js/`, CSS-Files → `css/`, Assets → `assets/`
- Versionsnummer im Footer verlinkt auf CHANGELOG
- Schnellauswahl: Apps direkt aus Datenbank geladen (kein 1,5s Recherche-Delay); Sizing S/M/L auf Step 0 auswählbar
- „Neue Analyse" kehrt korrekt zu Step 0 (Modus/Schnellauswahl) zurück
- Jira und Kubernetes App aus Schnellauswahl entfernt
- GitLab Medium/Large: Multi-Node Compute-Specs (3 bzw. 5 Worker Nodes) passend zur Kubernetes-Referenzarchitektur

### Fixed
- Kubernetes-Konfiguration: `kubernetes`-Komponente berechnet nur noch den Managed Control Plane; `compute`-VMs werden korrekt als Worker Nodes mit S/M/L-Specs und explizitem Node-Count abgerechnet (kein Doppel-Billing mehr)
- Block Storage Pricing: Künstliches Minimum entfernt, Tier-Mapping korrigiert
- `getBaseServicePrice` mit Sovereign Cloud Handling ergänzt
- `selectedComponents` als Set beim Laden des Multi-App-Zustands korrekt wiederhergestellt
- Nicht-iterierbare `selectedComponents` beim Laden des Zustands abgesichert
- `reset()` setzte fälschlicherweise auf Step 1 (leer in Single-App-Modus), jetzt Step 0
- `hardReset()` löscht `componentConfigs` und SessionStorage bei neuer App-Auswahl
- „Gewählte Konfiguration"-Badge mit fehlerhaften Werten entfernt

## [1.2.2] - 2026-02-18 - Bugfix: Kubernetes-Komponente in Multi-App

### Fixed
- Multi-App: `kubernetes`-Komponente wurde bei Templates ohne `controlPlane`/`workers`-Struktur (z.B. `kubernetes-cluster`, `kubernetes-app`) aus den `selectedComponents` entfernt und stattdessen fälschlicherweise `compute` hinzugefügt
- Fix: `compute`-Config wird nur noch erstellt wenn `compute` tatsächlich in den Komponenten ist; Kubernetes-Fallback liest Node-Anzahl aus `sysReq.nodes` und Worker-Specs aus `sysReq.compute`

## [1.2.1] - 2026-02-18 - Bugfix: Container Registry Label

### Fixed
- Service-Verfügbarkeit-Tabelle: Container Registry wurde fälschlicherweise als "Kubernetes Cluster" bezeichnet, da die Suche nach `requiredServices.includes()` statt nach `id` matchte

## [1.2.0] - 2026-01-29 - Comprehensive SEO Optimization

### Added
- **Meta Tags**: Description, keywords, author, robots, Open Graph, and Twitter Card tags
- **Structured Data (Schema.org)**: SoftwareApplication, BreadcrumbList, and Article schemas
- **Technical SEO**: robots.txt with sitemap reference, sitemap.xml, DNS prefetch & preconnect
- JavaScript defer loading for better performance

### Fixed
- Logo links (`href="#"` → `href="index.html"`)
- H-tag hierarchy in evaluation-criteria.html

### Improved
- Image alt texts for accessibility
- Added `rel="noopener noreferrer"` for external links
- Overall SEO score: 94/100

## [1.1.0] - 2026-01-25 - Mobile optimization with burger menu navigation

### Added
- **Mobile Navigation**: Burger menu with slide-out drawer for mobile devices
- **Responsive Criteria Navigation**: Scrollable tabs (tablet) and dropdown selector (phone)
- **Dark Mode Toggle**: Accessible in mobile drawer header
- **Scroll Spy**: Automatic navigation state updates when scrolling through sections
- Impressum link in criteria page footer

### Changed
- Complete mobile-first redesign matching SCC design system
- Navigation drawer with card-style links and smooth animations
- Burger menu with animated icon transition (hamburger to X)
- Improved touch targets and mobile usability

### Technical
- CSS breakpoints: 992px (tablet), 576px (phone)
- Backdrop blur effects for modern glass-morphism look
- Cubic-bezier transitions for smooth animations

## [1.0.2] - 2026-01-24 - Repository optimization for GitHub Pages

### Added
- CHANGELOG.md to track version history
- Version number display in footer of all HTML pages

### Changed
- Repository structure optimized for GitHub Pages
- Cross-references updated to use GitHub Pages URLs
- Main HTML file renamed to index.html for GitHub Pages compatibility

### Fixed
- DELOS description in README corrected

## [1.0.1] - 2026-01-23 - Documentation improvements

### Added
- System requirements section in README
- Comprehensive application examples

### Improved
- Documentation clarity and completeness
- README structure and readability

## [1.0.0] - 2026-01-22 - Initial release

### Added
- Initial release of Strategic Application Analysis Tool
- Interactive web-based application for IT portfolio analysis
- DELOS framework integration (Digital, Effective, Local-Global, Operational, Stable)
- aPriori evaluation criteria system
- 6 analysis dimensions: Domain, Business Architecture, Technology, Economics, Risks, Migration
- Multi-phase scoring system (To-Be Vision, AS-IS Assessment, Migration Strategy)
- Dark/Light theme support
- PDF export functionality
- Data import/export capabilities
- 16 pre-configured applications as examples
- Comprehensive README documentation
- Dual-license model (AGPL v3 / Commercial)

---

## Version History Summary

- **3.0.0** - Architektur-Modus Live-Transformation, ES-Module-Migration, Cloud Pricing API, Kostenberechnung
- **2.0.0** - Cloud Pricing API, Kubernetes-Redesign & UX
- **1.2.2** - Bugfix: Kubernetes-Komponente in Multi-App
- **1.2.1** - Bugfix: Container Registry Label
- **1.2.0** - Comprehensive SEO Optimization
- **1.1.0** - Mobile optimization with burger menu navigation
- **1.0.2** - Repository optimization for GitHub Pages, CHANGELOG added
- **1.0.1** - Documentation improvements
- **1.0.0** - Initial release

---

For questions or feature requests, please contact: BTC IT Services GmbH, Kontakt@btc-ag.com
