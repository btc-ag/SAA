/**
 * Sovereignty Engine — EU CSF gewichteter Kontrolle-Score.
 *
 * Strukturell paritätisch zum SCC-Schwesterprojekt
 * (SCC: js/data/sov-framework.js + Aggregat aus provider-assessments.js).
 * BSI-Updates müssen in beiden Repos byte-identisch nachgezogen werden.
 *
 * @module modules/sovereignty-engine
 */

import { aggregateC3A } from './c3a-framework.js';
import { aggregateSov7 } from './sov7-compliance.js';
import { getAuditMode } from './audit-mode.js';

/**
 * EU Cloud Sovereignty Framework — Gewichte SOV-1...8.
 * Identisch zu SCC `SOV_WEIGHTS` in `js/data/sov-framework.js`.
 */
export const SOV_WEIGHTS = Object.freeze({
    sov1: 0.15, sov2: 0.10, sov3: 0.10, sov4: 0.15,
    sov5: 0.20, sov6: 0.15, sov7: 0.10, sov8: 0.05
});

/**
 * SOV-8 Experten-Scores. BSI-C3A-Mandat deckt SOV-8 (Operative Souveränität)
 * nicht ab — Experten-Einschätzung der BTC. Identisch zu SCC.
 */
export const SOV8_EXPERT_SCORES = Object.freeze({
    'aws': 60,
    'azure': 65,
    'gcp': 55,
    'aws-sovereign': 70,
    'delos': 65,
    'stackit': 85,
    'ionos': 75,
    'otc': 76,
    'sap-ci': 76,
    'openstack': 50
});

/**
 * Berechnet pro Provider die SOV-1...8-Werte für einen Audit-Mode.
 * SOV-1...6 aus C3A-Aggregation, SOV-7 aus SOV-7-Compliance,
 * SOV-8 aus Experten-Score.
 *
 * @param {Object} provider - mit `id`, `c3a`, `sov7`-Properties
 * @param {string} mode - 'c1' oder 'c2'
 * @returns {Object|null} {sov1...sov8} oder null bei fehlenden Daten
 */
export function aggregateProviderSovScores(provider, mode) {
    if (!provider?.c3a) return null;
    const c3a = aggregateC3A(provider.c3a, mode);
    const sov7 = provider.sov7 ? aggregateSov7(provider.sov7) : null;
    const sov8 = SOV8_EXPERT_SCORES[provider.id] ?? 50;
    if (!c3a || sov7 == null) return null;
    return {
        sov1: c3a.sov1, sov2: c3a.sov2, sov3: c3a.sov3,
        sov4: c3a.sov4, sov5: c3a.sov5, sov6: c3a.sov6,
        sov7, sov8
    };
}

/**
 * Berechnet den Kontrolle-Score nach EU-CSF aus SOV-1...8.
 * Identische Formel wie SCC `calculateControlFromSov`.
 *
 * @param {Object} sovScores - {sov1...sov8}
 * @returns {number} 0...100, gerundet
 */
export function calculateControlFromSov(sovScores) {
    if (!sovScores) return 0;
    const totalWeight = Object.values(SOV_WEIGHTS).reduce((s, w) => s + w, 0);
    let weightedSum = 0;
    for (const [key, weight] of Object.entries(SOV_WEIGHTS)) {
        weightedSum += (sovScores[key] || 0) * weight;
    }
    return Math.round(weightedSum / totalWeight);
}

/**
 * Liefert den Provider-Level-Kontrolle-Wert (Hybrid):
 * Wenn der Provider C3A-Daten hat → EU-CSF-gewichteter Mittelwert über SOV-1...8.
 * Sonst Fallback auf statischen `provider.control`-Wert.
 *
 * @param {Object} provider
 * @param {string} [mode] - C1/C2; default = aktueller AuditMode
 * @returns {number}
 */
export function getC3AAdjustedControl(provider, mode = getAuditMode()) {
    if (!provider) return 50;
    if (!provider.c3a) return provider.control ?? 50;
    const sov = aggregateProviderSovScores(provider, mode);
    if (!sov) return provider.control ?? 50;
    return calculateControlFromSov(sov);
}
