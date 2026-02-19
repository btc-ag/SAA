// SAAResults Module
// Verantwortlich für: Ergebnis-Rendering, Provider-Cards, TCO-Übersicht, Vergleichstabelle

import { architectureComponents, cloudProviders, selfBuildOptions } from '../saa-data.js';
import { IconMapper } from './saa-utils.js';

export const SAAResults = {
    renderAnalysisResults() {
        if (!this.analysisResults) return;

        const container = document.getElementById('analysisResultsContainer');
        if (!container) return;

        // Zusammenfassung der ausgewählten Komponenten
        const selectedComps = Array.from(this.selectedComponents).map(id => {
            const comp = architectureComponents.find(c => c.id === id);
            return comp ? { name: comp.name, icon: comp.icon } : { name: id, icon: '📦' };
        });

        // Final Recommendation
        const finalRec = this.analyzer.generateFinalRecommendation(
            this.analysisResults,
            Array.from(this.selectedComponents),
            this.strategyWeight
        );

        // System-Konfiguration Zusammenfassung
        const systemConfigHtml = this.renderSystemConfigSummary();

        // Architektur-Informationen aus den Analyse-Ergebnissen extrahieren
        const archInfo = this.analysisResults[0]?.serviceAnalysis?.architectureInfo;
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
                ${this.applicationData ? `<p style="color: var(--btc-accent); font-weight: 600; margin-bottom: 0.5rem;">${this.applicationData.name}</p>` : ''}
                <p style="color: var(--text-secondary); margin-bottom: 1rem;">
                    ${this.selectedComponents.size} Komponenten wurden für die Cloud-Analyse berücksichtigt:
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
                        ${archInfo.operationsFactor < 1 ? `
                            <span style="
                                display: inline-flex;
                                align-items: center;
                                gap: 0.25rem;
                                padding: 0.35rem 0.75rem;
                                background: var(--success-color-light, rgba(16, 185, 129, 0.1));
                                color: var(--success-color);
                                border-radius: 6px;
                                font-size: 0.8rem;
                                font-weight: 500;
                            ">
                                <i class="fa-solid fa-arrow-down"></i>
                                ~${Math.round((1 - archInfo.operationsFactor) * 100)}% weniger Betriebsaufwand
                            </span>
                        ` : archInfo.operationsFactor > 1 ? `
                            <span style="
                                display: inline-flex;
                                align-items: center;
                                gap: 0.25rem;
                                padding: 0.35rem 0.75rem;
                                background: rgba(245, 158, 11, 0.1);
                                color: var(--warning-color, #f59e0b);
                                border-radius: 6px;
                                font-size: 0.8rem;
                                font-weight: 500;
                            ">
                                <i class="fa-solid fa-arrow-up"></i>
                                ~${Math.round((archInfo.operationsFactor - 1) * 100)}% mehr Betriebsaufwand
                            </span>
                        ` : ''}
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
                    ${this.analysisResults.slice(0, 6).map((result, index) => this.renderRecommendationCard(result, index)).join('')}
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
    }

    /**
     * Rendert aggregierte Analyse-Ergebnisse für Multi-App
     */
    renderAggregatedAnalysisResults() {
        if (!this.aggregatedResults) return;

        const container = document.getElementById('analysisResultsContainer');
        if (!container) return;

        const { portfolioMetrics, aggregatedProviders, aggregatedTCO } = this.aggregatedResults;
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
                    ${aggregatedProviders.slice(0, 6).map((result, index) => this.renderAggregatedProviderCard(result, index, aggregatedTCO)).join('')}
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
    }

    /**
     * Rendert eine aggregierte Provider-Karte
     */
    renderAggregatedProviderCard(result, index, aggregatedTCO) {
        const { provider, aggregatedScore, serviceAnalysis, appScores } = result;
        const tco = aggregatedTCO[provider.id];
        const isTopPick = index === 0;

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

        // Finde das vollständige Result-Objekt für den Detail-Button
        const firstAppResult = this.applications[0]?.analysisResults?.find(r => r.provider.id === provider.id);
        const providerResultIndex = firstAppResult ?
            this.applications[0].analysisResults.findIndex(r => r.provider.id === provider.id) : -1;

        return `
            <div class="recommendation-card ${isTopPick ? 'top-pick' : ''}" data-provider-id="${provider.id}">
                ${isTopPick ? '<div class="recommendation-badge">Top-Empfehlung</div>' : ''}
                <div class="recommendation-header">
                    <div class="provider-logo" style="background: ${provider.color}20; color: ${provider.color};">
                        ${IconMapper.toFontAwesome(categoryIcons[provider.category], 'provider')}
                    </div>
                    <div class="provider-info">
                        <h3>${provider.name}</h3>
                        <span class="provider-category">${categoryNames[provider.category]}</span>
                    </div>
                </div>

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

    /**
     * Rendert ein App-Breakdown Accordion-Item
     */
    renderAppBreakdownItem(app, index) {
        if (!app.analysisResults) return '';

        const topResult = app.analysisResults[0];
        const componentCount = app.selectedComponents.size;
        const monthlyInfra = topResult?.tcoEstimate?.consumption?.monthlyEstimate || 0;
        const monthlyOps = topResult?.tcoEstimate?.operations?.monthlyPersonnelCost || 0;
        const totalMonthlyTCO = monthlyInfra + monthlyOps;

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
                                ${app.analysisResults.slice(0, 6).map((result, i) => this.renderRecommendationCard(result, i, index)).join('')}
                            </div>
                        </div>

                        <!-- Comparison Table -->
                        ${app.analysisResults.length > 0 ? `
                            <div class="analysis-section">
                                <h3 class="analysis-title">Service-Verfügbarkeit im Vergleich</h3>
                                <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 1rem;">
                                    Bewegen Sie die Maus über einen Service für Details zur Bewertung.
                                </p>
                                ${this.renderComparisonTableForApp(app)}
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

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
    }

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
    }

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
        const allCostDetails = tco.consumption.details.map(d => {
            const detailText = d.breakdown
                ? `${d.name}: ${d.breakdown}`
                : `${d.name}`;
            return { text: detailText, cost: d.estimate };
        });

        // Berechne Summe der Details
        const detailsSum = allCostDetails.reduce((sum, d) => sum + d.cost, 0);

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
    }

    renderRecommendationCard(result, index, appIndex = null) {
        const isTopPick = index === 0;
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
            <div class="recommendation-card ${isTopPick ? 'top-pick' : ''}">
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
    }

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
                else if (this.analysisResults && this.analysisResults[providerIndex]) {
                    this.openDetailPopup(this.analysisResults[providerIndex]);
                }
            });
        });
    }

    /**
     * Rendert Comparison Table für eine spezifische App (Multi-App)
     */
    renderComparisonTableForApp(app) {
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
    }

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
    }

    renderComparisonTable() {
        const requiredServices = this.analyzer.getRequiredServices(Array.from(this.selectedComponents));
        const topProviders = this.analysisResults.slice(0, 5);

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
    }

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
    }

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
    }

    /**
     * Rendert kompakte Score-Anzeige für Control/Performance
     */
    renderRatingIndicators(service) {
        const controlColor = service.control >= 70 ? 'var(--btc-success)' : service.control >= 40 ? 'var(--btc-warning)' : 'var(--btc-danger)';
        const perfColor = service.performance >= 70 ? 'var(--btc-success)' : service.performance >= 40 ? 'var(--btc-warning)' : 'var(--btc-danger)';

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
    }

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
    }

    formatRecommendationText(text) {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<span class="summary-highlight">$1</span>')
            .replace(/\n/g, '<br>')
            .replace(/• /g, '<span class="bullet">•</span> ');
    }

    /**
     * Formatiert Portfolio-Empfehlungstext für Multi-App
     */
    formatPortfolioRecommendationText(topProvider, metrics, aggregatedTCO) {
        const provider = topProvider.provider;
        const score = topProvider.aggregatedScore;
        const tco = aggregatedTCO[provider.id];

        const categoryNames = {
            hyperscaler: 'Hyperscaler',
            sovereign: 'Souveräne Cloud',
            eu: 'EU-Anbieter',
            private: 'Private Cloud',
            hybrid: 'Hybrid-Lösung'
        };

        let text = `Für Ihr **Portfolio von ${metrics.totalApps} Anwendungen** empfehlen wir **${provider.name}** als primären Cloud-Provider.\n\n`;

        text += `**${provider.name}** (${categoryNames[provider.category]}) erreicht einen gewichteten Portfolio-Score von **${score.toFixed(1)} Punkten** `;
        text += `über alle ${metrics.totalComponents} Komponenten hinweg. `;
        text += `Die geschätzten Gesamtkosten liegen bei **~${this.formatCurrency(tco.totalMonthly)}€ pro Monat**.\n\n`;

        // Generische Service-Namen für bessere Lesbarkeit
        const genericServiceNames = {
            'database_sql': 'SQL Datenbank', 'database_nosql': 'NoSQL Datenbank',
            'compute': 'Compute', 'kubernetes': 'Kubernetes', 'serverless': 'Serverless',
            'storage_object': 'Object Storage', 'storage_block': 'Block Storage', 'storage_file': 'File Storage',
            'loadbalancer': 'Load Balancer', 'cdn': 'CDN', 'dns': 'DNS',
            'messaging': 'Messaging', 'cache': 'Cache', 'container_registry': 'Container Registry',
            'secrets': 'Secrets Management', 'monitoring': 'Monitoring', 'logging': 'Logging',
            'ai_ml': 'AI/ML', 'identity': 'Identity Management'
        };

        // Gründe für die Empfehlung
        text += `**Gründe für diese Empfehlung:**\n`;

        // Abdeckung mit Details zu fehlenden Services
        const coveragePercent = Math.round(topProvider.serviceAnalysis.coverage);
        if (topProvider.serviceAnalysis.missing.length > 0 || topProvider.serviceAnalysis.preview.length > 0) {
            const missingCount = topProvider.serviceAnalysis.missing.length;
            const previewCount = topProvider.serviceAnalysis.preview.length;

            let coverageDetails = '';
            if (missingCount > 0) {
                const missingList = topProvider.serviceAnalysis.missing
                    .map(id => genericServiceNames[id] || id)
                    .slice(0, 3)
                    .join(', ');
                const moreCount = missingCount > 3 ? ` (+${missingCount - 3} weitere)` : '';
                coverageDetails += `${missingCount} fehlend (${missingList}${moreCount})`;
            }
            if (previewCount > 0) {
                const previewList = topProvider.serviceAnalysis.preview
                    .map(id => genericServiceNames[id] || id)
                    .slice(0, 3)
                    .join(', ');
                const moreCount = previewCount > 3 ? ` (+${previewCount - 3} weitere)` : '';
                if (coverageDetails) coverageDetails += ', ';
                coverageDetails += `${previewCount} in Preview (${previewList}${moreCount})`;
            }

            text += `• **Abdeckung**: ${coveragePercent}% verfügbar (${coverageDetails})\n`;
        } else {
            text += `• **Vollständige Abdeckung**: ${coveragePercent}% der benötigten Services sind verfügbar\n`;
        }

        text += `• **Einheitliche Plattform**: Vereinfachtes Management über alle ${metrics.totalApps} Anwendungen\n`;
        text += `• **Optimales Preis-Leistungs-Verhältnis**: Bestes Gesamtergebnis unter Berücksichtigung Ihrer Gewichtung\n`;

        // Detaillierte Hinweise zu fehlenden Services
        if (topProvider.serviceAnalysis.missing.length > 0) {
            const missingList = topProvider.serviceAnalysis.missing
                .map(id => genericServiceNames[id] || id)
                .slice(0, 5)
                .join(', ');
            const moreCount = topProvider.serviceAnalysis.missing.length > 5
                ? ` (+${topProvider.serviceAnalysis.missing.length - 5} weitere)`
                : '';

            text += `\n**Hinweis zu fehlenden Services**: ${missingList}${moreCount} sind nicht nativ verfügbar. `;
            text += `Empfehlung: Self-Build auf VMs oder Partner-Lösungen einsetzen.`;
        }

        if (topProvider.serviceAnalysis.preview.length > 0) {
            const previewList = topProvider.serviceAnalysis.preview
                .map(id => genericServiceNames[id] || id)
                .slice(0, 5)
                .join(', ');
            const moreCount = topProvider.serviceAnalysis.preview.length > 5
                ? ` (+${topProvider.serviceAnalysis.preview.length - 5} weitere)`
                : '';

            text += `\n\n**Hinweis zu Preview-Services**: ${previewList}${moreCount} sind noch in der Preview-Phase und sollten für produktive Workloads mit Vorsicht eingesetzt werden.`;
        }

        return this.formatRecommendationText(text);
    },


    // ── Popup, Detail-Rendering & Provider-Ratings ────────────────────────

    openDetailPopup(providerResult) {
        const overlay = document.getElementById('detailPopupOverlay');
        const title = document.getElementById('detailPopupTitle');
        const content = document.getElementById('detailPopupContent');

        if (!overlay || !content) return;

        title.textContent = `${providerResult.provider.name} - Detailanalyse`;
        content.innerHTML = this.renderProviderDetailContent(providerResult);
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
        content.innerHTML = this.renderAggregatedProviderDetailContent(aggregatedProvider, aggregatedTCO);
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
        } else if (this.analysisResults && this.analysisResults.length > 0) {
            // Single-App: Zeige analysierte Provider
            providersToShow = this.analysisResults;
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
            return `
                <tr>
                    <td>${detail.name || detail.id}${detail.isSelfBuild ? ' <span style="color: var(--btc-warning);">(Self-Build)</span>' : ''}</td>
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
                <div style="font-size: 0.75rem; color: var(--text-secondary); padding-left: 32px;">
                    <strong>Quellen:</strong>
                    <a href="https://calculator.aws/" target="_blank" rel="noopener" style="color: #FF9900; margin-left: 8px;">AWS Pricing</a> |
                    <a href="https://azure.microsoft.com/pricing/" target="_blank" rel="noopener" style="color: #0078D4; margin-left: 4px;">Azure Pricing</a> |
                    <a href="https://cloud.google.com/compute/all-pricing" target="_blank" rel="noopener" style="color: #4285F4; margin-left: 4px;">GCP Pricing</a>
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

    /**
     * Rendert den Inhalt des Detail-Popups
     */
    renderProviderDetailContent(result) {
        const provider = result.provider;
        const score = result.score;
        const tco = result.tcoEstimate;
        const services = result.serviceAnalysis;

        const categoryIcons = {
            hyperscaler: '🌐',
            sovereign: '🏛️',
            eu: '🇪🇺',
            private: '🔒',
            hybrid: '🔄'
        };

        const categoryNames = {
            hyperscaler: 'Hyperscaler',
            sovereign: 'Souveräne Cloud',
            eu: 'EU-Anbieter',
            private: 'Private Cloud',
            hybrid: 'Hybrid-Lösung'
        };

        return `
            <div class="provider-detail-header">
                <div class="provider-detail-logo" style="background: ${provider.color}20; color: ${provider.color};">
                    ${IconMapper.toFontAwesome(categoryIcons[provider.category] || '☁️', 'provider')}
                </div>
                <div class="provider-detail-info">
                    <h4>${provider.name}</h4>
                    <p>${categoryNames[provider.category]} | ${provider.description || ''}</p>
                </div>
            </div>

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
    },

    /**
     * Rendert aggregierte Portfolio-Details
     */
    renderAggregatedProviderDetailContent(aggregatedProvider, aggregatedTCO) {
        const provider = aggregatedProvider.provider;
        const aggregatedScore = aggregatedProvider.aggregatedScore;
        const serviceAnalysis = aggregatedProvider.serviceAnalysis;
        const appScores = aggregatedProvider.appScores;
        const tco = aggregatedTCO;

        const categoryIcons = {
            hyperscaler: '🌐',
            sovereign: '🏛️',
            eu: '🇪🇺',
            private: '🔒',
            hybrid: '🔄'
        };

        const categoryNames = {
            hyperscaler: 'Hyperscaler',
            sovereign: 'Souveräne Cloud',
            eu: 'EU-Anbieter',
            private: 'Private Cloud',
            hybrid: 'Hybrid-Lösung'
        };

        // TCO-Details per App gruppieren
        const tcoByApp = {};
        if (aggregatedProvider.tcoEstimate?.consumption?.details) {
            aggregatedProvider.tcoEstimate.consumption.details.forEach(detail => {
                const appName = detail.appName || 'Unbekannt';
                if (!tcoByApp[appName]) {
                    tcoByApp[appName] = [];
                }
                tcoByApp[appName].push(detail);
            });
        }

        return `
            <div class="provider-detail-header">
                <div class="provider-detail-logo" style="background: ${provider.color}20; color: ${provider.color};">
                    ${IconMapper.toFontAwesome(categoryIcons[provider.category] || '☁️', 'provider')}
                </div>
                <div class="provider-detail-info">
                    <h4>${provider.name}</h4>
                    <p>${categoryNames[provider.category]} | Portfolio-Analyse über ${appScores.length} Anwendungen</p>
                </div>
            </div>

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

};
