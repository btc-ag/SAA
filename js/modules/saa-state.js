// SAAState Module
// Verantwortlich für: Session-Persistenz, Settings laden/speichern, Reset

import { ApplicationInstance } from './application-instance.js';

/**
 * Migriert Legacy-Session-State (vor „Always Portfolio") in das neue Schema.
 *
 * Legacy-Form (vor v4.1.0): bei `isMultiAppMode === false` lagen
 * selectedComponents, componentConfigs, applicationData, analysisResults,
 * selectedSizing, systemConfig als Properties direkt am State-Top-Level.
 *
 * Neue Form: state.applications ist immer befüllt (mind. 1 Element),
 * state.currentAppIndex zeigt auf die aktuelle Instanz. Single-App =
 * applications.length === 1 + isMultiAppMode === false.
 *
 * @param {Object} state - der rohe deserialisierte Session-State
 * @returns {Object} migrierter State
 */
function migrateLegacySessionState(state) {
    if (!state) return state;

    const hasLegacySingle = state.selectedComponents !== undefined
                         || state.componentConfigs !== undefined
                         || state.applicationData !== undefined
                         || state.analysisResults !== undefined;
    const hasNewApplications = Array.isArray(state.applications) && state.applications.length > 0;

    if (!hasLegacySingle || hasNewApplications) return state;

    // Legacy → neue Struktur: ApplicationInstance.fromCurrentState wandelt um
    const instance = ApplicationInstance.fromCurrentState({
        selectedComponents: state.selectedComponents || [],
        componentConfigs: state.componentConfigs || {},
        componentInstances: state.componentInstances || {},
        applicationData: state.applicationData || null,
        analysisResults: state.analysisResults || null,
        selectedSizing: state.selectedSizing || 'medium',
        systemConfig: state.systemConfig || null
    });

    return {
        currentStep: state.currentStep,
        isMultiAppMode: false,
        applications: [instance],
        currentAppIndex: 0,
        aggregatedResults: null
    };
}

export { migrateLegacySessionState };

export const SAAState = {

    loadSessionState() {
        try {
            const stored = sessionStorage.getItem('saa_session_state');
            if (!stored) return;

            let state = JSON.parse(stored);
            state = migrateLegacySessionState(state);

            // Restore Top-Level
            this.currentStep = state.currentStep || 0;
            this.isMultiAppMode = state.isMultiAppMode || false;

            // Applications immer wiederherstellen (Always Portfolio)
            if (Array.isArray(state.applications) && state.applications.length > 0) {
                this.applications = state.applications.map(app => {
                    // selectedComponents als Set wiederherstellen
                    if (Array.isArray(app.selectedComponents)) {
                        app.selectedComponents = new Set(app.selectedComponents);
                    } else if (app.selectedComponents && typeof app.selectedComponents === 'object' && !(app.selectedComponents instanceof Set)) {
                        app.selectedComponents = new Set(Object.values(app.selectedComponents));
                    } else if (!(app.selectedComponents instanceof Set)) {
                        app.selectedComponents = new Set();
                    }
                    // componentInstances als Plain-Object sicherstellen
                    if (!app.componentInstances || typeof app.componentInstances !== 'object') {
                        app.componentInstances = {};
                    }
                    return app;
                });
                this.currentAppIndex = state.currentAppIndex ?? 0;
            }

            this.aggregatedResults = state.aggregatedResults || null;

            console.log('Session-State wiederhergestellt:', state);

            // Custom Scores neu laden (falls sie in der Zwischenzeit geändert wurden)
            this.analyzer.customScores = this.analyzer.loadCustomScores();

            // UI entsprechend aktualisieren
            if (this.currentStep === 2) {
                setTimeout(() => {
                    this.renderComponents();
                    this.updateSelectedSummary();
                }, 100);
            } else if (this.currentStep === 3) {
                setTimeout(() => {
                    if (this.isMultiAppMode && this.applications.length > 0) {
                        this.runMultiAppAnalysis();
                    } else if (this.applications[0]?.selectedComponents?.size > 0) {
                        this.runAnalysis();
                    }
                }, 100);
            }
        } catch (e) {
            console.error('Fehler beim Laden des Session-State:', e);
        }
    },

    saveSessionState() {
        try {
            // State lebt seit Phase 4c ausschließlich auf this.applications[i].
            // componentInstances wird je App in der ApplicationInstance gehalten
            // und wird beim Spread automatisch mitserialisiert.
            const state = {
                currentStep: this.currentStep,
                isMultiAppMode: this.isMultiAppMode,
                applications: this.applications.map(app => ({
                    ...app,
                    selectedComponents: Array.from(app.selectedComponents || [])
                })),
                currentAppIndex: this.currentAppIndex,
                aggregatedResults: this.aggregatedResults || null
            };

            sessionStorage.setItem('saa_session_state', JSON.stringify(state));
        } catch (e) {
            console.error('Fehler beim Speichern des Session-State:', e);
        }
    },

    loadSettings() {
        try {
            const stored = localStorage.getItem('saa_algorithm_settings');
            if (stored) {
                const settings = JSON.parse(stored);

                if (settings.weights) {
                    this.weights = settings.weights;
                }
                if (settings.selectedPreset) {
                    this.selectedPreset = settings.selectedPreset;
                }
                if (settings.maturitySettings) {
                    this.maturitySettings = settings.maturitySettings;
                }
                if (settings.operationsSettings) {
                    this.operationsSettings = settings.operationsSettings;
                }
                if (settings.projectEffortSettings) {
                    this.projectEffortSettings = settings.projectEffortSettings;
                }

                console.log('Algorithmus-Einstellungen geladen:', settings);
            }
        } catch (e) {
            console.error('Fehler beim Laden der Einstellungen:', e);
        }
    },

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
    },

    reset() {
        this.currentStep = 0;
        this.strategyWeight = 50;
        // Frische ApplicationInstance statt Property-Resets
        this.applications = [new ApplicationInstance(null, 'Anwendung')];
        this.currentAppIndex = 0;
        this.aggregatedResults = null;
        this.isMultiAppMode = false;

        const searchInput = document.getElementById('appSearchInput');
        if (searchInput) searchInput.value = '';
        const research = document.getElementById('researchResult');
        if (research) research.style.display = 'none';

        this.updateStepDisplay();
    },

    hardReset() {
        sessionStorage.removeItem('saa_session_state');
        this.reset();
    }

};
