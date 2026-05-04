#!/usr/bin/env node
/**
 * Sovereignty-Smoke-Test: 10 Provider × 2 Audit-Modes gegen SCC v4.0.0.
 *
 * Erwartung: byte-identische Werte zum SCC-Schwesterprojekt.
 * Bei Abweichung: Sovereignty-Engine oder Provider-C3A-Daten aus dem Sync gelaufen.
 */

import { getC3AAdjustedControl } from '../js/modules/sovereignty-engine.js';
import { PROVIDER_C3A_DATA } from '../js/data/provider-c3a-data.js';

const expected = {
    'aws':           { c1: 36, c2: 36 },
    'azure':         { c1: 37, c2: 37 },
    'gcp':           { c1: 36, c2: 36 },
    'stackit':       { c1: 88, c2: 88 },
    'ionos':         { c1: 87, c2: 83 },
    'otc':           { c1: 74, c2: 69 },
    'aws-sovereign': { c1: 77, c2: 68 },
    'delos':         { c1: 76, c2: 76 },
    'openstack':     { c1: 87, c2: 74 },
    'sap-ci':        { c1: 81, c2: 77 }
};

let pass = 0, fail = 0;
for (const [id, exp] of Object.entries(expected)) {
    const data = PROVIDER_C3A_DATA[id];
    if (!data) { console.log(`✗ ${id}: no PROVIDER_C3A_DATA entry`); fail++; continue; }
    const provider = { id, c3a: data.c3a, sov7: data.sov7, control: 50 };
    const c1 = getC3AAdjustedControl(provider, 'c1');
    const c2 = getC3AAdjustedControl(provider, 'c2');
    if (c1 === exp.c1 && c2 === exp.c2) {
        console.log(`✓ ${id}: C1=${c1}, C2=${c2}`);
        pass++;
    } else {
        console.log(`✗ ${id}: got C1=${c1}/C2=${c2}, expected C1=${exp.c1}/C2=${exp.c2}`);
        fail++;
    }
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
