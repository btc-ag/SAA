# Changelog

All notable changes to the Strategic Application Analysis (SAA) Tool will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
