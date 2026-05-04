/**
 * ApplicationInstance — Repräsentiert eine einzelne Anwendung im
 * Portfolio (Multi-App-Modus). Hält Komponenten-Auswahl, Konfigurationen,
 * Architektur-Snapshot/Delta und Analyse-Ergebnisse.
 *
 * Im neuen „Always Portfolio"-Modell (ab Phase 4) hat auch Single-App
 * genau 1 ApplicationInstance.
 *
 * Architektur-Snapshot/Delta sind als private Felder (#archOriginal/#archDelta)
 * gekapselt. Konsumenten interagieren ausschließlich über die Methoden-API:
 *   - snapshotArchitecture()
 *   - resetArchitecture()
 *   - applyArchitectureDelta(transform)
 *   - recordArchitectureChange(componentId, action, config?)
 *   - hasArchitectureSnapshot()
 *   - getArchitectureSnapshot()  (Read-Only-Kopie für Pattern-Erkennung)
 *
 * @module modules/application-instance
 */

import { knownApplications } from '../saa-apps-data.js';

/**
 * ApplicationInstance - Repräsentiert eine einzelne Anwendung im Portfolio
 */
class ApplicationInstance {
    // Private Felder (nicht von außen direkt zugreifbar)
    #archOriginal = null;
    #archDelta = { added: new Set(), removed: new Set(), configs: {} };

    constructor(id, name, type = null, sizing = 'medium') {
        this.id = id || this.generateUUID();
        this.name = name;
        this.type = type; // knownApplications key oder null
        this.sizing = sizing; // 'small' | 'medium' | 'large'
        this.selectedComponents = new Set();
        this.componentConfigs = {};
        this.componentInstances = {};
        this.systemConfig = null;
        this.applicationData = null; // Referenz auf knownApplications
        this.analysisResults = null;
        this.isCustom = type === null;
        this.architectureMode = 'classic'; // 'cloud_native' | 'classic'
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
        instance.componentInstances = currentState.componentInstances ? { ...currentState.componentInstances } : {};
        instance.systemConfig = currentState.systemConfig ? { ...currentState.systemConfig } : null;
        instance.applicationData = currentState.applicationData;
        instance.analysisResults = currentState.analysisResults;
        // Legacy-Migration: falls alter State noch _archOriginal/_archDelta enthält
        if (currentState._archOriginal) {
            instance._restoreSnapshotForMigration(currentState._archOriginal, currentState._archDelta);
        }
        return instance;
    }

    /**
     * Speichert den aktuellen Komponenten/Config-Stand als Snapshot.
     * Wird vor einer Architektur-Transformation aufgerufen.
     * Resetet das Delta auf leer.
     */
    snapshotArchitecture() {
        this.#archOriginal = {
            selectedComponents: new Set(this.selectedComponents),
            componentConfigs: structuredClone(this.componentConfigs)
        };
        this.#archDelta = { added: new Set(), removed: new Set(), configs: {} };
    }

    /**
     * Stellt den Snapshot wieder her und verwirft Delta.
     * Wird beim Reset-Button benutzt.
     */
    resetArchitecture() {
        if (!this.#archOriginal) return;
        this.selectedComponents = new Set(this.#archOriginal.selectedComponents);
        this.componentConfigs = structuredClone(this.#archOriginal.componentConfigs);
        this.#archDelta = { added: new Set(), removed: new Set(), configs: {} };
    }

    /**
     * Registriert eine User-Änderung an Komponenten oder Config als Delta.
     * Wird aufgerufen, wenn User nach einem Architektur-Wechsel manuelle Anpassungen macht.
     * Wenn kein Snapshot existiert, ist die Operation ein No-Op.
     *
     * @param {string} componentId
     * @param {'add' | 'remove' | 'config'} action
     * @param {Object} [config] - Field-Map bei action='config' (z.B. {fieldId: value})
     */
    recordArchitectureChange(componentId, action, config = null) {
        if (!this.#archOriginal) return;
        if (action === 'add') {
            this.#archDelta.removed.delete(componentId);
            if (!this.#archOriginal.selectedComponents.has(componentId)) {
                this.#archDelta.added.add(componentId);
            }
        } else if (action === 'remove') {
            this.#archDelta.added.delete(componentId);
            if (this.#archOriginal.selectedComponents.has(componentId)) {
                this.#archDelta.removed.add(componentId);
            }
        } else if (action === 'config' && config) {
            if (!this.#archDelta.configs[componentId]) {
                this.#archDelta.configs[componentId] = {};
            }
            Object.assign(this.#archDelta.configs[componentId], config);
        }
    }

    /**
     * Wendet eine Architektur-Transformation auf die Snapshot-Basis an.
     * Snapshot bleibt unverändert; das User-Delta (added/removed/configs) wird
     * nach der Transformation re-appliziert.
     *
     * Wenn noch kein Snapshot existiert, wird vorher implizit einer erstellt.
     *
     * @param {Function} transform
     *   Funktion (originalComponents: Set, originalConfigs: Object) => { components: Set, configs: Object }.
     *   Erhält Defensiv-Kopien des Snapshots; muss neue Set/Object zurückgeben.
     */
    applyArchitectureDelta(transform) {
        if (!this.#archOriginal) this.snapshotArchitecture();
        const transformed = transform(
            new Set(this.#archOriginal.selectedComponents),
            structuredClone(this.#archOriginal.componentConfigs)
        );
        // Re-apply Delta on top of transformation
        const components = new Set(transformed.components);
        for (const c of this.#archDelta.added) components.add(c);
        for (const c of this.#archDelta.removed) components.delete(c);
        const configs = { ...transformed.configs };
        for (const [compId, fields] of Object.entries(this.#archDelta.configs)) {
            if (components.has(compId)) {
                configs[compId] = { ...(configs[compId] || {}), ...fields };
            }
        }
        this.selectedComponents = components;
        this.componentConfigs = configs;
    }

    /**
     * @returns {boolean} true wenn ein Snapshot existiert (Architektur-Transformation aktiv)
     */
    hasArchitectureSnapshot() {
        return this.#archOriginal !== null;
    }

    /**
     * Liefert eine Read-Only-Kopie des Snapshots, oder null wenn keiner existiert.
     * Wird von Konsumenten benötigt, die die Original-Komponenten für Pattern-Erkennung
     * o.ä. lesen müssen, ohne das Original zu mutieren.
     *
     * @returns {{ selectedComponents: Set<string>, componentConfigs: Object } | null}
     */
    getArchitectureSnapshot() {
        if (!this.#archOriginal) return null;
        return {
            selectedComponents: new Set(this.#archOriginal.selectedComponents),
            componentConfigs: structuredClone(this.#archOriginal.componentConfigs)
        };
    }

    /**
     * Internal: Migration eines Legacy-States, der noch `_archOriginal`/`_archDelta` als
     * raw fields enthielt. Wird ausschließlich von `fromCurrentState` aufgerufen.
     * @private
     */
    _restoreSnapshotForMigration(legacyOriginal, legacyDelta) {
        if (legacyOriginal && legacyOriginal.selectedComponents) {
            this.#archOriginal = {
                selectedComponents: legacyOriginal.selectedComponents instanceof Set
                    ? new Set(legacyOriginal.selectedComponents)
                    : new Set(legacyOriginal.selectedComponents || []),
                componentConfigs: structuredClone(legacyOriginal.componentConfigs || {})
            };
        }
        if (legacyDelta) {
            this.#archDelta = {
                added: legacyDelta.added instanceof Set ? new Set(legacyDelta.added) : new Set(legacyDelta.added || []),
                removed: legacyDelta.removed instanceof Set ? new Set(legacyDelta.removed) : new Set(legacyDelta.removed || []),
                configs: legacyDelta.configs ? structuredClone(legacyDelta.configs) : {}
            };
        }
    }
}

export { ApplicationInstance };
