#!/usr/bin/env node
/**
 * Smoke-Tests für results-compute.js (Pure functions für Render-Schicht).
 */

import {
    computeAppMonthlyTCO,
    computeTcoConsumptionBreakdown,
    computeRatingColors,
    formatRecommendationText,
    formatPortfolioRecommendationText,
    GENERIC_SERVICE_NAMES,
    PROVIDER_CATEGORY_NAMES
} from '../js/modules/results-compute.js';

let pass = 0, fail = 0;
function check(name, actual, expected) {
    const ok = JSON.stringify(actual) === JSON.stringify(expected);
    if (ok) { console.log(`✓ ${name}`); pass++; }
    else    { console.log(`✗ ${name}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`); fail++; }
}
function checkTrue(name, value)  { check(name, value === true, true); }

// === computeAppMonthlyTCO ===
check('computeAppMonthlyTCO mit voll gefülltem TCO',
    computeAppMonthlyTCO({
        analysisResults: [{
            tcoEstimate: {
                consumption: { monthlyEstimate: 100 },
                operations: { monthlyPersonnelCost: 50 }
            }
        }]
    }),
    { monthlyInfra: 100, monthlyOps: 50, totalMonthlyTCO: 150 });

check('computeAppMonthlyTCO({}) = 0/0/0',
    computeAppMonthlyTCO({}),
    { monthlyInfra: 0, monthlyOps: 0, totalMonthlyTCO: 0 });

check('computeAppMonthlyTCO ohne ops',
    computeAppMonthlyTCO({
        analysisResults: [{ tcoEstimate: { consumption: { monthlyEstimate: 100 } } }]
    }),
    { monthlyInfra: 100, monthlyOps: 0, totalMonthlyTCO: 100 });

check('computeAppMonthlyTCO ohne consumption',
    computeAppMonthlyTCO({
        analysisResults: [{ tcoEstimate: { operations: { monthlyPersonnelCost: 50 } } }]
    }),
    { monthlyInfra: 0, monthlyOps: 50, totalMonthlyTCO: 50 });

check('computeAppMonthlyTCO null',
    computeAppMonthlyTCO(null),
    { monthlyInfra: 0, monthlyOps: 0, totalMonthlyTCO: 0 });

// === computeTcoConsumptionBreakdown ===
{
    const tco = {
        consumption: {
            details: [
                { name: 'compute', breakdown: '4 vCPU', estimate: 200 },
                { name: 'storage', estimate: 50 }
            ]
        }
    };
    const r = computeTcoConsumptionBreakdown(tco);
    check('computeTcoConsumptionBreakdown: items.length = 2', r.items.length, 2);
    check('computeTcoConsumptionBreakdown: items[0].text mit breakdown',
        r.items[0].text, 'compute: 4 vCPU');
    check('computeTcoConsumptionBreakdown: items[1].text ohne breakdown',
        r.items[1].text, 'storage');
    check('computeTcoConsumptionBreakdown: sum = 250', r.sum, 250);
}

check('computeTcoConsumptionBreakdown(null) leer',
    computeTcoConsumptionBreakdown(null),
    { items: [], sum: 0 });

check('computeTcoConsumptionBreakdown({}) leer',
    computeTcoConsumptionBreakdown({}),
    { items: [], sum: 0 });

// === computeRatingColors ===
{
    const r = computeRatingColors({ control: 90, performance: 85 });
    check('Colors high (control=90): controlColor = success',
        r.controlColor, 'var(--btc-success)');
    check('Colors high (performance=85): perfColor = success',
        r.perfColor, 'var(--btc-success)');
}

{
    const r = computeRatingColors({ control: 30, performance: 20 });
    check('Colors low (control=30): controlColor = danger',
        r.controlColor, 'var(--btc-danger)');
    check('Colors low (performance=20): perfColor = danger',
        r.perfColor, 'var(--btc-danger)');
}

{
    const r = computeRatingColors({ control: 60, performance: 50 });
    check('Colors mid (control=60): controlColor = warning',
        r.controlColor, 'var(--btc-warning)');
    check('Colors mid (performance=50): perfColor = warning',
        r.perfColor, 'var(--btc-warning)');
}

{
    // Genau Schwellen
    const r = computeRatingColors({ control: 70, performance: 40 });
    check('Colors edge (control=70): success', r.controlColor, 'var(--btc-success)');
    check('Colors edge (performance=40): warning', r.perfColor, 'var(--btc-warning)');
}

{
    // null/undefined → 0 → danger
    const r = computeRatingColors({});
    check('Colors empty: controlColor = danger', r.controlColor, 'var(--btc-danger)');
    check('Colors empty: perfColor = danger', r.perfColor, 'var(--btc-danger)');
}

// === formatRecommendationText ===
check('formatRecommendationText: **bold**',
    formatRecommendationText('**Bold**'),
    '<span class="summary-highlight">Bold</span>');
check('formatRecommendationText: \\n → <br>',
    formatRecommendationText('Line1\nLine2'),
    'Line1<br>Line2');
check('formatRecommendationText: bullet "• "',
    formatRecommendationText('• Item'),
    '<span class="bullet">•</span> Item');
check('formatRecommendationText: kombiniert',
    formatRecommendationText('**Bold**\n• Item'),
    '<span class="summary-highlight">Bold</span><br><span class="bullet">•</span> Item');
check('formatRecommendationText leer = leer',
    formatRecommendationText(''), '');
check('formatRecommendationText nur Plaintext',
    formatRecommendationText('plain text'), 'plain text');

// === formatPortfolioRecommendationText ===
{
    const topProvider = {
        provider: { id: 'aws', name: 'AWS', category: 'hyperscaler' },
        aggregatedScore: 85.5,
        serviceAnalysis: { coverage: 95, missing: [], preview: [] }
    };
    const metrics = { totalApps: 2, totalComponents: 3 };
    const aggTCO = { aws: { totalMonthly: 500 } };
    const fc = (v) => v.toFixed(0);
    const html = formatPortfolioRecommendationText(topProvider, metrics, aggTCO, fc);
    checkTrue('formatPortfolioRecommendation: enthält "AWS"', html.includes('AWS'));
    checkTrue('formatPortfolioRecommendation: enthält Hyperscaler',
        html.includes('Hyperscaler'));
    checkTrue('formatPortfolioRecommendation: enthält Score',
        html.includes('85.5'));
    checkTrue('formatPortfolioRecommendation: <br> für Newlines',
        html.includes('<br>'));
    checkTrue('formatPortfolioRecommendation: <span class="bullet">',
        html.includes('<span class="bullet">'));
    checkTrue('formatPortfolioRecommendation: 95%',
        html.includes('95%'));
}

{
    // Mit fehlenden Services
    const topProvider = {
        provider: { id: 'aws', name: 'AWS', category: 'hyperscaler' },
        aggregatedScore: 70,
        serviceAnalysis: { coverage: 60, missing: ['ai_ml', 'serverless'], preview: ['cdn'] }
    };
    const metrics = { totalApps: 1, totalComponents: 5 };
    const aggTCO = { aws: { totalMonthly: 1000 } };
    const html = formatPortfolioRecommendationText(topProvider, metrics, aggTCO, v => `${v}`);
    checkTrue('formatPortfolioRecommendation mit missing: enthält Hinweis-Text',
        html.includes('fehlend'));
    checkTrue('formatPortfolioRecommendation mit preview: enthält Preview-Hinweis',
        html.includes('Preview'));
}

// === GENERIC_SERVICE_NAMES ===
checkTrue('GENERIC_SERVICE_NAMES ist Object',
    typeof GENERIC_SERVICE_NAMES === 'object');
check('GENERIC_SERVICE_NAMES.compute', GENERIC_SERVICE_NAMES.compute, 'Compute');
check('GENERIC_SERVICE_NAMES.kubernetes', GENERIC_SERVICE_NAMES.kubernetes, 'Kubernetes');
check('GENERIC_SERVICE_NAMES.database_sql',
    GENERIC_SERVICE_NAMES.database_sql, 'SQL Datenbank');
check('GENERIC_SERVICE_NAMES.database_nosql',
    GENERIC_SERVICE_NAMES.database_nosql, 'NoSQL Datenbank');
check('GENERIC_SERVICE_NAMES.storage_object',
    GENERIC_SERVICE_NAMES.storage_object, 'Object Storage');

// === PROVIDER_CATEGORY_NAMES ===
checkTrue('PROVIDER_CATEGORY_NAMES ist Object',
    typeof PROVIDER_CATEGORY_NAMES === 'object');
check('PROVIDER_CATEGORY_NAMES.hyperscaler',
    PROVIDER_CATEGORY_NAMES.hyperscaler, 'Hyperscaler');
check('PROVIDER_CATEGORY_NAMES.sovereign',
    PROVIDER_CATEGORY_NAMES.sovereign, 'Souveräne Cloud');
check('PROVIDER_CATEGORY_NAMES.eu',
    PROVIDER_CATEGORY_NAMES.eu, 'EU-Anbieter');

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
