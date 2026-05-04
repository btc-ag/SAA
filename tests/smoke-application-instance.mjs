#!/usr/bin/env node
/**
 * Smoke-Tests für ApplicationInstance:
 * Constructor, generateUUID, fromCurrentState, Architecture-Snapshot/Delta-API,
 * Privacy der internen Felder.
 */

import { ApplicationInstance } from '../js/modules/application-instance.js';

let pass = 0, fail = 0;
function check(name, actual, expected) {
    const ok = JSON.stringify(actual) === JSON.stringify(expected);
    if (ok) { console.log(`✓ ${name}`); pass++; }
    else    { console.log(`✗ ${name}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`); fail++; }
}
function checkTrue(name, value)  { check(name, value === true, true); }
function checkFalse(name, value) { check(name, value === false, true); }

// === Constructor mit Defaults ===
{
    const app = new ApplicationInstance(null, 'TestApp');
    checkTrue('Constructor: id automatisch generiert', typeof app.id === 'string' && app.id.length > 0);
    check('Constructor: name', app.name, 'TestApp');
    check('Constructor: type === null', app.type, null);
    check('Constructor: sizing === medium (default)', app.sizing, 'medium');
    checkTrue('Constructor: selectedComponents ist Set', app.selectedComponents instanceof Set);
    check('Constructor: selectedComponents.size === 0', app.selectedComponents.size, 0);
    check('Constructor: componentConfigs ist {}', app.componentConfigs, {});
    check('Constructor: componentInstances ist {}', app.componentInstances, {});
    check('Constructor: applicationData === null', app.applicationData, null);
    check('Constructor: analysisResults === null', app.analysisResults, null);
    check('Constructor: isCustom === true (type=null)', app.isCustom, true);
    check('Constructor: architectureMode === "classic"', app.architectureMode, 'classic');
    check('Constructor: systemConfig === null', app.systemConfig, null);
}

// === Constructor mit explizitem id und type ===
{
    const app = new ApplicationInstance('my-id-42', 'X', 'wordpress', 'large');
    check('Constructor: explizite id übernommen', app.id, 'my-id-42');
    check('Constructor: explizite type', app.type, 'wordpress');
    check('Constructor: explizite sizing', app.sizing, 'large');
    checkFalse('Constructor: isCustom === false bei type !== null', app.isCustom);
}

// === generateUUID ===
{
    const app = new ApplicationInstance(null, 'X');
    const u1 = app.generateUUID();
    const u2 = app.generateUUID();
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
    checkTrue('generateUUID(): Format v4 valide', uuidRegex.test(u1));
    checkTrue('generateUUID(): zwei aufeinanderfolgende UUIDs unterschiedlich', u1 !== u2);
    checkTrue('generateUUID(): String', typeof u1 === 'string');
}

// === fromCurrentState ===
{
    // Legacy-Single-App-State
    const legacyState = {
        selectedComponents: new Set(['compute', 'database_sql']),
        componentConfigs: { compute: { vCPU: 4 } },
        componentInstances: { compute: { id: 'c1' } },
        systemConfig: { foo: 'bar' },
        applicationData: { name: 'My App' },
        analysisResults: [{ score: 80 }],
        selectedSizing: 'large'
    };
    const inst = ApplicationInstance.fromCurrentState(legacyState);
    checkTrue('fromCurrentState: ist ApplicationInstance', inst instanceof ApplicationInstance);
    check('fromCurrentState: selectedComponents (Set)', [...inst.selectedComponents].sort(), ['compute', 'database_sql']);
    check('fromCurrentState: componentConfigs gespreaded', inst.componentConfigs.compute.vCPU, 4);
    check('fromCurrentState: sizing = large', inst.sizing, 'large');
    check('fromCurrentState: applicationData.name', inst.applicationData.name, 'My App');
    check('fromCurrentState: name = applicationData.name', inst.name, 'My App');
    check('fromCurrentState: systemConfig.foo', inst.systemConfig.foo, 'bar');
    check('fromCurrentState: analysisResults.length', inst.analysisResults.length, 1);
}

{
    // Leerer State → defaults
    const inst = ApplicationInstance.fromCurrentState({});
    checkTrue('fromCurrentState({}): liefert Instance', inst instanceof ApplicationInstance);
    check('fromCurrentState({}): sizing default = medium', inst.sizing, 'medium');
    check('fromCurrentState({}): name default = "Anwendung 1"', inst.name, 'Anwendung 1');
    check('fromCurrentState({}): selectedComponents leer', inst.selectedComponents.size, 0);
    check('fromCurrentState({}): componentConfigs leer', inst.componentConfigs, {});
}

// === Architecture-API: hasArchitectureSnapshot / getArchitectureSnapshot ===
{
    const app = new ApplicationInstance(null, 'A');
    check('hasArchitectureSnapshot() initial = false', app.hasArchitectureSnapshot(), false);
    check('getArchitectureSnapshot() initial = null', app.getArchitectureSnapshot(), null);
}

// === snapshotArchitecture ===
{
    const app = new ApplicationInstance(null, 'A');
    app.selectedComponents.add('compute');
    app.componentConfigs['compute'] = { vCPU: 2 };
    app.snapshotArchitecture();
    check('snapshotArchitecture: hasSnapshot = true', app.hasArchitectureSnapshot(), true);

    const snap = app.getArchitectureSnapshot();
    checkTrue('Snapshot: selectedComponents als Set', snap.selectedComponents instanceof Set);
    check('Snapshot: enthält compute', [...snap.selectedComponents], ['compute']);
    check('Snapshot: componentConfigs.compute.vCPU = 2', snap.componentConfigs.compute.vCPU, 2);

    // Defensiv-Kopie: Mutation am Snapshot darf interne Daten nicht ändern
    snap.selectedComponents.add('serverless');
    snap.componentConfigs.compute.vCPU = 999;
    const snap2 = app.getArchitectureSnapshot();
    check('Snapshot ist Defensiv-Kopie: components',
        [...snap2.selectedComponents].sort(), ['compute']);
    check('Snapshot ist Defensiv-Kopie: configs', snap2.componentConfigs.compute.vCPU, 2);
}

// === recordArchitectureChange ohne Snapshot = no-op ===
{
    const app = new ApplicationInstance(null, 'A');
    app.recordArchitectureChange('compute', 'add');
    check('recordArchitectureChange ohne Snapshot: hasSnapshot bleibt false',
        app.hasArchitectureSnapshot(), false);
}

// === recordArchitectureChange add/remove/config ===
{
    const app = new ApplicationInstance(null, 'A');
    app.selectedComponents.add('compute');
    app.snapshotArchitecture();

    // add
    app.recordArchitectureChange('database_sql', 'add');
    app.applyArchitectureDelta((origC, origCfg) => ({
        components: new Set(origC),
        configs: { ...origCfg }
    }));
    check('recordChange add → applyDelta: database_sql ergänzt',
        [...app.selectedComponents].sort(), ['compute', 'database_sql']);

    // add + remove kombiniert (gleiche ID): nach erstem add, dann remove → weg
    app.recordArchitectureChange('database_sql', 'remove');
    app.applyArchitectureDelta((origC, origCfg) => ({
        components: new Set(origC),
        configs: { ...origCfg }
    }));
    check('recordChange remove nach add: wieder nur compute',
        [...app.selectedComponents].sort(), ['compute']);
}

// === recordArchitectureChange config persistiert ===
{
    const app = new ApplicationInstance(null, 'A');
    app.selectedComponents.add('compute');
    app.componentConfigs['compute'] = { vCPU: 2 };
    app.snapshotArchitecture();

    app.recordArchitectureChange('compute', 'config', { vCPU: 8, ram: 32 });
    app.applyArchitectureDelta((origC, origCfg) => ({
        components: new Set(origC),
        configs: { ...origCfg }
    }));
    check('recordChange config: vCPU = 8 (überschreibt Snapshot)',
        app.componentConfigs.compute.vCPU, 8);
    check('recordChange config: ram = 32 (zusätzlich)',
        app.componentConfigs.compute.ram, 32);
}

// === resetArchitecture ===
{
    const app = new ApplicationInstance(null, 'A');
    app.selectedComponents.add('compute');
    app.componentConfigs['compute'] = { vCPU: 2 };
    app.snapshotArchitecture();

    // Manuelle Mutation
    app.selectedComponents.add('database_sql');
    app.recordArchitectureChange('database_sql', 'add');
    app.componentConfigs['compute'].vCPU = 99;
    app.recordArchitectureChange('compute', 'config', { vCPU: 99 });

    app.resetArchitecture();
    check('resetArchitecture: components zurück',
        [...app.selectedComponents].sort(), ['compute']);
    check('resetArchitecture: configs.compute.vCPU = 2 wieder',
        app.componentConfigs.compute.vCPU, 2);

    // Nach Reset: Delta leer → applyDelta liefert nur Transform-Result
    app.applyArchitectureDelta((origC, origCfg) => ({
        components: new Set(origC),
        configs: { ...origCfg }
    }));
    check('resetArchitecture: applyDelta nach Reset = nur Transform',
        [...app.selectedComponents].sort(), ['compute']);
}

// === applyArchitectureDelta: Transform addiert serverless, Delta addiert weiteres ===
{
    const app = new ApplicationInstance(null, 'A');
    app.selectedComponents.add('compute');
    app.snapshotArchitecture();

    app.recordArchitectureChange('database_sql', 'add');
    app.applyArchitectureDelta((origC, origCfg) => {
        const c = new Set(origC);
        c.add('serverless');
        return { components: c, configs: { ...origCfg } };
    });
    check('applyDelta: Transform + Delta kombiniert',
        [...app.selectedComponents].sort(), ['compute', 'database_sql', 'serverless']);
}

// === Privacy: _archOriginal / _archDelta nicht von außen zugreifbar ===
{
    const app = new ApplicationInstance(null, 'A');
    app.snapshotArchitecture();
    check('Privacy: app._archOriginal undefined', app._archOriginal, undefined);
    check('Privacy: app._archDelta undefined', app._archDelta, undefined);
    check('Privacy: app.archOriginal undefined', app.archOriginal, undefined);
}

// === resetArchitecture ohne Snapshot ist no-op (kein Crash) ===
{
    const app = new ApplicationInstance(null, 'A');
    app.selectedComponents.add('compute');
    app.resetArchitecture(); // darf nichts tun
    check('resetArchitecture ohne Snapshot: components unverändert',
        [...app.selectedComponents], ['compute']);
}

// === applyArchitectureDelta ohne Snapshot erstellt implizit Snapshot ===
{
    const app = new ApplicationInstance(null, 'A');
    app.selectedComponents.add('compute');
    app.applyArchitectureDelta((origC, origCfg) => {
        const c = new Set(origC);
        c.add('cache');
        return { components: c, configs: { ...origCfg } };
    });
    check('applyDelta ohne Snapshot: hasSnapshot = true (implizit)',
        app.hasArchitectureSnapshot(), true);
    check('applyDelta ohne Snapshot: Transform applied',
        [...app.selectedComponents].sort(), ['cache', 'compute']);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
