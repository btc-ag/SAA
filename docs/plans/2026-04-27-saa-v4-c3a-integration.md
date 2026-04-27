# SAA v4.0.0 — BSI C3A Integration + SAP Cloud Infrastructure

> Migration der SCC-v4-Methodik (BSI C3A v1.0, SOV-7-Compliance-Katalog, C1/C2-Audit-Strenge-Toggle) in den Sovereign Architecture Advisor.

## Ausgangslage

- **SCC v4.0.0** ist live mit auditierbarem Kontrolle-Score (BSI C3A + SOV-7 + EU-CSF-Gewichte).
- **SAA** ist heute auf Branch `claude/revise-infrastructure-costs-3AxEW` (Pages-Branch) mit komplexerer Datenstruktur:
  - 8 Provider mit Provider-Level + 22 Service-Level-Bewertungen
  - 4 Bewertungs-Dimensionen: control, performance, availability, cost
  - **SAP Cloud Infrastructure fehlt** komplett.
  - **Keine SOV-Struktur**, keine BSI-C3A-Kriterien.

## Ziel

SAA v4.0.0 mit:
1. **BSI C3A v1.0 Integration** auf Provider-Level (analog SCC).
2. **SOV-7 Compliance-Katalog** für Sicherheits-Zertifizierungen.
3. **C1/C2 Audit-Strenge-Toggle** im UI.
4. **SAP Cloud Infrastructure** als 9. Provider mit allen 22 Services + C3A.
5. **Hybrid-Control-Berechnung:** wenn c3a-Daten existieren → kontrolle aus C3A aggregiert; sonst Fallback auf bestehenden control-Integer.

## Architektur-Entscheidungen

- **Daten-Layer:** Drei neue ES-Module unter `js/modules/` analog zu SCC:
  - `c3a-framework.js` — 30 BSI-C3A-Kriterien (1:1 aus SCC kopiert)
  - `sov7-compliance.js` — 10 SOV-7-Kriterien (1:1 aus SCC kopiert)
  - `audit-mode.js` — Mode-State (`c1` / `c2`) mit localStorage-Persistenz
- **Provider-Daten:** `js/saa-data.js` bekommt pro Provider drei neue Felder:
  - `c3a` — Object mit 30 Kriterien-Bewertungen
  - `sov7` — Object mit 10 Compliance-Bewertungen
  - `sources` — Array mit URL-Belegen
  - Werte aus SCC `provider-assessments.js` übernommen.
- **Score-Integration:** `calculateControlFromC3A(provider, mode)` in `saa-analysis.js`. Wenn Provider C3A-Daten hat, wird der Provider-Level-`control`-Wert beim Aggregieren überschrieben. Service-Level-`control` bleibt unverändert (zu fein-granular für C3A).
- **UI:** Audit-Strenge-Toggle als kleine Pill im Header der Strategie-Card. Identisches Verhalten wie SCC.
- **Methodik-Seite:** Neue Sektion „BSI C3A & SOV-7 Compliance" in `evaluation-criteria.html`.

## Phasen

### Phase 1 — Frameworks & Datenmodell (kein UI-Effekt)
- Module anlegen
- Provider-Daten in `saa-data.js` erweitern
- SAP Cloud Infrastructure als neuer Provider mit kompletten 22 Service-Bewertungen + C3A
- **Smoke:** Datei lädt, alle Provider haben c3a/sov7-Felder, SAP funktioniert in der bestehenden Score-Logik

### Phase 2 — Score-Integration
- `calculateControlFromC3A` in `saa-analysis.js`
- `audit-mode.js` mit setAuditMode/getAuditMode
- Hybrid-Logik: wenn `c3a` vorhanden → aus C3A; sonst Fallback
- **Smoke:** Provider-Scores ändern sich erwartet bei Toggle-Wechsel; kein Bruch der bestehenden Funktionalität

### Phase 3 — UI Toggle + Re-Render
- Toggle in `index.html` + Wiring in `saa-app.js`
- Auf Mode-Wechsel: `runAnalysis()` neu auslösen
- C3A-Drilldown im Provider-Card (analog SCC Sov-Panel)

### Phase 4 — evaluation-criteria.html
- Neue Sektion mit C3A-Erklärung + SOV-7-Katalog + Berechnungsbeispiel
- Verlinkung zu BSI-C3A-PDF und EU-CSF
- Update Hero-Subtitle und Glossar-Box

### Phase 5 — Branch-Strategie
- Direkt auf `claude/revise-infrastructure-costs-3AxEW` committen (= Pages-Branch)
- Auch auf `main` cherry-picken oder einen separaten PR (wenn divergierend)

## Risiken & Kontrollpunkte

1. **SAP CI Service-Bewertung:** SCC hat keine 22 Service-Werte für SAP — die müssen aus öffentlichen SAP-Quellen + Heuristik abgeleitet werden. Dokumentiert in `controlReason`/`performanceReason`.
2. **C1/C2 Mode-Wechsel** kann Score-Verschiebungen auslösen, die User irritieren. Erklärung im UI nötig.
3. **deVariant-Fix für SOV-3-01** (C4 = DE customer data) muss in den Daten korrekt gesetzt sein — wir haben es im SCC gefixt, übernehmen den Stand 1:1.

## Erfolgs-Kriterien

- ✅ 9 Provider (8 + SAP CI), alle mit c3a-Bewertungen
- ✅ SOV-3-01 mit C4-Annotation für deutsche Provider
- ✅ Audit-Toggle wirkt auf Provider-Cards
- ✅ Methodik-Seite erklärt BSI C3A
- ✅ Bestehende Funktionalität (Multi-App, PDF-Export, TCO-Berechnung) unverändert
- ✅ Umami-Tracking bleibt aktiv
