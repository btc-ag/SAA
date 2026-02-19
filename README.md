# Sovereign Architecture Advisor (SAA)

Ein interaktiver Wizard zur Bewertung und Empfehlung souveräner Cloud-Architekturen für Unternehmensanwendungen.

## Highlights

- **Sovereign-First**: Fokus auf europäische und souveräne Cloud-Anbieter
- **Cloud Pricing API**: Echte Frankfurt-Preise für alle Anbieter – keine pauschalen Faktoren
- **Applikations-Mapping**: Vordefinierte Profile für 134+ Enterprise-Apps (SAP, GitLab, Kubernetes, Nextcloud u.v.m.)
- **Schnellauswahl**: Bekannte Apps direkt laden, Sizing S/M/L wählen, sofort zur Konfiguration
- **Architektur-Modus**: Cloud-native oder Klassisch wählen — Komponenten-Auswahl passt sich live an
- **Multi-Kriterien-Analyse**: Gewichtung von Kontrolle, Performance, Verfügbarkeit und Kosten
- **Transparente Bewertung**: Detaillierte Dokumentation der Bewertungskriterien und Scoring-Methodik
- **TCO-Schätzung**: Zweischichtiges Betriebskosten-Modell — Infrastruktur-Betrieb pro Komponente + Applikationsbetrieb (Plattformbetrieb) abhängig von Architektur-Modus, Komplexität und Sizing
- **Detailvergleich**: Übersichtliche Tabelle aller Anbieter mit Service-Verfügbarkeit
- **PDF-Export**: Analyse-Ergebnisse als druckbares Dokument exportieren
- **Responsive Design**: Vollständig optimiert für Desktop, Tablet und Mobile mit Burger-Menü Navigation

## Unterstützte Cloud-Anbieter

### Hyperscaler
- Amazon Web Services (AWS)
- Microsoft Azure
- Google Cloud Platform (GCP)

### Souveräne / EU Clouds
- STACKIT (Schwarz IT)
- Open Telekom Cloud (T-Systems)
- IONOS Cloud (United Internet)
- AWS European Sovereign Cloud (ESC)
- Microsoft Cloud for Sovereignty (DELOS)

### Private Cloud
- OpenStack Private Cloud (Self-Managed)

## Funktionen

### 1. Applikationsauswahl
- Schnellauswahl für 134+ bekannte Apps (SAP, GitLab, WordPress, Kubernetes Cluster, Nextcloud u.v.m.)
- Suche nach beliebigen Applikationen mit automatischer Erkennung benötigter Services
- Sizing direkt auf der Startseite: Klein / Mittel / Groß mit konkreten Ressourcen-Specs

### 2. Komponenten-Konfiguration
- Auswahl relevanter Infrastruktur-Komponenten, kategorisiert nach Compute, Storage, Netzwerk, Datenbanken etc.
- Kubernetes = Managed Control Plane; Worker Nodes über Compute-Komponente konfigurierbar
- **Architektur-Modus** (Cloud-native / Klassisch): Steuert, ob eine Anwendung auf verwalteten Plattform-Diensten (PaaS) oder klassischen VMs betrieben wird — mit direktem Einfluss auf Betriebsaufwand und TCO. Die Komponenten-Auswahl passt sich beim Modus-Wechsel live an.
  - Cloud-native: `compute` → `PaaS / Serverless` bei Web-/CMS-Apps; Kubernetes- und Enterprise-Apps bleiben konservativ
  - Klassisch: `serverless`/`kubernetes` → `compute` + `loadbalancer`
  - Manuelle Änderungen bleiben erhalten (Delta-System), Reset-Button bringt den Originalzustand zurück
  - Empfohlener Modus wird pro App vorausgewählt (`recommendedArchitecture`)

### 3. Gewichtungsprofile
- Vordefinierte Profile: Ausgewogen, Compliance-First, Performance-First, Kostenoptimiert
- Individuelle Gewichtung der Bewertungskriterien möglich
- Algorithmus-Transparenz durch Formel-Anzeige

### 4. Analyse & Empfehlung
- Ranking aller Anbieter nach gewichtetem Score
- Service-Abdeckung mit Verfügbarkeits-Status
- TCO-Breakdown mit realen Cloud-Preisen (Frankfurt-Region)
- **Zweischichtiges Betriebskosten-Modell** im TCO:
  - *Infrastruktur-Betrieb*: Aufwand je gewählter Komponente (Patching, Monitoring, Konfiguration)
  - *Applikationsbetrieb (Plattformbetrieb)*: Modus-abhängiger Fixaufwand für HA, Deployment und Incident Response — deutlich geringer bei Cloud-native/PaaS-Architektur (0,1 FTE Basis) als bei klassischer VM-Architektur (0,3 FTE Basis)
- Detaillierte Vergleichstabelle

### 5. Bewertungskriterien-Dokumentation
- Separate Seite (`evaluation-criteria.html`) mit vollständiger Dokumentation
- Detaillierte Erklärung aller Bewertungskriterien und Metriken
- Transparente Darstellung der Scoring-Methodik und Algorithmen
- Beispielberechnungen für besseres Verständnis

## Tech Stack

- **Frontend**: Vanilla JavaScript mit nativen ES-Modulen (`import`/`export`) – kein Build-Prozess, kein Bundler
- **Styling**: CSS3 mit CSS Custom Properties
- **Architektur**: Single-Page Application, modular aufgeteilt (siehe unten)
- **Daten**: `js/saa-data.js` (Anbieter, Komponenten) + `js/saa-apps-data.js` (Applikations-Datenbank mit 134+ Apps)
- **Preise**: `js/cloud-pricing.js` als zentrale Preisberechnungs-Engine (Frankfurt-Region)

## Architektur

Die Anwendung ist in funktionale Module aufgeteilt, um Änderungen zu isolieren und die Codebase wartbar zu halten. Der Einstiegspunkt ist `js/saa-app.js`; alle anderen Dateien werden über native ES-Module-Imports geladen – keine manuelle Script-Reihenfolge im HTML nötig.

### Warum Module?

Der ursprüngliche `saa-app.js` war mit über 8.500 Zeilen ein typischer Monolith: Eine Klasse, alle Verantwortlichkeiten, kein klares Ownership. Das hat folgende Konsequenzen:

- **Riskante Änderungen**: Jede Anpassung konnte unbeabsichtigt entfernte Stellen brechen
- **Keine Testbarkeit**: Rendering, State, Analyse und PDF waren untrennbar verwoben
- **Schlechte Orientierung**: Für eine Bugfix-Suche musste man tausende Zeilen scannen

Die Aufteilung folgt dem **Single-Responsibility-Prinzip**: Jedes Modul hat genau eine Aufgabe, kennt seinen Scope und importiert explizit, was es braucht.

### Modulübersicht

| Modul | Verantwortlichkeit |
|---|---|
| `saa-app.js` | Orchestrator: Navigation, Suche, Analyse-Trigger, System-Requirements |
| `modules/saa-state.js` | Session-Persistenz, Settings laden/speichern, Reset |
| `modules/saa-components.js` | Komponenten-UI, Config-Panels, VM/DB/Storage-Gruppen |
| `modules/saa-results.js` | Ergebnis-Rendering, Provider-Cards, TCO, Vergleichstabelle, Popups |
| `modules/saa-settings.js` | Settings-Modal, Presets, Gewichte, API-Key |
| `modules/saa-multiapp.js` | Multi-App-Workflow, App-Mapping-Tabelle, Portfolio-Parsing |
| `modules/saa-pdf.js` | PDF-Export (Single-App und Portfolio) |
| `modules/saa-utils.js` | Shared Utilities (IconMapper: Emoji → FontAwesome) |
| `saa-data.js` | Cloud-Anbieter, Architektur-Komponenten, Deployment-Patterns |
| `saa-apps-data.js` | Bekannte Applikationen (80+ Enterprise-Apps mit System-Requirements) |
| `saa-analysis.js` | Analyse-Engine: Scoring, TCO-Berechnung, Maturity-Faktor |
| `cloud-pricing.js` | Echte Cloud-Preise Frankfurt-Region |

### Bindungsmuster

Module-Methoden werden via **Prototype-Mixin** in die App-Klasse eingebunden:

```js
Object.assign(SovereignArchitectureAdvisor.prototype, SAAResults);
```

Das vermeidet das `.call(this)`-Boilerplate früherer Versionen und macht die Methoden zu echten Instanzmethoden ohne Kontext-Binding-Trickserei.

## Setup

### Voraussetzungen
- Moderner Webbrowser (Chrome, Firefox, Safari, Edge)
- **Lokaler Webserver** für die Entwicklung (ES-Module funktionieren nicht über `file://`)

### Lokale Nutzung

**Option A – VS Code Live Server** (empfohlen):
1. Repository klonen
2. VS Code Extension „Live Server" installieren
3. `index.html` rechtsklick → „Open with Live Server"

**Option B – Python**:
```bash
git clone <repo>
cd SAA
python3 -m http.server 8080
# → http://localhost:8080
```

**GitHub Pages**: Funktioniert direkt – ES-Module laufen auf jedem HTTPS-Server ohne Einschränkungen.

### Dateistruktur
```
SAA/
├── index.html                            # Haupt-HTML (Wizard, lädt nur saa-app.js)
├── evaluation-criteria.html              # Bewertungskriterien-Seite
├── js/
│   ├── saa-app.js                        # Entry-Point & Orchestrator
│   ├── saa-analysis.js                   # Analyse-Engine (Scoring, TCO)
│   ├── saa-data.js                       # Anbieter- und Komponenten-Daten
│   ├── saa-apps-data.js                  # Applikations-Datenbank (80+ Apps)
│   ├── cloud-pricing.js                  # Cloud Pricing API (Frankfurt-Preise)
│   ├── criteria-page.js                  # Bewertungskriterien-Logik
│   └── modules/
│       ├── saa-state.js                  # Session & Settings
│       ├── saa-components.js             # Komponenten-UI
│       ├── saa-results.js                # Ergebnis-Rendering
│       ├── saa-settings.js               # Einstellungen-Modal
│       ├── saa-multiapp.js               # Multi-App-Workflow
│       ├── saa-pdf.js                    # PDF-Export
│       └── saa-utils.js                  # Shared Utilities (IconMapper)
├── css/
│   ├── saa-styles.css                    # Haupt-Styling
│   └── criteria-styles.css               # Bewertungskriterien-Styling
├── assets/
│   ├── btc-logo.png                      # BTC Logo
│   └── favicon.svg                       # Favicon
├── CHANGELOG.md                          # Versionshistorie
├── LICENSE                               # Lizenz
└── README.md                             # Diese Datei
```

## Verwendung

1. **Applikation wählen**: Tippe den Namen einer Unternehmensanwendung ein oder wähle aus der Dropdown-Liste
2. **Komponenten anpassen**: Ergänze oder entferne benötigte Cloud-Services
3. **Sizing festlegen**: Wähle die passende Größenordnung (Benutzer/Ressourcen)
4. **Gewichtung einstellen**: Passe die Bewertungskriterien nach Priorität an
5. **Analyse starten**: Erhalte eine gewichtete Empfehlung mit allen Details
6. **Exportieren**: Speichere das Ergebnis als PDF

## Datenquellen

Die Service-Verfügbarkeit und Bewertungen basieren auf:
- Öffentlich verfügbaren Dokumentationen der Cloud-Anbieter
- Offiziellen Preislisten der Anbieter (Frankfurt-Region, Stand: Februar 2026)
- Eigenen Recherchen und Erfahrungswerten

**Hinweis**: Die Daten erheben keinen Anspruch auf Vollständigkeit. Für produktive Entscheidungen sollten die aktuellen Anbieter-Dokumentationen konsultiert werden.

## Erweiterung

### Neue Anbieter hinzufügen
In `saa-data.js` unter `cloudProviders` einen neuen Eintrag anlegen:

```javascript
{
    id: 'neuer_anbieter',
    name: 'Neuer Anbieter',
    category: 'sovereign',
    icon: '☁️',
    services: {
        compute_vm: { available: true, status: 'production', name: 'VM Service' },
        // weitere Services...
    }
}
```

### Neue Applikationen hinzufügen
In `saa-apps-data.js` unter `knownApplications` einen neuen Eintrag anlegen:

```javascript
'app-id': {
    name: 'Neue Applikation',
    description: 'Beschreibung der Applikation',
    components: ['compute', 'storage_block', 'database_sql', 'dns'],
    systemRequirements: {
        small: {
            users: '1-100',
            compute: { cpu: 2, ram: 8 },
            storage: { type: 'SSD', size: '100GB' }
        },
        medium: {
            users: '100-1000',
            compute: { cpu: 4, ram: 16 },
            storage: { type: 'SSD', size: '500GB' }
        },
        large: {
            users: '1000+',
            compute: { cpu: 8, ram: 32 },
            storage: { type: 'SSD', size: '1TB+' }
        }
    },
    sizing: {
        note: 'Zusätzliche Sizing-Hinweise',
        source: 'https://...'
    }
}
```

## Lizenz

Dieses Projekt steht unter einer **Dual-License** (AGPL v3 / Kommerziell). Details siehe [LICENSE](LICENSE).

- **AGPL v3**: Kostenlose Nutzung mit Quellcode-Offenlegungspflicht
- **Kommerzielle Lizenz**: Für proprietäre Nutzung ohne Offenlegungspflicht

## Kontakt & Support

Bei Fragen, Feedback oder Erweiterungswünschen:

**BTC Business Technology Consulting AG**
E-Mail: cloud@btc-ag.com

---

*Entwickelt mit Unterstützung von Claude (Anthropic)*
