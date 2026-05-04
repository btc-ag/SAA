/**
 * SAA Results — Vergleichstabelle, Cost-Breakdown, Custom-Score-Hinweis,
 * Criteria-Info-Modal-Content und Provider-Ratings-Tabelle.
 *
 * Wird via Object-Spread aus saa-results.js in das SAAResults-Mixin gemerged.
 *
 * Aus js/modules/saa-results.js extrahiert (v4.1.1-Refactor, Tier 1).
 *
 * @module modules/saa-results-comparison
 */

import { architectureComponents, cloudProviders, selfBuildOptions } from '../saa-data.js';
import { IconMapper } from './saa-utils.js';

export const SAAResultsComparison = {
    /**
     * Rendert einen Hinweis wenn Custom Scores aktiv sind
     */
    renderCustomScoresNotice() {
        // Prüfe ob Custom Scores aktiv sind
        if (!this.analyzer || !this.analyzer.hasCustomScores()) {
            return '';
        }

        const customScores = this.analyzer.customScores;
        const customizedProviders = Object.keys(customScores).length;

        if (customizedProviders === 0) {
            return '';
        }

        return `
            <div style="margin-bottom: 1rem; padding: 0.875rem 1rem; background: rgba(90, 166, 231, 0.08); border-radius: 8px; border: 1px solid rgba(90, 166, 231, 0.25); display: flex; align-items: center; gap: 0.75rem;">
                <i class="fa-solid fa-pen-to-square" style="color: var(--btc-accent); font-size: 1.15rem;"></i>
                <div style="flex: 1;">
                    <div style="font-weight: 600; color: var(--btc-accent); margin-bottom: 0.25rem;">
                        Benutzerdefinierte Bewertungen aktiv
                    </div>
                    <div style="font-size: 0.875rem; color: var(--text-secondary);">
                        ${customizedProviders} Provider ${customizedProviders === 1 ? 'wurde' : 'wurden'} mit eigenen Scores bewertet.
                        Diese Änderungen sind in den Analyse-Ergebnissen berücksichtigt.
                    </div>
                </div>
                <a href="evaluation-criteria.html"
                   style="padding: 0.5rem 0.875rem; background: var(--btc-accent); color: white;
                          border-radius: 6px; text-decoration: none; font-size: 0.875rem; font-weight: 500;
                          white-space: nowrap; transition: all 0.2s;">
                    Verwalten
                </a>
            </div>
        `;
    },

    /**
     * Rendert die Service-Vergleichstabelle für eine App.
     *
     * Single-App: ohne Argument (oder mit explizitem currentApp) → nutzt this.currentApp.
     * Multi-App / Per-App-Accordion: mit konkreter App → nutzt deren Daten.
     *
     * @param {Object} [app] - ApplicationInstance; default = this.currentApp
     */
    renderComparisonTable(app = this.currentApp) {
        const requiredServices = this.analyzer.getRequiredServices(Array.from(app.selectedComponents));
        const topProviders = app.analysisResults.slice(0, 5);

        let html = `
            <div class="comparison-table-container">
                <table class="comparison-table">
                    <thead>
                        <tr>
                            <th>Service</th>
                            ${topProviders.map(r => `<th>${r.provider.name}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
        `;

        requiredServices.forEach(serviceId => {
            const serviceLabels = { container_registry: 'Container Registry', ai_ml: 'AI/ML' };
            const comp = architectureComponents.find(c => c.id === serviceId);
            const serviceName = comp ? comp.name : (serviceLabels[serviceId] || serviceId);

            html += `<tr><td>${serviceName}</td>`;

            topProviders.forEach(result => {
                const service = result.provider.services[serviceId];
                if (!service || !service.available) {
                    const selfBuild = selfBuildOptions[serviceId];
                    if (service?.maturity === 'planned') {
                        html += `<td><span class="service-badge planned">Geplant</span></td>`;
                    } else if (selfBuild) {
                        html += `<td>
                            <span class="service-badge self-build"
                                  data-tip="⚠️ Dieser Service ist bei diesem Anbieter NICHT nativ verfügbar.&#10;&#10;Alternative: Selbst aufbauen mit ${selfBuild.name}&#10;📅 Zusätzlicher Aufwand: ~${selfBuild.projectDays} Projekttage&#10;👥 Betrieb: ${selfBuild.operationsLevel === 'high' ? 'Hoch (eigenes Team nötig)' : selfBuild.operationsLevel === 'medium' ? 'Mittel (regelmäßige Wartung)' : 'Gering'}&#10;&#10;${selfBuild.description}">
                                🔧 ${selfBuild.name.split('/')[0]}
                            </span>
                        </td>`;
                    } else {
                        html += `<td><span class="service-badge none">—</span></td>`;
                    }
                } else {
                    const maturityClass = service.maturity === 'preview' ? 'preview' : 'production';
                    const tooltipContent = this.buildServiceTooltip(service);
                    html += `<td>
                        <span class="service-badge ${maturityClass} has-tooltip"
                              data-tip="${tooltipContent}">
                            ${service.name}
                        </span>
                        ${this.renderRatingIndicators(service)}
                    </td>`;
                }
            });

            html += '</tr>';
        });

        html += `
                    </tbody>
                </table>
            </div>
            <div class="table-legend">
                <div class="legend-section">
                    <span class="legend-title">Status:</span>
                    <span class="legend-item"><span class="service-badge production" style="font-size: 0.7rem; padding: 0.15rem 0.4rem;">Service</span> Verfügbar</span>
                    <span class="legend-item"><span class="service-badge preview" style="font-size: 0.7rem; padding: 0.15rem 0.4rem;">Preview</span> Beta/Preview</span>
                    <span class="legend-item"><span class="service-badge self-build" style="font-size: 0.7rem; padding: 0.15rem 0.4rem;">🔧</span> Nicht nativ - Self-Build nötig</span>
                    <span class="legend-item"><span class="service-badge none" style="font-size: 0.7rem; padding: 0.15rem 0.4rem;">—</span> Nicht verfügbar</span>
                </div>
                <div class="legend-section">
                    <span class="legend-title">Bewertung:</span>
                    <span class="legend-item">${IconMapper.toFontAwesome('🔒', 'provider')} = Kontrolle (Souveränität)</span>
                    <span class="legend-item">${IconMapper.toFontAwesome('⚡', 'utility')} = Leistung (Performance)</span>
                    <span class="legend-item" style="color: var(--btc-success);">■ Grün = Gut (70+)</span>
                    <span class="legend-item" style="color: var(--btc-warning);">■ Gelb = Mittel (40-69)</span>
                    <span class="legend-item" style="color: var(--btc-danger);">■ Rot = Niedrig (&lt;40)</span>
                </div>
            </div>
        `;

        return html;
    },

    /**
     * Öffnet das Kriterien-Info-Modal
     */
    openCriteriaInfo() {
        const overlay = document.getElementById('detailPopupOverlay');
        const title = document.getElementById('detailPopupTitle');
        const content = document.getElementById('detailPopupContent');

        if (!overlay || !content) return;

        title.textContent = 'Bewertungskriterien & Methodik';
        content.innerHTML = this.renderCriteriaInfoContent();
        overlay.classList.add('visible');
    },

    /**
     * Rendert den Inhalt des Kriterien-Info-Modals
     */
    renderCriteriaInfoContent() {
        const currentPreset = this.getPresetLabel();
        const weights = this.weights;

        return `
            <div class="criteria-info-content">
                <h4 style="color: var(--btc-accent); margin-top: 0;">Wie funktioniert die Cloud-Bewertung?</h4>
                <p style="color: var(--text-secondary); margin-bottom: 2rem;">
                    Die Sovereign Architecture Advisor Analyse bewertet Cloud-Anbieter anhand von vier Hauptkriterien,
                    die gewichtet in den Gesamt-Score einfließen. Die Gewichtung kann über die Einstellungen angepasst werden.
                </p>

                <!-- Aktuelles Profil -->
                <div class="current-profile-box">
                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                        <span style="font-size: 1.5rem;">${this.getPresetIcon()}</span>
                        <strong style="font-size: 1.1rem;">Aktuelles Profil: ${currentPreset}</strong>
                    </div>
                    <div class="profile-weights-grid">
                        <div class="weight-display">
                            <i class="fa-solid fa-lock"></i> Kontrolle: <strong>${weights.control}%</strong>
                        </div>
                        <div class="weight-display">
                            <i class="fa-solid fa-bolt"></i> Leistung: <strong>${weights.performance}%</strong>
                        </div>
                        <div class="weight-display">
                            <i class="fa-solid fa-box"></i> Verfügbarkeit: <strong>${weights.availability}%</strong>
                        </div>
                        <div class="weight-display">
                            <i class="fa-solid fa-coins"></i> Kosten: <strong>${weights.cost}%</strong>
                        </div>
                    </div>
                    <button class="criteria-edit-btn" onclick="app.openSettings()">
                        <i class="fa-solid fa-sliders"></i> Gewichtung anpassen
                    </button>
                </div>

                <!-- Kriterien-Details -->
                <div class="criteria-sections">
                    <div class="criteria-section">
                        <div class="criteria-header">
                            <i class="fa-solid fa-lock criteria-icon" style="color: #5A67D8;"></i>
                            <h5>1. Kontrolle & Souveränität (${weights.control}%)</h5>
                        </div>
                        <p class="criteria-description">
                            Bewertet die Datensouveränität und rechtliche Kontrolle über Ihre Infrastruktur.
                        </p>
                        <ul class="criteria-factors">
                            <li><strong>Jurisdiktion:</strong> In welchem Rechtsraum operiert der Anbieter? (EU/Deutschland = höher)</li>
                            <li><strong>DSGVO-Konformität:</strong> Einhaltung europäischer Datenschutzstandards</li>
                            <li><strong>Vendor Lock-in:</strong> Wie einfach ist ein Anbieterwechsel möglich?</li>
                            <li><strong>Transparenz:</strong> Offenheit über Datenverarbeitung und Zugriffe</li>
                            <li><strong>Eigentümerstruktur:</strong> Staatliche, europäische oder internationale Eigentümer</li>
                        </ul>
                        <div class="criteria-example">
                            <strong>Beispiel:</strong> DELOS Cloud (Score: 95) vs. AWS (Score: 30)
                            - Souveräne Clouds bieten höhere Datenkontrolle durch EU-Jurisdiktion und DSGVO-Compliance.
                        </div>
                    </div>

                    <div class="criteria-section">
                        <div class="criteria-header">
                            <i class="fa-solid fa-bolt criteria-icon" style="color: #F59E0B;"></i>
                            <h5>2. Leistung & Service-Umfang (${weights.performance}%)</h5>
                        </div>
                        <p class="criteria-description">
                            Misst die technische Leistungsfähigkeit und den Reifegrad der Services.
                        </p>
                        <ul class="criteria-factors">
                            <li><strong>Service-Reife:</strong> Sind Services GA (Generally Available) oder noch in Preview/Beta?</li>
                            <li><strong>Feature-Umfang:</strong> Anzahl und Qualität der verfügbaren Services</li>
                            <li><strong>Skalierbarkeit:</strong> Automatische Skalierung, globale Verfügbarkeit, Performance</li>
                            <li><strong>Innovation:</strong> KI/ML-Services, moderne Cloud-native Tools</li>
                            <li><strong>Ökosystem:</strong> Integration mit Tools, Partner, Marketplace</li>
                        </ul>
                        <div class="criteria-example">
                            <strong>Beispiel:</strong> AWS (Score: 95) vs. kleinere EU-Clouds (Score: 60-70)
                            - Hyperscaler bieten mehr Services und reifere Technologien.
                        </div>
                    </div>

                    <div class="criteria-section">
                        <div class="criteria-header">
                            <i class="fa-solid fa-box criteria-icon" style="color: #10B981;"></i>
                            <h5>3. Verfügbarkeit & Service-Abdeckung (${weights.availability}%)</h5>
                        </div>
                        <p class="criteria-description">
                            Anteil der benötigten Services, die bei einem Anbieter verfügbar sind.
                        </p>
                        <ul class="criteria-factors">
                            <li><strong>Service-Coverage:</strong> Wie viele Ihrer benötigten Services sind verfügbar?</li>
                            <li><strong>Preview-Services:</strong> Services in Preview zählen zu 50% (erhöhtes Risiko)</li>
                            <li><strong>Fehlende Services:</strong> Erfordern Self-Build oder Drittanbieter-Integration</li>
                            <li><strong>SLA-Garantien:</strong> Verfügbarkeitsgarantien und Support-Level</li>
                        </ul>
                        <div class="criteria-formula">
                            <strong>Formel:</strong> Coverage = (Verfügbare Services + Preview × 0.5) / Benötigte Services × 100%
                        </div>
                        <div class="criteria-example">
                            <strong>Beispiel:</strong> 8 verfügbare + 2 Preview von 10 benötigten = (8 + 2×0.5) / 10 = 90% Coverage
                        </div>
                    </div>

                    <div class="criteria-section">
                        <div class="criteria-header">
                            <i class="fa-solid fa-coins criteria-icon" style="color: #EF4444;"></i>
                            <h5>4. Kosteneffizienz & TCO (${weights.cost}%)</h5>
                        </div>
                        <p class="criteria-description">
                            Gesamtkosten (Total Cost of Ownership) über drei Dimensionen.
                        </p>
                        <ul class="criteria-factors">
                            <li><strong>Verbrauchskosten:</strong> Monatliche Cloud-Infrastruktur-Kosten (Compute, Storage, etc.)</li>
                            <li><strong>Betriebsaufwand:</strong> FTE-Kosten für Operations (Monitoring, Updates, Support)</li>
                            <li><strong>Projektaufwand:</strong> Initiale Setup-Kosten in Personentagen</li>
                            <li><strong>Self-Build-Aufwand:</strong> Zusätzlicher Aufwand für fehlende Services</li>
                        </ul>
                        <div class="criteria-formula">
                            <strong>Score-Berechnung:</strong> Günstigster Anbieter = 100 Punkte, teuerster = 30 Punkte (linear interpoliert)
                        </div>
                        <div class="criteria-example">
                            <strong>Beispiel:</strong> Anbieter A: 2.500€/Monat (Score: 100) vs. Anbieter B: 5.000€/Monat (Score: ~65)
                        </div>
                    </div>
                </div>

                <!-- Gesamt-Score Berechnung -->
                <div class="score-calculation-box">
                    <h4 style="margin-top: 0;"><i class="fa-solid fa-calculator"></i> Gesamt-Score Berechnung</h4>
                    <div class="formula-display">
                        Score = (Kontrolle × ${(weights.control / 100).toFixed(2)}) +
                                (Leistung × ${(weights.performance / 100).toFixed(2)}) +
                                (Verfügbarkeit × ${(weights.availability / 100).toFixed(2)}) +
                                (Kosteneffizienz × ${(weights.cost / 100).toFixed(2)})
                    </div>
                    ${this.maturitySettings.enabled ? `
                    <div class="maturity-factor-info">
                        <strong><i class="fa-solid fa-microscope"></i> Reife-Faktor:</strong>
                        Der finale Score wird mit einem Reife-Faktor multipliziert, der Preview-Services
                        (${this.maturitySettings.previewPenalty}% Abzug) und fehlende Services
                        (${this.maturitySettings.missingPenalty}% Abzug) berücksichtigt.
                        <br><br>
                        <em>Beispiel:</em> 2 Preview + 1 fehlend = Faktor ${(1 - (2 * this.maturitySettings.previewPenalty + 1 * this.maturitySettings.missingPenalty) / 100).toFixed(2)}
                        (Score wird mit 0.93 multipliziert)
                    </div>
                    ` : ''}
                </div>

                <!-- TCO-Einstellungen -->
                <div class="tco-settings-info">
                    <h4><i class="fa-solid fa-gears"></i> Aktuelle TCO-Einstellungen</h4>
                    <div class="settings-status">
                        <div class="setting-item ${this.operationsSettings.includeInCosts ? 'enabled' : 'disabled'}">
                            <i class="fa-solid ${this.operationsSettings.includeInCosts ? 'fa-check-circle' : 'fa-circle-xmark'}"></i>
                            <span>Betriebsaufwand: <strong>${this.operationsSettings.includeInCosts ? 'In Bewertung einbezogen' : 'Nur angezeigt'}</strong></span>
                        </div>
                        <div class="setting-item ${this.projectEffortSettings.includeInCosts ? 'enabled' : 'disabled'}">
                            <i class="fa-solid ${this.projectEffortSettings.includeInCosts ? 'fa-check-circle' : 'fa-circle-xmark'}"></i>
                            <span>Projektaufwand: <strong>${this.projectEffortSettings.includeInCosts ? 'In Bewertung einbezogen' : 'Nur angezeigt'}</strong></span>
                        </div>
                    </div>
                </div>

                <!-- Datenquellen -->
                <div class="data-sources-info">
                    <h4><i class="fa-solid fa-database"></i> Datenquellen & Methodik</h4>
                    <ul>
                        <li><strong>Provider-Daten:</strong> Manuelle Recherche und Analyse der Service-Portfolios (Stand: Januar 2025)</li>
                        <li><strong>Preis-Schätzungen:</strong> Basierend auf öffentlichen Preis-Rechnern und Durchschnittswerten</li>
                        <li><strong>Betriebsaufwand:</strong> Erfahrungswerte aus Cloud-Migration-Projekten (FTE-Faktoren)</li>
                        <li><strong>Service-Bewertungen:</strong> Kombination aus Provider-Level und Service-Level Ratings</li>
                        <li><strong>Updates:</strong> Regelmäßige Aktualisierung der Provider-Daten und Preise</li>
                    </ul>
                </div>

                <!-- Provider-Bewertungen -->
                <div class="provider-ratings-section">
                    <h4><i class="fa-solid fa-chart-bar"></i> Cloud-Provider Bewertungen im Detail</h4>
                    <p style="color: var(--text-secondary); margin-bottom: 1rem;">
                        Sehen Sie, wie jeder Cloud-Provider bei den einzelnen Kriterien bewertet wurde.
                    </p>
                    <button class="show-provider-ratings-btn" onclick="app.toggleProviderRatings()">
                        <i class="fa-solid fa-table"></i> Provider-Bewertungen anzeigen
                    </button>
                    <div id="providerRatingsTable" class="provider-ratings-table-container" style="display: none;">
                        ${this.renderProviderRatingsTable()}
                    </div>
                </div>

                <div style="margin-top: 2rem; padding: 1rem; background: var(--bg-secondary); border-radius: 8px; border-left: 3px solid var(--btc-accent);">
                    <strong><i class="fa-solid fa-lightbulb"></i> Tipp:</strong>
                    Passen Sie die Gewichtung in den Einstellungen an Ihre Prioritäten an.
                    Für maximale Souveränität wählen Sie das Profil "Maximale Souveränität",
                    für beste Performance "Performance First".
                </div>
            </div>
        `;
    },

    /**
     * Toggle Provider-Ratings Tabelle
     */
    toggleProviderRatings() {
        const container = document.getElementById('providerRatingsTable');
        const btn = document.querySelector('.show-provider-ratings-btn');

        if (!container || !btn) return;

        const isVisible = container.style.display !== 'none';

        if (isVisible) {
            container.style.display = 'none';
            btn.innerHTML = '<i class="fa-solid fa-table"></i> Provider-Bewertungen anzeigen';
        } else {
            container.style.display = 'block';
            btn.innerHTML = '<i class="fa-solid fa-eye-slash"></i> Provider-Bewertungen verbergen';
            // Scroll zu Tabelle
            setTimeout(() => {
                container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 100);
        }
    },

    /**
     * Rendert die Provider-Bewertungstabelle
     */
    renderProviderRatingsTable() {
        // Verwende die aktuellen Analyse-Ergebnisse oder alle Provider
        let providersToShow = [];

        if (this.isMultiAppMode && this.aggregatedResults) {
            // Multi-App: Zeige aggregierte Provider
            providersToShow = this.aggregatedResults.aggregatedProviders;
        } else if (this.currentApp.analysisResults && this.currentApp.analysisResults.length > 0) {
            // Single-App: Zeige analysierte Provider
            providersToShow = this.currentApp.analysisResults;
        } else {
            // Fallback: Zeige alle Provider mit Basis-Daten
            providersToShow = cloudProviders.map(provider => ({
                provider: provider,
                score: {
                    controlScore: provider.control,
                    performanceScore: provider.performance,
                    availabilityScore: 0,
                    costScore: 0,
                    total: ((provider.control + provider.performance) / 2).toFixed(1)
                },
                serviceAnalysis: {
                    coverage: 0
                }
            }));
        }

        // Nach Gesamt-Score sortieren
        const sortedProviders = [...providersToShow].sort((a, b) => {
            const scoreA = a.aggregatedScore || a.score?.total || 0;
            const scoreB = b.aggregatedScore || b.score?.total || 0;
            return scoreB - scoreA;
        });

        const tableRows = sortedProviders.map((result, index) => {
            const provider = result.provider;
            const score = result.score || {};
            const isTopPick = index === 0;

            // Für aggregierte Ergebnisse (Multi-App)
            const controlScore = result.aggregatedScore ?
                Math.round(provider.control) : (score.controlScore || 0);
            const performanceScore = result.aggregatedScore ?
                Math.round(provider.performance) : (score.performanceScore || 0);
            const availabilityScore = result.serviceAnalysis?.coverage || score.availabilityScore || 0;
            const costScore = score.costScore || 0;
            const totalScore = result.aggregatedScore || score.total || 0;

            // Kategorie-Namen
            const categoryNames = {
                hyperscaler: 'Hyperscaler',
                sovereign: 'Souverän',
                eu: 'EU',
                private: 'Private',
                hybrid: 'Hybrid'
            };

            // Farben für Scores
            const getScoreColor = (score) => {
                if (score >= 80) return 'var(--btc-success)';
                if (score >= 60) return 'var(--btc-warning)';
                return 'var(--btc-danger)';
            };

            return `
                <tr class="${isTopPick ? 'top-pick-row' : ''}">
                    <td class="provider-name-cell">
                        <div class="provider-name-with-badge">
                            <div class="provider-logo-mini" style="background: ${provider.color}20; color: ${provider.color};">
                                ${provider.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                                <strong>${provider.name}</strong>
                                <div class="provider-category-mini">${categoryNames[provider.category] || provider.category}</div>
                            </div>
                            ${isTopPick ? '<span class="top-pick-badge">Top</span>' : ''}
                        </div>
                    </td>
                    <td class="score-cell">
                        <div class="score-bar-container">
                            <div class="score-bar" style="width: ${controlScore}%; background: ${getScoreColor(controlScore)};"></div>
                            <span class="score-value">${Math.round(controlScore)}</span>
                        </div>
                        <div class="score-explanation">
                            ${this.getControlScoreExplanation(provider)}
                        </div>
                    </td>
                    <td class="score-cell">
                        <div class="score-bar-container">
                            <div class="score-bar" style="width: ${performanceScore}%; background: ${getScoreColor(performanceScore)};"></div>
                            <span class="score-value">${Math.round(performanceScore)}</span>
                        </div>
                        <div class="score-explanation">
                            ${this.getPerformanceScoreExplanation(provider)}
                        </div>
                    </td>
                    <td class="score-cell">
                        <div class="score-bar-container">
                            <div class="score-bar" style="width: ${availabilityScore}%; background: ${getScoreColor(availabilityScore)};"></div>
                            <span class="score-value">${Math.round(availabilityScore)}%</span>
                        </div>
                        <div class="score-explanation">
                            ${result.serviceAnalysis ? `${result.serviceAnalysis.available?.length || 0} verfügbar` : 'N/A'}
                        </div>
                    </td>
                    <td class="score-cell">
                        <div class="score-bar-container">
                            <div class="score-bar" style="width: ${costScore}%; background: ${getScoreColor(costScore)};"></div>
                            <span class="score-value">${Math.round(costScore)}</span>
                        </div>
                        <div class="score-explanation">
                            ${result.tcoEstimate ? `~${result.tcoEstimate.monthlyEstimate || 0}€/Monat` : 'N/A'}
                        </div>
                    </td>
                    <td class="total-score-cell">
                        <div class="total-score-value" style="color: ${getScoreColor(totalScore)};">
                            ${typeof totalScore === 'number' ? totalScore.toFixed(1) : totalScore}
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        return `
            <div class="provider-ratings-table-wrapper">
                <table class="provider-ratings-table">
                    <thead>
                        <tr>
                            <th style="width: 20%;">Cloud-Provider</th>
                            <th style="width: 16%;">
                                <i class="fa-solid fa-lock"></i> Kontrolle
                                <div class="weight-badge">${this.weights.control}%</div>
                            </th>
                            <th style="width: 16%;">
                                <i class="fa-solid fa-bolt"></i> Leistung
                                <div class="weight-badge">${this.weights.performance}%</div>
                            </th>
                            <th style="width: 16%;">
                                <i class="fa-solid fa-box"></i> Verfügbarkeit
                                <div class="weight-badge">${this.weights.availability}%</div>
                            </th>
                            <th style="width: 16%;">
                                <i class="fa-solid fa-coins"></i> Kosten
                                <div class="weight-badge">${this.weights.cost}%</div>
                            </th>
                            <th style="width: 16%;">
                                <i class="fa-solid fa-star"></i> Gesamt-Score
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
                </table>

                <div class="ratings-legend">
                    <h5><i class="fa-solid fa-info-circle"></i> Legende</h5>
                    <div class="legend-grid">
                        <div class="legend-item">
                            <div class="legend-color" style="background: var(--btc-success);"></div>
                            <span>80-100: Sehr gut</span>
                        </div>
                        <div class="legend-item">
                            <div class="legend-color" style="background: var(--btc-warning);"></div>
                            <span>60-79: Gut</span>
                        </div>
                        <div class="legend-item">
                            <div class="legend-color" style="background: var(--btc-danger);"></div>
                            <span>0-59: Verbesserungsbedarf</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Erklärt den Kontroll-Score eines Providers
     */
    getControlScoreExplanation(provider) {
        const score = provider.control;
        if (score >= 80) {
            return 'Souveräne Cloud, EU-Jurisdiktion';
        } else if (score >= 60) {
            return 'EU-Anbieter, gute Kontrolle';
        } else if (score >= 40) {
            return 'Hybrid-Lösung, mittlere Kontrolle';
        } else {
            return 'Hyperscaler, eingeschränkte Kontrolle';
        }
    },

    /**
     * Erklärt den Performance-Score eines Providers
     */
    getPerformanceScoreExplanation(provider) {
        const score = provider.performance;
        if (score >= 90) {
            return 'Umfangreiches Service-Portfolio';
        } else if (score >= 75) {
            return 'Gutes Service-Angebot';
        } else if (score >= 60) {
            return 'Basis-Services verfügbar';
        } else {
            return 'Begrenztes Angebot';
        }
    },

    /**
     * Rendert die Kostenaufschlüsselung für die Detailanalyse
     */
    renderCostBreakdown(tco) {
        if (!tco || !tco.consumption?.details) {
            return '';
        }

        // Verbrauchskosten-Details
        const consumptionRows = tco.consumption.details.map(detail => {
            const levelClass = detail.level === 'low' ? 'low' : detail.level === 'high' ? 'high' : 'medium';
            return `
                <tr>
                    <td>${detail.name || detail.id}</td>
                    <td><span class="cost-level-badge ${levelClass}">${detail.level}</span></td>
                    <td style="text-align: right;">${detail.estimate.toLocaleString('de-DE')}€</td>
                    <td style="color: var(--text-secondary); font-size: 0.8rem;">${detail.breakdown || '-'}</td>
                </tr>
            `;
        }).join('');

        // Betriebskosten-Details
        const operationsRows = tco.operations?.details?.map(detail => {
            const levelClass = detail.level === 'low' ? 'low' : detail.level === 'high' ? 'high' : 'medium';
            const rowStyle = detail.isAppBaseOps
                ? ' style="border-top: 1px solid var(--border-color, #e2e8f0); font-weight: 500;"'
                : '';
            const nameSuffix = detail.isSelfBuild
                ? ' <span style="color: var(--btc-warning);">(Self-Build)</span>'
                : detail.isAppBaseOps
                    ? ' <span style="color: var(--text-secondary); font-size: 0.8em; font-weight: normal;">(Plattformbetrieb)</span>'
                    : '';
            return `
                <tr${rowStyle}>
                    <td>${detail.name || detail.id}${nameSuffix}</td>
                    <td><span class="cost-level-badge ${levelClass}">${detail.level}</span></td>
                    <td style="text-align: right;">${(detail.fteEstimate * 8000).toLocaleString('de-DE')}€</td>
                    <td style="color: var(--text-secondary); font-size: 0.8rem;">${detail.fteEstimate} FTE</td>
                </tr>
            `;
        }).join('') || '';

        // Projektaufwand-Details
        const projectRows = tco.projectEffort?.details?.map(detail => {
            const levelClass = detail.level === 'low' ? 'low' : detail.level === 'high' ? 'high' : 'medium';
            return `
                <tr>
                    <td>${detail.name || detail.id}</td>
                    <td><span class="cost-level-badge ${levelClass}">${detail.level}</span></td>
                    <td style="text-align: right;">${detail.days} PT</td>
                    <td style="color: var(--text-secondary); font-size: 0.8rem;">~${(detail.days * 800).toLocaleString('de-DE')}€</td>
                </tr>
            `;
        }).join('') || '';

        // Self-Build-Details wenn vorhanden
        let selfBuildSection = '';
        if (tco.selfBuild?.required && tco.selfBuild.details?.length > 0) {
            const selfBuildRows = tco.selfBuild.details.map(detail => `
                <tr>
                    <td>🔧 ${detail.solution}</td>
                    <td><span class="cost-level-badge high">${detail.effort}</span></td>
                    <td style="text-align: right;">${detail.days} PT</td>
                    <td style="color: var(--text-secondary); font-size: 0.8rem;">~${(detail.days * 800).toLocaleString('de-DE')}€</td>
                </tr>
            `).join('');

            selfBuildSection = `
                <div class="cost-breakdown-section">
                    <h5 class="cost-breakdown-title">🔧 Self-Build Aufwand (${tco.selfBuild.totalDays} PT)</h5>
                    <table class="cost-breakdown-table">
                        <thead>
                            <tr>
                                <th>Lösung</th>
                                <th>Aufwand</th>
                                <th style="text-align: right;">Tage</th>
                                <th>Kosten (800€/PT)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${selfBuildRows}
                        </tbody>
                    </table>
                </div>
            `;
        }

        // Pricing Info vom Analyzer holen
        const pricingInfo = this.analyzer?.getPricingInfo?.() || { source: 'Fallback', currency: 'EUR' };

        return `
            <h4 style="margin: 1.5rem 0 1rem; color: var(--btc-heading);">${IconMapper.toFontAwesome('📊', 'utility')} Kostenaufschlüsselung</h4>

            <div class="pricing-info-box" style="background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(16, 185, 129, 0.1)); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 8px; padding: 12px 16px; margin-bottom: 1rem; font-size: 0.85rem;">
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
                    <span style="font-size: 1.2rem;">${IconMapper.toFontAwesome('📍', 'utility')}</span>
                    <div>
                        <strong>Preisbasis:</strong> ${pricingInfo.source || 'Fallback'} |
                        <strong>Region:</strong> Frankfurt (DE) |
                        <strong>Währung:</strong> ${pricingInfo.currency || 'EUR'}
                        ${pricingInfo.lastUpdated ? `| <strong>Stand:</strong> ${pricingInfo.lastUpdated}` : ''}
                    </div>
                </div>
            </div>

            <div class="cost-breakdown-section">
                <h5 class="cost-breakdown-title">${IconMapper.toFontAwesome('☁️', 'component')} Verbrauchskosten (~${tco.consumption.monthlyEstimate.toLocaleString('de-DE')}€/Monat)</h5>
                <table class="cost-breakdown-table">
                    <thead>
                        <tr>
                            <th>Service</th>
                            <th><span class="level-tooltip" data-tip="Ressourcen-Intensität: low = wenig, medium = mittel, high = hoch">Level ${IconMapper.toFontAwesome('ℹ️', 'utility')}</span></th>
                            <th style="text-align: right;">Kosten/Monat</th>
                            <th>Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${consumptionRows}
                    </tbody>
                </table>
            </div>

            <div class="cost-breakdown-section${!tco.operations?.includedInCosts ? ' operations-excluded' : ''}">
                <h5 class="cost-breakdown-title">${IconMapper.toFontAwesome('👥', 'utility')} Betriebsaufwand (~${(tco.operations?.monthlyPersonnelCost || 0).toLocaleString('de-DE')}€/Monat, ${tco.operations?.totalFTE || 0} FTE)${!tco.operations?.includedInCosts ? ' <span style="font-size: 0.8em; color: var(--text-secondary);">(nicht in TCO-Berechnung)</span>' : ''}</h5>
                <table class="cost-breakdown-table">
                    <thead>
                        <tr>
                            <th>Service</th>
                            <th><span class="level-tooltip" data-tip="Betriebs-Komplexität: very_low = minimal, low = gering, medium = mittel, high = hoch">Level ${IconMapper.toFontAwesome('ℹ️', 'utility')}</span></th>
                            <th style="text-align: right;">Kosten/Monat</th>
                            <th>FTE-Anteil</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${operationsRows}
                    </tbody>
                </table>
            </div>

            <div class="cost-breakdown-section${!tco.projectEffort?.includedInCosts ? ' project-effort-excluded' : ''}">
                <h5 class="cost-breakdown-title">${IconMapper.toFontAwesome('📋', 'utility')} Projektaufwand (~${tco.projectEffort?.totalDays || 0} Personentage)${!tco.projectEffort?.includedInCosts ? ' <span style="font-size: 0.8em; color: var(--text-secondary);">(nicht in TCO-Berechnung)</span>' : ''}</h5>
                <table class="cost-breakdown-table">
                    <thead>
                        <tr>
                            <th>Service</th>
                            <th><span class="level-tooltip" data-tip="Implementierungs-Aufwand: low = gering, medium = mittel, high = hoch">Level ${IconMapper.toFontAwesome('ℹ️', 'utility')}</span></th>
                            <th style="text-align: right;">Aufwand</th>
                            <th>Kosten (800€/PT)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${projectRows}
                    </tbody>
                </table>
            </div>

            ${selfBuildSection}
        `;
    },
};
