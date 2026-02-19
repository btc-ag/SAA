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

        // Architektur-Modus Einstellungen
        this.architectureSettings = {
            mode: null,              // null = Auto, 'cloud_native' = Cloud-native/PaaS, 'classic' = VM-basiert
            appId: null              // App-ID für spezifische Pattern-Erkennung
        };
        this.detectedPattern = null; // Erkanntes Deployment-Pattern

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
                    // Multi-App State - selectedComponents müssen als Set wiederhergestellt werden
                    this.applications = (state.applications || []).map(app => {
                        // Stelle sicher, dass selectedComponents ein Set ist
                        if (app.selectedComponents) {
                            if (app.selectedComponents instanceof Set) {
                                // Bereits ein Set - nichts tun
                            } else if (Array.isArray(app.selectedComponents)) {
                                // Array -> Set
                                app.selectedComponents = new Set(app.selectedComponents);
                            } else if (typeof app.selectedComponents === 'object') {
                                // Objekt (z.B. von JSON) -> Values als Set
                                app.selectedComponents = new Set(Object.values(app.selectedComponents));
                            } else {
                                app.selectedComponents = new Set();
                            }
                        } else {
                            app.selectedComponents = new Set();
                        }
                        return app;
                    });
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
                const template = e.target.dataset.template;

                // Neuer App-Start → State vollständig zurücksetzen
                if (app) this.hardReset();

                if (app === 'custom') {
                    // Benutzerdefinierte App: Direkt zur manuellen Auswahl
                    this.applicationData = null;
                    document.getElementById('researchResult').style.display = 'none';
                    document.getElementById('appSearchInput').value = 'Benutzerdefinierte Anwendung';
                    this.nextStep();
                } else if (app) {
                    // Bekannte App → direkt laden, Sizing-Auswahl auf Step 0 anzeigen
                    const knownApp = knownApplications[app];
                    if (knownApp) {
                        document.getElementById('appSearchInput').value = knownApp.name;
                        this.applicationData = knownApp;
                        this.selectedComponents.clear();
                        knownApp.components.forEach(c => this.selectedComponents.add(c));
                        if (knownApp.systemRequirements) {
                            const defaultSize = knownApp.systemRequirements[this.selectedSizing]
                                ? this.selectedSizing
                                : (knownApp.systemRequirements.medium ? 'medium' :
                                   knownApp.systemRequirements.small ? 'small' : 'large');
                            this.selectedSizing = defaultSize;
                            this.systemConfig = {
                                sizing: defaultSize,
                                config: knownApp.systemRequirements[defaultSize],
                                application: knownApp.name
                            };
                            try { this.initComponentConfigsFromSystemRequirements(); } catch (e) {}
                        }
                        // Sizing-Auswahl anzeigen (ohne Recherche-Delay)
                        const sysReqHtml = this.renderSystemRequirements(knownApp);
                        const resultDiv = document.getElementById('researchResult');
                        resultDiv.innerHTML = `
                            <div class="research-result">
                                <div class="research-result-header">
                                    <span class="research-result-title">${knownApp.name}</span>
                                </div>
                                <p class="research-result-description">${knownApp.description || ''}</p>
                                ${sysReqHtml}
                                <div style="margin-top: 1rem;">
                                    <button class="nav-button primary" onclick="app.nextStep()">
                                        Weiter mit ${knownApp.components.length} Komponenten →
                                    </button>
                                </div>
                            </div>
                        `;
                        resultDiv.style.display = 'block';
                        this.bindSizingEvents();
                    } else {
                        // Unbekannte App → Fallback auf Suche
                        document.getElementById('appSearchInput').value = app;
                        this.searchApplication();
                    }
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

        // Deployment-Pattern erkennen für aktuelle Komponenten
        const componentIds = Array.from(this.selectedComponents).map(id => id.replace(/-\d+$/, ''));
        const appId = this.applicationData ? Object.keys(knownApplications).find(k => knownApplications[k].name === this.applicationData.name) : null;
        this.detectedPattern = typeof detectDeploymentPattern === 'function'
            ? detectDeploymentPattern(componentIds, appId)
            : null;

        // Architektur-Modus Toggle
        let html = `
            <div class="architecture-mode-panel" style="
                background: var(--surface-secondary);
                border: 1px solid var(--border-color);
                border-radius: 12px;
                padding: 1rem 1.25rem;
                margin-bottom: 1.5rem;
            ">
                <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem;">
                    <i class="fa-solid fa-cloud" style="color: var(--primary-color); font-size: 1.1rem;"></i>
                    <span style="font-weight: 600; color: var(--text-primary);">Architektur-Modus</span>
                    ${this.detectedPattern ? `<span class="pattern-badge" style="
                        background: var(--primary-color);
                        color: white;
                        font-size: 0.7rem;
                        padding: 0.2rem 0.5rem;
                        border-radius: 4px;
                        margin-left: auto;
                    ">Erkannt: ${this.detectedPattern.name}</span>` : ''}
                </div>
                <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
                    <label class="architecture-mode-option" style="
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                        padding: 0.5rem 1rem;
                        border: 2px solid ${this.architectureSettings.mode === 'cloud_native' ? 'var(--primary-color)' : 'var(--border-color)'};
                        border-radius: 8px;
                        cursor: pointer;
                        transition: all 0.2s;
                        background: ${this.architectureSettings.mode === 'cloud_native' ? 'var(--primary-color-light)' : 'var(--surface-primary)'};
                    ">
                        <input type="radio" name="architectureMode" value="cloud_native"
                            ${this.architectureSettings.mode === 'cloud_native' ? 'checked' : ''}
                            style="accent-color: var(--primary-color);">
                        <i class="fa-solid fa-cloud" style="color: ${this.architectureSettings.mode === 'cloud_native' ? 'var(--primary-color)' : 'var(--text-secondary)'};"></i>
                        <div>
                            <div style="font-weight: 500; font-size: 0.9rem;">Cloud-native</div>
                            <div style="font-size: 0.75rem; color: var(--text-secondary);">PaaS, Serverless, weniger Aufwand</div>
                        </div>
                    </label>
                    <label class="architecture-mode-option" style="
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                        padding: 0.5rem 1rem;
                        border: 2px solid ${this.architectureSettings.mode === 'classic' ? 'var(--primary-color)' : 'var(--border-color)'};
                        border-radius: 8px;
                        cursor: pointer;
                        transition: all 0.2s;
                        background: ${this.architectureSettings.mode === 'classic' ? 'var(--primary-color-light)' : 'var(--surface-primary)'};
                    ">
                        <input type="radio" name="architectureMode" value="classic"
                            ${this.architectureSettings.mode === 'classic' ? 'checked' : ''}
                            style="accent-color: var(--primary-color);">
                        <i class="fa-solid fa-server" style="color: ${this.architectureSettings.mode === 'classic' ? 'var(--primary-color)' : 'var(--text-secondary)'};"></i>
                        <div>
                            <div style="font-weight: 500; font-size: 0.9rem;">Klassisch</div>
                            <div style="font-size: 0.75rem; color: var(--text-secondary);">VMs, volle Kontrolle</div>
                        </div>
                    </label>
                    <label class="architecture-mode-option" style="
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                        padding: 0.5rem 1rem;
                        border: 2px solid ${this.architectureSettings.mode === null ? 'var(--primary-color)' : 'var(--border-color)'};
                        border-radius: 8px;
                        cursor: pointer;
                        transition: all 0.2s;
                        background: ${this.architectureSettings.mode === null ? 'var(--primary-color-light)' : 'var(--surface-primary)'};
                    ">
                        <input type="radio" name="architectureMode" value="auto"
                            ${this.architectureSettings.mode === null ? 'checked' : ''}
                            style="accent-color: var(--primary-color);">
                        <i class="fa-solid fa-wand-magic-sparkles" style="color: ${this.architectureSettings.mode === null ? 'var(--primary-color)' : 'var(--text-secondary)'};"></i>
                        <div>
                            <div style="font-weight: 500; font-size: 0.9rem;">Automatisch</div>
                            <div style="font-size: 0.75rem; color: var(--text-secondary);">Basierend auf Workload</div>
                        </div>
                    </label>
                </div>
                ${this.detectedPattern && this.architectureSettings.mode !== 'classic' ? `
                    <div style="
                        margin-top: 0.75rem;
                        padding: 0.75rem;
                        background: var(--surface-primary);
                        border-radius: 8px;
                        border-left: 3px solid var(--primary-color);
                    ">
                        <div style="font-size: 0.85rem; color: var(--text-primary); margin-bottom: 0.25rem;">
                            <i class="fa-solid fa-lightbulb" style="color: var(--warning-color); margin-right: 0.5rem;"></i>
                            <strong>${this.detectedPattern.name}</strong> erkannt
                        </div>
                        <div style="font-size: 0.8rem; color: var(--text-secondary);">
                            ${this.detectedPattern.cloudNative?.description || ''}
                            ${this.detectedPattern.cloudNative?.operationsFactor < 1 ? `<br><span style="color: var(--success-color);">→ ~${Math.round((1 - this.detectedPattern.cloudNative.operationsFactor) * 100)}% weniger Betriebsaufwand</span>` : ''}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;

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

        // Event Listener für Architektur-Modus Toggle
        container.querySelectorAll('input[name="architectureMode"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                const value = e.target.value;
                this.architectureSettings.mode = value === 'auto' ? null : value;
                // Re-render um visuelles Feedback zu geben
                this.renderComponents();
                // Analyse neu starten falls bereits Ergebnisse vorhanden
                if (this.analysisResults) {
                    this.runAnalysis();
                }
            });
        });
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
            const anyControlPlaneOnly = k8sInstances.some(k => k.controlPlaneOnly);
            kubernetesConfig = {
                controlPlaneOnly: anyControlPlaneOnly,
                clusters: k8sInstances.map(k8s => ({
                    nodes: parseInt(k8s.nodes) ?? 3,
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

        // Kubernetes im Control-Plane-Only-Modus: keine Worker-Felder zeigen
        if (componentId === 'kubernetes' && config.controlPlaneOnly) {
            return `
                <div class="component-config-panel" onclick="event.stopPropagation()">
                    <div class="component-config-field" style="color: var(--text-muted); font-size: 0.85rem; padding: 0.25rem 0;">
                        <i class="fa-solid fa-circle-info" style="margin-right: 0.4rem;"></i>
                        Managed Control Plane – Worker Nodes werden über die Compute-Komponente konfiguriert.
                    </div>
                </div>
            `;
        }
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

    // ─── Settings – delegiert an modules/saa-settings.js ────────────────────
    openSettings() { return SAASettings.openSettings.call(this); }
    closeSettings() { return SAASettings.closeSettings.call(this); }
    updateSettingsDisplay() { return SAASettings.updateSettingsDisplay.call(this); }
    selectPreset(presetId) { return SAASettings.selectPreset.call(this, presetId); }
    updateCustomWeights() { return SAASettings.updateCustomWeights.call(this); }
    updateCustomWeightTotal() { return SAASettings.updateCustomWeightTotal.call(this); }
    updateMaturitySettings() { return SAASettings.updateMaturitySettings.call(this); }
    updateOperationsSettings() { return SAASettings.updateOperationsSettings.call(this); }
    updateProjectEffortSettings() { return SAASettings.updateProjectEffortSettings.call(this); }
    getPresetLabel() { return SAASettings.getPresetLabel.call(this); }
    getPresetIcon() { return SAASettings.getPresetIcon.call(this); }
    getServiceDisplayName(serviceId) { return SAASettings.getServiceDisplayName.call(this, serviceId); }
    updateFormulaDisplay() { return SAASettings.updateFormulaDisplay.call(this); }
    toggleApiKeyVisibility() { return SAASettings.toggleApiKeyVisibility.call(this); }
    validateApiKey(key) { return SAASettings.validateApiKey.call(this, key); }

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

        // App-ID für Pattern-Erkennung ermitteln
        const appId = this.applicationData
            ? Object.keys(knownApplications).find(k => knownApplications[k].name === this.applicationData.name)
            : null;

        // Architektur-Einstellungen vorbereiten
        const archSettings = {
            mode: this.architectureSettings.mode, // null = Auto, 'cloud_native' oder 'classic'
            appId: appId
        };

        // Neue 4-Gewichte-API verwenden, mit systemConfig für realistische Kostenberechnung
        // maturitySettings für konfigurierbaren Reife-Faktor übergeben
        // architectureSettings für Cloud-native vs. Klassisch
        this.analysisResults = this.analyzer.analyzeForComponents(
            componentIds,
            this.weights,
            this.systemConfig,
            this.maturitySettings,
            this.operationsSettings,
            this.projectEffortSettings,
            archSettings
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

    // ─── SAAResults – delegiert an modules/saa-results.js ────────────────────
    renderAnalysisResults() { return SAAResults.renderAnalysisResults.call(this); }
    renderAggregatedAnalysisResults() { return SAAResults.renderAggregatedAnalysisResults.call(this); }
    renderAggregatedProviderCard(result, index, aggregatedTCO) { return SAAResults.renderAggregatedProviderCard.call(this, result, index, aggregatedTCO); }
    renderAppBreakdownItem(app, index) { return SAAResults.renderAppBreakdownItem.call(this, app, index); }
    toggleAppBreakdown(index) { return SAAResults.toggleAppBreakdown.call(this, index); }
    scrollToAppBreakdown(index) { return SAAResults.scrollToAppBreakdown.call(this, index); }
    renderTCOOverview(result) { return SAAResults.renderTCOOverview.call(this, result); }
    renderRecommendationCard(result, index, appIndex = null) { return SAAResults.renderRecommendationCard.call(this, result, index, appIndex); }
    bindDetailButtons() { return SAAResults.bindDetailButtons.call(this); }
    renderComparisonTableForApp(app) { return SAAResults.renderComparisonTableForApp.call(this, app); }
    renderCustomScoresNotice() { return SAAResults.renderCustomScoresNotice.call(this); }
    renderComparisonTable() { return SAAResults.renderComparisonTable.call(this); }
    buildServiceTooltip(service) { return SAAResults.buildServiceTooltip.call(this, service); }
    formatServiceTooltipHTML(service) { return SAAResults.formatServiceTooltipHTML.call(this, service); }
    renderRatingIndicators(service) { return SAAResults.renderRatingIndicators.call(this, service); }
    initTooltips() { return SAAResults.initTooltips.call(this); }
    formatRecommendationText(text) { return SAAResults.formatRecommendationText.call(this, text); }
    formatPortfolioRecommendationText(topProvider, metrics, aggregatedTCO) { return SAAResults.formatPortfolioRecommendationText.call(this, topProvider, metrics, aggregatedTCO); }

    reset() {
        this.currentStep = 0;
        this.selectedComponents.clear();
        this.componentConfigs = {};
        this.applicationData = null;
        this.analysisResults = null;
        this.strategyWeight = 50;
        this.systemConfig = null;
        this.selectedSizing = 'medium';

        document.getElementById('appSearchInput').value = '';
        document.getElementById('researchResult').style.display = 'none';

        this.updateStepDisplay();
    }

    hardReset() {
        sessionStorage.removeItem('saa_session_state');
        this.reset();
    }

    // ─── PDF Export – delegiert an modules/saa-pdf.js ──────────────────────────
    exportToPDF()                                { return SAAPdf.exportToPDF.call(this); }
    exportPortfolioPDF()                         { return SAAPdf.exportPortfolioPDF.call(this); }
    renderPortfolioPDFProviderCard(r, i, tco)    { return SAAPdf.renderPortfolioPDFProviderCard.call(this, r, i, tco); }
    renderPDFProviderCard(r, i, cl, ol)          { return SAAPdf.renderPDFProviderCard.call(this, r, i, cl, ol); }

    // MULTI-APPLICATION SUPPORT METHODS
    // ═══════════════════════════════════════════════════════════════════════════════

    // ─── SAAMultiApp – delegiert an modules/saa-multiapp.js ────────────────────
    migrateToMultiApp() { return SAAMultiApp.migrateToMultiApp.call(this); }
    parseApplicationList(inputText) { return SAAMultiApp.parseApplicationList.call(this, inputText); }
    startMultiAppMode(inputText) { return SAAMultiApp.startMultiAppMode.call(this, inputText); }
    loadTemplate(templateName) { return SAAMultiApp.loadTemplate.call(this, templateName); }
    formatVMTypeName(key) { return SAAMultiApp.formatVMTypeName.call(this, key); }
    getDatabaseComponentId(databaseKeyword) { return SAAMultiApp.getDatabaseComponentId.call(this, databaseKeyword); }
    extractHAConfig(haConfig) { return SAAMultiApp.extractHAConfig.call(this, haConfig); }
    parseStorageSize(sizeString) { return SAAMultiApp.parseStorageSize.call(this, sizeString); }
    parseDBSize(sizeString) { return SAAMultiApp.parseDBSize.call(this, sizeString); }
    parseStorageConfig(sysReq, configs, selectedComponents) { return SAAMultiApp.parseStorageConfig.call(this, sysReq, configs, selectedComponents); }
    parseDatabaseConfig(sysReq, configs, selectedComponents) { return SAAMultiApp.parseDatabaseConfig.call(this, sysReq, configs, selectedComponents); }
    initComponentConfigsFromSystemRequirements(appData, sizing, appInstance) { return SAAMultiApp.initComponentConfigsFromSystemRequirements.call(this, appData, sizing, appInstance); }
    convertConfigsToAnalysisFormat(configs) { return SAAMultiApp.convertConfigsToAnalysisFormat.call(this, configs); }
    renderAppMappingTable(parsedApps) { return SAAMultiApp.renderAppMappingTable.call(this, parsedApps); }
    onAppTypeChange(event) { return SAAMultiApp.onAppTypeChange.call(this, event); }
    onAppSizingChange(event) { return SAAMultiApp.onAppSizingChange.call(this, event); }
    showAppTypeDropdown(input, dropdown, suggestions) { return SAAMultiApp.showAppTypeDropdown.call(this, input, dropdown, suggestions); }
    filterAppTypeDropdown(input, dropdown, suggestions) { return SAAMultiApp.filterAppTypeDropdown.call(this, input, dropdown, suggestions); }
    handleAppTypeKeyboard(e, input, dropdown) { return SAAMultiApp.handleAppTypeKeyboard.call(this, e, input, dropdown); }
    calculateSimilarity(s1, s2) { return SAAMultiApp.calculateSimilarity.call(this, s1, s2); }
    levenshteinDistance(s1, s2) { return SAAMultiApp.levenshteinDistance.call(this, s1, s2); }
    removeAppFromMapping(appId) { return SAAMultiApp.removeAppFromMapping.call(this, appId); }
    removeAppFromConfig(appId) { return SAAMultiApp.removeAppFromConfig.call(this, appId); }
    updateMappingSummary() { return SAAMultiApp.updateMappingSummary.call(this); }
    addManualApp() { return SAAMultiApp.addManualApp.call(this); }
    goToNextApp() { return SAAMultiApp.goToNextApp.call(this); }
    goToPrevApp() { return SAAMultiApp.goToPrevApp.call(this); }
    renderCurrentAppConfig() { return SAAMultiApp.renderCurrentAppConfig.call(this); }
    updateAppNavigation() { return SAAMultiApp.updateAppNavigation.call(this); }
    updateAppTabs() { return SAAMultiApp.updateAppTabs.call(this); }
    escapeHtml(text) { return SAAMultiApp.escapeHtml.call(this, text); }
    getSizeLabel(sizing) { return SAAMultiApp.getSizeLabel.call(this, sizing); }


// App global verfügbar machen
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new SovereignArchitectureAdvisor();
});
