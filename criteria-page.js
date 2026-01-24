/**
 * Bewertungskriterien Page Logic
 * Zeigt globale Provider-Bewertungen unabhängig von aktueller Analyse
 */

class CriteriaPage {
    constructor() {
        this.providers = cloudProviders;
        this.customScores = this.loadCustomScores();
        this.editingProvider = null;
        this.init();
    }

    init() {
        // Smooth Scrolling für Navigation
        this.initSmoothScrolling();

        // Tabellen rendern
        this.renderControlScoresTable();
        this.renderPerformanceScoresTable();
        this.renderPricingFactorsTable();
        this.renderProviderDetailsTable();

        // Active Link auf Scroll
        this.initScrollSpy();

        // Floating Reset Button anzeigen wenn Custom Scores vorhanden
        this.updateResetButtonVisibility();
    }

    /**
     * Lädt Custom Scores aus LocalStorage
     */
    loadCustomScores() {
        try {
            const stored = localStorage.getItem('saa_custom_provider_scores');
            return stored ? JSON.parse(stored) : {};
        } catch (e) {
            console.error('Error loading custom scores:', e);
            return {};
        }
    }

    /**
     * Speichert Custom Scores in LocalStorage
     */
    saveCustomScores() {
        try {
            localStorage.setItem('saa_custom_provider_scores', JSON.stringify(this.customScores));
            this.updateResetButtonVisibility();
        } catch (e) {
            console.error('Error saving custom scores:', e);
        }
    }

    /**
     * Gibt den effektiven Score eines Providers zurück (custom oder original)
     */
    getEffectiveScore(providerId, scoreType) {
        if (this.customScores[providerId] && this.customScores[providerId][scoreType] !== undefined) {
            return this.customScores[providerId][scoreType];
        }
        const provider = this.providers.find(p => p.id === providerId);
        return provider ? provider[scoreType] : 0;
    }

    /**
     * Gibt den effektiven Preisfaktor zurück (custom oder original)
     */
    getEffectivePriceFactor(providerId) {
        if (this.customScores[providerId] && this.customScores[providerId].priceFactor !== undefined) {
            return this.customScores[providerId].priceFactor;
        }

        const providerFactors = {
            'aws': 1.0, 'azure': 1.0, 'gcp': 0.95, 'aws-sovereign': 1.15,
            'delos': 1.18, 'stackit': 0.85, 'ionos': 0.80, 'ovh': 0.75,
            'otc': 0.90, 'azure-confidential': 1.2, 'plusserver': 0.90,
            'noris': 0.95, 'openstack': 0.70
        };

        return providerFactors[providerId] || 1.0;
    }

    /**
     * Prüft ob ein Provider custom Scores hat
     */
    hasCustomScores(providerId) {
        return this.customScores[providerId] !== undefined;
    }

    /**
     * Zeigt/versteckt den Reset-Button
     */
    updateResetButtonVisibility() {
        const btn = document.getElementById('floatingResetBtn');
        if (btn) {
            btn.style.display = Object.keys(this.customScores).length > 0 ? 'block' : 'none';
        }
    }

    /**
     * Smooth Scrolling für interne Links
     */
    initSmoothScrolling() {
        document.querySelectorAll('.criteria-nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                const target = document.getElementById(targetId);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    // Update active link
                    document.querySelectorAll('.criteria-nav-link').forEach(l => l.classList.remove('active'));
                    link.classList.add('active');
                }
            });
        });
    }

    /**
     * Scroll Spy - Active Link basierend auf Scroll-Position
     */
    initScrollSpy() {
        const sections = document.querySelectorAll('.criteria-section');
        const navLinks = document.querySelectorAll('.criteria-nav-link');

        window.addEventListener('scroll', () => {
            let current = '';
            sections.forEach(section => {
                const sectionTop = section.offsetTop;
                const sectionHeight = section.clientHeight;
                if (pageYOffset >= sectionTop - 100) {
                    current = section.getAttribute('id');
                }
            });

            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href').substring(1) === current) {
                    link.classList.add('active');
                }
            });
        });
    }

    /**
     * Rendert Kontrolle-Scores Tabelle
     */
    renderControlScoresTable() {
        const container = document.getElementById('controlScoresTable');
        if (!container) return;

        // Sortiere Provider nach Kontrolle-Score (mit Custom Scores)
        const sorted = [...this.providers].sort((a, b) => {
            const scoreA = this.getEffectiveScore(a.id, 'control');
            const scoreB = this.getEffectiveScore(b.id, 'control');
            return scoreB - scoreA;
        });

        const rows = sorted.map((provider, index) => {
            const score = this.getEffectiveScore(provider.id, 'control');
            const color = this.getScoreColor(score);
            const rank = index + 1;
            const isCustom = this.hasCustomScores(provider.id);

            // Erklärung des Scores
            let explanation = this.getControlExplanation(provider);

            return `
                <tr class="${rank === 1 ? 'top-provider' : ''} ${isCustom ? 'custom-row' : ''}">
                    <td class="rank-cell">#${rank}</td>
                    <td class="provider-cell">
                        <div class="provider-name-badge">
                            <div class="provider-mini-logo" style="background: ${provider.color}20; color: ${provider.color};">
                                ${provider.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                                <strong>${provider.name}</strong>
                                <div class="provider-category">${this.getCategoryName(provider.category)}</div>
                            </div>
                            ${isCustom ? '<span class="custom-indicator" title="Angepasste Bewertung"><i class="fa-solid fa-pen-to-square"></i></span>' : ''}
                        </div>
                    </td>
                    <td class="score-cell">
                        <div class="score-bar-wrapper">
                            <div class="score-bar" style="width: ${score}%; background: ${color};"></div>
                            <span class="score-text">${score}</span>
                        </div>
                    </td>
                    <td class="explanation-cell">
                        ${explanation}
                    </td>
                    <td class="action-cell">
                        <button class="edit-btn" onclick="criteriaPage.openEditModal('${provider.id}')" title="Bewertung bearbeiten">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        container.innerHTML = `
            <div class="provider-table-wrapper">
                <table class="provider-scores-table">
                    <thead>
                        <tr>
                            <th style="width: 8%;">Rang</th>
                            <th style="width: 22%;">Provider</th>
                            <th style="width: 18%;">Score</th>
                            <th style="width: 42%;">Bewertung</th>
                            <th style="width: 10%;"></th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
            </div>
        `;
    }

    /**
     * Erklärt den Kontrolle-Score eines Providers
     */
    getControlExplanation(provider) {
        const score = provider.control;
        let factors = [];

        // Jurisdiktion
        if (provider.id === 'delos' || provider.id === 'stackit' || provider.id === 'plusserver' || provider.id === 'noris' || provider.id === 'arvato') {
            factors.push('<span class="factor-positive">🇩🇪 Deutsche Jurisdiktion</span>');
        } else if (provider.id === 'ionos' || provider.id === 'ovh' || provider.id === 'otc') {
            factors.push('<span class="factor-positive">🇪🇺 EU-Jurisdiktion</span>');
        } else if (provider.id === 'aws' || provider.id === 'azure' || provider.id === 'gcp') {
            factors.push('<span class="factor-neutral">🌐 US/Global Jurisdiktion</span>');
        } else if (provider.id === 'aws-sovereign') {
            factors.push('<span class="factor-positive">🇪🇺 EU-Sovereign (AWS)</span>');
        } else if (provider.id === 'azure-confidential') {
            factors.push('<span class="factor-positive">🇪🇺 EU-Confidential (Azure)</span>');
        }

        // DSGVO & Souveränität
        if (provider.category === 'sovereign') {
            factors.push('<span class="factor-positive">Souveräne Cloud</span>');
        } else if (score >= 80) {
            factors.push('<span class="factor-positive">Native DSGVO-Compliance</span>');
        } else if (score >= 50) {
            factors.push('<span class="factor-neutral">DSGVO-zertifiziert</span>');
        } else {
            factors.push('<span class="factor-neutral">Standard-Compliance</span>');
        }

        // Lock-in & Technologie
        if (provider.id === 'openstack') {
            factors.push('<span class="factor-positive">Open Source Basis</span>');
        } else if (provider.id === 'aws' || provider.id === 'azure' || provider.id === 'gcp') {
            factors.push('<span class="factor-negative">Proprietäre Services</span>');
        } else {
            factors.push('<span class="factor-neutral">Standard-APIs</span>');
        }

        // Eigentümerstruktur
        if (provider.id === 'delos' || provider.id === 'stackit' || provider.id === 'plusserver' || provider.id === 'noris') {
            factors.push('<span class="factor-positive">Deutsche Eigentümer</span>');
        } else if (provider.id === 'ionos' || provider.id === 'ovh') {
            factors.push('<span class="factor-positive">EU-Eigentümer</span>');
        } else if (provider.id === 'aws' || provider.id === 'azure' || provider.id === 'gcp') {
            factors.push('<span class="factor-neutral">US-Konzern</span>');
        }

        return factors.join(' • ');
    }

    /**
     * Rendert Leistung-Scores Tabelle
     */
    renderPerformanceScoresTable() {
        const container = document.getElementById('performanceScoresTable');
        if (!container) return;

        const sorted = [...this.providers].sort((a, b) => {
            const scoreA = this.getEffectiveScore(a.id, 'performance');
            const scoreB = this.getEffectiveScore(b.id, 'performance');
            return scoreB - scoreA;
        });

        const rows = sorted.map((provider, index) => {
            const score = this.getEffectiveScore(provider.id, 'performance');
            const color = this.getScoreColor(score);
            const rank = index + 1;
            const isCustom = this.hasCustomScores(provider.id);

            let explanation = this.getPerformanceExplanation(provider);

            return `
                <tr class="${rank === 1 ? 'top-provider' : ''} ${isCustom ? 'custom-row' : ''}">
                    <td class="rank-cell">#${rank}</td>
                    <td class="provider-cell">
                        <div class="provider-name-badge">
                            <div class="provider-mini-logo" style="background: ${provider.color}20; color: ${provider.color};">
                                ${provider.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                                <strong>${provider.name}</strong>
                                <div class="provider-category">${this.getCategoryName(provider.category)}</div>
                            </div>
                            ${isCustom ? '<span class="custom-indicator" title="Angepasste Bewertung"><i class="fa-solid fa-pen-to-square"></i></span>' : ''}
                        </div>
                    </td>
                    <td class="score-cell">
                        <div class="score-bar-wrapper">
                            <div class="score-bar" style="width: ${score}%; background: ${color};"></div>
                            <span class="score-text">${score}</span>
                        </div>
                    </td>
                    <td class="explanation-cell">
                        ${explanation}
                    </td>
                    <td class="action-cell">
                        <button class="edit-btn" onclick="criteriaPage.openEditModal('${provider.id}')" title="Bewertung bearbeiten">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        container.innerHTML = `
            <div class="provider-table-wrapper">
                <table class="provider-scores-table">
                    <thead>
                        <tr>
                            <th style="width: 8%;">Rang</th>
                            <th style="width: 22%;">Provider</th>
                            <th style="width: 18%;">Score</th>
                            <th style="width: 42%;">Bewertung</th>
                            <th style="width: 10%;"></th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
            </div>
        `;
    }

    /**
     * Erklärt den Performance-Score eines Providers
     */
    getPerformanceExplanation(provider) {
        const score = provider.performance;
        let factors = [];

        // Portfolio-Umfang
        if (score >= 90) {
            factors.push('<span class="factor-positive">Umfangreiches Portfolio (200+ Services)</span>');
        } else if (score >= 75) {
            factors.push('<span class="factor-positive">Großes Portfolio (50-100 Services)</span>');
        } else if (score >= 60) {
            factors.push('<span class="factor-neutral">Basis-Portfolio (20-50 Services)</span>');
        } else {
            factors.push('<span class="factor-neutral">Fokussiertes Portfolio (&lt;20 Services)</span>');
        }

        // Service-Reife
        if (score >= 90) {
            factors.push('<span class="factor-positive">Überwiegend GA-Services</span>');
        } else if (score >= 75) {
            factors.push('<span class="factor-neutral">Mix aus GA und Preview</span>');
        } else if (score >= 60) {
            factors.push('<span class="factor-neutral">Wachsendes Portfolio</span>');
        } else {
            factors.push('<span class="factor-negative">Viele Preview-Services</span>');
        }

        // Skalierung & Regionen
        if (provider.id === 'aws' || provider.id === 'azure' || provider.id === 'gcp') {
            factors.push('<span class="factor-positive">Global verfügbar (Multi-Region)</span>');
        } else if (provider.category === 'eu' || provider.category === 'sovereign') {
            factors.push('<span class="factor-neutral">EU/DE Regional</span>');
        } else {
            factors.push('<span class="factor-neutral">Regionales Angebot</span>');
        }

        // Innovation
        if (provider.id === 'aws' || provider.id === 'azure' || provider.id === 'gcp') {
            factors.push('<span class="factor-positive">Eigene KI/ML-Services</span>');
        } else if (score >= 70) {
            factors.push('<span class="factor-neutral">KI-Integration verfügbar</span>');
        }

        return factors.join(' • ');
    }

    /**
     * Rendert Preisfaktoren Tabelle
     */
    renderPricingFactorsTable() {
        const container = document.getElementById('pricingFactorsTable');
        if (!container) return;

        // Preisfaktoren (aus saa-analysis.js)
        const providerFactors = {
            'aws': { factor: 1.0, note: 'Referenz-Pricing' },
            'azure': { factor: 1.0, note: 'Vergleichbar mit AWS' },
            'gcp': { factor: 0.95, note: 'Leicht günstiger' },
            'aws-sovereign': { factor: 1.15, note: 'Premium für Souveränität' },
            'delos': { factor: 1.18, note: 'Premium Sovereign Cloud' },
            'stackit': { factor: 0.85, note: 'Günstiger als Hyperscaler' },
            'ionos': { factor: 0.80, note: 'Günstige EU-Alternative' },
            'ovh': { factor: 0.75, note: 'Sehr günstig' },
            'otc': { factor: 0.90, note: 'Mittelfeld' },
            'azure-confidential': { factor: 1.2, note: 'Premium Confidential' },
            'plusserver': { factor: 0.90, note: 'Mittelfeld' },
            'noris': { factor: 0.95, note: 'Mittelfeld' },
            'openstack': { factor: 0.70, note: 'Nur Infrastruktur' }
        };

        // Nach Faktor sortieren (günstigster zuerst, mit Custom Faktoren)
        const sorted = this.providers
            .map(p => ({
                provider: p,
                factor: this.getEffectivePriceFactor(p.id),
                note: providerFactors[p.id]?.note || 'Standard',
                isCustom: this.hasCustomScores(p.id) && this.customScores[p.id].priceFactor !== undefined
            }))
            .sort((a, b) => a.factor - b.factor);

        const rows = sorted.map((item, index) => {
            const { provider, factor, note, isCustom } = item;
            const isLowest = index === 0;
            const savings = ((1 - factor) * 100).toFixed(0);
            const premium = ((factor - 1) * 100).toFixed(0);

            return `
                <tr class="${isLowest ? 'lowest-price' : ''} ${isCustom ? 'custom-row' : ''}">
                    <td class="provider-cell">
                        <div class="provider-name-badge">
                            <div class="provider-mini-logo" style="background: ${provider.color}20; color: ${provider.color};">
                                ${provider.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                                <strong>${provider.name}</strong>
                                <div class="provider-category">${this.getCategoryName(provider.category)}</div>
                            </div>
                            ${isCustom ? '<span class="custom-indicator" title="Angepasste Bewertung"><i class="fa-solid fa-pen-to-square"></i></span>' : ''}
                        </div>
                    </td>
                    <td class="factor-cell">
                        <span class="factor-badge ${factor < 1 ? 'discount' : factor > 1 ? 'premium' : 'standard'}">
                            ${factor.toFixed(2)}×
                        </span>
                    </td>
                    <td class="comparison-cell">
                        ${factor < 1
                            ? `<span class="savings">~${Math.abs(savings)}% günstiger als AWS</span>`
                            : factor > 1
                            ? `<span class="premium-text">~${premium}% teurer als AWS</span>`
                            : '<span class="standard-text">≈ AWS-Niveau</span>'
                        }
                    </td>
                    <td class="note-cell">${note}</td>
                    <td class="action-cell">
                        <button class="edit-btn" onclick="criteriaPage.openEditModal('${provider.id}')" title="Bewertung bearbeiten">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        container.innerHTML = `
            <div class="provider-table-wrapper">
                <table class="provider-scores-table pricing-table">
                    <thead>
                        <tr>
                            <th style="width: 27%;">Provider</th>
                            <th style="width: 13%;">Preisfaktor</th>
                            <th style="width: 25%;">Vergleich zu AWS</th>
                            <th style="width: 23%;">Hinweis</th>
                            <th style="width: 10%;"></th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
            </div>
            <p class="table-note">
                <i class="fa-solid fa-info-circle"></i>
                <strong>Hinweis:</strong> Preisfaktoren sind Durchschnittswerte basierend auf öffentlichen Preisrechnern
                und können je nach Service und Region variieren.
            </p>
        `;
    }

    /**
     * Rendert vollständige Provider-Details Tabelle
     */
    renderProviderDetailsTable() {
        const container = document.getElementById('providerDetailsTable');
        if (!container) return;

        // Nach Gesamt-Score sortieren (Durchschnitt aus Control + Performance mit Custom Scores)
        const sorted = [...this.providers].sort((a, b) => {
            const controlA = this.getEffectiveScore(a.id, 'control');
            const performanceA = this.getEffectiveScore(a.id, 'performance');
            const controlB = this.getEffectiveScore(b.id, 'control');
            const performanceB = this.getEffectiveScore(b.id, 'performance');
            const avgA = (controlA + performanceA) / 2;
            const avgB = (controlB + performanceB) / 2;
            return avgB - avgA;
        });

        const rows = sorted.map((provider, index) => {
            const rank = index + 1;
            const controlScore = this.getEffectiveScore(provider.id, 'control');
            const performanceScore = this.getEffectiveScore(provider.id, 'performance');
            const avgScore = ((controlScore + performanceScore) / 2).toFixed(1);
            const factor = this.getEffectivePriceFactor(provider.id);
            const controlColor = this.getScoreColor(controlScore);
            const perfColor = this.getScoreColor(performanceScore);
            const isCustom = this.hasCustomScores(provider.id);

            return `
                <tr class="${rank === 1 ? 'top-provider' : ''} ${isCustom ? 'custom-row' : ''}">
                    <td class="rank-cell">#${rank}</td>
                    <td class="provider-cell">
                        <div class="provider-name-badge">
                            <div class="provider-mini-logo" style="background: ${provider.color}20; color: ${provider.color};">
                                ${provider.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                                <strong>${provider.name}</strong>
                                <div class="provider-category">${this.getCategoryName(provider.category)}</div>
                            </div>
                            ${isCustom ? '<span class="custom-indicator" title="Angepasste Bewertung"><i class="fa-solid fa-pen-to-square"></i></span>' : ''}
                        </div>
                    </td>
                    <td class="mini-score-cell">
                        <div class="mini-score-bar" style="width: ${controlScore}%; background: ${controlColor};"></div>
                        <span>${controlScore}</span>
                    </td>
                    <td class="mini-score-cell">
                        <div class="mini-score-bar" style="width: ${performanceScore}%; background: ${perfColor};"></div>
                        <span>${performanceScore}</span>
                    </td>
                    <td class="avg-score-cell">
                        <strong style="color: ${this.getScoreColor(avgScore)};">${avgScore}</strong>
                    </td>
                    <td class="factor-cell">
                        <span class="factor-badge ${factor < 1 ? 'discount' : factor > 1 ? 'premium' : 'standard'}">
                            ${factor.toFixed(2)}×
                        </span>
                    </td>
                    <td class="action-cell">
                        <button class="edit-btn" onclick="criteriaPage.openEditModal('${provider.id}')" title="Bewertung bearbeiten">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        container.innerHTML = `
            <div class="provider-table-wrapper">
                <table class="provider-scores-table details-table">
                    <thead>
                        <tr>
                            <th style="width: 7%;">Rang</th>
                            <th style="width: 20%;">Provider</th>
                            <th style="width: 13%;"><i class="fa-solid fa-lock"></i> Kontrolle</th>
                            <th style="width: 13%;"><i class="fa-solid fa-bolt"></i> Leistung</th>
                            <th style="width: 10%;"><i class="fa-solid fa-star"></i> Ø Score</th>
                            <th style="width: 13%;"><i class="fa-solid fa-coins"></i> Preisfaktor</th>
                            <th style="width: 10%;"></th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
            </div>
            <p class="table-note">
                <i class="fa-solid fa-info-circle"></i>
                <strong>Hinweis:</strong> Der Durchschnitts-Score dient nur zur Orientierung.
                Die tatsächliche Bewertung hängt von Ihrer Gewichtung und Architektur-Auswahl ab.
            </p>
        `;
    }

    /**
     * Helper: Score-Farbe
     */
    getScoreColor(score) {
        if (score >= 80) return '#10B981'; // Grün
        if (score >= 60) return '#F59E0B'; // Gelb
        return '#EF4444'; // Rot
    }

    /**
     * Helper: Kategorie-Name
     */
    getCategoryName(category) {
        const names = {
            hyperscaler: 'Hyperscaler',
            sovereign: 'Souverän',
            eu: 'EU-Anbieter',
            private: 'Private Cloud',
            hybrid: 'Hybrid'
        };
        return names[category] || category;
    }

    /**
     * Öffnet das Edit-Modal für einen Provider
     */
    openEditModal(providerId) {
        this.editingProvider = this.providers.find(p => p.id === providerId);
        if (!this.editingProvider) return;

        const overlay = document.getElementById('editModalOverlay');
        const title = document.getElementById('editModalTitle');
        const content = document.getElementById('editModalContent');

        title.textContent = `${this.editingProvider.name} bearbeiten`;

        const currentControl = this.getEffectiveScore(providerId, 'control');
        const currentPerformance = this.getEffectiveScore(providerId, 'performance');
        const currentPriceFactor = this.getEffectivePriceFactor(providerId);
        const originalPriceFactor = this.getEffectivePriceFactor(providerId);

        content.innerHTML = `
            <div class="edit-provider-info">
                <div class="provider-logo-large" style="background: ${this.editingProvider.color}20; color: ${this.editingProvider.color};">
                    ${this.editingProvider.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                    <h4>${this.editingProvider.name}</h4>
                    <p class="provider-category">${this.getCategoryName(this.editingProvider.category)}</p>
                </div>
            </div>

            <div class="score-editor">
                <div class="score-editor-item">
                    <label>
                        <i class="fa-solid fa-lock"></i> Kontrolle & Souveränität
                        ${this.hasCustomScores(providerId) ? '<span class="custom-badge">Angepasst</span>' : ''}
                    </label>
                    <div class="score-slider-wrapper">
                        <input type="range" id="editControlScore" min="0" max="100" value="${currentControl}"
                               oninput="criteriaPage.updateScorePreview('control', this.value)">
                        <div class="score-display">
                            <span id="controlScoreDisplay">${currentControl}</span>
                            <span class="score-original">Standard: ${this.editingProvider.control}</span>
                        </div>
                    </div>
                </div>

                <div class="score-editor-item">
                    <label>
                        <i class="fa-solid fa-bolt"></i> Leistung & Service-Umfang
                        ${this.hasCustomScores(providerId) ? '<span class="custom-badge">Angepasst</span>' : ''}
                    </label>
                    <div class="score-slider-wrapper">
                        <input type="range" id="editPerformanceScore" min="0" max="100" value="${currentPerformance}"
                               oninput="criteriaPage.updateScorePreview('performance', this.value)">
                        <div class="score-display">
                            <span id="performanceScoreDisplay">${currentPerformance}</span>
                            <span class="score-original">Standard: ${this.editingProvider.performance}</span>
                        </div>
                    </div>
                </div>

                <div class="score-editor-item">
                    <label>
                        <i class="fa-solid fa-coins"></i> Preisfaktor (relativ zu AWS)
                        ${this.hasCustomScores(providerId) ? '<span class="custom-badge">Angepasst</span>' : ''}
                    </label>
                    <div class="score-slider-wrapper">
                        <input type="range" id="editPriceFactor" min="0.5" max="1.5" step="0.05" value="${currentPriceFactor}"
                               oninput="criteriaPage.updatePriceFactorPreview(this.value)">
                        <div class="score-display">
                            <span id="priceFactorDisplay">${currentPriceFactor.toFixed(2)}×</span>
                            <span class="score-original">Standard: ${originalPriceFactor.toFixed(2)}×</span>
                        </div>
                        <div class="price-factor-hint">
                            <small>
                                <strong>Hinweis:</strong> 1.0 = AWS-Preisniveau |
                                <span id="priceFactorComparison">${this.getPriceFactorComparison(currentPriceFactor)}</span>
                            </small>
                        </div>
                    </div>
                </div>
            </div>

            <div class="edit-note">
                <i class="fa-solid fa-info-circle"></i>
                <p>Ihre Anpassungen werden lokal in Ihrem Browser gespeichert und beeinflussen alle Analysen im Sovereign Architecture Advisor.</p>
            </div>

            ${this.hasCustomScores(providerId) ? `
                <div class="reset-single-provider">
                    <button class="btn-text-danger" onclick="criteriaPage.resetSingleProvider('${providerId}')">
                        <i class="fa-solid fa-rotate-left"></i> Diesen Provider zurücksetzen
                    </button>
                </div>
            ` : ''}
        `;

        overlay.classList.add('visible');
    }

    /**
     * Aktualisiert die Score-Vorschau im Modal
     */
    updateScorePreview(scoreType, value) {
        const display = document.getElementById(`${scoreType}ScoreDisplay`);
        if (display) {
            display.textContent = value;
        }
    }

    /**
     * Aktualisiert die Preisfaktor-Vorschau
     */
    updatePriceFactorPreview(value) {
        const display = document.getElementById('priceFactorDisplay');
        const comparison = document.getElementById('priceFactorComparison');
        if (display) {
            display.textContent = parseFloat(value).toFixed(2) + '×';
        }
        if (comparison) {
            comparison.textContent = this.getPriceFactorComparison(parseFloat(value));
        }
    }

    /**
     * Gibt Vergleichstext für Preisfaktor zurück
     */
    getPriceFactorComparison(factor) {
        if (factor < 1.0) {
            const savings = ((1 - factor) * 100).toFixed(0);
            return `~${savings}% günstiger als AWS`;
        } else if (factor > 1.0) {
            const premium = ((factor - 1) * 100).toFixed(0);
            return `~${premium}% teurer als AWS`;
        } else {
            return '≈ AWS-Niveau';
        }
    }

    /**
     * Schließt das Edit-Modal
     */
    closeEditModal() {
        const overlay = document.getElementById('editModalOverlay');
        overlay.classList.remove('visible');
        this.editingProvider = null;
    }

    /**
     * Speichert die bearbeiteten Provider-Scores
     */
    saveProviderScores() {
        if (!this.editingProvider) return;

        const controlScore = parseInt(document.getElementById('editControlScore').value);
        const performanceScore = parseInt(document.getElementById('editPerformanceScore').value);
        const priceFactor = parseFloat(document.getElementById('editPriceFactor').value);
        const originalPriceFactor = this.getEffectivePriceFactor(this.editingProvider.id);

        // Prüfe ob Standard-Preisfaktor
        const standardFactors = {
            'aws': 1.0, 'azure': 1.0, 'gcp': 0.95, 'aws-sovereign': 1.15,
            'delos': 1.18, 'stackit': 0.85, 'ionos': 0.80, 'ovh': 0.75,
            'otc': 0.90, 'azure-confidential': 1.2, 'plusserver': 0.90,
            'noris': 0.95, 'openstack': 0.70
        };
        const standardPriceFactor = standardFactors[this.editingProvider.id] || 1.0;

        // Nur speichern wenn geändert
        const hasChanges =
            controlScore !== this.editingProvider.control ||
            performanceScore !== this.editingProvider.performance ||
            Math.abs(priceFactor - standardPriceFactor) > 0.01;

        if (hasChanges) {
            this.customScores[this.editingProvider.id] = {
                control: controlScore,
                performance: performanceScore,
                priceFactor: priceFactor
            };
            this.saveCustomScores();
        } else {
            // Wenn zurück auf Standard, entfernen
            delete this.customScores[this.editingProvider.id];
            this.saveCustomScores();
        }

        this.closeEditModal();

        // Tabellen neu rendern
        this.renderControlScoresTable();
        this.renderPerformanceScoresTable();
        this.renderPricingFactorsTable();
        this.renderProviderDetailsTable();

        // Erfolgs-Nachricht
        this.showToast('Änderungen gespeichert!');
    }

    /**
     * Setzt einen einzelnen Provider zurück
     */
    resetSingleProvider(providerId) {
        delete this.customScores[providerId];
        this.saveCustomScores();
        this.closeEditModal();

        // Tabellen neu rendern
        this.renderControlScoresTable();
        this.renderPerformanceScoresTable();
        this.renderProviderDetailsTable();

        this.showToast('Provider auf Standard zurückgesetzt');
    }

    /**
     * Zeigt Reset-Bestätigung
     */
    showResetConfirmation() {
        const overlay = document.getElementById('resetConfirmationOverlay');
        overlay.classList.add('visible');
    }

    /**
     * Schließt Reset-Bestätigung
     */
    closeResetConfirmation() {
        const overlay = document.getElementById('resetConfirmationOverlay');
        overlay.classList.remove('visible');
    }

    /**
     * Bestätigt und führt Reset durch
     */
    confirmReset() {
        this.customScores = {};
        this.saveCustomScores();
        this.closeResetConfirmation();

        // Alle Tabellen neu rendern
        this.renderControlScoresTable();
        this.renderPerformanceScoresTable();
        this.renderProviderDetailsTable();

        this.showToast('Alle Anpassungen wurden zurückgesetzt');
    }

    /**
     * Zeigt eine Toast-Nachricht
     */
    showToast(message) {
        // Entferne alte Toasts
        document.querySelectorAll('.toast-notification').forEach(t => t.remove());

        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.innerHTML = `
            <i class="fa-solid fa-check-circle"></i>
            <span>${message}</span>
        `;
        document.body.appendChild(toast);

        setTimeout(() => toast.classList.add('visible'), 10);
        setTimeout(() => {
            toast.classList.remove('visible');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// Initialize on DOMContentLoaded
let criteriaPage;
document.addEventListener('DOMContentLoaded', () => {
    criteriaPage = new CriteriaPage();
});
