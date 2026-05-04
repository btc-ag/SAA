#!/usr/bin/env node
/**
 * Daten-Integritäts-Smoke-Tests für saa-data.js.
 * Stellt sicher, dass Provider-/Component-/Pattern-Listen vollständig sind.
 */

import {
    cloudProviders,
    architectureComponents,
    selfBuildOptions,
    architectureModes,
    deploymentPatterns
} from '../js/saa-data.js';

let pass = 0, fail = 0;
function check(name, actual, expected) {
    const ok = JSON.stringify(actual) === JSON.stringify(expected);
    if (ok) { console.log(`✓ ${name}`); pass++; }
    else    { console.log(`✗ ${name}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`); fail++; }
}
function checkTrue(name, value) { check(name, value === true, true); }

// === Cloud Providers ===
check('cloudProviders.length === 10', cloudProviders.length, 10);

const providerIds = cloudProviders.map(p => p.id).sort();
const expectedProviderIds = ['aws', 'aws-sovereign', 'azure', 'delos', 'gcp', 'ionos', 'openstack', 'otc', 'sap-ci', 'stackit'];
check('Provider IDs vollständig', providerIds, expectedProviderIds);

// Erwartete Service-Categories — alle 10 Provider müssen 22 Service-Slots haben
const expectedServiceCategories = [
    'compute', 'kubernetes', 'serverless',
    'database_sql', 'database_nosql',
    'storage_object', 'storage_block', 'storage_file',
    'loadbalancer', 'cdn', 'dns',
    'messaging', 'cache', 'container_registry',
    'secrets', 'monitoring', 'logging',
    'ai_ml', 'identity',
    'static_hosting', 'app_service', 'api_gateway'
];

for (const provider of cloudProviders) {
    const serviceKeys = Object.keys(provider.services);
    check(`${provider.id}: hat 22 Service-Categories`, serviceKeys.length, 22);
    const missing = expectedServiceCategories.filter(s => !(s in provider.services));
    check(`${provider.id}: keine fehlenden Service-Categories`, missing, []);
    checkTrue(`${provider.id}: hat name`, typeof provider.name === 'string' && provider.name.length > 0);
    checkTrue(`${provider.id}: hat numerischen control-Score`, typeof provider.control === 'number');
    checkTrue(`${provider.id}: hat numerischen performance-Score`, typeof provider.performance === 'number');
    checkTrue(`${provider.id}: control in [0,100]`, provider.control >= 0 && provider.control <= 100);
    checkTrue(`${provider.id}: performance in [0,100]`, provider.performance >= 0 && provider.performance <= 100);
    checkTrue(`${provider.id}: hat category`, typeof provider.category === 'string');
}

// === Architecture Components ===
checkTrue('architectureComponents ist Array', Array.isArray(architectureComponents));
checkTrue('architectureComponents.length > 5', architectureComponents.length > 5);

const componentIds = architectureComponents.map(c => c.id);
for (const expected of ['compute', 'kubernetes', 'database_sql', 'database_nosql', 'storage_object']) {
    checkTrue(`architectureComponents enthält "${expected}"`, componentIds.includes(expected));
}

// Jede Komponente hat id, name, requiredServices
for (const comp of architectureComponents) {
    checkTrue(`Component ${comp.id}: hat name`, typeof comp.name === 'string' && comp.name.length > 0);
    checkTrue(`Component ${comp.id}: hat requiredServices Array`, Array.isArray(comp.requiredServices));
}

// === selfBuildOptions ===
checkTrue('selfBuildOptions ist Object', typeof selfBuildOptions === 'object' && selfBuildOptions !== null);
checkTrue('selfBuildOptions.serverless existiert', selfBuildOptions.serverless !== undefined);
checkTrue('selfBuildOptions.cdn existiert', selfBuildOptions.cdn !== undefined);
checkTrue('selfBuildOptions.serverless hat name', typeof selfBuildOptions.serverless?.name === 'string');
checkTrue('selfBuildOptions.serverless hat projectDays', typeof selfBuildOptions.serverless?.projectDays === 'number');

// === architectureModes ===
checkTrue('architectureModes hat cloud_native', architectureModes.cloud_native !== undefined);
checkTrue('architectureModes hat classic', architectureModes.classic !== undefined);
check('architectureModes.classic.id === "classic"', architectureModes.classic.id, 'classic');
check('architectureModes.cloud_native.id === "cloud_native"', architectureModes.cloud_native.id, 'cloud_native');

// === deploymentPatterns ===
checkTrue('deploymentPatterns ist Object', typeof deploymentPatterns === 'object');
const patternIds = Object.keys(deploymentPatterns);
checkTrue('deploymentPatterns hat mind. 5 Einträge', patternIds.length >= 5);

for (const id of patternIds) {
    const p = deploymentPatterns[id];
    checkTrue(`Pattern ${id}: hat name`, typeof p.name === 'string');
    checkTrue(`Pattern ${id}: hat detection Function`, typeof p.detection === 'function');
    checkTrue(`Pattern ${id}: hat cloudNative.operationsFactor`, typeof p.cloudNative?.operationsFactor === 'number');
    checkTrue(`Pattern ${id}: hat classic.operationsFactor`, typeof p.classic?.operationsFactor === 'number');
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
