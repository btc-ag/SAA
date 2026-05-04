#!/usr/bin/env node
/**
 * Smoke-Tests für SizingDetector — Keyword-basiertes Sizing.
 */

import { SizingDetector } from '../js/modules/sizing-detector.js';

let pass = 0, fail = 0;
function check(name, actual, expected) {
    const ok = JSON.stringify(actual) === JSON.stringify(expected);
    if (ok) { console.log(`✓ ${name}`); pass++; }
    else    { console.log(`✗ ${name}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`); fail++; }
}
function checkTrue(name, value)  { check(name, value === true, true); }
function checkRange(name, value, min, max) {
    const ok = typeof value === 'number' && value >= min && value <= max;
    if (ok) { console.log(`✓ ${name} (${value} in [${min},${max}])`); pass++; }
    else    { console.log(`✗ ${name}: ${value} not in [${min},${max}]`); fail++; }
}

const sd = new SizingDetector();

// === Large-Pattern ===
check('detectSizing("XL Enterprise") sizing', sd.detectSizing('XL Enterprise').sizing, 'large');
check('detectSizing("Großes Konzern-System") sizing', sd.detectSizing('Großes Konzern-System').sizing, 'large');
check('detectSizing("XXL System") sizing', sd.detectSizing('XXL System').sizing, 'large');
check('detectSizing("Huge data load") sizing', sd.detectSizing('Huge data load').sizing, 'large');

// === Medium-Pattern ===
check('detectSizing("Production system") sizing', sd.detectSizing('Production system').sizing, 'medium');
check('detectSizing("mittelgroße Anwendung") sizing', sd.detectSizing('mittelgroße Anwendung').sizing, 'medium');
check('detectSizing("Standard-System") sizing', sd.detectSizing('Standard-System').sizing, 'medium');
check('detectSizing("Produktion") sizing', sd.detectSizing('Produktion').sizing, 'medium');

// === Small-Pattern ===
check('detectSizing("Small dev environment") sizing', sd.detectSizing('Small dev environment').sizing, 'small');
check('detectSizing("PoC test") sizing', sd.detectSizing('PoC test').sizing, 'small');
check('detectSizing("Klein") sizing', sd.detectSizing('Klein').sizing, 'small');
check('detectSizing("Pilot-System") sizing', sd.detectSizing('Pilot-System').sizing, 'small');
check('detectSizing("Staging") sizing', sd.detectSizing('Staging').sizing, 'small');

// === Default-Verhalten ===
{
    const r = sd.detectSizing('xyz123 unbekannt');
    check('detectSizing("xyz123 unbekannt") sizing = medium', r.sizing, 'medium');
    check('detectSizing("xyz123 unbekannt") confidence niedrig', r.confidence, 0.3);
    check('detectSizing("xyz123 unbekannt") keyword = standard', r.keyword, 'standard');
}

// === Confidence-Bereich ===
{
    const r = sd.detectSizing('Production');
    checkRange('Production: confidence in [0,1]', r.confidence, 0, 1);
    check('Production: confidence = 0.8', r.confidence, 0.8);
    checkTrue('Production: keyword ist String', typeof r.keyword === 'string');
    checkTrue('Production: keyword nicht leer', r.keyword.length > 0);
}

// === Output-Shape ===
{
    const r = sd.detectSizing('beliebiger Text');
    checkTrue('Output hat sizing-Property', 'sizing' in r);
    checkTrue('Output hat confidence-Property', 'confidence' in r);
    checkTrue('Output hat keyword-Property', 'keyword' in r);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
