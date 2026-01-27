/**
 * Sovereign Architecture Advisor - Main Application
 * Hauptlogik und UI-Steuerung mit Debouncing und Tooltips
 */

/**
 * Icon Utilities - Mapping von Emojis zu Font Awesome Icons
 */
const IconMapper = {
    // Komponenten-Icons
    component: {
        '🖥️': 'fa-solid fa-server',
        '💻': 'fa-solid fa-microchip',
        '☸️': 'fa-solid fa-dharmachakra',
        '⚡': 'fa-solid fa-bolt',
        '🗄️': 'fa-solid fa-database',
        '📊': 'fa-solid fa-chart-simple',
        '📦': 'fa-solid fa-box',
        '💾': 'fa-solid fa-hard-drive',
        '📁': 'fa-solid fa-folder',
        '⚖️': 'fa-solid fa-scale-balanced',
        '🌐': 'fa-solid fa-globe',
        '🔗': 'fa-solid fa-link',
        '📬': 'fa-solid fa-envelope',
        '📨': 'fa-solid fa-envelope',
        '🚀': 'fa-solid fa-rocket',
        '📈': 'fa-solid fa-chart-line',
        '📋': 'fa-solid fa-clipboard-list',
        '🔐': 'fa-solid fa-lock',
        '👤': 'fa-solid fa-user',
        '🤖': 'fa-solid fa-robot',
        '🔍': 'fa-solid fa-magnifying-glass',
        '🐘': 'fa-brands fa-php',
        '🏗️': 'fa-solid fa-building',
        '☁️': 'fa-solid fa-cloud'
    },
    // Cloud Provider Kategorien
    provider: {
        '🌐': 'fa-solid fa-globe',
        '🏛️': 'fa-solid fa-landmark',
        '🇪🇺': 'fa-solid fa-flag',
        '🔒': 'fa-solid fa-lock',
        '🔄': 'fa-solid fa-rotate',
        '☁️': 'fa-solid fa-cloud'
    },
    // Utility Icons (TCO, Warnings, etc.)
    utility: {
        '💰': 'fa-solid fa-coins',
        '👥': 'fa-solid fa-users',
        '📅': 'fa-solid fa-calendar-days',
        '⚠️': 'fa-solid fa-triangle-exclamation',
        '✓': 'fa-solid fa-check',
        '⚡': 'fa-solid fa-bolt',
        '📦': 'fa-solid fa-box',
        '📊': 'fa-solid fa-chart-simple',
        '🔒': 'fa-solid fa-lock',
        'ℹ️': 'fa-solid fa-circle-info'
    },
    // Konvertiert Emoji zu Font Awesome Icon
    toFontAwesome(emoji, category = 'component') {
        const mapping = this[category];
        const iconClass = mapping[emoji] || 'fa-solid fa-cloud';
        return `<i class="${iconClass}"></i>`;
    }
};

class SovereignArchitectureAdvisor {
    constructor() {
        this.currentStep = 0; // Start bei Step 0 (Auswahl)
        this.totalSteps = 3;

        // ========== MULTI-APP SUPPORT ==========
        this.isMultiAppMode = false; // Toggle zwischen Single-App und Multi-App
        this.applications = []; // Array von ApplicationInstance
        this.currentAppIndex = 0; // Aktive App während Konfiguration
        this.aggregatedResults = null; // Portfolio-Analyse-Ergebnisse

        // ========== SINGLE-APP STATE (für Backward Compatibility) ==========
        this._selectedComponents = new Set();
        this._componentConfigs = {}; // Konfiguration je Komponente
        this._componentInstances = {}; // { componentId: [config1, config2, ...] } für Multi-Instance
        this._applicationData = null;
        this._analysisResults = null;
        this._selectedSizing = 'medium'; // Gewähltes Sizing: small, medium, large
        this._systemConfig = null; // Gespeicherte System-Konfiguration

        // ========== SHARED STATE ==========
        this.strategyWeight = 50; // Legacy, wird durch weights ersetzt
        this.debounceTimer = null;
        this.debounceDelay = 150; // ms
        this.apiKey = null; // Claude API Key
        this.selectedDropdownIndex = -1; // Für Dropdown-Keyboard-Navigation

        // Gewichtungen für den Algorithmus (4 Dimensionen)
        this.weights = {
            control: 25,      // Kontrolle/Souveränität
            performance: 25,  // Leistung
            availability: 35, // Service-Verfügbarkeit
            cost: 15          // Kosteneffizienz
        };
        this.selectedPreset = 'balanced';

        // Reife-Faktor Einstellungen (Penalties für unreife Services)
        this.maturitySettings = {
            enabled: true,           // Reife-Faktor aktivieren
            previewPenalty: 2,       // % Abzug pro Preview-Service
            missingPenalty: 3        // % Abzug pro fehlendem Service
        };

        // Betriebsaufwand-Einstellungen
        this.operationsSettings = {
            includeInCosts: true     // Betriebsaufwand in TCO-Berechnung einbeziehen
        };

        // Projektaufwand-Einstellungen
        this.projectEffortSettings = {
            includeInCosts: true     // Projektaufwand in TCO-Berechnung einbeziehen
        };

        // Preset-Definitionen
        this.presets = {
            balanced: { control: 25, performance: 25, availability: 35, cost: 15 },
            sovereign: { control: 50, performance: 15, availability: 25, cost: 10 },
            performance: { control: 10, performance: 60, availability: 20, cost: 10 },
            cost: { control: 10, performance: 10, availability: 20, cost: 60 },
            availability: { control: 15, performance: 20, availability: 55, cost: 10 },
            custom: { control: 25, performance: 25, availability: 35, cost: 15 }
        };

        // Module initialisieren
        this.analyzer = new CloudAnalyzer(cloudProviders, architectureComponents);
        this.researcher = new ApplicationResearcher(knownApplications);
        this.appMatcher = new ApplicationMatcher(knownApplications);
        this.sizingDetector = new SizingDetector();

        this.init();
    }

    // ========== BACKWARD COMPATIBILITY GETTERS/SETTERS ==========
    get selectedComponents() {
        if (this.isMultiAppMode && this.applications[this.currentAppIndex]) {
            return this.applications[this.currentAppIndex].selectedComponents;
        }
        return this._selectedComponents;
    }
    set selectedComponents(value) { this._selectedComponents = value; }

    get componentConfigs() {
        if (this.isMultiAppMode && this.applications[this.currentAppIndex]) {
            return this.applications[this.currentAppIndex].componentConfigs;
        }
        return this._componentConfigs;
    }
    set componentConfigs(value) { this._componentConfigs = value; }

    get applicationData() {
        if (this.isMultiAppMode && this.applications[this.currentAppIndex]) {
            return this.applications[this.currentAppIndex].applicationData;
        }
        return this._applicationData;
    }
    set applicationData(value) { this._applicationData = value; }

    get analysisResults() {
        if (this.isMultiAppMode && this.applications[this.currentAppIndex]) {
            return this.applications[this.currentAppIndex].analysisResults;
        }
        return this._analysisResults;
    }
    set analysisResults(value) { this._analysisResults = value; }

    get selectedSizing() {
        if (this.isMultiAppMode && this.applications[this.currentAppIndex]) {
            return this.applications[this.currentAppIndex].sizing;
        }
        return this._selectedSizing;
    }
    set selectedSizing(value) { this._selectedSizing = value; }

    get systemConfig() {
        if (this.isMultiAppMode && this.applications[this.currentAppIndex]) {
            return this.applications[this.currentAppIndex].systemConfig;
        }
        return this._systemConfig;
    }
    set systemConfig(value) { this._systemConfig = value; }

    init() {
        this.loadSettings(); // Lade gespeicherte Einstellungen
        this.loadSessionState(); // Lade Session-State (bei F5)
        this.bindEvents();
        this.updateStepDisplay(); // Erst Step Display setzen
        this.initTooltipSystem();
        // renderComponents() wird erst bei Step 2 aufgerufen
    }

    /**
     * Lädt den Session-State aus SessionStorage (für F5-Persistenz)
     */
    loadSessionState() {
        try {
            const stored = sessionStorage.getItem('saa_session_state');
            if (stored) {
                const state = JSON.parse(stored);

                // Restore state
                this.currentStep = state.currentStep || 0;
                this.isMultiAppMode = state.isMultiAppMode || false;

                if (state.isMultiAppMode) {
                    this.applications = state.applications || [];
                    this.currentAppIndex = state.currentAppIndex || 0;
                    this.aggregatedResults = state.aggregatedResults || null;
                } else {
                    // Single-App State
                    this._selectedComponents = new Set(state.selectedComponents || []);
                    this._componentConfigs = state.componentConfigs || {};
                    this._componentInstances = state.componentInstances || {};
                    this._applicationData = state.applicationData || null;
                    this._analysisResults = state.analysisResults || null;
                    this._selectedSizing = state.selectedSizing || 'medium';
                    this._systemConfig = state.systemConfig || null;
                }

                console.log('Session-State wiederhergestellt:', state);

                // Custom Scores neu laden (falls sie in der Zwischenzeit geändert wurden)
                this.analyzer.customScores = this.analyzer.loadCustomScores();

                // UI entsprechend aktualisieren
                if (this.currentStep === 2) {
                    // Komponenten-Auswahl wiederherstellen
                    setTimeout(() => {
                        this.renderComponents();
                        this.updateComponentSelection();
                    }, 100);
                } else if (this.currentStep === 3) {
                    // Analyse-Ergebnisse wiederherstellen
                    // WICHTIG: Analyse neu berechnen, da Custom Scores sich geändert haben könnten
                    setTimeout(() => {
                        if (this.isMultiAppMode && this.applications.length > 0) {
                            // Multi-App: Neuberechnung durchführen
                            this.runMultiAppAnalysis();
                        } else if (this._selectedComponents && this._selectedComponents.size > 0) {
                            // Single-App: Neuberechnung durchführen
                            this.runAnalysis();
                        }
                    }, 100);
                }
            }
        } catch (e) {
            console.error('Fehler beim Laden des Session-State:', e);
        }
    }

    /**
     * Speichert den aktuellen Session-State in SessionStorage
     */
    saveSessionState() {
        try {
            const state = {
                currentStep: this.currentStep,
                isMultiAppMode: this.isMultiAppMode
            };

            if (this.isMultiAppMode) {
                state.applications = this.applications;
                state.currentAppIndex = this.currentAppIndex;
                state.aggregatedResults = this.aggregatedResults;
            } else {
                // Single-App State
                state.selectedComponents = Array.from(this._selectedComponents);
                state.componentConfigs = this._componentConfigs;
                state.componentInstances = this._componentInstances;
                state.applicationData = this._applicationData;
                state.analysisResults = this._analysisResults;
                state.selectedSizing = this._selectedSizing;
                state.systemConfig = this._systemConfig;
            }

            sessionStorage.setItem('saa_session_state', JSON.stringify(state));
        } catch (e) {
            console.error('Fehler beim Speichern des Session-State:', e);
        }
    }

    /**
     * Lädt gespeicherte Algorithmus-Einstellungen aus LocalStorage
     */
    loadSettings() {
        try {
            const stored = localStorage.getItem('saa_algorithm_settings');
            if (stored) {
                const settings = JSON.parse(stored);

                // Gewichtungen laden
                if (settings.weights) {
                    this.weights = settings.weights;
                }
                if (settings.selectedPreset) {
                    this.selectedPreset = settings.selectedPreset;
                }

                // Maturity-Einstellungen laden
                if (settings.maturitySettings) {
                    this.maturitySettings = settings.maturitySettings;
                }

                // Operations-Einstellungen laden
                if (settings.operationsSettings) {
                    this.operationsSettings = settings.operationsSettings;
                }

                // Projektaufwand-Einstellungen laden
                if (settings.projectEffortSettings) {
                    this.projectEffortSettings = settings.projectEffortSettings;
                }

                console.log('Algorithmus-Einstellungen geladen:', settings);
            }
        } catch (e) {
            console.error('Fehler beim Laden der Einstellungen:', e);
        }
    }

    /**
     * Speichert aktuelle Algorithmus-Einstellungen in LocalStorage
     */
    saveSettings() {
        try {
            const settings = {
                weights: this.weights,
                selectedPreset: this.selectedPreset,
                maturitySettings: this.maturitySettings,
                operationsSettings: this.operationsSettings,
                projectEffortSettings: this.projectEffortSettings
            };
            localStorage.setItem('saa_algorithm_settings', JSON.stringify(settings));
            console.log('Algorithmus-Einstellungen gespeichert:', settings);
        } catch (e) {
            console.error('Fehler beim Speichern der Einstellungen:', e);
        }
    }

    /**
     * Initialisiert das globale Tooltip-System für Tabellen
     */
    initTooltipSystem() {
        // Tooltip-Element erstellen
        const tooltip = document.createElement('div');
        tooltip.id = 'globalTooltip';
        tooltip.className = 'global-tooltip';
        document.body.appendChild(tooltip);

        // Speichere Referenz auf die App-Instanz
        const app = this;

        // Event-Delegation für Tooltips
        document.addEventListener('mouseover', (e) => {
            const badge = e.target.closest('[data-tooltip]');
            if (badge) {
                const rect = badge.getBoundingClientRect();
                let content = badge.dataset.tooltip;

                // Prüfe, ob es escaped JSON-Daten sind (Service-Tooltip)
                if (content.startsWith('&') || content.startsWith('{')) {
                    try {
                        // Dekodiere HTML-Entities zurück
                        const decodedContent = content
                            .replace(/&quot;/g, '"')
                            .replace(/&#39;/g, "'")
                            .replace(/&lt;/g, '<')
                            .replace(/&gt;/g, '>')
                            .replace(/&amp;/g, '&');

                        const service = JSON.parse(decodedContent);
                        content = app.formatServiceTooltipHTML(service);
                    } catch (err) {
                        console.error('Tooltip JSON parse error:', err, 'Content:', content);
                        // Fallback auf normalen Text
                        content = content
                            .replace(/\n\n/g, '</p><p class="tooltip-section">')
                            .replace(/\n/g, '<br>')
                            .replace(/^/, '<p>')
                            .replace(/$/, '</p>');
                    }
                } else {
                    // Text formatieren: Zeilenumbrüche und Absätze
                    content = content
                        .replace(/\n\n/g, '</p><p class="tooltip-section">')  // Doppelte Umbrüche = neuer Absatz
                        .replace(/\n/g, '<br>')              // Einzelne Umbrüche
                        .replace(/^/, '<p>')                 // Start-Tag
                        .replace(/$/, '</p>');               // End-Tag
                }

                tooltip.innerHTML = content;
                tooltip.classList.add('visible');

                // Position berechnen - unterhalb des Elements
                const tooltipRect = tooltip.getBoundingClientRect();
                let left = rect.left + rect.width / 2 - tooltipRect.width / 2;
                let top = rect.bottom + 8;

                // Bildschirmgrenzen prüfen
                if (left < 10) left = 10;
                if (left + tooltipRect.width > window.innerWidth - 10) {
                    left = window.innerWidth - tooltipRect.width - 10;
                }
                if (top + tooltipRect.height > window.innerHeight - 10) {
                    top = rect.top - tooltipRect.height - 8;
                }

                tooltip.style.left = left + 'px';
                tooltip.style.top = top + 'px';
            }
        });

        document.addEventListener('mouseout', (e) => {
            const badge = e.target.closest('[data-tooltip]');
            if (badge) {
                tooltip.classList.remove('visible');
            }
        });
    }

    /**
     * Debounce-Funktion für Performance-kritische Updates
     */
    debounce(func, delay = this.debounceDelay) {
        return (...args) => {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = setTimeout(() => func.apply(this, args), delay);
        };
    }

    bindEvents() {
        // Search Button
        const searchBtn = document.getElementById('searchBtn');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => this.searchApplication());
        }

        // Search Input Enter + Dropdown
        const searchInput = document.getElementById('appSearchInput');
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.hideAppDropdown();
                    this.searchApplication();
                }
            });
            searchInput.addEventListener('focus', () => this.showAppDropdown());
            searchInput.addEventListener('input', () => this.filterAppDropdown());
            searchInput.addEventListener('keydown', (e) => this.handleDropdownKeyboard(e));
        }

        // Close dropdown on outside click
        document.addEventListener('click', (e) => {
            const dropdown = document.getElementById('appDropdown');
            const input = document.getElementById('appSearchInput');
            if (dropdown && input && !dropdown.contains(e.target) && e.target !== input) {
                this.hideAppDropdown();
            }
        });

        // Quick Suggestions
        document.querySelectorAll('.quick-suggestion').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const app = e.target.dataset.app;

                if (app === 'custom') {
                    // Benutzerdefinierte App: Direkt zur manuellen Auswahl
                    this.applicationData = null;
                    document.getElementById('researchResult').style.display = 'none';
                    document.getElementById('appSearchInput').value = 'Benutzerdefinierte Anwendung';
                    this.nextStep();
                } else {
                    document.getElementById('appSearchInput').value = app;
                    this.searchApplication();
                }
            });
        });

        // Navigation Buttons - onclick wird dynamisch in updateNavigationState() gesetzt
        document.getElementById('prevBtn')?.addEventListener('click', () => this.prevStep());

        // Skip to manual selection
        document.getElementById('skipToManual')?.addEventListener('click', () => {
            this.applicationData = null;
            document.getElementById('researchResult').style.display = 'none';
            this.nextStep();
        });

        // Klickbare Wizard-Steps
        document.querySelectorAll('.wizard-step').forEach((step) => {
            step.style.cursor = 'pointer';
            step.addEventListener('click', (e) => {
                const targetStep = parseInt(step.dataset.step);
                if (targetStep && targetStep !== this.currentStep) {
                    this.goToStep(targetStep);
                }
            });
        });

        // Settings/Algorithmus Button
        document.getElementById('settingsBtn')?.addEventListener('click', () => this.openSettings());
        document.getElementById('closeSettingsBtn')?.addEventListener('click', () => this.closeSettings());
        document.getElementById('settingsOverlay')?.addEventListener('click', (e) => {
            if (e.target.id === 'settingsOverlay') this.closeSettings();
        });

        // Preset Cards
        document.querySelectorAll('.preset-card').forEach(card => {
            card.addEventListener('click', () => {
                const preset = card.dataset.preset;
                this.selectPreset(preset);
            });
        });

        // Custom Weight Inputs
        ['customControl', 'customPerformance', 'customAvailability', 'customCost'].forEach(id => {
            document.getElementById(id)?.addEventListener('input', () => this.updateCustomWeights());
        });

        // API Key Toggle
        document.getElementById('toggleApiKeyBtn')?.addEventListener('click', () => this.toggleApiKeyVisibility());

        // API Key Input Change
        document.getElementById('apiKeyInput')?.addEventListener('input', (e) => this.validateApiKey(e.target.value));

        // Maturity Factor Settings
        document.getElementById('maturityEnabled')?.addEventListener('change', (e) => this.updateMaturitySettings());
        document.getElementById('previewPenalty')?.addEventListener('input', () => this.updateMaturitySettings());
        document.getElementById('missingPenalty')?.addEventListener('input', () => this.updateMaturitySettings());

        // Operations Settings
        document.getElementById('operationsEnabled')?.addEventListener('change', (e) => this.updateOperationsSettings());

        // Project Effort Settings
        document.getElementById('projectEffortEnabled')?.addEventListener('change', (e) => this.updateProjectEffortSettings());

        // Detail Popup Overlay Click
        document.getElementById('detailPopupOverlay')?.addEventListener('click', (e) => {
            if (e.target.id === 'detailPopupOverlay') this.closeDetailPopup();
        });

        // ========== MULTI-APP EVENT HANDLERS ==========

        // Parse Apps Button (Step 0)
        document.getElementById('parseAppsBtn')?.addEventListener('click', () => {
            const input = document.getElementById('multiAppInput');
            if (input && input.value.trim()) {
                this.startMultiAppMode(input.value);
            }
        });

        // Mode Toggle Buttons (Step 0)
        document.getElementById('singleModeBtn')?.addEventListener('click', () => {
            // Aktiviere Single-App-Modus
            this.isMultiAppMode = false;
            this.applications = [];
            this.currentAppIndex = 0;
            this.aggregatedResults = null;
            this._analysisResults = null;

            document.getElementById('singleModeBtn').classList.add('active');
            document.getElementById('multiModeBtn').classList.remove('active');
            document.getElementById('singleAppInputMode').style.display = 'block';
            document.getElementById('multiAppInputMode').style.display = 'none';

            // Zurück zu Step 0 wenn nicht bereits dort
            if (this.currentStep !== 0) {
                this.goToStep(0);
            }
        });

        document.getElementById('multiModeBtn')?.addEventListener('click', () => {
            // Aktiviere Multi-App-Modus
            this.isMultiAppMode = true;
            this._analysisResults = null;

            document.getElementById('multiModeBtn').classList.add('active');
            document.getElementById('singleModeBtn').classList.remove('active');
            document.getElementById('singleAppInputMode').style.display = 'none';
            document.getElementById('multiAppInputMode').style.display = 'block';

            // Zurück zu Step 0 wenn nicht bereits dort
            if (this.currentStep !== 0) {
                this.goToStep(0);
            }
        });

        // Template Buttons (Step 0)
        document.querySelectorAll('[data-template]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const template = e.target.dataset.template;
                this.loadTemplate(template);
            });
        });

        // App Navigation Buttons (Step 2 Multi-App)
        document.getElementById('prevAppBtn')?.addEventListener('click', () => this.goToPrevApp());
        document.getElementById('nextAppBtn')?.addEventListener('click', () => this.goToNextApp());

        // Wizard Steps klickbar machen (Zurück-Navigation)
        document.querySelectorAll('.wizard-step').forEach(step => {
            step.addEventListener('click', () => {
                const stepNum = parseInt(step.dataset.step);
                // Nur zurück navigieren erlauben (zu completed steps)
                if (stepNum < this.currentStep) {
                    this.goToStep(stepNum);
                }
            });
        });
    }

    /**
     * Bindet Slider-Events mit Debouncing
     */
    bindSliderEvents() {
        const slider = document.getElementById('analysisStrategySlider');
        if (!slider) return;

        // Debounced Analysis (nur nach Ende der Bewegung)
        const debouncedAnalysis = this.debounce(() => {
            if (this.isMultiAppMode) {
                this.runMultiAppAnalysis();
            } else {
                this.runAnalysis();
            }
        }, 200);

        // Sofortige visuelle Updates, verzögerte Analyse
        slider.addEventListener('input', (e) => {
            this.strategyWeight = parseInt(e.target.value);
            this.updateStrategyDisplayOnly();
            debouncedAnalysis();
        });
    }

    /**
     * Aktualisiert nur das Display ohne Neuberechnung
     */
    updateStrategyDisplayOnly() {
        const display = document.getElementById('strategyValueDisplay');
        if (display) {
            const control = 100 - this.strategyWeight;
            display.textContent = `Kontrolle ${control}% : ${this.strategyWeight}% Leistung`;
        }

        const thumb = document.getElementById('analysisSliderThumb');
        if (thumb) {
            thumb.style.left = `${this.strategyWeight}%`;
        }
    }

    renderComponents() {
        // Container auswählen basierend auf Modus
        const containerId = this.isMultiAppMode ? 'currentAppComponentsContainer' : 'componentsContainer';
        const container = document.getElementById(containerId);
        if (!container) return;

        // Nach Kategorien gruppieren
        const grouped = {};
        architectureComponents.forEach(comp => {
            if (!grouped[comp.category]) {
                grouped[comp.category] = [];
            }
            grouped[comp.category].push(comp);
        });

        let html = '';
        for (const [categoryId, components] of Object.entries(grouped)) {
            const category = componentCategories[categoryId];
            html += `
                <div class="category-group">
                    <div class="category-header">
                        <div class="category-dot" style="background: ${category.color}"></div>
                        <h3 class="category-title">${category.name}</h3>
                    </div>
                    <div class="components-grid">
                        ${components.map(comp => {
                            // Render original component
                            let cards = [this.renderComponentCard(comp)];

                            // Render all instances (nicht nur sequenzielle!)
                            // Finde alle Instanzen dieser Komponente in selectedComponents
                            const instances = Array.from(this.selectedComponents)
                                .filter(id => {
                                    // Prüfe ob es eine Instanz dieser Komponente ist (z.B. compute-2, compute-5)
                                    const match = id.match(new RegExp(`^${comp.id}-(\\d+)$`));
                                    return match !== null;
                                })
                                .sort((a, b) => {
                                    // Sortiere nach Instanznummer
                                    const numA = parseInt(a.split('-').pop());
                                    const numB = parseInt(b.split('-').pop());
                                    return numA - numB;
                                });

                            // Render alle gefundenen Instanzen
                            instances.forEach(instanceId => {
                                cards.push(this.renderComponentCard(comp, instanceId));
                            });

                            return cards.join('');
                        }).join('')}
                    </div>
                </div>
            `;
        }

        // Custom Component Section
        html += `
            <div class="custom-component-section">
                <div class="custom-component-title">Weitere Komponenten</div>
                <p style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 0.5rem;">
                    Falls Sie zusätzliche Anforderungen haben, beschreiben Sie diese hier:
                </p>
                <textarea
                    id="customComponents"
                    class="custom-component-input"
                    rows="3"
                    placeholder="z.B. SAP-Zertifizierung, GPU-Compute, spezielle Compliance-Anforderungen..."
                ></textarea>
            </div>
        `;

        container.innerHTML = html;

        // Event Listener für Komponenten
        container.querySelectorAll('.component-card').forEach(card => {
            const isSelected = card.classList.contains('selected');

            if (!isSelected) {
                // Nicht ausgewählt: Ganze Karte ist klickbar
                card.style.cursor = 'pointer';
                card.addEventListener('click', (e) => {
                    // Ignoriere clicks auf action buttons falls vorhanden
                    if (e.target.closest('.component-actions')) return;
                    this.toggleComponent(card.dataset.id);
                });
            } else {
                // Ausgewählt: Nur Buttons sind klickbar
                card.style.cursor = 'default';
            }

            // Checkbox Button für ausgewählte Komponenten
            const checkboxBtn = card.querySelector('.component-checkbox-btn');
            if (checkboxBtn) {
                checkboxBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    const componentId = checkboxBtn.dataset.componentId;
                    const isInstance = checkboxBtn.dataset.isInstance === 'true';

                    if (isInstance) {
                        // Instanz abwählen = entfernen
                        this.removeComponentInstance(componentId);
                    } else {
                        // Basis-Komponente abwählen
                        this.toggleComponent(componentId);
                    }
                });
            }

            // Leere Checkbox für nicht ausgewählte
            const emptyCheckbox = card.querySelector('.component-checkbox');
            if (emptyCheckbox) {
                emptyCheckbox.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.toggleComponent(card.dataset.id);
                });
            }
        });

        // Event Listener für Plus-Button (Instanz hinzufügen)
        container.querySelectorAll('.component-add-instance-btn-compact').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const componentId = btn.dataset.componentId;
                this.addComponentInstance(componentId);
            });
        });

        // Event Listener für Config-Felder
        this.bindComponentConfigEvents(container);
    }

    /**
     * Bindet Event-Handler für Komponenten-Konfigurationsfelder
     */
    bindComponentConfigEvents(container) {
        // Standard-Felder (input, select)
        container.querySelectorAll('.component-config-panel input:not([data-vm-index]), .component-config-panel select').forEach(input => {
            const componentId = input.dataset.component;
            const fieldId = input.dataset.field;

            input.addEventListener('change', () => {
                this.updateComponentConfig(componentId, fieldId, input.value);
            });
            input.addEventListener('input', () => {
                this.updateComponentConfig(componentId, fieldId, input.value);
            });
        });

        // VM-Group Felder
        container.querySelectorAll('.vm-group-container input[data-vm-index]').forEach(input => {
            input.addEventListener('change', (e) => {
                this.updateVMGroupField(e.target);
            });
            input.addEventListener('input', (e) => {
                this.updateVMGroupField(e.target);
            });
        });

        // DB-Group Felder
        container.querySelectorAll('.vm-group-container input[data-db-index], .vm-group-container select[data-db-index]').forEach(input => {
            input.addEventListener('change', (e) => {
                this.updateDBGroupField(e.target);
            });
            input.addEventListener('input', (e) => {
                this.updateDBGroupField(e.target);
            });
        });

        // Storage-Group Felder
        container.querySelectorAll('.vm-group-container input[data-vol-index], .vm-group-container select[data-vol-index]').forEach(input => {
            input.addEventListener('change', (e) => {
                this.updateStorageGroupField(e.target);
            });
            input.addEventListener('input', (e) => {
                this.updateStorageGroupField(e.target);
            });
        });

        // Hinzufügen Buttons (VM, DB, Storage)
        container.querySelectorAll('.vm-add-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const componentId = btn.dataset.component;
                const fieldId = btn.dataset.field;
                const groupType = btn.dataset.groupType;

                if (groupType === 'db') {
                    this.addDBToGroup(componentId, fieldId);
                } else if (groupType === 'storage') {
                    this.addStorageToGroup(componentId, fieldId);
                } else {
                    this.addVMToGroup(componentId, fieldId);
                }
            });
        });

        // Löschen Buttons (VM, DB, Storage)
        container.querySelectorAll('.vm-delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const componentId = btn.dataset.component;
                const fieldId = btn.dataset.field;

                if (btn.dataset.vmIndex !== undefined) {
                    const vmIndex = parseInt(btn.dataset.vmIndex);
                    this.removeVMFromGroup(componentId, fieldId, vmIndex);
                } else if (btn.dataset.dbIndex !== undefined) {
                    const dbIndex = parseInt(btn.dataset.dbIndex);
                    this.removeDBFromGroup(componentId, fieldId, dbIndex);
                } else if (btn.dataset.volIndex !== undefined) {
                    const volIndex = parseInt(btn.dataset.volIndex);
                    this.removeStorageFromGroup(componentId, fieldId, volIndex);
                }
            });
        });
    }

    /**
     * Aktualisiert die Konfiguration einer Komponente
     */
    updateComponentConfig(componentId, fieldId, value) {
        if (!this.componentConfigs[componentId]) {
            this.initComponentConfig(componentId);
        }

        // Wert parsen (Zahlen als Zahlen speichern)
        const component = architectureComponents.find(c => c.id === componentId);
        const field = component?.configFields?.find(f => f.id === fieldId);
        if (field?.type === 'number') {
            value = parseInt(value) || 0;
        }

        this.componentConfigs[componentId][fieldId] = value;

        // Summary aktualisieren
        this.updateComponentConfigSummary(componentId);

        // systemConfig aktualisieren für TCO-Berechnung
        this.updateSystemConfigFromComponents();
    }

    /**
     * Aktualisiert ein einzelnes VM-Feld in einer VM-Group
     */
    updateVMGroupField(input) {
        const componentId = input.dataset.component;
        const fieldId = input.dataset.field;
        const vmIndex = parseInt(input.dataset.vmIndex);
        const vmField = input.dataset.vmField;

        if (!this.componentConfigs[componentId]) {
            this.initComponentConfig(componentId);
        }

        if (!Array.isArray(this.componentConfigs[componentId][fieldId])) {
            this.componentConfigs[componentId][fieldId] = [{ name: 'VM', cpu: 4, ram: 16, count: 1 }];
        }

        const vmGroups = this.componentConfigs[componentId][fieldId];
        if (!vmGroups[vmIndex]) return;

        // Wert parsen
        let value = input.value;
        if (vmField === 'cpu' || vmField === 'ram' || vmField === 'count') {
            value = parseInt(value) || 1;
        }

        vmGroups[vmIndex][vmField] = value;

        // Summary aktualisieren
        this.updateComponentConfigSummary(componentId);
        this.updateSystemConfigFromComponents();
    }

    /**
     * Fügt eine neue VM zu einer VM-Group hinzu
     */
    addVMToGroup(componentId, fieldId) {
        if (!this.componentConfigs[componentId]) {
            this.initComponentConfig(componentId);
        }

        if (!Array.isArray(this.componentConfigs[componentId][fieldId])) {
            this.componentConfigs[componentId][fieldId] = [];
        }

        const vmGroups = this.componentConfigs[componentId][fieldId];
        vmGroups.push({ name: `VM ${vmGroups.length + 1}`, cpu: 4, ram: 16, count: 1 });

        // Komponente neu rendern
        const component = architectureComponents.find(c => c.id === componentId);
        if (component) {
            this.updateComponentCard(component);
        }
    }

    /**
     * Entfernt eine VM aus einer VM-Group
     */
    removeVMFromGroup(componentId, fieldId, vmIndex) {
        if (!this.componentConfigs[componentId]) return;

        const vmGroups = this.componentConfigs[componentId][fieldId];
        if (!Array.isArray(vmGroups) || vmGroups.length <= 1) return;

        vmGroups.splice(vmIndex, 1);

        // Komponente neu rendern
        const component = architectureComponents.find(c => c.id === componentId);
        if (component) {
            this.updateComponentCard(component);
        }
    }

    /**
     * Aktualisiert ein einzelnes DB-Feld in einer DB-Group
     */
    updateDBGroupField(input) {
        const componentId = input.dataset.component;
        const fieldId = input.dataset.field;
        const dbIndex = parseInt(input.dataset.dbIndex);
        const dbField = input.dataset.dbField;

        if (!this.componentConfigs[componentId]) {
            this.initComponentConfig(componentId);
        }

        if (!Array.isArray(this.componentConfigs[componentId][fieldId])) {
            this.componentConfigs[componentId][fieldId] = [{ name: 'DB', type: 'PostgreSQL', size: 100 }];
        }

        const databases = this.componentConfigs[componentId][fieldId];
        if (!databases[dbIndex]) return;

        // Wert parsen
        let value = input.value;
        if (dbField === 'size') {
            value = parseInt(value) || 100;
        }

        databases[dbIndex][dbField] = value;

        // Summary aktualisieren
        this.updateComponentConfigSummary(componentId);
        this.updateSystemConfigFromComponents();
    }

    /**
     * Fügt eine neue Datenbank zu einer DB-Group hinzu
     */
    addDBToGroup(componentId, fieldId) {
        if (!this.componentConfigs[componentId]) {
            this.initComponentConfig(componentId);
        }

        if (!Array.isArray(this.componentConfigs[componentId][fieldId])) {
            this.componentConfigs[componentId][fieldId] = [];
        }

        const databases = this.componentConfigs[componentId][fieldId];
        databases.push({ name: `DB ${databases.length + 1}`, type: 'PostgreSQL', size: 100 });

        // Komponente neu rendern
        const component = architectureComponents.find(c => c.id === componentId);
        if (component) {
            this.updateComponentCard(component);
        }
    }

    /**
     * Entfernt eine Datenbank aus einer DB-Group
     */
    removeDBFromGroup(componentId, fieldId, dbIndex) {
        if (!this.componentConfigs[componentId]) return;

        const databases = this.componentConfigs[componentId][fieldId];
        if (!Array.isArray(databases) || databases.length <= 1) return;

        databases.splice(dbIndex, 1);

        // Komponente neu rendern
        const component = architectureComponents.find(c => c.id === componentId);
        if (component) {
            this.updateComponentCard(component);
        }
    }

    /**
     * Aktualisiert ein einzelnes Storage-Feld in einer Storage-Group
     */
    updateStorageGroupField(input) {
        const componentId = input.dataset.component;
        const fieldId = input.dataset.field;
        const volIndex = parseInt(input.dataset.volIndex);
        const volField = input.dataset.volField;

        if (!this.componentConfigs[componentId]) {
            this.initComponentConfig(componentId);
        }

        if (!Array.isArray(this.componentConfigs[componentId][fieldId])) {
            this.componentConfigs[componentId][fieldId] = [{ name: 'Volume', type: 'ssd', size: 200 }];
        }

        const volumes = this.componentConfigs[componentId][fieldId];
        if (!volumes[volIndex]) return;

        // Wert parsen
        let value = input.value;
        if (volField === 'size') {
            value = parseInt(value) || 200;
        }

        volumes[volIndex][volField] = value;

        // Summary aktualisieren
        this.updateComponentConfigSummary(componentId);
        this.updateSystemConfigFromComponents();
    }

    /**
     * Fügt ein neues Volume zu einer Storage-Group hinzu
     */
    addStorageToGroup(componentId, fieldId) {
        if (!this.componentConfigs[componentId]) {
            this.initComponentConfig(componentId);
        }

        if (!Array.isArray(this.componentConfigs[componentId][fieldId])) {
            this.componentConfigs[componentId][fieldId] = [];
        }

        const volumes = this.componentConfigs[componentId][fieldId];
        volumes.push({ name: `Volume ${volumes.length + 1}`, type: 'ssd', size: 200 });

        // Komponente neu rendern
        const component = architectureComponents.find(c => c.id === componentId);
        if (component) {
            this.updateComponentCard(component);
        }
    }

    /**
     * Entfernt ein Volume aus einer Storage-Group
     */
    removeStorageFromGroup(componentId, fieldId, volIndex) {
        if (!this.componentConfigs[componentId]) return;

        const volumes = this.componentConfigs[componentId][fieldId];
        if (!Array.isArray(volumes) || volumes.length <= 1) return;

        volumes.splice(volIndex, 1);

        // Komponente neu rendern
        const component = architectureComponents.find(c => c.id === componentId);
        if (component) {
            this.updateComponentCard(component);
        }
    }

    /**
     * Initialisiert die Konfiguration einer Komponente mit Defaults
     */
    initComponentConfig(componentId) {
        const component = architectureComponents.find(c => c.id === componentId);
        if (!component?.configFields) return;

        this.componentConfigs[componentId] = {};
        component.configFields.forEach(field => {
            this.componentConfigs[componentId][field.id] = field.default;
        });
    }


    /**
     * Aktualisiert die Konfigurations-Zusammenfassung einer Komponente
     */
    updateComponentConfigSummary(componentId) {
        const card = document.querySelector(`.component-card[data-id="${componentId}"]`);
        if (!card) return;

        const component = architectureComponents.find(c => c.id === componentId);
        const config = this.componentConfigs[componentId];
        if (!component?.configSummary || !config) return;

        let summaryEl = card.querySelector('.component-config-summary');
        if (!summaryEl) {
            const infoEl = card.querySelector('.component-info');
            if (infoEl) {
                summaryEl = document.createElement('div');
                summaryEl.className = 'component-config-summary';
                infoEl.appendChild(summaryEl);
            }
        }
        if (summaryEl) {
            try {
                summaryEl.textContent = component.configSummary(config);
            } catch (e) {}
        }
    }

    /**
     * Aktualisiert systemConfig basierend auf allen Komponenten-Konfigurationen
     */
    updateSystemConfigFromComponents() {
        // Sammle alle Instanzen einer Komponente (z.B. compute, compute-2, compute-3)
        const collectInstances = (baseId) => {
            const instances = [];

            // Original-Komponente
            if (this.selectedComponents.has(baseId) && this.componentConfigs[baseId]) {
                instances.push(this.componentConfigs[baseId]);
            }

            // Alle Instanzen finden (nicht nur sequenzielle!)
            Array.from(this.selectedComponents)
                .filter(id => {
                    const match = id.match(new RegExp(`^${baseId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-(\\d+)$`));
                    return match !== null;
                })
                .sort((a, b) => {
                    const numA = parseInt(a.split('-').pop());
                    const numB = parseInt(b.split('-').pop());
                    return numA - numB;
                })
                .forEach(instanceId => {
                    if (this.componentConfigs[instanceId]) {
                        instances.push(this.componentConfigs[instanceId]);
                    }
                });

            return instances;
        };

        // Compute: Alle VMs als Array (für separate Berechnung)
        const computeInstances = collectInstances('compute');
        let computeConfig = {};
        if (computeInstances.length > 0) {
            // vmGroups unterstützen (wenn vorhanden) oder Legacy-Format
            const vmGroups = computeInstances.flatMap(comp => {
                if (comp.vmGroups && Array.isArray(comp.vmGroups)) {
                    return comp.vmGroups;
                } else {
                    // Legacy: Einzelne VM-Config
                    // WICHTIG: parseInt() um String-Konkatenation zu vermeiden!
                    return [{
                        name: 'VM',
                        cpu: parseInt(comp.cpu) || 4,
                        ram: parseInt(comp.ram) || 16,
                        count: parseInt(comp.instances) || 1
                    }];
                }
            });

            computeConfig = { vmGroups };
        } else {
            computeConfig = { vmGroups: [{ name: 'VM', cpu: 4, ram: 16, count: 1 }] };
        }

        // Kubernetes: Alle Cluster als Array (für separate Berechnung)
        const k8sInstances = collectInstances('kubernetes');
        let kubernetesConfig = null;
        if (k8sInstances.length > 0) {
            kubernetesConfig = {
                clusters: k8sInstances.map(k8s => ({
                    nodes: parseInt(k8s.nodes) || 3,
                    cpuPerNode: parseInt(k8s.cpuPerNode) || 4,
                    ramPerNode: parseInt(k8s.ramPerNode) || 16
                }))
            };
        }

        // Serverless: Alle Functions als Array (für separate Berechnung)
        const serverlessInstances = collectInstances('serverless');
        let serverlessConfig = null;
        if (serverlessInstances.length > 0) {
            serverlessConfig = {
                instances: serverlessInstances.map(sl => ({
                    functions: parseInt(sl.functions) || 10,
                    invocationsPerMonth: parseInt(sl.invocationsPerMonth) || 1000000
                }))
            };
        }

        // Database SQL: Alle DBs als Array (für separate Berechnung)
        const dbInstances = collectInstances('database_sql');
        let databaseConfig = {};
        if (dbInstances.length > 0) {
            // databases Array unterstützen (wenn vorhanden) oder Legacy-Format
            databaseConfig = {
                databases: dbInstances.flatMap(db => {
                    if (db.databases && Array.isArray(db.databases)) {
                        return db.databases;
                    } else {
                        // Legacy: Einzelne DB-Config
                        return [{
                            name: 'DB',
                            type: db.dbType || 'PostgreSQL',
                            size: parseInt(db.dbSize) || 100
                        }];
                    }
                })
            };
        } else {
            databaseConfig = { databases: [{ name: 'DB', type: 'PostgreSQL', size: 100 }] };
        }

        // NoSQL Database: Alle NoSQL DBs als Array (für separate Berechnung)
        const nosqlInstances = collectInstances('database_nosql');
        let nosqlConfig = null;
        if (nosqlInstances.length > 0) {
            nosqlConfig = {
                instances: nosqlInstances.map(db => ({
                    type: db.nosqlType || 'MongoDB',
                    size: parseInt(db.nosqlSize) || 50
                }))
            };
        }

        // Storage Block: Alle Volumes als Array (für separate Berechnung)
        const storageBlkInstances = collectInstances('storage_block');
        let storageConfig = {};
        if (storageBlkInstances.length > 0) {
            // volumes Array unterstützen (wenn vorhanden) oder Legacy-Format
            storageConfig = {
                volumes: storageBlkInstances.flatMap(s => {
                    if (s.volumes && Array.isArray(s.volumes)) {
                        return s.volumes;
                    } else {
                        // Legacy: Einzelne Volume-Config
                        return [{
                            name: 'Volume',
                            type: s.blockType || 'ssd',
                            size: parseInt(s.blockSize) || 200
                        }];
                    }
                })
            };
        } else {
            storageConfig = { volumes: [{ name: 'Volume', type: 'ssd', size: 200 }] };
        }

        // Object Storage: Alle Object Storages zusammenfassen
        const storageObjInstances = collectInstances('storage_object');
        let objectStorageConfig = null;
        if (storageObjInstances.length > 0) {
            let totalSize = 0;
            storageObjInstances.forEach(s => {
                totalSize += s.objectSize || 500;
            });
            objectStorageConfig = {
                size: `${totalSize} GB`,
                type: 'object',
                count: storageObjInstances.length
            };
        }

        // File Storage: Alle File Storages zusammenfassen
        const storageFileInstances = collectInstances('storage_file');
        let fileStorageConfig = null;
        if (storageFileInstances.length > 0) {
            let totalSize = 0;
            storageFileInstances.forEach(s => {
                totalSize += s.fileSize || 1000;
            });
            fileStorageConfig = {
                size: `${totalSize} GB`,
                type: 'nfs',
                count: storageFileInstances.length
            };
        }

        // Messaging: Alle Message Queues als Array (für separate Berechnung)
        const messagingInstances = collectInstances('messaging');
        let messagingConfig = null;
        if (messagingInstances.length > 0) {
            messagingConfig = {
                instances: messagingInstances.map(m => ({
                    type: m.queueType || 'Standard',
                    messagesPerMonth: parseInt(m.messagesPerMonth) || 1000000
                }))
            };
        }

        // Cache: Alle Cache-Instanzen zusammenfassen
        const cacheInstances = collectInstances('cache');
        let cacheConfig = null;
        if (cacheInstances.length > 0) {
            let totalMemory = 0;
            cacheInstances.forEach(c => {
                totalMemory += c.cacheSize || 4;
            });
            cacheConfig = {
                memory: `${totalMemory} GB`,
                count: cacheInstances.length
            };
        }

        // Identity: Alle Identity-Instanzen zusammenfassen
        const identityInstances = collectInstances('identity');
        let identityConfig = null;
        if (identityInstances.length > 0) {
            let totalUsers = 0;
            identityInstances.forEach(i => {
                totalUsers += i.users || 100;
            });
            identityConfig = {
                users: totalUsers,
                count: identityInstances.length
            };
        }
        const users = identityConfig ? identityConfig.users : 100;

        // AI/ML: Alle AI/ML-Instanzen zusammenfassen
        const aimlInstances = collectInstances('ai_ml');
        let aimlConfig = null;
        if (aimlInstances.length > 0) {
            const types = aimlInstances.map(ai => ai.mlType || 'Training');
            let totalGpu = 0;
            aimlInstances.forEach(ai => {
                totalGpu += ai.gpuCount || 1;
            });
            aimlConfig = {
                type: types.join(', '),
                gpus: totalGpu,
                count: aimlInstances.length
            };
        }

        // Baue das finale systemConfig-Objekt
        const config = {
            compute: computeConfig,
            storage: storageConfig,
            database: databaseConfig,
            users: users
        };

        // Füge optionale Komponenten nur hinzu, wenn sie vorhanden sind
        if (kubernetesConfig) config.kubernetes = kubernetesConfig;
        if (serverlessConfig) config.serverless = serverlessConfig;
        if (nosqlConfig) config.nosql = nosqlConfig;
        if (objectStorageConfig) config.objectStorage = objectStorageConfig;
        if (fileStorageConfig) config.fileStorage = fileStorageConfig;
        if (messagingConfig) config.messaging = messagingConfig;
        if (cacheConfig) config.cache = cacheConfig;
        if (identityConfig) config.identity = identityConfig;
        if (aimlConfig) config.aiml = aimlConfig;

        this.systemConfig = {
            sizing: 'custom',
            config: config
        };
    }

    renderComponentCard(component, instanceId = null) {
        const cardId = instanceId || component.id;
        const baseComponentId = instanceId ? component.id : component.id;
        const isInstance = instanceId !== null;
        const instanceNumber = isInstance ? cardId.split('-').pop() : null;

        const isSelected = this.selectedComponents.has(cardId);
        const config = this.componentConfigs[cardId];
        const hasConfig = component.configurable && component.configFields;

        // Konfigurations-Zusammenfassung wenn ausgewählt
        let configSummary = '';
        if (hasConfig && config && component.configSummary) {
            try {
                configSummary = component.configSummary(config);
            } catch (e) {
                configSummary = '';
            }
        }

        // Nicht-ausgewählt: Info-Text zu Konfigurierbarkeit
        const configHint = hasConfig && !isSelected
            ? `<div class="component-config-hint">Konfigurierbar</div>`
            : '';

        // Ausgewählt: Konfigurations-Panel
        const configPanel = hasConfig && isSelected
            ? this.renderComponentConfigPanel(component, cardId)
            : '';

        // Instanz-Nummer Badge
        const instanceBadge = isInstance
            ? `<span class="component-instance-badge">#${instanceNumber}</span>`
            : '';

        return `
            <div class="component-card ${isSelected ? 'selected' : ''} ${hasConfig ? 'configurable' : ''}" data-id="${cardId}">
                <div class="component-header">
                    <div class="component-icon">${IconMapper.toFontAwesome(component.icon)}</div>
                    <div class="component-info">
                        <div class="component-name">${component.name} ${instanceBadge}</div>
                        <div class="component-description">${component.description}</div>
                        ${configHint}
                        ${isSelected && configSummary ? `<div class="component-config-summary">${configSummary}</div>` : ''}
                    </div>
                    <div class="component-actions">
                        ${isSelected ? `<button class="component-checkbox-btn is-check" data-component-id="${cardId}" data-is-instance="${isInstance}" title="${component.name} abwählen">
                            <i class="fa-solid fa-check"></i>
                        </button>` : `<div class="component-checkbox"></div>`}
                        ${isSelected ? `<button class="component-add-instance-btn-compact" data-component-id="${baseComponentId}" title="Weitere ${component.name} hinzufügen">
                            <i class="fa-solid fa-plus"></i>
                        </button>` : ''}
                    </div>
                </div>
                ${configPanel}
            </div>
        `;
    }

    /**
     * Rendert das Konfigurations-Panel für eine Komponente
     */
    renderComponentConfigPanel(component, componentId) {
        if (!component.configFields) return '';

        const config = this.componentConfigs[componentId] || {};
        const fields = component.configFields.map(field => {
            const value = config[field.id] !== undefined ? config[field.id] : field.default;

            if (field.type === 'vm-group') {
                return this.renderVMGroupField(componentId, field, value);
            } else if (field.type === 'db-group') {
                return this.renderDBGroupField(componentId, field, value);
            } else if (field.type === 'storage-group') {
                return this.renderStorageGroupField(componentId, field, value);
            } else if (field.type === 'select') {
                const options = field.options.map(opt =>
                    `<option value="${opt.value}" ${value === opt.value ? 'selected' : ''}>${opt.label}</option>`
                ).join('');
                return `
                    <div class="component-config-field">
                        <label>${field.label}</label>
                        <select data-component="${componentId}" data-field="${field.id}">${options}</select>
                    </div>
                `;
            } else if (field.type === 'number') {
                return `
                    <div class="component-config-field">
                        <label>${field.label}${field.unit ? ` (${field.unit})` : ''}</label>
                        <input type="number" value="${value}" min="${field.min || 0}" max="${field.max || 9999}"
                               data-component="${componentId}" data-field="${field.id}">
                    </div>
                `;
            } else {
                return `
                    <div class="component-config-field">
                        <label>${field.label}</label>
                        <input type="text" value="${value}" data-component="${componentId}" data-field="${field.id}">
                    </div>
                `;
            }
        }).join('');

        return `
            <div class="component-config-panel" onclick="event.stopPropagation()">
                ${fields}
            </div>
        `;
    }

    /**
     * Rendert ein VM-Group Feld mit mehreren VM-Konfigurationen
     */
    renderVMGroupField(componentId, field, vmGroups) {
        if (!Array.isArray(vmGroups) || vmGroups.length === 0) {
            vmGroups = field.default || [{ name: 'VM', cpu: 4, ram: 16, count: 1 }];
        }

        const vmRows = vmGroups.map((vm, index) => `
            <div class="inline-config-row" data-vm-index="${index}">
                <div class="inline-config-main">
                    <input type="text" class="inline-config-name" value="${vm.name}"
                           placeholder="VM-Name" data-component="${componentId}" data-field="${field.id}"
                           data-vm-index="${index}" data-vm-field="name">
                    <div class="inline-config-specs">
                        <div class="inline-spec">
                            <input type="number" class="inline-spec-input" value="${vm.cpu}" min="1" max="256"
                                   data-component="${componentId}" data-field="${field.id}"
                                   data-vm-index="${index}" data-vm-field="cpu">
                            <span class="inline-spec-unit">vCPU</span>
                        </div>
                        <div class="inline-spec">
                            <input type="number" class="inline-spec-input" value="${vm.ram}" min="1" max="4096"
                                   data-component="${componentId}" data-field="${field.id}"
                                   data-vm-index="${index}" data-vm-field="ram">
                            <span class="inline-spec-unit">GB RAM</span>
                        </div>
                        <div class="inline-spec">
                            <input type="number" class="inline-spec-input" value="${vm.count}" min="1" max="100"
                                   data-component="${componentId}" data-field="${field.id}"
                                   data-vm-index="${index}" data-vm-field="count">
                            <span class="inline-spec-unit">× Instanzen</span>
                        </div>
                    </div>
                </div>
                ${vmGroups.length > 1 ? `<button class="inline-config-delete" data-component="${componentId}"
                       data-field="${field.id}" data-vm-index="${index}" title="VM entfernen">
                    <i class="fa-solid fa-xmark"></i>
                </button>` : ''}
            </div>
        `).join('');

        return `
            <div class="component-config-field inline-config-field">
                <div class="inline-config-container" data-component="${componentId}" data-field="${field.id}">
                    ${vmRows}
                    ${vmGroups.length < 5 ? `<button class="inline-config-add" data-component="${componentId}" data-field="${field.id}">
                        <i class="fa-solid fa-plus"></i> Weitere VM
                    </button>` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Rendert ein DB-Group Feld mit mehreren Datenbank-Instanzen
     */
    renderDBGroupField(componentId, field, databases) {
        if (!Array.isArray(databases) || databases.length === 0) {
            databases = field.default || [{ name: 'DB', type: 'PostgreSQL', size: 100 }];
        }

        const dbRows = databases.map((db, index) => `
            <div class="inline-config-row" data-db-index="${index}">
                <div class="inline-config-main">
                    <input type="text" class="inline-config-name" value="${db.name}"
                           placeholder="DB-Name" data-component="${componentId}" data-field="${field.id}"
                           data-db-index="${index}" data-db-field="name">
                    <div class="inline-config-specs">
                        <div class="inline-spec inline-spec-wide">
                            <select class="inline-spec-select" data-component="${componentId}" data-field="${field.id}"
                                    data-db-index="${index}" data-db-field="type">
                                <option value="PostgreSQL" ${db.type === 'PostgreSQL' ? 'selected' : ''}>PostgreSQL</option>
                                <option value="MySQL" ${db.type === 'MySQL' ? 'selected' : ''}>MySQL</option>
                                <option value="MariaDB" ${db.type === 'MariaDB' ? 'selected' : ''}>MariaDB</option>
                                <option value="SQL Server" ${db.type === 'SQL Server' ? 'selected' : ''}>SQL Server</option>
                                <option value="Oracle" ${db.type === 'Oracle' ? 'selected' : ''}>Oracle</option>
                                <option value="SAP HANA" ${db.type === 'SAP HANA' ? 'selected' : ''}>SAP HANA</option>
                            </select>
                        </div>
                        <div class="inline-spec">
                            <input type="number" class="inline-spec-input" value="${db.size}" min="10" max="100000"
                                   data-component="${componentId}" data-field="${field.id}"
                                   data-db-index="${index}" data-db-field="size">
                            <span class="inline-spec-unit">GB</span>
                        </div>
                    </div>
                </div>
                ${databases.length > 1 ? `<button class="inline-config-delete" data-component="${componentId}"
                       data-field="${field.id}" data-db-index="${index}" title="DB entfernen">
                    <i class="fa-solid fa-xmark"></i>
                </button>` : ''}
            </div>
        `).join('');

        return `
            <div class="component-config-field inline-config-field">
                <div class="inline-config-container" data-component="${componentId}" data-field="${field.id}">
                    ${dbRows}
                    ${databases.length < 5 ? `<button class="inline-config-add" data-component="${componentId}" data-field="${field.id}" data-group-type="db">
                        <i class="fa-solid fa-plus"></i> Weitere Datenbank
                    </button>` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Rendert ein Storage-Group Feld mit mehreren Storage-Volumes
     */
    renderStorageGroupField(componentId, field, volumes) {
        if (!Array.isArray(volumes) || volumes.length === 0) {
            volumes = field.default || [{ name: 'Volume', type: 'ssd', size: 200 }];
        }

        const volumeRows = volumes.map((vol, index) => `
            <div class="inline-config-row" data-vol-index="${index}">
                <div class="inline-config-main">
                    <input type="text" class="inline-config-name" value="${vol.name}"
                           placeholder="Volume-Name" data-component="${componentId}" data-field="${field.id}"
                           data-vol-index="${index}" data-vol-field="name">
                    <div class="inline-config-specs">
                        <div class="inline-spec">
                            <select class="inline-spec-select" data-component="${componentId}" data-field="${field.id}"
                                    data-vol-index="${index}" data-vol-field="type">
                                <option value="ssd" ${vol.type === 'ssd' ? 'selected' : ''}>SSD</option>
                                <option value="nvme" ${vol.type === 'nvme' ? 'selected' : ''}>NVMe</option>
                                <option value="hdd" ${vol.type === 'hdd' ? 'selected' : ''}>HDD</option>
                            </select>
                        </div>
                        <div class="inline-spec">
                            <input type="number" class="inline-spec-input" value="${vol.size}" min="10" max="100000"
                                   data-component="${componentId}" data-field="${field.id}"
                                   data-vol-index="${index}" data-vol-field="size">
                            <span class="inline-spec-unit">GB</span>
                        </div>
                    </div>
                </div>
                ${volumes.length > 1 ? `<button class="inline-config-delete" data-component="${componentId}"
                       data-field="${field.id}" data-vol-index="${index}" title="Volume entfernen">
                    <i class="fa-solid fa-xmark"></i>
                </button>` : ''}
            </div>
        `).join('');

        return `
            <div class="component-config-field inline-config-field">
                <div class="inline-config-container" data-component="${componentId}" data-field="${field.id}">
                    ${volumeRows}
                    ${volumes.length < 5 ? `<button class="inline-config-add" data-component="${componentId}" data-field="${field.id}" data-group-type="storage">
                        <i class="fa-solid fa-plus"></i> Weiteres Volume
                    </button>` : ''}
                </div>
            </div>
        `;
    }

    toggleComponent(componentId) {
        const wasSelected = this.selectedComponents.has(componentId);
        if (wasSelected) {
            this.selectedComponents.delete(componentId);
            // Config behalten für den Fall, dass Komponente wieder ausgewählt wird
        } else {
            this.selectedComponents.add(componentId);
            // Config initialisieren wenn noch nicht vorhanden
            if (!this.componentConfigs[componentId]) {
                this.initComponentConfig(componentId);
            }
        }
        // Karte komplett neu rendern um Config-Panel zu zeigen/verstecken
        this.reRenderComponentCard(componentId);
        this.updateSelectedSummary();
        this.updateNavigationState();
        this.updateSystemConfigFromComponents();

        // Session-State speichern nach Komponenten-Änderung
        this.saveSessionState();
    }

    /**
     * Fügt eine weitere Instanz einer Komponente hinzu
     */
    addComponentInstance(baseComponentId) {
        const component = architectureComponents.find(c => c.id === baseComponentId);
        if (!component) return;

        // Finde nächste freie Instanz-Nummer
        let instanceNumber = 2;
        while (this.selectedComponents.has(`${baseComponentId}-${instanceNumber}`)) {
            instanceNumber++;
        }

        const newComponentId = `${baseComponentId}-${instanceNumber}`;

        // Neue Instanz zur Auswahl hinzufügen
        this.selectedComponents.add(newComponentId);

        // Config kopieren von der Original-Komponente
        const baseConfig = this.componentConfigs[baseComponentId] || {};
        this.componentConfigs[newComponentId] = { ...baseConfig };

        // Vollständigen Component-Grid neu rendern
        this.renderComponents();

        this.updateSelectedSummary();
        this.updateNavigationState();
        this.updateSystemConfigFromComponents();
    }

    /**
     * Entfernt eine Instanz einer Komponente
     */
    removeComponentInstance(instanceId) {
        // Entferne aus selectedComponents
        this.selectedComponents.delete(instanceId);

        // Entferne Config
        delete this.componentConfigs[instanceId];

        // Vollständigen Component-Grid neu rendern
        this.renderComponents();

        this.updateSelectedSummary();
        this.updateNavigationState();
        this.updateSystemConfigFromComponents();
    }

    /**
     * Rendert eine einzelne Komponenten-Karte neu
     */
    reRenderComponentCard(componentId) {
        const component = architectureComponents.find(c => c.id === componentId);
        if (!component) return;

        const oldCard = document.querySelector(`.component-card[data-id="${componentId}"]`);
        if (!oldCard) return;

        const newCardHtml = this.renderComponentCard(component);
        const temp = document.createElement('div');
        temp.innerHTML = newCardHtml;
        const newCard = temp.firstElementChild;

        oldCard.replaceWith(newCard);

        const isSelected = newCard.classList.contains('selected');

        if (!isSelected) {
            // Nicht ausgewählt: Ganze Karte ist klickbar
            newCard.style.cursor = 'pointer';
            newCard.addEventListener('click', (e) => {
                // Ignoriere clicks auf action buttons falls vorhanden
                if (e.target.closest('.component-actions')) return;
                this.toggleComponent(componentId);
            });
        } else {
            // Ausgewählt: Nur Buttons sind klickbar
            newCard.style.cursor = 'default';
        }

        // Checkbox Button für ausgewählte Komponenten
        const checkboxBtn = newCard.querySelector('.component-checkbox-btn');
        if (checkboxBtn) {
            checkboxBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                const compId = checkboxBtn.dataset.componentId;
                const isInstance = checkboxBtn.dataset.isInstance === 'true';

                if (isInstance) {
                    // Instanz abwählen = entfernen
                    this.removeComponentInstance(compId);
                } else {
                    // Basis-Komponente abwählen
                    this.toggleComponent(compId);
                }
            });
        }

        // Leere Checkbox für nicht ausgewählte
        const emptyCheckbox = newCard.querySelector('.component-checkbox');
        if (emptyCheckbox) {
            emptyCheckbox.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleComponent(componentId);
            });
        }

        // Event Listener für Plus-Button (Instanz hinzufügen)
        const addBtn = newCard.querySelector('.component-add-instance-btn-compact');
        if (addBtn) {
            addBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const compId = addBtn.dataset.componentId;
                this.addComponentInstance(compId);
            });
        }

        // Config-Event-Handler binden
        this.bindComponentConfigEvents(newCard);
    }

    updateSelectedSummary() {
        const containerId = this.isMultiAppMode ? 'currentAppComponentsSummary' : 'selectedComponentsSummary';
        const container = document.getElementById(containerId);
        if (!container) return;

        if (this.selectedComponents.size === 0) {
            container.innerHTML = '<p style="color: var(--text-tertiary);">Noch keine Komponenten ausgewählt</p>';
            return;
        }

        const tags = Array.from(this.selectedComponents).map(id => {
            // Basis-Komponente finden (auch für Instanzen wie "vm-2")
            const baseId = id.includes('-') && /\-\d+$/.test(id) ? id.replace(/-\d+$/, '') : id;
            const comp = architectureComponents.find(c => c.id === baseId);

            if (!comp) return ''; // Falls Komponente nicht gefunden

            const config = this.componentConfigs[id];

            // Instanz-Nummer anzeigen
            const instanceMatch = id.match(/-(\d+)$/);
            const instanceBadge = instanceMatch ? ` #${instanceMatch[1]}` : '';

            // Config-Summary anzeigen, falls vorhanden
            let configText = '';
            if (config && comp.configSummary) {
                try {
                    const summary = comp.configSummary(config);
                    if (summary) {
                        configText = ` <span style="color: var(--text-secondary); font-size: 0.85em;">(${summary})</span>`;
                    }
                } catch (e) {
                    // Ignore summary errors
                }
            }

            return `
                <span class="selected-component-tag">
                    <span>${comp.name}${instanceBadge}${configText}</span>
                    <span class="remove" data-id="${id}">&times;</span>
                </span>
            `;
        }).filter(tag => tag).join('');

        container.innerHTML = tags;

        // Remove-Button Events
        container.querySelectorAll('.remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleComponent(btn.dataset.id);
            });
        });
    }

    /**
     * Zeigt das Dropdown mit allen Applikationen
     */
    showAppDropdown() {
        const dropdown = document.getElementById('appDropdown');
        if (!dropdown) return;

        this.selectedDropdownIndex = -1;
        this.filterAppDropdown();
        dropdown.classList.add('visible');
    }

    /**
     * Versteckt das Dropdown
     */
    hideAppDropdown() {
        const dropdown = document.getElementById('appDropdown');
        if (dropdown) dropdown.classList.remove('visible');
    }

    /**
     * Filtert die Applikationen basierend auf der Eingabe
     */
    filterAppDropdown() {
        const dropdown = document.getElementById('appDropdown');
        const input = document.getElementById('appSearchInput');
        if (!dropdown || !input) return;

        const filter = input.value.toLowerCase().trim();
        const apps = Object.entries(knownApplications);

        // Kategorien definieren
        const categories = {
            'ERP & Business': ['sap-s4hana', 'sap-business-one', 'dynamics-365', 'suitecrm', 'oracle-ebs', 'odoo', 'mautic', 'sugarcrm', 'infor-cloudsuite', 'sage-x3', 'netsuite', 'workday', 'servicenow'],
            'DevOps & CI/CD': ['gitlab', 'github-enterprise', 'jenkins', 'argocd', 'tekton', 'harbor', 'sonarqube', 'nexus', 'jfrog-artifactory', 'terraform-enterprise', 'ansible-tower', 'hashicorp-vault', 'consul', 'backstage'],
            'CMS & Collaboration': ['wordpress', 'typo3', 'drupal', 'nextcloud', 'confluence', 'sharepoint', 'mattermost', 'rocketchat', 'matrix-synapse', 'discourse', 'mediawiki', 'strapi', 'ghost', 'neos'],
            'Datenbanken & Analytics': ['postgresql', 'mysql-mariadb', 'mongodb', 'elasticsearch', 'kafka', 'redis-primary', 'grafana', 'prometheus', 'influxdb', 'metabase', 'apache-superset', 'power-bi-report-server', 'tableau-server', 'apache-airflow'],
            'Security & Identity': ['keycloak', 'freeipa', 'openldap', 'authentik', 'zitadel', 'owasp-zap', 'trivy', 'falco', 'wazuh', 'graylog', 'splunk-enterprise', 'crowdsec', 'pfsense', 'wireguard'],
            'E-Commerce': ['magento', 'shopware', 'prestashop', 'woocommerce', 'saleor', 'spree'],
            'Web & Application': ['nodejs-express', 'spring-boot', 'django', 'laravel', 'microservices-mesh', 'kong', 'nginx', 'tomcat'],
            'AI & ML': ['kubeflow', 'mlflow', 'jupyterhub'],
            'Projektmanagement': ['jira', 'bitbucket', 'redmine', 'zabbix', 'nagios', 'plex', 'vaultwarden', 'gitea', 'openproject', 'minio']
        };

        // Apps filtern mit Fuzzy-Matching
        let filteredApps;
        if (!filter) {
            filteredApps = apps;
        } else {
            // Exakte und Teilstring-Matches
            const exactMatches = apps.filter(([id, app]) => {
                const name = app.name.toLowerCase();
                const idLower = id.toLowerCase();
                const desc = (app.description || '').toLowerCase();
                return name.includes(filter) || idLower.includes(filter) || desc.includes(filter);
            });

            // Fuzzy-Matches (für Tippfehler)
            const fuzzyMatches = [];
            if (filter.length >= 3) {
                apps.forEach(([id, app]) => {
                    // Skip wenn schon in exactMatches
                    if (exactMatches.some(([matchId]) => matchId === id)) return;

                    // Prüfe Ähnlichkeit mit einzelnen Wörtern
                    // Split nach Leerzeichen UND Sonderzeichen wie /, -, ( etc.
                    const nameWords = app.name.toLowerCase().split(/[\s\/\-\(\)]+/);
                    const idWords = id.toLowerCase().split(/[-_]/);
                    const allWords = [...nameWords, ...idWords];

                    let maxSimilarity = 0;

                    allWords.forEach(word => {
                        if (word.length < 2) return;

                        // Vollständiger Vergleich
                        let similarity = this.calculateSimilarity(filter, word);

                        // Substring-Vergleich mit Tippfehlertoleranz
                        if (word.length >= filter.length) {
                            for (let i = 0; i <= word.length - filter.length; i++) {
                                const substring = word.substring(i, i + filter.length);
                                const substringSimilarity = this.calculateSimilarity(filter, substring);
                                similarity = Math.max(similarity, substringSimilarity);
                            }
                        }

                        maxSimilarity = Math.max(maxSimilarity, similarity);
                    });

                    if (maxSimilarity > 0.6) {
                        fuzzyMatches.push([id, app, maxSimilarity]);
                    }
                });
                fuzzyMatches.sort((a, b) => b[2] - a[2]);
            }

            filteredApps = [...exactMatches, ...fuzzyMatches.map(([id, app]) => [id, app])];
        }

        // Nach Alphabet sortieren (nur exactMatches), Fuzzy-Matches sind schon sortiert
        filteredApps.sort((a, b) => a[1].name.localeCompare(b[1].name));

        // HTML generieren
        if (filteredApps.length === 0) {
            dropdown.innerHTML = `
                <div class="app-dropdown-item" style="cursor: default; color: var(--text-secondary);">
                    <div class="app-dropdown-item-name">Keine bekannte Applikation gefunden</div>
                    <div class="app-dropdown-item-desc">Enter drücken, um "${input.value}" zu recherchieren</div>
                </div>
            `;
        } else {
            dropdown.innerHTML = filteredApps.map(([id, app], index) => `
                <div class="app-dropdown-item" data-app-id="${id}" data-index="${index}">
                    <div class="app-dropdown-item-name">${app.name}</div>
                    <div class="app-dropdown-item-desc">${app.description || ''}</div>
                </div>
            `).join('');

            // Click-Handler für Items
            dropdown.querySelectorAll('.app-dropdown-item[data-app-id]').forEach(item => {
                item.addEventListener('click', () => {
                    const appId = item.dataset.appId;
                    const app = knownApplications[appId];
                    if (app) {
                        document.getElementById('appSearchInput').value = app.name;
                        this.hideAppDropdown();
                        this.searchApplication();
                    }
                });
            });
        }

        this.dropdownItems = filteredApps;
    }

    /**
     * Keyboard-Navigation im Dropdown
     */
    handleDropdownKeyboard(e) {
        const dropdown = document.getElementById('appDropdown');
        if (!dropdown || !dropdown.classList.contains('visible')) return;

        const items = dropdown.querySelectorAll('.app-dropdown-item[data-app-id]');
        if (items.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            this.selectedDropdownIndex = Math.min(this.selectedDropdownIndex + 1, items.length - 1);
            this.updateDropdownSelection(items);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            this.selectedDropdownIndex = Math.max(this.selectedDropdownIndex - 1, 0);
            this.updateDropdownSelection(items);
        } else if (e.key === 'Escape') {
            this.hideAppDropdown();
        } else if (e.key === 'Enter' && this.selectedDropdownIndex >= 0) {
            e.preventDefault();
            const selectedItem = items[this.selectedDropdownIndex];
            if (selectedItem) {
                const appId = selectedItem.dataset.appId;
                const app = knownApplications[appId];
                if (app) {
                    document.getElementById('appSearchInput').value = app.name;
                    this.hideAppDropdown();
                    this.searchApplication();
                }
            }
        }
    }

    /**
     * Aktualisiert die visuelle Auswahl im Dropdown
     */
    updateDropdownSelection(items) {
        items.forEach((item, index) => {
            item.classList.toggle('selected', index === this.selectedDropdownIndex);
            if (index === this.selectedDropdownIndex) {
                item.scrollIntoView({ block: 'nearest' });
            }
        });
    }

    async searchApplication() {
        const input = document.getElementById('appSearchInput');
        const resultDiv = document.getElementById('researchResult');
        const searchBtn = document.getElementById('searchBtn');

        if (!input.value.trim()) return;

        // Loading State
        searchBtn.classList.add('loading');
        searchBtn.disabled = true;

        try {
            const result = await this.researcher.research(input.value);

            if (result.success) {
                this.applicationData = result.application;

                // Komponenten vorauswählen
                this.selectedComponents.clear();
                result.application.components.forEach(c => this.selectedComponents.add(c));

                // System-Konfiguration mit Default-Sizing initialisieren
                if (result.application.systemRequirements) {
                    const defaultSize = result.application.systemRequirements[this.selectedSizing]
                        ? this.selectedSizing
                        : (result.application.systemRequirements.medium ? 'medium' :
                           result.application.systemRequirements.small ? 'small' : 'large');
                    this.selectedSizing = defaultSize;
                    this.systemConfig = {
                        sizing: defaultSize,
                        config: result.application.systemRequirements[defaultSize],
                        application: result.application.name
                    };

                    // Komponenten-Konfigurationen aus System-Requirements übernehmen
                    try {
                        this.initComponentConfigsFromSystemRequirements();
                    } catch (error) {
                    }
                }

                // System Requirements HTML generieren
                const sysReqHtml = this.renderSystemRequirements(result.application);

                resultDiv.innerHTML = `
                    <div class="research-result">
                        <div class="research-result-header">
                            <span class="research-result-title">${result.application.name}</span>
                        </div>
                        <p class="research-result-description">${result.application.description}</p>
                        <p class="research-result-description">
                            <strong>Erkannte Komponenten:</strong> ${result.application.components.length} Architektur-Bausteine wurden identifiziert.
                        </p>
                        ${sysReqHtml}
                        <p class="research-result-source">Quelle: ${result.source} (Konfidenz: ${result.confidence})</p>
                        <div style="margin-top: 1rem;">
                            <button class="nav-button primary" onclick="app.nextStep()">
                                Weiter mit ${result.application.components.length} Komponenten →
                            </button>
                        </div>
                    </div>
                `;

                // Sizing-Auswahl Event-Handler binden
                this.bindSizingEvents();
            } else {
                resultDiv.innerHTML = `
                    <div class="research-result" style="border-color: var(--btc-warning);">
                        <div class="research-result-header">
                            <span class="research-result-icon">⚠️</span>
                            <span class="research-result-title">Keine Ergebnisse</span>
                        </div>
                        <p class="research-result-description">${result.message}</p>
                        <p class="research-result-description">${result.suggestion}</p>
                        <div style="margin-top: 1rem;">
                            <button class="nav-button primary" onclick="app.nextStep()">
                                Komponenten manuell auswählen →
                            </button>
                        </div>
                    </div>
                `;
            }

            resultDiv.style.display = 'block';
        } catch (error) {
            console.error('Search error:', error);
            resultDiv.innerHTML = `
                <div class="research-result" style="border-color: var(--btc-danger);">
                    <p>Fehler bei der Recherche. Bitte versuchen Sie es erneut.</p>
                </div>
            `;
            resultDiv.style.display = 'block';
        } finally {
            searchBtn.classList.remove('loading');
            searchBtn.disabled = false;
        }
    }

    /**
     * Rendert die System-Requirements mit Sizing-Auswahl
     */
    renderSystemRequirements(application) {
        if (!application.systemRequirements) {
            return '';
        }

        const req = application.systemRequirements;
        const sizing = application.sizing;

        // Prüfen ob es eine Note gibt (z.B. "Cloud-only")
        const noteHtml = req.note ? `
            <div class="sysreq-note">
                <span class="sysreq-note-icon">${IconMapper.toFontAwesome('ℹ️', 'utility')}</span>
                <span>${req.note}</span>
            </div>
        ` : '';

        // Sizing-Tabs generieren
        const sizes = ['small', 'medium', 'large'].filter(s => req[s]);
        if (sizes.length === 0) {
            // Keine Standard-Sizing-Optionen (z.B. NetSuite mit nur integrationServer)
            return noteHtml;
        }

        const sizingTabsHtml = sizes.map(size => {
            const sizeLabels = { small: 'Klein', medium: 'Mittel', large: 'Groß' };
            const isActive = size === this.selectedSizing ? 'active' : '';
            const sizeData = req[size];
            const usersLabel = sizeData.users || sizeData.contacts || '';
            return `
                <button class="sizing-tab ${isActive}" data-size="${size}">
                    <span class="sizing-tab-label">${sizeLabels[size]}</span>
                    ${usersLabel ? `<span class="sizing-tab-users">${usersLabel}</span>` : ''}
                </button>
            `;
        }).join('');

        // Sizing-Details für ausgewählte Größe
        const sizingDetailsHtml = this.renderSizingDetails(req[this.selectedSizing] || req[sizes[0]]);

        // Sizing-Formel wenn vorhanden
        const sizingFormulaHtml = sizing ? `
            <div class="sysreq-formula">
                <strong>Sizing-Formel:</strong> ${sizing.formula || ''}
                ${sizing.source ? `<a href="${sizing.source}" target="_blank" class="sysreq-source-link">Quelle</a>` : ''}
            </div>
        ` : '';

        return `
            <div class="system-requirements-section">
                <h4 class="sysreq-title">System-Anforderungen</h4>
                ${noteHtml}
                <div class="sizing-tabs">
                    ${sizingTabsHtml}
                </div>
                <div class="sizing-details" id="sizingDetails">
                    ${sizingDetailsHtml}
                </div>
                ${sizingFormulaHtml}
            </div>
        `;
    }

    /**
     * Rendert die Details für ein bestimmtes Sizing
     */
    renderSizingDetails(sizeConfig) {
        if (!sizeConfig) return '<p>Keine Details verfügbar.</p>';

        let html = '<div class="sysreq-grid">';

        // Compute
        if (sizeConfig.compute) {
            const compute = sizeConfig.compute;

            // Generische Prüfung auf Multi-VM-Struktur (ähnlich wie in initComponentConfigsFromSystemRequirements)
            const databaseKeywords = ['mongodb', 'mysql', 'postgresql', 'postgres', 'redis', 'elasticsearch', 'cassandra', 'neo4j', 'couchdb'];
            const vmTypes = [];

            for (const [key, value] of Object.entries(compute)) {
                if (value && typeof value === 'object' && (value.cpu || value.ram)) {
                    // Datenbank-Keywords filtern (werden separat als Database-Komponente angezeigt)
                    const isDatabase = databaseKeywords.some(db => key.toLowerCase().includes(db));
                    if (!isDatabase) {
                        vmTypes.push({ key, config: value });
                    }
                }
            }

            // Multi-VM-Struktur erkannt
            if (vmTypes.length > 0) {
                let details = '';

                for (const vmType of vmTypes) {
                    const formattedName = this.formatVMTypeName(vmType.key);
                    const config = vmType.config;
                    let nodeCount = config.nodes || config.count || 1;
                    let haType = null;

                    // Check for system-level HA
                    if (sizeConfig.ha) {
                        const haConfig = this.extractHAConfig(sizeConfig.ha);
                        if (haConfig && haConfig.nodeCount > 1 && !haConfig.hasMultipleRoles) {
                            nodeCount = haConfig.nodeCount;
                            haType = haConfig.haType;
                        }
                    }

                    // Build display string
                    let displayText = `${config.cpu || '-'} vCPU / ${config.ram || '-'} GB RAM`;
                    if (nodeCount > 1) {
                        displayText += ` (${nodeCount} Nodes${haType ? ` - ${haType}` : ''})`;
                    }

                    details += `<div class="sysreq-item-detail"><strong>${formattedName}:</strong> ${displayText}</div>`;
                }

                html += `
                    <div class="sysreq-item">
                        <div class="sysreq-item-icon">${IconMapper.toFontAwesome('💻', 'component')}</div>
                        <div class="sysreq-item-content">
                            <div class="sysreq-item-label">Compute</div>
                            ${details}
                        </div>
                    </div>
                `;
            } else {
                // Standard-Struktur (direkte cpu/ram Properties)
                // Build node info (compute.nodes or HA config)
                let nodeInfo = '';
                if (compute.nodes && compute.nodes > 1) {
                    nodeInfo = `<div class="sysreq-item-detail">Nodes: ${compute.nodes}</div>`;
                }

                // Check for HA configuration (takes precedence)
                if (sizeConfig.ha) {
                    const haConfig = this.extractHAConfig(sizeConfig.ha);
                    if (haConfig && haConfig.nodeCount > 1) {
                        nodeInfo = `<div class="sysreq-item-detail">${haConfig.nodeCount} Nodes${haConfig.haType ? ` (${haConfig.haType})` : ''}</div>`;
                    }
                }

                html += `
                    <div class="sysreq-item">
                        <div class="sysreq-item-icon">${IconMapper.toFontAwesome('💻', 'component')}</div>
                        <div class="sysreq-item-content">
                            <div class="sysreq-item-label">Compute</div>
                            <div class="sysreq-item-value">${compute.cpu || '-'} vCPU / ${compute.ram || '-'} GB RAM</div>
                            ${compute.workers ? `<div class="sysreq-item-detail">Workers: ${compute.workers}</div>` : ''}
                            ${nodeInfo}
                        </div>
                    </div>
                `;
            }
        }

        // Database
        if (sizeConfig.database) {
            const db = sizeConfig.database;

            // Check for HA/Cluster info from compute.sql.nodes
            let haInfo = '';
            if (sizeConfig.compute && sizeConfig.compute.sql && sizeConfig.compute.sql.nodes > 1) {
                haInfo = `<div class="sysreq-item-detail">Nodes: ${sizeConfig.compute.sql.nodes} (HA)</div>`;
            }

            // Show database note if available (e.g., "3 DBs: Site Config, Logging, Monitoring")
            const noteHtml = db.note ? `<div class="sysreq-item-detail">${db.note}</div>` : '';

            html += `
                <div class="sysreq-item">
                    <div class="sysreq-item-icon">${IconMapper.toFontAwesome('🗄️', 'component')}</div>
                    <div class="sysreq-item-content">
                        <div class="sysreq-item-label">Datenbank</div>
                        <div class="sysreq-item-value">${db.type || '-'}</div>
                        <div class="sysreq-item-detail">Größe: ${db.size || '-'}</div>
                        ${haInfo}
                        ${noteHtml}
                    </div>
                </div>
            `;
        }

        // Storage
        if (sizeConfig.storage) {
            const storage = sizeConfig.storage;
            html += `
                <div class="sysreq-item">
                    <div class="sysreq-item-icon">${IconMapper.toFontAwesome('💾', 'component')}</div>
                    <div class="sysreq-item-content">
                        <div class="sysreq-item-label">Storage</div>
                        <div class="sysreq-item-value">${storage.type || '-'}</div>
                        <div class="sysreq-item-detail">Größe: ${storage.size || '-'}</div>
                    </div>
                </div>
            `;
        }

        // OS
        if (sizeConfig.os && Array.isArray(sizeConfig.os)) {
            html += `
                <div class="sysreq-item">
                    <div class="sysreq-item-icon">${IconMapper.toFontAwesome('🖥️', 'component')}</div>
                    <div class="sysreq-item-content">
                        <div class="sysreq-item-label">Betriebssystem</div>
                        <div class="sysreq-item-value">${sizeConfig.os.join(', ')}</div>
                    </div>
                </div>
            `;
        }

        // PHP (für Web-Apps)
        if (sizeConfig.php) {
            html += `
                <div class="sysreq-item">
                    <div class="sysreq-item-icon">${IconMapper.toFontAwesome('🐘', 'component')}</div>
                    <div class="sysreq-item-content">
                        <div class="sysreq-item-label">PHP</div>
                        <div class="sysreq-item-value">${sizeConfig.php}</div>
                        ${sizeConfig.phpMemory ? `<div class="sysreq-item-detail">Memory: ${sizeConfig.phpMemory}</div>` : ''}
                    </div>
                </div>
            `;
        }

        // Web Server
        if (sizeConfig.webServer) {
            html += `
                <div class="sysreq-item">
                    <div class="sysreq-item-icon">${IconMapper.toFontAwesome('🌐', 'provider')}</div>
                    <div class="sysreq-item-content">
                        <div class="sysreq-item-label">Web Server</div>
                        <div class="sysreq-item-value">${sizeConfig.webServer}</div>
                    </div>
                </div>
            `;
        }

        // Cache
        if (sizeConfig.cache) {
            html += `
                <div class="sysreq-item">
                    <div class="sysreq-item-icon">${IconMapper.toFontAwesome('⚡', 'utility')}</div>
                    <div class="sysreq-item-content">
                        <div class="sysreq-item-label">Cache</div>
                        <div class="sysreq-item-value">${sizeConfig.cache}</div>
                    </div>
                </div>
            `;
        }

        // Queue/Messaging
        if (sizeConfig.queue) {
            html += `
                <div class="sysreq-item">
                    <div class="sysreq-item-icon">${IconMapper.toFontAwesome('📨', 'component')}</div>
                    <div class="sysreq-item-content">
                        <div class="sysreq-item-label">Message Queue</div>
                        <div class="sysreq-item-value">${sizeConfig.queue}</div>
                    </div>
                </div>
            `;
        }

        // Search (Elasticsearch etc.)
        if (sizeConfig.search) {
            html += `
                <div class="sysreq-item">
                    <div class="sysreq-item-icon">${IconMapper.toFontAwesome('🔍', 'component')}</div>
                    <div class="sysreq-item-content">
                        <div class="sysreq-item-label">Suche</div>
                        <div class="sysreq-item-value">${sizeConfig.search}</div>
                    </div>
                </div>
            `;
        }

        // Architecture
        if (sizeConfig.architecture) {
            html += `
                <div class="sysreq-item sysreq-item-wide">
                    <div class="sysreq-item-icon">${IconMapper.toFontAwesome('🏗️', 'component')}</div>
                    <div class="sysreq-item-content">
                        <div class="sysreq-item-label">Architektur</div>
                        <div class="sysreq-item-value">${sizeConfig.architecture}</div>
                    </div>
                </div>
            `;
        }

        // DAGs (für Apache Airflow)
        if (sizeConfig.dags) {
            html += `
                <div class="sysreq-item">
                    <div class="sysreq-item-icon">${IconMapper.toFontAwesome('📊', 'component')}</div>
                    <div class="sysreq-item-content">
                        <div class="sysreq-item-label">DAGs</div>
                        <div class="sysreq-item-value">${sizeConfig.dags}</div>
                    </div>
                </div>
            `;
        }

        // Python Version
        if (sizeConfig.python) {
            html += `
                <div class="sysreq-item">
                    <div class="sysreq-item-icon">${IconMapper.toFontAwesome('🐍', 'component')}</div>
                    <div class="sysreq-item-content">
                        <div class="sysreq-item-label">Python</div>
                        <div class="sysreq-item-value">${sizeConfig.python}</div>
                    </div>
                </div>
            `;
        }

        // Executor (für Apache Airflow)
        if (sizeConfig.executor) {
            html += `
                <div class="sysreq-item">
                    <div class="sysreq-item-icon">${IconMapper.toFontAwesome('⚙️', 'component')}</div>
                    <div class="sysreq-item-content">
                        <div class="sysreq-item-label">Executor</div>
                        <div class="sysreq-item-value">${sizeConfig.executor}</div>
                    </div>
                </div>
            `;
        }

        // Redis (für Apache Airflow)
        if (sizeConfig.redis) {
            html += `
                <div class="sysreq-item">
                    <div class="sysreq-item-icon">${IconMapper.toFontAwesome('⚡', 'utility')}</div>
                    <div class="sysreq-item-content">
                        <div class="sysreq-item-label">Redis</div>
                        <div class="sysreq-item-value">${sizeConfig.redis}</div>
                    </div>
                </div>
            `;
        }

        html += '</div>';
        return html;
    }

    /**
     * Bindet Event-Handler für Sizing-Auswahl
     */
    bindSizingEvents() {
        document.querySelectorAll('.sizing-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const size = e.currentTarget.dataset.size;
                this.selectSizing(size);
            });
        });
    }

    /**
     * Wählt ein Sizing aus und aktualisiert die Anzeige
     */
    selectSizing(size) {
        this.selectedSizing = size;

        // Tab-Buttons aktualisieren
        document.querySelectorAll('.sizing-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.size === size);
        });

        // Details aktualisieren
        if (this.applicationData && this.applicationData.systemRequirements) {
            const detailsContainer = document.getElementById('sizingDetails');
            if (detailsContainer) {
                const sizeConfig = this.applicationData.systemRequirements[size];
                detailsContainer.innerHTML = this.renderSizingDetails(sizeConfig);
            }

            // System-Konfiguration speichern
            this.systemConfig = {
                sizing: size,
                config: this.applicationData.systemRequirements[size],
                application: this.applicationData.name
            };

            // Bestehende Komponenten-Konfigurationen zurücksetzen (außer manuell konfigurierte)
            // Nur automatisch generierte Instanzen (compute-2, database_sql-2, etc.) entfernen
            const autoGeneratedKeys = Object.keys(this.componentConfigs).filter(key =>
                key.match(/-(2|3|4|5)$/)
            );
            autoGeneratedKeys.forEach(key => {
                this.selectedComponents.delete(key);
                delete this.componentConfigs[key];
            });

            // Komponenten-Konfigurationen aus System-Requirements aktualisieren
            this.initComponentConfigsFromSystemRequirements();
        }
    }

    /**
     * Rendert eine kompakte Zusammenfassung der System-Konfiguration für die Analyse-Ansicht
     */
    renderSystemConfigSummary() {
        if (!this.systemConfig || !this.systemConfig.config) {
            return '';
        }

        const config = this.systemConfig.config;
        const sizeLabels = { small: 'Klein', medium: 'Mittel', large: 'Groß' };
        const sizingLabel = sizeLabels[this.systemConfig.sizing] || this.systemConfig.sizing;

        let items = [];

        // Sizing
        items.push(`<span class="config-tag config-tag-primary">${sizingLabel}</span>`);

        // Users
        if (config.users) {
            items.push(`<span class="config-tag">👥 ${config.users}</span>`);
        }
        if (config.contacts) {
            items.push(`<span class="config-tag">👥 ${config.contacts} Kontakte</span>`);
        }

        // Compute
        if (config.compute) {
            const cpu = config.compute.cpu || '-';
            const ram = config.compute.ram || '-';
            items.push(`<span class="config-tag">${IconMapper.toFontAwesome('💻', 'component')} ${cpu} vCPU / ${ram} GB RAM</span>`);
        }

        // Database
        if (config.database) {
            items.push(`<span class="config-tag">${IconMapper.toFontAwesome('🗄️', 'component')} ${config.database.type}</span>`);
            if (config.database.size) {
                items.push(`<span class="config-tag">${IconMapper.toFontAwesome('📊', 'component')} DB: ${config.database.size}</span>`);
            }
        }

        // Storage
        if (config.storage && config.storage.size) {
            items.push(`<span class="config-tag">${IconMapper.toFontAwesome('💾', 'component')} ${config.storage.size}</span>`);
        }

        // OS
        if (config.os && Array.isArray(config.os) && config.os.length > 0) {
            items.push(`<span class="config-tag">${IconMapper.toFontAwesome('🖥️', 'component')} ${config.os[0]}</span>`);
        }

        return `
            <div class="system-config-summary">
                <div class="config-summary-title">Gewählte Konfiguration:</div>
                <div class="config-tags">
                    ${items.join('')}
                </div>
            </div>
        `;
    }

    nextStep() {
        if (this.currentStep < this.totalSteps) {
            let nextStep = this.currentStep + 1;

            // Single-App-Modus: Step 1 überspringen (von 0 direkt zu 2)
            if (!this.isMultiAppMode && this.currentStep === 0) {
                nextStep = 2;
            }

            this.goToStep(nextStep);
        }
    }

    prevStep() {
        if (this.currentStep > 0) {
            let prevStep = this.currentStep - 1;

            // Single-App-Modus: Step 1 überspringen (von 2 zurück zu 0)
            if (!this.isMultiAppMode && this.currentStep === 2) {
                prevStep = 0;
            }

            this.goToStep(prevStep);
        }
    }

    /**
     * Springt zu einem bestimmten Step
     */
    goToStep(targetStep) {
        if (targetStep < 0 || targetStep > this.totalSteps) return;

        // Zurück zu Step 1 (Modus): Single-App-Daten zurücksetzen
        if (targetStep === 1 && !this.isMultiAppMode) {
            this.applicationData = null;
            this.systemConfig = null;
            this.selectedComponents.clear();
            this.componentConfigs = {};
            this.selectedSizing = 'medium';
        }

        // Step 3 nur erlauben wenn Komponenten ausgewählt
        if (targetStep === 3) {
            if (this.isMultiAppMode) {
                const allAppsHaveComponents = this.applications.every(app => app.selectedComponents.size > 0);
                if (!allAppsHaveComponents) {
                    alert('Bitte wählen Sie für alle Anwendungen Komponenten aus.');
                    return;
                }
            } else if (this.selectedComponents.size === 0) {
                alert('Bitte wählen Sie zuerst Komponenten aus.');
                return;
            }
        }

        this.currentStep = targetStep;
        this.updateStepDisplay();

        // Session-State speichern nach Schritt-Wechsel
        this.saveSessionState();

        if (this.currentStep === 2) {
            this.renderComponents();
            this.updateSelectedSummary();
            // ComponentConfigs werden beim Rendern automatisch angezeigt
        } else if (this.currentStep === 3) {
            // Multi-App vs. Single-App Analyse
            if (this.isMultiAppMode) {
                this.runMultiAppAnalysis();
            } else {
                this.runAnalysis();
            }
            // Nach oben scrollen zur Analyse
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    /**
     * Öffnet den Settings-Dialog
     */
    openSettings() {
        const overlay = document.getElementById('settingsOverlay');
        if (overlay) {
            overlay.classList.add('visible');
            this.updateSettingsDisplay();
        }
    }

    /**
     * Schließt den Settings-Dialog
     */
    closeSettings() {
        const overlay = document.getElementById('settingsOverlay');
        if (overlay) {
            overlay.classList.remove('visible');
        }
    }

    /**
     * Aktualisiert die Settings-Anzeige
     */
    updateSettingsDisplay() {
        // Preset-Karten aktualisieren
        document.querySelectorAll('.preset-card').forEach(card => {
            card.classList.toggle('active', card.dataset.preset === this.selectedPreset);
        });

        // Custom Editor anzeigen/verbergen
        const customEditor = document.getElementById('customWeightsEditor');
        if (customEditor) {
            customEditor.style.display = this.selectedPreset === 'custom' ? 'block' : 'none';
        }

        // Custom Inputs aktualisieren
        if (this.selectedPreset === 'custom') {
            document.getElementById('customControl').value = this.weights.control;
            document.getElementById('customPerformance').value = this.weights.performance;
            document.getElementById('customAvailability').value = this.weights.availability;
            document.getElementById('customCost').value = this.weights.cost;
            this.updateCustomWeightTotal();
        }

        // Formel aktualisieren
        this.updateFormulaDisplay();

        // Maturity Einstellungen aktualisieren
        const maturityEnabled = document.getElementById('maturityEnabled');
        if (maturityEnabled) {
            maturityEnabled.checked = this.maturitySettings.enabled;
        }
        const previewPenalty = document.getElementById('previewPenalty');
        if (previewPenalty) {
            previewPenalty.value = this.maturitySettings.previewPenalty;
        }
        const missingPenalty = document.getElementById('missingPenalty');
        if (missingPenalty) {
            missingPenalty.value = this.maturitySettings.missingPenalty;
        }
        // Trigger update to refresh UI state
        this.updateMaturitySettings();

        // Operations Toggle Status aktualisieren
        const operationsEnabled = document.getElementById('operationsEnabled');
        if (operationsEnabled) {
            operationsEnabled.checked = this.operationsSettings.includeInCosts;
        }

        // Project Effort Toggle Status aktualisieren
        const projectEffortEnabled = document.getElementById('projectEffortEnabled');
        if (projectEffortEnabled) {
            projectEffortEnabled.checked = this.projectEffortSettings.includeInCosts;
        }

        // API Key Status aktualisieren
        const apiKeyInput = document.getElementById('apiKeyInput');
        if (apiKeyInput && apiKeyInput.value) {
            this.validateApiKey(apiKeyInput.value);
        }
    }

    /**
     * Wählt ein Preset aus
     */
    selectPreset(presetId) {
        this.selectedPreset = presetId;

        if (presetId !== 'custom') {
            // Gewichte vom Preset übernehmen
            this.weights = { ...this.presets[presetId] };
        }

        // Einstellungen speichern
        this.saveSettings();

        // UI aktualisieren
        this.updateSettingsDisplay();

        // Wenn auf Step 3, Analyse neu berechnen
        if (this.currentStep === 3) {
            if (this.isMultiAppMode) {
                this.runMultiAppAnalysis();
            } else {
                this.runAnalysis();
            }
        }
    }

    /**
     * Aktualisiert die benutzerdefinierten Gewichte
     */
    updateCustomWeights() {
        const control = parseInt(document.getElementById('customControl')?.value) || 0;
        const performance = parseInt(document.getElementById('customPerformance')?.value) || 0;
        const availability = parseInt(document.getElementById('customAvailability')?.value) || 0;
        const cost = parseInt(document.getElementById('customCost')?.value) || 0;

        this.weights = { control, performance, availability, cost };
        this.presets.custom = { ...this.weights };

        // Einstellungen speichern
        this.saveSettings();

        // Preview in der Preset-Karte aktualisieren
        const preview = document.getElementById('customWeightsPreview');
        if (preview) {
            preview.innerHTML = `
                <span>Kontrolle ${control}%</span>
                <span>Leistung ${performance}%</span>
                <span>Verfügbarkeit ${availability}%</span>
                <span>Kosten ${cost}%</span>
            `;
        }

        this.updateCustomWeightTotal();
        this.updateFormulaDisplay();

        // Wenn auf Step 3, Analyse neu berechnen (debounced)
        if (this.currentStep === 3) {
            this.debounce(() => {
                if (this.isMultiAppMode) {
                    this.runMultiAppAnalysis();
                } else {
                    this.runAnalysis();
                }
            }, 300)();
        }
    }

    /**
     * Aktualisiert die Summen-Anzeige für Custom Weights
     */
    updateCustomWeightTotal() {
        const total = this.weights.control + this.weights.performance + this.weights.availability + this.weights.cost;
        const totalEl = document.getElementById('customWeightTotal');
        if (totalEl) {
            const isValid = total === 100;
            totalEl.innerHTML = `Summe: <strong>${total}%</strong> ${isValid ? IconMapper.toFontAwesome('✓', 'utility') : IconMapper.toFontAwesome('⚠️', 'utility')}`;
            totalEl.className = `custom-weight-total ${isValid ? 'valid' : 'invalid'}`;
        }
    }

    /**
     * Aktualisiert die Reife-Faktor Einstellungen
     */
    updateMaturitySettings() {
        const enabled = document.getElementById('maturityEnabled')?.checked ?? true;
        const previewPenalty = parseInt(document.getElementById('previewPenalty')?.value) || 2;
        const missingPenalty = parseInt(document.getElementById('missingPenalty')?.value) || 3;

        this.maturitySettings = {
            enabled,
            previewPenalty,
            missingPenalty
        };

        // Einstellungen speichern
        this.saveSettings();

        // Penalties-Bereich aktivieren/deaktivieren
        const penaltiesEl = document.getElementById('maturityPenalties');
        if (penaltiesEl) {
            penaltiesEl.style.opacity = enabled ? '1' : '0.5';
            penaltiesEl.style.pointerEvents = enabled ? 'auto' : 'none';
        }

        // Beispiel aktualisieren
        const exampleEl = document.querySelector('.maturity-example');
        if (exampleEl) {
            if (enabled) {
                const factor = Math.max(0.7, 1 - (2 * previewPenalty / 100) - (1 * missingPenalty / 100));
                exampleEl.textContent = `Beispiel: 2 Preview + 1 fehlend = Faktor ${factor.toFixed(2)} (Score × ${factor.toFixed(2)})`;
            } else {
                exampleEl.textContent = 'Reife-Faktor deaktiviert - Score wird nicht angepasst';
            }
        }

        // Analyse aktualisieren (debounced)
        if (this.currentStep === 3) {
            this.debounce(() => {
                if (this.isMultiAppMode) {
                    this.runMultiAppAnalysis();
                } else {
                    this.runAnalysis();
                }
            }, 300)();
        }
    }

    /**
     * Aktualisiert die Betriebsaufwand-Einstellungen
     */
    updateOperationsSettings() {
        const enabled = document.getElementById('operationsEnabled')?.checked ?? true;

        this.operationsSettings = {
            includeInCosts: enabled
        };

        // Einstellungen speichern
        this.saveSettings();

        // Analyse aktualisieren (debounced)
        if (this.currentStep === 3) {
            this.debounce(() => {
                if (this.isMultiAppMode) {
                    this.runMultiAppAnalysis();
                } else {
                    this.runAnalysis();
                }
            }, 300)();
        }
    }

    /**
     * Aktualisiert die Projektaufwand-Einstellungen
     */
    updateProjectEffortSettings() {
        const enabled = document.getElementById('projectEffortEnabled')?.checked ?? true;

        this.projectEffortSettings = {
            includeInCosts: enabled
        };

        // Einstellungen speichern
        this.saveSettings();

        // Analyse aktualisieren (debounced)
        if (this.currentStep === 3) {
            this.debounce(() => {
                if (this.isMultiAppMode) {
                    this.runMultiAppAnalysis();
                } else {
                    this.runAnalysis();
                }
            }, 300)();
        }
    }

    /**
     * Gibt das Label für das aktuelle Preset zurück
     */
    getPresetLabel() {
        const labels = {
            balanced: 'Ausgewogen',
            sovereign: 'Maximale Souveränität',
            performance: 'Performance First',
            cost: 'Kostenoptimiert',
            availability: 'Maximale Abdeckung',
            custom: 'Benutzerdefiniert'
        };
        return labels[this.selectedPreset] || 'Ausgewogen';
    }

    /**
     * Gibt das Icon für das aktuelle Preset zurück
     */
    getPresetIcon() {
        // Icons entfernt - returns empty string
        return '';
    }

    /**
     * Gibt einen lesbaren Namen für eine Service-ID zurück
     */
    getServiceDisplayName(serviceId) {
        const names = {
            compute: 'Compute',
            kubernetes: 'Kubernetes',
            serverless: 'Serverless',
            database_sql: 'SQL-DB',
            database_nosql: 'NoSQL-DB',
            storage_object: 'Object Storage',
            storage_block: 'Block Storage',
            storage_file: 'File Storage',
            loadbalancer: 'Load Balancer',
            cdn: 'CDN',
            dns: 'DNS',
            messaging: 'Messaging',
            cache: 'Cache',
            container_registry: 'Registry',
            secrets: 'Secrets',
            monitoring: 'Monitoring',
            logging: 'Logging',
            ai_ml: 'AI/ML',
            identity: 'Identity'
        };
        return names[serviceId] || serviceId;
    }

    /**
     * Aktualisiert die Formel-Anzeige
     */
    updateFormulaDisplay() {
        const formula = document.getElementById('algorithmFormula');
        if (!formula) return;

        const w = this.weights;
        formula.innerHTML = `
            <code>
                Score = Kontrolle × <span class="weight-control">${(w.control / 100).toFixed(2)}</span> +
                Leistung × <span class="weight-performance">${(w.performance / 100).toFixed(2)}</span> +
                Verfügbarkeit × <span class="weight-availability">${(w.availability / 100).toFixed(2)}</span> +
                Kosteneffizienz × <span class="weight-cost">${(w.cost / 100).toFixed(2)}</span>
            </code>
        `;
    }

    /**
     * Toggle API Key Sichtbarkeit
     */
    toggleApiKeyVisibility() {
        const input = document.getElementById('apiKeyInput');
        const btn = document.getElementById('toggleApiKeyBtn');
        if (input && btn) {
            if (input.type === 'password') {
                input.type = 'text';
                btn.textContent = '🙈';
            } else {
                input.type = 'password';
                btn.textContent = '👁️';
            }
        }
    }

    /**
     * Validiert den API Key
     */
    validateApiKey(key) {
        const status = document.getElementById('apiKeyStatus');
        if (!status) return;

        if (!key || key.trim() === '') {
            status.textContent = '';
            status.className = 'api-key-status';
            return;
        }

        // Einfache Validierung (Claude API Keys beginnen mit sk-ant-)
        if (key.startsWith('sk-ant-')) {
            status.textContent = '✓ API-Key Format gültig. KI-Recherche aktiviert.';
            status.className = 'api-key-status valid';
            // Key speichern für spätere Verwendung
            this.apiKey = key;
        } else {
            status.textContent = '⚠ Ungültiges Format. Claude API Keys beginnen mit "sk-ant-"';
            status.className = 'api-key-status invalid';
            this.apiKey = null;
        }
    }

    /**
     * Öffnet das Detail-Popup für einen Provider
     */
    openDetailPopup(providerResult) {
        const overlay = document.getElementById('detailPopupOverlay');
        const title = document.getElementById('detailPopupTitle');
        const content = document.getElementById('detailPopupContent');

        if (!overlay || !content) return;

        title.textContent = `${providerResult.provider.name} - Detailanalyse`;
        content.innerHTML = this.renderProviderDetailContent(providerResult);
        overlay.classList.add('visible');
    }

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
    }

    /**
     * Schließt das Detail-Popup
     */
    closeDetailPopup() {
        const overlay = document.getElementById('detailPopupOverlay');
        if (overlay) {
            overlay.classList.remove('visible');
        }
    }

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
    }

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
    }

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
    }

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
    }

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
    }

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
    }

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

            <div class="pricing-info-box" style="background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(16, 185, 129, 0.1)); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 8px; padding: 12px 16px; margin-bottom: 1rem; display: flex; align-items: center; gap: 12px; font-size: 0.85rem;">
                <span style="font-size: 1.2rem;">${IconMapper.toFontAwesome('📍', 'utility')}</span>
                <div>
                    <strong>Preisbasis:</strong> ${pricingInfo.source || 'Fallback'} |
                    <strong>Region:</strong> Frankfurt (DE) |
                    <strong>Währung:</strong> ${pricingInfo.currency || 'EUR'}
                    ${pricingInfo.lastUpdated ? `| <strong>Stand:</strong> ${pricingInfo.lastUpdated}` : ''}
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
    }

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
    }

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

    updateStepDisplay() {
        // Update step indicators
        document.querySelectorAll('.wizard-step').forEach((step) => {
            const stepNum = parseInt(step.dataset.step);
            step.classList.remove('active', 'completed');
            if (stepNum < this.currentStep) {
                step.classList.add('completed');
            } else if (stepNum === this.currentStep) {
                step.classList.add('active');
            }
        });

        // Update step content
        // Step 0
        const step0 = document.getElementById('step0');
        if (step0) step0.classList.toggle('active', this.currentStep === 0);

        // Step 1 (nur Multi-App-Modus, Mapping-Tabelle)
        const step1 = document.getElementById('step1');
        if (step1) {
            // Step 1 nur im Multi-App-Modus anzeigen
            step1.classList.toggle('active', this.currentStep === 1 && this.isMultiAppMode);
        }

        // Step 2
        const step2 = document.getElementById('step2');
        if (step2) step2.classList.toggle('active', this.currentStep === 2);

        // Step 3
        const step3 = document.getElementById('step3');
        if (step3) step3.classList.toggle('active', this.currentStep === 3);

        // Multi-App Mode: Show/Hide sections in Step 2
        if (this.currentStep === 2) {
            const singleAppConfig = document.getElementById('singleAppConfig');
            const multiAppConfig = document.getElementById('multiAppConfig');

            if (singleAppConfig && multiAppConfig) {
                if (this.isMultiAppMode) {
                    singleAppConfig.style.display = 'none';
                    multiAppConfig.style.display = 'block';
                    this.renderCurrentAppConfig();
                } else {
                    singleAppConfig.style.display = 'block';
                    multiAppConfig.style.display = 'none';
                }
            }
        }

        this.updateNavigationState();
    }

    updateNavigationState() {
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');

        if (prevBtn) {
            prevBtn.style.visibility = this.currentStep > 0 ? 'visible' : 'hidden';
        }

        if (nextBtn) {
            if (this.currentStep === 0) {
                // Step 0: Buttons sind in den Cards integriert
                nextBtn.style.display = 'none';
            } else if (this.currentStep === this.totalSteps) {
                nextBtn.style.display = 'block';
                nextBtn.textContent = 'Neue Analyse';
                nextBtn.onclick = () => this.reset();
            } else if (this.currentStep === 2) {
                nextBtn.style.display = 'block';
                // Multi-App: Prüfe ob alle Apps Komponenten haben
                if (this.isMultiAppMode) {
                    const allAppsHaveComponents = this.applications.every(app => app.selectedComponents.size > 0);
                    nextBtn.disabled = !allAppsHaveComponents;
                } else {
                    nextBtn.disabled = this.selectedComponents.size === 0;
                }
                nextBtn.innerHTML = 'Analyse starten →';
                nextBtn.onclick = () => this.nextStep();
            } else {
                nextBtn.style.display = 'block';
                nextBtn.disabled = false;
                nextBtn.innerHTML = 'Weiter →';
                nextBtn.onclick = () => this.nextStep();
            }
        }
    }

    runAnalysis() {
        const componentIds = Array.from(this.selectedComponents);

        // Sicherstellen, dass systemConfig die aktuellen Komponenten-Konfigurationen widerspiegelt
        this.updateSystemConfigFromComponents();

        // Neue 4-Gewichte-API verwenden, mit systemConfig für realistische Kostenberechnung
        // maturitySettings für konfigurierbaren Reife-Faktor übergeben
        this.analysisResults = this.analyzer.analyzeForComponents(
            componentIds,
            this.weights,
            this.systemConfig,
            this.maturitySettings,
            this.operationsSettings,
            this.projectEffortSettings
        );
        this.renderAnalysisResults();

        // Session-State speichern nach Analyse
        this.saveSessionState();
    }

    /**
     * Multi-App Analyse durchführen
     */
    runMultiAppAnalysis() {
        if (!this.isMultiAppMode || this.applications.length === 0) {
            this.runAnalysis(); // Fallback auf Single-App
            return;
        }

        // Portfolio-Analyse (analysiert alle Apps und aggregiert)
        const multiAnalyzer = new MultiAppAnalyzer(cloudProviders, architectureComponents);
        this.aggregatedResults = multiAnalyzer.analyzePortfolio(
            this.applications,
            this.weights,
            this.maturitySettings,
            this.operationsSettings,
            this.projectEffortSettings
        );

        // Einzelergebnisse in Apps speichern (aus aggregatedResults)
        this.aggregatedResults.perAppResults.forEach(({ app, results }) => {
            const appInstance = this.applications.find(a => a.id === app.id);
            if (appInstance) {
                appInstance.analysisResults = results;
            }
        });

        this.renderAggregatedAnalysisResults();

        // Session-State speichern nach Multi-App-Analyse
        this.saveSessionState();
    }

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
                ${systemConfigHtml}
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
            const comp = architectureComponents.find(c => c.requiredServices?.includes(serviceId));
            const serviceName = comp ? comp.name : serviceId;

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
            const comp = architectureComponents.find(c => c.requiredServices?.includes(serviceId));
            const serviceName = comp ? comp.name : serviceId;

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

    reset() {
        this.currentStep = 1;
        this.selectedComponents.clear();
        this.applicationData = null;
        this.analysisResults = null;
        this.strategyWeight = 50;
        this.systemConfig = null;
        this.selectedSizing = 'medium';

        document.getElementById('appSearchInput').value = '';
        document.getElementById('researchResult').style.display = 'none';

        this.updateStepDisplay();
    }

    /**
     * Exportiert die Analyse als PDF
     */
    exportToPDF() {
        // Check if we're in Multi-App Mode or Single-App Mode
        if (this.isMultiAppMode && this.aggregatedResults) {
            // Multi-App Mode: Export Portfolio Overview
            this.exportPortfolioPDF();
            return;
        }

        // Single-App Mode
        if (!this.analysisResults || this.analysisResults.length === 0) {
            alert('Keine Analyseergebnisse vorhanden.');
            return;
        }

        const top3 = this.analysisResults.slice(0, 3);
        const date = new Date().toLocaleDateString('de-DE', {
            year: 'numeric', month: 'long', day: 'numeric'
        });

        // Generiere die finale Empfehlung wie in der UI
        const finalRec = this.analyzer.generateFinalRecommendation(
            this.analysisResults,
            Array.from(this.selectedComponents),
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
                <span>${this.applicationData?.name || 'Manuelle Auswahl'}</span>
            </div>
            <div class="config-item">
                <label>Komponenten</label>
                <span>${this.selectedComponents.size} ausgewählt</span>
            </div>
            <div class="config-item">
                <label>Bewertungsprofil</label>
                <span>${this.getPresetLabel()}</span>
            </div>
            <div class="config-item">
                <label>Sizing</label>
                <span>${this.selectedSizing === 'small' ? 'Klein' : this.selectedSizing === 'medium' ? 'Mittel' : 'Groß'}</span>
            </div>
        </div>
        <div class="config-grid" style="margin-top: 15px;">
            <div class="config-item">
                <label>Gewichtung</label>
                <span>Kontrolle ${this.weights.control}% | Leistung ${this.weights.performance}% | Verfügbarkeit ${this.weights.availability}% | Kosten ${this.weights.cost}%</span>
            </div>
            <div class="config-item">
                <label>Ausgewählte Komponenten</label>
                <span>${Array.from(this.selectedComponents).map(c => {
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
    }

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
    }

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
    }

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
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // HELPER METHODS
    // ═══════════════════════════════════════════════════════════════════════════════

    /**
     * Formatiert Zahlen für Währungsdarstellung
     */
    formatCurrency(value) {
        return (value || 0).toLocaleString('de-DE');
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // MULTI-APPLICATION SUPPORT METHODS
    // ═══════════════════════════════════════════════════════════════════════════════

    /**
     * Migration von Single-App zu Multi-App Modus
     */
    migrateToMultiApp() {
        if (this.applications.length === 0 && this._applicationData) {
            const app = ApplicationInstance.fromCurrentState({
                applicationData: this._applicationData,
                selectedComponents: this._selectedComponents,
                componentConfigs: this._componentConfigs,
                systemConfig: this._systemConfig,
                selectedSizing: this._selectedSizing,
                analysisResults: this._analysisResults
            });
            this.applications.push(app);
        }
        this.isMultiAppMode = true;
        this.totalSteps = 4; // Step 0 hinzugefügt
    }

    /**
     * Parst Applikationsnamen (Komma, Semikolon, Tab, Absatz) und erstellt ApplicationInstance[]
     */
    parseApplicationList(inputText) {
        // Flexibles Splitting: Komma, Semikolon, Tab, Zeilenumbruch
        const lines = inputText.split(/[,;\t\n]/).map(l => l.trim()).filter(l => l.length > 0);
        const parsedApps = [];

        lines.forEach(line => {
            const matches = this.appMatcher.matchApplication(line);
            const sizingInfo = this.sizingDetector.detectSizing(line);

            const bestMatch = matches.length > 0 ? matches[0] : null;
            const appType = bestMatch && bestMatch.confidence > 0.6 ? bestMatch.id : null;

            const instance = new ApplicationInstance(
                null,
                line,
                appType,
                sizingInfo.sizing
            );

            // Falls bekannte App, System Requirements laden
            if (appType && knownApplications[appType]) {
                instance.applicationData = knownApplications[appType];
                instance.selectedComponents = new Set(knownApplications[appType].components || []);
                this.initComponentConfigsFromSystemRequirements(
                    instance.applicationData,
                    instance.sizing,
                    instance
                );
            }

            parsedApps.push({
                instance,
                userInput: line,
                suggestions: matches,
                detectedSizing: sizingInfo,
                selected: bestMatch
            });
        });

        return parsedApps;
    }

    /**
     * Startet den Multi-App-Modus mit der Eingabe
     */
    startMultiAppMode(inputText) {
        const parsedApps = this.parseApplicationList(inputText);

        if (parsedApps.length === 0) {
            alert('Bitte geben Sie mindestens eine Anwendung ein.');
            return;
        }

        // Apps in den State übernehmen
        this.applications = parsedApps.map(p => p.instance);
        this.migrateToMultiApp();

        // Mapping-Tabelle rendern
        this.renderAppMappingTable(parsedApps);

        // Gehe zu Step 1 (Mapping-Tabelle im Multi-App-Modus)
        this.goToStep(1);
    }

    /**
     * Lädt eine Vorlage von Apps
     */
    loadTemplate(templateName) {
        const templates = {
            erp: `SAP S/4HANA Produktion groß
Microsoft Dynamics 365 mittel
SAP Business One klein`,
            devops: `GitLab Enterprise groß
Jenkins CI/CD
SonarQube
Artifactory
Kubernetes Cluster groß`,
            web: `WordPress Unternehmenswebsite
Nextcloud Filesharing groß
Mattermost Team-Chat mittel
PostgreSQL Datenbank`,
            analytics: `Apache Superset groß
Metabase mittel
InfluxDB
Grafana
Elasticsearch groß
Apache Airflow mittel`,
            collaboration: `Nextcloud groß
Mattermost mittel
Confluence
Jira mittel
GitLab klein`
        };

        const textarea = document.getElementById('multiAppInput');
        if (textarea && templates[templateName]) {
            textarea.value = templates[templateName];
        }
    }

    /**
     * Formatiert VM-Typ-Namen für die Anzeige (z.B. webserver -> Webserver, appTier -> App Tier)
     */
    formatVMTypeName(key) {
        // CamelCase aufteilen: appTier -> App Tier, dbServer -> DB Server
        const formatted = key
            .replace(/([a-z])([A-Z])/g, '$1 $2')  // appTier -> app Tier
            .replace(/^./, str => str.toUpperCase())  // Ersten Buchstaben großschreiben
            .replace(/\b(db|sql|vm|ha|web|app)\b/gi, match => match.toUpperCase());  // DB, SQL, VM, etc. großschreiben

        return formatted;
    }

    /**
     * Maps database keywords to their corresponding component IDs
     * Returns 'database_sql', 'database_nosql' or null if not a database
     */
    getDatabaseComponentId(databaseKeyword) {
        // Elasticsearch ist NICHT enthalten - wird meist als Search Engine genutzt, nicht als primäre DB
        const nosqlDatabases = ['mongodb', 'redis', 'cassandra', 'neo4j', 'couchdb'];
        const sqlDatabases = ['postgresql', 'postgres', 'mysql', 'mariadb', 'sqlserver', 'mssql', 'oracle', 'hana'];

        const keyword = databaseKeyword.toLowerCase();

        if (nosqlDatabases.some(db => keyword.includes(db))) {
            return 'database_nosql';
        }
        if (sqlDatabases.some(db => keyword.includes(db))) {
            return 'database_sql';
        }
        return null;
    }

    /**
     * Extracts node count and type from HA configuration
     * Handles various patterns:
     * - { nodes: 3 }
     * - { nodes: 3, type: 'Replica Set' }
     * - { brokers: 3, zookeeper: 3 }
     * - { servers: 5, clients: 'Unlimited' }
     * - { nodes: '2-3' } (string with range)
     *
     * Returns: { nodeCount: number, haType: string|null, roles: object, hasMultipleRoles: boolean } or null
     */
    extractHAConfig(haConfig) {
        if (!haConfig || typeof haConfig !== 'object') {
            return null;
        }

        const result = {
            nodeCount: 1,
            haType: haConfig.type || null,
            roles: {},
            hasMultipleRoles: false
        };

        // Pattern 1: Simple nodes count
        if (haConfig.nodes) {
            if (typeof haConfig.nodes === 'string') {
                // Handle ranges like '2-3' - take the higher number
                const match = haConfig.nodes.match(/(\d+)-(\d+)/);
                if (match) {
                    result.nodeCount = parseInt(match[2]);
                } else {
                    result.nodeCount = parseInt(haConfig.nodes) || 1;
                }
            } else {
                result.nodeCount = haConfig.nodes;
            }
        }

        // Pattern 2: Multiple role-based counts (brokers, zookeeper, servers, etc.)
        const roleKeys = ['brokers', 'servers', 'zookeeper', 'dataNodes', 'masters', 'replicas', 'workers'];
        let totalRoleNodes = 0;

        for (const roleKey of roleKeys) {
            if (haConfig[roleKey] && typeof haConfig[roleKey] === 'number') {
                result.roles[roleKey] = haConfig[roleKey];
                totalRoleNodes += haConfig[roleKey];
                result.hasMultipleRoles = true;
            }
        }

        // If we have role-based nodes, use the total
        if (totalRoleNodes > 0) {
            result.nodeCount = totalRoleNodes;
        }

        return result;
    }

    /**
     * Helper: Parse Storage Size mit TB/GB/PB Konvertierung
     */
    parseStorageSize(sizeString) {
        if (!sizeString) return 500;
        const match = sizeString.toString().match(/([\d.]+)\s*(TB|GB|PB)?/i);
        if (!match) return parseInt(sizeString) || 500;

        const value = parseFloat(match[1]);
        const unit = match[2] ? match[2].toUpperCase() : 'GB';

        if (unit === 'TB') return Math.round(value * 1024);
        if (unit === 'PB') return Math.round(value * 1024 * 1024);
        return Math.round(value);
    }

    /**
     * Helper: Parse Database Size mit TB/GB Konvertierung und Bereichs-Support
     */
    parseDBSize(sizeString) {
        if (!sizeString) return 100;
        const match = sizeString.toString().match(/([\d.]+)(?:-[\d.]+)?\s*(TB|GB)?/i);
        if (!match) return parseInt(sizeString) || 100;

        let value = parseFloat(match[1]);
        const unit = match[2] ? match[2].toUpperCase() : 'GB';

        // Wenn Bereich (z.B. "1.5-2TB"), nimm die höhere Zahl
        const rangeMatch = sizeString.toString().match(/-([\d.]+)\s*(TB|GB)?/i);
        if (rangeMatch) {
            value = parseFloat(rangeMatch[1]);
        }

        if (unit === 'TB') return Math.round(value * 1024);
        return Math.round(value);
    }

    /**
     * Helper: Parse Storage Configuration
     */
    parseStorageConfig(sysReq, configs, selectedComponents) {
        if (!sysReq.storage) return;

        let storageType = 'ssd';
        if (typeof sysReq.storage.type === 'string') {
            if (sysReq.storage.type.toLowerCase().includes('nvme')) storageType = 'nvme';
            else if (sysReq.storage.type.toLowerCase().includes('hdd')) storageType = 'hdd';
            else if (sysReq.storage.type.toLowerCase().includes('ssd')) storageType = 'ssd';
        }

        const storageSizeGB = this.parseStorageSize(sysReq.storage.size);

        // Block Storage
        if (selectedComponents.has('storage_block')) {
            configs['storage_block'] = {
                blockType: storageType,
                blockSize: storageSizeGB
            };
        }

        // Object Storage
        if (selectedComponents.has('storage_object')) {
            configs['storage_object'] = {
                objectSize: storageSizeGB
            };
        }

        // File Storage
        if (selectedComponents.has('storage_file')) {
            configs['storage_file'] = {
                fileSize: storageSizeGB
            };
        }
    }

    /**
     * Helper: Parse Database Configuration (SQL & NoSQL)
     */
    parseDatabaseConfig(sysReq, configs, selectedComponents) {
        if (!sysReq.database) return;

        const dbTypeString = sysReq.database.type || 'PostgreSQL';
        const dbSize = this.parseDBSize(sysReq.database.size);

        // DB-Typ bestimmen
        let dbType = 'PostgreSQL';
        if (dbTypeString.toLowerCase().includes('mysql')) dbType = 'MySQL';
        else if (dbTypeString.toLowerCase().includes('mssql') || dbTypeString.toLowerCase().includes('sql server')) dbType = 'SQL Server';
        else if (dbTypeString.toLowerCase().includes('oracle')) dbType = 'Oracle';
        else if (dbTypeString.toLowerCase().includes('mongodb')) dbType = 'MongoDB';
        else if (dbTypeString.toLowerCase().includes('postgresql') || dbTypeString.toLowerCase().includes('postgres')) dbType = 'PostgreSQL';
        else if (dbTypeString.toLowerCase().includes('mariadb')) dbType = 'MariaDB';

        // HA-Erkennung
        let isHA = dbTypeString.toLowerCase().includes('ha') ||
                   dbTypeString.toLowerCase().includes('cluster') ||
                   dbTypeString.toLowerCase().includes('replication');
        let haNodes = 2;

        // Check für SQL-Nodes in Compute (z.B. Citrix CVAD)
        if (!isHA && sysReq.compute && sysReq.compute.sql && sysReq.compute.sql.nodes > 1) {
            isHA = true;
            haNodes = sysReq.compute.sql.nodes;
        }

        // Wenn App-Level HA existiert
        if (!isHA && sysReq.ha) {
            const haConfig = this.extractHAConfig(sysReq.ha);
            if (haConfig && haConfig.nodeCount > 1) {
                isHA = true;
                haNodes = haConfig.nodeCount;
            }
        }

        // SQL oder NoSQL?
        const isNoSQL = dbTypeString.toLowerCase().includes('mongodb') ||
                       dbTypeString.toLowerCase().includes('redis') ||
                       dbTypeString.toLowerCase().includes('cassandra');

        if (isNoSQL) {
            // NoSQL Database
            if (selectedComponents.has('database_nosql')) {
                configs['database_nosql'] = {
                    nosqlType: dbType,
                    nosqlSize: dbSize
                };

                if (isHA) {
                    const haMatch = dbTypeString.match(/\((.*?)\)/);
                    let haType = haMatch ? haMatch[1] : null;
                    if (!haType && sysReq.ha) {
                        const appHA = this.extractHAConfig(sysReq.ha);
                        haType = appHA?.haType || 'Replica Set';
                    }
                    const nosqlHANodes = haNodes > 2 ? haNodes : 3;
                    configs['database_nosql']._haType = haType || 'Replica Set';
                    configs['database_nosql']._haNodes = nosqlHANodes;

                    // Zusätzliche Instanzen
                    for (let i = 2; i <= nosqlHANodes; i++) {
                        configs[`database_nosql-${i}`] = {
                            nosqlType: dbType,
                            nosqlSize: dbSize,
                            _haType: configs['database_nosql']._haType,
                            _haNodes: nosqlHANodes,
                            _isHAReplica: true
                        };
                    }
                }
            }
        } else {
            // SQL Database
            if (selectedComponents.has('database_sql')) {
                configs['database_sql'] = {
                    dbType: dbType,
                    dbSize: dbSize
                };

                if (isHA) {
                    const haMatch = dbTypeString.match(/\((.*?)\)/);
                    let haType = haMatch ? haMatch[1] : null;
                    if (!haType && sysReq.ha) {
                        const appHA = this.extractHAConfig(sysReq.ha);
                        haType = appHA?.haType || 'HA';
                    }
                    configs['database_sql']._haType = haType || 'HA';
                    configs['database_sql']._haNodes = haNodes;

                    // Zusätzliche Instanzen
                    for (let i = 2; i <= haNodes; i++) {
                        configs[`database_sql-${i}`] = {
                            dbType: dbType,
                            dbSize: dbSize,
                            _haType: configs['database_sql']._haType,
                            _haNodes: haNodes,
                            _isHAReplica: true
                        };
                    }
                }
            }
        }
    }

    /**
     * System Requirements für eine spezifische App initialisieren
     * Unterstützt beide Modi:
     * - Single-App-Modus: ohne Parameter (verwendet this.systemConfig, this.applicationData, this.selectedSizing)
     * - Multi-App-Modus: mit Parametern (appData, sizing, appInstance)
     */
    initComponentConfigsFromSystemRequirements(appData, sizing, appInstance) {

        // Single-App-Modus: Keine Parameter übergeben
        if (!appData && !sizing && !appInstance) {
            if (!this.systemConfig?.config) {
                return;
            }

            const sysReq = this.systemConfig.config;

            // Compute-Konfiguration übernehmen
            if (sysReq.compute && this.selectedComponents.has('compute')) {
                if (!this.componentConfigs['compute']) {
                    this.initComponentConfig('compute');
                }


                // Prüfe auf Multi-VM-Struktur (verschiedene Patterns)
                // Finde alle VM-Typen (alle Properties die Objekte mit cpu/ram sind)
                // ABER: Filtere Database-Services NUR heraus wenn sie als Managed DB gewählt wurden
                const vmTypes = [];

                for (const [key, value] of Object.entries(sysReq.compute)) {
                    if (value && typeof value === 'object' && (value.cpu || value.ram)) {
                        // Check if this VM is a database
                        const dbComponentId = this.getDatabaseComponentId(key);

                        if (dbComponentId) {
                            // Only skip if the corresponding database component is selected (= Managed DB)
                            if (this.selectedComponents.has(dbComponentId)) {
                                continue;
                            } else {
                            }
                        }

                        vmTypes.push({ key, config: value });
                    }
                }

                if (vmTypes.length > 0) {
                    // Multi-VM-Struktur erkannt - Erstelle separate Instanzen

                    // Erste VM-Typ = compute (Hauptinstanz)
                    const firstVM = vmTypes[0];
                    const firstConfig = firstVM.config;

                    // Determine instances (HA takes precedence if not multi-role)
                    let instances = firstConfig.nodes || firstConfig.count || 1;
                    let haType = null;

                    if (sysReq.ha) {
                        const haConfig = this.extractHAConfig(sysReq.ha);
                        if (haConfig && haConfig.nodeCount > 1 && !haConfig.hasMultipleRoles) {
                            instances = haConfig.nodeCount;
                            haType = haConfig.haType;
                        }
                    }

                    this.componentConfigs['compute'].cpu = firstConfig.cpu || 2;
                    this.componentConfigs['compute'].ram = firstConfig.ram || 4;
                    this.componentConfigs['compute'].instances = instances;
                    this.componentConfigs['compute']._vmTypeName = this.formatVMTypeName(firstVM.key);
                    if (haType) {
                        this.componentConfigs['compute']._haType = haType;
                    }

                    // Weitere VM-Typen = compute-2, compute-3, etc.
                    for (let i = 1; i < vmTypes.length; i++) {
                        const vmType = vmTypes[i];
                        const vmConfig = vmType.config;
                        const instanceId = `compute-${i + 1}`;

                        // Determine instances (HA takes precedence if not multi-role)
                        let instances = vmConfig.nodes || vmConfig.count || 1;
                        let haType = null;

                        if (sysReq.ha) {
                            const haConfig = this.extractHAConfig(sysReq.ha);
                            if (haConfig && haConfig.nodeCount > 1 && !haConfig.hasMultipleRoles) {
                                instances = haConfig.nodeCount;
                                haType = haConfig.haType;
                            }
                        }

                        this.selectedComponents.add(instanceId);
                        this.componentConfigs[instanceId] = {
                            cpu: vmConfig.cpu || 2,
                            ram: vmConfig.ram || 4,
                            instances: instances,
                            _vmTypeName: this.formatVMTypeName(vmType.key)
                        };
                        if (haType) {
                            this.componentConfigs[instanceId]._haType = haType;
                        }

                    }

                } else {
                    // Single-VM (WordPress etc.)
                    this.componentConfigs['compute'].cpu = sysReq.compute.cpu;
                    this.componentConfigs['compute'].ram = sysReq.compute.ram;
                    this.componentConfigs['compute'].instances = sysReq.compute.nodes || 1;

                    // Apply HA configuration if present (overrides nodes)
                    if (sysReq.ha) {
                        const haConfig = this.extractHAConfig(sysReq.ha);
                        if (haConfig && haConfig.nodeCount > 1) {
                            this.componentConfigs['compute'].instances = haConfig.nodeCount;
                            if (haConfig.haType) {
                                this.componentConfigs['compute']._haType = haConfig.haType;
                            }
                        }
                    }

                }
            }

            // Database-Konfiguration übernehmen (SQL & NoSQL)
            if (sysReq.database) {
                const dbType = sysReq.database.type || '';
                // Database ist HA wenn:
                // 1. DB-Type enthält "HA", "Cluster" oder "Replication" ODER
                // 2. App-Level HA existiert (sysReq.ha mit nodes > 1) ODER
                // 3. compute.sql.nodes > 1 (z.B. Citrix CVAD)
                let isHA = dbType.toLowerCase().includes('ha') || dbType.toLowerCase().includes('cluster') || dbType.toLowerCase().includes('replication');
                let haNodes = 2; // Default HA nodes

                // Check für SQL-Nodes in Compute (z.B. Citrix CVAD)
                if (!isHA && sysReq.compute && sysReq.compute.sql && sysReq.compute.sql.nodes > 1) {
                    isHA = true;
                    haNodes = sysReq.compute.sql.nodes;
                }

                // Wenn App-Level HA existiert, sollte DB auch HA sein
                if (!isHA && sysReq.ha) {
                    const haConfig = this.extractHAConfig(sysReq.ha);
                    if (haConfig && haConfig.nodeCount > 1) {
                        isHA = true;
                        haNodes = haConfig.nodeCount;
                    }
                }

                // SQL Database
                if (this.selectedComponents.has('database_sql')) {
                    if (!this.componentConfigs['database_sql']) {
                        this.initComponentConfig('database_sql');
                    }

                    // DB-Typ setzen
                    if (dbType.toLowerCase().includes('postgresql') || dbType.toLowerCase().includes('postgres')) {
                        this.componentConfigs['database_sql'].dbType = 'PostgreSQL';
                    } else if (dbType.toLowerCase().includes('mysql')) {
                        this.componentConfigs['database_sql'].dbType = 'MySQL';
                    } else if (dbType.toLowerCase().includes('mariadb')) {
                        this.componentConfigs['database_sql'].dbType = 'MariaDB';
                    } else if (dbType.toLowerCase().includes('sql server') || dbType.toLowerCase().includes('mssql')) {
                        this.componentConfigs['database_sql'].dbType = 'SQL Server';
                    } else if (dbType.toLowerCase().includes('oracle')) {
                        this.componentConfigs['database_sql'].dbType = 'Oracle';
                    }

                    // DB-Größe (mit TB/GB Konvertierung)
                    if (sysReq.database.size) {
                        const dbSizeGB = this.parseDBSize(sysReq.database.size);
                        if (dbSizeGB) {
                            this.componentConfigs['database_sql'].dbSize = dbSizeGB;
                        }
                    }

                    // HA-Unterstützung
                    if (isHA) {
                        // Versuche HA-Type aus database.type zu extrahieren
                        const haMatch = dbType.match(/\((.*?)\)/);
                        let haType = haMatch ? haMatch[1] : null;

                        // Wenn kein HA-Type in database.type, aber App-Level HA existiert
                        if (!haType && sysReq.ha) {
                            const appHA = this.extractHAConfig(sysReq.ha);
                            haType = appHA?.haType || 'HA';
                        }

                        this.componentConfigs['database_sql']._haType = haType || 'HA';
                        this.componentConfigs['database_sql']._haNodes = haNodes;

                        // Automatisch zusätzliche Instanzen erstellen
                        for (let i = 2; i <= this.componentConfigs['database_sql']._haNodes; i++) {
                            const instanceId = `database_sql-${i}`;
                            if (!this.selectedComponents.has(instanceId)) {
                                this.selectedComponents.add(instanceId);
                                this.componentConfigs[instanceId] = {
                                    dbType: this.componentConfigs['database_sql'].dbType,
                                    dbSize: this.componentConfigs['database_sql'].dbSize,
                                    _haType: this.componentConfigs['database_sql']._haType,
                                    _haNodes: this.componentConfigs['database_sql']._haNodes,
                                    _isHAReplica: true
                                };
                            }
                        }
                    }
                }

                // NoSQL Database
                if (this.selectedComponents.has('database_nosql')) {
                    if (!this.componentConfigs['database_nosql']) {
                        this.initComponentConfig('database_nosql');
                    }

                    // NoSQL-Typ setzen
                    if (dbType.toLowerCase().includes('mongodb')) {
                        this.componentConfigs['database_nosql'].nosqlType = 'MongoDB';
                    } else if (dbType.toLowerCase().includes('redis')) {
                        this.componentConfigs['database_nosql'].nosqlType = 'Redis';
                    } else if (dbType.toLowerCase().includes('cassandra')) {
                        this.componentConfigs['database_nosql'].nosqlType = 'Cassandra';
                    }

                    // DB-Größe (mit TB/GB Konvertierung)
                    if (sysReq.database.size) {
                        const dbSizeGB = this.parseDBSize(sysReq.database.size);
                        if (dbSizeGB) {
                            this.componentConfigs['database_nosql'].nosqlSize = dbSizeGB;
                        }
                    }

                    // HA-Unterstützung
                    if (isHA) {
                        // Versuche HA-Type aus database.type zu extrahieren
                        const haMatch = dbType.match(/\((.*?)\)/);
                        let haType = haMatch ? haMatch[1] : null;

                        // Wenn kein HA-Type in database.type, aber App-Level HA existiert
                        if (!haType && sysReq.ha) {
                            const appHA = this.extractHAConfig(sysReq.ha);
                            haType = appHA?.haType || 'Replica Set';
                        }

                        this.componentConfigs['database_nosql']._haType = haType || 'Replica Set';
                        this.componentConfigs['database_nosql']._haNodes = 3; // NoSQL meist 3 Nodes

                        // Automatisch zusätzliche Instanzen erstellen
                        for (let i = 2; i <= this.componentConfigs['database_nosql']._haNodes; i++) {
                            const instanceId = `database_nosql-${i}`;
                            if (!this.selectedComponents.has(instanceId)) {
                                this.selectedComponents.add(instanceId);
                                this.componentConfigs[instanceId] = {
                                    nosqlType: this.componentConfigs['database_nosql'].nosqlType,
                                    nosqlSize: this.componentConfigs['database_nosql'].nosqlSize,
                                    _haType: this.componentConfigs['database_nosql']._haType,
                                    _haNodes: this.componentConfigs['database_nosql']._haNodes,
                                    _isHAReplica: true
                                };
                            }
                        }
                    }
                }
            }

            // Storage-Konfiguration übernehmen
            if (sysReq.storage) {
                const storageSizeGB = this.parseStorageSize(sysReq.storage.size);

                // Block Storage
                if (this.selectedComponents.has('storage_block')) {
                    if (!this.componentConfigs['storage_block']) {
                        this.initComponentConfig('storage_block');
                    }
                    if (storageSizeGB) {
                        this.componentConfigs['storage_block'].blockSize = storageSizeGB;
                    }
                    // Storage-Typ
                    if (sysReq.storage.type) {
                        const storageType = sysReq.storage.type.toLowerCase();
                        if (storageType.includes('nvme')) {
                            this.componentConfigs['storage_block'].blockType = 'nvme';
                        } else if (storageType.includes('ssd')) {
                            this.componentConfigs['storage_block'].blockType = 'ssd';
                        } else if (storageType.includes('hdd')) {
                            this.componentConfigs['storage_block'].blockType = 'hdd';
                        }
                    }
                }

                // Object Storage
                if (this.selectedComponents.has('storage_object')) {
                    if (!this.componentConfigs['storage_object']) {
                        this.initComponentConfig('storage_object');
                    }
                    if (storageSizeGB) {
                        this.componentConfigs['storage_object'].objectSize = storageSizeGB;
                    }
                }

                // File Storage
                if (this.selectedComponents.has('storage_file')) {
                    if (!this.componentConfigs['storage_file']) {
                        this.initComponentConfig('storage_file');
                    }
                    if (storageSizeGB) {
                        this.componentConfigs['storage_file'].fileSize = storageSizeGB;
                    }
                }
            }

            // Weitere Konfigurationen...
            return;
        }

        // Multi-App-Modus: Parameter übergeben
        if (!appData || !appData.systemRequirements || !appData.systemRequirements[sizing]) {
            return;
        }

        const sysReq = appData.systemRequirements[sizing];
        const configs = {};

        // Kubernetes: Wenn controlPlane/workers vorhanden UND kubernetes als Komponente gewählt
        // dann soll Kubernetes extrahiert werden, NICHT Compute VMs
        if (sysReq.compute && sysReq.compute.controlPlane && sysReq.compute.workers &&
            appInstance.selectedComponents.has('kubernetes')) {

            // Extrahiere Kubernetes-Konfiguration aus controlPlane + workers
            const controlPlane = sysReq.compute.controlPlane;
            const workers = sysReq.compute.workers;

            configs.kubernetes = {
                nodes: workers.count || 3,
                cpuPerNode: workers.cpu || 4,
                ramPerNode: workers.ram || 16,
                _controlPlane: {
                    cpu: controlPlane.cpu || 2,
                    ram: controlPlane.ram || 4,
                    nodes: controlPlane.nodes || 1
                }
            };
        }
        // Compute
        else if (sysReq.compute) {
            // Prüfen ob verschachtelte Struktur (z.B. Apache Airflow oder controlPlane/workers OHNE kubernetes)
            if (sysReq.compute.webserver || sysReq.compute.scheduler ||
                (sysReq.compute.workers && !appInstance.selectedComponents.has('kubernetes')) ||
                sysReq.compute.controlPlane) {
                const vmGroups = [];

                // Control Plane (nur wenn KEIN kubernetes gewählt)
                if (sysReq.compute.controlPlane && !appInstance.selectedComponents.has('kubernetes')) {
                    const cp = sysReq.compute.controlPlane;
                    const cpNodes = cp.nodes || 1;
                    vmGroups.push({
                        name: 'Control Plane',
                        cpu: cp.cpu || 2,
                        ram: cp.ram || 4,
                        count: cpNodes
                    });
                }

                // Webserver
                if (sysReq.compute.webserver) {
                    const ws = sysReq.compute.webserver;
                    const wsNodes = ws.nodes || 1;
                    vmGroups.push({
                        name: 'Webserver',
                        cpu: ws.cpu || 2,
                        ram: ws.ram || 4,
                        count: wsNodes
                    });
                }

                // Scheduler
                if (sysReq.compute.scheduler) {
                    const sc = sysReq.compute.scheduler;
                    const scNodes = sc.nodes || 1;
                    vmGroups.push({
                        name: 'Scheduler',
                        cpu: sc.cpu || 2,
                        ram: sc.ram || 4,
                        count: scNodes
                    });
                }

                // Workers (nur wenn KEIN kubernetes gewählt)
                if (sysReq.compute.workers && !appInstance.selectedComponents.has('kubernetes')) {
                    const wk = sysReq.compute.workers;
                    const wkCount = typeof wk.count === 'string' ? parseInt(wk.count) || 1 : (wk.count || 1);
                    vmGroups.push({
                        name: 'Workers',
                        cpu: wk.cpu || 4,
                        ram: wk.ram || 8,
                        count: wkCount
                    });
                }

                configs.compute = {
                    vmGroups: vmGroups
                };
            } else {
                // Check if Multi-VM structure (e.g., Graylog with graylog, elasticsearch, mongodb)
                const vmTypes = [];

                for (const [key, value] of Object.entries(sysReq.compute)) {
                    if (value && typeof value === 'object' && (value.cpu || value.ram)) {
                        // Check if this VM is a database
                        const dbComponentId = this.getDatabaseComponentId(key);

                        if (dbComponentId) {
                            // Only skip if the corresponding database component is in the app's original selectedComponents
                            // This means the user wants a Managed Database Service instead of a VM
                            if (appInstance.selectedComponents.has(dbComponentId)) {
                                continue;
                            }
                        }

                        vmTypes.push({ key, config: value });
                    }
                }

                if (vmTypes.length > 1) {
                    // Multi-VM structure
                    const firstVM = vmTypes[0];
                    const firstConfig = firstVM.config;

                    // Determine instances (HA takes precedence if not multi-role)
                    let instances = firstConfig.nodes || firstConfig.count || 1;
                    let haType = null;

                    if (sysReq.ha) {
                        const haConfig = this.extractHAConfig(sysReq.ha);
                        if (haConfig && haConfig.nodeCount > 1 && !haConfig.hasMultipleRoles) {
                            instances = haConfig.nodeCount;
                            haType = haConfig.haType;
                        }
                    }

                    configs.compute = {
                        cpu: firstConfig.cpu || 2,
                        ram: firstConfig.ram || 4,
                        instances: instances,
                        _vmTypeName: this.formatVMTypeName(firstVM.key)
                    };
                    if (haType) {
                        configs.compute._haType = haType;
                    }

                    // Create additional compute instances for remaining VMs
                    for (let i = 1; i < vmTypes.length; i++) {
                        const vmType = vmTypes[i];
                        const vmConfig = vmType.config;
                        const instanceId = `compute-${i + 1}`;

                        // Determine instances (HA takes precedence if not multi-role)
                        let instances = vmConfig.nodes || vmConfig.count || 1;
                        let haType = null;

                        if (sysReq.ha) {
                            const haConfig = this.extractHAConfig(sysReq.ha);
                            if (haConfig && haConfig.nodeCount > 1 && !haConfig.hasMultipleRoles) {
                                instances = haConfig.nodeCount;
                                haType = haConfig.haType;
                            }
                        }

                        configs[instanceId] = {
                            cpu: vmConfig.cpu || 2,
                            ram: vmConfig.ram || 4,
                            instances: instances,
                            _vmTypeName: this.formatVMTypeName(vmType.key)
                        };
                        if (haType) {
                            configs[instanceId]._haType = haType;
                        }
                    }
                } else if (vmTypes.length === 1) {
                    // Single VM type but structured (e.g., { graylog: { cpu: 4, ram: 8 } })
                    const vmType = vmTypes[0];
                    const vmConfig = vmType.config;

                    let instances = vmConfig.nodes || vmConfig.count || 1;
                    let haType = null;

                    if (sysReq.ha) {
                        const haConfig = this.extractHAConfig(sysReq.ha);
                        if (haConfig && haConfig.nodeCount > 1) {
                            instances = haConfig.nodeCount;
                            haType = haConfig.haType;
                        }
                    }

                    configs.compute = {
                        cpu: vmConfig.cpu || 2,
                        ram: vmConfig.ram || 4,
                        instances: instances,
                        _vmTypeName: this.formatVMTypeName(vmType.key)
                    };
                    if (haType) {
                        configs.compute._haType = haType;
                    }
                } else {
                    // Simple structure (cpu/ram directly on compute)
                    let instanceCount = sysReq.compute.nodes || 1;
                    let haType = null;

                    if (sysReq.ha) {
                        const haConfig = this.extractHAConfig(sysReq.ha);
                        if (haConfig && haConfig.nodeCount > 1) {
                            instanceCount = haConfig.nodeCount;
                            haType = haConfig.haType;
                        }
                    }

                    configs.compute = {
                        cpu: sysReq.compute.cpu,
                        ram: sysReq.compute.ram,
                        instances: instanceCount
                    };

                    if (haType) {
                        configs.compute._haType = haType;
                    }
                }
            }
        }

        // Database
        // Prüfe ob explizite Database-Definition vorhanden ist ODER ob Database-VMs im Compute-Block sind
        let dbFromCompute = null;
        if (!sysReq.database && sysReq.compute) {
            // Suche nach Database-VMs im Compute-Block
            for (const [key, value] of Object.entries(sysReq.compute)) {
                if (value && typeof value === 'object' && (value.cpu || value.ram)) {
                    const dbComponentId = this.getDatabaseComponentId(key);
                    if (dbComponentId && appInstance.selectedComponents.has(dbComponentId)) {
                        // Gefunden: MongoDB, PostgreSQL, etc. im Compute-Block
                        dbFromCompute = {
                            key: key,
                            config: value,
                            componentId: dbComponentId
                        };
                        break;
                    }
                }
            }
        }

        if (sysReq.database || dbFromCompute) {
            let dbTypeString, dbSize;

            if (dbFromCompute) {
                // Datenbank-Typ und Größe aus Compute-Config ableiten
                dbTypeString = dbFromCompute.key; // z.B. "mongodb"
                dbSize = 100; // Default
            } else {
                dbTypeString = sysReq.database.type || 'PostgreSQL';
                dbSize = this.parseDBSize(sysReq.database.size);
            }

            let dbType = 'PostgreSQL';

            // DB-Typ bestimmen
            if (dbTypeString.toLowerCase().includes('mysql')) dbType = 'MySQL';
            else if (dbTypeString.toLowerCase().includes('mssql') ||
                     dbTypeString.toLowerCase().includes('sql server')) dbType = 'MS SQL Server';
            else if (dbTypeString.toLowerCase().includes('oracle')) dbType = 'Oracle';
            else if (dbTypeString.toLowerCase().includes('mongodb')) dbType = 'MongoDB';

            // HA-Erkennung (wie im Single-App-Modus)
            let isHA = dbTypeString.toLowerCase().includes('ha') ||
                       dbTypeString.toLowerCase().includes('cluster') ||
                       dbTypeString.toLowerCase().includes('replication');
            let haNodes = 2; // Default HA nodes

            // Check für SQL-Nodes in Compute (z.B. Citrix CVAD)
            if (!isHA && sysReq.compute && sysReq.compute.sql && sysReq.compute.sql.nodes > 1) {
                isHA = true;
                haNodes = sysReq.compute.sql.nodes;
            }

            // Wenn App-Level HA existiert, sollte DB auch HA sein
            if (!isHA && sysReq.ha) {
                const haConfig = this.extractHAConfig(sysReq.ha);
                if (haConfig && haConfig.nodeCount > 1) {
                    isHA = true;
                    haNodes = haConfig.nodeCount;
                }
            }

            // SQL oder NoSQL?
            const isNoSQL = dbTypeString.toLowerCase().includes('mongodb') ||
                           dbTypeString.toLowerCase().includes('redis') ||
                           dbTypeString.toLowerCase().includes('cassandra');

            if (isNoSQL) {
                configs.database_nosql = {
                    nosqlType: dbType,
                    nosqlSize: dbSize
                };

                if (isHA) {
                    const haMatch = dbTypeString.match(/\((.*?)\)/);
                    let haType = haMatch ? haMatch[1] : null;
                    if (!haType && sysReq.ha) {
                        const appHA = this.extractHAConfig(sysReq.ha);
                        haType = appHA?.haType || 'Replica Set';
                    }
                    const nosqlHANodes = haNodes > 2 ? haNodes : 3; // NoSQL meist mindestens 3 Nodes
                    configs.database_nosql._haType = haType || 'Replica Set';
                    configs.database_nosql._haNodes = nosqlHANodes;

                    // Zusätzliche Instanzen für HA
                    for (let i = 2; i <= nosqlHANodes; i++) {
                        configs[`database_nosql-${i}`] = {
                            nosqlType: dbType,
                            nosqlSize: dbSize,
                            _haType: configs.database_nosql._haType,
                            _haNodes: nosqlHANodes,
                            _isHAReplica: true
                        };
                    }
                }
            } else {
                configs.database_sql = {
                    dbType: dbType,
                    dbSize: dbSize
                };

                if (isHA) {
                    const haMatch = dbTypeString.match(/\((.*?)\)/);
                    let haType = haMatch ? haMatch[1] : null;
                    if (!haType && sysReq.ha) {
                        const appHA = this.extractHAConfig(sysReq.ha);
                        haType = appHA?.haType || 'HA';
                    }
                    configs.database_sql._haType = haType || 'HA';
                    configs.database_sql._haNodes = haNodes;

                    // Zusätzliche Instanzen für HA
                    for (let i = 2; i <= haNodes; i++) {
                        configs[`database_sql-${i}`] = {
                            dbType: dbType,
                            dbSize: dbSize,
                            _haType: configs.database_sql._haType,
                            _haNodes: haNodes,
                            _isHAReplica: true
                        };
                    }
                }
            }
        }

        // Storage
        if (sysReq.storage) {
            let storageType = 'ssd'; // Default lowercase für blockType
            if (typeof sysReq.storage.type === 'string') {
                if (sysReq.storage.type.toLowerCase().includes('nvme')) storageType = 'nvme';
                else if (sysReq.storage.type.toLowerCase().includes('hdd')) storageType = 'hdd';
                else if (sysReq.storage.type.toLowerCase().includes('ssd')) storageType = 'ssd';
            }

            // Storage-Größe mit TB/GB Konvertierung
            const parseStorageSize = (sizeString) => {
                if (!sizeString) return 500;
                // Match Zahl mit optionaler Einheit (TB, GB, PB)
                const match = sizeString.toString().match(/([\d.]+)\s*(TB|GB|PB)?/i);
                if (!match) return parseInt(sizeString) || 500;

                const value = parseFloat(match[1]);
                const unit = match[2] ? match[2].toUpperCase() : 'GB';

                // Konvertiere alles zu GB
                if (unit === 'TB') return Math.round(value * 1024);
                if (unit === 'PB') return Math.round(value * 1024 * 1024);
                return Math.round(value);
            };

            configs.storage_block = {
                blockType: storageType,  // ✅ Korrekt: blockType statt type
                blockSize: parseStorageSize(sysReq.storage.size)  // ✅ Korrekt: blockSize statt size
            };
        }

        // Fallback: Wenn Database/Storage-Komponenten in selectedComponents sind, aber keine Config erstellt wurde
        // (z.B. bei Kubernetes Microservices ohne explizite DB-Definition in systemRequirements)
        if (appInstance.selectedComponents.has('database_sql') && !configs.database_sql) {
            configs.database_sql = {
                dbType: 'PostgreSQL',
                dbSize: 100
            };
        }
        if (appInstance.selectedComponents.has('database_nosql') && !configs.database_nosql) {
            configs.database_nosql = {
                nosqlType: 'MongoDB',
                nosqlSize: 100
            };
        }
        if (appInstance.selectedComponents.has('storage_block') && !configs.storage_block) {
            configs.storage_block = {
                type: 'SSD',
                size: 500
            };
        }
        if (appInstance.selectedComponents.has('storage_object') && !configs.storage_object) {
            configs.storage_object = {
                size: 1000
            };
        }

        // Aktualisiere selectedComponents und componentConfigs
        // Infrastruktur-Komponenten (compute*, database*, storage*, kubernetes) werden durch configs ersetzt
        // Andere Komponenten (loadbalancer, dns, etc.) werden beibehalten

        // 1. Sammle alle konfigurierten Komponenten aus configs
        const configuredComponentIds = Object.keys(configs).filter(key => {
            // Filtere interne Keys aus (beginnen mit _)
            return !key.startsWith('_');
        });

        // 2. Definiere welche Komponenten als "Infrastruktur" gelten und ersetzt werden sollen
        const infrastructureComponentPrefixes = ['compute', 'database_sql', 'database_nosql', 'storage_block', 'storage_object', 'kubernetes', 'serverless'];

        // 3. Behalte nur Nicht-Infrastruktur-Komponenten aus der ursprünglichen Liste
        const originalNonInfraComponents = Array.from(appInstance.selectedComponents).filter(compId => {
            return !infrastructureComponentPrefixes.some(prefix => compId.startsWith(prefix));
        });

        // 4. Erstelle neue componentConfigs: Alte configs für non-infra, neue configs für infra
        const newComponentConfigs = {};

        // Kopiere configs für Nicht-Infrastruktur-Komponenten aus den alten configs
        for (const compId of originalNonInfraComponents) {
            if (appInstance.componentConfigs[compId]) {
                newComponentConfigs[compId] = appInstance.componentConfigs[compId];
            }
        }

        // Füge neue configs für Infrastruktur-Komponenten hinzu
        Object.assign(newComponentConfigs, configs);

        appInstance.componentConfigs = newComponentConfigs;

        // Konvertiere configs ins neue Array-Format für die Analyseengine
        appInstance.systemConfig = {
            config: this.convertConfigsToAnalysisFormat(configs),
            sizing: this.getSizeLabel(sizing)
        };

        // 5. Kombiniere: Konfigurierte Infrastruktur-Komponenten + ursprüngliche Nicht-Infrastruktur-Komponenten
        appInstance.selectedComponents = new Set([...configuredComponentIds, ...originalNonInfraComponents]);
    }

    /**
     * Konvertiert Legacy-Config-Format ins neue Array-Format für die Analyseengine
     */
    convertConfigsToAnalysisFormat(configs) {
        const converted = {};

        // Compute: Sammle alle compute* Einträge und konvertiere zu vmGroups
        const computeEntries = Object.entries(configs).filter(([key]) =>
            key === 'compute' || key.startsWith('compute-')
        );

        if (computeEntries.length > 0) {
            converted.compute = { vmGroups: [] };

            computeEntries.forEach(([key, config]) => {
                if (config.cpu && config.ram) {
                    const count = config.instances || 1;
                    // Jeder compute-Eintrag repräsentiert eine VM-Gruppe
                    // compute, compute-2, compute-3 etc. sind verschiedene VM-Typen
                    converted.compute.vmGroups.push({
                        cpu: config.cpu,
                        ram: config.ram,
                        count: count
                    });
                }
            });
        }

        // Database SQL: Sammle alle database_sql* Einträge
        const sqlEntries = Object.entries(configs).filter(([key]) =>
            key === 'database_sql' || key.startsWith('database_sql-')
        );

        if (sqlEntries.length > 0) {
            converted.database = { databases: [] };

            // Jeder Eintrag ist eine separate Datenbank (oder HA-Replica)
            sqlEntries.forEach(([key, config]) => {
                // Überspringe HA-Replicas (werden über haNodes des Haupt-Eintrags verwaltet)
                if (config._isHAReplica) return;

                const haNodes = config._haNodes || 1;

                // Füge Haupt-DB hinzu
                converted.database.databases.push({
                    type: config.dbType || 'PostgreSQL',
                    size: config.dbSize || 100
                });

                // Für HA-Setups: Füge Replica-DBs hinzu (falls haNodes > 1)
                for (let i = 2; i <= haNodes; i++) {
                    converted.database.databases.push({
                        type: config.dbType || 'PostgreSQL',
                        size: config.dbSize || 100
                    });
                }
            });
        }

        // Database NoSQL: Sammle alle database_nosql* Einträge
        const nosqlEntries = Object.entries(configs).filter(([key]) =>
            key === 'database_nosql' || key.startsWith('database_nosql-')
        );

        if (nosqlEntries.length > 0) {
            converted.nosql = { instances: [] };

            // Jeder Eintrag ist eine separate NoSQL-Datenbank (oder HA-Replica)
            nosqlEntries.forEach(([key, config]) => {
                // Überspringe HA-Replicas
                if (config._isHAReplica) return;

                const haNodes = config._haNodes || 1;

                // Füge Haupt-DB hinzu
                converted.nosql.instances.push({
                    type: config.nosqlType || 'MongoDB',
                    size: config.nosqlSize || 100
                });

                // Für HA-Setups: Füge Replica-DBs hinzu
                for (let i = 2; i <= haNodes; i++) {
                    converted.nosql.instances.push({
                        type: config.nosqlType || 'MongoDB',
                        size: config.nosqlSize || 100
                    });
                }
            });
        }

        // Storage Block: Sammle alle storage_block* Einträge
        const storageEntries = Object.entries(configs).filter(([key]) =>
            key === 'storage_block' || key.startsWith('storage_block-')
        );

        if (storageEntries.length > 0) {
            converted.storage = { volumes: [] };

            // Jeder storage_block Eintrag ist ein separates Volume
            storageEntries.forEach(([key, config]) => {
                converted.storage.volumes.push({
                    type: config.blockType || 'ssd',
                    size: config.blockSize || 200
                });
            });
        }

        // Storage Object
        if (configs.storage_object) {
            converted.objectStorage = {
                size: configs.storage_object.objectSize || 1000
            };
        }

        // Kubernetes
        if (configs.kubernetes) {
            converted.kubernetes = {
                clusters: [{
                    nodes: configs.kubernetes.nodes || 3,
                    cpuPerNode: configs.kubernetes.cpuPerNode || 4,
                    ramPerNode: configs.kubernetes.ramPerNode || 16
                }]
            };
        }

        // Serverless
        if (configs.serverless) {
            converted.serverless = {
                instances: [{
                    functions: configs.serverless.functions || 10,
                    invocationsPerMonth: configs.serverless.invocationsPerMonth || 1000000
                }]
            };
        }

        // Messaging
        if (configs.messaging) {
            converted.messaging = {
                instances: [{
                    type: configs.messaging.type || 'Standard',
                    messagesPerMonth: configs.messaging.messagesPerMonth || 1000000
                }]
            };
        }

        // Cache
        if (configs.cache) {
            converted.cache = configs.cache;
        }

        // Users (für Legacy-Berechnungen)
        if (configs.users) {
            converted.users = configs.users;
        }

        return converted;
    }

    /**
     * Rendert die App-Mapping-Tabelle (Step 1)
     */
    renderAppMappingTable(parsedApps) {
        const tbody = document.getElementById('appMappingTableBody');
        if (!tbody) return;

        tbody.innerHTML = '';

        parsedApps.forEach((parsed, index) => {
            const row = document.createElement('tr');
            row.dataset.appId = parsed.instance.id;

            // # Spalte
            const numCell = document.createElement('td');
            numCell.textContent = index + 1;
            row.appendChild(numCell);

            // User Input (editierbar)
            const nameCell = document.createElement('td');
            const nameInput = document.createElement('input');
            nameInput.type = 'text';
            nameInput.value = parsed.userInput;
            nameInput.className = 'app-name-input';
            nameInput.dataset.appId = parsed.instance.id;
            nameInput.addEventListener('change', (e) => {
                const appId = e.target.dataset.appId;
                const appToUpdate = this.applications.find(a => a.id === appId);
                if (appToUpdate) {
                    appToUpdate.name = e.target.value;
                }
            });
            nameCell.appendChild(nameInput);
            row.appendChild(nameCell);

            // App-Typ Autocomplete
            const typeCell = document.createElement('td');
            typeCell.style.position = 'relative';

            // Wrapper für Input + Dropdown
            const typeWrapper = document.createElement('div');
            typeWrapper.className = 'app-type-autocomplete-wrapper';
            typeWrapper.style.position = 'relative';

            // Input-Feld
            const typeInput = document.createElement('input');
            typeInput.type = 'text';
            typeInput.className = 'app-type-input';
            typeInput.dataset.appId = parsed.instance.id;
            typeInput.autocomplete = 'off';
            typeInput.placeholder = 'Anwendung auswählen...';

            // Aktuellen Wert setzen
            if (parsed.selected) {
                typeInput.value = parsed.selected.app.name;
                typeInput.dataset.selectedId = parsed.selected.id;
            } else {
                typeInput.value = 'Benutzerdefiniert';
                typeInput.dataset.selectedId = 'custom';
            }

            // Dropdown Container
            const typeDropdown = document.createElement('div');
            typeDropdown.className = 'app-type-dropdown';
            typeDropdown.dataset.appId = parsed.instance.id;

            typeWrapper.appendChild(typeInput);
            typeWrapper.appendChild(typeDropdown);
            typeCell.appendChild(typeWrapper);

            // Event Listeners für Autocomplete
            typeInput.addEventListener('focus', () => {
                this.showAppTypeDropdown(typeInput, typeDropdown, parsed.suggestions);
            });

            typeInput.addEventListener('input', () => {
                this.filterAppTypeDropdown(typeInput, typeDropdown, parsed.suggestions);
            });

            typeInput.addEventListener('keydown', (e) => {
                this.handleAppTypeKeyboard(e, typeInput, typeDropdown);
            });

            // Click außerhalb schließt Dropdown
            document.addEventListener('click', (e) => {
                if (!typeWrapper.contains(e.target)) {
                    typeDropdown.classList.remove('visible');
                }
            }, { once: false });

            row.appendChild(typeCell);

            // Sizing Dropdown
            const sizingCell = document.createElement('td');
            const sizingSelect = document.createElement('select');
            sizingSelect.className = 'app-sizing-select';
            sizingSelect.dataset.appId = parsed.instance.id;

            ['small', 'medium', 'large'].forEach(size => {
                const opt = document.createElement('option');
                opt.value = size;
                opt.textContent = size === 'small' ? 'Klein (1-100 User)' :
                                 size === 'medium' ? 'Mittel (100-500 User)' :
                                 'Groß (500+ User)';
                if (size === parsed.detectedSizing.sizing) opt.selected = true;
                sizingSelect.appendChild(opt);
            });

            sizingSelect.addEventListener('change', (e) => this.onAppSizingChange(e));
            sizingCell.appendChild(sizingSelect);
            row.appendChild(sizingCell);

            // Konfidenz
            const confCell = document.createElement('td');
            if (parsed.selected) {
                const confidence = Math.round(parsed.selected.confidence * 100);
                const confClass = confidence > 80 ? 'high' : confidence > 60 ? 'medium' : 'low';
                confCell.innerHTML = `
                    <div class="confidence-badge ${confClass}">${confidence}%</div>
                    <div class="match-reason">${this.escapeHtml(parsed.selected.reason)}</div>
                `;
            } else {
                confCell.innerHTML = '<div class="confidence-badge low">Manual</div>';
            }
            row.appendChild(confCell);

            // Aktionen
            const actionsCell = document.createElement('td');
            actionsCell.innerHTML = `
                <button class="icon-btn" onclick="app.removeAppFromMapping('${parsed.instance.id}')" title="Entfernen">
                    🗑️
                </button>
            `;
            row.appendChild(actionsCell);

            tbody.appendChild(row);
        });

        this.updateMappingSummary();
    }

    /**
     * Event Handler: App-Typ wurde geändert
     */
    onAppTypeChange(event) {
        const appId = event.target.dataset.appId;
        const newType = event.target.value;
        const appIndex = this.applications.findIndex(a => a.id === appId);

        if (appIndex === -1) return;

        const app = this.applications[appIndex];
        app.type = newType === 'custom' ? null : newType;
        app.isCustom = newType === 'custom';

        if (newType !== 'custom' && knownApplications[newType]) {
            app.applicationData = knownApplications[newType];
            app.selectedComponents = new Set(knownApplications[newType].components || []);
            this.initComponentConfigsFromSystemRequirements(
                app.applicationData,
                app.sizing,
                app
            );
        } else {
            app.applicationData = null;
            app.selectedComponents = new Set();
            app.componentConfigs = {};
        }
    }

    /**
     * Event Handler: Sizing wurde geändert
     */
    onAppSizingChange(event) {
        const appId = event.target.dataset.appId;
        const newSizing = event.target.value;
        const appIndex = this.applications.findIndex(a => a.id === appId);

        if (appIndex === -1) return;

        const app = this.applications[appIndex];
        app.sizing = newSizing;

        if (app.applicationData) {
            this.initComponentConfigsFromSystemRequirements(
                app.applicationData,
                app.sizing,
                app
            );
        }
    }

    /**
     * Zeigt das Autocomplete-Dropdown für App-Typ
     */
    showAppTypeDropdown(input, dropdown, suggestions) {
        this.filterAppTypeDropdown(input, dropdown, suggestions);

        // Positioniere Dropdown relativ zum Input (fixed positioning)
        const rect = input.getBoundingClientRect();
        dropdown.style.top = `${rect.bottom + 2}px`;
        dropdown.style.left = `${rect.left}px`;
        dropdown.style.width = `${rect.width}px`;

        dropdown.classList.add('visible');
    }

    /**
     * Filtert das Autocomplete-Dropdown basierend auf Eingabe
     */
    filterAppTypeDropdown(input, dropdown, suggestions) {
        const filter = input.value.toLowerCase().trim();
        const allApps = Object.entries(knownApplications);

        // Position aktualisieren (für scroll/resize)
        if (dropdown.classList.contains('visible')) {
            const rect = input.getBoundingClientRect();
            dropdown.style.top = `${rect.bottom + 2}px`;
            dropdown.style.left = `${rect.left}px`;
            dropdown.style.width = `${rect.width}px`;
        }

        // Apps filtern mit Fuzzy-Matching
        let filteredApps;
        if (!filter) {
            filteredApps = allApps;
        } else {
            // Exakte und Teilstring-Matches
            const exactMatches = allApps.filter(([id, app]) => {
                const name = app.name.toLowerCase();
                const idLower = id.toLowerCase();
                return name.includes(filter) || idLower.includes(filter);
            });

            // Fuzzy-Matches (für Tippfehler)
            const fuzzyMatches = [];
            if (filter.length >= 3) { // Nur bei mind. 3 Zeichen
                allApps.forEach(([id, app]) => {
                    // Skip wenn schon in exactMatches
                    if (exactMatches.some(([matchId]) => matchId === id)) return;

                    // Prüfe Ähnlichkeit mit einzelnen Wörtern im Namen
                    // Split nach Leerzeichen UND Sonderzeichen wie /, -, ( etc.
                    const nameWords = app.name.toLowerCase().split(/[\s\/\-\(\)]+/);
                    const idWords = id.toLowerCase().split(/[-_]/);
                    const allWords = [...nameWords, ...idWords];

                    let maxSimilarity = 0;

                    // Vergleiche Filter mit jedem Wort
                    allWords.forEach(word => {
                        if (word.length < 2) return; // Skip sehr kurze Wörter wie "s", "a"

                        // Vollständiger Vergleich
                        let similarity = this.calculateSimilarity(filter, word);

                        // Auch Substring-Vergleich (z.B. "superset" in "Apache Superset")
                        // mit Tippfehlertoleranz
                        if (word.length >= filter.length) {
                            // Prüfe alle Substrings der Länge des Filters
                            for (let i = 0; i <= word.length - filter.length; i++) {
                                const substring = word.substring(i, i + filter.length);
                                const substringSimilarity = this.calculateSimilarity(filter, substring);
                                similarity = Math.max(similarity, substringSimilarity);
                            }
                        }

                        maxSimilarity = Math.max(maxSimilarity, similarity);
                    });

                    // Niedrigerer Schwellwert für bessere Tippfehlertoleranz
                    if (maxSimilarity > 0.6) { // 60% Ähnlichkeit
                        fuzzyMatches.push([id, app, maxSimilarity]);
                    }
                });
                fuzzyMatches.sort((a, b) => b[2] - a[2]); // Sortiere nach Ähnlichkeit
            }

            filteredApps = [...exactMatches, ...fuzzyMatches.map(([id, app]) => [id, app])];
        }

        // Nach Relevanz sortieren: Vorschläge zuerst, dann alphabetisch
        filteredApps.sort((a, b) => {
            const aIsSuggestion = suggestions.some(s => s.id === a[0]);
            const bIsSuggestion = suggestions.some(s => s.id === b[0]);

            if (aIsSuggestion && !bIsSuggestion) return -1;
            if (!aIsSuggestion && bIsSuggestion) return 1;
            return a[1].name.localeCompare(b[1].name);
        });

        // HTML generieren
        if (filteredApps.length === 0) {
            dropdown.innerHTML = `
                <div class="app-type-dropdown-item" style="cursor: default; color: var(--text-secondary);">
                    Keine Anwendung gefunden
                </div>
            `;
        } else {
            dropdown.innerHTML = filteredApps.map(([id, app]) => {
                const isSuggestion = suggestions.some(s => s.id === id);
                const checkmark = isSuggestion ? ' ✓' : '';
                return `
                    <div class="app-type-dropdown-item" data-app-id="${id}">
                        <div class="app-type-dropdown-item-name">${app.name}${checkmark}</div>
                    </div>
                `;
            }).join('') + `
                <div class="app-type-dropdown-divider"></div>
                <div class="app-type-dropdown-item" data-app-id="custom">
                    <div class="app-type-dropdown-item-name">Benutzerdefiniert</div>
                </div>
            `;

            // Click-Handler für Items
            dropdown.querySelectorAll('.app-type-dropdown-item[data-app-id]').forEach(item => {
                item.addEventListener('click', () => {
                    const appId = item.dataset.appId;
                    const appData = appId === 'custom' ? null : knownApplications[appId];

                    // Update Input
                    input.value = appData ? appData.name : 'Benutzerdefiniert';
                    input.dataset.selectedId = appId;

                    // Trigger Change Event
                    const event = {
                        target: {
                            dataset: { appId: input.dataset.appId },
                            value: appId
                        }
                    };
                    this.onAppTypeChange(event);

                    dropdown.classList.remove('visible');
                });
            });
        }
    }

    /**
     * Keyboard-Navigation für App-Typ Autocomplete
     */
    handleAppTypeKeyboard(e, input, dropdown) {
        if (!dropdown.classList.contains('visible')) return;

        const items = dropdown.querySelectorAll('.app-type-dropdown-item[data-app-id]');
        if (items.length === 0) return;

        const currentIndex = Array.from(items).findIndex(item => item.classList.contains('selected'));

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            const newIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
            items.forEach((item, i) => item.classList.toggle('selected', i === newIndex));
            items[newIndex].scrollIntoView({ block: 'nearest' });
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const newIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
            items.forEach((item, i) => item.classList.toggle('selected', i === newIndex));
            items[newIndex].scrollIntoView({ block: 'nearest' });
        } else if (e.key === 'Enter' && currentIndex >= 0) {
            e.preventDefault();
            items[currentIndex].click();
        } else if (e.key === 'Escape') {
            dropdown.classList.remove('visible');
        }
    }

    /**
     * Berechnet String-Ähnlichkeit (Levenshtein-basiert)
     */
    calculateSimilarity(s1, s2) {
        const longer = s1.length > s2.length ? s1 : s2;
        const shorter = s1.length > s2.length ? s2 : s1;
        const longerLength = longer.length;
        if (longerLength === 0) return 1.0;

        // Levenshtein-Distanz
        const distance = this.levenshteinDistance(longer, shorter);
        return (longerLength - distance) / longerLength;
    }

    /**
     * Berechnet Levenshtein-Distanz zwischen zwei Strings
     */
    levenshteinDistance(s1, s2) {
        const costs = [];
        for (let i = 0; i <= s1.length; i++) {
            let lastValue = i;
            for (let j = 0; j <= s2.length; j++) {
                if (i === 0) {
                    costs[j] = j;
                } else if (j > 0) {
                    let newValue = costs[j - 1];
                    if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
                        newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
                    }
                    costs[j - 1] = lastValue;
                    lastValue = newValue;
                }
            }
            if (i > 0) costs[s2.length] = lastValue;
        }
        return costs[s2.length];
    }

    /**
     * App aus Mapping-Tabelle entfernen
     */
    removeAppFromMapping(appId) {
        const index = this.applications.findIndex(a => a.id === appId);
        if (index !== -1) {
            this.applications.splice(index, 1);
            const row = document.querySelector(`tr[data-app-id="${appId}"]`);
            if (row) row.remove();
            this.updateMappingSummary();
        }
    }

    /**
     * App aus Komponenten-Konfiguration entfernen (Tab)
     */
    removeAppFromConfig(appId) {
        if (this.applications.length <= 1) {
            alert('Sie müssen mindestens eine Anwendung behalten.');
            return;
        }

        const index = this.applications.findIndex(a => a.id === appId);
        if (index === -1) return;

        const appName = this.applications[index].name;
        if (!confirm(`Möchten Sie "${appName}" wirklich entfernen?`)) {
            return;
        }

        // Entferne die App
        this.applications.splice(index, 1);

        // Passe currentAppIndex an
        if (this.currentAppIndex >= this.applications.length) {
            this.currentAppIndex = this.applications.length - 1;
        }

        // Aktualisiere die Ansicht
        this.renderCurrentAppConfig();
    }

    /**
     * Mapping-Zusammenfassung aktualisieren
     */
    updateMappingSummary() {
        const totalCount = this.applications.length;
        const autoMatched = this.applications.filter(a => !a.isCustom).length;
        const customCount = this.applications.filter(a => a.isCustom).length;

        const totalEl = document.getElementById('totalAppsCount');
        const autoEl = document.getElementById('autoMatchedCount');
        const customEl = document.getElementById('customAppsCount');

        if (totalEl) totalEl.textContent = totalCount;
        if (autoEl) autoEl.textContent = autoMatched;
        if (customEl) customEl.textContent = customCount;
    }

    /**
     * Manuell eine neue App zur Mapping-Tabelle hinzufügen
     */
    addManualApp() {
        // Erstelle eine neue leere ApplicationInstance
        const newApp = new ApplicationInstance(
            null,
            'Neue Anwendung',
            null,
            'medium'
        );

        // Füge zur Liste hinzu
        this.applications.push(newApp);

        // Wenn wir in Step 1 (Mapping) sind, aktualisiere die Tabelle
        if (this.currentStep === 1) {
            // Erstelle parsed format für Rendering
            const parsedApps = this.applications.map(app => {
                const matches = this.appMatcher.matchApplication(app.name);
                const sizingInfo = this.sizingDetector.detectSizing(app.name);

                return {
                    userInput: app.name,
                    suggestions: matches,
                    selected: matches.length > 0 ? matches[0] : null,
                    detectedSizing: sizingInfo,
                    instance: app
                };
            });

            this.renderAppMappingTable(parsedApps);

            // Scroll zur neuen Zeile
            const tbody = document.getElementById('appMappingTableBody');
            if (tbody && tbody.lastElementChild) {
                tbody.lastElementChild.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }
        // Wenn wir in Step 2 (Komponenten) sind, wechsle zur neuen App
        else if (this.currentStep === 2) {
            // Setze Index auf die neue App
            this.currentAppIndex = this.applications.length - 1;

            // Rendere die Konfiguration für die neue App
            this.renderCurrentAppConfig();
        }
    }

    /**
     * Zur nächsten App navigieren
     */
    goToNextApp() {
        if (this.currentAppIndex < this.applications.length - 1) {
            this.currentAppIndex++;
            this.renderCurrentAppConfig();
        }
    }

    /**
     * Zur vorherigen App navigieren
     */
    goToPrevApp() {
        if (this.currentAppIndex > 0) {
            this.currentAppIndex--;
            this.renderCurrentAppConfig();
        }
    }

    /**
     * Rendert die Konfiguration der aktuellen App
     */
    renderCurrentAppConfig() {
        const app = this.applications[this.currentAppIndex];
        if (!app) return;

        // App-Header aktualisieren (editierbar)
        const nameEl = document.getElementById('currentAppName');
        if (nameEl) {
            nameEl.innerHTML = `
                <span class="app-name-text" style="cursor: pointer;" title="Klicken zum Umbenennen">${this.escapeHtml(app.name)}</span>
                <button class="edit-app-name-btn icon-btn" title="App umbenennen">✏️</button>
            `;

            // Event Listener für Edit-Button und Text
            const textEl = nameEl.querySelector('.app-name-text');
            const editBtn = nameEl.querySelector('.edit-app-name-btn');

            const startEdit = () => {
                const currentName = app.name;
                const input = document.createElement('input');
                input.type = 'text';
                input.value = currentName;
                input.style.cssText = 'font-size: 1.5rem; font-weight: 600; padding: 0.25rem 0.5rem; border: 2px solid var(--btc-primary); border-radius: 4px; width: 300px;';

                // Ersetze Text durch Input
                textEl.replaceWith(input);
                editBtn.style.display = 'none';
                input.focus();
                input.select();

                const saveEdit = () => {
                    const newName = input.value.trim();
                    if (newName && newName !== currentName) {
                        app.name = newName;
                        this.renderCurrentAppConfig();
                        this.updateAppTabs();
                    } else {
                        this.renderCurrentAppConfig();
                    }
                };

                input.addEventListener('blur', saveEdit);
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        saveEdit();
                    } else if (e.key === 'Escape') {
                        this.renderCurrentAppConfig();
                    }
                });
            };

            textEl.addEventListener('click', startEdit);
            editBtn.addEventListener('click', startEdit);
        }

        const metaEl = document.querySelector('.app-config-meta');
        if (metaEl) {
            const typeName = app.type && knownApplications[app.type] ?
                           knownApplications[app.type].name : 'Benutzerdefiniert';
            const sizeName = app.sizing === 'small' ? 'Klein' :
                           app.sizing === 'medium' ? 'Mittel' : 'Groß';
            metaEl.innerHTML = `
                <span class="meta-badge">Typ: ${this.escapeHtml(typeName)}</span>
                <span class="meta-badge">Größe: ${sizeName}</span>
            `;
        }

        // System Requirements anzeigen
        if (app.applicationData && app.applicationData.systemRequirements) {
            this.renderSystemRequirements(app.applicationData, app.sizing);
        }

        // Komponenten rendern
        this.renderComponents();

        // Navigation-Buttons aktualisieren
        this.updateAppNavigation();

        // Tabs aktualisieren
        this.updateAppTabs();
    }

    /**
     * App-Navigation-Buttons aktualisieren
     */
    updateAppNavigation() {
        const prevBtn = document.getElementById('prevAppBtn');
        const nextBtn = document.getElementById('nextAppBtn');
        const counter = document.getElementById('appCounter');

        if (prevBtn) {
            prevBtn.disabled = this.currentAppIndex === 0;
        }

        if (nextBtn) {
            nextBtn.disabled = this.currentAppIndex === this.applications.length - 1;
        }

        if (counter) {
            counter.textContent = `${this.currentAppIndex + 1} von ${this.applications.length}`;
        }
    }

    /**
     * App-Tabs aktualisieren
     */
    updateAppTabs() {
        const tabsContainer = document.getElementById('appConfigTabs');
        if (!tabsContainer) return;

        tabsContainer.innerHTML = '';

        // Normale App-Tabs
        this.applications.forEach((app, index) => {
            const tab = document.createElement('div');
            tab.className = 'app-tab' + (index === this.currentAppIndex ? ' active' : '');
            tab.dataset.appId = app.id;
            tab.innerHTML = `
                <span class="tab-name">${this.escapeHtml(app.name)}</span>
                <span class="tab-badge">${app.selectedComponents.size}</span>
                <button class="tab-delete-btn" title="App entfernen">×</button>
            `;

            // Click handler für Tab (nicht für den Delete-Button)
            const tabName = tab.querySelector('.tab-name');
            const tabBadge = tab.querySelector('.tab-badge');
            tabName.addEventListener('click', () => {
                this.currentAppIndex = index;
                this.renderCurrentAppConfig();
            });
            tabBadge.addEventListener('click', () => {
                this.currentAppIndex = index;
                this.renderCurrentAppConfig();
            });

            // Click handler für Delete-Button
            const deleteBtn = tab.querySelector('.tab-delete-btn');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.removeAppFromConfig(app.id);
            });

            tabsContainer.appendChild(tab);
        });

        // "+ Neue App" Tab hinzufügen
        const addTab = document.createElement('div');
        addTab.className = 'app-tab add-app-tab';
        addTab.innerHTML = `
            <span class="tab-name">+ Neue App</span>
        `;
        addTab.addEventListener('click', () => {
            this.addManualApp();
        });
        tabsContainer.appendChild(addTab);
    }

    /**
     * Helper: HTML escaping
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Helper: Size Label
     */
    getSizeLabel(sizing) {
        return sizing === 'small' ? 'Klein (1-100 User)' :
               sizing === 'medium' ? 'Mittel (100-500 User)' :
               'Groß (500+ User)';
    }
}

// App global verfügbar machen
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new SovereignArchitectureAdvisor();
});
