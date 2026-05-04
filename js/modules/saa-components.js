// SAAComponents Module
// Komponenten-Auswahl, Config-Panels, VM/DB/Storage-Konfiguration

import { architectureComponents } from '../saa-data.js';
import { detectDeploymentPattern } from './deployment-pattern.js';
import { knownApplications, componentCategories } from '../saa-apps-data.js';
import { IconMapper } from './saa-utils.js';

/**
 * Leitet cloud-native Komponenten dynamisch aus einer Basis-Menge ab.
 * Kein App-spezifisches Wissen nötig – nur musterbasierte Regeln.
 */
function inferCloudNativeComponents(base) {
    const result = new Set(base);
    const has = (id) => result.has(id);

    // Kubernetes-Apps: Managed K8s ist bereits cloud-native → keine Komponenten-Änderung
    if (has('kubernetes')) return result;

    // Explizit serverless: compute fällt weg, LB auch
    if (has('serverless')) {
        result.delete('compute');
        result.delete('loadbalancer');
        return result;
    }

    // Enterprise-Heuristik (rein komponentenbasiert, app-unabhängig):
    // Enterprise-Apps (SAP, Oracle etc.) nutzen Block- UND File-Storage,
    // haben aber KEINE Managed DB (die DB läuft auf eigener VM via Block-Storage).
    // Web-Apps/CMS (WordPress, Joomla) haben immer eine Managed DB.
    const isEnterprise = has('compute') && has('storage_block') && has('storage_file') &&
        !has('database_sql') && !has('database_nosql');

    if (has('compute') && !isEnterprise) {
        // Web-Apps, APIs, CMS etc.: compute → PaaS/Serverless, LB fällt weg
        result.delete('compute');
        result.add('serverless');
        result.delete('loadbalancer');
        return result;
    }

    // Enterprise / unbekannte Apps: nur Load Balancer entfernen, compute bleibt
    if (has('compute')) {
        result.delete('loadbalancer');
    }

    return result; // reine DB- oder Storage-Apps: unverändert
}

/**
 * Leitet klassische VM-Komponenten dynamisch aus einer Basis-Menge ab.
 */
function inferClassicComponents(base) {
    const result = new Set(base);

    // Serverless → VMs hinter Load Balancer
    if (result.has('serverless')) {
        result.delete('serverless');
        result.add('compute');
        if (!result.has('loadbalancer')) result.add('loadbalancer');
    }

    // Kubernetes → klassische VMs hinter Load Balancer (Self-managed)
    if (result.has('kubernetes')) {
        result.delete('kubernetes');
        result.add('compute');
        if (!result.has('loadbalancer')) result.add('loadbalancer');
    }

    return result;
}

export const SAAComponents = {
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
        const componentIds = Array.from(this.currentApp.selectedComponents).map(id => id.replace(/-\d+$/, ''));
        const appId = this.currentApp.applicationData ? Object.keys(knownApplications).find(k => knownApplications[k].name === this.currentApp.applicationData.name) : null;
        this.detectedPattern = detectDeploymentPattern(componentIds, appId);

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
                    ${this.currentApp._archOriginal ? `
                    <button onclick="app.resetArchitectureMode()" style="
                        display: flex;
                        align-items: center;
                        gap: 0.4rem;
                        padding: 0.5rem 0.9rem;
                        border: 2px solid var(--border-color);
                        border-radius: 8px;
                        cursor: pointer;
                        background: var(--surface-primary);
                        color: var(--text-secondary);
                        font-size: 0.85rem;
                        margin-left: auto;
                    " title="Zurück zur ursprünglichen Konfiguration">
                        <i class="fa-solid fa-rotate-left"></i> Zurücksetzen
                    </button>` : ''}
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
                            const instances = Array.from(this.currentApp.selectedComponents)
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
                this.architectureSettings.mode = e.target.value;
                this.applyArchitectureModeToComponents();
                this.renderComponents();
                if (this.currentApp.analysisResults) this.runAnalysis();
            });
        });
    },

    /**
     * Wendet den aktuellen Architektur-Modus auf selectedComponents + componentConfigs an.
     * Ausgangspunkt ist immer _archOriginal (Snapshot vor erster Transformation).
     * Manuelle Nutzer-Änderungen (_archDelta) werden on top erhalten.
     */
    applyArchitectureModeToComponents() {
        // Fallback: Snapshot erstellen falls noch nicht vorhanden
        if (!this.currentApp._archOriginal) {
            this.currentApp._archOriginal = {
                selectedComponents: new Set(this.currentApp.selectedComponents),
                componentConfigs: JSON.parse(JSON.stringify(this.currentApp.componentConfigs))
            };
        }

        const base = this.currentApp._archOriginal.selectedComponents;
        const mode = this.architectureSettings.mode || 'classic';

        // App-ID für Pattern-Erkennung
        const appId = this.currentApp.applicationData
            ? Object.keys(knownApplications).find(k => knownApplications[k].name === this.currentApp.applicationData.name)
            : null;

        // Pattern erkennen (basierend auf Original-Basis, nicht auf transformiertem Zustand)
        const baseIds = Array.from(base).map(id => id.replace(/-\d+$/, ''));
        const pattern = detectDeploymentPattern(baseIds, appId);

        // Transformation berechnen – dynamische Intelligenz statt statischer Daten
        let transformed;
        if (mode === 'cloud_native') {
            transformed = inferCloudNativeComponents(base);
        } else {
            transformed = inferClassicComponents(base);
        }

        // Delta anwenden (manuelle Nutzer-Änderungen bleiben erhalten)
        this.currentApp._archDelta.added.forEach(id => transformed.add(id));
        this.currentApp._archDelta.removed.forEach(id => transformed.delete(id));

        // Konsistenz-Cleanup: serverless und compute schließen sich aus
        if (mode === 'cloud_native' && transformed.has('serverless') && transformed.has('compute')) {
            transformed.delete('compute');
        }

        this.currentApp.selectedComponents = transformed;

        // Configs aktualisieren
        // Neue Komponenten (nicht in Originalstate): initialisieren
        for (const id of transformed) {
            const baseId = id.replace(/-\d+$/, '');
            if (!this.currentApp._archOriginal.componentConfigs[id] && !this.currentApp.componentConfigs[id]) {
                this.initComponentConfig(baseId === id ? id : baseId);
                // Falls es die base-ID ist, kopieren wir die Config unter der neuen ID
                if (baseId !== id && this.currentApp.componentConfigs[baseId]) {
                    this.currentApp.componentConfigs[id] = { ...this.currentApp.componentConfigs[baseId] };
                }
            }
        }
        // Entfernte Komponenten: Config-Key löschen (nur die, die nicht in _archOriginal waren)
        for (const id of Object.keys(this.currentApp.componentConfigs)) {
            if (!transformed.has(id) && !this.currentApp._archOriginal.componentConfigs[id]) {
                delete this.currentApp.componentConfigs[id];
            }
        }
        // Ursprüngliche Configs wiederherstellen (aus Snapshot)
        for (const [id, cfg] of Object.entries(this.currentApp._archOriginal.componentConfigs)) {
            if (transformed.has(id)) {
                this.currentApp.componentConfigs[id] = JSON.parse(JSON.stringify(cfg));
            }
        }
        // Delta-Configs anwenden
        for (const [compId, fields] of Object.entries(this.currentApp._archDelta.configs)) {
            if (transformed.has(compId) && this.currentApp.componentConfigs[compId]) {
                Object.assign(this.currentApp.componentConfigs[compId], fields);
            }
        }

        this.updateSystemConfigFromComponents();
        // Architektur-Modus in ApplicationInstance speichern (für multi-app analyzePortfolio)
        if (this.isMultiAppMode && this.applications[this.currentAppIndex]) {
            this.applications[this.currentAppIndex].architectureMode = mode;
        }
        this.saveSessionState();
    },

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
    },

    /**
     * Aktualisiert die Konfiguration einer Komponente
     */
    updateComponentConfig(componentId, fieldId, value) {
        if (!this.currentApp.componentConfigs[componentId]) {
            this.initComponentConfig(componentId);
        }

        // Wert parsen (Zahlen als Zahlen speichern)
        const component = architectureComponents.find(c => c.id === componentId);
        const field = component?.configFields?.find(f => f.id === fieldId);
        if (field?.type === 'number') {
            value = parseInt(value) || 0;
        }

        this.currentApp.componentConfigs[componentId][fieldId] = value;

        // Delta-Tracking: Config-Änderung nach Arch-Transformation merken
        if (this.currentApp._archOriginal) {
            if (!this.currentApp._archDelta.configs[componentId]) {
                this.currentApp._archDelta.configs[componentId] = {};
            }
            this.currentApp._archDelta.configs[componentId][fieldId] = value;
        }

        // Summary aktualisieren
        this.updateComponentConfigSummary(componentId);

        // systemConfig aktualisieren für TCO-Berechnung
        this.updateSystemConfigFromComponents();
    },

    /**
     * Aktualisiert ein einzelnes VM-Feld in einer VM-Group
     */
    updateVMGroupField(input) {
        const componentId = input.dataset.component;
        const fieldId = input.dataset.field;
        const vmIndex = parseInt(input.dataset.vmIndex);
        const vmField = input.dataset.vmField;

        if (!this.currentApp.componentConfigs[componentId]) {
            this.initComponentConfig(componentId);
        }

        if (!Array.isArray(this.currentApp.componentConfigs[componentId][fieldId])) {
            this.currentApp.componentConfigs[componentId][fieldId] = [{ name: 'VM', cpu: 4, ram: 16, count: 1 }];
        }

        const vmGroups = this.currentApp.componentConfigs[componentId][fieldId];
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
    },

    /**
     * Fügt eine neue VM zu einer VM-Group hinzu
     */
    addVMToGroup(componentId, fieldId) {
        if (!this.currentApp.componentConfigs[componentId]) {
            this.initComponentConfig(componentId);
        }

        if (!Array.isArray(this.currentApp.componentConfigs[componentId][fieldId])) {
            this.currentApp.componentConfigs[componentId][fieldId] = [];
        }

        const vmGroups = this.currentApp.componentConfigs[componentId][fieldId];
        vmGroups.push({ name: `VM ${vmGroups.length + 1}`, cpu: 4, ram: 16, count: 1 });

        // Komponente neu rendern
        const component = architectureComponents.find(c => c.id === componentId);
        if (component) {
            this.updateComponentCard(component);
        }
    },

    /**
     * Entfernt eine VM aus einer VM-Group
     */
    removeVMFromGroup(componentId, fieldId, vmIndex) {
        if (!this.currentApp.componentConfigs[componentId]) return;

        const vmGroups = this.currentApp.componentConfigs[componentId][fieldId];
        if (!Array.isArray(vmGroups) || vmGroups.length <= 1) return;

        vmGroups.splice(vmIndex, 1);

        // Komponente neu rendern
        const component = architectureComponents.find(c => c.id === componentId);
        if (component) {
            this.updateComponentCard(component);
        }
    },

    /**
     * Aktualisiert ein einzelnes DB-Feld in einer DB-Group
     */
    updateDBGroupField(input) {
        const componentId = input.dataset.component;
        const fieldId = input.dataset.field;
        const dbIndex = parseInt(input.dataset.dbIndex);
        const dbField = input.dataset.dbField;

        if (!this.currentApp.componentConfigs[componentId]) {
            this.initComponentConfig(componentId);
        }

        if (!Array.isArray(this.currentApp.componentConfigs[componentId][fieldId])) {
            this.currentApp.componentConfigs[componentId][fieldId] = [{ name: 'DB', type: 'PostgreSQL', size: 100 }];
        }

        const databases = this.currentApp.componentConfigs[componentId][fieldId];
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
    },

    /**
     * Fügt eine neue Datenbank zu einer DB-Group hinzu
     */
    addDBToGroup(componentId, fieldId) {
        if (!this.currentApp.componentConfigs[componentId]) {
            this.initComponentConfig(componentId);
        }

        if (!Array.isArray(this.currentApp.componentConfigs[componentId][fieldId])) {
            this.currentApp.componentConfigs[componentId][fieldId] = [];
        }

        const databases = this.currentApp.componentConfigs[componentId][fieldId];
        databases.push({ name: `DB ${databases.length + 1}`, type: 'PostgreSQL', size: 100 });

        // Komponente neu rendern
        const component = architectureComponents.find(c => c.id === componentId);
        if (component) {
            this.updateComponentCard(component);
        }
    },

    /**
     * Entfernt eine Datenbank aus einer DB-Group
     */
    removeDBFromGroup(componentId, fieldId, dbIndex) {
        if (!this.currentApp.componentConfigs[componentId]) return;

        const databases = this.currentApp.componentConfigs[componentId][fieldId];
        if (!Array.isArray(databases) || databases.length <= 1) return;

        databases.splice(dbIndex, 1);

        // Komponente neu rendern
        const component = architectureComponents.find(c => c.id === componentId);
        if (component) {
            this.updateComponentCard(component);
        }
    },

    /**
     * Aktualisiert ein einzelnes Storage-Feld in einer Storage-Group
     */
    updateStorageGroupField(input) {
        const componentId = input.dataset.component;
        const fieldId = input.dataset.field;
        const volIndex = parseInt(input.dataset.volIndex);
        const volField = input.dataset.volField;

        if (!this.currentApp.componentConfigs[componentId]) {
            this.initComponentConfig(componentId);
        }

        if (!Array.isArray(this.currentApp.componentConfigs[componentId][fieldId])) {
            this.currentApp.componentConfigs[componentId][fieldId] = [{ name: 'Volume', type: 'ssd', size: 200 }];
        }

        const volumes = this.currentApp.componentConfigs[componentId][fieldId];
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
    },

    /**
     * Fügt ein neues Volume zu einer Storage-Group hinzu
     */
    addStorageToGroup(componentId, fieldId) {
        if (!this.currentApp.componentConfigs[componentId]) {
            this.initComponentConfig(componentId);
        }

        if (!Array.isArray(this.currentApp.componentConfigs[componentId][fieldId])) {
            this.currentApp.componentConfigs[componentId][fieldId] = [];
        }

        const volumes = this.currentApp.componentConfigs[componentId][fieldId];
        volumes.push({ name: `Volume ${volumes.length + 1}`, type: 'ssd', size: 200 });

        // Komponente neu rendern
        const component = architectureComponents.find(c => c.id === componentId);
        if (component) {
            this.updateComponentCard(component);
        }
    },

    /**
     * Entfernt ein Volume aus einer Storage-Group
     */
    removeStorageFromGroup(componentId, fieldId, volIndex) {
        if (!this.currentApp.componentConfigs[componentId]) return;

        const volumes = this.currentApp.componentConfigs[componentId][fieldId];
        if (!Array.isArray(volumes) || volumes.length <= 1) return;

        volumes.splice(volIndex, 1);

        // Komponente neu rendern
        const component = architectureComponents.find(c => c.id === componentId);
        if (component) {
            this.updateComponentCard(component);
        }
    },

    /**
     * Initialisiert die Konfiguration einer Komponente mit Defaults
     */
    initComponentConfig(componentId) {
        const component = architectureComponents.find(c => c.id === componentId);
        if (!component?.configFields) return;

        this.currentApp.componentConfigs[componentId] = {};
        component.configFields.forEach(field => {
            this.currentApp.componentConfigs[componentId][field.id] = field.default;
        });
    },


    /**
     * Aktualisiert die Konfigurations-Zusammenfassung einer Komponente
     */
    updateComponentConfigSummary(componentId) {
        const card = document.querySelector(`.component-card[data-id="${componentId}"]`);
        if (!card) return;

        const component = architectureComponents.find(c => c.id === componentId);
        const config = this.currentApp.componentConfigs[componentId];
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
    },

    /**
     * Aktualisiert systemConfig basierend auf allen Komponenten-Konfigurationen
     */
    updateSystemConfigFromComponents() {
        // Sammle alle Instanzen einer Komponente (z.B. compute, compute-2, compute-3)
        const collectInstances = (baseId) => {
            const instances = [];

            // Original-Komponente
            if (this.currentApp.selectedComponents.has(baseId) && this.currentApp.componentConfigs[baseId]) {
                instances.push(this.currentApp.componentConfigs[baseId]);
            }

            // Alle Instanzen finden (nicht nur sequenzielle!)
            Array.from(this.currentApp.selectedComponents)
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
                    if (this.currentApp.componentConfigs[instanceId]) {
                        instances.push(this.currentApp.componentConfigs[instanceId]);
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

        this.currentApp.systemConfig = {
            sizing: 'custom',
            config: config
        };
    },

    renderComponentCard(component, instanceId = null) {
        const cardId = instanceId || component.id;
        const baseComponentId = instanceId ? component.id : component.id;
        const isInstance = instanceId !== null;
        const instanceNumber = isInstance ? cardId.split('-').pop() : null;

        const isSelected = this.currentApp.selectedComponents.has(cardId);
        const config = this.currentApp.componentConfigs[cardId];
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
    },

    /**
     * Rendert das Konfigurations-Panel für eine Komponente
     */
    renderComponentConfigPanel(component, componentId) {
        if (!component.configFields) return '';

        const config = this.currentApp.componentConfigs[componentId] || {};

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
    },

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
    },

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
    },

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
    },

    toggleComponent(componentId) {
        const wasSelected = this.currentApp.selectedComponents.has(componentId);
        // Delta-Tracking: manuelle Änderungen des Nutzers nach Arch-Transformation merken
        if (this.currentApp._archOriginal) {
            if (wasSelected) {
                this.currentApp._archDelta.removed.add(componentId);
                this.currentApp._archDelta.added.delete(componentId);
            } else {
                this.currentApp._archDelta.added.add(componentId);
                this.currentApp._archDelta.removed.delete(componentId);
            }
        }
        if (wasSelected) {
            this.currentApp.selectedComponents.delete(componentId);
            // Config behalten für den Fall, dass Komponente wieder ausgewählt wird
        } else {
            this.currentApp.selectedComponents.add(componentId);
            // Config initialisieren wenn noch nicht vorhanden
            if (!this.currentApp.componentConfigs[componentId]) {
                this.initComponentConfig(componentId);
            }
        }
        // controlPlaneOnly synchronisieren: kubernetes zeigt nur Control Plane wenn compute auch da
        if (componentId === 'kubernetes' || componentId === 'compute') {
            if (this.currentApp.selectedComponents.has('kubernetes')) {
                if (!this.currentApp.componentConfigs['kubernetes']) this.initComponentConfig('kubernetes');
                const k8sConfig = this.currentApp.componentConfigs['kubernetes'];
                k8sConfig.controlPlaneOnly = this.currentApp.selectedComponents.has('compute');
                // Kubernetes-Karte neu rendern damit Config-Panel aktualisiert wird
                if (componentId === 'compute') this.reRenderComponentCard('kubernetes');
            }
        }

        // Karte komplett neu rendern um Config-Panel zu zeigen/verstecken
        this.reRenderComponentCard(componentId);
        this.updateSelectedSummary();
        this.updateNavigationState();
        this.updateSystemConfigFromComponents();

        // Session-State speichern nach Komponenten-Änderung
        this.saveSessionState();
    },

    /**
     * Fügt eine weitere Instanz einer Komponente hinzu
     */
    addComponentInstance(baseComponentId) {
        const component = architectureComponents.find(c => c.id === baseComponentId);
        if (!component) return;

        // Finde nächste freie Instanz-Nummer
        let instanceNumber = 2;
        while (this.currentApp.selectedComponents.has(`${baseComponentId}-${instanceNumber}`)) {
            instanceNumber++;
        }

        const newComponentId = `${baseComponentId}-${instanceNumber}`;

        // Neue Instanz zur Auswahl hinzufügen
        this.currentApp.selectedComponents.add(newComponentId);

        // Config kopieren von der Original-Komponente
        const baseConfig = this.currentApp.componentConfigs[baseComponentId] || {};
        this.currentApp.componentConfigs[newComponentId] = { ...baseConfig };

        // Vollständigen Component-Grid neu rendern
        this.renderComponents();

        this.updateSelectedSummary();
        this.updateNavigationState();
        this.updateSystemConfigFromComponents();
    },

    /**
     * Entfernt eine Instanz einer Komponente
     */
    removeComponentInstance(instanceId) {
        // Entferne aus selectedComponents
        this.currentApp.selectedComponents.delete(instanceId);

        // Entferne Config
        delete this.currentApp.componentConfigs[instanceId];

        // Vollständigen Component-Grid neu rendern
        this.renderComponents();

        this.updateSelectedSummary();
        this.updateNavigationState();
        this.updateSystemConfigFromComponents();
    },

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
    },

    updateSelectedSummary() {
        const containerId = this.isMultiAppMode ? 'currentAppComponentsSummary' : 'selectedComponentsSummary';
        const container = document.getElementById(containerId);
        if (!container) return;

        if (this.currentApp.selectedComponents.size === 0) {
            container.innerHTML = '<p style="color: var(--text-tertiary);">Noch keine Komponenten ausgewählt</p>';
            return;
        }

        const tags = Array.from(this.currentApp.selectedComponents).map(id => {
            // Basis-Komponente finden (auch für Instanzen wie "vm-2")
            const baseId = id.includes('-') && /\-\d+$/.test(id) ? id.replace(/-\d+$/, '') : id;
            const comp = architectureComponents.find(c => c.id === baseId);

            if (!comp) return ''; // Falls Komponente nicht gefunden

            const config = this.currentApp.componentConfigs[id];

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
    },

};
