#!/usr/bin/env node
/**
 * Pure-Function-Smoke-Tests für extrahierte Helper-Module.
 */

import { parseStorageSize, parseDBSize, formatVMTypeName, levenshteinDistance, calculateSimilarity }
    from '../js/modules/multi-app-parser.js';
import { getNosqlServiceKey, PROVIDER_NOSQL_LOOKUP }
    from '../js/modules/provider-service-mapping.js';
import { calculateControlFromSov }
    from '../js/modules/sovereignty-engine.js';
import { aggregateC3A } from '../js/modules/c3a-framework.js';
import { ApplicationInstance } from '../js/modules/application-instance.js';

let pass = 0, fail = 0;
function check(name, actual, expected) {
    const ok = JSON.stringify(actual) === JSON.stringify(expected);
    if (ok) { console.log(`✓ ${name}`); pass++; }
    else    { console.log(`✗ ${name}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`); fail++; }
}

// parseStorageSize
check('parseStorageSize("2TB") = 2048', parseStorageSize('2TB'), 2048);
check('parseStorageSize("500GB") = 500', parseStorageSize('500GB'), 500);
check('parseStorageSize(undefined) = 500', parseStorageSize(undefined), 500);

// parseDBSize
check('parseDBSize("1TB") = 1024', parseDBSize('1TB'), 1024);
check('parseDBSize("100GB") = 100', parseDBSize('100GB'), 100);

// formatVMTypeName: splits camelCase and uppercases db/sql/vm/ha/web/app tokens
check('formatVMTypeName("appTier") = "APP Tier"', formatVMTypeName('appTier'), 'APP Tier');
check('formatVMTypeName("dbServer") = "DB Server"', formatVMTypeName('dbServer'), 'DB Server');
check('formatVMTypeName("webFrontend") = "WEB Frontend"', formatVMTypeName('webFrontend'), 'WEB Frontend');

// levenshteinDistance
check('levenshteinDistance("foo", "bar") = 3', levenshteinDistance('foo', 'bar'), 3);
check('levenshteinDistance("kitten", "sitting") = 3', levenshteinDistance('kitten', 'sitting'), 3);
check('levenshteinDistance("same", "same") = 0', levenshteinDistance('same', 'same'), 0);

// calculateSimilarity (1 - levenshtein/maxlen)
check('calculateSimilarity("foo", "foo") = 1', calculateSimilarity('foo', 'foo'), 1);

// getNosqlServiceKey
check('getNosqlServiceKey("aws", "DynamoDB") = "dynamodb"', getNosqlServiceKey('aws', 'DynamoDB'), 'dynamodb');
check('getNosqlServiceKey("azure", "Cosmos DB") = "cosmosdb"', getNosqlServiceKey('azure', 'Cosmos DB'), 'cosmosdb');
check('getNosqlServiceKey("gcp", "Firestore") = "firestore"', getNosqlServiceKey('gcp', 'Firestore'), 'firestore');
check('getNosqlServiceKey("aws", "MongoDB") = null', getNosqlServiceKey('aws', 'MongoDB'), null);
check('getNosqlServiceKey("ionos", "DynamoDB") = null', getNosqlServiceKey('ionos', 'DynamoDB'), null);

// calculateControlFromSov
check('calculateControlFromSov(perfect) = 100', calculateControlFromSov({sov1:100,sov2:100,sov3:100,sov4:100,sov5:100,sov6:100,sov7:100,sov8:100}), 100);
check('calculateControlFromSov(zero) = 0', calculateControlFromSov({sov1:0,sov2:0,sov3:0,sov4:0,sov5:0,sov6:0,sov7:0,sov8:0}), 0);
check('calculateControlFromSov(null) = 0', calculateControlFromSov(null), 0);

// === ApplicationInstance Architecture-Mode-API ===
{
    const app = new ApplicationInstance(null, 'Test');
    check('app.hasArchitectureSnapshot() initially = false', app.hasArchitectureSnapshot(), false);
    check('app.getArchitectureSnapshot() initially = null', app.getArchitectureSnapshot(), null);

    // Snapshot mit Komponenten
    app.selectedComponents.add('compute');
    app.componentConfigs['compute'] = { vCPU: 2 };
    app.snapshotArchitecture();
    check('app.hasArchitectureSnapshot() after snapshot = true', app.hasArchitectureSnapshot(), true);

    // Manuelle User-Änderungen nach Snapshot → Delta
    app.selectedComponents.add('database_sql');
    app.recordArchitectureChange('database_sql', 'add');

    // Reset stellt Snapshot wieder her, verwirft Delta
    app.resetArchitecture();
    check('app.selectedComponents after reset = ["compute"]',
        [...app.selectedComponents].sort(), ['compute']);
    check('app.componentConfigs.compute after reset = {vCPU:2}',
        app.componentConfigs.compute, { vCPU: 2 });

    // applyArchitectureDelta: Transform liefert {compute,serverless}, Delta wieder hinzu
    app.recordArchitectureChange('database_sql', 'add');
    app.applyArchitectureDelta((origComponents, origConfigs) => {
        const components = new Set(origComponents);
        components.add('serverless');
        return { components, configs: { ...origConfigs } };
    });
    check('applyArchitectureDelta merges transform + delta (added)',
        [...app.selectedComponents].sort(), ['compute', 'database_sql', 'serverless']);

    // recordArchitectureChange config: Delta-Config überschreibt Transform-Config
    const app2 = new ApplicationInstance(null, 'Test2');
    app2.selectedComponents.add('compute');
    app2.componentConfigs['compute'] = { vCPU: 2 };
    app2.snapshotArchitecture();
    app2.recordArchitectureChange('compute', 'config', { vCPU: 8 });
    app2.applyArchitectureDelta((origComponents, origConfigs) => ({
        components: new Set(origComponents),
        configs: { ...origConfigs }
    }));
    check('recordArchitectureChange config persists through applyDelta',
        app2.componentConfigs.compute.vCPU, 8);

    // recordArchitectureChange ohne Snapshot ist No-Op
    const app3 = new ApplicationInstance(null, 'Test3');
    app3.recordArchitectureChange('compute', 'add');
    check('recordArchitectureChange w/o snapshot = no-op (still false)',
        app3.hasArchitectureSnapshot(), false);

    // Privacy: _archOriginal/_archDelta nicht von außen lesbar
    check('app._archOriginal not accessible from outside',
        app._archOriginal, undefined);
    check('app._archDelta not accessible from outside',
        app._archDelta, undefined);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
