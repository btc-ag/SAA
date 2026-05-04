#!/usr/bin/env node
/**
 * Smoke-Tests für die BSI C3A v1.0 + SOV-7 Compliance-Frameworks.
 */

import {
    C3A_CRITERIA, C3A_RESULTS, C3A_RESULT_SCORE,
    aggregateC3A, getCriteriaBySov,
    C3A_VERSION, C3A_PUBLISHED, C3A_SOURCE
} from '../js/modules/c3a-framework.js';

import {
    SOV7_CRITERIA, SOV7_RESULT_SCORE,
    aggregateSov7,
    SOV7_VERSION, SOV7_PUBLISHED
} from '../js/modules/sov7-compliance.js';

let pass = 0, fail = 0;
function check(name, actual, expected) {
    const ok = JSON.stringify(actual) === JSON.stringify(expected);
    if (ok) { console.log(`✓ ${name}`); pass++; }
    else    { console.log(`✗ ${name}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`); fail++; }
}
function checkTrue(name, value)  { check(name, value === true, true); }

// === C3A_CRITERIA ===
const criteriaKeys = Object.keys(C3A_CRITERIA);
check('C3A_CRITERIA hat 30 Einträge', criteriaKeys.length, 30);

// Pattern: SOV-1-01 .. SOV-6-XX
const patternRegex = /^SOV-[1-6]-\d{2}$/;
const allMatchPattern = criteriaKeys.every(k => patternRegex.test(k));
checkTrue('Alle C3A-Keys passen zu Pattern SOV-N-XX (N=1..6)', allMatchPattern);

// Erwartete Mindesteinträge je SOV
checkTrue('C3A_CRITERIA hat SOV-1-01', criteriaKeys.includes('SOV-1-01'));
checkTrue('C3A_CRITERIA hat SOV-1-02', criteriaKeys.includes('SOV-1-02'));
checkTrue('C3A_CRITERIA hat SOV-2-01', criteriaKeys.includes('SOV-2-01'));
checkTrue('C3A_CRITERIA hat SOV-3-01', criteriaKeys.includes('SOV-3-01'));
checkTrue('C3A_CRITERIA hat SOV-6-01', criteriaKeys.includes('SOV-6-01'));

// Jedes Kriterium muss sov, area, name, description haben
for (const key of criteriaKeys) {
    const c = C3A_CRITERIA[key];
    checkTrue(`${key}: hat sov-Bucket`, /^sov[1-6]$/.test(c.sov));
    checkTrue(`${key}: hat name`, typeof c.name === 'string' && c.name.length > 0);
    checkTrue(`${key}: hat description`, typeof c.description === 'string' && c.description.length > 0);
}

// === C3A_RESULTS ===
checkTrue('C3A_RESULTS.PASS existiert', C3A_RESULTS.PASS !== undefined);
checkTrue('C3A_RESULTS.PARTIAL existiert', C3A_RESULTS.PARTIAL !== undefined);
checkTrue('C3A_RESULTS.FAIL existiert', C3A_RESULTS.FAIL !== undefined);
checkTrue('C3A_RESULTS.UNKNOWN existiert', C3A_RESULTS.UNKNOWN !== undefined);
check('C3A_RESULTS.PASS.id === "pass"', C3A_RESULTS.PASS.id, 'pass');

// === C3A_RESULT_SCORE ===
check('C3A_RESULT_SCORE.pass = 100', C3A_RESULT_SCORE.pass, 100);
check('C3A_RESULT_SCORE.partial = 50', C3A_RESULT_SCORE.partial, 50);
check('C3A_RESULT_SCORE.fail = 0', C3A_RESULT_SCORE.fail, 0);
check('C3A_RESULT_SCORE.unknown = 0', C3A_RESULT_SCORE.unknown, 0);

// === aggregateC3A ===
check('aggregateC3A(null) = null', aggregateC3A(null, 'c1'), null);

// Empty assessment → alle SOV null, total 0
const emptyAgg = aggregateC3A({}, 'c1');
check('aggregateC3A({}) hat total 0', emptyAgg.total, 0);
check('aggregateC3A({}) hat sov1=null', emptyAgg.sov1, null);

// Perfect-pass-Assessment für c1
const perfect = {};
for (const key of criteriaKeys) perfect[key] = { result: 'pass' };

const perfectC1 = aggregateC3A(perfect, 'c1');
check('aggregateC3A(perfect, c1).total === 100', perfectC1.total, 100);
check('aggregateC3A(perfect, c1).sov1 === 100', perfectC1.sov1, 100);
check('aggregateC3A(perfect, c1).sov6 === 100', perfectC1.sov6, 100);

// Bei c2 ohne deVariant gibt's degradierte Werte
const perfectC2 = aggregateC3A(perfect, 'c2');
checkTrue('aggregateC3A(perfect, c2).total < 100 (Variant-Mismatch)', perfectC2.total < 100);

// === getCriteriaBySov ===
const sov1Crit = getCriteriaBySov('sov1');
checkTrue('getCriteriaBySov("sov1") liefert Array', Array.isArray(sov1Crit));
checkTrue('getCriteriaBySov("sov1") nicht leer', sov1Crit.length > 0);
checkTrue('getCriteriaBySov("sov1") alle haben id', sov1Crit.every(c => typeof c.id === 'string'));

const sov6Crit = getCriteriaBySov('sov6');
checkTrue('getCriteriaBySov("sov6") nicht leer', sov6Crit.length > 0);

const sovX = getCriteriaBySov('sovX_unknown');
check('getCriteriaBySov("sovX_unknown") = []', sovX, []);

// === Versionen ===
check('C3A_VERSION === "1.0"', C3A_VERSION, '1.0');
checkTrue('C3A_PUBLISHED ist String', typeof C3A_PUBLISHED === 'string');
checkTrue('C3A_SOURCE.url ist String', typeof C3A_SOURCE.url === 'string');
checkTrue('C3A_SOURCE.title ist String', typeof C3A_SOURCE.title === 'string');

// === SOV-7 ===
const sov7Keys = Object.keys(SOV7_CRITERIA);
check('SOV7_CRITERIA hat 10 Einträge', sov7Keys.length, 10);

for (const key of sov7Keys) {
    checkTrue(`${key}: hat name`, typeof SOV7_CRITERIA[key].name === 'string');
    checkTrue(`${key}: hat description`, typeof SOV7_CRITERIA[key].description === 'string');
}

check('SOV7_RESULT_SCORE.pass = 100', SOV7_RESULT_SCORE.pass, 100);
check('SOV7_RESULT_SCORE.fail = 0', SOV7_RESULT_SCORE.fail, 0);

check('aggregateSov7(null) = 0', aggregateSov7(null), 0);
check('aggregateSov7({}) = 0', aggregateSov7({}), 0);

const sov7Perfect = {};
for (const k of sov7Keys) sov7Perfect[k] = { result: 'pass' };
check('aggregateSov7(perfect) = 100', aggregateSov7(sov7Perfect), 100);

// Halbpass: alle 'partial' = 50
const sov7Half = {};
for (const k of sov7Keys) sov7Half[k] = { result: 'partial' };
check('aggregateSov7(allPartial) = 50', aggregateSov7(sov7Half), 50);

check('SOV7_VERSION === "1.0"', SOV7_VERSION, '1.0');
checkTrue('SOV7_PUBLISHED ist String', typeof SOV7_PUBLISHED === 'string');

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
