/**
 * ApplicationInstance — Repräsentiert eine einzelne Anwendung im
 * Portfolio (Multi-App-Modus). Hält Komponenten-Auswahl, Konfigurationen,
 * Architektur-Snapshot/Delta und Analyse-Ergebnisse.
 *
 * Im neuen „Always Portfolio"-Modell (ab Phase 4) hat auch Single-App
 * genau 1 ApplicationInstance.
 *
 * @module modules/application-instance
 */

import { knownApplications } from '../saa-apps-data.js';

/**
 * ApplicationInstance - Repräsentiert eine einzelne Anwendung im Portfolio
 */
class ApplicationInstance {
    constructor(id, name, type = null, sizing = 'medium') {
        this.id = id || this.generateUUID();
        this.name = name;
        this.type = type; // knownApplications key oder null
        this.sizing = sizing; // 'small' | 'medium' | 'large'
        this.selectedComponents = new Set();
        this.componentConfigs = {};
        this.systemConfig = null;
        this.applicationData = null; // Referenz auf knownApplications
        this.analysisResults = null;
        this.isCustom = type === null;
        this.architectureMode = 'classic'; // 'cloud_native' | 'classic'
        // Architektur-Snapshot & Delta (pro App im Multi-App-Modus)
        this._archOriginal = null;
        this._archDelta = { added: new Set(), removed: new Set(), configs: {} };
    }

    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    // Migration von Single-App State
    static fromCurrentState(currentState) {
        const instance = new ApplicationInstance(
            null,
            currentState.applicationData?.name || 'Anwendung 1',
            currentState.applicationData ? Object.keys(knownApplications).find(
                key => knownApplications[key].name === currentState.applicationData.name
            ) : null,
            currentState.selectedSizing || 'medium'
        );
        instance.selectedComponents = new Set(currentState.selectedComponents);
        instance.componentConfigs = { ...currentState.componentConfigs };
        instance.systemConfig = currentState.systemConfig ? { ...currentState.systemConfig } : null;
        instance.applicationData = currentState.applicationData;
        instance.analysisResults = currentState.analysisResults;
        return instance;
    }
}

export { ApplicationInstance };
