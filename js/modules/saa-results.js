// SAAResults Module
// Verantwortlich für: Ergebnis-Rendering, Provider-Cards, TCO-Übersicht, Vergleichstabelle
// Wird aufgerufen via SAAResults.METHOD.call(app) aus saa-app.js

const SAAResults = {
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
    }


};
