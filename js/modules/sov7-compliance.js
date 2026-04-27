/**
 * SOV-7 Sicherheits-Compliance — Kriterien-Katalog
 *
 * Kontext: BSI C3A deckt SOV-7 (Security & Compliance) explizit nicht ab und
 * verweist auf BSI C5:2026 / IT-Grundschutz. Dieser Katalog formalisiert die
 * marktrelevanten Compliance-Indikatoren analog zur C3A-Struktur.
 *
 * SAA v4.0.0 — adaptiert aus dem SCC-Schwesterprojekt als ES-Modul.
 *
 * @module sov7-compliance
 */

export const SOV7_CRITERIA = Object.freeze({
    'SOV-7-01': {
        name: 'ISO/IEC 27001',
        description: 'Aktuelle ISMS-Zertifizierung nach ISO/IEC 27001 für die für den Cloud-Service relevanten Standorte und Prozesse.'
    },
    'SOV-7-02': {
        name: 'ISO 27001 auf IT-Grundschutz',
        description: 'Zertifizierung nach BSI-Standard 200-2/200-3 (IT-Grundschutz) für die relevanten Rechenzentren.'
    },
    'SOV-7-03': {
        name: 'BSI C5',
        description: 'Gültiges Testat nach BSI C5:2020 oder C5:2026 (Type 1 oder Type 2).'
    },
    'SOV-7-04': {
        name: 'ISO/IEC 27017',
        description: 'Cloud-spezifische Sicherheitskontrollen zertifiziert.'
    },
    'SOV-7-05': {
        name: 'ISO/IEC 27018',
        description: 'Datenschutz für PII in Public Cloud zertifiziert.'
    },
    'SOV-7-06': {
        name: 'ISO/IEC 27701',
        description: 'PIMS (Privacy Information Management System) zertifiziert.'
    },
    'SOV-7-07': {
        name: 'SOC 2 Type 2',
        description: 'Aktueller SOC 2 Type 2 Bericht zu mindestens Security/Availability/Confidentiality.'
    },
    'SOV-7-08': {
        name: 'KRITIS-Fähigkeit',
        description: 'Provider als KRITIS-fähig referenziert oder explizit für KRITIS-Workloads beworben/eingesetzt.'
    },
    'SOV-7-09': {
        name: 'NIS2-Konformität',
        description: 'Nachweisbare Erfüllung der erweiterten NIS2-Pflichten (Risk Management, Incident-Reporting).'
    },
    'SOV-7-10': {
        name: 'EU-SOC / VS-NfD',
        description: 'Security Operations Center innerhalb EU/DE etabliert; VS-NfD-Eignung optional zusätzlich.'
    }
});

export const SOV7_RESULT_SCORE = Object.freeze({
    pass: 100, partial: 50, fail: 0, unknown: 0
});

/**
 * Aggregiert ein SOV-7-Assessment zu einem Score 0-100
 * @param {Object} assessment - { 'SOV-7-01': { result: 'pass', ... }, ... }
 * @returns {number}
 */
export function aggregateSov7(assessment) {
    if (!assessment) return 0;
    const ids = Object.keys(SOV7_CRITERIA);
    const scores = ids.map(id => SOV7_RESULT_SCORE[assessment[id]?.result] ?? 0);
    return Math.round(scores.reduce((a, b) => a + b, 0) / ids.length);
}

export const SOV7_VERSION = '1.0';
export const SOV7_PUBLISHED = '2026-04-27';
