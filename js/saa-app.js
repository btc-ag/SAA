/**
 * Sovereign Architecture Advisor - Main Application
 * Orchestrator: Navigation, Suche, Analyse, System-Requirements
 */

import { cloudProviders, architectureComponents } from './saa-data.js';
import { ApplicationMatcher } from './modules/application-matcher.js';
import { SizingDetector } from './modules/sizing-detector.js';
import { knownApplications } from './saa-apps-data.js';
import { CloudAnalyzer, ApplicationResearcher, PortfolioAnalyzer } from './saa-analysis.js';
import { IconMapper } from './modules/saa-utils.js';
import { SAAState } from './modules/saa-state.js';
import { SAAComponents } from './modules/saa-components.js';
import { SAAResults } from './modules/saa-results.js';
import { SAASettings } from './modules/saa-settings.js';
import { SAAMultiApp } from './modules/saa-multiapp.js';
import { SAAPdf } from './modules/saa-pdf.js';
import { getAuditMode, setAuditMode } from './modules/audit-mode.js';
import { ApplicationInstance } from './modules/application-instance.js';


// Umami-Tracking-Helfer (no-op falls Umami nicht geladen)
function track(eventName, data) {
    if (typeof window.umami !== 'undefined' && typeof window.umami.track === 'function') {
        try { window.umami.track(eventName, data); } catch (e) { /* ignore */ }
    }
}

class SovereignArchitectureAdvisor {
    constructor() {
        this.currentStep = 0; // Start bei Step 0 (Auswahl)
        this.totalSteps = 3;

        // ========== ALWAYS PORTFOLIO ==========
        // State lebt ausschließlich auf this.applications[currentAppIndex]
        // (= this.currentApp). Single-App = isMultiAppMode=false + applications.length===1.
        this.isMultiAppMode = false;
        this.applications = []; // Array von ApplicationInstance
        this.currentAppIndex = 0;
        this.aggregatedResults = null; // Portfolio-Analyse-Ergebnisse

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
            mode: 'classic',         // 'cloud_native' = Cloud-native/PaaS, 'classic' = VM-basiert
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

        // Always-Portfolio: starte mit genau 1 ApplicationInstance, currentAppIndex=0.
        // Single-App-Modus = isMultiAppMode=false + applications.length===1.
        if (this.applications.length === 0) {
            this.applications.push(new ApplicationInstance(null, 'Anwendung'));
        }
        this.currentAppIndex = 0;

        this.init();
    }

    /**
     * Liefert die aktuell aktive ApplicationInstance.
     * Im Always-Portfolio-Modell ist dies sowohl im Single- als auch im
     * Multi-App-Modus die Single Source of Truth für State.
     */
    get currentApp() {
        return this.applications[this.currentAppIndex] ?? null;
    }

    init() {
        this.loadSettings(); // Lade gespeicherte Einstellungen
        this.loadSessionState(); // Lade Session-State (bei F5)
        this.bindEvents();
        this.initAuditModeToggle();
        this.updateStepDisplay(); // Erst Step Display setzen
        this.initTooltipSystem();
        // renderComponents() wird erst bei Step 2 aufgerufen
    }

    /**
     * Initialisiert den BSI-C3A Audit-Strenge-Toggle (C1 = EU, C2 = Deutschland).
     * Bei Mode-Wechsel wird die laufende Analyse neu gerechnet.
     */
    initAuditModeToggle() {
        const container = document.getElementById('auditModeToggle');
        if (!container) return;
        const buttons = container.querySelectorAll('.audit-mode-btn');
        const currentMode = getAuditMode();

        // Initialen Zustand setzen (aus localStorage)
        buttons.forEach(btn => {
            const isActive = btn.dataset.mode === currentMode;
            btn.classList.toggle('is-active', isActive);
            btn.setAttribute('aria-checked', isActive ? 'true' : 'false');
        });

        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                const mode = btn.dataset.mode;
                if (!setAuditMode(mode)) return;
                buttons.forEach(b => {
                    const active = b.dataset.mode === mode;
                    b.classList.toggle('is-active', active);
                    b.setAttribute('aria-checked', active ? 'true' : 'false');
                });
                track('audit-mode', { mode });
                // Falls Analyse bereits gelaufen ist, neu rechnen mit neuem Mode
                if (this.currentStep === 3) {
                    if (this.isMultiAppMode) {
                        this.runMultiAppAnalysis();
                    } else if (this.currentApp.applicationData || this.currentApp.selectedComponents.size > 0) {
                        this.runAnalysis();
                    }
                }
            });
        });
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
        this.bindSearchEvents();
        this.bindQuickSuggestionEvents();
        this.bindUIEvents();
        this.bindMultiAppEvents();
    }

    bindSearchEvents() {
        const searchBtn = document.getElementById('searchBtn');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => this.searchApplication());
        }

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

        document.addEventListener('click', (e) => {
            const dropdown = document.getElementById('appDropdown');
            const input = document.getElementById('appSearchInput');
            if (dropdown && input && !dropdown.contains(e.target) && e.target !== input) {
                this.hideAppDropdown();
            }
        });
    }

    bindQuickSuggestionEvents() {
        document.querySelectorAll('.quick-suggestion').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const app = e.target.dataset.app;

                // Neuer App-Start → State vollständig zurücksetzen
                if (app) this.hardReset();

                if (app === 'custom') {
                    this.currentApp.applicationData = null;
                    document.getElementById('researchResult').style.display = 'none';
                    document.getElementById('appSearchInput').value = 'Benutzerdefinierte Anwendung';
                    this.nextStep();
                } else if (app) {
                    const knownApp = knownApplications[app];
                    if (knownApp) {
                        document.getElementById('appSearchInput').value = knownApp.name;
                        this.currentApp.applicationData = knownApp;
                        this.currentApp.selectedComponents.clear();
                        knownApp.components.forEach(c => this.currentApp.selectedComponents.add(c));
                        if (knownApp.systemRequirements) {
                            const defaultSize = knownApp.systemRequirements[this.currentApp.sizing]
                                ? this.currentApp.sizing
                                : (knownApp.systemRequirements.medium ? 'medium' :
                                   knownApp.systemRequirements.small ? 'small' : 'large');
                            this.currentApp.sizing = defaultSize;
                            this.currentApp.systemConfig = {
                                sizing: defaultSize,
                                config: knownApp.systemRequirements[defaultSize],
                                application: knownApp.name
                            };
                            try { this.initComponentConfigsFromSystemRequirements(); } catch (e) {}
                        }
                        // Snapshot vor Transformation speichern, empfohlenen Modus setzen
                        this.currentApp._archOriginal = {
                            selectedComponents: new Set(this.currentApp.selectedComponents),
                            componentConfigs: JSON.parse(JSON.stringify(this.currentApp.componentConfigs))
                        };
                        this.currentApp._archDelta = { added: new Set(), removed: new Set(), configs: {} };
                        this.architectureSettings.mode = knownApp.recommendedArchitecture || 'classic';
                        if (typeof this.applyArchitectureModeToComponents === 'function') {
                            this.applyArchitectureModeToComponents();
                        }
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
                        document.getElementById('appSearchInput').value = app;
                        this.searchApplication();
                    }
                }
            });
        });
    }

    bindUIEvents() {
        // Navigation
        document.getElementById('prevBtn')?.addEventListener('click', () => this.prevStep());
        document.getElementById('skipToManual')?.addEventListener('click', () => {
            this.currentApp.applicationData = null;
            document.getElementById('researchResult').style.display = 'none';
            this.nextStep();
        });
        document.querySelectorAll('.wizard-step').forEach((step) => {
            step.style.cursor = 'pointer';
            step.addEventListener('click', () => {
                const targetStep = parseInt(step.dataset.step);
                if (targetStep && targetStep !== this.currentStep) {
                    this.goToStep(targetStep);
                }
            });
        });

        // Settings
        document.getElementById('settingsBtn')?.addEventListener('click', () => this.openSettings());
        document.getElementById('closeSettingsBtn')?.addEventListener('click', () => this.closeSettings());
        document.getElementById('settingsOverlay')?.addEventListener('click', (e) => {
            if (e.target.id === 'settingsOverlay') this.closeSettings();
        });
        document.querySelectorAll('.preset-card').forEach(card => {
            card.addEventListener('click', () => this.selectPreset(card.dataset.preset));
        });
        ['customControl', 'customPerformance', 'customAvailability', 'customCost'].forEach(id => {
            document.getElementById(id)?.addEventListener('input', () => this.updateCustomWeights());
        });
        document.getElementById('toggleApiKeyBtn')?.addEventListener('click', () => this.toggleApiKeyVisibility());
        document.getElementById('apiKeyInput')?.addEventListener('input', (e) => this.validateApiKey(e.target.value));
        document.getElementById('maturityEnabled')?.addEventListener('change', () => this.updateMaturitySettings());
        document.getElementById('previewPenalty')?.addEventListener('input', () => this.updateMaturitySettings());
        document.getElementById('missingPenalty')?.addEventListener('input', () => this.updateMaturitySettings());
        document.getElementById('operationsEnabled')?.addEventListener('change', () => this.updateOperationsSettings());
        document.getElementById('projectEffortEnabled')?.addEventListener('change', () => this.updateProjectEffortSettings());

        // Detail Popup
        document.getElementById('detailPopupOverlay')?.addEventListener('click', (e) => {
            if (e.target.id === 'detailPopupOverlay') this.closeDetailPopup();
        });
    }

    bindMultiAppEvents() {
        document.getElementById('parseAppsBtn')?.addEventListener('click', () => {
            const input = document.getElementById('multiAppInput');
            if (input && input.value.trim()) {
                this.startMultiAppMode(input.value);
            }
        });

        document.getElementById('singleModeBtn')?.addEventListener('click', () => {
            this.isMultiAppMode = false;
            // Always Portfolio: in den Single-App-Modus mit genau 1 frischen ApplicationInstance
            this.applications = [new ApplicationInstance(null, 'Anwendung')];
            this.currentAppIndex = 0;
            this.aggregatedResults = null;
            track('app-mode', { mode: 'single' });
            document.getElementById('singleModeBtn').classList.add('active');
            document.getElementById('multiModeBtn').classList.remove('active');
            document.getElementById('singleAppInputMode').style.display = 'block';
            document.getElementById('multiAppInputMode').style.display = 'none';
            if (this.currentStep !== 0) this.goToStep(0);
        });

        document.getElementById('multiModeBtn')?.addEventListener('click', () => {
            this.isMultiAppMode = true;
            // analysisResults der aktuellen App zurücksetzen (Multi-App nutzt aggregatedResults)
            if (this.currentApp) this.currentApp.analysisResults = null;
            track('app-mode', { mode: 'multi' });
            document.getElementById('multiModeBtn').classList.add('active');
            document.getElementById('singleModeBtn').classList.remove('active');
            document.getElementById('singleAppInputMode').style.display = 'none';
            document.getElementById('multiAppInputMode').style.display = 'block';
            if (this.currentStep !== 0) this.goToStep(0);
        });

        document.querySelectorAll('[data-template]').forEach(btn => {
            btn.addEventListener('click', (e) => this.loadTemplate(e.target.dataset.template));
        });

        document.getElementById('prevAppBtn')?.addEventListener('click', () => this.goToPrevApp());
        document.getElementById('nextAppBtn')?.addEventListener('click', () => this.goToNextApp());

        document.querySelectorAll('.wizard-step').forEach(step => {
            step.addEventListener('click', () => {
                const stepNum = parseInt(step.dataset.step);
                if (stepNum < this.currentStep) this.goToStep(stepNum);
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
        const debouncedAnalysis = this.debounce(() => this.runActiveAnalysis(), 200);

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

        const query = input.value.trim();

        // Loading State
        searchBtn.classList.add('loading');
        searchBtn.disabled = true;

        try {
            const result = await this.researcher.research(query);

            // Track: was wird gesucht und ob es gefunden wurde
            track('search-app', {
                query: query,
                found: !!result.success,
                componentCount: result.success ? (result.application.components || []).length : 0
            });

            if (result.success) {
                this.currentApp.applicationData = result.application;

                // Komponenten vorauswählen
                this.currentApp.selectedComponents.clear();
                result.application.components.forEach(c => this.currentApp.selectedComponents.add(c));

                // System-Konfiguration mit Default-Sizing initialisieren
                if (result.application.systemRequirements) {
                    const defaultSize = result.application.systemRequirements[this.currentApp.sizing]
                        ? this.currentApp.sizing
                        : (result.application.systemRequirements.medium ? 'medium' :
                           result.application.systemRequirements.small ? 'small' : 'large');
                    this.currentApp.sizing = defaultSize;
                    this.currentApp.systemConfig = {
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
                // Snapshot vor Transformation speichern, empfohlenen Modus setzen
                this.currentApp._archOriginal = {
                    selectedComponents: new Set(this.currentApp.selectedComponents),
                    componentConfigs: JSON.parse(JSON.stringify(this.currentApp.componentConfigs))
                };
                this.currentApp._archDelta = { added: new Set(), removed: new Set(), configs: {} };
                this.architectureSettings.mode = result.application.recommendedArchitecture || 'classic';
                if (typeof this.applyArchitectureModeToComponents === 'function') {
                    this.applyArchitectureModeToComponents();
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
            const isActive = size === this.currentApp.sizing ? 'active' : '';
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
        const sizingDetailsHtml = this.renderSizingDetails(req[this.currentApp.sizing] || req[sizes[0]]);

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
    // Helper: generiert ein einzelnes sysreq-Item
    _sysreqItem(icon, label, value, extraHtml = '', wide = false) {
        return `
            <div class="sysreq-item${wide ? ' sysreq-item-wide' : ''}">
                <div class="sysreq-item-icon">${IconMapper.toFontAwesome(icon, 'component')}</div>
                <div class="sysreq-item-content">
                    <div class="sysreq-item-label">${label}</div>
                    <div class="sysreq-item-value">${value}</div>
                    ${extraHtml}
                </div>
            </div>
        `;
    }

    // Helper: Compute-Block (Multi-VM oder Standard)
    _renderSizingCompute(compute, sizeConfig) {
        const dbKeywords = ['mongodb', 'mysql', 'postgresql', 'postgres', 'redis', 'elasticsearch', 'cassandra', 'neo4j', 'couchdb'];
        const vmTypes = Object.entries(compute)
            .filter(([k, v]) => v && typeof v === 'object' && (v.cpu || v.ram) && !dbKeywords.some(db => k.toLowerCase().includes(db)))
            .map(([key, config]) => ({ key, config }));

        const icon = '💻';

        if (vmTypes.length > 0) {
            // Multi-VM-Struktur
            const details = vmTypes.map(({ key, config }) => {
                let nodeCount = config.nodes || config.count || 1;
                let haType = null;
                if (sizeConfig.ha) {
                    const ha = this.extractHAConfig(sizeConfig.ha);
                    if (ha && ha.nodeCount > 1 && !ha.hasMultipleRoles) { nodeCount = ha.nodeCount; haType = ha.haType; }
                }
                const spec = `${config.cpu || '-'} vCPU / ${config.ram || '-'} GB RAM${nodeCount > 1 ? ` (${nodeCount} Nodes${haType ? ` - ${haType}` : ''})` : ''}`;
                return `<div class="sysreq-item-detail"><strong>${this.formatVMTypeName(key)}:</strong> ${spec}</div>`;
            }).join('');
            return `<div class="sysreq-item"><div class="sysreq-item-icon">${IconMapper.toFontAwesome(icon, 'component')}</div><div class="sysreq-item-content"><div class="sysreq-item-label">Compute</div>${details}</div></div>`;
        }

        // Standard-Struktur
        let nodeInfo = compute.nodes > 1 ? `<div class="sysreq-item-detail">Nodes: ${compute.nodes}</div>` : '';
        if (sizeConfig.ha) {
            const ha = this.extractHAConfig(sizeConfig.ha);
            if (ha && ha.nodeCount > 1) nodeInfo = `<div class="sysreq-item-detail">${ha.nodeCount} Nodes${ha.haType ? ` (${ha.haType})` : ''}</div>`;
        }
        const extra = `${compute.workers ? `<div class="sysreq-item-detail">Workers: ${compute.workers}</div>` : ''}${nodeInfo}`;
        return this._sysreqItem(icon, 'Compute', `${compute.cpu || '-'} vCPU / ${compute.ram || '-'} GB RAM`, extra);
    }

    renderSizingDetails(sizeConfig) {
        if (!sizeConfig) return '<p>Keine Details verfügbar.</p>';

        const parts = [];

        if (sizeConfig.compute) {
            parts.push(this._renderSizingCompute(sizeConfig.compute, sizeConfig));
        }

        if (sizeConfig.database) {
            const db = sizeConfig.database;
            const haInfo = (sizeConfig.compute?.sql?.nodes > 1) ? `<div class="sysreq-item-detail">Nodes: ${sizeConfig.compute.sql.nodes} (HA)</div>` : '';
            const note  = db.note ? `<div class="sysreq-item-detail">${db.note}</div>` : '';
            parts.push(this._sysreqItem('🗄️', 'Datenbank', db.type || '-',
                `<div class="sysreq-item-detail">Größe: ${db.size || '-'}</div>${haInfo}${note}`));
        }

        if (sizeConfig.storage) {
            parts.push(this._sysreqItem('💾', 'Storage', sizeConfig.storage.type || '-',
                `<div class="sysreq-item-detail">Größe: ${sizeConfig.storage.size || '-'}</div>`));
        }

        if (sizeConfig.os?.length)      parts.push(this._sysreqItem('🖥️', 'Betriebssystem', sizeConfig.os.join(', ')));
        if (sizeConfig.php)             parts.push(this._sysreqItem('🐘', 'PHP', sizeConfig.php,
            sizeConfig.phpMemory ? `<div class="sysreq-item-detail">Memory: ${sizeConfig.phpMemory}</div>` : ''));
        if (sizeConfig.webServer)       parts.push(this._sysreqItem('🌐', 'Web Server', sizeConfig.webServer));
        if (sizeConfig.cache)           parts.push(this._sysreqItem('⚡', 'Cache', sizeConfig.cache));
        if (sizeConfig.queue)           parts.push(this._sysreqItem('📨', 'Message Queue', sizeConfig.queue));
        if (sizeConfig.search)          parts.push(this._sysreqItem('🔍', 'Suche', sizeConfig.search));
        if (sizeConfig.architecture)    parts.push(this._sysreqItem('🏗️', 'Architektur', sizeConfig.architecture, '', true));
        if (sizeConfig.dags)            parts.push(this._sysreqItem('📊', 'DAGs', sizeConfig.dags));
        if (sizeConfig.python)          parts.push(this._sysreqItem('🐍', 'Python', sizeConfig.python));
        if (sizeConfig.executor)        parts.push(this._sysreqItem('⚙️', 'Executor', sizeConfig.executor));
        if (sizeConfig.redis)           parts.push(this._sysreqItem('⚡', 'Redis', sizeConfig.redis));

        return `<div class="sysreq-grid">${parts.join('')}</div>`;
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
        this.currentApp.sizing = size;

        // Tab-Buttons aktualisieren
        document.querySelectorAll('.sizing-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.size === size);
        });

        // Details aktualisieren
        if (this.currentApp.applicationData && this.currentApp.applicationData.systemRequirements) {
            const detailsContainer = document.getElementById('sizingDetails');
            if (detailsContainer) {
                const sizeConfig = this.currentApp.applicationData.systemRequirements[size];
                detailsContainer.innerHTML = this.renderSizingDetails(sizeConfig);
            }

            // System-Konfiguration speichern
            this.currentApp.systemConfig = {
                sizing: size,
                config: this.currentApp.applicationData.systemRequirements[size],
                application: this.currentApp.applicationData.name
            };

            // Bestehende Komponenten-Konfigurationen zurücksetzen (außer manuell konfigurierte)
            // Nur automatisch generierte Instanzen (compute-2, database_sql-2, etc.) entfernen
            const autoGeneratedKeys = Object.keys(this.currentApp.componentConfigs).filter(key =>
                key.match(/-(2|3|4|5)$/)
            );
            autoGeneratedKeys.forEach(key => {
                this.currentApp.selectedComponents.delete(key);
                delete this.currentApp.componentConfigs[key];
            });

            // Komponenten-Konfigurationen aus System-Requirements aktualisieren
            this.initComponentConfigsFromSystemRequirements();

            // Snapshot nach Sizing-Änderung erneuern (Modus beibehalten)
            this.currentApp._archOriginal = {
                selectedComponents: new Set(this.currentApp.selectedComponents),
                componentConfigs: JSON.parse(JSON.stringify(this.currentApp.componentConfigs))
            };
            this.currentApp._archDelta = { added: new Set(), removed: new Set(), configs: {} };
            if (typeof this.applyArchitectureModeToComponents === 'function') {
                this.applyArchitectureModeToComponents();
            }
        }
    }

    /**
     * Rendert eine kompakte Zusammenfassung der System-Konfiguration für die Analyse-Ansicht
     */
    renderSystemConfigSummary() {
        if (!this.currentApp.systemConfig || !this.currentApp.systemConfig.config) {
            return '';
        }

        const config = this.currentApp.systemConfig.config;
        const sizeLabels = { small: 'Klein', medium: 'Mittel', large: 'Groß' };
        const sizingLabel = sizeLabels[this.currentApp.systemConfig.sizing] || this.currentApp.systemConfig.sizing;

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
            this.currentApp.applicationData = null;
            this.currentApp.systemConfig = null;
            this.currentApp.selectedComponents.clear();
            this.currentApp.componentConfigs = {};
            this.currentApp.sizing = 'medium';
        }

        // Step 3 nur erlauben wenn Komponenten ausgewählt
        if (targetStep === 3) {
            if (this.isMultiAppMode) {
                const allAppsHaveComponents = this.applications.every(app => app.selectedComponents.size > 0);
                if (!allAppsHaveComponents) {
                    alert('Bitte wählen Sie für alle Anwendungen Komponenten aus.');
                    return;
                }
            } else if (this.currentApp.selectedComponents.size === 0) {
                alert('Bitte wählen Sie zuerst Komponenten aus.');
                return;
            }
        }

        this.currentStep = targetStep;
        this.updateStepDisplay();

        // Track: Schritt-Wechsel im Funnel
        track('step-change', {
            step: targetStep,
            mode: this.isMultiAppMode ? 'multi' : 'single'
        });

        // Session-State speichern nach Schritt-Wechsel
        this.saveSessionState();

        if (this.currentStep === 2) {
            this.renderComponents();
            this.updateSelectedSummary();
            // ComponentConfigs werden beim Rendern automatisch angezeigt
        } else if (this.currentStep === 3) {
            // Multi-App vs. Single-App Analyse via einheitlichen Dispatcher
            this.runActiveAnalysis();
            // Nach oben scrollen zur Analyse
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
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
                    nextBtn.disabled = this.currentApp.selectedComponents.size === 0;
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

    /**
     * Setzt selectedComponents + componentConfigs auf den Zustand vor der Arch-Transformation zurück.
     * Öffentlich – wird vom Reset-Button per onclick="app.resetArchitectureMode()" aufgerufen.
     */
    resetArchitectureMode() {
        if (!this.currentApp._archOriginal) return;
        this.currentApp.selectedComponents = new Set(this.currentApp._archOriginal.selectedComponents);
        this.currentApp.componentConfigs   = JSON.parse(JSON.stringify(this.currentApp._archOriginal.componentConfigs));
        this.currentApp._archDelta = { added: new Set(), removed: new Set(), configs: {} };
        this.architectureSettings.mode = this.currentApp.applicationData?.recommendedArchitecture || 'classic';
        this.updateSystemConfigFromComponents();
        this.renderComponents();
        if (this.currentApp.analysisResults) this.runAnalysis();
    }

    /**
     * Re-Analyse für den aktuellen Modus. Single dispatching helper, der die
     * Modus-Entscheidung kapselt: Multi-App → Portfolio-Analyse, Single → klassische
     * Einzel-Analyse. Wird von Settings/Slider/Step-Wechsel aufgerufen, damit das
     * `if (isMultiAppMode) { runMultiAppAnalysis() } else { runAnalysis() }`-Pattern
     * nicht überall wiederholt werden muss.
     */
    runActiveAnalysis() {
        if (this.isMultiAppMode) {
            this.runMultiAppAnalysis();
        } else {
            this.runAnalysis();
        }
    }

    runAnalysis() {
        const componentIds = Array.from(this.currentApp.selectedComponents);

        // Sicherstellen, dass systemConfig die aktuellen Komponenten-Konfigurationen widerspiegelt
        this.updateSystemConfigFromComponents();

        // App-ID für Pattern-Erkennung ermitteln
        const appId = this.currentApp.applicationData
            ? Object.keys(knownApplications).find(k => knownApplications[k].name === this.currentApp.applicationData.name)
            : null;

        // Architektur-Einstellungen vorbereiten
        const archSettings = {
            mode: this.architectureSettings.mode, // null = Auto, 'cloud_native' oder 'classic'
            appId: appId,
            sizing: this.currentApp.sizing || 'medium'
        };

        // Neue 4-Gewichte-API verwenden, mit systemConfig für realistische Kostenberechnung
        // maturitySettings für konfigurierbaren Reife-Faktor übergeben
        // architectureSettings für Cloud-native vs. Klassisch
        this.currentApp.analysisResults = this.analyzer.analyzeForComponents(
            componentIds,
            this.weights,
            this.currentApp.systemConfig,
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
        const multiAnalyzer = new PortfolioAnalyzer(cloudProviders, architectureComponents);
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
}

// ── Module-Methoden via Prototype-Mixin einbinden (kein .call(this) nötig) ──
Object.assign(SovereignArchitectureAdvisor.prototype, SAAState);
Object.assign(SovereignArchitectureAdvisor.prototype, SAAComponents);
Object.assign(SovereignArchitectureAdvisor.prototype, SAAResults);
Object.assign(SovereignArchitectureAdvisor.prototype, SAASettings);
Object.assign(SovereignArchitectureAdvisor.prototype, SAAMultiApp);
Object.assign(SovereignArchitectureAdvisor.prototype, SAAPdf);

// App global verfügbar machen (für HTML onclick-Handler)
document.addEventListener('DOMContentLoaded', () => {
    window.app = new SovereignArchitectureAdvisor();
});
