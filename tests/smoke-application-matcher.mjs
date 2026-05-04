#!/usr/bin/env node
/**
 * Smoke-Tests für ApplicationMatcher.
 */

import { ApplicationMatcher } from '../js/modules/application-matcher.js';
import { knownApplications } from '../js/saa-apps-data.js';

let pass = 0, fail = 0;
function check(name, actual, expected) {
    const ok = JSON.stringify(actual) === JSON.stringify(expected);
    if (ok) { console.log(`✓ ${name}`); pass++; }
    else    { console.log(`✗ ${name}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`); fail++; }
}
function checkTrue(name, value)  { check(name, value === true, true); }

// === Constructor + Index ===
const matcher = new ApplicationMatcher(knownApplications);
checkTrue('Constructor: index erzeugt', typeof matcher.index === 'object');
checkTrue('index.exact ist Object', typeof matcher.index.exact === 'object');
checkTrue('index.keywords ist Object', typeof matcher.index.keywords === 'object');
checkTrue('index.tokens ist Object', typeof matcher.index.tokens === 'object');

// === matchApplication: exakte Treffer / hohe Confidence ===
{
    const r = matcher.matchApplication('SAP S/4HANA');
    checkTrue('matchApplication("SAP S/4HANA"): mind. 1 Match', r.length >= 1);
    checkTrue('matchApplication("SAP S/4HANA"): confidence >= 0.5', r[0].confidence >= 0.5);
}

{
    const r = matcher.matchApplication('GitLab');
    checkTrue('matchApplication("GitLab"): mind. 1 Match', r.length >= 1);
    checkTrue('matchApplication("GitLab"): top-Match enthält "gitlab"', r[0].id.includes('gitlab'));
}

{
    const r = matcher.matchApplication('Confluence');
    checkTrue('matchApplication("Confluence"): mind. 1 Match', r.length >= 1);
    checkTrue('matchApplication("Confluence"): top = confluence', r[0].id === 'confluence');
}

{
    const r = matcher.matchApplication('SAP HANA');
    checkTrue('matchApplication("SAP HANA"): mind. 1 SAP-Match', r.length >= 1);
}

{
    const r = matcher.matchApplication('völlig unbekannte xyz123');
    check('matchApplication("völlig unbekannte xyz123"): keine Treffer', r.length, 0);
}

{
    // Edge case: leerer String — Fuzzy-Match liefert ggf. niedrig-confidence Treffer; max 3
    const r = matcher.matchApplication('');
    checkTrue('matchApplication(""): max 3 Ergebnisse', r.length <= 3);
    checkTrue('matchApplication(""): liefert Array', Array.isArray(r));
}

// === matchApplication liefert ≤ 3 Ergebnisse (Top-N gecappt) ===
{
    const r = matcher.matchApplication('SAP');
    checkTrue('matchApplication("SAP"): max 3 Ergebnisse', r.length <= 3);
}

// === normalize ===
check('normalize("Hello World!")', matcher.normalize('Hello World!'), 'hello world');
check('normalize("  Multi  Space  ")', matcher.normalize('  Multi  Space  '), 'multi space');
check('normalize("MIXED Case")', matcher.normalize('MIXED Case'), 'mixed case');
check('normalize("special@chars#here")', matcher.normalize('special@chars#here'), 'special chars here');

// === extractKeywords ===
{
    const kw = matcher.extractKeywords('Wir nutzen PostgreSQL', 'als Datenbank');
    checkTrue('extractKeywords: enthält "postgresql"', kw.includes('postgresql'));
}

{
    const kw = matcher.extractKeywords('No-keywords-here', '');
    checkTrue('extractKeywords ist Array', Array.isArray(kw));
}

// === stringSimilarity ===
check('stringSimilarity("saphana","saphana") = 1', matcher.stringSimilarity('saphana', 'saphana'), 1);
check('stringSimilarity("","") = 1', matcher.stringSimilarity('', ''), 1);
checkTrue('stringSimilarity("aws","gcp") < 0.5',
    matcher.stringSimilarity('aws', 'gcp') < 0.5);
checkTrue('stringSimilarity("foo","fooo") > 0.5',
    matcher.stringSimilarity('foo', 'fooo') > 0.5);

// === levenshtein (interne Implementierung der Klasse) ===
check('matcher.levenshtein("foo","bar") = 3', matcher.levenshtein('foo', 'bar'), 3);
check('matcher.levenshtein("","abc") = 3', matcher.levenshtein('', 'abc'), 3);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
