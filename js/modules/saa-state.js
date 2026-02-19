// SAAState Module
// Verantwortlich für: Session-Persistenz, Settings laden/speichern, Reset

export const SAAState = {

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
                        if (app.selectedComponents) {
                            if (app.selectedComponents instanceof Set) {
                                // Bereits ein Set - nichts tun
                            } else if (Array.isArray(app.selectedComponents)) {
                                app.selectedComponents = new Set(app.selectedComponents);
                            } else if (typeof app.selectedComponents === 'object') {
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
                    setTimeout(() => {
                        this.renderComponents();
                        this.updateSelectedSummary();
                    }, 100);
                } else if (this.currentStep === 3) {
                    setTimeout(() => {
                        if (this.isMultiAppMode && this.applications.length > 0) {
                            this.runMultiAppAnalysis();
                        } else if (this._selectedComponents && this._selectedComponents.size > 0) {
                            this.runAnalysis();
                        }
                    }, 100);
                }
            }
        } catch (e) {
            console.error('Fehler beim Laden des Session-State:', e);
        }
    },

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
    },

    hardReset() {
        sessionStorage.removeItem('saa_session_state');
        this.reset();
    }

};
