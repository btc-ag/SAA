#!/usr/bin/env node
/**
 * Smoke-Tests für CloudAnalyzer (analyzeForComponents, calculateTCO, ...).
 * Achtung: loadCustomScores() loggt in Node "Error loading custom scores",
 * weil localStorage nicht existiert. Ist gewollt (try/catch) — wir
 * unterdrücken den Output für saubere Test-Logs.
 */

// Stille ein bekanntes localStorage-Warning beim Constructor unter Node
const origError = console.error;
console.error = (...args) => {
    const msg = String(args[0] || '');
    if (msg.includes('Error loading custom scores')) return;
    return origError(...args);
};

import { CloudAnalyzer } from '../js/saa-analysis.js';
import { cloudProviders, architectureComponents } from '../js/saa-data.js';

let pass = 0, fail = 0;
function check(name, actual, expected) {
    const ok = JSON.stringify(actual) === JSON.stringify(expected);
    if (ok) { console.log(`✓ ${name}`); pass++; }
    else    { console.log(`✗ ${name}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`); fail++; }
}
function checkTrue(name, value)  { check(name, value === true, true); }
function checkRange(name, value, min, max) {
    const ok = typeof value === 'number' && value >= min && value <= max;
    if (ok) { console.log(`✓ ${name} (${value} in [${min},${max}])`); pass++; }
    else    { console.log(`✗ ${name}: ${value} not in [${min},${max}]`); fail++; }
}

const analyzer = new CloudAnalyzer(cloudProviders, architectureComponents);
const standardWeights = { control: 25, performance: 25, availability: 35, cost: 15 };

// === Constructor / Pricing ===
checkTrue('analyzer ist instantiierbar', analyzer instanceof CloudAnalyzer);
checkTrue('analyzer hat providers', Array.isArray(analyzer.providers));
checkTrue('analyzer hat components', Array.isArray(analyzer.components));

const pricingInfo = analyzer.getPricingInfo();
checkTrue('getPricingInfo: hat version', typeof pricingInfo.version === 'string');
checkTrue('getPricingInfo: hat currency', typeof pricingInfo.currency === 'string');

// === Custom Scores (Node hat kein localStorage) ===
const cs = analyzer.loadCustomScores();
check('loadCustomScores in Node = {}', cs, {});
check('hasCustomScores in Node = false', analyzer.hasCustomScores(), false);
check('getEffectiveScore("aws","control",50) = 50 (kein custom)',
    analyzer.getEffectiveScore('aws', 'control', 50), 50);
check('getEffectivePriceFactor("aws") = null (kein custom)',
    analyzer.getEffectivePriceFactor('aws'), null);

// === analyzeForComponents ===
{
    const results = analyzer.analyzeForComponents(['compute']);
    check('analyzeForComponents([compute]).length = 10', results.length, 10);
    for (const r of results) {
        checkTrue(`Result: hat provider`, r.provider !== undefined);
        checkTrue(`Result: hat score-Objekt`, typeof r.score === 'object');
        checkTrue(`Result: hat tcoEstimate`, typeof r.tcoEstimate === 'object');
        checkTrue(`Result: hat serviceAnalysis`, typeof r.serviceAnalysis === 'object');
        checkRange(`Result ${r.provider.id}: score.total in [0,100]`,
            r.score.total, 0, 100);
    }
}

{
    const results = analyzer.analyzeForComponents([]);
    check('analyzeForComponents([]).length = 10', results.length, 10);
}

{
    const results = analyzer.analyzeForComponents(['compute', 'database_sql', 'storage_object']);
    checkTrue('analyzeForComponents(3 services): liefert 10 Provider', results.length === 10);
    checkTrue('Top-Result hat sortierten höchsten Score',
        results[0].score.total >= results[1].score.total);
}

// === getRequiredServices ===
{
    const services = analyzer.getRequiredServices(['compute', 'database_sql']);
    checkTrue('getRequiredServices: liefert Array (Legacy-Verhalten)',
        Array.isArray(services));
    checkTrue('getRequiredServices: enthält "compute"', services.includes('compute'));
    checkTrue('getRequiredServices: enthält "database_sql"', services.includes('database_sql'));
}

{
    const result = analyzer.getRequiredServices(['kubernetes'], 'cloud_native');
    checkTrue('getRequiredServices(mode=cloud_native): hat services',
        Array.isArray(result.services));
    checkTrue('getRequiredServices(mode=cloud_native): hat pattern',
        result.pattern !== undefined);
    checkTrue('getRequiredServices(mode=cloud_native): hat transformation',
        typeof result.transformation === 'object');
}

// === analyzeProviderServices ===
{
    const aws = cloudProviders.find(p => p.id === 'aws');
    const sa = analyzer.analyzeProviderServices(aws, ['compute', 'database_sql']);
    checkTrue('analyzeProviderServices: hat available', Array.isArray(sa.available));
    checkTrue('analyzeProviderServices: hat preview', Array.isArray(sa.preview));
    checkTrue('analyzeProviderServices: hat missing', Array.isArray(sa.missing));
    checkRange('AWS analyze: coverage in [0,100]', sa.coverage, 0, 100);
    check('AWS analyze: totalRequired = 2', sa.totalRequired, 2);
}

// === calculateTCO ===
{
    const aws = cloudProviders.find(p => p.id === 'aws');
    const sa = analyzer.analyzeProviderServices(aws, ['compute']);
    const tco = analyzer.calculateTCO(aws, sa, ['compute']);
    checkTrue('calculateTCO: hat consumption', typeof tco.consumption === 'object');
    checkTrue('calculateTCO: hat operations', typeof tco.operations === 'object');
    checkTrue('calculateTCO: hat projectEffort', typeof tco.projectEffort === 'object');
    checkTrue('calculateTCO: hat selfBuild', typeof tco.selfBuild === 'object');
    checkTrue('calculateTCO: hat totalLevel',
        ['low', 'medium', 'high'].includes(tco.totalLevel));
    checkTrue('calculateTCO: monthlyEstimate ≥ 0', tco.monthlyEstimate >= 0);
}

// === calculateTCOLevel ===
{
    const lvl1 = analyzer.calculateTCOLevel(
        { level: 'low' }, { level: 'low' }, { level: 'low' },
        { required: false }, true, true
    );
    check('calculateTCOLevel(all low) = low', lvl1, 'low');

    const lvl2 = analyzer.calculateTCOLevel(
        { level: 'high' }, { level: 'high' }, { level: 'high' },
        { required: false }, true, true
    );
    check('calculateTCOLevel(all high) = high', lvl2, 'high');

    const lvl3 = analyzer.calculateTCOLevel(
        { level: 'medium' }, { level: 'medium' }, { level: 'medium' },
        { required: false }, true, true
    );
    check('calculateTCOLevel(all medium) = medium', lvl3, 'medium');
}

// === calculateProviderScore ===
{
    const aws = cloudProviders.find(p => p.id === 'aws');
    const sa = analyzer.analyzeProviderServices(aws, ['compute']);
    const tco = analyzer.calculateTCO(aws, sa, ['compute']);
    const score = analyzer.calculateProviderScore(aws, sa, tco, standardWeights);
    checkRange('calculateProviderScore.total in [0,100]', score.total, 0, 100);
    checkRange('calculateProviderScore.controlScore in [0,100]',
        score.controlScore, 0, 100);
    checkRange('calculateProviderScore.performanceScore in [0,100]',
        score.performanceScore, 0, 100);
}

// === getConsumptionEstimate ===
{
    const e = analyzer.getConsumptionEstimate('compute', 'medium');
    checkTrue('getConsumptionEstimate: hat cost', typeof e.cost === 'number');
    checkTrue('getConsumptionEstimate: hat source', typeof e.source === 'string');
    checkTrue('getConsumptionEstimate: cost > 0', e.cost > 0);

    const eHigh = analyzer.getConsumptionEstimate('compute', 'high');
    const eLow = analyzer.getConsumptionEstimate('compute', 'low');
    checkTrue('getConsumptionEstimate("compute","high") > "low"',
        eHigh.cost > eLow.cost);
}

// === _estimateCompute ===
{
    const r = analyzer._estimateCompute({
        config: { compute: { cpu: 4, ram: 16 } },
        useRealPricing: false, providerId: 'aws', region: null
    });
    checkTrue('_estimateCompute: hat cost (Number)', typeof r.cost === 'number');
    checkTrue('_estimateCompute: cost > 0', r.cost > 0);
    checkTrue('_estimateCompute: hat breakdown (String)', typeof r.breakdown === 'string');
}

// === _estimateDatabaseSQL ===
{
    const r = analyzer._estimateDatabaseSQL({
        config: { database: { type: 'PostgreSQL', size: '100' } },
        useRealPricing: false, providerId: 'aws', region: null
    });
    checkTrue('_estimateDatabaseSQL: hat cost', typeof r.cost === 'number');
    checkTrue('_estimateDatabaseSQL: cost > 0', r.cost > 0);
}

// === _estimateStorageObject ===
{
    const r = analyzer._estimateStorageObject({
        config: { storage: { size: '500' } },
        useRealPricing: false, providerId: 'aws', region: null
    });
    checkTrue('_estimateStorageObject: hat cost', typeof r.cost === 'number');
    checkTrue('_estimateStorageObject: cost ≥ 0', r.cost >= 0);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
