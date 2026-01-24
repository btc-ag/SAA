# Sovereign Architecture Advisor (SAA)

Ein interaktiver Wizard zur Bewertung und Empfehlung souveräner Cloud-Architekturen für Unternehmensanwendungen.

## Highlights

- **Sovereign-First**: Fokus auf europäische und souveräne Cloud-Anbieter
- **Applikations-Mapping**: Vordefinierte Profile für SAP, Microsoft 365, Custom Apps und mehr
- **Multi-Kriterien-Analyse**: Gewichtung von Kontrolle, Performance, Verfügbarkeit und Kosten
- **Transparente Bewertung**: Detaillierte Dokumentation der Bewertungskriterien und Scoring-Methodik
- **TCO-Schätzung**: Grobe Kosteneinschätzung basierend auf Sizing und Betriebsaufwand
- **Detailvergleich**: Übersichtliche Tabelle aller Anbieter mit Service-Verfügbarkeit
- **PDF-Export**: Analyse-Ergebnisse als druckbares Dokument exportieren
- **Responsive Design**: Optimiert für Desktop und Tablet

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
- Suche nach bekannten Applikationen (SAP S/4HANA, Microsoft 365, etc.)
- Automatische Erkennung benötigter Cloud-Services
- Dropdown mit allen verfügbaren Applikationsprofilen

### 2. Komponenten-Konfiguration
- Auswahl relevanter Infrastruktur-Komponenten
- Kategorisiert nach Compute, Storage, Netzwerk, Datenbanken, etc.
- Sizing-Auswahl (S/M/L/XL) mit Ressourcen-Schätzung

### 3. Gewichtungsprofile
- Vordefinierte Profile: Ausgewogen, Compliance-First, Performance-First, Kostenoptimiert
- Individuelle Gewichtung der Bewertungskriterien möglich
- Algorithmus-Transparenz durch Formel-Anzeige

### 4. Analyse & Empfehlung
- Ranking aller Anbieter nach gewichtetem Score
- Service-Abdeckung mit Verfügbarkeits-Status
- TCO-Breakdown mit Kostenkomponenten
- Detaillierte Vergleichstabelle

### 5. Bewertungskriterien-Dokumentation
- Separate Seite (`evaluation-criteria.html`) mit vollständiger Dokumentation
- Detaillierte Erklärung aller Bewertungskriterien und Metriken
- Transparente Darstellung der Scoring-Methodik und Algorithmen
- Beispielberechnungen für besseres Verständnis

## Tech Stack

- **Frontend**: Vanilla JavaScript (ES6+)
- **Styling**: CSS3 mit CSS Custom Properties
- **Architektur**: Single-Page Application ohne Build-Prozess
- **Daten**: JSON-basierte Konfiguration in `saa-data.js`

## Setup

### Voraussetzungen
- Moderner Webbrowser (Chrome, Firefox, Safari, Edge)
- Keine Server-Installation erforderlich

### Lokale Nutzung
1. Repository klonen oder ZIP entpacken
2. `Sovereign_Architecture_Advisor.html` im Browser öffnen für den Wizard
3. Optional: `evaluation-criteria.html` öffnen für die Bewertungskriterien-Dokumentation
4. Fertig!

### Dateistruktur
```
SAA/
├── Sovereign_Architecture_Advisor.html   # Haupt-HTML (Wizard)
├── evaluation-criteria.html              # Bewertungskriterien-Seite
├── saa-app.js                            # Hauptapplikationslogik
├── saa-analysis.js                       # Analyse- und Scoring-Logik
├── criteria-page.js                      # Bewertungskriterien-Logik
├── saa-styles.css                        # Haupt-Styling
├── criteria-styles.css                   # Bewertungskriterien-Styling
├── saa-data.js                           # Anbieter- und Service-Daten
├── favicon.svg                           # Favicon
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
- Eigenen Recherchen und Erfahrungswerten
- Stand: Januar 2025

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
In `saa-data.js` eine neue Applikation ergänzen:

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
