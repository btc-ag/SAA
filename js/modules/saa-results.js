// SAAResults Module
// Verantwortlich für: Ergebnis-Rendering, Provider-Cards, TCO-Übersicht, Vergleichstabelle

import { architectureComponents } from '../saa-data.js';
import { IconMapper } from './saa-utils.js';
import {
    computeTcoConsumptionBreakdown,
    computeAppMonthlyTCO,
    formatRecommendationText as computeFormatRecommendationText,
    formatPortfolioRecommendationText as computeFormatPortfolioRecommendationText
} from './results-compute.js';
import { SAAResultsDetail } from './saa-results-detail.js';
import { SAAResultsComparison } from './saa-results-comparison.js';

export const SAAResults = {
    /**
     * Rendert Analyse-Ergebnisse — unifizierter Pfad für Single + Multi-App.
     *
     * Dispatch über `portfolio.perAppResults.length`:
     * - 1 App  → Single-App-View (TCO-Übersicht, Empfehlungen, Vergleichstabelle)
     * - >1 App → Portfolio-View (Aggregat-Provider-Ranking, Per-App-Accordion)
     *
     * @param {Object} portfolio - Output aus PortfolioAnalyzer.analyzePortfolio/analyzeOne
     *                             Shape: { perAppResults, aggregatedProviders, aggregatedTCO, portfolioMetrics }
     */
    renderAnalysisResults(portfolio) {
        if (!portfolio || !portfolio.perAppResults) return;

        const container = document.getElementById('analysisResultsContainer');
        if (!container) return;

        const isAggregated = portfolio.perAppResults.length > 1;
        if (isAggregated) {
            this._renderAggregatedView(portfolio, container);
        } else {
            this._renderSingleAppView(portfolio, container);
        }
    },

    /**
     * Rendert die Single-App-View (eine ApplicationInstance).
     * @private
     */
    _renderSingleAppView(portfolio, container) {
        if (!this.currentApp.analysisResults) return;

        // Zusammenfassung der ausgewählten Komponenten
        const selectedComps = Array.from(this.currentApp.selectedComponents).map(id => {
            const comp = architectureComponents.find(c => c.id === id);
            return comp ? { name: comp.name, icon: comp.icon } : { name: id, icon: '📦' };
        });

        // Final Recommendation
        const finalRec = this.analyzer.generateFinalRecommendation(
            this.currentApp.analysisResults,
            Array.from(this.currentApp.selectedComponents),
            this.strategyWeight
        );

        // System-Konfiguration Zusammenfassung
        const systemConfigHtml = this.renderSystemConfigSummary();

        // Architektur-Informationen aus den Analyse-Ergebnissen extrahieren
        const archInfo = this.currentApp.analysisResults[0]?.serviceAnalysis?.architectureInfo;
        const archModeDisplay = {
            'cloud_native': { icon: 'fa-cloud', label: 'Cloud-native / PaaS', color: 'var(--primary-color)' },
            'classic': { icon: 'fa-server', label: 'Klassisch / VM-basiert', color: 'var(--text-secondary)' },
            null: { icon: 'fa-wand-magic-sparkles', label: 'Automatisch', color: 'var(--accent-color)' }
        };
        // Fix 3: Automatisch-Modus zeigt den tatsächlich gewählten Modus an
        let currentMode = archModeDisplay[this.architectureSettings.mode] || archModeDisplay[null];
        if (this.architectureSettings.mode === null && archInfo?.transformation?.applied) {
            const autoChosen = archInfo.transformation.mode === 'cloud_native' ? 'Cloud-native' : 'Klassisch';
            currentMode = { ...currentMode, label: `Automatisch → ${autoChosen}` };
        }

        let html = `
            <!-- Ausgewählte Komponenten -->
            <div class="analysis-section">
                <h3 class="analysis-title">Analysierte Architektur</h3>
                ${this.currentApp.applicationData ? `<p style="color: var(--btc-accent); font-weight: 600; margin-bottom: 0.5rem;">${this.currentApp.applicationData.name}</p>` : ''}
                <p style="color: var(--text-secondary); margin-bottom: 1rem;">
                    ${this.currentApp.selectedComponents.size} Komponenten wurden für die Cloud-Analyse berücksichtigt:
                </p>
                <div class="selected-components">
                    ${selectedComps.map(c => `<span class="selected-component-tag">${IconMapper.toFontAwesome(c.icon, 'component')} ${c.name}</span>`).join('')}
                </div>
            </div>

            <!-- Architektur-Modus Info -->
            ${archInfo ? `
            <div class="analysis-section" style="background: var(--surface-secondary); border: 1px solid var(--border-color);">
                <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem;">
                    <i class="fa-solid ${currentMode.icon}" style="color: ${currentMode.color}; font-size: 1.2rem;"></i>
                    <h3 class="analysis-title" style="margin: 0;">Architektur-Modus: ${currentMode.label}</h3>
                </div>
                ${archInfo.pattern ? `
                    <div style="
                        padding: 0.75rem;
                        background: var(--surface-primary);
                        border-radius: 8px;
                        border-left: 3px solid var(--primary-color);
                        margin-bottom: 0.75rem;
                    ">
                        <div style="font-weight: 600; color: var(--text-primary); margin-bottom: 0.25rem;">
                            <i class="fa-solid fa-lightbulb" style="color: var(--warning-color); margin-right: 0.5rem;"></i>
                            Workload-Typ: ${archInfo.pattern.name}
                        </div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary);">
                            ${archInfo.pattern.description || ''}
                        </div>
                    </div>
                ` : ''}
                ${archInfo.transformation?.applied ? `
                    <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.75rem;">
                        ${archInfo.transformation.reason ? `
                            <span style="
                                display: inline-flex;
                                align-items: center;
                                gap: 0.25rem;
                                padding: 0.35rem 0.75rem;
                                background: var(--info-color-light, rgba(59, 130, 246, 0.1));
                                color: var(--info-color, #3b82f6);
                                border-radius: 6px;
                                font-size: 0.8rem;
                            ">
                                <i class="fa-solid fa-info-circle"></i>
                                ${archInfo.transformation.reason}
                            </span>
                        ` : ''}
                    </div>
                    ${(() => {
                        const replacements = archInfo.transformation.replacements || {};
                        const additions = archInfo.transformation.additions || [];
                        const removals = archInfo.transformation.removals || [];
                        const serviceLabels = {
                            compute: 'VM / Compute', kubernetes: 'Kubernetes', serverless: 'Serverless',
                            database_sql: 'SQL DB', database_nosql: 'NoSQL DB',
                            storage_object: 'Object Storage', storage_block: 'Block Storage',
                            loadbalancer: 'Load Balancer', cdn: 'CDN', messaging: 'Messaging',
                            cache: 'Cache', monitoring: 'Monitoring', logging: 'Logging',
                            app_service: 'App Service / PaaS', static_hosting: 'Static Hosting',
                            api_gateway: 'API Gateway', container_registry: 'Container Registry'
                        };
                        const label = id => serviceLabels[id] || id;
                        const replTags = Object.entries(replacements).map(([from, to]) => `
                            <span style="
                                display: inline-flex; align-items: center; gap: 0.3rem;
                                padding: 0.3rem 0.6rem;
                                background: var(--surface-primary);
                                border: 1px solid var(--border-color);
                                border-radius: 6px; font-size: 0.8rem; color: var(--text-primary);
                            ">
                                <span style="color: var(--text-secondary);">${label(from)}</span>
                                <i class="fa-solid fa-arrow-right" style="color: var(--primary-color); font-size: 0.7rem;"></i>
                                <span style="color: var(--primary-color); font-weight: 600;">${label(to)}</span>
                            </span>
                        `).join('');
                        const addTags = additions.map(s => `
                            <span style="
                                display: inline-flex; align-items: center; gap: 0.25rem;
                                padding: 0.3rem 0.6rem;
                                background: rgba(16, 185, 129, 0.08);
                                border: 1px solid rgba(16, 185, 129, 0.3);
                                border-radius: 6px; font-size: 0.8rem; color: var(--success-color);
                            ">
                                <i class="fa-solid fa-plus" style="font-size: 0.65rem;"></i> ${label(s)}
                            </span>
                        `).join('');
                        const remTags = removals.map(s => `
                            <span style="
                                display: inline-flex; align-items: center; gap: 0.25rem;
                                padding: 0.3rem 0.6rem;
                                background: rgba(239, 68, 68, 0.08);
                                border: 1px solid rgba(239, 68, 68, 0.3);
                                border-radius: 6px; font-size: 0.8rem; color: var(--error-color, #ef4444);
                                text-decoration: line-through;
                            ">
                                ${label(s)}
                            </span>
                        `).join('');
                        const allTags = replTags + addTags + remTags;
                        return allTags ? `
                            <div style="display: flex; flex-wrap: wrap; gap: 0.4rem;">
                                ${allTags}
                            </div>
                        ` : '';
                    })()}
                ` : `
                    <p style="font-size: 0.85rem; color: var(--text-secondary); margin: 0;">
                        ${archInfo.transformation?.reason || 'Klassische VM-basierte Architektur wird verwendet.'}
                    </p>
                `}
            </div>
            ` : ''}

            <!-- Algorithm Profile Info -->
            <div class="algorithm-profile-info">
                <div class="profile-badge">
                    <span class="profile-icon">${this.getPresetIcon()}</span>
                    <span class="profile-name">${this.getPresetLabel()}</span>
                </div>
                <div class="profile-weights">
                    <span class="weight-item">Kontrolle: ${this.weights.control}%</span>
                    <span class="weight-item">Leistung: ${this.weights.performance}%</span>
                    <span class="weight-item">Verfügbarkeit: ${this.weights.availability}%</span>
                    <span class="weight-item">Kosten: ${this.weights.cost}%</span>
                </div>
                <button class="profile-edit-btn" onclick="app.openSettings()">Anpassen</button>
            </div>

            <!-- TCO Overview -->
            <div class="analysis-section">
                <h3 class="analysis-title">TCO-Übersicht (Top-Empfehlung)</h3>
                ${this.renderTCOOverview(finalRec.primary)}
            </div>

            <!-- Recommendations Grid -->
            <div class="analysis-section">
                <div class="analysis-header-with-info">
                    <h3 class="analysis-title">Cloud-Empfehlungen</h3>
                    <a href="evaluation-criteria.html" class="info-button" title="Detaillierte Bewertungskriterien anzeigen">
                        <i class="fa-solid fa-circle-info"></i> Bewertungskriterien
                    </a>
                </div>
                ${this.renderCustomScoresNotice()}
                <div class="recommendations-grid">
                    ${this.currentApp.analysisResults.slice(0, 6).map((result, index) => this.renderProviderCard(result, index)).join('')}
                </div>
            </div>

            <!-- Comparison Table with Tooltips -->
            <div class="analysis-section">
                <h3 class="analysis-title">Service-Verfügbarkeit im Vergleich</h3>
                <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 1rem;">
                    Bewegen Sie die Maus über einen Service für Details zur Bewertung.
                </p>
                ${this.renderComparisonTable()}
            </div>

            <!-- Final Summary -->
            <div class="summary-section">
                <h3 class="summary-title">Empfehlung</h3>
                <div class="summary-recommendation">
                    ${this.formatRecommendationText(finalRec.text)}
                </div>
                <div class="summary-config-info">
                    <p>
                        Diese Empfehlung basiert auf dem Profil <strong>"${this.getPresetLabel()}"</strong>
                        (Kontrolle ${this.weights.control}%, Leistung ${this.weights.performance}%, Verfügbarkeit ${this.weights.availability}%, Kosten ${this.weights.cost}%).
                    </p>
                    <button class="summary-config-btn" onclick="app.openSettings()">
                        Algorithmus anpassen
                    </button>
                </div>
            </div>

            <!-- PDF Export -->
            <div class="export-section">
                <h3 class="analysis-title">Export</h3>
                <p style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 1rem;">
                    Laden Sie eine Zusammenfassung der Analyse als PDF herunter.
                </p>
                <button class="export-btn" onclick="app.exportToPDF()">
                    PDF-Report herunterladen
                </button>
            </div>
        `;

        container.innerHTML = html;

        // Initialize tooltips
        this.initTooltips();

        // Bind detail buttons
        this.bindDetailButtons();
    },

    /**
     * Rendert die Portfolio-View (mehrere Anwendungen, aggregiertes Ranking).
     * @private
     */
    _renderAggregatedView(portfolio, container) {
        const { portfolioMetrics, aggregatedProviders, aggregatedTCO } = portfolio;
        const topProvider = aggregatedProviders[0];

        let html = `
            <!-- Portfolio Overview - Kompakt -->
            <div class="analysis-section portfolio-summary-compact">
                <div class="portfolio-stats-inline">
                    <div class="stat-item">
                        <span class="stat-label">Anwendungen:</span>
                        <span class="stat-value">${portfolioMetrics.totalApps}</span>
                    </div>
                    <div class="stat-separator">•</div>
                    <div class="stat-item">
                        <span class="stat-label">Komponenten:</span>
                        <span class="stat-value">${portfolioMetrics.totalComponents}</span>
                    </div>
                    <div class="stat-separator">•</div>
                    <div class="stat-item">
                        <span class="stat-label">Gesamt-TCO:</span>
                        <span class="stat-value highlight">${this.formatCurrency(aggregatedTCO[topProvider.provider.id].totalMonthly)}€/Monat</span>
                        <span class="stat-sublabel">(${topProvider.provider.name})</span>
                    </div>
                </div>
            </div>

            <!-- Algorithm Profile Info -->
            <div class="algorithm-profile-info">
                <div class="profile-badge">
                    <span class="profile-icon">${this.getPresetIcon()}</span>
                    <span class="profile-name">${this.getPresetLabel()}</span>
                </div>
                <div class="profile-weights">
                    <span class="weight-item">Kontrolle: ${this.weights.control}%</span>
                    <span class="weight-item">Leistung: ${this.weights.performance}%</span>
                    <span class="weight-item">Verfügbarkeit: ${this.weights.availability}%</span>
                    <span class="weight-item">Kosten: ${this.weights.cost}%</span>
                </div>
                <button class="profile-edit-btn" onclick="app.openSettings()">Anpassen</button>
            </div>

            <!-- Aggregated Provider Ranking -->
            <div class="analysis-section">
                <div class="analysis-header-with-info">
                    <h3 class="analysis-title">Cloud-Empfehlungen (Gesamt-Portfolio)</h3>
                    <a href="evaluation-criteria.html" class="info-button" title="Detaillierte Bewertungskriterien anzeigen">
                        <i class="fa-solid fa-circle-info"></i> Bewertungskriterien
                    </a>
                </div>
                ${this.renderCustomScoresNotice()}
                <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">
                    Ranking basierend auf gewichteten Scores über alle ${portfolioMetrics.totalApps} Anwendungen hinweg.
                </p>
                <div class="recommendations-grid aggregate">
                    ${aggregatedProviders.slice(0, 6).map((result, index) => this.renderProviderCard(result, index, { isAggregated: true, aggregatedTCO })).join('')}
                </div>
            </div>

            <!-- Per-App Breakdown -->
            <div class="analysis-section">
                <h3 class="analysis-title">Detailansicht pro Anwendung</h3>
                <p style="color: var(--text-secondary); margin-bottom: 1rem;">
                    Klicken Sie auf eine Anwendung, um die detaillierte Analyse anzuzeigen.
                </p>
                <div class="app-breakdown-accordion" id="appBreakdownAccordion">
                    ${this.applications.map((app, index) => this.renderAppBreakdownItem(app, index)).join('')}
                </div>
            </div>

            <!-- Portfolio Summary -->
            <div class="summary-section">
                <h3 class="summary-title">Portfolio-Empfehlung</h3>
                <div class="summary-recommendation">
                    ${this.formatPortfolioRecommendationText(topProvider, portfolioMetrics, aggregatedTCO)}
                </div>
                <div class="summary-config-info">
                    <p>
                        Diese Empfehlung basiert auf dem Profil <strong>"${this.getPresetLabel()}"</strong>
                        (Kontrolle ${this.weights.control}%, Leistung ${this.weights.performance}%, Verfügbarkeit ${this.weights.availability}%, Kosten ${this.weights.cost}%)
                        und berücksichtigt ${portfolioMetrics.totalApps} Anwendungen mit insgesamt ${portfolioMetrics.totalComponents} Komponenten.
                    </p>
                    <button class="summary-config-btn" onclick="app.openSettings()">
                        Algorithmus anpassen
                    </button>
                </div>
            </div>

            <!-- PDF Export -->
            <div class="export-section">
                <h3 class="analysis-title">Export</h3>
                <p style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 1rem;">
                    Laden Sie eine Zusammenfassung der Portfolio-Analyse als PDF herunter.
                </p>
                <button class="export-btn" onclick="app.exportToPDF()">
                    PDF-Report herunterladen
                </button>
            </div>
        `;

        container.innerHTML = html;

        // Event-Handler für Accordion
        document.querySelectorAll('.accordion-header').forEach((header, index) => {
            header.addEventListener('click', () => this.toggleAppBreakdown(index));
        });

        // Initialize tooltips
        this.initTooltips();

        // Bind detail buttons für Provider-Karten
        this.bindDetailButtons();
    },

    // ── Provider-Card ────────────────────────────────────────────────────
    // Konstanten für alle Provider-Card-Rendering-Pfade (Single + Aggregated)
    _PROVIDER_CATEGORY_NAMES: {
        hyperscaler: 'Hyperscaler',
        sovereign: 'Souveräne Cloud',
        eu: 'EU-Anbieter',
        private: 'Private Cloud',
        hybrid: 'Hybrid-Lösung'
    },

    _PROVIDER_CATEGORY_ICONS: {
        hyperscaler: '🌐',
        sovereign: '🏛️',
        eu: '🇪🇺',
        private: '🔒',
        hybrid: '🔄'
    },

    /**
     * Rendert ein App-Breakdown Accordion-Item
     */
    renderAppBreakdownItem(app, index) {
        if (!app.analysisResults) return '';

        const topResult = app.analysisResults[0];
        const componentCount = app.selectedComponents.size;
        const { monthlyInfra, monthlyOps, totalMonthlyTCO } = computeAppMonthlyTCO(app);

        // Komponenten-Tags
        const componentTags = Array.from(app.selectedComponents).map(id => {
            const comp = architectureComponents.find(c => c.id === id);
            return comp ? `<span class="selected-component-tag">${IconMapper.toFontAwesome(comp.icon, 'component')} ${comp.name}</span>` : '';
        }).join('');

        // Top 3 Provider mit vollständigen Karten (Single-App Design)
        const topProviders = app.analysisResults.slice(0, 3).map((result, i) => {
            const isTopPick = i === 0;

            const categoryNames = {
                hyperscaler: 'Hyperscaler',
                sovereign: 'Souveräne Cloud',
                eu: 'EU-Anbieter',
                private: 'Private Cloud',
                hybrid: 'Hybrid-Lösung'
            };

            const categoryIcons = {
                hyperscaler: '🌐',
                sovereign: '🏛️',
                eu: '🇪🇺',
                private: '🔒',
                hybrid: '🔄'
            };

            const tcoLevelColors = {
                low: 'var(--btc-success)',
                medium: 'var(--btc-warning)',
                high: 'var(--btc-danger)'
            };

            return `
                <div class="recommendation-card ${isTopPick ? 'top-pick' : ''}" style="margin-bottom: 1rem;">
                    ${isTopPick ? '<div class="recommendation-badge">Top-Empfehlung</div>' : ''}
                    <div class="recommendation-header">
                        <div class="provider-logo" style="background: ${result.provider.color}20; color: ${result.provider.color};">
                            ${IconMapper.toFontAwesome(categoryIcons[result.provider.category], 'provider')}
                        </div>
                        <div class="provider-info">
                            <h3>${result.provider.name}</h3>
                            <span class="provider-category">${categoryNames[result.provider.category]}</span>
                        </div>
                    </div>

                    <div class="recommendation-scores">
                        <div class="score-item">
                            <div class="score-value">${result.score.total}</div>
                            <div class="score-label">Gesamt</div>
                        </div>
                        <div class="score-item">
                            <div class="score-value">${Math.round(result.serviceAnalysis.coverage)}%</div>
                            <div class="score-label">Abdeckung</div>
                        </div>
                        <div class="score-item" style="border-left: 3px solid ${tcoLevelColors[result.tcoEstimate.totalLevel]};">
                            <div class="score-value">~${result.tcoEstimate.monthlyEstimate}€</div>
                            <div class="score-label">TCO/Monat</div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        const categoryIcons = {
            hyperscaler: '🌐',
            sovereign: '🏛️',
            eu: '🇪🇺',
            private: '🔒',
            hybrid: '🔄'
        };

        return `
            <div class="accordion-item" data-app-index="${index}">
                <div class="accordion-header">
                    <div class="accordion-title">
                        <span class="app-name">${this.escapeHtml(app.name)}</span>
                        <span class="top-recommendation-badge" style="margin-left: 1rem; padding: 0.25rem 0.75rem; background: ${topResult.provider.color}15; color: ${topResult.provider.color}; border: 1px solid ${topResult.provider.color}40; border-radius: 12px; font-size: 0.85rem; font-weight: 500;">
                            ${IconMapper.toFontAwesome(categoryIcons[topResult.provider.category], 'provider')} ${topResult.provider.name}
                        </span>
                    </div>
                    <div class="accordion-meta">
                        <span class="meta-chip">${componentCount} Komponenten</span>
                        <span class="meta-chip">Score: ${topResult.score.total}</span>
                        <span class="meta-chip" title="Infrastruktur: ${this.formatCurrency(monthlyInfra)}€ + Betrieb: ${this.formatCurrency(monthlyOps)}€">TCO: ${this.formatCurrency(totalMonthlyTCO)}€/Mon.</span>
                    </div>
                    <div class="accordion-toggle">▼</div>
                </div>
                <div class="accordion-body">
                    <div class="app-analysis-content">
                        <!-- Ausgewählte Komponenten -->
                        <div class="analysis-section">
                            <h3 class="analysis-title">Analysierte Architektur</h3>
                            <p style="color: var(--text-secondary); margin-bottom: 1rem;">
                                ${componentCount} Komponenten wurden für die Cloud-Analyse berücksichtigt:
                            </p>
                            <div class="selected-components">
                                ${componentTags}
                            </div>
                        </div>

                        <!-- TCO Overview -->
                        ${topResult ? `
                            <div class="analysis-section">
                                <h3 class="analysis-title">TCO-Übersicht (Top-Empfehlung)</h3>
                                ${this.renderTCOOverview(topResult)}
                            </div>
                        ` : ''}

                        <!-- Cloud-Empfehlungen -->
                        <div class="analysis-section">
                            <h3 class="analysis-title">Cloud-Empfehlungen</h3>
                            <div class="recommendations-grid">
                                ${app.analysisResults.slice(0, 6).map((result, i) => this.renderProviderCard(result, i, { appIndex: index })).join('')}
                            </div>
                        </div>

                        <!-- Comparison Table -->
                        ${app.analysisResults.length > 0 ? `
                            <div class="analysis-section">
                                <h3 class="analysis-title">Service-Verfügbarkeit im Vergleich</h3>
                                <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 1rem;">
                                    Bewegen Sie die Maus über einen Service für Details zur Bewertung.
                                </p>
                                ${this.renderComparisonTable(app)}
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Toggle Accordion für App-Details
     */
    toggleAppBreakdown(index) {
        const item = document.querySelector(`.accordion-item[data-app-index="${index}"]`);
        if (!item) return;

        const wasExpanded = item.classList.contains('expanded');

        // Alle anderen schließen
        document.querySelectorAll('.accordion-item').forEach(i => {
            i.classList.remove('expanded');
        });

        // Toggle aktuelles Item
        if (!wasExpanded) {
            item.classList.add('expanded');
        }
    },

    /**
     * Scrollt zu einer App-Breakdown und öffnet sie
     */
    scrollToAppBreakdown(index) {
        // Schließe Popup erst
        this.closeDetailPopup();

        // Warte kurz für Animation
        setTimeout(() => {
            const item = document.querySelector(`.accordion-item[data-app-index="${index}"]`);
            if (!item) return;

            // Öffne das Accordion
            document.querySelectorAll('.accordion-item').forEach(i => {
                i.classList.remove('expanded');
            });
            item.classList.add('expanded');

            // Scrolle zum Element
            item.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    },

    /**
     * Rendert die TCO-Übersicht
     */
    renderTCOOverview(result) {
        const tco = result.tcoEstimate;
        const levelColors = {
            low: '#22c55e',
            medium: '#f59e0b',
            high: '#ef4444'
        };
        const levelLabels = {
            low: 'Niedrig',
            medium: 'Mittel',
            high: 'Hoch'
        };

        // Detaillierte Kostenaufschlüsselung erstellen - ALLE Services anzeigen
        const { items: allCostDetails, sum: detailsSum } = computeTcoConsumptionBreakdown(tco);

        const breakdownHtml = allCostDetails.length > 0
            ? `<div class="tco-breakdown">
                <div class="tco-breakdown-title">Kostenaufschlüsselung:</div>
                <ul class="tco-breakdown-list">
                    ${allCostDetails.map(d => `<li>${d.text} <span class="cost-value">${d.cost.toLocaleString('de-DE')}€</span></li>`).join('')}
                </ul>
                <div class="tco-breakdown-sum">
                    <strong>Summe: ${detailsSum.toLocaleString('de-DE')}€/Monat</strong>
                </div>
                <div class="tco-disclaimer">* Geschätzte Listenpreise. Tatsächliche Kosten können durch Rabatte, Reserved Instances oder Enterprise-Verträge abweichen.</div>
               </div>`
            : '';

        return `
            <div class="tco-overview">
                <div class="tco-card">
                    <div class="tco-icon">${IconMapper.toFontAwesome('💰', 'utility')}</div>
                    <div class="tco-content">
                        <div class="tco-label">Infrastrukturkosten</div>
                        <div class="tco-value">~${tco.consumption.monthlyEstimate.toLocaleString('de-DE')}€/Monat</div>
                        <div class="tco-level" style="color: ${levelColors[tco.consumption.level]}">${levelLabels[tco.consumption.level]}</div>
                    </div>
                </div>
                <div class="tco-card${!tco.operations.includedInCosts ? ' operations-excluded' : ''}">
                    <div class="tco-icon">${IconMapper.toFontAwesome('👥', 'utility')}</div>
                    <div class="tco-content">
                        <div class="tco-label">Betriebsaufwand${!tco.operations.includedInCosts ? ' <span style="font-size: 0.7em; opacity: 0.7;">(nicht in TCO)</span>' : ''}</div>
                        <div class="tco-value">~${tco.operations.totalFTE} FTE</div>
                        <div class="tco-level" style="color: ${levelColors[tco.operations.level]}">${levelLabels[tco.operations.level]} (~${tco.operations.monthlyPersonnelCost.toLocaleString('de-DE')}€/Mon.)</div>
                    </div>
                </div>
                <div class="tco-card${!tco.projectEffort.includedInCosts ? ' project-effort-excluded' : ''}">
                    <div class="tco-icon">${IconMapper.toFontAwesome('📅', 'utility')}</div>
                    <div class="tco-content">
                        <div class="tco-label">Projektaufwand${!tco.projectEffort.includedInCosts ? ' <span style="font-size: 0.7em; opacity: 0.7;">(nicht in TCO)</span>' : ''}</div>
                        <div class="tco-value">~${tco.projectDaysEstimate} PT</div>
                        <div class="tco-level" style="color: ${levelColors[tco.projectEffort.level]}">${levelLabels[tco.projectEffort.level]}</div>
                    </div>
                </div>
                ${tco.selfBuild.required ? `
                <div class="tco-card warning">
                    <div class="tco-icon">${IconMapper.toFontAwesome('⚠️', 'utility')}</div>
                    <div class="tco-content">
                        <div class="tco-label">Self-Build</div>
                        <div class="tco-value">${tco.selfBuild.servicesCount} Service(s)</div>
                        <div class="tco-level">+${tco.selfBuild.totalDays} Projekttage</div>
                    </div>
                </div>
                ` : ''}
            </div>
            ${breakdownHtml}
        `;
    },

    /**
     * Rendert eine Provider-Karte — unifizierter Pfad für Single + Aggregated.
     *
     * @param {Object} result - Ergebnis-Objekt:
     *   Single:     { provider, score, serviceAnalysis, tcoEstimate, recommendation }
     *   Aggregated: { provider, aggregatedScore, serviceAnalysis, appScores }
     * @param {number} index - Position im Ranking (0 = Top-Empfehlung)
     * @param {Object} [opts]
     * @param {boolean} [opts.isAggregated=false] - Portfolio-Aggregat-Ansicht
     * @param {Object}  [opts.aggregatedTCO]      - aggregatedTCO Map (nur Aggregated)
     * @param {number}  [opts.appIndex=null]      - App-Index (Per-App-Card im Multi-App-Accordion)
     */
    renderProviderCard(result, index, opts = {}) {
        const { isAggregated = false, aggregatedTCO = null, appIndex = null } = opts;
        const isTopPick = index === 0;
        const provider = result.provider;
        const categoryNames = this._PROVIDER_CATEGORY_NAMES;
        const categoryIcons = this._PROVIDER_CATEGORY_ICONS;

        // Header (identisch in beiden Pfaden)
        const headerHtml = `
            <div class="recommendation-header">
                <div class="provider-logo" style="background: ${provider.color}20; color: ${provider.color};">
                    ${IconMapper.toFontAwesome(categoryIcons[provider.category], 'provider')}
                </div>
                <div class="provider-info">
                    <h3>${provider.name}</h3>
                    <span class="provider-category">${categoryNames[provider.category]}</span>
                </div>
            </div>
        `;

        if (isAggregated) {
            // Aggregated: Portfolio-Score, Coverage, TCO-Total
            const tco = aggregatedTCO[provider.id];
            const { aggregatedScore, serviceAnalysis, appScores } = result;

            return `
                <div class="recommendation-card ${isTopPick ? 'top-pick' : ''}" data-provider-id="${provider.id}">
                    ${isTopPick ? '<div class="recommendation-badge">Top-Empfehlung</div>' : ''}
                    ${headerHtml}

                    <div class="recommendation-scores">
                        <div class="score-item">
                            <div class="score-value">${aggregatedScore.toFixed(1)}</div>
                            <div class="score-label">Portfolio-Score</div>
                        </div>
                        <div class="score-item">
                            <div class="score-value">${Math.round(serviceAnalysis.coverage)}%</div>
                            <div class="score-label">Abdeckung</div>
                        </div>
                        <div class="score-item">
                            <div class="score-value">${this.formatCurrency(tco.totalMonthly)}€</div>
                            <div class="score-label">TCO/Monat</div>
                        </div>
                    </div>

                    <div class="recommendation-services">
                        <div class="services-title">Portfolio (${appScores.length} ${appScores.length === 1 ? 'Anwendung' : 'Anwendungen'})</div>
                        <p style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.5rem;">
                            Gewichteter Durchschnitt über alle Anwendungen
                        </p>
                    </div>

                    <button class="detail-btn" data-provider-id="${provider.id}" data-aggregated="true">
                        Portfolio-Details anzeigen →
                    </button>
                </div>
            `;
        }

        // Single-App-Pfad: volle Ratings, Service-Tags, Recommendation-Summary
        const tcoLevelColors = {
            low: 'var(--btc-success)',
            medium: 'var(--btc-warning)',
            high: 'var(--btc-danger)'
        };

        return `
            <div class="recommendation-card ${isTopPick ? 'top-pick' : ''}">
                ${isTopPick ? '<div class="recommendation-badge">Top-Empfehlung</div>' : ''}
                ${headerHtml}

                <div class="recommendation-scores">
                    <div class="score-item">
                        <div class="score-value">${result.score.total}</div>
                        <div class="score-label">Gesamt</div>
                    </div>
                    <div class="score-item">
                        <div class="score-value">${Math.round(result.serviceAnalysis.coverage)}%</div>
                        <div class="score-label">Abdeckung</div>
                    </div>
                    <div class="score-item" style="border-left: 3px solid ${tcoLevelColors[result.tcoEstimate.totalLevel]};">
                        <div class="score-value">~${result.tcoEstimate.monthlyEstimate}€</div>
                        <div class="score-label">TCO/Monat</div>
                    </div>
                </div>

                <div class="recommendation-ratings">
                    <div class="rating-bar">
                        <span class="rating-label">Kontrolle</span>
                        <div class="rating-track">
                            <div class="rating-fill control" style="width: ${result.score.controlScore}%"></div>
                        </div>
                        <span class="rating-value">${result.score.controlScore}</span>
                    </div>
                    <div class="rating-bar">
                        <span class="rating-label">Leistung</span>
                        <div class="rating-track">
                            <div class="rating-fill performance" style="width: ${result.score.performanceScore}%"></div>
                        </div>
                        <span class="rating-value">${result.score.performanceScore}</span>
                    </div>
                </div>

                <div class="recommendation-services">
                    <div class="services-title">Verfügbar (${result.serviceAnalysis.available.length + result.serviceAnalysis.preview.length}/${result.serviceAnalysis.available.length + result.serviceAnalysis.preview.length + result.serviceAnalysis.planned.length + result.serviceAnalysis.missing.length})</div>
                    <div class="services-list">
                        ${result.serviceAnalysis.available.slice(0, 4).map(s =>
                            `<span class="service-tag available">${s.name}</span>`
                        ).join('')}
                        ${result.serviceAnalysis.available.length > 4 ?
                            `<span class="service-tag">+${result.serviceAnalysis.available.length - 4} weitere</span>` : ''}
                    </div>
                    ${result.serviceAnalysis.planned.length > 0 ? `
                    <div class="services-title planned-title">Geplant (${result.serviceAnalysis.planned.length})</div>
                    <div class="services-list">
                        ${result.serviceAnalysis.planned.map(s =>
                            `<span class="service-tag planned" title="${s.selfBuildOption ? 'Self-Build möglich: ' + s.selfBuildOption.name : 'In Planung'}">${this.getServiceDisplayName(s.id)}</span>`
                        ).join('')}
                    </div>
                    ` : ''}
                    ${result.serviceAnalysis.missing.length > 0 ? `
                    <div class="services-title missing-title">Fehlt (${result.serviceAnalysis.missing.length})</div>
                    <div class="services-list">
                        ${result.serviceAnalysis.missing.map(s =>
                            `<span class="service-tag missing" title="${s.selfBuildOption ? 'Self-Build möglich: ' + s.selfBuildOption.name : 'Nicht verfügbar'}">${this.getServiceDisplayName(s.id)}</span>`
                        ).join('')}
                    </div>
                    ` : ''}
                </div>

                <p style="margin-top: 1rem; font-size: 0.85rem; color: var(--text-secondary);">
                    ${result.recommendation.summary}
                </p>

                <button class="detail-btn" data-provider-index="${index}"${appIndex !== null ? ` data-app-index="${appIndex}"` : ''}>
                    Details & Berechnung anzeigen →
                </button>
            </div>
        `;
    },
    /**
     * Bindet Event-Handler für Detail-Buttons
     */
    bindDetailButtons() {
        document.querySelectorAll('.detail-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();

                // Aggregierte Portfolio-Ansicht
                if (btn.dataset.aggregated === 'true') {
                    const providerId = btn.dataset.providerId;
                    const aggregatedProvider = this.aggregatedResults.aggregatedProviders.find(
                        p => p.provider.id === providerId
                    );
                    if (aggregatedProvider) {
                        this.openAggregatedDetailPopup(aggregatedProvider, this.aggregatedResults.aggregatedTCO[providerId]);
                    }
                    return;
                }

                const providerIndex = parseInt(btn.dataset.providerIndex);
                const appIndex = btn.dataset.appIndex !== undefined ? parseInt(btn.dataset.appIndex) : null;

                // Multi-App Modus: Nutze die App-spezifischen Results
                if (this.isMultiAppMode && appIndex !== null && this.applications[appIndex]) {
                    const appResults = this.applications[appIndex].analysisResults;
                    if (appResults && appResults[providerIndex]) {
                        this.openDetailPopup(appResults[providerIndex]);
                    }
                }
                // Single-App Modus
                else if (this.currentApp.analysisResults && this.currentApp.analysisResults[providerIndex]) {
                    this.openDetailPopup(this.currentApp.analysisResults[providerIndex]);
                }
            });
        });
    },
    /**
     * Pure Markdown→HTML-Formatter für Empfehlungstexte.
     * Thin wrapper über die pure Function in results-compute.js — bleibt
     * als Mixin-Methode bestehen, damit bestehende `this.formatRecommendationText(...)`
     * Aufrufstellen (Single-App in _renderSingleAppView etc.) unverändert funktionieren.
     */
    formatRecommendationText(text) {
        return computeFormatRecommendationText(text);
    },

    /**
     * Generiert den Portfolio-Empfehlungstext (Multi-App) und formatiert ihn.
     * Thin wrapper über die pure Function in results-compute.js — leitet
     * formatCurrency (aus SAAPdf-Mixin) als Callback weiter.
     */
    formatPortfolioRecommendationText(topProvider, metrics, aggregatedTCO) {
        return computeFormatPortfolioRecommendationText(
            topProvider,
            metrics,
            aggregatedTCO,
            (v) => this.formatCurrency(v)
        );
    },


    // Detail- und Comparison-Methoden via Object-Spread mit reinmischen.
    // saa-app.js bindet weiterhin nur ein einziges SAAResults-Mixin ein.
    ...SAAResultsDetail,
    ...SAAResultsComparison
};
