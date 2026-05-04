#!/usr/bin/env node
/**
 * Module-Smoke-Test: Alle SAA-Module laden, ihre Exports verifizieren.
 * Schlägt fehl bei: Syntax-Fehlern, fehlenden Imports, geänderten Export-Listen.
 */

const expectedExports = [
    { module: '../js/modules/sovereignty-engine.js',
      exports: ['SOV_WEIGHTS', 'SOV8_EXPERT_SCORES', 'aggregateProviderSovScores', 'calculateControlFromSov', 'getC3AAdjustedControl'] },
    { module: '../js/modules/c3a-framework.js',
      exports: ['C3A_RESULTS', 'C3A_RESULT_SCORE', 'C3A_CRITERIA', 'aggregateC3A', 'getCriteriaBySov', 'C3A_VERSION', 'C3A_PUBLISHED', 'C3A_SOURCE'] },
    { module: '../js/modules/sov7-compliance.js',
      exports: ['SOV7_CRITERIA', 'SOV7_RESULT_SCORE', 'aggregateSov7', 'SOV7_VERSION', 'SOV7_PUBLISHED'] },
    { module: '../js/modules/audit-mode.js',
      exports: ['getAuditMode', 'setAuditMode'] },
    { module: '../js/modules/application-instance.js',
      exports: ['ApplicationInstance'] },
    { module: '../js/modules/application-matcher.js',
      exports: ['ApplicationMatcher'] },
    { module: '../js/modules/sizing-detector.js',
      exports: ['SizingDetector'] },
    { module: '../js/modules/deployment-pattern.js',
      exports: ['detectDeploymentPattern'] },
    { module: '../js/modules/provider-service-mapping.js',
      exports: ['PROVIDER_NOSQL_LOOKUP', 'getNosqlServiceKey'] },
    { module: '../js/modules/multi-app-parser.js',
      exports: ['parseApplicationList', 'parseStorageSize', 'parseDBSize'] }, // mind. diese 3
    { module: '../js/modules/results-compute.js',
      exports: ['computeAppMonthlyTCO', 'formatRecommendationText'] }, // mind. diese 2
    { module: '../js/saa-data.js',
      exports: ['cloudProviders', 'architectureComponents', 'selfBuildOptions', 'architectureModes', 'deploymentPatterns'] },
    { module: '../js/saa-analysis.js',
      exports: ['CloudAnalyzer', 'PortfolioAnalyzer', 'ApplicationResearcher'] }
];

let pass = 0, fail = 0;
for (const { module, exports: expected } of expectedExports) {
    try {
        const m = await import(new URL(module, import.meta.url).href);
        const missing = expected.filter(e => !(e in m));
        if (missing.length === 0) {
            console.log(`✓ ${module}: ${expected.length} exports OK`);
            pass++;
        } else {
            console.log(`✗ ${module}: missing exports [${missing.join(', ')}]`);
            fail++;
        }
    } catch (e) {
        console.log(`✗ ${module}: load failed — ${e.message}`);
        fail++;
    }
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
