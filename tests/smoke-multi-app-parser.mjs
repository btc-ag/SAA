#!/usr/bin/env node
/**
 * Smoke-Tests für multi-app-parser.js — pure parser/lookup helpers.
 */

import {
    parseStorageSize,
    parseDBSize,
    extractHAConfig,
    formatVMTypeName,
    getDatabaseComponentId,
    levenshteinDistance,
    calculateSimilarity,
    getSizeLabel,
    parseStorageConfig,
    parseDatabaseConfig,
    parseApplicationList
} from '../js/modules/multi-app-parser.js';
import { ApplicationMatcher } from '../js/modules/application-matcher.js';
import { SizingDetector } from '../js/modules/sizing-detector.js';
import { knownApplications } from '../js/saa-apps-data.js';

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

// === parseStorageSize ===
check('parseStorageSize("500GB") = 500', parseStorageSize('500GB'), 500);
check('parseStorageSize("2TB") = 2048', parseStorageSize('2TB'), 2048);
check('parseStorageSize("1PB") = 1048576', parseStorageSize('1PB'), 1048576);
check('parseStorageSize("500") = 500', parseStorageSize('500'), 500);
check('parseStorageSize(undefined) = 500', parseStorageSize(undefined), 500);
check('parseStorageSize("") = 500', parseStorageSize(''), 500);
check('parseStorageSize("1.5TB") = 1536', parseStorageSize('1.5TB'), 1536);
check('parseStorageSize(null) = 500', parseStorageSize(null), 500);

// === parseDBSize ===
check('parseDBSize("100GB") = 100', parseDBSize('100GB'), 100);
check('parseDBSize("1TB") = 1024', parseDBSize('1TB'), 1024);
check('parseDBSize("1.5-2TB") = 2048 (Range → max)', parseDBSize('1.5-2TB'), 2048);
check('parseDBSize(undefined) = 100', parseDBSize(undefined), 100);
check('parseDBSize("") = 100', parseDBSize(''), 100);

// === extractHAConfig ===
check('extractHAConfig({nodes: 3})',
    extractHAConfig({ nodes: 3 }),
    { nodeCount: 3, haType: null, roles: {}, hasMultipleRoles: false });

check('extractHAConfig({nodes: "2-3"}) = max 3',
    extractHAConfig({ nodes: '2-3' }).nodeCount, 3);

check('extractHAConfig({brokers: 3, zookeeper: 3}): nodeCount = 6',
    extractHAConfig({ brokers: 3, zookeeper: 3 }).nodeCount, 6);

checkTrue('extractHAConfig({brokers: 3, zookeeper: 3}): hasMultipleRoles = true',
    extractHAConfig({ brokers: 3, zookeeper: 3 }).hasMultipleRoles);

check('extractHAConfig(null) = null', extractHAConfig(null), null);
check('extractHAConfig(undefined) = null', extractHAConfig(undefined), null);
check('extractHAConfig("not-an-object") = null', extractHAConfig('not-an-object'), null);

check('extractHAConfig({nodes: 5, type: "Replica Set"}): haType',
    extractHAConfig({ nodes: 5, type: 'Replica Set' }).haType, 'Replica Set');

// === formatVMTypeName ===
check('formatVMTypeName("webFrontend") = "WEB Frontend"',
    formatVMTypeName('webFrontend'), 'WEB Frontend');
check('formatVMTypeName("appTier") = "APP Tier"',
    formatVMTypeName('appTier'), 'APP Tier');
check('formatVMTypeName("dbServer") = "DB Server"',
    formatVMTypeName('dbServer'), 'DB Server');
check('formatVMTypeName("database") = "Database"',
    formatVMTypeName('database'), 'Database');

// === getDatabaseComponentId ===
check('getDatabaseComponentId("mongodb") = database_nosql',
    getDatabaseComponentId('mongodb'), 'database_nosql');
check('getDatabaseComponentId("postgresql") = database_sql',
    getDatabaseComponentId('postgresql'), 'database_sql');
check('getDatabaseComponentId("redis") = database_nosql',
    getDatabaseComponentId('redis'), 'database_nosql');
check('getDatabaseComponentId("mysql") = database_sql',
    getDatabaseComponentId('mysql'), 'database_sql');
check('getDatabaseComponentId("oracle") = database_sql',
    getDatabaseComponentId('oracle'), 'database_sql');
check('getDatabaseComponentId("cassandra") = database_nosql',
    getDatabaseComponentId('cassandra'), 'database_nosql');
check('getDatabaseComponentId("unknownXYZ") = null',
    getDatabaseComponentId('unknownXYZ'), null);
check('getDatabaseComponentId("hana") = database_sql',
    getDatabaseComponentId('hana'), 'database_sql');

// === levenshteinDistance ===
check('levenshtein("foo","bar") = 3', levenshteinDistance('foo', 'bar'), 3);
check('levenshtein("kitten","sitting") = 3', levenshteinDistance('kitten', 'sitting'), 3);
check('levenshtein("same","same") = 0', levenshteinDistance('same', 'same'), 0);
check('levenshtein("","abc") = 3', levenshteinDistance('', 'abc'), 3);
check('levenshtein("flaw","lawn") = 2', levenshteinDistance('flaw', 'lawn'), 2);

// === calculateSimilarity ===
check('calculateSimilarity("foo","foo") = 1', calculateSimilarity('foo', 'foo'), 1);
check('calculateSimilarity("","") = 1', calculateSimilarity('', ''), 1);
checkRange('calculateSimilarity("aws","azure")',
    calculateSimilarity('aws', 'azure'), 0, 1);
checkRange('calculateSimilarity("foo","")',
    calculateSimilarity('foo', ''), 0, 1);

// === getSizeLabel ===
check('getSizeLabel("small")', getSizeLabel('small'), 'Klein (1-100 User)');
check('getSizeLabel("medium")', getSizeLabel('medium'), 'Mittel (100-500 User)');
check('getSizeLabel("large")', getSizeLabel('large'), 'Groß (500+ User)');

// === parseStorageConfig (in-place mutation) ===
{
    const configs = {};
    const sysReq = { storage: { size: '2TB', type: 'SSD' } };
    parseStorageConfig(sysReq, configs, new Set(['storage_block', 'storage_object']));
    check('parseStorageConfig: storage_block.blockType = ssd',
        configs['storage_block']?.blockType, 'ssd');
    check('parseStorageConfig: storage_block.blockSize = 2048',
        configs['storage_block']?.blockSize, 2048);
    check('parseStorageConfig: storage_object.objectSize = 2048',
        configs['storage_object']?.objectSize, 2048);
}

{
    const configs = {};
    parseStorageConfig({}, configs, new Set(['storage_block']));
    check('parseStorageConfig ohne sysReq.storage: keine Änderung',
        Object.keys(configs).length, 0);
}

// === parseDatabaseConfig ===
{
    const configs = {};
    parseDatabaseConfig(
        { database: { type: 'PostgreSQL', size: '500GB' } },
        configs,
        new Set(['database_sql'])
    );
    check('parseDatabaseConfig: database_sql.dbType = PostgreSQL',
        configs['database_sql']?.dbType, 'PostgreSQL');
    check('parseDatabaseConfig: dbSize = 500',
        configs['database_sql']?.dbSize, 500);
}

{
    const configs = {};
    parseDatabaseConfig(
        { database: { type: 'MongoDB', size: '1TB' } },
        configs,
        new Set(['database_nosql'])
    );
    check('parseDatabaseConfig: database_nosql.nosqlType = MongoDB',
        configs['database_nosql']?.nosqlType, 'MongoDB');
    check('parseDatabaseConfig: nosqlSize = 1024',
        configs['database_nosql']?.nosqlSize, 1024);
}

// === parseApplicationList ===
{
    const matcher = new ApplicationMatcher(knownApplications);
    const sd = new SizingDetector();
    const initStub = () => {}; // no-op

    const apps = parseApplicationList('GitLab, Confluence', {
        appMatcher: matcher,
        sizingDetector: sd,
        knownApplications,
        initComponentConfigsFromSystemRequirements: initStub
    });
    check('parseApplicationList("GitLab, Confluence"): 2 Apps', apps.length, 2);
    checkTrue('parseAppList[0].instance ist ApplicationInstance',
        apps[0].instance.constructor.name === 'ApplicationInstance');
    check('parseAppList[0].userInput = "GitLab"', apps[0].userInput, 'GitLab');
    check('parseAppList[1].userInput = "Confluence"', apps[1].userInput, 'Confluence');
}

{
    const matcher = new ApplicationMatcher(knownApplications);
    const sd = new SizingDetector();
    const apps = parseApplicationList('UnknownXYZ', {
        appMatcher: matcher,
        sizingDetector: sd,
        knownApplications,
        initComponentConfigsFromSystemRequirements: () => {}
    });
    check('parseApplicationList("UnknownXYZ"): 1 App', apps.length, 1);
    check('parseApplicationList("UnknownXYZ"): selected = null',
        apps[0].selected, null);
}

{
    // Splitting via Komma, Semikolon, Tab, Newline
    const matcher = new ApplicationMatcher(knownApplications);
    const sd = new SizingDetector();
    const apps = parseApplicationList('A;B,C\tD\nE', {
        appMatcher: matcher,
        sizingDetector: sd,
        knownApplications,
        initComponentConfigsFromSystemRequirements: () => {}
    });
    check('parseApplicationList: 5 Apps via gemischtem Trenner', apps.length, 5);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
