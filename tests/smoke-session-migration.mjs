#!/usr/bin/env node
/**
 * Smoke-Tests für migrateLegacySessionState (saa-state.js).
 */

import { migrateLegacySessionState } from '../js/modules/saa-state.js';

let pass = 0, fail = 0;
function check(name, actual, expected) {
    const ok = JSON.stringify(actual) === JSON.stringify(expected);
    if (ok) { console.log(`✓ ${name}`); pass++; }
    else    { console.log(`✗ ${name}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`); fail++; }
}
function checkTrue(name, value)  { check(name, value === true, true); }
function checkFalse(name, value) { check(name, value === false, true); }

// === Edge Cases ===
check('migrate(null) = null', migrateLegacySessionState(null), null);
check('migrate(undefined) = undefined', migrateLegacySessionState(undefined), undefined);

// Leerer State (kein legacy, keine applications) → unverändert
{
    const r = migrateLegacySessionState({});
    check('migrate({}) = {}', r, {});
}

// === Bereits migrierter State (applications-Array vorhanden) ===
{
    const already = {
        applications: [{ name: 'A' }],
        currentAppIndex: 0,
        isMultiAppMode: false
    };
    const r = migrateLegacySessionState(already);
    checkTrue('migrate(bereits-migriert): unverändert', r === already);
    check('migrate(bereits-migriert): applications.length',
        r.applications.length, 1);
}

// === Legacy Single-App: vollständige Migration ===
{
    const legacy = {
        currentStep: 2,
        selectedComponents: ['compute', 'database_sql'],
        componentConfigs: { compute: { vCPU: 4 } },
        applicationData: { name: 'My App' },
        analysisResults: [{ score: 80 }],
        selectedSizing: 'large',
        systemConfig: { foo: 'bar' }
    };
    const r = migrateLegacySessionState(legacy);
    checkTrue('migrate(legacy): hat applications-Array',
        Array.isArray(r.applications));
    check('migrate(legacy): applications.length = 1', r.applications.length, 1);
    check('migrate(legacy): currentAppIndex = 0', r.currentAppIndex, 0);
    check('migrate(legacy): isMultiAppMode = false', r.isMultiAppMode, false);
    check('migrate(legacy): currentStep übernommen', r.currentStep, 2);
    check('migrate(legacy): aggregatedResults = null', r.aggregatedResults, null);

    const app = r.applications[0];
    check('migrate(legacy): applications[0].sizing = large', app.sizing, 'large');
    check('migrate(legacy): applications[0].name', app.name, 'My App');
    check('migrate(legacy): applications[0].componentConfigs.compute.vCPU = 4',
        app.componentConfigs.compute.vCPU, 4);
    check('migrate(legacy): applications[0].systemConfig.foo = bar',
        app.systemConfig.foo, 'bar');
    check('migrate(legacy): applications[0].analysisResults.length = 1',
        app.analysisResults.length, 1);

    // selectedComponents wird zu Set in der ApplicationInstance
    checkTrue('migrate(legacy): selectedComponents ist Set',
        app.selectedComponents instanceof Set);
    check('migrate(legacy): selectedComponents enthält compute+db_sql',
        [...app.selectedComponents].sort(), ['compute', 'database_sql']);
}

// === Legacy mit nur componentConfigs (selectedComponents fehlt) ===
{
    const legacy = {
        componentConfigs: { compute: { vCPU: 2 } }
    };
    const r = migrateLegacySessionState(legacy);
    checkTrue('migrate(nur componentConfigs): erzeugt applications',
        Array.isArray(r.applications) && r.applications.length === 1);
    check('migrate(nur componentConfigs): config übernommen',
        r.applications[0].componentConfigs.compute.vCPU, 2);
}

// === Legacy mit nur applicationData ===
{
    const legacy = { applicationData: { name: 'Wiki', description: 'X' } };
    const r = migrateLegacySessionState(legacy);
    check('migrate(nur appData): name = Wiki',
        r.applications[0].name, 'Wiki');
    check('migrate(nur appData): applicationData übernommen',
        r.applications[0].applicationData.description, 'X');
}

// === Legacy mit selectedComponents als leeres Array ===
{
    const legacy = { selectedComponents: [] };
    const r = migrateLegacySessionState(legacy);
    checkTrue('migrate(empty selectedComponents): liefert applications',
        Array.isArray(r.applications));
    check('migrate(empty selectedComponents): Set leer',
        r.applications[0].selectedComponents.size, 0);
}

// === Legacy mit nur analysisResults ===
{
    const legacy = { analysisResults: [{ score: 90 }] };
    const r = migrateLegacySessionState(legacy);
    check('migrate(analysisResults): in app[0]',
        r.applications[0].analysisResults[0].score, 90);
}

// === Default-Sizing wenn nicht angegeben ===
{
    const legacy = { selectedComponents: ['compute'] };
    const r = migrateLegacySessionState(legacy);
    check('migrate ohne selectedSizing: default = medium',
        r.applications[0].sizing, 'medium');
}

// === Top-Level-Felder werden NICHT mehr beibehalten (wandern in app) ===
{
    const legacy = {
        selectedComponents: ['compute'],
        componentConfigs: { compute: {} }
    };
    const r = migrateLegacySessionState(legacy);
    check('migrate: kein _selectedComponents mehr top-level',
        r.selectedComponents, undefined);
    check('migrate: kein _componentConfigs mehr top-level',
        r.componentConfigs, undefined);
    check('migrate: kein _applicationData mehr top-level',
        r.applicationData, undefined);
}

// === currentStep mit numerischem Wert wird übernommen ===
{
    const legacy = { selectedComponents: [], currentStep: 3 };
    const r = migrateLegacySessionState(legacy);
    check('migrate: currentStep = 3 übernommen', r.currentStep, 3);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
