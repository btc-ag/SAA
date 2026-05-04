// SAA PDF Export Module
// Verantwortlich für: PDF-Export (Single-App und Multi-App/Portfolio)

import { architectureComponents } from '../saa-data.js';

// Umami-Tracking-Helfer (no-op falls Umami nicht geladen)
function track(eventName, data) {
    if (typeof window.umami !== 'undefined' && typeof window.umami.track === 'function') {
        try { window.umami.track(eventName, data); } catch (e) { /* ignore */ }
    }
}

export const SAAPdf = {
    /**
     * Exportiert die Analyse als PDF
     */
    exportToPDF() {
        // Track: PDF-Export ausgelöst (wichtige Conversion)
        track('export-pdf', {
            mode: this.isMultiAppMode ? 'multi' : 'single',
            appCount: this.isMultiAppMode ? (this.applications || []).length : 1
        });

        // Check if we're in Multi-App Mode or Single-App Mode
        if (this.isMultiAppMode && this.aggregatedResults) {
            // Multi-App Mode: Export Portfolio Overview
            this.exportPortfolioPDF();
            return;
        }

        // Single-App Mode
        if (!this.currentApp.analysisResults || this.currentApp.analysisResults.length === 0) {
            alert('Keine Analyseergebnisse vorhanden.');
            return;
        }

        const top3 = this.currentApp.analysisResults.slice(0, 3);
        const date = new Date().toLocaleDateString('de-DE', {
            year: 'numeric', month: 'long', day: 'numeric'
        });

        // Generiere die finale Empfehlung wie in der UI
        const finalRec = this.analyzer.generateFinalRecommendation(
            this.currentApp.analysisResults,
            Array.from(this.currentApp.selectedComponents),
            this.weights
        );

        // Kosten/Ops Labels
        const costLabels = {
            very_low: 'Sehr günstig', low: 'Günstig', medium: 'Mittel',
            high: 'Hoch', very_high: 'Sehr hoch'
        };
        const opsLabels = {
            very_low: 'Minimal', low: 'Gering', medium: 'Mittel',
            high: 'Hoch', very_high: 'Sehr hoch'
        };

        // HTML für PDF generieren
        const html = `
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <title>Sovereign Architecture Advisor - Report</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 11pt;
            line-height: 1.5;
            color: #333;
            padding: 40px;
        }
        .header {
            border-bottom: 3px solid #5AA6E7;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #1a365d;
            font-size: 24pt;
            margin-bottom: 5px;
        }
        .header .subtitle {
            color: #666;
            font-size: 12pt;
        }
        .header .date {
            color: #888;
            font-size: 10pt;
            margin-top: 10px;
        }
        .section {
            margin-bottom: 25px;
            page-break-inside: avoid;
        }
        .section h2 {
            color: #2c5282;
            font-size: 14pt;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 8px;
            margin-bottom: 15px;
        }
        .config-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }
        .config-item {
            background: #f7fafc;
            padding: 12px;
            border-radius: 6px;
            border-left: 3px solid #5AA6E7;
        }
        .config-item label {
            font-weight: 600;
            color: #4a5568;
            display: block;
            margin-bottom: 3px;
            font-size: 9pt;
        }
        .config-item span {
            color: #1a202c;
            font-size: 11pt;
        }
        .provider-card {
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
            page-break-inside: avoid;
        }
        .provider-card.rank-1 { border-left: 4px solid #38a169; }
        .provider-card.rank-2 { border-left: 4px solid #5AA6E7; }
        .provider-card.rank-3 { border-left: 4px solid #ed8936; }
        .provider-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }
        .provider-name {
            font-size: 14pt;
            font-weight: 700;
            color: #1a202c;
        }
        .provider-rank {
            background: #5AA6E7;
            color: white;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 10pt;
            font-weight: 600;
        }
        .provider-rank.rank-1 { background: #38a169; }
        .provider-rank.rank-2 { background: #5AA6E7; }
        .provider-rank.rank-3 { background: #ed8936; }
        .score-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
            margin-bottom: 15px;
        }
        .score-item {
            text-align: center;
            padding: 10px;
            background: #f7fafc;
            border-radius: 6px;
        }
        .score-item .value {
            font-size: 18pt;
            font-weight: 700;
            color: #2c5282;
        }
        .score-item .label {
            font-size: 8pt;
            color: #718096;
            text-transform: uppercase;
        }
        .services-section { margin-top: 12px; }
        .services-section h4 {
            font-size: 10pt;
            color: #4a5568;
            margin-bottom: 8px;
        }
        .service-list {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
        }
        .service-tag {
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 9pt;
        }
        .service-tag.available {
            background: #c6f6d5;
            color: #276749;
        }
        .service-tag.missing {
            background: #fed7d7;
            color: #c53030;
        }
        .service-tag.planned {
            background: #feebc8;
            color: #c05621;
        }
        .tco-section {
            background: #f7fafc;
            padding: 12px;
            border-radius: 6px;
            margin-top: 12px;
        }
        .tco-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
        }
        .tco-item { text-align: center; }
        .tco-item .value {
            font-weight: 600;
            color: #2c5282;
        }
        .tco-item .label {
            font-size: 8pt;
            color: #718096;
        }
        .recommendation {
            background: #ebf8ff;
            border-left: 4px solid #5AA6E7;
            padding: 15px;
            margin-top: 10px;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            color: #a0aec0;
            font-size: 9pt;
        }
        @media print {
            body { padding: 20px; }
            .provider-card { page-break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Sovereign Architecture Advisor</h1>
        <div class="subtitle">Cloud-Architektur Analyse Report</div>
        <div class="date">Erstellt am ${date}</div>
    </div>

    <div class="section">
        <h2>Konfiguration</h2>
        <div class="config-grid">
            <div class="config-item">
                <label>Anwendung</label>
                <span>${this.currentApp.applicationData?.name || 'Manuelle Auswahl'}</span>
            </div>
            <div class="config-item">
                <label>Komponenten</label>
                <span>${this.currentApp.selectedComponents.size} ausgewählt</span>
            </div>
            <div class="config-item">
                <label>Bewertungsprofil</label>
                <span>${this.getPresetLabel()}</span>
            </div>
            <div class="config-item">
                <label>Sizing</label>
                <span>${this.currentApp.sizing === 'small' ? 'Klein' : this.currentApp.sizing === 'medium' ? 'Mittel' : 'Groß'}</span>
            </div>
        </div>
        <div class="config-grid" style="margin-top: 15px;">
            <div class="config-item">
                <label>Gewichtung</label>
                <span>Kontrolle ${this.weights.control}% | Leistung ${this.weights.performance}% | Verfügbarkeit ${this.weights.availability}% | Kosten ${this.weights.cost}%</span>
            </div>
            <div class="config-item">
                <label>Ausgewählte Komponenten</label>
                <span>${Array.from(this.currentApp.selectedComponents).map(c => {
                    const comp = architectureComponents.find(ac => ac.id === c);
                    return comp ? comp.name : c;
                }).join(', ')}</span>
            </div>
        </div>
    </div>

    <div class="section">
        <h2>Top 3 Cloud-Empfehlungen</h2>
        ${top3.map((result, index) => this.renderPDFProviderCard(result, index, costLabels, opsLabels)).join('')}
    </div>

    <div class="section">
        <h2>Zusammenfassung</h2>
        <div class="recommendation">
            ${(finalRec.text || 'Keine spezifische Empfehlung verfügbar.')
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\n/g, '<br>')
                .replace(/• /g, '&bull; ')}
        </div>
        <p style="margin-top: 15px; font-size: 9pt; color: #718096;">
            Bewertungsprofil: <strong>${this.getPresetLabel()}</strong>
            (Kontrolle ${this.weights.control}%, Leistung ${this.weights.performance}%,
            Verfügbarkeit ${this.weights.availability}%, Kosten ${this.weights.cost}%)
        </p>
    </div>

    <div class="footer">
        <p>Sovereign Architecture Advisor | BTC Business Technology Consulting AG</p>
        <p>Dieser Report dient als Entscheidungsgrundlage und ersetzt keine detaillierte Architekturplanung.</p>
    </div>
</body>
</html>`;

        // PDF-Fenster öffnen
        const printWindow = window.open('', '_blank');
        printWindow.document.write(html);
        printWindow.document.close();

        // Kurz warten, dann Druckdialog öffnen
        setTimeout(() => {
            printWindow.print();
        }, 500);
    },

    /**
     * Exportiert Portfolio-Analyse als PDF (Multi-App Mode)
     */
    exportPortfolioPDF() {
        if (!this.aggregatedResults) {
            alert('Keine Portfolio-Analyseergebnisse vorhanden.');
            return;
        }

        const { portfolioMetrics, aggregatedProviders, aggregatedTCO } = this.aggregatedResults;
        const top3 = aggregatedProviders.slice(0, 3);
        const date = new Date().toLocaleDateString('de-DE', {
            year: 'numeric', month: 'long', day: 'numeric'
        });

        // HTML für Portfolio-PDF generieren
        const html = `
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <title>Sovereign Architecture Advisor - Portfolio Report</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 11pt;
            line-height: 1.5;
            color: #333;
            padding: 40px;
        }
        .header {
            border-bottom: 3px solid #5AA6E7;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #1a365d;
            font-size: 24pt;
            margin-bottom: 5px;
        }
        .header .subtitle {
            color: #666;
            font-size: 12pt;
        }
        .header .date {
            color: #888;
            font-size: 10pt;
            margin-top: 10px;
        }
        .section {
            margin-bottom: 25px;
            page-break-inside: avoid;
        }
        .section h2 {
            color: #2c5282;
            font-size: 14pt;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 8px;
            margin-bottom: 15px;
        }
        .portfolio-stats {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
            margin-bottom: 20px;
        }
        .stat-card {
            background: #f7fafc;
            padding: 15px;
            border-radius: 8px;
            border-left: 3px solid #5AA6E7;
            text-align: center;
        }
        .stat-card .value {
            font-size: 24pt;
            font-weight: 700;
            color: #2c5282;
            display: block;
        }
        .stat-card .label {
            font-size: 9pt;
            color: #718096;
            text-transform: uppercase;
            margin-top: 5px;
        }
        .provider-card {
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
            page-break-inside: avoid;
        }
        .provider-card.rank-1 { border-left: 4px solid #38a169; }
        .provider-card.rank-2 { border-left: 4px solid #5AA6E7; }
        .provider-card.rank-3 { border-left: 4px solid #ed8936; }
        .provider-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }
        .provider-name {
            font-size: 14pt;
            font-weight: 700;
            color: #1a202c;
        }
        .provider-rank {
            background: #5AA6E7;
            color: white;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 10pt;
            font-weight: 600;
        }
        .provider-rank.rank-1 { background: #38a169; }
        .provider-rank.rank-2 { background: #5AA6E7; }
        .provider-rank.rank-3 { background: #ed8936; }
        .score-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
            margin-bottom: 15px;
        }
        .score-item {
            text-align: center;
            padding: 10px;
            background: #f7fafc;
            border-radius: 6px;
        }
        .score-item .value {
            font-size: 18pt;
            font-weight: 700;
            color: #2c5282;
        }
        .score-item .label {
            font-size: 8pt;
            color: #718096;
            text-transform: uppercase;
        }
        .app-list {
            background: #f7fafc;
            padding: 12px;
            border-radius: 6px;
            margin-top: 12px;
        }
        .app-list h4 {
            font-size: 10pt;
            color: #4a5568;
            margin-bottom: 8px;
        }
        .app-item {
            padding: 8px;
            background: white;
            border-radius: 4px;
            margin-bottom: 8px;
            border-left: 3px solid #5AA6E7;
        }
        .app-item:last-child {
            margin-bottom: 0;
        }
        .app-item .name {
            font-weight: 600;
            color: #2c5282;
            font-size: 10pt;
        }
        .app-item .details {
            font-size: 9pt;
            color: #718096;
            margin-top: 3px;
        }
        .tco-section {
            background: #ebf8ff;
            padding: 15px;
            border-radius: 6px;
            margin-top: 12px;
            border-left: 4px solid #5AA6E7;
        }
        .tco-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
            margin-top: 10px;
        }
        .tco-item {
            text-align: center;
            padding: 8px;
            background: white;
            border-radius: 4px;
        }
        .tco-item .value {
            font-weight: 700;
            color: #2c5282;
            font-size: 12pt;
        }
        .tco-item .label {
            font-size: 8pt;
            color: #718096;
            margin-top: 3px;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            color: #a0aec0;
            font-size: 9pt;
        }
        @media print {
            body { padding: 20px; }
            .provider-card { page-break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Sovereign Architecture Advisor</h1>
        <div class="subtitle">Portfolio-Analyse Report</div>
        <div class="date">Erstellt am ${date}</div>
    </div>

    <div class="section">
        <h2>Portfolio-Übersicht</h2>
        <div class="portfolio-stats">
            <div class="stat-card">
                <span class="value">${portfolioMetrics.totalApps}</span>
                <span class="label">Anwendungen</span>
            </div>
            <div class="stat-card">
                <span class="value">${portfolioMetrics.totalComponents}</span>
                <span class="label">Komponenten</span>
            </div>
            <div class="stat-card">
                <span class="value">${portfolioMetrics.avgComponentsPerApp}</span>
                <span class="label">Ø pro App</span>
            </div>
            <div class="stat-card">
                <span class="value">${this.formatCurrency(aggregatedTCO[aggregatedProviders[0].provider.id]?.totalMonthly || 0)}€</span>
                <span class="label">TCO/Monat (Top)</span>
            </div>
        </div>
    </div>

    <div class="section">
        <h2>Analysierte Anwendungen</h2>
        ${this.applications.map((app, idx) => `
            <div class="app-item">
                <div class="name">${idx + 1}. ${app.name}</div>
                <div class="details">${app.selectedComponents.size} Komponenten | Typ: ${app.recognizedType || 'Benutzerdefiniert'}</div>
            </div>
        `).join('')}
    </div>

    <div class="section">
        <h2>Top 3 Cloud-Empfehlungen (Portfolio)</h2>
        ${top3.map((result, index) => this.renderPortfolioPDFProviderCard(result, index, aggregatedTCO)).join('')}
    </div>

    <div class="section">
        <h2>Portfolio-Zusammenfassung</h2>
        <div class="tco-section">
            <p style="font-size: 11pt; margin-bottom: 10px;">
                <strong>Empfehlung:</strong> ${top3[0].provider.name} bietet die beste Gesamtlösung
                für Ihr Portfolio von ${portfolioMetrics.totalApps} Anwendungen.
            </p>
            <p style="font-size: 10pt; color: #4a5568;">
                Portfolio-Score: <strong>${top3[0].aggregatedScore.toFixed(1)}</strong> |
                Service-Abdeckung: <strong>${Math.round(top3[0].serviceAnalysis.coverage)}%</strong>
            </p>
        </div>
        <p style="margin-top: 15px; font-size: 9pt; color: #718096;">
            Bewertungsprofil: <strong>${this.getPresetLabel()}</strong>
            (Kontrolle ${this.weights.control}%, Leistung ${this.weights.performance}%,
            Verfügbarkeit ${this.weights.availability}%, Kosten ${this.weights.cost}%)
        </p>
    </div>

    <div class="footer">
        <p>Sovereign Architecture Advisor | BTC Business Technology Consulting AG</p>
        <p>Dieser Report dient als Entscheidungsgrundlage und ersetzt keine detaillierte Architekturplanung.</p>
    </div>
</body>
</html>`;

        // PDF-Fenster öffnen
        const printWindow = window.open('', '_blank');
        printWindow.document.write(html);
        printWindow.document.close();

        // Kurz warten, dann Druckdialog öffnen
        setTimeout(() => {
            printWindow.print();
        }, 500);
    },

    /**
     * Rendert eine Provider-Karte für das Portfolio-PDF
     */
    renderPortfolioPDFProviderCard(result, index, aggregatedTCO) {
        const rank = index + 1;
        const { provider, aggregatedScore, serviceAnalysis, appScores } = result;
        const tco = aggregatedTCO[provider.id];

        return `
            <div class="provider-card rank-${rank}">
                <div class="provider-header">
                    <div class="provider-name">${provider.name}</div>
                    <div class="provider-rank rank-${rank}">#${rank}</div>
                </div>

                <div class="score-grid">
                    <div class="score-item">
                        <div class="value">${aggregatedScore.toFixed(1)}</div>
                        <div class="label">Portfolio-Score</div>
                    </div>
                    <div class="score-item">
                        <div class="value">${Math.round(serviceAnalysis.coverage)}%</div>
                        <div class="label">Abdeckung</div>
                    </div>
                    <div class="score-item">
                        <div class="value">${this.formatCurrency(tco.totalMonthly)}€</div>
                        <div class="label">TCO/Monat</div>
                    </div>
                    <div class="score-item">
                        <div class="value">${Math.round(tco.projectEffortDays)}</div>
                        <div class="label">Projekttage</div>
                    </div>
                </div>

                <div class="app-list">
                    <h4>Scores pro Anwendung:</h4>
                    ${appScores.map(appScore => `
                        <div class="app-item">
                            <div class="name">${appScore.appName}</div>
                            <div class="details">
                                Score: ${appScore.score.toFixed(1)} |
                                Gewicht: ${appScore.weight} Komponenten
                            </div>
                        </div>
                    `).join('')}
                </div>

                <div class="tco-section">
                    <strong>TCO-Breakdown</strong>
                    <div class="tco-grid">
                        <div class="tco-item">
                            <div class="value">${this.formatCurrency(tco.monthlyInfrastructure)}€</div>
                            <div class="label">Infrastruktur/Monat</div>
                        </div>
                        <div class="tco-item">
                            <div class="value">${this.formatCurrency(tco.monthlyOperations)}€</div>
                            <div class="label">Operations/Monat</div>
                        </div>
                        <div class="tco-item">
                            <div class="value">${tco.totalFTE.toFixed(1)} FTE</div>
                            <div class="label">Betriebsaufwand</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Rendert eine Provider-Karte für das PDF
     */
    renderPDFProviderCard(result, index, costLabels, opsLabels) {
        const rank = index + 1;
        const services = result.serviceAnalysis || { available: [], preview: [], planned: [], missing: [], coverage: 0 };
        const tco = result.tcoEstimate || {
            consumption: { monthlyEstimate: 0 },
            operations: { monthlyPersonnelCost: 0 },
            monthlyEstimate: 0
        };
        const score = result.score || { total: 0, controlScore: 0, performanceScore: 0 };

        // Sichere Formatierung der Zahlen
        const formatCurrency = (value) => {
            return (value || 0).toLocaleString('de-DE');
        };

        return `
        <div class="provider-card rank-${rank}">
            <div class="provider-header">
                <span class="provider-name">${result.provider?.fullName || result.provider?.name || 'Unbekannt'}</span>
                <span class="provider-rank rank-${rank}">#${rank} Empfehlung</span>
            </div>

            <div class="score-grid">
                <div class="score-item">
                    <div class="value">${score.total || 0}</div>
                    <div class="label">Gesamtscore</div>
                </div>
                <div class="score-item">
                    <div class="value">${score.controlScore || 0}</div>
                    <div class="label">Kontrolle</div>
                </div>
                <div class="score-item">
                    <div class="value">${score.performanceScore || 0}</div>
                    <div class="label">Leistung</div>
                </div>
                <div class="score-item">
                    <div class="value">${Math.round(services.coverage || 0)}%</div>
                    <div class="label">Abdeckung</div>
                </div>
            </div>

            <div class="services-section">
                <h4>Verfügbare Services (${(services.available?.length || 0) + (services.preview?.length || 0)}/${(services.available?.length || 0) + (services.preview?.length || 0) + (services.planned?.length || 0) + (services.missing?.length || 0)})</h4>
                <div class="service-list">
                    ${(services.available || []).slice(0, 8).map(s => `<span class="service-tag available">${s.name || this.getServiceDisplayName(s.id)}</span>`).join('')}
                    ${(services.available?.length || 0) > 8 ? `<span class="service-tag available">+${services.available.length - 8} weitere</span>` : ''}
                </div>
                ${(services.planned?.length || 0) > 0 ? `
                <h4 style="margin-top: 10px;">Geplant (${services.planned.length})</h4>
                <div class="service-list">
                    ${services.planned.map(s => `<span class="service-tag planned">${this.getServiceDisplayName(s.id)}</span>`).join('')}
                </div>` : ''}
                ${(services.missing?.length || 0) > 0 ? `
                <h4 style="margin-top: 10px;">Nicht verfügbar (${services.missing.length})</h4>
                <div class="service-list">
                    ${services.missing.map(s => `<span class="service-tag missing">${this.getServiceDisplayName(s.id)}</span>`).join('')}
                </div>` : ''}
            </div>

            <div class="tco-section">
                <div class="tco-grid">
                    <div class="tco-item">
                        <div class="value">~${formatCurrency(tco.consumption?.monthlyEstimate)}€/Mon.</div>
                        <div class="label">Infrastruktur</div>
                    </div>
                    <div class="tco-item">
                        <div class="value">~${formatCurrency(tco.operations?.monthlyPersonnelCost)}€/Mon.</div>
                        <div class="label">Betrieb (Personal)</div>
                    </div>
                    <div class="tco-item">
                        <div class="value">~${formatCurrency(tco.monthlyEstimate)}€/Mon.</div>
                        <div class="label">TCO Gesamt</div>
                    </div>
                </div>
            </div>

            <div class="recommendation" style="margin-top: 15px; background: #f7fafc;">
                <strong>Bewertung:</strong> ${result.recommendation?.summary || 'Keine Zusammenfassung verfügbar.'}
            </div>
        </div>`;
    },

    // ═══════════════════════════════════════════════════════════════════════════════
    // HELPER METHODS
    // ═══════════════════════════════════════════════════════════════════════════════

    /**
     * Formatiert Zahlen für Währungsdarstellung
     */
    formatCurrency(value) {
        return (value || 0).toLocaleString('de-DE');
    }

};
