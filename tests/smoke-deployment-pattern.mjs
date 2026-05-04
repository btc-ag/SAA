#!/usr/bin/env node
/**
 * Smoke-Tests für detectDeploymentPattern.
 */

import { detectDeploymentPattern } from '../js/modules/deployment-pattern.js';

let pass = 0, fail = 0;
function check(name, actual, expected) {
    const ok = JSON.stringify(actual) === JSON.stringify(expected);
    if (ok) { console.log(`✓ ${name}`); pass++; }
    else    { console.log(`✗ ${name}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`); fail++; }
}
function checkTrue(name, value)  { check(name, value === true, true); }

// === Static Website ===
{
    const r = detectDeploymentPattern(['storage_object', 'cdn']);
    checkTrue('storage_object+cdn → Pattern erkannt', r !== null);
    check('storage_object+cdn → static_website', r?.id, 'static_website');
}

// === Web-Application ===
{
    const r = detectDeploymentPattern(['compute', 'database_sql']);
    check('compute+database_sql → web_application', r?.id, 'web_application');
    checkTrue('web_application: hat name', typeof r?.name === 'string');
    checkTrue('web_application: hat cloudNative', typeof r?.cloudNative === 'object');
    checkTrue('web_application: hat classic', typeof r?.classic === 'object');
}

// === API/Microservices ===
{
    const r = detectDeploymentPattern(['serverless']);
    check('serverless → api_service', r?.id, 'api_service');
}

{
    const r = detectDeploymentPattern(['compute', 'messaging']);
    check('compute+messaging → api_service', r?.id, 'api_service');
}

// === Container Workload ===
{
    const r = detectDeploymentPattern(['kubernetes']);
    check('kubernetes → container_workload', r?.id, 'container_workload');
    check('container_workload: cloudNative.operationsFactor = 0.5',
        r?.cloudNative.operationsFactor, 0.5);
    check('container_workload: classic.operationsFactor = 1.2',
        r?.classic.operationsFactor, 1.2);
}

// === Database-Centric ===
{
    const r = detectDeploymentPattern(['database_sql']);
    check('database_sql allein → database_centric', r?.id, 'database_centric');
}

{
    const r = detectDeploymentPattern(['database_nosql']);
    check('database_nosql allein → database_centric', r?.id, 'database_centric');
}

// === Enterprise/Legacy via appId ===
{
    const r = detectDeploymentPattern(['compute'], 'sap-s4hana');
    check('compute+appId=sap-s4hana → enterprise_legacy', r?.id, 'enterprise_legacy');
}

{
    const r = detectDeploymentPattern(['compute'], 'oracle-ebs');
    check('compute+appId=oracle-ebs → enterprise_legacy', r?.id, 'enterprise_legacy');
}

// === Enterprise/Legacy via Storage-Komponenten ===
{
    const r = detectDeploymentPattern(['compute', 'storage_block', 'storage_file']);
    check('compute+storage_block+storage_file → enterprise_legacy', r?.id, 'enterprise_legacy');
}

// === Edge Cases ===
{
    const r = detectDeploymentPattern([]);
    check('empty array → null', r, null);
}

{
    const r = detectDeploymentPattern(['unknown_xyz']);
    check('unknown component → null', r, null);
}

// === Pattern-Output-Shape ===
{
    const r = detectDeploymentPattern(['kubernetes']);
    checkTrue('Pattern hat id', typeof r?.id === 'string');
    checkTrue('Pattern hat name', typeof r?.name === 'string');
    checkTrue('Pattern hat description', typeof r?.description === 'string');
    checkTrue('Pattern hat detection function', typeof r?.detection === 'function');
    checkTrue('Pattern.cloudNative hat operationsFactor',
        typeof r?.cloudNative?.operationsFactor === 'number');
    checkTrue('Pattern.classic hat operationsFactor',
        typeof r?.classic?.operationsFactor === 'number');
    checkTrue('Pattern.cloudNative.operationsFactor in [0,2]',
        r?.cloudNative?.operationsFactor >= 0 && r?.cloudNative?.operationsFactor <= 2);
}

// === Reihenfolge: Spezifischere Patterns zuerst ===
// Kubernetes hat Vorrang vor Web-Application (auch wenn db_sql dabei wäre)
{
    const r = detectDeploymentPattern(['compute', 'database_sql', 'kubernetes']);
    // web_application detection: !hasK8s → false; container_workload triggert
    check('compute+db_sql+kubernetes → container_workload (k8s dominiert)',
        r?.id, 'container_workload');
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
