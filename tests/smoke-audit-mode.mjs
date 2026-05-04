#!/usr/bin/env node
/**
 * Smoke-Tests für audit-mode.js (BSI C3A C1 vs. C2).
 */

import { getAuditMode, setAuditMode } from '../js/modules/audit-mode.js';

let pass = 0, fail = 0;
function check(name, actual, expected) {
    const ok = JSON.stringify(actual) === JSON.stringify(expected);
    if (ok) { console.log(`✓ ${name}`); pass++; }
    else    { console.log(`✗ ${name}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`); fail++; }
}
function checkTrue(name, value)  { check(name, value === true, true); }

// Initial-Zustand: muss 'c1' oder 'c2' sein (defaults zu c1)
const initial = getAuditMode();
checkTrue('getAuditMode() initial in {c1, c2}', initial === 'c1' || initial === 'c2');

// Wenn nicht c1, erst auf c1 setzen für deterministischen Start
if (initial !== 'c1') setAuditMode('c1');
check('getAuditMode() nach c1-Setup', getAuditMode(), 'c1');

// Wechsel auf c2
const r1 = setAuditMode('c2');
check('setAuditMode("c2") liefert true bei Wechsel', r1, true);
check('getAuditMode() nach setAuditMode("c2")', getAuditMode(), 'c2');

// Erneut c2 setzen — keine Änderung
const r2 = setAuditMode('c2');
check('setAuditMode("c2") erneut = false (no-op)', r2, false);
check('getAuditMode() bleibt c2', getAuditMode(), 'c2');

// Zurück zu c1
const r3 = setAuditMode('c1');
check('setAuditMode("c1") liefert true bei Wechsel', r3, true);
check('getAuditMode() nach setAuditMode("c1")', getAuditMode(), 'c1');

// Ungültiger Wert wird wie 'c1' interpretiert (default-fallback)
// Aktuell ist Mode = c1; setAuditMode('invalid') wird zu 'c1' normalisiert
// → keine Änderung, return false
const r4 = setAuditMode('invalid');
check('setAuditMode("invalid") aus c1 = false (fallback to c1)', r4, false);
check('getAuditMode() bleibt c1 nach invalid', getAuditMode(), 'c1');

// Aus c2 auf invalid → fallback c1, also Wechsel
setAuditMode('c2');
const r5 = setAuditMode('invalid');
check('setAuditMode("invalid") aus c2 → fallback c1, return true', r5, true);
check('getAuditMode() c1 nach invalid-Fallback', getAuditMode(), 'c1');

// Cleanup
setAuditMode('c1');

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
