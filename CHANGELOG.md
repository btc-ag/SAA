# Changelog

All notable changes to the Strategic Application Analysis (SAA) Tool will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
- Intelligente Infrastrukturkostenberechnung mit Unterstützung für Cloud-native/PaaS-Architekturmodelle
- Workload-Typ-Erkennung mit passender Architekturempfehlung
- System-Konfiguration Zusammenfassung in der Ergebnisansicht
- Architektur-Modus-Anzeige mit Transformation-Details in den Analyseergebnissen

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
