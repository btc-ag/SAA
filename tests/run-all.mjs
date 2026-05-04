#!/usr/bin/env node
/**
 * Sammel-Runner für alle Smoke-Tests.
 * Exit 0: alle grün. Exit ≥1: mind. ein Test fehlgeschlagen.
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const tests = [
    'smoke-modules.mjs',
    'smoke-saa-data.mjs',
    'smoke-c3a-sov7.mjs',
    'smoke-sovereignty.mjs',
    'smoke-audit-mode.mjs',
    'smoke-application-instance.mjs',
    'smoke-application-matcher.mjs',
    'smoke-sizing-detector.mjs',
    'smoke-deployment-pattern.mjs',
    'smoke-multi-app-parser.mjs',
    'smoke-pure-functions.mjs',
    'smoke-results-compute.mjs',
    'smoke-cloud-analyzer.mjs',
    'smoke-cloud-pricing.mjs',
    'smoke-analysis-branches.mjs',
    'smoke-portfolio-analyzer.mjs',
    'smoke-session-migration.mjs'
];

let totalFails = 0;
for (const t of tests) {
    console.log(`\n=== ${t} ===`);
    const code = await new Promise(res => {
        const p = spawn('node', [join(__dirname, t)], { stdio: 'inherit' });
        p.on('close', res);
    });
    if (code !== 0) totalFails++;
}

if (totalFails === 0) {
    console.log('\n✅ All smoke tests passed.');
    process.exit(0);
} else {
    console.log(`\n❌ ${totalFails} test suite(s) failed.`);
    process.exit(1);
}
