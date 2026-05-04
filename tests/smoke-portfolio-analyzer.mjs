#!/usr/bin/env node
/**
 * Smoke-Tests für PortfolioAnalyzer.
 */

const origError = console.error;
console.error = (...args) => {
    const msg = String(args[0] || '');
    if (msg.includes('Error loading custom scores')) return;
    return origError(...args);
};

import { PortfolioAnalyzer } from '../js/saa-analysis.js';
import { cloudProviders, architectureComponents } from '../js/saa-data.js';

let pass = 0, fail = 0;
function check(name, actual, expected) {
    const ok = JSON.stringify(actual) === JSON.stringify(expected);
    if (ok) { console.log(`✓ ${name}`); pass++; }
    else    { console.log(`✗ ${name}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`); fail++; }
}
function checkTrue(name, value)  { check(name, value === true, true); }

const pa = new PortfolioAnalyzer(cloudProviders, architectureComponents);
const standardWeights = { control: 25, performance: 25, availability: 35, cost: 15 };

const mockApp1 = {
    id: 'app-1', name: 'App 1',
    selectedComponents: new Set(['compute']),
    systemConfig: null,
    architectureMode: 'classic',
    sizing: 'medium'
};
const mockApp2 = {
    id: 'app-2', name: 'App 2',
    selectedComponents: new Set(['compute', 'database_sql']),
    systemConfig: null,
    architectureMode: 'classic',
    sizing: 'large'
};

// === Constructor ===
checkTrue('pa instantiierbar', pa instanceof PortfolioAnalyzer);
checkTrue('pa.providers', Array.isArray(pa.providers));
checkTrue('pa.components', Array.isArray(pa.components));
checkTrue('pa.analyzer ist CloudAnalyzer', pa.analyzer.constructor.name === 'CloudAnalyzer');

// === analyzePortfolio ===
{
    const r = pa.analyzePortfolio([mockApp1, mockApp2], standardWeights);
    checkTrue('analyzePortfolio: hat perAppResults', Array.isArray(r.perAppResults));
    check('perAppResults.length === 2', r.perAppResults.length, 2);
    checkTrue('perAppResults[0] hat .app', r.perAppResults[0].app !== undefined);
    checkTrue('perAppResults[0] hat .results', Array.isArray(r.perAppResults[0].results));
    check('perAppResults[0].results.length === 10', r.perAppResults[0].results.length, 10);

    checkTrue('aggregatedProviders ist Array', Array.isArray(r.aggregatedProviders));
    check('aggregatedProviders.length === 10', r.aggregatedProviders.length, 10);
    checkTrue('aggregatedProviders[0] hat .provider',
        r.aggregatedProviders[0].provider !== undefined);
    checkTrue('aggregatedProviders[0] hat .aggregatedScore',
        typeof r.aggregatedProviders[0].aggregatedScore === 'number');
    checkTrue('aggregatedProviders[0] hat .serviceAnalysis',
        typeof r.aggregatedProviders[0].serviceAnalysis === 'object');
    checkTrue('aggregatedProviders[0] hat .tcoEstimate',
        typeof r.aggregatedProviders[0].tcoEstimate === 'object');

    checkTrue('aggregatedTCO ist Object', typeof r.aggregatedTCO === 'object');
    check('aggregatedTCO hat alle 10 Provider', Object.keys(r.aggregatedTCO).length, 10);

    const awsT = r.aggregatedTCO['aws'];
    checkTrue('aggregatedTCO.aws hat consumption (monthlyInfrastructure)',
        typeof awsT.monthlyInfrastructure === 'number');
    checkTrue('aggregatedTCO.aws hat operations (monthlyOperations)',
        typeof awsT.monthlyOperations === 'number');
    checkTrue('aggregatedTCO.aws hat projectEffortDays',
        typeof awsT.projectEffortDays === 'number');
    checkTrue('aggregatedTCO.aws hat totalMonthly',
        typeof awsT.totalMonthly === 'number');

    checkTrue('portfolioMetrics ist Object', typeof r.portfolioMetrics === 'object');
    check('portfolioMetrics.totalApps === 2', r.portfolioMetrics.totalApps, 2);
    check('portfolioMetrics.totalComponents === 3', r.portfolioMetrics.totalComponents, 3);
    checkTrue('portfolioMetrics.avgComponentsPerApp ist String',
        typeof r.portfolioMetrics.avgComponentsPerApp === 'string');
    checkTrue('portfolioMetrics.mostCommonComponents ist Array',
        Array.isArray(r.portfolioMetrics.mostCommonComponents));
}

// === analyzeOne ===
{
    const r = pa.analyzeOne(mockApp1, standardWeights);
    checkTrue('analyzeOne: hat perAppResults', Array.isArray(r.perAppResults));
    check('analyzeOne: perAppResults.length === 1', r.perAppResults.length, 1);
    check('analyzeOne: portfolioMetrics.totalApps === 1', r.portfolioMetrics.totalApps, 1);
    check('analyzeOne: aggregatedProviders.length === 10', r.aggregatedProviders.length, 10);
}

// === aggregateProviderScores direkt aufrufbar ===
{
    const appResults = [{
        app: mockApp1,
        results: pa.analyzer.analyzeForComponents(['compute'], standardWeights, null, null, null, null, {mode:'classic'})
    }];
    const aggregated = pa.aggregateProviderScores(appResults);
    checkTrue('aggregateProviderScores: liefert Array', Array.isArray(aggregated));
    check('aggregateProviderScores: 10 Provider', aggregated.length, 10);
    checkTrue('aggregateProviderScores: sortiert nach aggregatedScore',
        aggregated[0].aggregatedScore >= aggregated[aggregated.length - 1].aggregatedScore);
}

// === aggregateTCO direkt aufrufbar ===
{
    const appResults = [{
        app: mockApp1,
        results: pa.analyzer.analyzeForComponents(['compute'], standardWeights, null, null, null, null, {mode:'classic'})
    }];
    const tco = pa.aggregateTCO(appResults);
    checkTrue('aggregateTCO: hat aws-Eintrag', tco.aws !== undefined);
    checkTrue('aggregateTCO.aws.totalMonthly ≥ 0', tco.aws.totalMonthly >= 0);
}

// === calculatePortfolioMetrics direkt aufrufbar ===
{
    const appResults = [
        { app: mockApp1, results: [] },
        { app: mockApp2, results: [] }
    ];
    const m = pa.calculatePortfolioMetrics(appResults);
    check('calculatePortfolioMetrics: totalApps = 2', m.totalApps, 2);
    check('calculatePortfolioMetrics: totalComponents = 3', m.totalComponents, 3);
    checkTrue('calculatePortfolioMetrics: mostCommonComponents Array',
        Array.isArray(m.mostCommonComponents));
}

// === Sortierung nach aggregatedScore ===
{
    const r = pa.analyzePortfolio([mockApp1, mockApp2], standardWeights);
    let sorted = true;
    for (let i = 0; i < r.aggregatedProviders.length - 1; i++) {
        if (r.aggregatedProviders[i].aggregatedScore < r.aggregatedProviders[i+1].aggregatedScore) {
            sorted = false; break;
        }
    }
    checkTrue('analyzePortfolio: aggregatedProviders absteigend sortiert', sorted);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
