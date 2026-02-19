// SAA Settings Module
// Verantwortlich für: Settings-Modal, Algorithm-Presets, Gewichte, API-Key

import { IconMapper } from './saa-utils.js';

export const SAASettings = {
    /**
     * Öffnet den Settings-Dialog
     */
    openSettings() {
        const overlay = document.getElementById('settingsOverlay');
        if (overlay) {
            overlay.classList.add('visible');
            this.updateSettingsDisplay();
        }
    },

    /**
     * Schließt den Settings-Dialog
     */
    closeSettings() {
        const overlay = document.getElementById('settingsOverlay');
        if (overlay) {
            overlay.classList.remove('visible');
        }
    },

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
    },

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
    },

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
    },

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
    },

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
    },

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
    },

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
    },

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
    },

    /**
     * Gibt das Icon für das aktuelle Preset zurück
     */
    getPresetIcon() {
        // Icons entfernt - returns empty string
        return '';
    },

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
    },

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
    },

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
    },

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
    },

    /**
     * Öffnet das Detail-Popup für einen Provider
     */

};
