/**
 * SAA Results — Detail-Rendering: Provider-Detail-Popup, Service-Tooltips,
 * Rating-Indicators und Popup-Lifecycle (Open/Close).
 *
 * Wird via Object-Spread aus saa-results.js in das SAAResults-Mixin gemerged.
 *
 * Aus js/modules/saa-results.js extrahiert (v4.1.1-Refactor, Tier 1).
 *
 * @module modules/saa-results-detail
 */

import { IconMapper } from './saa-utils.js';
import { computeRatingColors } from './results-compute.js';

export const SAAResultsDetail = {
    /**
     * Baut den Tooltip-Inhalt für einen Service
     * Gibt JSON zurück, das später vom Tooltip-System verarbeitet wird
     */
    buildServiceTooltip(service) {
        // Speichere Service-Daten als JSON im Attribut
        // Escape HTML entities für sicheres Speichern im data-Attribut
        const jsonStr = JSON.stringify({
            name: service.name,
            control: service.control,
            controlReason: service.controlReason,
            performance: service.performance,
            performanceReason: service.performanceReason,
            consumption: service.consumption,
            operations: service.operations,
            projectEffort: service.projectEffort
        });

        // HTML-Entities escapen
        return jsonStr
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    },

    /**
     * Formatiert Service-Daten als HTML für Tooltip
     */
    formatServiceTooltipHTML(service) {
        const controlColor = service.control >= 70 ? '#38a169' : service.control >= 40 ? '#ed8936' : '#e53e3e';
        const perfColor = service.performance >= 70 ? '#38a169' : service.performance >= 40 ? '#ed8936' : '#e53e3e';

        // Kosten-Levels verständlich übersetzen
        const costLabels = {
            very_low: 'Sehr günstig (~30€/Mon.)',
            low: 'Günstig (~50€/Mon.)',
            medium: 'Mittel (~200€/Mon.)',
            high: 'Hoch (~500€/Mon.)',
            very_high: 'Sehr hoch (~1000€/Mon.)'
        };
        const opsLabels = {
            very_low: 'Minimal (Self-Service)',
            low: 'Gering (~2h/Mon.)',
            medium: 'Mittel (~8h/Mon.)',
            high: 'Hoch (~20h/Mon.)',
            very_high: 'Sehr hoch (~40h/Mon.)'
        };
        const projectLabels = {
            very_low: 'Trivial (~1 PT)',
            low: 'Einfach (~3 PT)',
            medium: 'Mittel (~8 PT)',
            high: 'Aufwändig (~15 PT)',
            very_high: 'Komplex (~30 PT)'
        };

        let html = `<strong style="font-size: 0.95rem; display: block; margin-bottom: 0.5rem;">${service.name}</strong>`;
        html += `<div style="border-bottom: 1px solid #cbd5e0; margin-bottom: 0.5rem;"></div>`;

        html += `<div style="margin-bottom: 0.4rem;">`;
        html += `<span style="color: ${controlColor};">${IconMapper.toFontAwesome('🔒', 'utility')}</span> `;
        html += `<strong>Kontrolle:</strong> ${service.control}/100`;
        html += `</div>`;
        if (service.controlReason) {
            html += `<div style="margin-left: 1.5rem; margin-bottom: 0.5rem; color: #718096; font-size: 0.85rem;">→ ${service.controlReason}</div>`;
        }

        html += `<div style="margin-bottom: 0.4rem; margin-top: 0.5rem;">`;
        html += `<span style="color: ${perfColor};">${IconMapper.toFontAwesome('⚡', 'utility')}</span> `;
        html += `<strong>Leistung:</strong> ${service.performance}/100`;
        html += `</div>`;
        if (service.performanceReason) {
            html += `<div style="margin-left: 1.5rem; margin-bottom: 0.5rem; color: #718096; font-size: 0.85rem;">→ ${service.performanceReason}</div>`;
        }

        html += `<div style="border-top: 1px solid #e2e8f0; margin: 0.75rem 0 0.5rem 0; padding-top: 0.5rem;">`;
        html += `<div style="margin-bottom: 0.3rem;"><span style="color: #5AA6E7;">${IconMapper.toFontAwesome('💰', 'utility')}</span> <strong>Kosten:</strong> ${costLabels[service.consumption] || costLabels['medium']}</div>`;
        html += `<div style="margin-bottom: 0.3rem;"><span style="color: #5AA6E7;">${IconMapper.toFontAwesome('👥', 'utility')}</span> <strong>Betrieb:</strong> ${opsLabels[service.operations] || opsLabels['medium']}</div>`;
        html += `<div><span style="color: #5AA6E7;">${IconMapper.toFontAwesome('📅', 'utility')}</span> <strong>Projekt:</strong> ${projectLabels[service.projectEffort] || projectLabels['medium']}</div>`;
        html += `</div>`;

        return html;
    },

    /**
     * Rendert kompakte Score-Anzeige für Control/Performance
     */
    renderRatingIndicators(service) {
        const { controlColor, perfColor } = computeRatingColors(service);

        return `
            <div class="rating-mini-bars">
                <div class="rating-mini-bar" title="Kontrolle: ${service.control}/100 - Datensouveränität & Compliance">
                    <span class="rating-mini-label">${IconMapper.toFontAwesome('🔒', 'provider')}</span>
                    <div class="rating-mini-track">
                        <div class="rating-mini-fill" style="width: ${service.control}%; background: ${controlColor};"></div>
                    </div>
                    <span class="rating-mini-value">${service.control}</span>
                </div>
                <div class="rating-mini-bar" title="Leistung: ${service.performance}/100 - Features & Performance">
                    <span class="rating-mini-label">${IconMapper.toFontAwesome('⚡', 'utility')}</span>
                    <div class="rating-mini-track">
                        <div class="rating-mini-fill" style="width: ${service.performance}%; background: ${perfColor};"></div>
                    </div>
                    <span class="rating-mini-value">${service.performance}</span>
                </div>
            </div>
        `;
    },

    /**
     * Initialisiert Tooltips für Service-Badges
     */
    initTooltips() {
        // Konvertiere data-tip zu data-tooltip für das globale Tooltip-System
        document.querySelectorAll('[data-tip]').forEach(el => {
            const tip = el.getAttribute('data-tip');
            if (tip) {
                // JSON-Strings bleiben unverändert, nur Text wird konvertiert
                if (tip.startsWith('{')) {
                    el.setAttribute('data-tooltip', tip);
                } else {
                    el.setAttribute('data-tooltip', tip.replace(/&#10;/g, '\n'));
                }
            }
        });

        // Setze auch title-Attribute als Fallback (nur für Nicht-JSON)
        document.querySelectorAll('.has-tooltip').forEach(el => {
            const tooltip = el.getAttribute('data-tooltip');
            if (tooltip && !tooltip.startsWith('{')) {
                el.setAttribute('title', tooltip.replace(/&#10;/g, '\n'));
            }
        });

        document.querySelectorAll('[data-tooltip]').forEach(el => {
            const tooltip = el.getAttribute('data-tooltip');
            if (tooltip && !el.getAttribute('title') && !tooltip.startsWith('{')) {
                el.setAttribute('title', tooltip.replace(/&#10;/g, '\n'));
            }
        });
    },

    // ── Popup, Detail-Rendering & Provider-Ratings ────────────────────────

    openDetailPopup(providerResult) {
        const overlay = document.getElementById('detailPopupOverlay');
        const title = document.getElementById('detailPopupTitle');
        const content = document.getElementById('detailPopupContent');

        if (!overlay || !content) return;

        title.textContent = `${providerResult.provider.name} - Detailanalyse`;
        content.innerHTML = this.renderProviderDetail(providerResult);
        overlay.classList.add('visible');
    },

    /**
     * Öffnet das Detail-Popup für aggregierte Portfolio-Daten
     */
    openAggregatedDetailPopup(aggregatedProvider, aggregatedTCO) {
        const overlay = document.getElementById('detailPopupOverlay');
        const title = document.getElementById('detailPopupTitle');
        const content = document.getElementById('detailPopupContent');

        if (!overlay || !content) return;

        title.textContent = `${aggregatedProvider.provider.name} - Portfolio-Detailanalyse`;
        content.innerHTML = this.renderProviderDetail(aggregatedProvider, { isAggregated: true, aggregatedTCO });
        overlay.classList.add('visible');
    },

    /**
     * Schließt das Detail-Popup
     */
    closeDetailPopup() {
        const overlay = document.getElementById('detailPopupOverlay');
        if (overlay) {
            overlay.classList.remove('visible');
        }
    },

    /**
     * Rendert den Inhalt des Detail-Popups — unifizierter Pfad für Single + Aggregated.
     *
     * @param {Object} result - Single-App: vollständiges providerResult,
     *                          Aggregated: aggregatedProvider-Objekt
     * @param {Object} [opts]
     * @param {boolean} [opts.isAggregated=false]
     * @param {Object}  [opts.aggregatedTCO=null] - aggregatedTCO[providerId] (nur Aggregated)
     */
    renderProviderDetail(result, opts = {}) {
        const { isAggregated = false, aggregatedTCO = null } = opts;
        const provider = result.provider;
        const categoryIcons = this._PROVIDER_CATEGORY_ICONS;
        const categoryNames = this._PROVIDER_CATEGORY_NAMES;

        // Header — bei Aggregated mit App-Anzahl, bei Single mit Beschreibung
        const subtitle = isAggregated
            ? `${categoryNames[provider.category]} | Portfolio-Analyse über ${result.appScores.length} Anwendungen`
            : `${categoryNames[provider.category]} | ${provider.description || ''}`;

        const headerHtml = `
            <div class="provider-detail-header">
                <div class="provider-detail-logo" style="background: ${provider.color}20; color: ${provider.color};">
                    ${IconMapper.toFontAwesome(categoryIcons[provider.category] || '☁️', 'provider')}
                </div>
                <div class="provider-detail-info">
                    <h4>${provider.name}</h4>
                    <p>${subtitle}</p>
                </div>
            </div>
        `;

        if (isAggregated) {
            const { aggregatedScore, serviceAnalysis, appScores } = result;
            const tco = aggregatedTCO;

            // TCO-Details per App gruppieren
            const tcoByApp = {};
            if (result.tcoEstimate?.consumption?.details) {
                result.tcoEstimate.consumption.details.forEach(detail => {
                    const appName = detail.appName || 'Unbekannt';
                    if (!tcoByApp[appName]) tcoByApp[appName] = [];
                    tcoByApp[appName].push(detail);
                });
            }

            return `
                ${headerHtml}

                <div class="provider-detail-scores">
                    <div class="detail-score-card">
                        <div class="detail-score-value">${aggregatedScore.toFixed(1)}</div>
                        <div class="detail-score-label">Portfolio-Score</div>
                    </div>
                    <div class="detail-score-card">
                        <div class="detail-score-value">${Math.round(serviceAnalysis.coverage)}%</div>
                        <div class="detail-score-label">Abdeckung</div>
                    </div>
                    <div class="detail-score-card">
                        <div class="detail-score-value">${appScores.length}</div>
                        <div class="detail-score-label">Anwendungen</div>
                    </div>
                    <div class="detail-score-card">
                        <div class="detail-score-value">${serviceAnalysis.totalRequired}</div>
                        <div class="detail-score-label">Komponenten</div>
                    </div>
                </div>

                <h4 style="margin: 1.5rem 0 1rem; color: var(--btc-heading);">${IconMapper.toFontAwesome('💰', 'utility')} Aggregierte TCO-Schätzung</h4>
                <div class="provider-detail-scores">
                    <div class="detail-score-card">
                        <div class="detail-score-value">~${tco.totalMonthly.toLocaleString('de-DE')}€</div>
                        <div class="detail-score-label">Gesamt-TCO/Monat</div>
                    </div>
                    <div class="detail-score-card">
                        <div class="detail-score-value">~${tco.monthlyInfrastructure.toLocaleString('de-DE')}€</div>
                        <div class="detail-score-label">Infrastruktur</div>
                    </div>
                    <div class="detail-score-card${!tco.includedInCosts ? ' operations-excluded' : ''}">
                        <div class="detail-score-value">~${tco.monthlyOperations.toLocaleString('de-DE')}€</div>
                        <div class="detail-score-label">Betrieb${!tco.includedInCosts ? ' <span style="font-size: 0.7em; opacity: 0.7;">(nicht in TCO)</span>' : ''}</div>
                    </div>
                    <div class="detail-score-card${!tco.projectEffortIncluded ? ' project-effort-excluded' : ''}">
                        <div class="detail-score-value">~${tco.totalProjectDays || '-'} PT</div>
                        <div class="detail-score-label">Projektaufwand${!tco.projectEffortIncluded ? ' <span style="font-size: 0.7em; opacity: 0.7;">(nicht in TCO)</span>' : ''}</div>
                    </div>
                </div>

                <h4 style="margin: 1.5rem 0 1rem; color: var(--btc-heading);">${IconMapper.toFontAwesome('📊', 'utility')} Scores pro Anwendung</h4>
                <div class="app-scores-breakdown">
                    ${appScores.map((appScore, index) => `
                        <div class="app-score-item" style="padding: 0.75rem; background: var(--bg-secondary); border-radius: 8px; margin-bottom: 0.5rem; cursor: pointer; transition: all 0.2s ease;"
                             onclick="app.scrollToAppBreakdown(${index})"
                             onmouseover="this.style.background='var(--bg-tertiary)'; this.style.transform='translateX(4px)'"
                             onmouseout="this.style.background='var(--bg-secondary)'; this.style.transform='translateX(0)'">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <div>
                                    <strong>${appScore.appName}</strong>
                                    <span style="color: var(--text-secondary); margin-left: 0.5rem; font-size: 0.85rem;">(${appScore.weight} Komponenten)</span>
                                    <span style="color: var(--btc-primary); margin-left: 0.5rem; font-size: 0.75rem;">→ Details</span>
                                </div>
                                <div style="font-size: 1.1rem; font-weight: 600; color: var(--btc-accent);">${appScore.score.toFixed(1)}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>

                <h4 style="margin: 1.5rem 0 1rem; color: var(--btc-heading);">${IconMapper.toFontAwesome('☁️', 'component')} Infrastrukturkosten nach Anwendung</h4>
                ${Object.keys(tcoByApp).map(appName => `
                    <div class="cost-breakdown-section">
                        <h5 class="cost-breakdown-title">${appName}</h5>
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
                                ${tcoByApp[appName].map(detail => {
                                    const levelClass = detail.level === 'low' ? 'low' : detail.level === 'high' ? 'high' : 'medium';
                                    return `
                                        <tr>
                                            <td>${detail.name || detail.id}</td>
                                            <td><span class="cost-level-badge ${levelClass}">${detail.level}</span></td>
                                            <td style="text-align: right;">${detail.estimate.toLocaleString('de-DE')}€</td>
                                            <td style="color: var(--text-secondary); font-size: 0.8rem;">${detail.breakdown || '-'}</td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                `).join('')}

                <h4 style="margin: 1.5rem 0 1rem; color: var(--btc-heading);">${IconMapper.toFontAwesome('📋', 'component')} Aggregierte Service-Übersicht</h4>
                <div class="detail-services-grid">
                    ${serviceAnalysis.available.map(s => `
                        <div class="detail-service-item">
                            <div class="detail-service-status available"></div>
                            <div class="detail-service-info">
                                <div class="detail-service-name">${s.name || s}</div>
                                <div class="detail-service-provider">${IconMapper.toFontAwesome('✓', 'utility')} Verfügbar</div>
                            </div>
                        </div>
                    `).join('')}
                    ${serviceAnalysis.preview.map(s => `
                        <div class="detail-service-item">
                            <div class="detail-service-status preview"></div>
                            <div class="detail-service-info">
                                <div class="detail-service-name">${s.name || s}</div>
                                <div class="detail-service-provider">${IconMapper.toFontAwesome('⚠️', 'utility')} Preview</div>
                            </div>
                        </div>
                    `).join('')}
                    ${serviceAnalysis.missing.map(s => `
                        <div class="detail-service-item">
                            <div class="detail-service-status missing"></div>
                            <div class="detail-service-info">
                                <div class="detail-service-name">${s.name || s}</div>
                                <div class="detail-service-provider">${IconMapper.toFontAwesome('⚠️', 'utility')} Nicht verfügbar</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        // Single-App-Pfad
        const score = result.score;
        const tco = result.tcoEstimate;
        const services = result.serviceAnalysis;

        return `
            ${headerHtml}

            <div class="provider-detail-scores">
                <div class="detail-score-card">
                    <div class="detail-score-value">${score.total}</div>
                    <div class="detail-score-label">Gesamt-Score</div>
                </div>
                <div class="detail-score-card">
                    <div class="detail-score-value">${score.controlScore}</div>
                    <div class="detail-score-label">Kontrolle</div>
                </div>
                <div class="detail-score-card">
                    <div class="detail-score-value">${score.performanceScore}</div>
                    <div class="detail-score-label">Leistung</div>
                </div>
                <div class="detail-score-card">
                    <div class="detail-score-value">${Math.round(services.coverage)}%</div>
                    <div class="detail-score-label">Abdeckung</div>
                </div>
            </div>

            <h4 style="margin: 1.5rem 0 1rem; color: var(--btc-heading);">${IconMapper.toFontAwesome('💰', 'utility')} TCO-Schätzung</h4>
            <div class="provider-detail-scores">
                <div class="detail-score-card">
                    <div class="detail-score-value">~${(tco.monthlyEstimate || 0).toLocaleString('de-DE')}€</div>
                    <div class="detail-score-label">Monatliche Gesamtkosten</div>
                </div>
                <div class="detail-score-card">
                    <div class="detail-score-value">~${(tco.consumption?.monthlyEstimate || 0).toLocaleString('de-DE')}€</div>
                    <div class="detail-score-label">Verbrauchskosten</div>
                </div>
                <div class="detail-score-card${!tco.operations?.includedInCosts ? ' operations-excluded' : ''}">
                    <div class="detail-score-value">~${(tco.operations?.monthlyPersonnelCost || 0).toLocaleString('de-DE')}€</div>
                    <div class="detail-score-label">Betriebskosten${!tco.operations?.includedInCosts ? ' <span style="font-size: 0.7em; opacity: 0.7;">(nicht in TCO)</span>' : ''}</div>
                </div>
                <div class="detail-score-card${!tco.projectEffort?.includedInCosts ? ' project-effort-excluded' : ''}">
                    <div class="detail-score-value">~${tco.projectDaysEstimate || '-'} PT</div>
                    <div class="detail-score-label">Projektaufwand${!tco.projectEffort?.includedInCosts ? ' <span style="font-size: 0.7em; opacity: 0.7;">(nicht in TCO)</span>' : ''}</div>
                </div>
            </div>

            <h4 style="margin: 1.5rem 0 1rem; color: var(--btc-heading);">${IconMapper.toFontAwesome('📋', 'component')} Service-Übersicht (${services.totalRequired} benötigt)</h4>
            <div class="detail-services-grid">
                ${(services.available || []).map(s => `
                    <div class="detail-service-item">
                        <div class="detail-service-status available"></div>
                        <div class="detail-service-info">
                            <div class="detail-service-name">${s.name}</div>
                            <div class="detail-service-provider">${IconMapper.toFontAwesome('✓', 'utility')} Verfügbar | Kontrolle: ${s.control} | Leistung: ${s.performance}</div>
                        </div>
                    </div>
                `).join('')}
                ${(services.preview || []).map(s => `
                    <div class="detail-service-item">
                        <div class="detail-service-status preview"></div>
                        <div class="detail-service-info">
                            <div class="detail-service-name">${s.name}</div>
                            <div class="detail-service-provider">${IconMapper.toFontAwesome('⚠️', 'utility')} Preview</div>
                        </div>
                    </div>
                `).join('')}
                ${(services.planned || []).map(s => `
                    <div class="detail-service-item">
                        <div class="detail-service-status planned"></div>
                        <div class="detail-service-info">
                            <div class="detail-service-name">${s.name || s.id}</div>
                            <div class="detail-service-provider">${IconMapper.toFontAwesome('📅', 'utility')} Geplant</div>
                        </div>
                    </div>
                `).join('')}
                ${(services.missing || []).map(s => `
                    <div class="detail-service-item">
                        <div class="detail-service-status missing"></div>
                        <div class="detail-service-info">
                            <div class="detail-service-name">${s.name || s.id}</div>
                            <div class="detail-service-provider">${s.selfBuildOption ? `${IconMapper.toFontAwesome('⚠️', 'utility')} Self-Build: ${s.selfBuildOption.name}` : `${IconMapper.toFontAwesome('⚠️', 'utility')} Nicht verfügbar`}</div>
                        </div>
                    </div>
                `).join('')}
            </div>

            ${this.renderCostBreakdown(tco)}

            <h4 style="margin: 1.5rem 0 1rem; color: var(--btc-heading);">${IconMapper.toFontAwesome('📊', 'utility')} Score-Berechnung (Gewichtung: ${IconMapper.toFontAwesome('🔒', 'utility')}${this.weights.control}% ${IconMapper.toFontAwesome('⚡', 'utility')}${this.weights.performance}% ${IconMapper.toFontAwesome('📦', 'utility')}${this.weights.availability}% ${IconMapper.toFontAwesome('💰', 'utility')}${this.weights.cost}%)</h4>
            <div class="algorithm-explanation" style="font-size: 0.85rem;">
                <div class="algorithm-item" style="display: grid; grid-template-columns: 1fr auto auto auto; gap: 0.5rem; align-items: center;">
                    <div>${IconMapper.toFontAwesome('🔒', 'utility')} <strong>Kontrolle</strong></div>
                    <div style="text-align: right;">${score.controlScore}</div>
                    <div style="text-align: right; color: var(--text-secondary);">× ${this.weights.control}%</div>
                    <div style="text-align: right; font-weight: 600;">= ${score.weightedControl || Math.round(score.controlScore * this.weights.control / 100 * 10) / 10}</div>
                </div>
                <div class="algorithm-item" style="display: grid; grid-template-columns: 1fr auto auto auto; gap: 0.5rem; align-items: center;">
                    <div>${IconMapper.toFontAwesome('⚡', 'utility')} <strong>Leistung</strong></div>
                    <div style="text-align: right;">${score.performanceScore}</div>
                    <div style="text-align: right; color: var(--text-secondary);">× ${this.weights.performance}%</div>
                    <div style="text-align: right; font-weight: 600;">= ${score.weightedPerformance || Math.round(score.performanceScore * this.weights.performance / 100 * 10) / 10}</div>
                </div>
                <div class="algorithm-item" style="display: grid; grid-template-columns: 1fr auto auto auto; gap: 0.5rem; align-items: center;">
                    <div>${IconMapper.toFontAwesome('📦', 'utility')} <strong>Verfügbarkeit</strong></div>
                    <div style="text-align: right;">${score.availabilityScore || Math.round(services.coverage)}</div>
                    <div style="text-align: right; color: var(--text-secondary);">× ${this.weights.availability}%</div>
                    <div style="text-align: right; font-weight: 600;">= ${score.weightedAvailability || Math.round(services.coverage * this.weights.availability / 100 * 10) / 10}</div>
                </div>
                <div class="algorithm-item" style="display: grid; grid-template-columns: 1fr auto auto auto; gap: 0.5rem; align-items: center;">
                    <div>${IconMapper.toFontAwesome('💰', 'utility')} <strong>Kosten</strong> <span style="font-size: 0.75rem; color: var(--text-secondary);">(~${(score.monthlyCost || tco.monthlyEstimate || 0).toLocaleString('de-DE')}€/Mon.)</span></div>
                    <div style="text-align: right;">${score.costScore}</div>
                    <div style="text-align: right; color: var(--text-secondary);">× ${this.weights.cost}%</div>
                    <div style="text-align: right; font-weight: 600;">= ${score.weightedCost || Math.round(score.costScore * this.weights.cost / 100 * 10) / 10}</div>
                </div>
                <div class="algorithm-item" style="display: grid; grid-template-columns: 1fr auto; gap: 0.5rem; align-items: center; border-top: 2px solid var(--border); padding-top: 0.5rem; margin-top: 0.5rem;">
                    <div><strong>Basis-Score</strong></div>
                    <div style="text-align: right; font-weight: 600;">${score.base}</div>
                </div>
                <div class="algorithm-item" style="display: grid; grid-template-columns: 1fr auto; gap: 0.5rem; align-items: center;">
                    <div>Reife-Faktor <span style="font-size: 0.75rem; color: var(--text-secondary);">(${services.preview.length} Preview, ${services.missing.length} fehlend)</span></div>
                    <div style="text-align: right;">× ${score.maturityFactor}</div>
                </div>
                <div class="algorithm-item" style="display: grid; grid-template-columns: 1fr auto; gap: 0.5rem; align-items: center; background: var(--btc-accent); color: white; padding: 0.75rem; border-radius: 6px; margin-top: 0.5rem;">
                    <div><strong>Gesamt-Score</strong></div>
                    <div style="text-align: right; font-size: 1.25rem; font-weight: 700;">${score.total}</div>
                </div>
            </div>
        `;
    }
};
